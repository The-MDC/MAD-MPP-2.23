"use client";

/**
 * MAD Gambit — the Paseome graph, WebGL half.
 * ------------------------------------------------------------------
 * Draws a PaseomeGraph (lib/paseome-graph.ts) with the three / react-three-fiber
 * / drei that are already installed. Everything it shows arrives in `graph`; it
 * holds no data of its own. The shell (paseome-graph.tsx) owns fetching, the
 * empty states, the tooltip and the details card, and is the only importer.
 *
 * Choices worth knowing:
 *   · Forward nodes are spheres, counterfactual nodes are faceted — shape, not
 *     just colour, tells the sides apart (the gilded skin's two accents are close).
 *   · Node size and edge weight encode PRICE; reach does too (pricier = nearer
 *     its root). No other dimension carries data.
 *   · Orbit and zoom are OFF until the viewer arms them. A canvas that eats the
 *     wheel and vertical swipes traps the page scroll on a long hub; picking
 *     (hover / tap) always works. While unarmed the canvas yields vertical pans.
 *   · prefers-reduced-motion: no idle spin, no damping, no camera tween, no ring
 *     spin, and the render loop is on-demand — a still frame redrawn only when
 *     something changes.
 *   · Labels are DOM (drei <Html>), not troika <Text>: troika fetches its default
 *     font from a CDN at runtime, which this app's CSP (`font-src 'self' data:`)
 *     would refuse.
 */
import React, { useEffect, useMemo, useRef } from "react";
import { Canvas, events as createPointerEvents, useFrame, useThree, type ThreeEvent } from "@react-three/fiber";
import { Html, Line, OrbitControls } from "@react-three/drei";
import * as THREE from "three";
import { INSTRUMENT_FONT } from "@/lib/gambit-design-tokens";
import { fitDistance, nodeColor, type GraphNode, type PaseomeGraph } from "@/lib/paseome-graph";
import type { Skin } from "@/lib/skins";

const FOV = 48;
/** The home viewing direction: front-on, a touch above. */
const HOME_DIR = new THREE.Vector3(0, 0.16, 1).normalize();

export interface HoverPoint {
  x: number;
  y: number;
  /** Touch has no hover — the shell shows the details card instead of a tooltip. */
  touch: boolean;
}

export interface PaseomeSceneProps {
  graph: PaseomeGraph;
  skin: Skin;
  focusId: string | null;
  hoverId: string | null;
  /** Orbit + zoom enabled. */
  armed: boolean;
  reduced: boolean;
  /** On screen and tab visible — otherwise the loop is stopped. */
  active: boolean;
  /** Bump to re-fit the camera. */
  resetKey: number;
  onHover: (id: string | null, at: HoverPoint | null) => void;
  onFocus: (id: string | null) => void;
  onLost: () => void;
}

/**
 * Pointer → ray, measured the way that survives CSS `zoom`.
 *
 * R3F's default reads `event.offsetX / size.width`. Inside the desktop phone frame
 * (components/device-frame.tsx scales its content with CSS `zoom`) offsetX is not in
 * the same units as the layout size, so a pointer over a node maps to the wrong ray and
 * hover / click miss. clientX and getBoundingClientRect() are in one space whatever the
 * zoom, so the ratio between them is exact.
 */
const zoomSafeEvents: typeof createPointerEvents = (store) => ({
  ...createPointerEvents(store),
  compute(event, state) {
    const box = state.gl.domElement.getBoundingClientRect();
    if (box.width === 0 || box.height === 0) return;
    state.pointer.set(((event.clientX - box.left) / box.width) * 2 - 1, -((event.clientY - box.top) / box.height) * 2 + 1);
    state.raycaster.setFromCamera(state.pointer, state.camera);
  },
});

/* ── Nodes ───────────────────────────────────────────────────────────── */

