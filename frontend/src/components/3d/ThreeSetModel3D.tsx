'use client';

import { Canvas, useFrame } from '@react-three/fiber';
import { Html, OrbitControls, PerspectiveCamera, Stage, ContactShadows, Environment, RoundedBox } from '@react-three/drei';
import { useState, useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import * as THREE from 'three';
import { EmployeeGarmentSet, Garment } from '@/types';
import { cn, getStatusLabel, getStatusColor } from '@/lib/utils';

interface ThreeSetModel3DProps {
  garmentSet: EmployeeGarmentSet;
  onGarmentClick?: (garment: Garment, position: 'A' | 'B' | 'C') => void;
  className?: string;
}

const SET_CONFIG = {
  A: { label: 'SET A', desc: 'In Use', color: '#3b82f6', position: [-3, 0, 0] as [number, number, number] },
  B: { label: 'SET B', desc: 'In Locker', color: '#22c55e', position: [0, 0, 0] as [number, number, number] },
  C: { label: 'SET C', desc: 'In Laundry', color: '#f59e0b', position: [3, 0, 0] as [number, number, number] },
};

function SetCylinder({ 
  position, 
  label, 
  desc, 
  color, 
  garment, 
  isHovered, 
  onClick,
  rotation 
}: { 
  position: [number, number, number];
  label: string;
  desc: string;
  color: string;
  garment?: Garment;
  isHovered: boolean;
  onClick: () => void;
  rotation: number;
}) {
  const meshRef = useRef<THREE.Mesh>(null);

  useFrame((state) => {
    if (meshRef.current) {
      meshRef.current.rotation.y = rotation + Math.sin(state.clock.getElapsedTime() * 0.5) * 0.05;
    }
  });

  return (
    <group position={position} onClick={onClick} onPointerOver={() => {}} onPointerOut={() => {}}>
      <mesh
        ref={meshRef}
        castShadow
        receiveShadow
        position={[0, 1.5, 0]}
        scale={isHovered ? [1.1, 1.05, 1.1] : [1, 1, 1]}
      >
        <cylinderGeometry args={[1.2, 1.2, 3, 16]} />
        <meshStandardMaterial
          color={color}
          transparent
          opacity={garment ? 0.85 : 0.3}
          metalness={0.1}
          roughness={0.4}
          emissive={garment ? color : '#000'}
          emissiveIntensity={garment ? 0.2 : 0}
        />
      </mesh>
      
      <RoundedBox
        args={[2.5, 0.2, 2.5]}
        radius={0.1}
        position={[0, -0.1, 0]}
        castShadow
        receiveShadow
      >
        <meshStandardMaterial color="#1e293b" metalness={0.1} roughness={0.8} />
      </RoundedBox>
      
      <ContactShadows opacity={0.3} scale={2} />
      
      <Html
        position={[0, 3.5, 0]}
        fullscreen
        occlude
        style={{ pointerEvents: 'none', transform: 'translate(-50%, -50%)' }}
      >
        <div style={{ 
          display: 'flex', 
          flexDirection: 'column', 
          alignItems: 'center',
          gap: '4px',
          padding: '8px 12px',
          background: 'rgba(255,255,255,0.95)',
          borderRadius: '12px',
          boxShadow: '0 4px 16px rgba(0,0,0,0.15)',
          backdropFilter: 'blur(8px)',
          minWidth: '120px',
          border: isHovered ? `2px solid ${color}` : '1px solid rgba(0,0,0,0.1)',
        }}>
          <div style={{ fontSize: '0.7rem', fontWeight: 700, color: color, letterSpacing: '0.1em' }}>
            {label}
          </div>
          <div style={{ fontSize: '0.65rem', color: '#666', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            {desc}
          </div>
          {garment && (
            <div style={{ 
              marginTop: '4px', 
              padding: '4px 8px', 
              background: color + '20', 
              borderRadius: '6px',
              border: `1px solid ${color}40`,
            }}>
              <div style={{ fontSize: '0.6rem', fontWeight: 600, color: color }}>
                {garment.assetId}
              </div>
              <div style={{ fontSize: '0.55rem', color: '#666' }}>
                {garment.garmentType?.name || 'Unknown'} • Wash: {garment.washCount}
              </div>
            </div>
          )}
        </div>
      </Html>
    </group>
  );
}

function RotationArrow({ fromPos, toPos, color }: { fromPos: [number, number, number]; toPos: [number, number, number]; color: string }) {
  const midX = (fromPos[0] + toPos[0]) / 2;
  const midZ = (fromPos[2] + toPos[2]) / 2;
  
  return (
    <group position={[midX, 2, midZ]}>
      <mesh
        castShadow
        rotation={[0, Math.PI / 2, 0]}
        scale={1.5}
      >
        <coneGeometry args={[0.3, 0.8, 8]} />
        <meshStandardMaterial color={color} transparent opacity={0.7} />
      </mesh>
      <Html
        position={[0, 1.5, 0]}
        fullscreen
        occlude
        style={{ pointerEvents: 'none', transform: 'translate(-50%, -50%)' }}
      >
        <motion.div
          animate={{ y: [0, -10, 0] }}
          transition={{ duration: 1.5, repeat: Infinity, ease: 'easeInOut' }}
          style={{ 
            fontSize: '0.6rem', 
            fontWeight: 600, 
            color: color,
            textShadow: '0 0 4px white',
            whiteSpace: 'nowrap'
          }}
        >
          →
        </motion.div>
      </Html>
    </group>
  );
}

function EmployeeInfo({ name, code, department }: { name: string; code: string; department?: string }) {
  return (
    <Html
      position={[0, -3.5, 0]}
      fullscreen
      occlude
      style={{ pointerEvents: 'none', transform: 'translate(-50%, -50%)' }}
    >
      <div style={{ 
        display: 'flex', 
        flexDirection: 'column', 
        alignItems: 'center',
        gap: '2px',
        padding: '8px 16px',
        background: 'rgba(15, 23, 42, 0.9)',
        borderRadius: '12px',
        boxShadow: '0 8px 32px rgba(0,0,0,0.3)',
        backdropFilter: 'blur(8px)',
        border: '1px solid rgba(255,255,255,0.1)',
      }}>
        <div style={{ fontSize: '0.9rem', fontWeight: 700, color: '#fff' }}>
          {name}
        </div>
        <div style={{ fontSize: '0.65rem', color: '#94a3b8' }}>
          {code} • {department || 'Unassigned'}
        </div>
      </div>
    </Html>
  );
}

export function ThreeSetModel3D({ garmentSet, onGarmentClick, className }: ThreeSetModel3DProps) {
  const [hoveredSet, setHoveredSet] = useState<'A' | 'B' | 'C' | null>(null);
  const rotationRef = useRef(0);

  useFrame((state) => {
    rotationRef.current = state.clock.getElapsedTime() * 0.1;
  });

  const handleRotate = () => {
    // This would trigger the rotation API call
    console.log('Rotate sets for employee:', garmentSet.employeeId);
  };

  return (
    <div className={cn('relative w-full h-[500px] rounded-xl bg-gradient-to-br from-whitefox-50 to-white-100 dark:from-whitefox-950 dark:to-whitefox-900', className)}>
      <Canvas
        camera={{ position: [0, 5, 10], fov: 45 }}
        style={{ width: '100%', height: '100%' }}
      >
        <Environment preset="studio" />
        <PerspectiveCamera makeDefault position={[0, 5, 10]} />
        <OrbitControls 
          enablePan={false} 
          enableZoom={true} 
          enableRotate={true}
          minPolarAngle={0.3}
          maxPolarAngle={Math.PI / 2.2}
          minZoom={8}
          maxZoom={20}
        />
        
        <ambientLight intensity={0.8} />
        <directionalLight position={[5, 10, 5]} intensity={1} castShadow />
        <directionalLight position={[-5, 10, -5]} intensity={0.3} />
        
        <Stage environment="studio" shadows>
          <EmployeeInfo 
            name={garmentSet.employee?.firstName + ' ' + garmentSet.employee?.lastName || 'Employee'}
            code={garmentSet.employee?.employeeCode || ''}
            department={garmentSet.employee?.department?.name}
          />
          
          <SetCylinder
            position={SET_CONFIG.A.position}
            label={SET_CONFIG.A.label}
            desc={SET_CONFIG.A.desc}
            color={SET_CONFIG.A.color}
            garment={garmentSet.setAGarment}
            isHovered={hoveredSet === 'A'}
            onClick={() => setHoveredSet('A')}
            rotation={rotationRef.current}
          />
          
          <SetCylinder
            position={SET_CONFIG.B.position}
            label={SET_CONFIG.B.label}
            desc={SET_CONFIG.B.desc}
            color={SET_CONFIG.B.color}
            garment={garmentSet.setBGarment}
            isHovered={hoveredSet === 'B'}
            onClick={() => setHoveredSet('B')}
            rotation={rotationRef.current}
          />
          
          <SetCylinder
            position={SET_CONFIG.C.position}
            label={SET_CONFIG.C.label}
            desc={SET_CONFIG.C.desc}
            color={SET_CONFIG.C.color}
            garment={garmentSet.setCGarment}
            isHovered={hoveredSet === 'C'}
            onClick={() => setHoveredSet('C')}
            rotation={rotationRef.current}
          />
          
          <RotationArrow 
            fromPos={SET_CONFIG.A.position} 
            toPos={SET_CONFIG.B.position} 
            color={SET_CONFIG.B.color} 
          />
          
          <RotationArrow 
            fromPos={SET_CONFIG.B.position} 
            toPos={SET_CONFIG.C.position} 
            color={SET_CONFIG.C.color} 
          />
          
          <RotationArrow 
            fromPos={SET_CONFIG.C.position} 
            toPos={[SET_CONFIG.A.position[0] + 6, SET_CONFIG.A.position[1], SET_CONFIG.A.position[2]]} 
            color={SET_CONFIG.A.color} 
          />
        </Stage>
      </Canvas>
      
      <div className="absolute bottom-4 left-4 right-4 flex justify-center gap-4">
        <button
          onClick={handleRotate}
          className="px-4 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:opacity-90 transition-opacity shadow-lg"
        >
          Rotate Sets
        </button>
        <button
          className="px-4 py-2 bg-secondary text-secondary-foreground rounded-lg text-sm font-medium hover:opacity-90 transition-opacity"
        >
          View History
        </button>
      </div>
    </div>
  );
}