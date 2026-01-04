export interface PromptItem {
  text: string;
  weight: number;
}

export interface LoraAdapter {
  path: string;
  scale: number;
  merge_mode: string;
}

export interface PipelineLoadParams {
  height: number;
  width: number;
  seed: number;
  quantization: string | null;
  vace_enabled: boolean;
  vace_context_scale: number;
  lora_merge_mode: string;
  loras?: LoraAdapter[];
}

export interface PipelineStatus {
  status: "loading" | "loaded" | "error" | "idle";
  pipeline_id: string | null;
  load_params: PipelineLoadParams | null;
  loaded_lora_adapters: string[];
  error: string | null;
}

export interface ModelStatus {
  downloaded: boolean;
  progress: number | null;
}

export interface IceServer {
  urls: string[];
  username: string | null;
  credential: string | null;
}

export interface IceServersResponse {
  iceServers: IceServer[];
}

export interface InitialParameters {
  input_mode: "video" | "text";
  prompts: PromptItem[];
  prompt_interpolation_method: string;
  noise_scale: number;
  noise_controller: boolean;
  denoising_step_list: number[];
  manage_cache: boolean;
}

export interface WebRTCOfferRequest {
  sdp: string;
  type: "offer";
  initialParameters: InitialParameters;
}

export interface WebRTCOfferResponse {
  sdp: string;
  type: "answer";
  sessionId: string;
}

export interface IceCandidate {
  candidate: string;
  sdpMid: string | null;
  sdpMLineIndex: number | null;
}

export type ConnectionStatus =
  | "idle"
  | "checking-model"
  | "loading-pipeline"
  | "waiting-pipeline"
  | "getting-stream"
  | "connecting"
  | "connected"
  | "error";
