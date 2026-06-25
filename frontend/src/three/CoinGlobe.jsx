import React, { useRef } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';

function CoinMesh({ position, rotationSpeed }) {
  const meshRef = useRef();

  useFrame(() => {
    if (meshRef.current) {
      meshRef.current.rotation.z += rotationSpeed;
      meshRef.current.rotation.y += rotationSpeed * 0.5;
    }
  });

  return (
    <mesh ref={meshRef} position={position}>
      <cylinderGeometry args={[0.25, 0.25, 0.05, 32]} />
      <meshStandardMaterial
        color="#fbbf24"
        emissive="#d97706"
        emissiveIntensity={0.8}
        metalness={0.9}
        roughness={0.1}
      />
    </mesh>
  );
}

function GlobeWireframe() {
  const globeRef = useRef();

  useFrame(() => {
    if (globeRef.current) {
      globeRef.current.rotation.y += 0.005;
      globeRef.current.rotation.x += 0.002;
    }
  });

  return (
    <group ref={globeRef}>
      {/* Outer wireframe sphere */}
      <mesh>
        <sphereGeometry args={[2.0, 16, 16]} />
        <meshBasicMaterial color="#6344cc" wireframe transparent opacity={0.25} />
      </mesh>
      
      {/* Floating internal coins */}
      <CoinMesh position={[0.8, 0.5, -0.6]} rotationSpeed={0.015} />
      <CoinMesh position={[-0.8, -0.6, 0.5]} rotationSpeed={0.02} />
      <CoinMesh position={[0.2, -1.0, -0.8]} rotationSpeed={0.01} />
      <CoinMesh position={[-0.5, 0.9, -0.2]} rotationSpeed={0.025} />
      <CoinMesh position={[0.0, 0.0, 0.0]} rotationSpeed={0.03} />
    </group>
  );
}

export default function CoinGlobe() {
  return (
    <div className="h-[250px] w-[250px] mx-auto overflow-hidden">
      <Canvas camera={{ position: [0, 0, 4.5], fov: 60 }}>
        <ambientLight intensity={0.7} />
        <pointLight position={[10, 10, 10]} intensity={1.5} />
        
        <GlobeWireframe />
        
        <OrbitControls enableZoom={false} autoRotate autoRotateSpeed={0.5} />
      </Canvas>
    </div>
  );
}
