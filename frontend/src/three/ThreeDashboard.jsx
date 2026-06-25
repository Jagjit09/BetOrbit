import React, { useRef, useMemo, useState } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, Stars } from '@react-three/drei';
import { Activity, Shield, RefreshCw } from 'lucide-react';

function OrbitingNode({ radius, angleSpeed, color, size, offsetAngle = 0 }) {
  const meshRef = useRef();
  const angleRef = useRef(offsetAngle);

  useFrame((state) => {
    if (meshRef.current) {
      angleRef.current += angleSpeed;
      const x = Math.cos(angleRef.current) * radius;
      const z = Math.sin(angleRef.current) * radius;
      const y = Math.sin(state.clock.getElapsedTime() + radius) * 0.4;
      meshRef.current.position.set(x, y, z);
      meshRef.current.rotation.y += 0.02;
    }
  });

  return (
    <mesh ref={meshRef}>
      <boxGeometry args={[size, size, size]} />
      <meshStandardMaterial
        color={color}
        emissive={color}
        emissiveIntensity={1.2}
        metalness={0.9}
        roughness={0.1}
      />
    </mesh>
  );
}

function CentralPlanet({ wireframeColor = '#0072F5' }) {
  const planetRef = useRef();

  useFrame((state) => {
    if (planetRef.current) {
      planetRef.current.rotation.y = state.clock.getElapsedTime() * 0.15;
      planetRef.current.rotation.x = state.clock.getElapsedTime() * 0.08;
    }
  });

  return (
    <group ref={planetRef}>
      {/* Central Solid Sphere */}
      <mesh>
        <sphereGeometry args={[1.2, 32, 32]} />
        <meshStandardMaterial
          color="#0f0727"
          roughness={0.2}
          metalness={0.8}
        />
      </mesh>
      {/* Outer Wireframe Glow */}
      <mesh>
        <sphereGeometry args={[1.25, 16, 16]} />
        <meshBasicMaterial
          color={wireframeColor}
          wireframe
          transparent
          opacity={0.4}
        />
      </mesh>
    </group>
  );
}

function OrbitRing({ radius, color = '#6344cc' }) {
  return (
    <mesh rotation={[Math.PI / 2, 0, 0]}>
      <ringGeometry args={[radius - 0.02, radius + 0.02, 64]} />
      <meshBasicMaterial color={color} side={2} transparent opacity={0.15} />
    </mesh>
  );
}

