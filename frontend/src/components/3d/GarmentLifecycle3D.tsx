'use client';

import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { Html, OrbitControls, PerspectiveCamera, Stage, ContactShadows, Environment, RoundedBox, Text } from '@react-three/drei';
import { useState, useRef, useEffect } from 'react';
import * as THREE from 'three';
import { Garment, GarmentStatus } from '@/types';
import { cn, getStatusLabel, getStatusColor } from '@/lib/utils';
import { motion } from 'framer-motion';

const STATIONS = [
  { id: 'hospital', name: 'Hospital', position: [-12, 0, 0] as [number, number, number], color: '#3b82f6', icon: '🏥' },
  { id: 'pickup', name: 'Pickup', position: [-8, 0, 0] as [number, number, number], color: '#6366f1', icon: '🚚' },
  { id: 'transport', name: 'Transport', position: [-4, 0, 0] as [number, number, number], color: '#8b5cf6', icon: '🛣️' },
  { id: 'plant_gate', name: 'Plant Gate', position: [0, 0, 0] as [number, number, number], color: '#ec4899', icon: '🏭' },
  { id: 'washing', name: 'Washing', position: [4, 2, 0] as [number, number, number], color: '#06b6d4', icon: '💧' },
  { id: 'drying', name: 'Drying', position: [4, -2, 0] as [number, number, number], color: '#f59e0b', icon: '☀️' },
  { id: 'qc', name: 'Quality Check', position: [8, 0, 0] as [number, number, number], color: '#22c55e', icon: '✅' },
  { id: 'packing', name: 'Packing', position: [10, 2, 0] as [number, number, number], color: '#84cc16', icon: '📦' },
  { id: 'dispatch', name: 'Dispatch', position: [10, -2, 0] as [number, number, number], color: '#eab308', icon: '📤' },
  { id: 'delivery', name: 'Delivery', position: [14, 0, 0] as [number, number, number], color: '#10b981', icon: '📥' },
  { id: 'locker', name: 'Locker', position: [18, 2, 0] as [number, number, number], color: '#14b8a6', icon: '🔒' },
  { id: 'in_use', name: 'In Use', position: [18, -2, 0] as [number, number, number], color: '#3b82f6', icon: '👕' },
];

const STATUS_STATION_MAP: Record<GarmentStatus, string> = {
  PROCURED: 'hospital',
  TAGGED: 'hospital',
  ALLOCATED: 'hospital',
  IN_USE: 'in_use',
  IN_LOCKER: 'locker',
  IN_TRANSIT: 'transport',
  RECEIVED_AT_PLANT: 'plant_gate',
  SORTING: 'plant_gate',
  WASHING: 'washing',
  DRYING: 'drying',
  QC_PENDING: 'qc',
  QC_PASSED: 'packing',
  QC_FAILED: 'qc',
  REPAIRING: 'qc',
  REPAIRED: 'packing',
  PACKED: 'packing',
  DISPATCHED: 'dispatch',
  DELIVERED: 'delivery',
  MISSING: 'hospital',
  LOST: 'hospital',
  DAMAGED: 'qc',
  RETIRED: 'hospital',
  DISPOSED: 'hospital',
};

interface GarmentParticleProps {
  garment: Garment;
  index: number;
  onClick: (garment: Garment) => void;
}

