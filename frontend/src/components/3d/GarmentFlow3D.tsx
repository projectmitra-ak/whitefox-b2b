'use client';

import { Canvas, useFrame } from '@react-three/fiber';
import { Html, OrbitControls, PerspectiveCamera, Stage, Environment } from '@react-three/drei';
import { useState, useRef, useEffect, useMemo } from 'react';
import { motion } from 'framer-motion';
import * as THREE from 'three';
import { Garment, Tenant } from '@/types';
import { cn } from '@/lib/utils';

interface GarmentFlow3DProps {
  garments: Garment[];
  tenants: Tenant[];
  selectedTenantId?: string;
  onTenantSelect?: (tenantId: string) => void;
  className?: string;
}

const FLOW_STAGES = [
  { id: 'hospital', name: 'Hospital', x: -15, color: '#3b82f6', icon: '🏥' },
  { id: 'locker', name: 'Locker', x: -12, color: '#22c55e', icon: '🔒' },
  { id: 'pickup', name: 'Pickup', x: -9, color: '#6366f1', icon: '🚚' },
  { id: 'transport', name: 'Transport', x: -6, color: '#8b5cf6', icon: '🛣️' },
  { id: 'plant_receiving', name: 'Receiving', x: -3, color: '#ec4899', icon: '📥' },
  { id: 'washing', name: 'Washing', x: 0, color: '#06b6d4', icon: '💧' },
  { id: 'drying', name: 'Drying', x: 3, color: '#f59e0b', icon: '☀️' },
  { id: 'qc', name: 'QC', x: 6, color: '#22c55e', icon: '✅' },
  { id: 'packing', name: 'Packing', x: 9, color: '#84cc16', icon: '📦' },
  { id: 'dispatch', name: 'Dispatch', x: 12, color: '#eab308', icon: '📤' },
  { id: 'delivery', name: 'Delivery', x: 15, color: '#10b981', icon: '📥' },
];

const STATUS_TO_STAGE: Record<string, string> = {
  IN_USE: 'hospital',
  IN_LOCKER: 'locker',
  IN_TRANSIT: 'transport',
  RECEIVED_AT_PLANT: 'plant_receiving',
  SORTING: 'plant_receiving',
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
};

function FlowStage({ stage, count, isHovered, onClick, isActive }: { 
  stage: typeof FLOW_STAGES[0]; 
  count: number;
  isHovered: boolean;
  onClick: () => void;
  isActive: boolean;
}) {
  const [pulse, setPulse] = useState(false);

  useEffect(() => {
    if (isActive && count > 0) {
      const interval = setInterval(() => setPulse(p => !p), 1000);
      return () => clearInterval(interval);
    }
  }, [isActive, count]);

  return (
    <group position={[stage.x, 0, 0]} onClick={onClick} onPointerOver={() => {}} onPointerOut={() => {}}>
      <mesh
        castShadow
        receiveShadow
        position={[0, 1.5, 0]}
        scale={isHovered || pulse ? [1.15, 1.1, 1.15] : [1, 1, 1]}
      >
        <cylinderGeometry args={[1.5, 1.5, 3, 12]} />
        <meshStandardMaterial
          color={stage.color}
          transparent
          opacity={isActive ? 0.85 : 0.4}
          metalness={0.1}
          roughness={0.4}
          emissive={isActive ? stage.color : '#000'}
          emissiveIntensity={isActive ? 0.3 : 0}
        />
      </mesh>
      
      <mesh
        castShadow
        receiveShadow
        position={[0, 3.1, 0]}
      >
        <cylinderGeometry args={[1.8, 1.8, 0.3, 12]} />
        <meshStandardMaterial color={stage.color} transparent opacity={0.6} />
      </mesh>
      
      <Html
        position={[0, 4.5, 0]}
        fullscreen
        occlude
        style={{ pointerEvents: 'none', transform: 'translate(-50%, -50%)' }}
      >
        <div style={{ 
          display: 'flex', 
          flexDirection: 'column', 
          alignItems: 'center',
          gap: '2px',
          padding: '8px 12px',
          background: 'rgba(255,255,255,0.95)',
          borderRadius: '10px',
          boxShadow: '0 4px 16px rgba(0,0,0,0.15)',
          backdropFilter: 'blur(8px)',
          minWidth: '100px',
          border: isHovered ? `2px solid ${stage.color}` : '1px solid rgba(0,0,0,0.1)',
        }}>
          <div style={{ fontSize: '1.3rem' }}>{stage.icon}</div>
          <div style={{ fontSize: '0.7rem', fontWeight: 700, color: stage.color, letterSpacing: '0.05em' }}>
            {stage.name}
          </div>
          <div style={{ 
            fontSize: '1rem', 
            fontWeight: 800, 
            color: isActive ? stage.color : '#333',
            textShadow: isActive ? `0 0 8px ${stage.color}` : 'none'
          }}>
            {count}
          </div>
          {isActive && (
            <motion.div
              animate={{ opacity: [1, 0.3, 1] }}
              transition={{ duration: 1, repeat: Infinity }}
              style={{ fontSize: '0.55rem', color: stage.color, fontWeight: 600 }}
            >
              FLOWING
            </motion.div>
          )}
        </div>
      </Html>
    </group>
  );
}

