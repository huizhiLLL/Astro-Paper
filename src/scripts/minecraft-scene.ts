import * as THREE from "three";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";

type SceneData = {
  size: [number, number, number];
  blocks: Array<{ id: string; pos: [number, number, number] }>;
  resources?: Record<string, { textureUrl?: string }>;
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
  scene.background = new THREE.Color(0x101318);
  const camera = new THREE.PerspectiveCamera(45, 1, 0.1, 1000);
  const controls = new OrbitControls(camera, canvas);
  controls.enableDamping = true;
  scene.add(new THREE.HemisphereLight(0xffffff, 0x334455, 2));
  const group = new THREE.Group();
  scene.add(group);
  const loader = new THREE.TextureLoader();
  const materials = new Map<string, THREE.MeshStandardMaterial>();
  const resize = () => {
    const width = container.clientWidth || 640;
    const height = container.clientHeight || 360;
    renderer.setSize(width, height, false);
    camera.aspect = width / height;
    camera.updateProjectionMatrix();
  };
  const resizeObserver = new ResizeObserver(resize);
  resizeObserver.observe(container);
  resize();
  const max = Math.max(...data.size);
  const scale = 3 / max;
  const geometry = new THREE.BoxGeometry(scale, scale, scale);
  for (const block of data.blocks) {
    const resource = data.resources?.[block.id];
    let material = materials.get(block.id);
    if (!material) {
      const texture = resource?.textureUrl
        ? loader.load(resource.textureUrl)
        : undefined;
      if (texture) texture.magFilter = THREE.NearestFilter;
      material = new THREE.MeshStandardMaterial({
        color: texture ? 0xffffff : 0x78909c,
        map: texture,
      });
      materials.set(block.id, material);
    }
    const mesh = new THREE.Mesh(geometry, material);
    mesh.position.set(
      (block.pos[0] - data.size[0] / 2) * scale,
      (data.size[1] - block.pos[1] - 1 - data.size[1] / 2) * scale,
      (block.pos[2] - data.size[2] / 2) * scale
    );
    mesh.userData = { id: block.id, pos: block.pos };
    group.add(mesh);
  }
  camera.position.set(4, 3, 5);
  controls.target.set(0, 0, 0);
  controls.update();
  const dispose = () => {
    resizeObserver.disconnect();
    controls.dispose();
    geometry.dispose();
    for (const material of materials.values()) {
      material.map?.dispose();
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
    renderer.render(scene, camera);
    requestAnimationFrame(animate);
  };
  animate();
}
