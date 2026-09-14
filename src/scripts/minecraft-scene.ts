import * as THREE from "three";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";
import { createMinecraftModel } from "./minecraft-model";
import { attachMinecraftHover } from "./minecraft-hover";
import type { BlockModel } from "../utils/mc/appearance";

type SceneData = {
  size: [number, number, number];
  blocks: Array<{ id: string; pos: [number, number, number]; model?: string }>;
  resources?: Record<string, { textureUrl?: string }>;
  models?: Record<string, BlockModel>;
  names?: Record<string, string>;
};

export function mountMinecraftScene(container: HTMLElement, data: SceneData) {
  const canvas = document.createElement("canvas");
  canvas.className = "mc-scene-three";
  container.appendChild(canvas);
  const renderer = new THREE.WebGLRenderer({
    canvas,
    antialias: true,
    alpha: true,
  });
  renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
  const scene = new THREE.Scene();
  // Let the container's theme background show through the transparent canvas.
  renderer.setClearColor(0x000000, 0);
  const camera = new THREE.PerspectiveCamera(45, 1, 0.1, 1000);
  const controls = new OrbitControls(camera, canvas);
  controls.enableDamping = true;
  controls.maxPolarAngle = Math.PI / 2;
  scene.add(new THREE.HemisphereLight(0xffffff, 0x667788, 1.5));
  const keyLight = new THREE.DirectionalLight(0xffffff, 2.5);
  keyLight.position.set(-3, 7, -5);
  scene.add(keyLight);
  const group = new THREE.Group();
  scene.add(group);
  const loader = new THREE.TextureLoader();
  const materials = new Map<string, THREE.MeshStandardMaterial>();
  const textures = new Map<string, THREE.Texture>();
  const models = new Map<string, THREE.Group>();
  const anisotropy = Math.min(renderer.capabilities.getMaxAnisotropy(), 8);
  const max = Math.max(...data.size);
  const scale = 3 / max;
  const geometry = new THREE.BoxGeometry(1, 1, 1);
  const loadTexture = (url: string) => {
    const cached = textures.get(url);
    if (cached) return cached;
    const texture = loader.load(url, loaded => {
      // Expand pixel art without interpolation first. Linear filtering then
      // softens only 1/8 of a source texel, while retaining anisotropic filtering.
      const image = loaded.image as HTMLImageElement;
      if (image.width > 64 || image.height > 64) return;
      const pixels = document.createElement("canvas");
      pixels.width = image.width * 8;
      pixels.height = image.height * 8;
      const context = pixels.getContext("2d");
      if (!context) {
        loaded.magFilter = THREE.NearestFilter;
        loaded.anisotropy = 1;
        return;
      }
      context.imageSmoothingEnabled = false;
      context.drawImage(image, 0, 0, pixels.width, pixels.height);
      const pixelTexture: THREE.Texture<HTMLImageElement | HTMLCanvasElement> =
        loaded;
      pixelTexture.image = pixels;
      loaded.needsUpdate = true;
    });
    texture.colorSpace = THREE.SRGBColorSpace;
    texture.magFilter = THREE.LinearFilter;
    texture.minFilter = THREE.LinearMipmapLinearFilter;
    texture.anisotropy = anisotropy;
    textures.set(url, texture);
    return texture;
  };
  const getMaterial = (
    textureUrl?: string,
    emissiveUrl?: string,
    cutout = false
  ) => {
    const key = JSON.stringify([textureUrl, emissiveUrl, cutout]);
    let material = materials.get(key);
    if (!material) {
      const texture = textureUrl ? loadTexture(textureUrl) : undefined;
      material = new THREE.MeshStandardMaterial({
        color: texture ? 0xffffff : 0x78909c,
        map: texture,
        emissive: emissiveUrl ? 0xffffff : 0x000000,
        emissiveMap: emissiveUrl ? loadTexture(emissiveUrl) : undefined,
        alphaTest: cutout ? 0.5 : 0,
        alphaToCoverage: cutout,
        side: cutout ? THREE.DoubleSide : THREE.FrontSide,
      });
      materials.set(key, material);
    }
    return material;
  };
  for (const block of data.blocks) {
    let mesh: THREE.Object3D;
    const model = block.model && data.models?.[block.model];
    if (model && block.model) {
      let template = models.get(block.model);
      if (!template) {
        template = createMinecraftModel(model, face =>
          getMaterial(face.textureUrl, face.emissiveUrl, face.cutout)
        );
        models.set(block.model, template);
      }
      mesh = template.clone();
    } else {
      mesh = new THREE.Mesh(
        geometry,
        getMaterial(data.resources?.[block.id]?.textureUrl)
      );
    }
    mesh.scale.setScalar(scale);
    mesh.position.set(
      (block.pos[0] + 0.5 - data.size[0] / 2) * scale,
      (block.pos[1] + 0.5 - data.size[1] / 2) * scale,
      (block.pos[2] + 0.5 - data.size[2] / 2) * scale
    );
    mesh.userData = { id: block.id, pos: block.pos };
    group.add(mesh);
  }
  const bounds = new THREE.Box3().setFromObject(group);
  const sphere = bounds.getBoundingSphere(new THREE.Sphere());
  controls.target.copy(sphere.center);
  // Look toward +Z from above, with Minecraft's +Y pointing up.
  camera.position.copy(sphere.center).add(new THREE.Vector3(4, 3, -6));
  let fitDistance = 0;
  const resize = () => {
    const width = container.clientWidth || 640;
    const height = container.clientHeight || 360;
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    renderer.setSize(width, height, false);
    camera.aspect = width / height;
    const verticalFov = THREE.MathUtils.degToRad(camera.fov);
    const horizontalFov =
      2 * Math.atan(Math.tan(verticalFov / 2) * camera.aspect);
    const distance =
      (sphere.radius * 1.15) /
      Math.sin(Math.min(verticalFov, horizontalFov) / 2);
    // Keep the user's orbit and relative zoom when the article width changes.
    const offset = camera.position.clone().sub(controls.target);
    offset.setLength(
      fitDistance ? offset.length() * (distance / fitDistance) : distance
    );
    camera.position.copy(controls.target).add(offset);
    fitDistance = distance;
    controls.minDistance = sphere.radius * 1.2;
    controls.maxDistance = distance * 4;
    camera.near = Math.max(sphere.radius / 100, 0.01);
    camera.far = controls.maxDistance + sphere.radius * 2;
    camera.updateProjectionMatrix();
    controls.update();
  };
  const resizeObserver = new ResizeObserver(resize);
  resizeObserver.observe(container);
  resize();
  controls.update();
  const hover = attachMinecraftHover(
    container,
    canvas,
    scene,
    camera,
    group,
    data.names
  );
  const dispose = () => {
    hover.dispose();
    resizeObserver.disconnect();
    controls.dispose();
    geometry.dispose();
    for (const model of models.values()) {
      model.traverse(object => {
        if (object instanceof THREE.Mesh) object.geometry.dispose();
      });
    }
    for (const texture of textures.values()) texture.dispose();
    for (const material of materials.values()) {
      material.dispose();
    }
    renderer.dispose();
  };
  const animate = () => {
    if (!canvas.isConnected) {
      dispose();
      return;
    }
    controls.update();
    hover.update();
    renderer.render(scene, camera);
    requestAnimationFrame(animate);
  };
  animate();
}