function FlowParticle({ 
  garment, 
  index, 
  targetX, 
  color 
}: { 
  garment: Garment; 
  index: number; 
  targetX: number; 
  color: string;
}) {
  const [position, setPosition] = useState<[number, number, number]>([-15 + Math.random() * 3, 1 + Math.random() * 2, (Math.random() - 0.5) * 8]);
  const meshRef = useRef<THREE.Mesh>(null);

  useFrame((state, delta) => {
    if (!meshRef.current) return;
    
    const currentPos = new THREE.Vector3(...position);
    const targetPos = new THREE.Vector3(targetX, position[1], position[2]);
    const distance = currentPos.distanceTo(targetPos);
    
    if (distance > 0.1) {
      const direction = targetPos.clone().sub(currentPos).normalize();
      const moveSpeed = 3 + Math.sin(state.clock.getElapsedTime() + index) * 1;
      const newPos = currentPos.add(direction.multiplyScalar(moveSpeed * delta));
      setPosition([newPos.x, newPos.y, newPos.z]);
    } else {
      setPosition([-15 + Math.random() * 3, 1 + Math.random() * 2, (Math.random() - 0.5) * 8]);
    }
    
    meshRef.current.rotation.y += delta * 2;
    meshRef.current.rotation.x = Math.sin(state.clock.getElapsedTime() * 3 + index) * 0.1;
  });

  return (
    <group position={position}>
      <mesh ref={meshRef} castShadow>
        <octahedronGeometry args={[0.25, 0]} />
        <meshStandardMaterial 
          color={color} 
          transparent 
          opacity={0.9}
          metalness={0.3}
          roughness={0.2}
        />
      </mesh>
    </group>
  );
}

function ConnectorLine({ fromX, toX, isActive }: { fromX: number; toX: number; isActive: boolean }) {
  const midX = (fromX + toX) / 2;
  const distance = Math.abs(toX - fromX);
  
  return (
    <mesh
      position={[midX, 0.05, 0]}
      rotation={[0, 0, 0]}
    >
      <boxGeometry args={[0.1, 0.02, distance - 0.5]} />
      <meshStandardMaterial 
        color={isActive ? '#333' : '#ccc'} 
        transparent 
        opacity={isActive ? 0.6 : 0.2}
      />
    </mesh>
  );
}

