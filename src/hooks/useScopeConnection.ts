import { useRef, useState, useCallback } from "react";
import {
  scopeApi,
  DEFAULT_PIPELINE_PARAMS,
  PIPELINE_PARAMS_WITH_LORA,
} from "../services/scopeApi";
import type {
  ConnectionStatus,
  IceCandidate,
  InitialParameters,
} from "../types/scope";

interface UseScopeConnectionOptions {
  pipelineId?: string;
  onTrack?: (stream: MediaStream) => void;
}

export function useScopeConnection(options: UseScopeConnectionOptions = {}) {
  const { pipelineId = "longlive", onTrack } = options;

  const [status, setStatus] = useState<ConnectionStatus>("idle");
  const [error, setError] = useState<string | null>(null);
  const pcRef = useRef<RTCPeerConnection | null>(null);
  const sessionIdRef = useRef<string | null>(null);
  const dataChannelRef = useRef<RTCDataChannel | null>(null);

  const connect = useCallback(
    async (
      inputStream: MediaStream,
      initialParams: Partial<InitialParameters>
    ) => {
      try {
        setError(null);
        setStatus("checking-model");

        // 1. Check model status
        const modelData = await scopeApi.getModelStatus(pipelineId);
        console.log("📦 Model status:", modelData);

        if (!modelData.downloaded) {
          throw new Error("Model not downloaded");
        }

        // 2. Load pipeline (try with LoRA first, fallback to without)
        setStatus("loading-pipeline");
        let usedLora = false;

        try {
          // Try with LoRA first
          console.log("🎨 Trying to load pipeline with LoRA...");
          await scopeApi.loadPipeline(pipelineId, PIPELINE_PARAMS_WITH_LORA);
          usedLora = true;
          console.log("✅ Pipeline loaded with LoRA");
        } catch (loraError) {
          // LoRA failed, try without it
          console.log("⚠️ LoRA not available, loading without it...", loraError);
          await scopeApi.loadPipeline(pipelineId, DEFAULT_PIPELINE_PARAMS);
          console.log("✅ Pipeline loaded without LoRA");
        }

        // 3. Wait for pipeline to be ready
        setStatus("waiting-pipeline");
        let pipelineReady = false;
        let retryCount = 0;
        const maxRetries = 60; // 60 seconds max wait

        while (!pipelineReady && retryCount < maxRetries) {
          const statusData = await scopeApi.getPipelineStatus();
          console.log("📊 Pipeline status:", statusData.status);

          if (statusData.status === "loaded") {
            pipelineReady = true;
            console.log(usedLora ? "🎨 Running with LoRA" : "🎬 Running without LoRA");
          } else if (statusData.status === "error") {
            // If error with LoRA, retry without it
            if (usedLora) {
              console.log("⚠️ Pipeline error with LoRA, retrying without...");
              await scopeApi.loadPipeline(pipelineId, DEFAULT_PIPELINE_PARAMS);
              usedLora = false;
              retryCount = 0; // Reset retry count for new attempt
            } else {
              throw new Error(statusData.error || "Pipeline error");
            }
          } else {
            await new Promise((r) => setTimeout(r, 1000));
            retryCount++;
          }
        }

        if (!pipelineReady) {
          throw new Error("Pipeline loading timeout");
        }

        // 4. Get ICE servers
        setStatus("getting-stream");
        const iceData = await scopeApi.getIceServers();
        console.log("🧊 ICE servers:", iceData);

        // 5. Create peer connection
        setStatus("connecting");
        const pc = new RTCPeerConnection({
          iceServers: iceData.iceServers.map((server) => ({
            urls: server.urls,
            username: server.username ?? undefined,
            credential: server.credential ?? undefined,
          })),
        });
        pcRef.current = pc;

        const candidates: IceCandidate[] = [];

        pc.onconnectionstatechange = () => {
          const state = pc.connectionState;
          console.log("🔌 Connection state:", state);

          switch (state) {
            case "connected":
              setStatus("connected");
              setError(null);
              console.log("✅ WebRTC connected successfully");
              break;
            case "connecting":
              console.log("⏳ WebRTC connecting...");
              break;
            case "failed":
              // Don't stop the process, WebRTC sometimes recovers
              console.log("⚠️ Connection failed, waiting for recovery...");
              break;
            case "disconnected":
              console.log("⚠️ Connection disconnected, may reconnect...");
              break;
            case "closed":
              console.log("🔒 Connection closed");
              break;
          }
        };

        pc.oniceconnectionstatechange = () => {
          const state = pc.iceConnectionState;
          console.log("🧊 ICE state:", state);

          // ICE connected can also indicate success
          if (state === "connected" || state === "completed") {
            console.log("✅ ICE connection established");
          }
        };

        pc.ontrack = (event) => {
          console.log("🎥 Track received", event.streams);
          if (event.streams[0] && onTrack) {
            onTrack(event.streams[0]);
          }
        };

        pc.onicecandidate = (event) => {
          if (event.candidate) {
            console.log("🎯 ICE candidate found:", event.candidate.candidate?.substring(0, 50) + "...");
            candidates.push({
              candidate: event.candidate.candidate,
              sdpMid: event.candidate.sdpMid,
              sdpMLineIndex: event.candidate.sdpMLineIndex,
            });
          } else {
            console.log("🎯 ICE candidate gathering complete (null candidate)");
          }
        };

        // 6. Add tracks
        inputStream.getTracks().forEach((track) => {
          pc.addTrack(track, inputStream);
          console.log("➕ Added track:", track.kind);
        });

        // 7. Create data channel
        const dataChannel = pc.createDataChannel("data");
        dataChannelRef.current = dataChannel;

        dataChannel.onopen = () => {
          console.log("📡 Data channel opened");
        };

        dataChannel.onclose = () => {
          console.log("📡 Data channel closed");
        };

        dataChannel.onerror = (error) => {
          console.error("📡 Data channel error:", error);
        };

        // 8. Create and send offer
        const offer = await pc.createOffer();
        await pc.setLocalDescription(offer);

        const fullParams: InitialParameters = {
          input_mode: "video",
          prompts: [{ text: "", weight: 100 }],
          prompt_interpolation_method: "linear",
          noise_scale: 0.7,
          noise_controller: true,
          denoising_step_list: [1000, 750],
          manage_cache: true,
          ...initialParams,
        };

        const answer = await scopeApi.sendOffer({
          sdp: offer.sdp!,
          type: "offer",
          initialParameters: fullParams,
        });

        console.log("📨 Answer:", answer);
        sessionIdRef.current = answer.sessionId;

        // 9. Set remote description
        await pc.setRemoteDescription({
          type: answer.type,
          sdp: answer.sdp,
        });

        // 10. Wait for ICE gathering and send candidates
        console.log("⏳ Waiting for ICE gathering... Current state:", pc.iceGatheringState);
        await new Promise<void>((resolve) => {
          if (pc.iceGatheringState === "complete") {
            resolve();
          } else {
            pc.onicegatheringstatechange = () => {
              console.log("🔄 ICE gathering state:", pc.iceGatheringState);
              if (pc.iceGatheringState === "complete") {
                resolve();
              }
            };
          }
        });

        console.log("📊 Total candidates collected:", candidates.length);
        if (candidates.length > 0) {
          console.log("📤 Sending", candidates.length, "candidates to server...");
          try {
            await scopeApi.sendIceCandidates(answer.sessionId, candidates);
            console.log("✅ Candidates sent successfully");
          } catch (e) {
            console.error("❌ Failed to send candidates:", e);
          }
        } else {
          console.warn("⚠️ No ICE candidates to send!");
        }

        console.log("🎬 WebRTC setup complete, waiting for connection...");
      } catch (err) {
        console.error("Connection error:", err);
        setStatus("error");
        setError(err instanceof Error ? err.message : "Unknown error");
      }
    },
    [pipelineId, onTrack]
  );

  const disconnect = useCallback(() => {
    if (pcRef.current) {
      pcRef.current.close();
      pcRef.current = null;
    }
    sessionIdRef.current = null;
    dataChannelRef.current = null;
    setStatus("idle");
    setError(null);
  }, []);

  const updatePrompt = useCallback((prompt: string, options?: { weight?: number; vaceScale?: number }) => {
    if (!dataChannelRef.current) {
      console.error("Data channel not available");
      return;
    }

    if (dataChannelRef.current.readyState !== "open") {
      console.error("Data channel not open");
      return;
    }

    const message: Record<string, unknown> = {
      prompts: [{ text: prompt, weight: options?.weight ?? 100 }],
    };

    if (options?.vaceScale !== undefined) {
      message.vace_context_scale = options.vaceScale;
    }

    dataChannelRef.current.send(JSON.stringify(message));
    console.log("📤 Sent update:", message);
  }, []);

  const replaceVideoTrack = useCallback((newStream: MediaStream) => {
    if (!pcRef.current) {
      console.error("Peer connection not available");
      return false;
    }

    const videoTrack = newStream.getVideoTracks()[0];
    if (!videoTrack) {
      console.error("No video track in new stream");
      return false;
    }

    const sender = pcRef.current.getSenders().find((s) => s.track?.kind === "video");
    if (!sender) {
      console.error("No video sender found");
      return false;
    }

    sender.replaceTrack(videoTrack);
    console.log("🔄 Replaced video track");
    return true;
  }, []);

  return {
    status,
    error,
    isConnected: status === "connected",
    connect,
    disconnect,
    updatePrompt,
    replaceVideoTrack,
  };
}
