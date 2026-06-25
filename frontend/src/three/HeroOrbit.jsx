import React, { useRef, useMemo } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { Stars, OrbitControls } from '@react-three/drei';

function FloatingShape({ shape, position, color, size, rotationSpeed }) {
  const meshRef = useRef();

  useFrame((state) => {
    if (meshRef.current) {
      meshRef.current.rotation.x += rotationSpeed[0];
      meshRef.current.rotation.y += rotationSpeed[1];
      meshRef.current.rotation.z += rotationSpeed[2];
      
      // Gentle floating up & down wave
      const time = state.clock.getElapsedTime();
      meshRef.current.position.y = position[1] + Math.sin(time * 0.4 + position[0]) * 0.35;
    }
  });

  return (
    <mesh ref={meshRef} position={position}>
      {shape === 'cube' ? (
        <boxGeometry args={[size, size, size]} />
      ) : (
        <tetrahedronGeometry args={[size * 1.15, 0]} />
      )}
      <meshStandardMaterial
        color={color}
        emissive={color}
        emissiveIntensity={0.5}
        transparent
        opacity={0.65}
        roughness={0.15}
        metalness={0.3}
      />
    </mesh>
  );
}

function CenterCore() {
  const coreRef = useRef();

  useFrame(({ clock }) => {
    if (coreRef.current) {
      coreRef.current.rotation.y = clock.getElapsedTime() * 0.12;
      coreRef.current.rotation.x = clock.getElapsedTime() * 0.05;
    }
  });

  return (
    <mesh ref={coreRef}>
      <sphereGeometry args={[1.5, 24, 24]} />
      <meshStandardMaterial
        color="#0072F5"
        emissive="#004393"
        emissiveIntensity={1.8}
        roughness={0.2}
        wireframe
      />
    </mesh>
  );
}

export default function HeroOrbit() {
  // Generate random floating cubes and triangles
  const shapes = useMemo(() => {
    const data = [];
    const colors = ['#0072F5', '#10b981', '#f43f5e', '#eab308', '#8c6ef0'];
    
    for (let i = 0; i < 28; i++) {
      const isCube = i % 2 === 0;
      // Position spread
      const x = (Math.random() - 0.5) * 18;
      const y = (Math.random() - 0.5) * 11;
      const z = (Math.random() - 0.5) * 12 - 2;
      
      const color = colors[Math.floor(Math.random() * colors.length)];
      const size = Math.random() * 0.35 + 0.25;
      
      const rotationSpeed = [
        (Math.random() - 0.5) * 0.012,
        (Math.random() - 0.5) * 0.012,
        (Math.random() - 0.5) * 0.012,
      ];
      
      data.push({
        id: i,
        shape: isCube ? 'cube' : 'triangle',
        position: [x, y, z],
        color,
        size,
        rotationSpeed,
      });
    }
    return data;
  }, []);

  return (
    <div className="absolute inset-0 z-0 h-screen w-full overflow-hidden select-none pointer-events-none">
      <Canvas camera={{ position: [0, 0, 9], fov: 50 }}>
        <ambientLight intensity={0.7} />
        <pointLight position={[10, 10, 10]} intensity={1.5} />
        <pointLight position={[-10, -10, -10]} intensity={0.5} />
        
        {/* Central futuristic wireframe orb */}
        <CenterCore />

        {/* Orbiting geometric boxes/pyramids */}
        {shapes.map((shape) => (
          <FloatingShape key={shape.id} {...shape} />
        ))}

        {/* Restricted Orbit Controls */}
        <OrbitControls
          enableZoom={false}
          enablePan={false}
          maxPolarAngle={Math.PI / 2 + 0.1}
          minPolarAngle={Math.PI / 2 - 0.1}
        />
      </Canvas>
    </div>
  );
}
