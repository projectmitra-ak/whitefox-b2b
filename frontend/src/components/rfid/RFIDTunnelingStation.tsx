'use client';

import { useState, useEffect, Fragment } from 'react';
import {
  useWhiteFoxStore,
  type RFIDGateType,
  type RFIDGateScanRecord,
  GATE_LABELS,
  type MissingGarmentDetail,
} from '@/lib/store';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Radio,
  Sparkles,
  AlertTriangle,
  CheckCircle2,
  Play,
  Layers,
  ArrowRight,
  ShieldAlert,
  Building2,
  Shirt,
  Search,
  RefreshCw,
  Box,
  Truck,
  Flame,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { cn } from '@/lib/utils';

export function RFIDTunnelingStation() {
  const {
    tenants,
    employees,
    gateScans,
    triggerGateScan,
    triggerFullTunnelSequence,
  } = useWhiteFoxStore();

  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    setMounted(true);
  }, []);

  const [selectedTenantId, setSelectedTenantId] = useState<string>(tenants[0]?.id ?? 'tnt-1');
  const [simulateMissing, setSimulateMissing] = useState<boolean>(false);
  const [isScanning, setIsScanning] = useState<boolean>(false);
  const [activeScanningGate, setActiveScanningGate] = useState<RFIDGateType | null>(null);
  const [filterGate, setFilterGate] = useState<string>('ALL');
  const [expandedScanId, setExpandedScanId] = useState<string | null>(gateScans[0]?.id ?? null);

  const selectedTenant = tenants.find((t) => t.id === selectedTenantId) ?? tenants[0];
  const tenantEmployees = employees.filter((e) => e.tenantId === selectedTenant?.id);

  if (!mounted) {
    return (
      <div className="flex items-center justify-center min-h-[300px]">
        <div className="w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const handleSingleGateScan = async (gate: RFIDGateType) => {
    if (!selectedTenant) return;
    setIsScanning(true);
    setActiveScanningGate(gate);

    // Simulate 600ms RFID radio tunnel antenna reading
    setTimeout(() => {
      const scan = triggerGateScan(gate, selectedTenant.id, simulateMissing);
      setIsScanning(false);
      setActiveScanningGate(null);
      setExpandedScanId(scan.id);

      if (scan.missingCount > 0) {
        toast.error(
          `🚨 Alert: ${scan.missingCount} missing cloth detected at ${GATE_LABELS[gate].short} for ${selectedTenant.name}!`,
          { duration: 5000 }
        );
      } else {
        toast.success(
          `✅ ${GATE_LABELS[gate].short} scanned ${scan.detectedCount} tags successfully for ${selectedTenant.name}!`,
          { duration: 4000 }
        );
      }
    }, 700);
  };

  const handleFullPipelineScan = async () => {
    if (!selectedTenant) return;
    setIsScanning(true);
    setActiveScanningGate('GATE_1_COLLECTION');

    toast('📡 Initiating 3-Gate RFID Tunnel Sequence...', { icon: '🔄' });

    setTimeout(() => {
      setActiveScanningGate('GATE_2_CLEANING');
      setTimeout(() => {
        setActiveScanningGate('GATE_3_DELIVERY');
        setTimeout(() => {
          const scans = triggerFullTunnelSequence(selectedTenant.id, simulateMissing);
          setIsScanning(false);
          setActiveScanningGate(null);
          setExpandedScanId(scans[0].id);

          if (simulateMissing) {
            toast.error(
              `⚠️ Tunneling Sequence complete with Discrepancies! Notification dispatched to Admin.`,
              { duration: 6000 }
            );
          } else {
            toast.success(
              `🎉 All 3 Gates (Collection ➔ Cleaning ➔ Delivery) verified ${selectedTenant.name} garments!`,
              { duration: 5000 }
            );
          }
        }, 600);
      }, 600);
    }, 600);
  };

  const filteredScans = gateScans.filter((s) => {
    if (filterGate !== 'ALL' && s.gate !== filterGate) return false;
    return true;
  });

  const totalDiscrepancies = gateScans.filter((s) => s.status === 'DISCREPANCY_ALERT').length;

  return (
    <div className="space-y-6">
      {/* ── Top Header Card ── */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 p-6 text-white border border-indigo-900/60 shadow-xl">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/20 border border-indigo-400/30 text-indigo-300 text-xs font-semibold mb-3">
              <Radio className="w-3.5 h-3.5 text-indigo-400 animate-pulse" />
              Ultra-High Frequency (UHF) RFID Tunneling & Discrepancy Detection
            </div>
            <h2 className="text-2xl md:text-3xl font-black tracking-tight">
              3-Gate RFID Tunneling Station
            </h2>
            <p className="text-slate-300 text-sm mt-1.5 max-w-2xl">
              Simulate and monitor live garment tracking across all 3 key processing checkpoints:
              <strong> Collection Gate</strong>, <strong> Cleaning/Sterilization Gate</strong>, and
              <strong> Delivery Gate</strong> with automated client detection and missing cloth alerts.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <div className="bg-slate-800/80 border border-slate-700 rounded-xl p-3 text-center min-w-[120px]">
              <p className="text-xs text-slate-400 font-medium">Total Scans</p>
              <p className="text-xl font-bold text-white">{gateScans.length}</p>
            </div>
            <div className="bg-slate-800/80 border border-red-500/30 rounded-xl p-3 text-center min-w-[120px]">
              <p className="text-xs text-red-300 font-medium">Missing Alerts</p>
              <p className="text-xl font-bold text-red-400">{totalDiscrepancies}</p>
            </div>
          </div>
        </div>
      </div>

      {/* ── Interactive Tunneling Controls ── */}
      <Card className="border-2 border-indigo-100 dark:border-indigo-950 shadow-md">
        <CardHeader className="pb-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <CardTitle className="text-lg flex items-center gap-2">
                <Play className="w-5 h-5 text-indigo-600" />
                Live RFID Tunnel Scanner Controls
              </CardTitle>
              <CardDescription>
                Select a client organization and trigger individual gate scans or run the full 3-gate sequence
              </CardDescription>
            </div>

            {/* Missing Simulation Switch */}
            <div className="flex items-center gap-3 bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/50 px-4 py-2 rounded-xl">
              <input
                type="checkbox"
                id="missingToggle"
                checked={simulateMissing}
                onChange={(e) => setSimulateMissing(e.target.checked)}
                className="w-4 h-4 text-amber-600 rounded cursor-pointer accent-amber-600"
              />
              <label htmlFor="missingToggle" className="text-xs font-semibold text-amber-900 dark:text-amber-200 cursor-pointer select-none">
                Simulate Missing Cloth Discrepancy
              </label>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Client Selector & Quick Action Bar */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-center p-4 bg-muted/40 rounded-xl border">
            <div>
              <label className="text-xs font-semibold text-muted-foreground block mb-1.5">
                Target Client / Organization:
              </label>
              <Select value={selectedTenantId} onValueChange={setSelectedTenantId}>
                <SelectTrigger className="bg-background">
                  <SelectValue placeholder="Select Client" />
                </SelectTrigger>
                <SelectContent>
                  {tenants.map((t) => (
                    <SelectItem key={t.id} value={t.id}>
                      {t.name} ({t.code}) · {t.totalGarments} Garments
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="text-xs text-muted-foreground">
              <span className="font-semibold text-foreground">{selectedTenant?.name}</span>
              <p className="mt-0.5">
                {tenantEmployees.length} Staff · {selectedTenant?.totalGarments} Total RFID Tags
              </p>
            </div>

            <div className="flex justify-end">
              <Button
                onClick={handleFullPipelineScan}
                disabled={isScanning}
                className="bg-indigo-600 hover:bg-indigo-700 text-white gap-2 font-semibold shadow-md cursor-pointer w-full md:w-auto"
              >
                <RefreshCw className={cn('w-4 h-4', isScanning && 'animate-spin')} />
                Run Full 3-Gate Pipeline Scan
              </Button>
            </div>
          </div>

          {/* ── 3-Gate Tunnel Visual Stations ── */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {/* Gate 1: Collection Unit */}
            <div
              className={cn(
                'relative rounded-2xl border-2 p-5 transition-all bg-card flex flex-col justify-between shadow-sm',
                activeScanningGate === 'GATE_1_COLLECTION'
                  ? 'border-blue-500 ring-4 ring-blue-500/20 bg-blue-50/20'
                  : 'border-slate-200 dark:border-slate-800'
              )}
            >
              <div>
                <div className="flex items-center justify-between gap-2 mb-3">
                  <Badge className="bg-blue-600 text-white font-mono text-xs">GATE 1</Badge>
                  <span className="text-[11px] text-muted-foreground font-medium flex items-center gap-1">
                    <Radio className="w-3 h-3 text-blue-500" /> Intake Antenna #101
                  </span>
                </div>
                <h3 className="font-bold text-base text-foreground">Collection & Intake Unit</h3>
                <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
                  Scans soiled linen hamper carts upon arrival from <strong>{selectedTenant?.name}</strong>.
                  Verifies incoming garment count against expected employee quota.
                </p>

                <div className="mt-4 p-3 rounded-xl bg-blue-50 dark:bg-blue-950/30 border border-blue-100 dark:border-blue-900/40 text-xs text-blue-900 dark:text-blue-200 space-y-1">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Expected Garments:</span>
                    <span className="font-bold">{tenantEmployees.length || 4} pcs</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">RFID Tag Protocol:</span>
                    <span className="font-mono">EPC Gen2 / ISO 18000-6C</span>
                  </div>
                </div>
              </div>

              <div className="mt-5 pt-4 border-t">
                <Button
                  onClick={() => handleSingleGateScan('GATE_1_COLLECTION')}
                  disabled={isScanning}
                  size="sm"
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white gap-1.5 cursor-pointer font-medium"
                >
                  <Box className="w-4 h-4" />
                  Scan Gate 1 (Collection)
                </Button>
              </div>
            </div>

            {/* Gate 2: Cleaning & Sterilization Unit */}
            <div
              className={cn(
                'relative rounded-2xl border-2 p-5 transition-all bg-card flex flex-col justify-between shadow-sm',
                activeScanningGate === 'GATE_2_CLEANING'
                  ? 'border-amber-500 ring-4 ring-amber-500/20 bg-amber-50/20'
                  : 'border-slate-200 dark:border-slate-800'
              )}
            >
              <div>
                <div className="flex items-center justify-between gap-2 mb-3">
                  <Badge className="bg-amber-600 text-white font-mono text-xs">GATE 2</Badge>
                  <span className="text-[11px] text-muted-foreground font-medium flex items-center gap-1">
                    <Flame className="w-3 h-3 text-amber-500" /> Wash Tunnel #202
                  </span>
                </div>
                <h3 className="font-bold text-base text-foreground">Cleaning & Sterilization Unit</h3>
                <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
                  Automated scan during passage through continuous batch washers and barrier dryers.
                  Increments wash count and validates thermal disinfection.
                </p>

                <div className="mt-4 p-3 rounded-xl bg-amber-50 dark:bg-amber-950/30 border border-amber-100 dark:border-amber-900/40 text-xs text-amber-900 dark:text-amber-200 space-y-1">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Disinfection Temp:</span>
                    <span className="font-bold">75°C Barrier Cycle</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">QC Tag Validation:</span>
                    <span className="font-bold text-green-600">Auto-increment</span>
                  </div>
                </div>
              </div>

              <div className="mt-5 pt-4 border-t">
                <Button
                  onClick={() => handleSingleGateScan('GATE_2_CLEANING')}
                  disabled={isScanning}
                  size="sm"
                  className="w-full bg-amber-600 hover:bg-amber-700 text-white gap-1.5 cursor-pointer font-medium"
                >
                  <RefreshCw className="w-4 h-4" />
                  Scan Gate 2 (Cleaning)
                </Button>
              </div>
            </div>

            {/* Gate 3: Delivery & Dispatch Unit */}
            <div
              className={cn(
                'relative rounded-2xl border-2 p-5 transition-all bg-card flex flex-col justify-between shadow-sm',
                activeScanningGate === 'GATE_3_DELIVERY'
                  ? 'border-emerald-500 ring-4 ring-emerald-500/20 bg-emerald-50/20'
                  : 'border-slate-200 dark:border-slate-800'
              )}
            >
              <div>
                <div className="flex items-center justify-between gap-2 mb-3">
                  <Badge className="bg-emerald-600 text-white font-mono text-xs">GATE 3</Badge>
                  <span className="text-[11px] text-muted-foreground font-medium flex items-center gap-1">
                    <Truck className="w-3 h-3 text-emerald-500" /> Dispatch Dock #303
                  </span>
                </div>
                <h3 className="font-bold text-base text-foreground">Delivery & Dispatch Unit</h3>
                <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
                  Final outbound gate at dispatch bay. Scans bagged/sealed uniforms before loading into
                  delivery vehicles for outbound transit.
                </p>

                <div className="mt-4 p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-100 dark:border-emerald-900/40 text-xs text-emerald-900 dark:text-emerald-200 space-y-1">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Dispatch Status:</span>
                    <span className="font-bold text-emerald-600">PACKED & READY</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Driver Handover:</span>
                    <span className="font-semibold">Auto-generate Manifest</span>
                  </div>
                </div>
              </div>

              <div className="mt-5 pt-4 border-t">
                <Button
                  onClick={() => handleSingleGateScan('GATE_3_DELIVERY')}
                  disabled={isScanning}
                  size="sm"
                  className="w-full bg-emerald-600 hover:bg-emerald-700 text-white gap-1.5 cursor-pointer font-medium"
                >
                  <Truck className="w-4 h-4" />
                  Scan Gate 3 (Delivery)
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* ── Gate Scan Audit History & Discrepancy Log ── */}
      <Card>
        <CardHeader className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-3">
          <div>
            <CardTitle className="text-lg flex items-center gap-2">
              <Layers className="w-5 h-5 text-indigo-600" />
              RFID Gate Scan Audit Stream & Discrepancy History
            </CardTitle>
            <CardDescription>
              Chronological log of all gate pass-through detections, detected counts, and missing garment alerts
            </CardDescription>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs text-muted-foreground font-semibold">Filter Gate:</span>
            <Select value={filterGate} onValueChange={setFilterGate}>
              <SelectTrigger className="w-48 text-xs h-9">
                <SelectValue placeholder="All Gates" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">All 3 Gates</SelectItem>
                <SelectItem value="GATE_1_COLLECTION">Gate 1: Collection</SelectItem>
                <SelectItem value="GATE_2_CLEANING">Gate 2: Cleaning</SelectItem>
                <SelectItem value="GATE_3_DELIVERY">Gate 3: Delivery</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/40">
                <TableHead>Gate & Location</TableHead>
                <TableHead>Client / Tenant</TableHead>
                <TableHead>Detected / Expected</TableHead>
                <TableHead>Scan Status</TableHead>
                <TableHead>Timestamp</TableHead>
                <TableHead className="text-right">Details</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredScans.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-10 text-muted-foreground">
                    No scans recorded yet. Use the scanner above to trigger a gate detection.
                  </TableCell>
                </TableRow>
              ) : (
                filteredScans.map((scan) => {
                  const isExpanded = expandedScanId === scan.id;
                  const isAlert = scan.status === 'DISCREPANCY_ALERT';
                  const gateInfo = GATE_LABELS[scan.gate];

                  return (
                    <Fragment key={scan.id}>
                      <TableRow
                        onClick={() => setExpandedScanId(isExpanded ? null : scan.id)}
                        className={cn(
                          'cursor-pointer transition-colors',
                          isAlert
                            ? 'bg-red-50/60 hover:bg-red-100/60 dark:bg-red-950/20'
                            : 'hover:bg-muted/40'
                        )}
                      >
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Badge className={cn('text-xs font-semibold', gateInfo.color)}>
                              {gateInfo.short}
                            </Badge>
                            <span className="text-xs text-muted-foreground font-mono">
                              {scan.gateLocation}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <p className="font-semibold text-sm">{scan.tenantName}</p>
                          <Badge variant="outline" className="text-[10px]">
                            {scan.tenantCode}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <span
                            className={cn(
                              'font-mono font-bold text-sm',
                              isAlert ? 'text-red-600' : 'text-emerald-600'
                            )}
                          >
                            {scan.detectedCount} / {scan.expectedCount} pcs
                          </span>
                        </TableCell>
                        <TableCell>
                          {isAlert ? (
                            <Badge className="bg-red-100 text-red-800 border-red-300 gap-1 animate-pulse">
                              <AlertTriangle className="w-3 h-3 text-red-600" />
                              {scan.missingCount} Missing Cloth!
                            </Badge>
                          ) : (
                            <Badge className="bg-emerald-100 text-emerald-800 border-emerald-300 gap-1">
                              <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                              100% Verified
                            </Badge>
                          )}
                        </TableCell>
                        <TableCell className="text-xs text-muted-foreground">{scan.scannedAt}</TableCell>
                        <TableCell className="text-right">
                          <Button variant="ghost" size="sm" className="text-xs font-semibold text-indigo-600">
                            {isExpanded ? 'Hide Details' : 'View Audit'}
                          </Button>
                        </TableCell>
                      </TableRow>

                      {/* Expanded Scan Breakdown */}
                      {isExpanded && (
                        <TableRow className="bg-slate-50/90 dark:bg-slate-900/80 border-b">
                          <TableCell colSpan={6} className="p-4">
                            <div className="space-y-3">
                              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 border-b">
                                <p className="text-xs font-bold text-foreground">
                                  Operator Notes: <span className="font-normal text-muted-foreground">{scan.operatorNotes}</span>
                                </p>
                                <span className="text-xs text-muted-foreground font-mono">ID: {scan.id}</span>
                              </div>

                              {/* ── Inlet & Outlet RFID Telemetry Details ── */}
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-2">
                                {/* Inlet Details Box */}
                                <div className="p-3 rounded-xl bg-blue-50/60 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-900 space-y-2 text-xs">
                                  <div className="flex items-center justify-between border-b border-blue-200 dark:border-blue-800 pb-1.5">
                                    <span className="font-bold text-blue-900 dark:text-blue-200 flex items-center gap-1.5">
                                      📥 Gate Inlet Details (Inbound)
                                    </span>
                                    <Badge className="bg-blue-600 text-white text-[10px]">
                                      {scan.telemetry?.inletCount ?? scan.expectedCount} Tags In
                                    </Badge>
                                  </div>
                                  <div className="space-y-1 text-slate-700 dark:text-slate-300">
                                    <div className="flex justify-between">
                                      <span className="text-muted-foreground">Inlet Timestamp:</span>
                                      <span className="font-mono font-semibold">{scan.telemetry?.inletTimestamp ?? '09:28:45 AM'}</span>
                                    </div>
                                    <div className="flex justify-between">
                                      <span className="text-muted-foreground">Inlet Infeed Source:</span>
                                      <span className="font-medium text-right truncate max-w-[200px]">{scan.telemetry?.inletSource ?? 'Hospital Intake Chute'}</span>
                                    </div>
                                    <div className="flex justify-between">
                                      <span className="text-muted-foreground">Sensor Power:</span>
                                      <span className="font-mono">{scan.telemetry?.antennaPowerDb ?? 31.5} dBm (UHF 865-868 MHz)</span>
                                    </div>
                                  </div>
                                </div>

                                {/* Outlet Details Box */}
                                <div className="p-3 rounded-xl bg-emerald-50/60 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-900 space-y-2 text-xs">
                                  <div className="flex items-center justify-between border-b border-emerald-200 dark:border-emerald-800 pb-1.5">
                                    <span className="font-bold text-emerald-900 dark:text-emerald-200 flex items-center gap-1.5">
                                      📤 Gate Outlet Details (Outbound)
                                    </span>
                                    <Badge className="bg-emerald-600 text-white text-[10px]">
                                      {scan.telemetry?.outletCount ?? scan.detectedCount} Tags Out
                                    </Badge>
                                  </div>
                                  <div className="space-y-1 text-slate-700 dark:text-slate-300">
                                    <div className="flex justify-between">
                                      <span className="text-muted-foreground">Outlet Timestamp:</span>
                                      <span className="font-mono font-semibold">{scan.telemetry?.outletTimestamp ?? '09:30:12 AM'}</span>
                                    </div>
                                    <div className="flex justify-between">
                                      <span className="text-muted-foreground">Outlet Destination:</span>
                                      <span className="font-medium text-right truncate max-w-[200px]">{scan.telemetry?.outletDestination ?? 'Disinfection Line'}</span>
                                    </div>
                                    <div className="flex justify-between">
                                      <span className="text-muted-foreground">Read Throughput:</span>
                                      <span className="font-mono font-semibold text-emerald-600">{scan.telemetry?.throughputPerMinute ?? 48} tags/min</span>
                                    </div>
                                  </div>
                                </div>
                              </div>

                              {/* Missing Cloth Alert Details */}
                              {scan.missingGarments.length > 0 && (
                                <div className="p-3.5 bg-red-100/80 dark:bg-red-950/50 border border-red-300 dark:border-red-900 rounded-xl space-y-2">
                                  <div className="flex items-center gap-2 text-red-800 dark:text-red-200 font-bold text-xs">
                                    <ShieldAlert className="w-4 h-4 text-red-600" />
                                    Missing Garments Identified by System:
                                  </div>
                                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                                    {scan.missingGarments.map((missing, idx) => (
                                      <div
                                        key={idx}
                                        className="bg-white dark:bg-card p-2.5 rounded-lg border border-red-200 shadow-sm text-xs space-y-0.5"
                                      >
                                        <div className="flex items-center justify-between">
                                          <span className="font-mono font-bold text-red-700 dark:text-red-400">
                                            {missing.assetId}
                                          </span>
                                          <Badge variant="outline" className="bg-red-50 text-red-700 text-[10px]">
                                            MISSING
                                          </Badge>
                                        </div>
                                        <p className="text-foreground font-medium">
                                          Staff: {missing.employeeName} ({missing.employeeCode})
                                        </p>
                                        <p className="text-muted-foreground text-[11px]">
                                          Dept: {missing.department} · {missing.garmentType}
                                        </p>
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              )}

                              {/* Detected RFID Asset Tags */}
                              {scan.detectedAssetIds.length > 0 && (
                                <div>
                                  <p className="text-xs font-semibold text-muted-foreground mb-1.5">
                                    Successfully Verified RFID Asset Tags ({scan.detectedAssetIds.length}):
                                  </p>
                                  <div className="flex flex-wrap gap-1.5">
                                    {scan.detectedAssetIds.map((tag, idx) => (
                                      <Badge
                                        key={idx}
                                        variant="outline"
                                        className="bg-emerald-50 text-emerald-800 border-emerald-200 font-mono text-[11px] py-0.5"
                                      >
                                        {tag}
                                      </Badge>
                                    ))}
                                  </div>
                                </div>
                              )}
                            </div>
                          </TableCell>
                        </TableRow>
                      )}
                    </Fragment>
                  );
                })
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
