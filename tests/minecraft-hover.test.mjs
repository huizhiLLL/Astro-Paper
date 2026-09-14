import assert from "node:assert/strict";
import test from "node:test";
import * as THREE from "three";
import {
  attachMinecraftHover,
  pickMinecraftBlock,
} from "../src/scripts/minecraft-hover.ts";

test("hover chooses the nearest block and misses empty space", () => {
  const target = z => ({
    object: new THREE.Object3D(),
    bounds: new THREE.Box3(
      new THREE.Vector3(-0.5, -0.5, z - 0.5),
      new THREE.Vector3(0.5, 0.5, z + 0.5)
    ),
  });
  const front = target(1),
    back = target(-1);
  assert.equal(
    pickMinecraftBlock(
      new THREE.Ray(new THREE.Vector3(0, 0, 5), new THREE.Vector3(0, 0, -1)),
      [back, front]
    ),
    front
  );
  assert.equal(
    pickMinecraftBlock(
      new THREE.Ray(new THREE.Vector3(2, 0, 5), new THREE.Vector3(0, 0, -1)),
      [front, back]
    ),
    undefined
  );
});

test("hover labels block roots, clears during dragging/leaving, follows theme, and disposes", () => {
  const previous = Object.fromEntries(
    ["document", "window", "MutationObserver", "getComputedStyle"].map(key => [
      key,
      Object.getOwnPropertyDescriptor(globalThis, key),
    ])
  );
  let observer,
    removed = false,
    color = "#282728";
  const tooltip = {
    hidden: true,
    style: {},
    textContent: "",
    offsetWidth: 90,
    offsetHeight: 26,
    setAttribute() {},
    remove() {
      removed = true;
    },
  };
  const canvas = new EventTarget();
  canvas.getBoundingClientRect = () => ({
    left: 0,
    top: 0,
    width: 320,
    height: 320,
  });
  const container = { clientWidth: 320, clientHeight: 320, appendChild() {} };
  let hover;
  const geometry = new THREE.BoxGeometry();
  const material = new THREE.MeshBasicMaterial();
  try {
    Object.defineProperty(globalThis, "document", {
      configurable: true,
      value: { documentElement: {}, createElement: () => tooltip },
    });
    Object.defineProperty(globalThis, "window", {
      configurable: true,
      value: new EventTarget(),
    });
    Object.defineProperty(globalThis, "getComputedStyle", {
      configurable: true,
      value: () => ({ getPropertyValue: () => color }),
    });
    Object.defineProperty(globalThis, "MutationObserver", {
      configurable: true,
      value: class {
        constructor(callback) {
          observer = { callback, disconnected: false };
        }
        observe() {}
        disconnect() {
          observer.disconnected = true;
        }
      },
    });
    const scene = new THREE.Scene();
    const blocks = new THREE.Group();
    const block = new THREE.Group();
    block.userData.id = "ae2:drive";
    block.add(new THREE.Mesh(geometry, material));
    blocks.add(block);
    scene.add(blocks);
    const camera = new THREE.PerspectiveCamera(45, 1, 0.1, 100);
    camera.position.set(0, 0, 5);
    camera.lookAt(0, 0, 0);
    hover = attachMinecraftHover(container, canvas, scene, camera, blocks, {
      "ae2:drive": "ME驱动器",
    });
    const pointer = (type, options = {}) => {
      const event = new Event(type);
      Object.assign(
        event,
        { clientX: 160, clientY: 160, pointerType: "mouse", buttons: 0 },
        options
      );
      canvas.dispatchEvent(event);
      hover.update();
    };
    pointer("pointermove");
    assert.equal(tooltip.hidden, false);
    assert.equal(tooltip.textContent, "ME驱动器");
    const outline = scene.children.find(
      child => child instanceof THREE.Box3Helper
    );
    assert(outline.visible);
    color = "#eaedf3";
    observer.callback();
    assert.equal(outline.material.color.getHexString(), "eaedf3");
    pointer("pointerdown", { buttons: 1 });
    assert(tooltip.hidden);
    assert(!outline.visible);
    pointer("pointermove", { buttons: 1 });
    assert(tooltip.hidden);
    pointer("pointerup");
    assert(!tooltip.hidden);
    pointer("pointerleave");
    assert(tooltip.hidden);
    pointer("pointermove", { pointerType: "touch" });
    assert(tooltip.hidden);
    pointer("pointermove", { clientX: 1, clientY: 1 });
    assert(tooltip.hidden);
    pointer("pointermove");
    assert(!tooltip.hidden);
    hover.dispose();
    assert(removed);
    assert(observer.disconnected);
    assert(!scene.children.includes(outline));
  } finally {
    geometry.dispose();
    material.dispose();
    for (const [key, descriptor] of Object.entries(previous)) {
      if (descriptor) Object.defineProperty(globalThis, key, descriptor);
      else delete globalThis[key];
    }
  }
});
