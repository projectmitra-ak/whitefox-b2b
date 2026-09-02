'use client';

import { Canvas, useFrame } from '@react-three/fiber';
import { Html, OrbitControls, PerspectiveCamera, Stage, ContactShadows, Environment, RoundedBox, Text } from '@react-three/drei';
import { useState, useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import * as THREE from 'three';
import { WashBatch, Garment } from '@/types';
import { cn } from '@/lib/utils';

interface PlantVisualization3DProps {
  washBatches: WashBatch[];
  garments: Garment[];
  selectedBatchId?: string;
  onBatchClick?: (batch: WashBatch) => void;
  className?: string;
}

const MACHINE_TYPES = {
  washer: { 
    name: 'Washer', 
    color: '#3b82f6', 
    size: [3, 2.5, 3] as [number, number, number], 
    positions: [[-8, 0, -6], [-8, 0, -2], [-8, 0, 2], [-8, 0, 6]] as [number, number, number][] 
  },
  dryer: { 
    name: 'Dryer', 
    color: '#f59e0b', 
    size: [2.5, 2.5, 2.5] as [number, number, number], 
    positions: [[-4, 0, -6], [-4, 0, -2], [-4, 0, 2], [-4, 0, 6]] as [number, number, number][] 
  },
  ironer: { 
    name: 'Ironer', 
    color: '#ec4899', 
    size: [4, 1.5, 2] as [number, number, number], 
    positions: [[0, 0, -4], [0, 0, 4]] as [number, number, number][] 
  },
  folder: { 
    name: 'Folder', 
    color: '#22c55e', 
    size: [3, 2, 2] as [number, number, number], 
    positions: [[4, 0, -4], [4, 0, 4]] as [number, number, number][] 
  },
  packing: { 
    name: 'Packing', 
    color: '#8b5cf6', 
    size: [3, 1.5, 3] as [number, number, number], 
    positions: [[8, 0, 0]] as [number, number, number][] 
  },
  dispatch: { 
    name: 'Dispatch', 
    color: '#10b981', 
    size: [4, 2, 4] as [number, number, number], 
    positions: [[12, 0, 0]] as [number, number, number][] 
  },
};

function Machine({ 
  type, 
  position, 
  index, 
  isActive, 
  progress, 
  batch 
}: { 
  type: keyof typeof MACHINE_TYPES;
  position: [number, number, number];
  index: number;
  isActive: boolean;
  progress: number;
  batch?: WashBatch;
}) {
  const config = MACHINE_TYPES[type];
  const meshRef = useRef<THREE.Mesh>(null);
  const [hovered, setHovered] = useState(false);

  useFrame((state) => {
    if (meshRef.current && isActive) {
      const material = meshRef.current.material as THREE.MeshStandardMaterial;
      material.emissiveIntensity = 0.3 + Math.sin(state.clock.getElapsedTime() * 4) * 0.2;
      if (type === 'washer' || type === 'dryer') {
        meshRef.current.rotation.y = Math.sin(state.clock.getElapsedTime() * 2) * 0.05;
      }
    }
  });

  return (
    <group position={position} onPointerOver={() => setHovered(true)} onPointerOut={() => setHovered(false)}>
      <RoundedBox
        ref={meshRef}
        args={config.size}
        radius={0.2}
        position={[0, config.size[1] / 2, 0]}
        castShadow
        receiveShadow
      >
        <meshStandardMaterial
          color={config.color}
          transparent
          opacity={isActive ? 0.9 : 0.5}
          metalness={0.2}
          roughness={0.3}
          emissive={isActive ? config.color : '#000'}
          emissiveIntensity={isActive ? 0.3 : 0}
        />
      </RoundedBox>
      
      {isActive && progress > 0 && (
        <RoundedBox
          args={[config.size[0] - 0.4, config.size[1] * progress, config.size[2] - 0.4]}
          radius={0.1}
          position={[0, (config.size[1] * progress) / 2, 0]}
        >
          <meshStandardMaterial
            color="#fff"
            transparent
            opacity={0.3}
            metalness={0}
            roughness={1}
          />
        </RoundedBox>
      )}
      
      <ContactShadows opacity={0.3} scale={1.5} />
      
      <Html
        position={[0, config.size[1] + 0.8, 0]}
        fullscreen
        occlude
        style={{ pointerEvents: 'none', transform: 'translate(-50%, -50%)' }}
      >
        <div style={{ 
          display: 'flex', 
          flexDirection: 'column', 
          alignItems: 'center',
          gap: '2px',
          padding: '6px 10px',
          background: 'rgba(255,255,255,0.95)',
          borderRadius: '8px',
          boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
          backdropFilter: 'blur(4px)',
          minWidth: '100px',
          border: hovered ? `2px solid ${config.color}` : '1px solid rgba(0,0,0,0.1)',
        }}>
          <div style={{ fontSize: '0.65rem', fontWeight: 700, color: config.color }}>
            {config.name} #{index + 1}
          </div>
          {isActive && batch && (
            <>
              <div style={{ fontSize: '0.55rem', color: '#666' }}>
                Batch: {batch.batchNumber}
              </div>
              <div style={{ fontSize: '0.55rem', color: '#666' }}>
                {batch.garmentCount} items • {batch.totalWeightKg?.toFixed(1)}kg
              </div>
              <div style={{ 
                width: '80px', 
                height: '4px', 
                background: '#e5e7eb', 
                borderRadius: '2px',
                overflow: 'hidden'
              }}>
                <motion.div
                  style={{ 
                    width: `${progress * 100}%`, 
                    height: '100%', 
                    background: config.color,
                    borderRadius: '2px'
                  }}
                  initial={{ width: 0 }}
                  animate={{ width: `${progress * 100}%` }}
                  transition={{ duration: 0.5 }}
                />
              </div>
            </>
          )}
        </div>
      </Html>
    </group>
  );
}

function ConveyorBelt({ from, to, isActive }: { from: [number, number, number]; to: [number, number, number]; isActive: boolean }) {
  const start = new THREE.Vector3(...from);
  const end = new THREE.Vector3(...to);
  const mid = start.clone().lerp(end, 0.5);
  const distance = start.distanceTo(end);
  const angle = Math.atan2(end.x - start.x, end.z - start.z);
  
  const [beltOffset, setBeltOffset] = useState(0);

  useFrame((state, delta) => {
    if (isActive) {
      setBeltOffset(prev => (prev + delta * 2) % 1);
    }
  });

  return (
    <mesh
      position={[mid.x, 0.1, mid.z]}
      rotation={[0, angle, 0]}
    >
      <boxGeometry args={[0.3, 0.05, distance - 1]} />
      <meshStandardMaterial 
        color={isActive ? '#666' : '#444'} 
        transparent 
        opacity={0.5}
      />
    </mesh>
  );
}

function GarmentFlow({ garments, batchId }: { garments: Garment[]; batchId?: string }) {
  const batchGarments = batchId 
    ? garments.filter(g => g.currentLocationId === batchId)
    : garments.filter(g => ['WASHING', 'DRYING', 'QC_PENDING', 'QC_PASSED'].includes(g.status));

  return (
    <group>
      {batchGarments.slice(0, 30).map((garment, i) => {
        const status = garment.status;
        let x = -8;
        if (status === 'WASHING') x = -8 + Math.random() * 0.5;
        else if (status === 'DRYING') x = -4 + Math.random() * 0.5;
        else if (status === 'QC_PENDING' || status === 'QC_PASSED') x = 2 + Math.random() * 2;
        else if (status === 'PACKED') x = 8;
        else if (status === 'DISPATCHED') x = 12;
        
        const z = (i % 4 - 1.5) * 2.5;
        const y = 1.5 + Math.random() * 0.5;

        return (
          <group key={garment.id} position={[x, y, z]}>
            <RoundedBox args={[0.4, 0.6, 0.1]} radius={0.03}>
              <meshStandardMaterial 
                color={garment.color?.hexCode || '#888'} 
                transparent 
                opacity={0.9}
              />
            </RoundedBox>
          </group>
        );
      })}
    </group>
  );
}

export function PlantVisualization3D({ 
  washBatches, 
  garments, 
  selectedBatchId, 
  onBatchClick,
  className 
}: PlantVisualization3DProps) {
  const [hoveredMachine, setHoveredMachine] = useState<string | null>(null);

  const activeBatches = washBatches.filter(b => 
    ['LOADING', 'LOADED', 'WASHING', 'RINSING', 'SPINNING', 'UNLOADING'].includes(b.status)
  );

  const getMachineProgress = (machineType: keyof typeof MACHINE_TYPES, index: number) => {
    if (!selectedBatchId) return 0;
    const batch = washBatches.find(b => b.id === selectedBatchId);
    if (!batch) return 0;
    
    switch (machineType) {
      case 'washer':
        return batch.status === 'WASHING' ? 0.7 : batch.status === 'RINSING' ? 0.9 : 0;
      case 'dryer':
        return batch.status === 'DRYING' ? 0.6 : 0;
      case 'ironer':
        return batch.status === 'QC_PASSED' ? 0.5 : 0;
      case 'folder':
        return batch.status === 'PACKED' ? 0.8 : 0;
      case 'packing':
        return batch.status === 'PACKED' ? 0.9 : 0;
      case 'dispatch':
        return batch.status === 'DISPATCHED' ? 1 : 0;
      default:
        return 0;
    }
  };

  const isMachineActive = (machineType: keyof typeof MACHINE_TYPES, index: number) => {
    return activeBatches.some(b => {
      const progress = getMachineProgress(machineType, index);
      return progress > 0;
    });
  };

  return (
    <div className={cn('relative w-full h-[700px] rounded-xl bg-gradient-to-br from-slate-50 to-white dark:from-slate-900 dark:to-slate-950', className)}>
      <Canvas
        camera={{ position: [2, 12, 20], fov: 50 }}
        style={{ width: '100%', height: '100%' }}
      >
        <Environment preset="warehouse" />
        <PerspectiveCamera makeDefault position={[2, 12, 20]} />
        <OrbitControls 
          enablePan={true} 
          enableZoom={true} 
          enableRotate={true}
          minPolarAngle={0.2}
          maxPolarAngle={Math.PI / 2}
          minZoom={10}
          maxZoom={50}
        />
        
        <ambientLight intensity={0.7} />
        <directionalLight position={[10, 20, 10]} intensity={1.5} castShadow />
        <directionalLight position={[-10, 20, -10]} intensity={0.5} />
        <hemisphereLight intensity={0.5} groundColor="#444" />
        
        <Stage environment="warehouse" shadows>
          <gridHelper args={[40, 40, '#e5e7eb', '#e5e7eb']} />
          
          {Object.entries(MACHINE_TYPES).map(([type, config]) => 
            config.positions.map((pos, i) => (
              <Machine
                key={`${type}-${i}`}
                type={type as keyof typeof MACHINE_TYPES}
                position={pos}
                index={i}
                isActive={isMachineActive(type as keyof typeof MACHINE_TYPES, i)}
                progress={getMachineProgress(type as keyof typeof MACHINE_TYPES, i)}
                batch={activeBatches.find(b => b.status !== 'COMPLETED' && b.status !== 'FAILED')}
              />
            ))
          )}
          
          <ConveyorBelt from={[-8, 0, 0]} to={[-4, 0, 0]} isActive={isMachineActive('washer', 0) || isMachineActive('dryer', 0)} />
          <ConveyorBelt from={[-4, 0, 0]} to={[0, 0, 0]} isActive={isMachineActive('dryer', 0) || isMachineActive('ironer', 0)} />
          <ConveyorBelt from={[0, 0, 0]} to={[4, 0, 0]} isActive={isMachineActive('ironer', 0) || isMachineActive('folder', 0)} />
          <ConveyorBelt from={[4, 0, 0]} to={[8, 0, 0]} isActive={isMachineActive('folder', 0) || isMachineActive('packing', 0)} />
          <ConveyorBelt from={[8, 0, 0]} to={[12, 0, 0]} isActive={isMachineActive('packing', 0) || isMachineActive('dispatch', 0)} />
          
          <GarmentFlow garments={garments} batchId={selectedBatchId} />
        </Stage>
      </Canvas>
      
      <div className="absolute top-4 left-4 right-4 flex justify-between items-center px-4">
        <div className="flex gap-2">
          {Object.entries(MACHINE_TYPES).map(([type, config]) => (
            <div 
              key={type}
              className={cn(
                'flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium transition-all',
                hoveredMachine === type 
                  ? 'bg-white shadow-lg scale-105' 
                  : 'bg-white/80'
              )}
              onMouseEnter={() => setHoveredMachine(type)}
              onMouseLeave={() => setHoveredMachine(null)}
            >
              <div className="w-2 h-2 rounded-full" style={{ backgroundColor: config.color }} />
              <span>{config.name}</span>
            </div>
          ))}
        </div>
        
        {selectedBatchId && (
          <div className="flex items-center gap-2 px-3 py-1 bg-primary/10 text-primary rounded-full text-xs font-medium">
            <span className="w-2 h-2 rounded-full bg-primary animate-pulse" />
            <span>Tracking Batch: {washBatches.find(b => b.id === selectedBatchId)?.batchNumber}</span>
          </div>
        )}
      </div>
      
      <div className="absolute bottom-4 left-4 right-4 flex justify-center gap-2 px-4">
        <div className="flex gap-4 text-xs text-muted-foreground">
          <span>Washers: {MACHINE_TYPES.washer.positions.length}</span>
          <span>Dryers: {MACHINE_TYPES.dryer.positions.length}</span>
          <span>Ironers: {MACHINE_TYPES.ironer.positions.length}</span>
          <span>Folders: {MACHINE_TYPES.folder.positions.length}</span>
          <span>Active Batches: {activeBatches.length}</span>
        </div>
      </div>
    </div>
  );
}