function NodeBody({
  node, skin, focused, hovered, dim, reduced, onHover, onFocus,
}: {
  node: GraphNode;
  skin: Skin;
  focused: boolean;
  hovered: boolean;
  dim: boolean;
  reduced: boolean;
  onHover: PaseomeSceneProps["onHover"];
  onFocus: PaseomeSceneProps["onFocus"];
}) {
  const color = nodeColor(node, skin);
  const glow = focused ? 0.95 : hovered ? 0.7 : node.kind === "hub" ? 0.8 : 0.38;
  const scale = focused ? 1.14 : hovered ? 1.07 : 1;
  const sharpest = node.rank === 1;
  const ringRef = useRef<THREE.Mesh>(null);
  const faceted = node.kind !== "hub" && node.side === "hindsight";

  // Only runs while the loop does (never under reduced motion, which is on-demand).
  useFrame((_, dt) => {
    if (ringRef.current && !reduced) ringRef.current.rotation.z += dt * 0.7;
  });

  const point = (e: ThreeEvent<PointerEvent>): HoverPoint => ({
    x: e.nativeEvent.clientX, y: e.nativeEvent.clientY, touch: e.nativeEvent.pointerType === "touch",
  });
  // Branch figures sit on the node. A root's name goes BELOW it and the hub's ABOVE:
  // branches fan out above and beside a root, so below is the clear side.
  const labelY = node.kind === "branch" ? 0 : node.kind === "root" ? -(node.radius + 0.55) : node.radius + 0.55;

  return (
    <group position={node.position} scale={scale}>
      <mesh
        onPointerOver={(e) => { e.stopPropagation(); onHover(node.id, point(e)); }}
        onPointerMove={(e) => { e.stopPropagation(); onHover(node.id, point(e)); }}
        onPointerOut={() => onHover(null, null)}
        onClick={(e) => {
          e.stopPropagation();
          if (e.delta > 4) return; // the end of an orbit drag, not a tap
          onFocus(focused ? null : node.id);
        }}
      >
        {faceted ? <icosahedronGeometry args={[node.radius, 1]} /> : <sphereGeometry args={[node.radius, 32, 24]} />}
        <meshStandardMaterial
          color={color} emissive={color} emissiveIntensity={glow}
          roughness={0.4} metalness={0.15} flatShading={faceted}
          transparent opacity={dim ? 0.4 : 1}
        />
      </mesh>

      {sharpest ? (
        <mesh ref={ringRef} rotation={[Math.PI / 2.3, 0, 0]} raycast={() => null}>
          <torusGeometry args={[node.radius * 1.5, 0.028, 8, 56]} />
          <meshBasicMaterial color={skin.gold} transparent opacity={dim ? 0.3 : 0.95} />
        </mesh>
      ) : null}
      {focused ? (
        <mesh raycast={() => null}>
          <sphereGeometry args={[node.radius * 1.32, 24, 16]} />
          <meshBasicMaterial color={skin.gold} wireframe transparent opacity={0.55} />
        </mesh>
      ) : null}

      <Html center position={[0, labelY, 0]} zIndexRange={[20, 0]} style={{ pointerEvents: "none" }}>
        <span
          aria-hidden="true"
          style={{
            display: "block", whiteSpace: "nowrap", fontFamily: INSTRUMENT_FONT, userSelect: "none",
            fontSize: node.kind === "branch" ? 11 : 9, fontWeight: 800,
            letterSpacing: node.kind === "branch" ? 0 : 0.6,
            textTransform: node.kind === "branch" ? "none" : "uppercase",
            color: node.kind === "branch" ? "#fff" : skin.text,
            textShadow: "0 0 5px rgba(0,0,0,.95), 0 1px 2px rgba(0,0,0,.95)",
            opacity: dim ? 0.45 : 1,
          }}
        >
          {node.label}
        </span>
      </Html>
    </group>
  );
}

