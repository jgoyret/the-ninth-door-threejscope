import { useRef, useState, useCallback } from "react";
import { scopeApi, DEFAULT_PIPELINE_PARAMS } from "../services/scopeApi";
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

        // 2. Load pipeline
        setStatus("loading-pipeline");
        const loadData = await scopeApi.loadPipeline(
          pipelineId,
          DEFAULT_PIPELINE_PARAMS
        );
        console.log("🚀 Pipeline load:", loadData);

        // 3. Wait for pipeline to be ready
        setStatus("waiting-pipeline");
        let pipelineReady = false;
        while (!pipelineReady) {
          const statusData = await scopeApi.getPipelineStatus();
          console.log("📊 Pipeline status:", statusData.status);

          if (statusData.status === "loaded") {
            pipelineReady = true;
          } else if (statusData.status === "error") {
            throw new Error(statusData.error || "Pipeline error");
          } else {
            await new Promise((r) => setTimeout(r, 1000));
          }
        }

        // 4. Get ICE servers
        setStatus("getting-stream");
        const iceData = await scopeApi.getIceServers();
        console.log("🧊 ICE servers:", iceData);

        // 5. Create peer connection
        setStatus("connecting");
        const pc = new RTCPeerConnection({
          iceServers: iceData.iceServers,
        });
        pcRef.current = pc;

        const candidates: IceCandidate[] = [];

        pc.onconnectionstatechange = () => {
          console.log("🔌 Connection state:", pc.connectionState);
          if (pc.connectionState === "connected") {
            setStatus("connected");
          } else if (pc.connectionState === "failed") {
            setStatus("error");
            setError("Connection failed");
          }
        };

        pc.oniceconnectionstatechange = () => {
          console.log("🧊 ICE connection state:", pc.iceConnectionState);
        };

        pc.ontrack = (event) => {
          console.log("🎥 Track received", event.streams);
          if (event.streams[0] && onTrack) {
            onTrack(event.streams[0]);
          }
        };

        pc.onicecandidate = (event) => {
          if (event.candidate) {
            candidates.push({
              candidate: event.candidate.candidate,
              sdpMid: event.candidate.sdpMid,
              sdpMLineIndex: event.candidate.sdpMLineIndex,
            });
          }
        };

        // 6. Add tracks
        inputStream.getTracks().forEach((track) => {
          pc.addTrack(track, inputStream);
          console.log("➕ Added track:", track.kind);
        });

        // 7. Create data channel
        pc.createDataChannel("data");

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
        await new Promise<void>((resolve) => {
          if (pc.iceGatheringState === "complete") {
            resolve();
          } else {
            pc.onicegatheringstatechange = () => {
              if (pc.iceGatheringState === "complete") {
                resolve();
              }
            };
          }
        });

        if (candidates.length > 0) {
          console.log("📤 Sending", candidates.length, "candidates");
          await scopeApi.sendIceCandidates(answer.sessionId, candidates);
        }

        console.log("✅ WebRTC connected");
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
    setStatus("idle");
    setError(null);
  }, []);

  return {
    status,
    error,
    isConnected: status === "connected",
    connect,
    disconnect,
  };
}