function GarmentParticle({ garment, index, onClick }: GarmentParticleProps) {
  const targetStation = STATIONS.find(s => s.id === STATUS_STATION_MAP[garment.status]) || STATIONS[0];
  const [position, setPosition] = useState<[number, number, number]>(STATIONS[0].position as [number, number, number]);
  const meshRef = useRef<THREE.Mesh>(null);
  const { camera } = useThree();

  useFrame((state, delta) => {
    if (!meshRef.current) return;
    
    const currentPos = new THREE.Vector3(...position);
    const targetPos = new THREE.Vector3(...targetStation.position);
    const distance = currentPos.distanceTo(targetPos);
    
    if (distance > 0.1) {
      const direction = targetPos.clone().sub(currentPos).normalize();
      const moveSpeed = 2;
      const newPos = currentPos.add(direction.multiplyScalar(moveSpeed * delta));
      setPosition([newPos.x, newPos.y, newPos.z]);
    }
    
    meshRef.current.rotation.y += delta * 0.5;
    meshRef.current.rotation.x = Math.sin(state.clock.getElapsedTime() * 2 + index) * 0.1;
  });

  useEffect(() => {
    setPosition(STATIONS[0].position as [number, number, number]);
  }, [garment.status]);

  return (
    <group position={position} onClick={() => onClick(garment)}>
      <RoundedBox args={[0.6, 0.8, 0.15]} radius={0.05} position={[0, 0, 0]}>
        <meshStandardMaterial 
          color={targetStation.color} 
          transparent 
          opacity={0.9}
          metalness={0.1}
          roughness={0.3}
        />
      </RoundedBox>
      <Html
        position={[0, -1.2, 0]}
        fullscreen
        occlude
        style={{ pointerEvents: 'none', transform: 'translate(-50%, -50%)' }}
      >
        <span style={{ 
          fontSize: '0.6rem', 
          color: '#666', 
          whiteSpace: 'nowrap',
          textShadow: '0 0 4px white'
        }}>
          {garment.assetId}
        </span>
      </Html>
    </group>
  );
}

function Station({ station, isActive }: { station: typeof STATIONS[0]; isActive: boolean }) {
  const [hovered, setHovered] = useState(false);
  const meshRef = useRef<THREE.Mesh>(null);

  useFrame((state) => {
    if (meshRef.current) {
      meshRef.current.rotation.y = Math.sin(state.clock.getElapsedTime()) * 0.1;
      meshRef.current.scale.setScalar(1 + Math.sin(state.clock.getElapsedTime() * 2) * 0.02);
    }
  });

  return (
    <group position={station.position} onPointerOver={() => setHovered(true)} onPointerOut={() => setHovered(false)}>
      <RoundedBox 
        ref={meshRef}
        args={[2, 1.5, 2]} 
        radius={0.2}
        position={[0, 0.75, 0]}
        onClick={() => console.log(station.name)}
      >
        <meshStandardMaterial 
          color={station.color} 
          transparent 
          opacity={isActive ? 0.8 : 0.4}
          metalness={0.2}
          roughness={0.3}
          emissive={isActive ? station.color : '#000'}
          emissiveIntensity={isActive ? 0.3 : 0}
        />
      </RoundedBox>
      <ContactShadows opacity={0.3} scale={1.5} />
      <Html
        position={[0, -1.2, 0]}
        fullscreen
        occlude
        style={{ pointerEvents: 'none', transform: 'translate(-50%, -50%)' }}
      >
        <div style={{ 
          display: 'flex', 
          flexDirection: 'column', 
          alignItems: 'center',
          gap: '2px',
          padding: '4px 8px',
          background: 'rgba(255,255,255,0.9)',
          borderRadius: '8px',
          boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
          backdropFilter: 'blur(4px)',
          minWidth: '80px',
        }}>
          <span style={{ fontSize: '1.2rem' }}>{station.icon}</span>
          <span style={{ 
            fontSize: '0.7rem', 
            fontWeight: 600, 
            color: '#333',
            textAlign: 'center'
          }}>
            {station.name}
          </span>
          {isActive && (
            <motion.div
              animate={{ scale: [1, 1.1, 1] }}
              transition={{ duration: 1, repeat: Infinity }}
              style={{ 
                fontSize: '0.6rem', 
                color: station.color, 
                fontWeight: 600 
              }}
            >
              ACTIVE
            </motion.div>
          )}
        </div>
      </Html>
    </group>
  );
}

