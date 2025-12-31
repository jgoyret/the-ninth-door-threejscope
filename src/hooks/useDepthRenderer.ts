import { useEffect, useRef } from "react";
import { useThree, useFrame } from "@react-three/fiber";
import * as THREE from "three";

interface UseDepthRendererOptions {
  width: number;
  height: number;
}

// Shader para visualizar el depth buffer
const postVertexShader = `
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

const postFragmentShader = `
  varying vec2 vUv;
  uniform sampler2D tDepth;
  uniform float cameraNear;
  uniform float cameraFar;

  float readDepth(sampler2D depthSampler, vec2 coord) {
    float fragCoordZ = texture2D(depthSampler, coord).x;
    float viewZ = (cameraNear * cameraFar) / ((cameraFar - cameraNear) * fragCoordZ - cameraFar);
    return (viewZ + cameraNear) / (cameraNear - cameraFar);
  }

  void main() {
    float depth = readDepth(tDepth, vUv);
    gl_FragColor.rgb = 1.0 - vec3(depth);
    gl_FragColor.a = 1.0;
  }
`;

export function useDepthRenderer({ width, height }: UseDepthRendererOptions) {
  const { gl, scene, camera } = useThree();

  const renderTargetRef = useRef<THREE.WebGLRenderTarget | null>(null);
  const postSceneRef = useRef<THREE.Scene | null>(null);
  const postCameraRef = useRef<THREE.OrthographicCamera | null>(null);
  const postMaterialRef = useRef<THREE.ShaderMaterial | null>(null);
  const outputTargetRef = useRef<THREE.WebGLRenderTarget | null>(null);
  const canvas2DRef = useRef<HTMLCanvasElement | null>(null);
  const ctx2DRef = useRef<CanvasRenderingContext2D | null>(null);
  const pixelBufferRef = useRef<Uint8Array | null>(null);

  useEffect(() => {
    // Render target con DepthTexture
    const target = new THREE.WebGLRenderTarget(width, height);
    target.texture.minFilter = THREE.NearestFilter;
    target.texture.magFilter = THREE.NearestFilter;
    target.texture.generateMipmaps = false;
    target.depthTexture = new THREE.DepthTexture(width, height);
    target.depthTexture.format = THREE.DepthFormat;
    target.depthTexture.type = THREE.UnsignedShortType;
    renderTargetRef.current = target;

    // Render target para output del post-process
    outputTargetRef.current = new THREE.WebGLRenderTarget(width, height);

    // Post-process scene
    const postCamera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);
    postCameraRef.current = postCamera;

    const postMaterial = new THREE.ShaderMaterial({
      vertexShader: postVertexShader,
      fragmentShader: postFragmentShader,
      uniforms: {
        tDepth: { value: null },
        cameraNear: { value: 0.1 },
        cameraFar: { value: 1000 },
      },
    });
    postMaterialRef.current = postMaterial;

    const postScene = new THREE.Scene();
    const quad = new THREE.Mesh(new THREE.PlaneGeometry(2, 2), postMaterial);
    postScene.add(quad);
    postSceneRef.current = postScene;

    // Canvas 2D para output
    canvas2DRef.current = document.createElement("canvas");
    canvas2DRef.current.width = width;
    canvas2DRef.current.height = height;
    ctx2DRef.current = canvas2DRef.current.getContext("2d");

    pixelBufferRef.current = new Uint8Array(width * height * 4);

    return () => {
      target.dispose();
      target.depthTexture?.dispose();
      outputTargetRef.current?.dispose();
      postMaterial.dispose();
    };
  }, [width, height]);

  useFrame(() => {
    const renderTarget = renderTargetRef.current;
    const outputTarget = outputTargetRef.current;
    const postScene = postSceneRef.current;
    const postCamera = postCameraRef.current;
    const postMaterial = postMaterialRef.current;
    const ctx = ctx2DRef.current;
    const canvas2D = canvas2DRef.current;
    const pixelBuffer = pixelBufferRef.current;

    if (
      !renderTarget ||
      !outputTarget ||
      !postScene ||
      !postCamera ||
      !postMaterial ||
      !ctx ||
      !canvas2D ||
      !pixelBuffer
    ) {
      return;
    }

    // Obtener near/far de la cámara
    const cam = camera as THREE.PerspectiveCamera;
    postMaterial.uniforms.cameraNear.value = cam.near;
    postMaterial.uniforms.cameraFar.value = cam.far;

    const originalRenderTarget = gl.getRenderTarget();

    // Renderizar escena al target (captura depth automáticamente)
    gl.setRenderTarget(renderTarget);
    gl.render(scene, camera);

    // Renderizar depth visualizado al output target
    postMaterial.uniforms.tDepth.value = renderTarget.depthTexture;
    gl.setRenderTarget(outputTarget);
    gl.render(postScene, postCamera);

    // Leer pixels del output
    gl.readRenderTargetPixels(outputTarget, 0, 0, width, height, pixelBuffer);

    gl.setRenderTarget(originalRenderTarget);

    // Copiar a canvas 2D (flip Y)
    const imageData = ctx.createImageData(width, height);
    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        const srcIdx = ((height - 1 - y) * width + x) * 4;
        const dstIdx = (y * width + x) * 4;
        imageData.data[dstIdx] = pixelBuffer[srcIdx];
        imageData.data[dstIdx + 1] = pixelBuffer[srcIdx + 1];
        imageData.data[dstIdx + 2] = pixelBuffer[srcIdx + 2];
        imageData.data[dstIdx + 3] = 255;
      }
    }
    ctx.putImageData(imageData, 0, 0);
  });

  return {
    getCanvas: () => canvas2DRef.current,
  };
}
