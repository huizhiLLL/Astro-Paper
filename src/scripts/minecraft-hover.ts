import * as THREE from "three";

type HoverTarget = { object: THREE.Object3D; bounds: THREE.Box3 };

/** Select whole block volumes, including hollow frames, like a block selection box. */
export function pickMinecraftBlock(ray: THREE.Ray, targets: HoverTarget[]) {
  let selected: HoverTarget | undefined;
  let distance = Infinity;
  const point = new THREE.Vector3();
  for (const target of targets) {
    if (!ray.intersectBox(target.bounds, point)) continue;
    const candidate = ray.origin.distanceToSquared(point);
    if (candidate < distance) {
      selected = target;
      distance = candidate;
    }
  }
  return selected;
}

export function attachMinecraftHover(
  container: HTMLElement,
  canvas: HTMLCanvasElement,
  scene: THREE.Scene,
  camera: THREE.Camera,
  blocks: THREE.Group,
  names: Record<string, string> = {}
) {
  blocks.updateWorldMatrix(true, true);
  const targets = blocks.children.map(object => ({
    object,
    bounds: new THREE.Box3().setFromObject(object),
  }));
  const outline = new THREE.Box3Helper(new THREE.Box3());
  const lineMaterial = outline.material as THREE.LineBasicMaterial;
  lineMaterial.depthTest = false;
  lineMaterial.depthWrite = false;
  lineMaterial.toneMapped = false;
  outline.renderOrder = 1;
  outline.visible = false;
  scene.add(outline);
  const tooltip = document.createElement("div");
  tooltip.className = "mc-scene-tooltip";
  tooltip.setAttribute("role", "tooltip");
  tooltip.hidden = true;
  container.appendChild(tooltip);
  const updateTheme = () => {
    lineMaterial.color.set(
      getComputedStyle(container).getPropertyValue("--foreground").trim()
    );
  };
  updateTheme();
  const themeObserver = new MutationObserver(updateTheme);
  themeObserver.observe(document.documentElement, {
    attributes: true,
    attributeFilter: ["data-theme"],
  });
  let pointer: { x: number; y: number } | undefined;
  const raycaster = new THREE.Raycaster();
  const ndc = new THREE.Vector2();
  const clear = () => {
    pointer = undefined;
    outline.visible = false;
    tooltip.hidden = true;
  };
  const move = (event: PointerEvent) => {
    if (event.pointerType === "touch" || event.buttons !== 0) {
      clear();
      return;
    }
    pointer = { x: event.clientX, y: event.clientY };
  };
  canvas.addEventListener("pointermove", move);
  canvas.addEventListener("pointerup", move);
  canvas.addEventListener("pointerdown", clear);
  canvas.addEventListener("pointerleave", clear);
  canvas.addEventListener("pointercancel", clear);
  window.addEventListener("blur", clear);

  return {
    update() {
      if (!pointer) return;
      const rect = canvas.getBoundingClientRect();
      const x = pointer.x - rect.left;
      const y = pointer.y - rect.top;
      if (
        rect.width <= 0 ||
        rect.height <= 0 ||
        x < 0 ||
        y < 0 ||
        x > rect.width ||
        y > rect.height
      ) {
        clear();
        return;
      }
      ndc.set((x / rect.width) * 2 - 1, 1 - (y / rect.height) * 2);
      camera.updateWorldMatrix(true, false);
      raycaster.setFromCamera(ndc, camera);
      const selected = pickMinecraftBlock(raycaster.ray, targets);
      outline.visible = !!selected;
      tooltip.hidden = !selected;
      if (!selected) return;
      outline.box.copy(selected.bounds).expandByScalar(0.005);
      const id = selected.object.userData.id as string;
      const label = names[id] ?? id;
      if (tooltip.textContent !== label) tooltip.textContent = label;
      // CSS and canvas sizes can differ when the article is scaled.
      const localX = (x / rect.width) * container.clientWidth;
      const localY = (y / rect.height) * container.clientHeight;
      tooltip.style.left = `${Math.max(8, Math.min(localX + 14, container.clientWidth - tooltip.offsetWidth - 8))}px`;
      tooltip.style.top = `${Math.max(8, Math.min(localY + 14, container.clientHeight - tooltip.offsetHeight - 8))}px`;
    },
    dispose() {
      canvas.removeEventListener("pointermove", move);
      canvas.removeEventListener("pointerup", move);
      canvas.removeEventListener("pointerdown", clear);
      canvas.removeEventListener("pointerleave", clear);
      canvas.removeEventListener("pointercancel", clear);
      window.removeEventListener("blur", clear);
      themeObserver.disconnect();
      tooltip.remove();
      scene.remove(outline);
      outline.geometry.dispose();
      lineMaterial.dispose();
    },
  };
}