export default function ThreeDashboard() {
  const [activeTheme, setActiveTheme] = useState('cosmic');
  const [speedMultiplier, setSpeedMultiplier] = useState(1);

  const colors = useMemo(() => {
    if (activeTheme === 'green') {
      return { core: '#10b981', ring: '#a7f3d0', nodes: ['#10b981', '#34d399', '#059669'] };
    }
    if (activeTheme === 'rose') {
      return { core: '#f43f5e', ring: '#fecdd3', nodes: ['#f43f5e', '#fb7185', '#e11d48'] };
    }
    return { core: '#0072F5', ring: '#8c6ef0', nodes: ['#0072F5', '#10b981', '#f43f5e', '#8c6ef0'] };
  }, [activeTheme]);

  const nodesList = useMemo(() => {
    return [
      { radius: 2.0, angleSpeed: 0.015 * speedMultiplier, color: colors.nodes[0], size: 0.2, offset: 0 },
      { radius: 2.0, angleSpeed: -0.02 * speedMultiplier, color: colors.nodes[1] || '#8c6ef0', size: 0.16, offset: Math.PI },
      { radius: 2.8, angleSpeed: 0.008 * speedMultiplier, color: colors.nodes[2] || '#10b981', size: 0.25, offset: Math.PI / 3 },
      { radius: 2.8, angleSpeed: -0.012 * speedMultiplier, color: colors.nodes[3] || '#f43f5e', size: 0.18, offset: (4 * Math.PI) / 3 },
      { radius: 3.5, angleSpeed: 0.005 * speedMultiplier, color: '#fbbf24', size: 0.22, offset: Math.PI / 6 },
    ];
  }, [colors, speedMultiplier]);

  return (
    <div className="glass-panel border-slate-200 bg-white p-5 rounded-2xl shadow-sm relative overflow-hidden flex flex-col md:flex-row gap-6 items-center">
      {/* 3D Canvas Box */}
      <div className="h-[280px] w-full md:w-[320px] bg-slate-950 rounded-xl relative overflow-hidden shrink-0 shadow-inner">
        <Canvas camera={{ position: [0, 2.5, 5], fov: 50 }}>
          <ambientLight intensity={0.8} />
          <pointLight position={[10, 10, 10]} intensity={1.5} />
          <pointLight position={[-10, -10, -10]} intensity={0.5} />
          <Stars radius={100} depth={50} count={300} factor={4} saturation={0.5} fade speed={1.5} />
          
          <CentralPlanet wireframeColor={colors.core} />
          
          {/* Orbit rings */}
          <OrbitRing radius={2.0} color={colors.ring} />
          <OrbitRing radius={2.8} color={colors.ring} />
          <OrbitRing radius={3.5} color={colors.ring} />

          {/* Dynamic Match Nodes */}
          {nodesList.map((node, i) => (
            <OrbitingNode key={i} {...node} />
          ))}

          <OrbitControls enableZoom={false} autoRotate={false} />
        </Canvas>

        {/* Floating Indicator */}
        <div className="absolute top-3 left-3 bg-slate-900/90 border border-slate-800/80 rounded-lg px-2.5 py-1 flex items-center gap-1.5 text-[9px] font-black uppercase text-blue-400 tracking-wider">
          <Activity size={10} className="animate-pulse" /> 3D Match Engine Active
        </div>
      </div>

      {/* Control Details Box */}
      <div className="flex-1 w-full flex flex-col justify-between h-full py-1 text-xs font-semibold">
        <div className="space-y-3">
          <div>
            <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Network Visualization</span>
            <h2 className="text-lg font-black text-slate-850 mt-0.5">BetOrbit Orbital Engine</h2>
            <p className="text-xs text-slate-500 font-medium leading-relaxed mt-1">
              Visualize predictive outcomes, match liquidity flows, and observe real-time trades mapped inside our secure 3D smart-matching sphere.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-4 border-t border-slate-100 pt-3">
            <div>
              <span className="text-[9px] font-black text-slate-400 uppercase tracking-wider block mb-1">Visual Core Theme</span>
              <div className="flex gap-1.5">
                <button
                  onClick={() => setActiveTheme('cosmic')}
                  className={`h-5 px-2 text-[9px] rounded font-black border uppercase transition-all ${
                    activeTheme === 'cosmic' ? 'bg-blue-50 border-blue-200 text-blue-600' : 'bg-slate-50 border-slate-200 text-slate-500'
                  }`}
                >
                  Cosmic
                </button>
                <button
                  onClick={() => setActiveTheme('green')}
                  className={`h-5 px-2 text-[9px] rounded font-black border uppercase transition-all ${
                    activeTheme === 'green' ? 'bg-emerald-50 border-emerald-200 text-emerald-600' : 'bg-slate-50 border-slate-200 text-slate-500'
                  }`}
                >
                  Yes Core
                </button>
                <button
                  onClick={() => setActiveTheme('rose')}
                  className={`h-5 px-2 text-[9px] rounded font-black border uppercase transition-all ${
                    activeTheme === 'rose' ? 'bg-rose-50 border-rose-200 text-rose-600' : 'bg-slate-50 border-slate-200 text-slate-500'
                  }`}
                >
                  No Core
                </button>
              </div>
            </div>

            <div>
              <span className="text-[9px] font-black text-slate-400 uppercase tracking-wider block mb-1">Simulation Speed</span>
              <div className="flex gap-1.5">
                <button
                  onClick={() => setSpeedMultiplier(0.5)}
                  className={`h-5 w-8 text-[9px] rounded font-black border transition-all ${
                    speedMultiplier === 0.5 ? 'bg-slate-800 border-slate-900 text-white' : 'bg-slate-50 border-slate-200 text-slate-500'
                  }`}
                >
                  0.5x
                </button>
                <button
                  onClick={() => setSpeedMultiplier(1)}
                  className={`h-5 w-8 text-[9px] rounded font-black border transition-all ${
                    speedMultiplier === 1 ? 'bg-slate-800 border-slate-900 text-white' : 'bg-slate-50 border-slate-200 text-slate-500'
                  }`}
                >
                  1.0x
                </button>
                <button
                  onClick={() => setSpeedMultiplier(2.5)}
                  className={`h-5 w-8 text-[9px] rounded font-black border transition-all ${
                    speedMultiplier === 2.5 ? 'bg-slate-800 border-slate-900 text-white' : 'bg-slate-50 border-slate-200 text-slate-500'
                  }`}
                >
                  2.5x
                </button>
              </div>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3 text-[10px] text-slate-400 font-bold border-t border-slate-100 pt-3 mt-4">
          <span className="flex items-center gap-1"><Shield size={12} className="text-[#0072F5]" /> Secure Match Layer v3</span>
          <span className="flex items-center gap-1"><RefreshCw size={12} className="text-emerald-500 animate-spin" /> Real-time sync</span>
        </div>
      </div>
    </div>
  );
}