function ConveyorPath() {
  return (
    <group>
      {STATIONS.slice(0, -1).map((station, i) => {
        const next = STATIONS[i + 1];
        const start = new THREE.Vector3(...station.position);
        const end = new THREE.Vector3(...next.position);
        const mid = start.clone().lerp(end, 0.5);
        const distance = start.distanceTo(end);
        
        return (
          <mesh
            key={station.id}
            position={[mid.x, 0.05, mid.z]}
            rotation={[0, Math.atan2(end.x - start.x, end.z - start.z), 0]}
          >
            <boxGeometry args={[0.15, 0.02, distance - 1.5]} />
            <meshStandardMaterial 
              color="#444" 
              transparent 
              opacity={0.4}
              metalness={0.5}
              roughness={0.5}
            />
          </mesh>
        );
      })}
    </group>
  );
}

export function GarmentLifecycle3D({ 
  garments, 
  onGarmentClick, 
  className 
}: { 
  garments: Garment[]; 
  onGarmentClick?: (garment: Garment) => void;
  className?: string;
}) {
  const [selectedGarment, setSelectedGarment] = useState<Garment | null>(null);
  const activeStations = new Set(
    garments.map(g => STATUS_STATION_MAP[g.status]).filter(Boolean)
  );

  return (
    <div className={cn('relative w-full h-[600px] rounded-xl bg-gradient-to-br from-whitefox-50 to-white-100 dark:from-whitefox-950 dark:to-whitefox-900', className)}>
      <Canvas
        camera={{ position: [3, 8, 15], fov: 50 }}
        style={{ width: '100%', height: '100%' }}
      >
        <Environment preset="city" />
        <PerspectiveCamera makeDefault position={[3, 8, 15]} />
        <OrbitControls 
          enablePan={true} 
          enableZoom={true} 
          enableRotate={true}
          minPolarAngle={0}
          maxPolarAngle={Math.PI / 2}
          minZoom={5}
          maxZoom={30}
        />
        
        <ambientLight intensity={0.6} />
        <directionalLight position={[5, 10, 5]} intensity={1} castShadow />
        <directionalLight position={[-5, 10, -5]} intensity={0.5} />
        
        <Stage 
          environment="city"
          shadows
        >
          <ConveyorPath />
          
          {STATIONS.map(station => (
            <Station 
              key={station.id} 
              station={station} 
              isActive={activeStations.has(station.id)} 
            />
          ))}
          
          {garments.slice(0, 50).map((garment, i) => (
            <GarmentParticle
              key={garment.id}
              garment={garment}
              index={i}
              onClick={onGarmentClick || (() => {})}
            />
          ))}
        </Stage>
      </Canvas>
      
      {selectedGarment && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="absolute bottom-4 left-4 right-4 md:left-auto md:right-4 md:bottom-4 md:top-4 md:w-80"
        >
          <div className="bg-card border border-border rounded-lg p-4 shadow-xl">
            <h4 className="font-semibold text-foreground mb-2">{selectedGarment.assetId}</h4>
            <div className="space-y-1 text-sm text-muted-foreground">
              <div><strong>Type:</strong> {selectedGarment.garmentType?.name || 'N/A'}</div>
              <div><strong>Status:</strong> <span className={cn('status-badge', getStatusColor(selectedGarment.status))}>{getStatusLabel(selectedGarment.status)}</span></div>
              <div><strong>Wash Count:</strong> {selectedGarment.washCount}</div>
              <div><strong>Location:</strong> {selectedGarment.currentBranch?.name || selectedGarment.currentDepartment?.name || 'N/A'}</div>
            </div>
            <button
              onClick={() => setSelectedGarment(null)}
              className="mt-3 w-full text-xs text-primary hover:underline"
            >
              Close Details
            </button>
          </div>
        </motion.div>
      )}
    </div>
  );
}

function group({ children, position, onClick, onPointerOver, onPointerOut }: any) {
  return (
    <group 
      position={position} 
      onClick={onClick}
      onPointerOver={onPointerOver}
      onPointerOut={onPointerOut}
    >
      {children}
    </group>
  );
}