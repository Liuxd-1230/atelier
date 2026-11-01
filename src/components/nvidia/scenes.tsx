import { useEffect, useRef } from "react";

/* --------------------------------------------------------------------------
   Two three.js scenes for the feature. Both build their world imperatively
   after a dynamic import of three (so the library never joins the main
   bundle), pause their render loop when off-screen, cap devicePixelRatio,
   and fall back to an intentional still composition under reduced motion.

   The card is modelled 1:1 from its published 267 × 111 mm body — it is an
   authored technical interpretation, labelled as such in the captions.
   -------------------------------------------------------------------------- */

const GREEN = "#76b900";

function prefersReducedMotion() {
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

/** Build the procedural card as a THREE.Group once three is loaded. */
type Three = typeof import("three");

function buildCard(THREE: Three) {
  const card = new THREE.Group();

  // Shroud — 267 × 111 mm at 1 unit = 100 mm, dual slot ≈ 40 mm thick.
  const shroudGeo = new THREE.BoxGeometry(2.67, 1.11, 0.4);
  const shroud = new THREE.Mesh(
    shroudGeo,
    new THREE.MeshStandardMaterial({ color: 0x141414, roughness: 0.42, metalness: 0.5 }),
  );
  card.add(shroud);

  // X-brace across the front face.
  const braceMat = new THREE.MeshStandardMaterial({
    color: 0x2a2a2a,
    roughness: 0.35,
    metalness: 0.7,
  });
  for (const sign of [1, -1]) {
    const brace = new THREE.Mesh(new THREE.BoxGeometry(1.9, 0.05, 0.03), braceMat);
    brace.rotation.z = sign * 0.42;
    brace.position.set(0, 0, 0.21);
    card.add(brace);
  }

  // Two fans — hub + pitched blades, rotating on the loop.
  const fans: import("three").Group[] = [];
  for (const x of [-0.68, 0.68]) {
    const fan = new THREE.Group();
    const hub = new THREE.Mesh(
      new THREE.CylinderGeometry(0.16, 0.16, 0.06, 28),
      new THREE.MeshStandardMaterial({ color: 0x0d0d0d, roughness: 0.3, metalness: 0.6 }),
    );
    hub.rotation.x = Math.PI / 2;
    fan.add(hub);
    const bladeGeo = new THREE.BoxGeometry(0.34, 0.1, 0.02);
    const bladeMat = new THREE.MeshStandardMaterial({
      color: 0x1b1b1b,
      roughness: 0.5,
      metalness: 0.4,
    });
    for (let b = 0; b < 9; b++) {
      const blade = new THREE.Mesh(bladeGeo, bladeMat);
      const holder = new THREE.Group();
      blade.position.x = 0.34;
      blade.rotation.z = 0.5;
      holder.rotation.z = (b / 9) * Math.PI * 2;
      holder.add(blade);
      fan.add(holder);
    }
    fan.position.set(x, 0, 0.2);
    card.add(fan);
    fans.push(fan);
  }

  // Top edge: green name strip (canvas texture).
  const stripCanvas = document.createElement("canvas");
  stripCanvas.width = 1024;
  stripCanvas.height = 64;
  const ctx = stripCanvas.getContext("2d");
  if (ctx) {
    ctx.fillStyle = "#0a0a0a";
    ctx.fillRect(0, 0, 1024, 64);
    ctx.fillStyle = GREEN;
    ctx.font = "bold 38px Inter, sans-serif";
    ctx.textBaseline = "middle";
    ctx.fillText("RTX PRO 6000", 24, 34);
  }
  const strip = new THREE.Mesh(
    new THREE.PlaneGeometry(2.4, 0.15),
    new THREE.MeshBasicMaterial({ map: new THREE.CanvasTexture(stripCanvas) }),
  );
  strip.rotation.x = -Math.PI / 2;
  strip.position.set(0.05, 0.558, 0);
  card.add(strip);

  // Back face: dark PCB hint with a green data-edge.
  const pcb = new THREE.Mesh(
    new THREE.PlaneGeometry(2.5, 1.0),
    new THREE.MeshStandardMaterial({ color: 0x0f1f12, roughness: 0.6, metalness: 0.2 }),
  );
  pcb.rotation.y = Math.PI;
  pcb.position.set(0, 0, -0.201);
  card.add(pcb);
  const pcbEdge = new THREE.Mesh(
    new THREE.PlaneGeometry(2.5, 0.03),
    new THREE.MeshBasicMaterial({ color: new THREE.Color(GREEN) }),
  );
  pcbEdge.rotation.y = Math.PI;
  pcbEdge.position.set(0, -0.48, -0.202);
  card.add(pcbEdge);

  // Gold PCIe fingers + silver bracket.
  const fingers = new THREE.Mesh(
    new THREE.BoxGeometry(0.72, 0.05, 0.12),
    new THREE.MeshStandardMaterial({ color: 0xc9a227, roughness: 0.3, metalness: 0.9 }),
  );
  fingers.position.set(0.82, -0.58, 0);
  card.add(fingers);
  const bracket = new THREE.Mesh(
    new THREE.BoxGeometry(0.03, 1.13, 0.42),
    new THREE.MeshStandardMaterial({ color: 0x9a9a9a, roughness: 0.35, metalness: 0.85 }),
  );
  bracket.position.set(-1.35, 0, 0);
  card.add(bracket);

  return { card, fans };
}

/** Shared scene bootstrap: renderer, camera, lights, IO pause, resize. */
function useThreeScene(
  mountRef: React.RefObject<HTMLDivElement | null>,
  build: (
    THREE: Three,
    scene: import("three").Scene,
    camera: import("three").PerspectiveCamera,
  ) => {
    update?: (t: number, dt: number) => void;
    onScroll?: (progress: number) => void;
  },
  { trackScroll = false }: { trackScroll?: boolean } = {},
) {
  const reduceRef = useRef(prefersReducedMotion());

  useEffect(() => {
    const mount = mountRef.current;
    if (!mount) return;

    let disposed = false;
    let cleanup: (() => void) | undefined;

    import("three").then((THREE_NS) => {
      if (disposed) return;
      const THREE = THREE_NS as unknown as Three;

      const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
      renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.75));
      renderer.setSize(mount.clientWidth, mount.clientHeight);
      mount.appendChild(renderer.domElement);
      renderer.domElement.style.display = "block";
      renderer.domElement.style.touchAction = "pan-y";

      const scene = new THREE.Scene();
      const camera = new THREE.PerspectiveCamera(
        34,
        mount.clientWidth / mount.clientHeight,
        0.1,
        100,
      );
      camera.position.set(0, 0.85, 3.55);
      camera.lookAt(0, 0, 0);

      scene.add(new THREE.AmbientLight(0xffffff, 0.55));
      const key = new THREE.DirectionalLight(0xffffff, 1.6);
      key.position.set(2.4, 3.2, 2.6);
      scene.add(key);
      const rim = new THREE.DirectionalLight(new THREE.Color(GREEN), 2.1);
      rim.position.set(-3, 1.4, -2.4);
      scene.add(rim);

      const handles = build(THREE, scene, camera);

      // Resize with the frame.
      const ro = new ResizeObserver(() => {
        const w = mount.clientWidth;
        const h = mount.clientHeight;
        if (w === 0 || h === 0) return;
        renderer.setSize(w, h);
        camera.aspect = w / h;
        camera.updateProjectionMatrix();
      });
      ro.observe(mount);

      // Pause the loop off-screen; render on demand otherwise.
      let visible = true;
      const io = new IntersectionObserver(([entry]) => {
        visible = entry.isIntersecting;
      });
      io.observe(mount);

      // Optional scroll linkage (rack assembly).
      let scrollProgress = reduceRef.current ? 1 : 0;
      let onScroll: ((p: number) => void) | undefined;
      if (trackScroll && handles.onScroll) {
        onScroll = handles.onScroll;
        const scroller = mount.closest(".page-enter");
        if (scroller) {
          const onScrollEvt = () => {
            const rect = mount.getBoundingClientRect();
            const view = window.innerHeight;
            const p = Math.min(1, Math.max(0, (view - rect.top) / (view + rect.height)));
            scrollProgress = reduceRef.current ? 1 : p;
          };
          onScrollEvt();
          scroller.addEventListener("scroll", onScrollEvt, { passive: true });
          cleanup = () => scroller.removeEventListener("scroll", onScrollEvt);
        }
      }

      const reduced = reduceRef.current;
      let raf = 0;
      let last = performance.now();
      const loop = (now: number) => {
        raf = requestAnimationFrame(loop);
        const dt = Math.min(0.05, (now - last) / 1000);
        last = now;
        if (!visible) return;
        handles.update?.(now / 1000, dt);
        onScroll?.(scrollProgress);
        renderer.render(scene, camera);
      };
      raf = requestAnimationFrame(loop);
      if (reduced && handles.update) handles.update(0, 0);
      // One immediate compose so the still frame exists before any loop tick.
      renderer.render(scene, camera);

      const realCleanup = cleanup;
      return () => {
        cancelAnimationFrame(raf);
        ro.disconnect();
        io.disconnect();
        realCleanup?.();
        renderer.dispose();
        mount.removeChild(renderer.domElement);
      };
    });

    return () => {
      disposed = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return { reduceRef };
}

/* --------------------------------------------------------------------------
   Scene 1 — the card, grabbable. Cover field.
   -------------------------------------------------------------------------- */

export function CardScene() {
  const mountRef = useRef<HTMLDivElement>(null);

  useThreeScene(mountRef, (THREE, scene) => {
    const { card, fans } = buildCard(THREE);
    scene.add(card);
    scene.add(new THREE.AmbientLight(0xffffff, 0));

    const reduced = prefersReducedMotion();
    let rotY = reduced ? -0.55 : 0.35;
    let rotX = reduced ? 0.22 : 0.12;
    let targetY = rotY;
    let targetX = rotX;
    let dragging = false;
    let lastX = 0;
    let lastY = 0;
    let idleAt = performance.now();

    const el = mountRef.current;
    const onDown = (e: PointerEvent) => {
      dragging = true;
      lastX = e.clientX;
      lastY = e.clientY;
      idleAt = performance.now();
      el?.setPointerCapture(e.pointerId);
      if (el) el.style.cursor = "grabbing";
    };
    const onMove = (e: PointerEvent) => {
      if (!dragging || !el) return;
      targetY += (e.clientX - lastX) * 0.011;
      targetX += (e.clientY - lastY) * 0.006;
      targetX = Math.max(-0.7, Math.min(0.7, targetX));
      lastX = e.clientX;
      lastY = e.clientY;
      idleAt = performance.now();
    };
    const onUp = () => {
      dragging = false;
      if (el) el.style.cursor = "grab";
    };
    el?.addEventListener("pointerdown", onDown);
    el?.addEventListener("pointermove", onMove);
    el?.addEventListener("pointerup", onUp);
    el?.addEventListener("pointercancel", onUp);
    if (el) el.style.cursor = reduced ? "default" : "grab";

    return {
      update: (t, dt) => {
        // Idle auto-rotate (disabled under reduced motion).
        if (!reduced && !dragging && performance.now() - idleAt > 2200) {
          targetY += dt * 0.28;
        }
        rotY += (targetY - rotY) * Math.min(1, dt * 7);
        rotX += (targetX - rotX) * Math.min(1, dt * 7);
        card.rotation.y = rotY;
        card.rotation.x = rotX;
        if (!reduced) {
          const spin = t * (dragging ? 5.2 : 2.4);
          for (const fan of fans) {
            for (let i = 1; i < fan.children.length; i++) {
              fan.children[i].rotation.z = spin;
            }
          }
        }
      },
    };
  });

  return (
    <div
      ref={mountRef}
      className="aspect-[16/9] w-full"
      role="img"
      aria-label="RTX PRO 6000 的三维模型，可拖动旋转"
    />
  );
}

/* --------------------------------------------------------------------------
   Scene 2 — eight Server Edition cards assembling into a node. Rack field.
   -------------------------------------------------------------------------- */

export function RackScene() {
  const mountRef = useRef<HTMLDivElement>(null);

  useThreeScene(
    mountRef,
    (THREE, scene, camera) => {
      scene.add(new THREE.AmbientLight(0xffffff, 0.35));
      const top = new THREE.DirectionalLight(0xffffff, 2.6);
      top.position.set(2, 4, 3);
      scene.add(top);
      const rim = new THREE.DirectionalLight(new THREE.Color(GREEN), 1.1);
      rim.position.set(-3, 2, -2);
      scene.add(rim);

      camera.position.set(0, 1.5, 5.3);
      camera.lookAt(0, 0.2, 0);

      const group = new THREE.Group();
      scene.add(group);

      const cardMat = new THREE.MeshStandardMaterial({
        color: 0x1a1a1a,
        roughness: 0.4,
        metalness: 0.55,
      });
      const sinkMat = new THREE.MeshStandardMaterial({
        color: 0xc9a227,
        roughness: 0.28,
        metalness: 0.95,
        emissive: 0x6b5510,
        emissiveIntensity: 0.35,
      });
      const edgeMat = new THREE.MeshStandardMaterial({
        color: new THREE.Color(GREEN),
        emissive: new THREE.Color(GREEN),
        emissiveIntensity: 0.55,
      });

      const slots: {
        mesh: import("three").Group;
        assembled: import("three").Vector3;
        exploded: import("three").Vector3;
      }[] = [];

      // Assembled: 2 rows × 4 inside the node; exploded: fanned upward like
      // the official assembly shot.
      for (let i = 0; i < 8; i++) {
        const g = new THREE.Group();
        const body = new THREE.Mesh(new THREE.BoxGeometry(0.86, 0.3, 0.16), cardMat);
        g.add(body);
        const sink = new THREE.Mesh(new THREE.BoxGeometry(0.8, 0.05, 0.12), sinkMat);
        sink.position.y = 0.17;
        g.add(sink);
        const edge = new THREE.Mesh(new THREE.BoxGeometry(0.86, 0.02, 0.02), edgeMat);
        edge.position.set(0, -0.16, 0.08);
        g.add(edge);

        const row = i < 4 ? 0 : 1;
        const col = i % 4;
        const assembled = new THREE.Vector3(
          (col - 1.5) * 0.98,
          row === 0 ? 0.34 : -0.26,
          row * 0.1,
        );
        const exploded = new THREE.Vector3(
          (col - 1.5) * 1.06 - row * 0.24,
          0.28 + (i % 4) * 0.34 + row * 0.1,
          row === 0 ? 0.2 : -0.2,
        );
        g.position.copy(assembled);
        group.add(g);
        slots.push({ mesh: g, assembled, exploded });
      }

      // Node chassis: a wireframe shell the cards live in.
      const chassis = new THREE.LineSegments(
        new THREE.EdgesGeometry(new THREE.BoxGeometry(4.3, 1.5, 1.15)),
        new THREE.LineBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.28 }),
      );
      chassis.position.y = 0.05;
      scene.add(chassis);

      const reduced = prefersReducedMotion();
      return {
        update: () => {
          group.rotation.y = reduced ? -0.32 : -0.32 + Math.sin(performance.now() / 5200) * 0.05;
        },
        onScroll: (p) => {
          const e = p < 0.35 ? 0 : (p - 0.35) / 0.5;
          const eased = e * e * (3 - 2 * e);
          for (const s of slots) {
            s.mesh.position.lerpVectors(s.assembled, s.exploded, eased);
          }
          chassis.visible = eased < 0.6;
        },
      };
    },
    { trackScroll: true },
  );

  return (
    <div
      ref={mountRef}
      className="aspect-[16/8] w-full border-2 border-white/25"
      role="img"
      aria-label="八张 RTX PRO 6000 Server Edition 卡装配进机架的三维演示，随滚动展开"
    />
  );
}
