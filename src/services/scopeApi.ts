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

// VACE reference images config
const VACE_REFERENCE_PATH = "/images/vace_reference";
const VACE_REFERENCE_IMAGES = ["orb.png"];

export interface UploadedAsset {
  filename: string;
  path: string;
}

export interface AssetInfo {
  name: string;
  path: string;
  size_mb: number;
  folder: string | null;
  type: string;
  created_at: number;
}

// Store uploaded asset paths for later use
let uploadedAssetPaths: Record<string, string> = {};
const IS_RUNPOD = SCOPE_URL?.includes("runpod");

// LoRA path based on environment
const LORA_PATH = IS_RUNPOD
  ? "/workspace/models/lora/kxsr_WAN1-3B_cinematic_chase.safetensors"
  : "C:\\Users\\PC\\.daydream-scope\\models\\lora\\kxsr_WAN1-3B_cinematic_chase.safetensors";

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

  async uploadAsset(
    filename: string,
    arrayBuffer: ArrayBuffer
  ): Promise<UploadedAsset> {
    const encodedFilename = encodeURIComponent(filename);
    const res = await fetch(
      `${SCOPE_URL}/api/v1/assets?filename=${encodedFilename}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/octet-stream" },
        body: arrayBuffer,
      }
    );

    if (!res.ok) {
      throw new Error(`Upload failed for ${filename}: ${res.statusText}`);
    }

    const result = await res.json();
    return {
      filename,
      path: result.path,
    };
  },

  async getAssets(): Promise<AssetInfo[]> {
    const res = await fetch(`${SCOPE_URL}/api/v1/assets`);
    if (!res.ok) {
      throw new Error(`Failed to get assets: ${res.statusText}`);
    }
    const data = await res.json();
    return data.assets || [];
  },

  async uploadVaceReferenceImages(): Promise<UploadedAsset[]> {
    const uploadedAssets: UploadedAsset[] = [];
    console.log("📤 Uploading VACE reference images...");

    for (const filename of VACE_REFERENCE_IMAGES) {
      try {
        // Fetch image from public/
        const imageUrl = `${VACE_REFERENCE_PATH}/${filename}`;
        const response = await fetch(imageUrl);

        if (!response.ok) {
          console.warn(`⚠️ Could not fetch ${filename}: ${response.statusText}`);
          continue;
        }

        const arrayBuffer = await response.arrayBuffer();
        const asset = await this.uploadAsset(filename, arrayBuffer);
        uploadedAssets.push(asset);
        console.log(`✅ Uploaded ${filename} -> ${asset.path}`);
      } catch (error) {
        console.warn(`⚠️ Failed to upload ${filename}:`, error);
      }
    }

    // Fetch actual paths from API
    try {
      const assets = await this.getAssets();
      for (const asset of assets) {
        uploadedAssetPaths[asset.name] = asset.path;
        console.log(`📁 Asset path: ${asset.name} -> ${asset.path}`);
      }
    } catch (error) {
      console.warn("⚠️ Failed to fetch asset paths:", error);
    }

    console.log(
      `📤 Uploaded ${uploadedAssets.length}/${VACE_REFERENCE_IMAGES.length} VACE reference images`
    );
    return uploadedAssets;
  },

  getAssetPath(name: string): string | null {
    return uploadedAssetPaths[name] || null;
  },
};

// Base params without LoRA
export const DEFAULT_PIPELINE_PARAMS: PipelineLoadParams = {
  width: 640,
  height: 352,
  seed: 42,
  quantization: null,
  vace_enabled: true,
  vace_context_scale: 0.5,
  lora_merge_mode: "none",
};

// Params with LoRA (optional)
export const PIPELINE_PARAMS_WITH_LORA: PipelineLoadParams = {
  ...DEFAULT_PIPELINE_PARAMS,
  lora_merge_mode: "permanent_merge",
  loras: [
    {
      path: LORA_PATH,
      scale: 1,
      merge_mode: "permanent_merge",
    },
  ],
};
