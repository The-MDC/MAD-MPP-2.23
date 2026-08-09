"use client";

/**
 * MAD Gambit — DottedGlowBackground (Ultra Max Fidelity 3D)
 * ------------------------------------------------------------------
 * Full WebGL React-Three-Fiber particle system. A slowly rotating,
 * depth-sorted field of glowing nodes for the premium
 * Cyberpunk/Fintech aesthetic.
 *
 * All visual parameters are independently customizable via props
 * (design law: no fused/hardcoded instruments). Defaults reproduce
 * the original hardcoded look exactly.
 *
 *  - gap        → particle density (larger gap = fewer particles)
 *  - radius     → particle size
 *  - color      → base backdrop tint (radial gradient center)
 *  - glowColor  → particle glow color
 *  - speedMin   → x-axis rotation speed
 *  - speedMax   → y-axis rotation speed
 *  - speedScale → global multiplier on both rotation speeds
 */

import React, { useRef, useMemo } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { Points, PointMaterial } from "@react-three/drei";
import * as THREE from "three";

interface ParticleFieldProps {
  count?: number;
  glowColor?: string;
  size?: number;
  speedMin?: number;
  speedMax?: number;
  speedScale?: number;
}

// Pre-compute a spherical distribution of particles
function ParticleField({
  count = 4000,
  glowColor = "#7cffc7",
  size = 0.15,
  speedMin = 0.4,
  speedMax = 1.0,
  speedScale = 1.0,
}: ParticleFieldProps) {
  const points = useRef<THREE.Points>(null);

  // Generate random points in a sphere
  const positions = useMemo(() => {
    const pos = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      const theta = 2 * Math.PI * Math.random();
      const phi = Math.acos(2 * Math.random() - 1);
      const r = 20 + Math.random() * 30; // Radius range

      pos[i * 3] = r * Math.sin(phi) * Math.cos(theta);     // x
      pos[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta); // y
      pos[i * 3 + 2] = r * Math.cos(phi);                   // z
    }
    return pos;
  }, [count]);

  // Ambient rotation — intensity driven by speed props (e.g. chaosMeter)
  useFrame((_state, delta) => {
    if (points.current) {
      points.current.rotation.y -= delta * 0.05 * speedMax * speedScale;
      points.current.rotation.x -= delta * 0.05 * speedMin * speedScale;
    }
  });

  return (
    <Points ref={points} positions={positions} stride={3} frustumCulled={false}>
      <PointMaterial
        transparent
        color={glowColor}
        size={size}
        sizeAttenuation={true}
        depthWrite={false}
        blending={THREE.AdditiveBlending}
        opacity={0.6}
      />
    </Points>
  );
}

interface DottedGlowBackgroundProps {
  className?: string;
  /** Spacing between particles; larger gap = sparser field. Default 14. */
  gap?: number;
  /** Particle radius; mapped to WebGL point size. Default 1.5. */
  radius?: number;
  /** Base backdrop tint layered over the radial gradient. */
  color?: string;
  /** Particle glow color. Default #7cffc7. */
  glowColor?: string;
  /** X-axis rotation speed component. Default 0.4. */
  speedMin?: number;
  /** Y-axis rotation speed component. Default 1.0. */
  speedMax?: number;
  /** Global multiplier applied to both rotation speeds. Default 1.0. */
  speedScale?: number;
}

export default function DottedGlowBackground({
  className,
  gap = 14,
  radius = 1.5,
  color,
  glowColor = "#7cffc7",
  speedMin = 0.4,
  speedMax = 1.0,
  speedScale = 1.0,
}: DottedGlowBackgroundProps) {
  // Density scales inversely with gap; gap=14 reproduces the original 6000.
  const count = Math.max(500, Math.min(12000, Math.round(84000 / gap)));
  // Point size scales with radius; radius=1.5 reproduces the original 0.15.
  const size = radius / 10;

  return (
    <div
      className={className}
      style={{
        position: "absolute",
        inset: 0,
        zIndex: 0,
        overflow: "hidden",
        background:
          "radial-gradient(circle at 50% 50%, #050a15 0%, #000000 100%)",
      }}
    >
      {color && (
        <div
          className="absolute inset-0 pointer-events-none"
          style={{ background: color }}
        />
      )}
      <Canvas camera={{ position: [0, 0, 35], fov: 60 }} dpr={[1, 2]}>
        <ambientLight intensity={0.5} />
        <ParticleField
          count={count}
          glowColor={glowColor}
          size={size}
          speedMin={speedMin}
          speedMax={speedMax}
          speedScale={speedScale}
        />
      </Canvas>
      {/* Vignette Overlay for depth */}
      <div className="absolute inset-0 pointer-events-none bg-[radial-gradient(circle_at_center,transparent_0%,rgba(0,0,0,0.8)_100%)]" />
    </div>
  );
}