function Edges({ graph, skin, focusId }: { graph: PaseomeGraph; skin: Skin; focusId: string | null }) {
  const byId = useMemo(() => new Map(graph.nodes.map((n) => [n.id, n])), [graph]);
  return (
    <>
      {graph.edges.map((e) => {
        const a = byId.get(e.from);
        const b = byId.get(e.to);
        if (!a || !b) return null;
        const lit = !focusId || e.from === focusId || e.to === focusId;
        return (
          <Line
            key={e.id}
            points={[a.position, b.position]}
            color={e.structural ? skin.muted : nodeColor(b, skin)}
            lineWidth={e.structural ? 1 : 1 + 4 * e.weight}
            transparent
            opacity={lit ? (e.structural ? 0.5 : 0.4 + 0.5 * e.weight) : 0.1}
            dashed={e.structural}
            dashSize={0.3}
            gapSize={0.2}
            raycast={() => null}
          />
        );
      })}
    </>
  );
}

/* ── Camera ──────────────────────────────────────────────────────────── */

type Controls = React.ComponentRef<typeof OrbitControls>;

/**
 * Fits the graph on first sight and on resize, and flies to a focused node.
 * Reduced motion jumps; otherwise the target and distance ease together.
 */
function CameraRig({
  graph, focusId, reduced, resetKey, controls,
}: {
  graph: PaseomeGraph;
  focusId: string | null;
  reduced: boolean;
  resetKey: number;
  controls: React.RefObject<Controls | null>;
}) {
  const camera = useThree((s) => s.camera) as THREE.PerspectiveCamera;
  const width = useThree((s) => s.size.width);
  const height = useThree((s) => s.size.height);
  const invalidate = useThree((s) => s.invalidate);

  const fit = useMemo(
    () => fitDistance(graph.extent, FOV, width / Math.max(1, height)),
    [graph.extent, width, height],
  );
  // `dir` is only set by Reset: it also puts the viewing angle back, not just the framing.
  const goal = useRef({ target: new THREE.Vector3(), dist: fit, moving: false, dir: null as THREE.Vector3 | null });
  const placed = useRef(false);
  const last = useRef({ focusId, fit, resetKey, reduced });

  useEffect(() => {
    const c = controls.current;
    if (!c) return;
    // On a desk page the graph is redrawn whenever someone trades. That must not throw
    // away the viewer's zoom and angle: act only on a real change of view, not of figures.
    const prev = last.current;
    const moved =
      prev.focusId !== focusId || prev.resetKey !== resetKey || prev.reduced !== reduced ||
      Math.abs(prev.fit - fit) > 0.03 * fit;
    const resetting = prev.resetKey !== resetKey;
    last.current = { focusId, fit, resetKey, reduced };
    if (placed.current && !moved) return;

    const node = focusId ? graph.nodes.find((n) => n.id === focusId) : undefined;
    const at = node ? node.position : graph.center;
    goal.current.target.set(at[0], at[1], at[2]);
    goal.current.dist = node ? Math.min(fit, Math.max(5.5, node.radius * 8)) : fit;
    goal.current.dir = resetting && !node ? HOME_DIR.clone() : null;

    if (!placed.current) {
      // First fit: slightly above, looking at the middle of the graph.
      placed.current = true;
      c.target.copy(goal.current.target);
      camera.position.copy(goal.current.target).addScaledVector(HOME_DIR, fit);
      c.update();
      invalidate();
      return;
    }
    if (reduced) {
      const dir = goal.current.dir ?? camera.position.clone().sub(c.target).normalize();
      c.target.copy(goal.current.target);
      camera.position.copy(goal.current.target).addScaledVector(dir, goal.current.dist);
      c.update();
      invalidate();
    } else {
      goal.current.moving = true;
    }
  }, [graph, focusId, fit, reduced, resetKey, camera, controls, invalidate]);

  useFrame((_, dt) => {
    const c = controls.current;
    const g = goal.current;
    if (!c || !g.moving) return;
    const k = 1 - Math.exp(-5 * Math.min(dt, 0.1));
    const dir = camera.position.clone().sub(c.target);
    const dist = dir.length() || g.dist;
    dir.normalize();
    if (g.dir) dir.lerp(g.dir, k).normalize();
    c.target.lerp(g.target, k);
    const next = dist + (g.dist - dist) * k;
    camera.position.copy(c.target).addScaledVector(dir, next);
    if (c.target.distanceTo(g.target) < 0.01 && Math.abs(next - g.dist) < 0.02 && (!g.dir || dir.distanceTo(g.dir) < 0.005)) g.moving = false;
  });

  return null;
}

