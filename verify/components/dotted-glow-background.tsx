"use client";

/**
 * MAD Gambit — DottedGlowBackground (Ultra Max Fidelity 3D)
 * ------------------------------------------------------------------
 * Replaces the 2D canvas with a full WebGL React-Three-Fiber particle
 * system. Features a slowly rotating, depth-sorted field of glowing 
 * nodes, perfect for the premium Cyberpunk/Fintech aesthetic.
 */

import React, { useRef, useMemo } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { Points, PointMaterial } from "@react-three/drei";
import * as THREE from "three";

// Pre-compute a spherical distribution of particles
function ParticleField({ count = 4000 }: { count?: number }) {
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

  // Slow ambient rotation
  useFrame((state, delta) => {
    if (points.current) {
      points.current.rotation.y -= delta * 0.05;
      points.current.rotation.x -= delta * 0.02;
    }
  });

  return (
    <Points ref={points} positions={positions} stride={3} frustumCulled={false}>
      <PointMaterial
        transparent
        color="#7cffc7"
        size={0.15}
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
}

export default function DottedGlowBackground({ className }: DottedGlowBackgroundProps) {
  return (
    <div
      className={className}
      style={{
        position: "absolute",
        inset: 0,
        zIndex: 0,
        overflow: "hidden",
        background: "radial-gradient(circle at 50% 50%, #050a15 0%, #000000 100%)"
      }}
    >
      <Canvas camera={{ position: [0, 0, 35], fov: 60 }} dpr={[1, 2]}>
        {/* Subtle ambient light just in case, though points don't strictly need it */}
        <ambientLight intensity={0.5} />
        <ParticleField count={6000} />
      </Canvas>
      {/* Vignette Overlay for depth */}
      <div className="absolute inset-0 pointer-events-none bg-[radial-gradient(circle_at_center,transparent_0%,rgba(0,0,0,0.8)_100%)]" />
    </div>
  );
}