export function GarmentFlow3D({ 
  garments, 
  tenants, 
  selectedTenantId, 
  onTenantSelect, 
  className 
}: GarmentFlow3DProps) {
  const [hoveredStage, setHoveredStage] = useState<string | null>(null);
  const [hoveredTenant, setHoveredTenant] = useState<string | null>(null);

  const tenantFlowData = useMemo(() => {
    const data: Record<string, Record<string, number>> = {};
    
    tenants.forEach(tenant => {
      data[tenant.id] = {};
      FLOW_STAGES.forEach(stage => {
        data[tenant.id][stage.id] = 0;
      });
    });

    garments.forEach(garment => {
      if (selectedTenantId && garment.tenantId !== selectedTenantId) return;
      if (!selectedTenantId && garment.tenantId && !data[garment.tenantId]) {
        data[garment.tenantId] = {};
        FLOW_STAGES.forEach(stage => {
          data[garment.tenantId][stage.id] = 0;
        });
      }
      
      const stageId = STATUS_TO_STAGE[garment.status] || 'hospital';
      if (data[garment.tenantId]) {
        data[garment.tenantId][stageId] = (data[garment.tenantId][stageId] || 0) + 1;
      }
    });

    return data;
  }, [garments, tenants, selectedTenantId]);

  const activeTenantId = selectedTenantId || tenants[0]?.id;
  const flowData = activeTenantId ? tenantFlowData[activeTenantId] : {};

  const totalFlowing = Object.values(flowData).reduce((sum, count) => sum + count, 0);

  return (
    <div className={cn('relative w-full h-[600px] rounded-xl bg-gradient-to-br from-whitefox-50 via-white to-slate-50 dark:from-whitefox-950 dark:via-whitefox-900 dark:to-slate-900', className)}>
      <Canvas
        camera={{ position: [0, 10, 35], fov: 40 }}
        style={{ width: '100%', height: '100%' }}
      >
        <Environment preset="city" />
        <PerspectiveCamera makeDefault position={[0, 10, 35]} />
        <OrbitControls 
          enablePan={true} 
          enableZoom={true} 
          enableRotate={true}
          minPolarAngle={0}
          maxPolarAngle={Math.PI / 2.5}
          minZoom={15}
          maxZoom={60}
        />
        
        <ambientLight intensity={0.7} />
        <directionalLight position={[10, 20, 10]} intensity={1.2} castShadow />
        <directionalLight position={[-10, 20, -10]} intensity={0.4} />
        
        <Stage environment="city" shadows>
          <gridHelper args={[60, 60, '#e5e7eb', '#e5e7eb']} position={[0, -0.1, 0]} />
          
          {FLOW_STAGES.slice(0, -1).map((stage, i) => {
            const nextStage = FLOW_STAGES[i + 1];
            const isActive = (flowData[stage.id] || 0) > 0 && (flowData[nextStage.id] || 0) > 0;
            return <ConnectorLine key={stage.id} fromX={stage.x} toX={nextStage.x} isActive={isActive} />;
          })}
          
          {FLOW_STAGES.map(stage => (
            <FlowStage
              key={stage.id}
              stage={stage}
              count={flowData[stage.id] || 0}
              isHovered={hoveredStage === stage.id}
              isActive={(flowData[stage.id] || 0) > 0}
              onClick={() => setHoveredStage(stage.id)}
            />
          ))}
          
          {garments
            .filter(g => !selectedTenantId || g.tenantId === selectedTenantId)
            .slice(0, 100)
            .map((garment, i) => {
              const stageId = STATUS_TO_STAGE[garment.status] || 'hospital';
              const stage = FLOW_STAGES.find(s => s.id === stageId) || FLOW_STAGES[0];
              const tenantColor = tenants.find(t => t.id === garment.tenantId)?.code 
                ? `hsl(${(tenants.findIndex(t => t.id === garment.tenantId) * 47) % 360}, 70%, 50%)`
                : stage.color;
              
              return (
                <FlowParticle
                  key={garment.id}
                  garment={garment}
                  index={i}
                  targetX={stage.x}
                  color={tenantColor}
                />
              );
            })}
        </Stage>
      </Canvas>
      
      <div className="absolute top-4 left-4 right-4 flex flex-col gap-4 px-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-foreground">Live Garment Flow</h3>
          <div className="flex items-center gap-4 text-sm text-muted-foreground">
            <span>Total Active: <span className="font-bold text-primary">{totalFlowing}</span></span>
            {tenants.length > 1 && (
              <select
                value={selectedTenantId || 'all'}
                onChange={(e) => onTenantSelect?.(e.target.value === 'all' ? '' : e.target.value)}
                className="px-2 py-1 bg-white/80 dark:bg-slate-800/80 border border-border rounded-lg text-sm"
              >
                <option value="all">All Tenants</option>
                {tenants.map(t => (
                  <option key={t.id} value={t.id}>{t.name}</option>
                ))}
              </select>
            )}
          </div>
        </div>
        
        <div className="flex gap-2 overflow-x-auto pb-2">
          {FLOW_STAGES.map(stage => (
            <div
              key={stage.id}
              className={cn(
                'flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-medium whitespace-nowrap transition-all shrink-0',
                hoveredStage === stage.id
                  ? 'bg-white dark:bg-slate-800 shadow-lg'
                  : 'bg-white/70 dark:bg-slate-800/70'
              )}
              onMouseEnter={() => setHoveredStage(stage.id)}
              onMouseLeave={() => setHoveredStage(null)}
            >
              <span>{stage.icon}</span>
              <span style={{ color: stage.color }}>{stage.name}</span>
              <span className={cn(
                'px-2 py-0.5 rounded-full font-bold',
                (flowData[stage.id] || 0) > 0 ? 'bg-primary/20 text-primary' : 'bg-muted text-muted-foreground'
              )}>
                {flowData[stage.id] || 0}
              </span>
            </div>
          ))}
        </div>
      </div>
      
      <div className="absolute bottom-4 left-4 right-4 flex justify-center items-center gap-6 px-4">
        <div className="flex gap-4 text-xs text-muted-foreground">
          <span>🏥 Hospital</span>
          <span>🔒 Locker</span>
          <span>🚚 Pickup</span>
          <span>🛣️ Transport</span>
          <span>📥 Receiving</span>
          <span>💧 Washing</span>
          <span>☀️ Drying</span>
          <span>✅ QC</span>
          <span>📦 Packing</span>
          <span>📤 Dispatch</span>
          <span>📥 Delivery</span>
        </div>
      </div>
    </div>
  );
}