/** Browsers take vertical pans while the viewer has not armed the canvas. */
function TouchPolicy({ armed }: { armed: boolean }) {
  const el = useThree((s) => s.gl.domElement);
  useEffect(() => {
    el.style.setProperty("touch-action", armed ? "none" : "pan-y");
  }, [el, armed]);
  return null;
}

/* ── Scene ───────────────────────────────────────────────────────────── */

export default function PaseomeScene({
  graph, skin, focusId, hoverId, armed, reduced, active, resetKey, onHover, onFocus, onLost,
}: PaseomeSceneProps) {
  const controls = useRef<Controls | null>(null);
  const fit = useMemo(() => fitDistance(graph.extent, FOV, 1.1), [graph.extent]);

  // Who stays lit when something is focused: it, and whatever it is wired to.
  const related = useMemo(() => {
    if (!focusId) return null;
    const set = new Set<string>([focusId]);
    for (const e of graph.edges) {
      if (e.from === focusId) set.add(e.to);
      if (e.to === focusId) set.add(e.from);
    }
    return set;
  }, [graph.edges, focusId]);

  const autoSpin = !reduced && !armed && !focusId && !hoverId;

  return (
    <Canvas
      frameloop={active ? (reduced ? "demand" : "always") : "never"}
      dpr={[1, 2]}
      camera={{ fov: FOV, near: 0.1, far: 300, position: [0, 3, 18] }}
      gl={{ antialias: true, alpha: true, powerPreference: "low-power" }}
      // On desktop the whole app sits in a phone frame that scales its content with CSS
      // `zoom` (components/device-frame.tsx). R3F's default measure is getBoundingClientRect,
      // which disagrees with layout size under zoom, so picking and Html labels drift.
      // offsetSize measures layout pixels instead.
      resize={{ scroll: true, debounce: { scroll: 50, resize: 0 }, offsetSize: true }}
      events={zoomSafeEvents}
      onPointerMissed={() => onFocus(null)}
      onCreated={({ gl }) => {
        gl.domElement.addEventListener("webglcontextlost", (e) => { e.preventDefault(); onLost(); });
      }}
    >
      <ambientLight intensity={0.75} />
      <directionalLight position={[6, 9, 7]} intensity={1.3} />
      <pointLight position={[0, 0, 0]} intensity={18} distance={14} color={skin.gold} />

      <Edges graph={graph} skin={skin} focusId={focusId} />
      {graph.nodes.map((n) => (
        <NodeBody
          key={n.id}
          node={n}
          skin={skin}
          focused={focusId === n.id}
          hovered={hoverId === n.id}
          dim={related !== null && !related.has(n.id)}
          reduced={reduced}
          onHover={onHover}
          onFocus={onFocus}
        />
      ))}

      <OrbitControls
        ref={controls}
        makeDefault
        enablePan={false}
        enableRotate={armed}
        enableZoom={armed}
        enableDamping={!reduced}
        dampingFactor={0.08}
        autoRotate={autoSpin}
        autoRotateSpeed={0.8}
        rotateSpeed={0.7}
        zoomSpeed={0.8}
        minDistance={4}
        maxDistance={fit * 1.8}
        minPolarAngle={0.25}
        maxPolarAngle={Math.PI - 0.25}
      />
      <TouchPolicy armed={armed} />
      <CameraRig graph={graph} focusId={focusId} reduced={reduced} resetKey={resetKey} controls={controls} />
    </Canvas>
  );
}
