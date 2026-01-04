import type {
  ModelStatus,
  PipelineStatus,
  PipelineLoadParams,
  IceServersResponse,
  WebRTCOfferRequest,
  WebRTCOfferResponse,
  IceCandidate,
} from "../types/scope";

const SCOPE_URL = import.meta.env.VITE_SCOPE_URL;

export const scopeApi = {
  async getModelStatus(pipelineId: string): Promise<ModelStatus> {
    const res = await fetch(
      `${SCOPE_URL}/api/v1/models/status?pipeline_id=${pipelineId}`
    );
    return res.json();
  },

  async loadPipeline(
    pipelineId: string,
    loadParams: PipelineLoadParams
  ): Promise<{ message: string }> {
    const res = await fetch(`${SCOPE_URL}/api/v1/pipeline/load`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        pipeline_id: pipelineId,
        load_params: loadParams,
      }),
    });
    return res.json();
  },

  async getPipelineStatus(): Promise<PipelineStatus> {
    const res = await fetch(`${SCOPE_URL}/api/v1/pipeline/status`);
    return res.json();
  },

  async getIceServers(): Promise<IceServersResponse> {
    const res = await fetch(`${SCOPE_URL}/api/v1/webrtc/ice-servers`);
    return res.json();
  },

  async sendOffer(request: WebRTCOfferRequest): Promise<WebRTCOfferResponse> {
    const res = await fetch(`${SCOPE_URL}/api/v1/webrtc/offer`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(request),
    });
    return res.json();
  },

  async sendIceCandidates(
    sessionId: string,
    candidates: IceCandidate[]
  ): Promise<void> {
    await fetch(`${SCOPE_URL}/api/v1/webrtc/offer/${sessionId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ candidates }),
    });
  },
};

export const DEFAULT_PIPELINE_PARAMS: PipelineLoadParams = {
  width: 640,
  height: 352,
  seed: 42,
  quantization: null,
  vace_enabled: true,
  vace_context_scale: 0.4,
  lora_merge_mode: "permanent_merge",
  loras: [
    {
      path: "/workspace/models/lora/kxsr_WAN1-3B_cinematic_chase.safetensors",
      scale: 1,
      merge_mode: "permanent_merge",
    },
  ],
};
