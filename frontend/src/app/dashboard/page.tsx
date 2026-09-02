'use client';

import { useState } from 'react';
import { cn, formatNumber, getStatusColor } from '@/lib/utils';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  Package, 
  Truck, 
  AlertTriangle, 
  CheckCircle, 
  Clock, 
  RefreshCw, 
  TrendingUp, 
  TrendingDown, 
  Users, 
  Factory, 
  RotateCcw,
  Shirt,
  ShieldCheck
} from 'lucide-react';
import { motion } from 'framer-motion';

const STAT_CARDS = [
  { title: 'Total Garments', value: '12,450', change: '+2.3%', trend: 'up', icon: Package, color: 'text-whitefox-600', bg: 'bg-whitefox-50 dark:bg-whitefox-950/50' },
  { title: 'Currently Issued', value: '4,120', change: '+1.1%', trend: 'up', icon: Users, color: 'text-blue-600', bg: 'bg-blue-50 dark:bg-blue-950/50' },
  { title: 'In Laundry', value: '3,840', change: '-0.5%', trend: 'down', icon: Factory, color: 'text-orange-600', bg: 'bg-orange-50 dark:bg-orange-950/50' },
  { title: 'Ready for Delivery', value: '2,910', change: '+3.2%', trend: 'up', icon: Truck, color: 'text-green-600', bg: 'bg-green-50 dark:bg-green-950/50' },
  { title: 'Missing', value: '126', change: '-12', trend: 'down', icon: AlertTriangle, color: 'text-red-600', bg: 'bg-red-50 dark:bg-red-950/50' },
  { title: 'Under QC', value: '248', change: '+8', trend: 'up', icon: CheckCircle, color: 'text-purple-600', bg: 'bg-purple-50 dark:bg-purple-950/50' },
];

const STATUS_DISTRIBUTION = [
  { status: 'IN_USE', count: 4120, label: 'In Use' },
  { status: 'IN_LOCKER', count: 1890, label: 'In Locker' },
  { status: 'IN_LAUNDRY', count: 3840, label: 'In Laundry' },
  { status: 'IN_TRANSIT', count: 560, label: 'In Transit' },
  { status: 'WASHING', count: 1240, label: 'Washing' },
  { status: 'DRYING', count: 980, label: 'Drying' },
  { status: 'QC_PENDING', count: 248, label: 'QC Pending' },
  { status: 'QC_PASSED', count: 1890, label: 'QC Passed' },
  { status: 'PACKED', count: 1020, label: 'Packed' },
  { status: 'DISPATCHED', count: 560, label: 'Dispatched' },
  { status: 'DELIVERED', count: 320, label: 'Delivered' },
  { status: 'MISSING', count: 126, label: 'Missing' },
];

const RECENT_ALERTS = [
  { id: 1, type: 'missing', message: '3 garments missing at Hospital A - ICU', time: '5 min ago', severity: 'high' },
  { id: 2, type: 'sla', message: 'SLA risk: Delivery to Hospital B delayed by 2 hours', time: '12 min ago', severity: 'high' },
  { id: 3, type: 'qc', message: 'QC failure rate 15% above threshold at Plant 1', time: '25 min ago', severity: 'medium' },
  { id: 4, type: 'rotation', message: 'Set rotation overdue for 12 employees', time: '1 hour ago', severity: 'medium' },
  { id: 5, type: 'maintenance', message: 'Washer #3 scheduled for maintenance tomorrow', time: '2 hours ago', severity: 'low' },
];

const QUICK_ACTIONS = [
  { label: 'New Pickup Request', icon: Truck, href: '/laundry', color: 'bg-whitefox-600' },
  { label: 'Rotate Sets', icon: RotateCcw, href: '/employees', color: 'bg-blue-600' },
  { label: 'Start Wash Batch', icon: Factory, href: '/laundry', color: 'bg-orange-600' },
  { label: 'Run Reconciliation', icon: RefreshCw, href: '/reconciliation', color: 'bg-green-600' },
  { label: 'View Missing Items', icon: AlertTriangle, href: '/garments', color: 'bg-red-600' },
  { label: 'View Inventory', icon: Package, href: '/inventory', color: 'bg-purple-600' },
];

export default function DashboardPage() {
  const [selectedTenant, setSelectedTenant] = useState('all');

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Dashboard</h1>
          <p className="text-muted-foreground">Real-time overview of your laundry operations</p>
        </div>
        <div className="flex items-center gap-3">
          <Select value={selectedTenant} onValueChange={setSelectedTenant}>
            <SelectTrigger className="w-[220px]">
              <SelectValue placeholder="All Tenants" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Tenants (Organizations)</SelectItem>
              <SelectItem value="tenant-1">City General Hospital</SelectItem>
              <SelectItem value="tenant-2">Metro Medical Center</SelectItem>
              <SelectItem value="tenant-3">Grand Hotel Chain</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline" size="sm">
            <RefreshCw className="mr-2 h-4 w-4" />
            Refresh
          </Button>
        </div>
      </div>

      {/* Stat Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
        {STAT_CARDS.map((stat, index) => (
          <motion.div
            key={stat.title}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.05 }}
            className={cn('relative overflow-hidden rounded-xl border p-5 transition-all hover:shadow-md', stat.bg)}
          >
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs font-medium text-muted-foreground">{stat.title}</p>
                <p className="text-2xl font-bold text-foreground mt-1">{stat.value}</p>
                <div className="flex items-center gap-1 mt-2">
                  {stat.trend === 'up' ? (
                    <TrendingUp className={cn('h-3.5 w-3.5', stat.color)} />
                  ) : (
                    <TrendingDown className={cn('h-3.5 w-3.5', stat.color)} />
                  )}
                  <span className={cn('text-xs font-semibold', stat.color)}>{stat.change}</span>
                </div>
              </div>
              <div className={cn('p-2.5 rounded-lg', stat.bg)}>
                <stat.icon className={cn('h-6 w-6', stat.color)} />
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Main Content Grid */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Left Column - Operational Stages */}
        <div className="lg:col-span-2 space-y-6">
          <Tabs defaultValue="lifecycle" className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="lifecycle">Garment Lifecycle Stages</TabsTrigger>
              <TabsTrigger value="plant">Plant Wash Batches</TabsTrigger>
              <TabsTrigger value="flow">Garment Flow Summary</TabsTrigger>
            </TabsList>

            <TabsContent value="lifecycle" className="mt-4 space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Shirt className="h-5 w-5 text-primary" /> Lifecycle Stages Overview
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                    {[
                      { stage: '1. Issued / In Use', count: '4,120', desc: 'Assigned to employees', color: 'bg-blue-50 border-blue-200 text-blue-800' },
                      { stage: '2. In Locker', count: '1,890', desc: 'Ready for shift change', color: 'bg-emerald-50 border-emerald-200 text-emerald-800' },
                      { stage: '3. In Wash Batch', count: '3,840', desc: 'Processing at laundry plant', color: 'bg-orange-50 border-orange-200 text-orange-800' },
                      { stage: '4. Dispatched', count: '2,600', desc: 'In transit / Delivery', color: 'bg-purple-50 border-purple-200 text-purple-800' },
                    ].map((item) => (
                      <div key={item.stage} className={cn('p-4 rounded-xl border', item.color)}>
                        <p className="text-xs font-semibold uppercase tracking-wider opacity-80">{item.stage}</p>
                        <p className="text-2xl font-bold mt-1">{item.count}</p>
                        <p className="text-xs mt-1 opacity-90">{item.desc}</p>
                      </div>
                    ))}
                  </div>

                  <div className="border rounded-lg p-4 bg-muted/30">
                    <h4 className="text-sm font-semibold mb-3">Live Stage Distribution</h4>
                    <div className="space-y-3">
                      {[
                        { name: 'Active In-Use Garments', percentage: 33, color: 'bg-blue-500' },
                        { name: 'Locker Assigned Set B', percentage: 15, color: 'bg-emerald-500' },
                        { name: 'Laundry Plant Processing', percentage: 31, color: 'bg-orange-500' },
                        { name: 'Quality Inspection & Repair', percentage: 12, color: 'bg-purple-500' },
                        { name: 'Dispatch & Transit', percentage: 9, color: 'bg-indigo-500' },
                      ].map((bar) => (
                        <div key={bar.name} className="space-y-1">
                          <div className="flex justify-between text-xs font-medium">
                            <span>{bar.name}</span>
                            <span>{bar.percentage}%</span>
                          </div>
                          <div className="h-2 w-full bg-muted rounded-full overflow-hidden">
                            <div className={cn('h-full rounded-full', bar.color)} style={{ width: `${bar.percentage}%` }} />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="plant" className="mt-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Factory className="h-5 w-5 text-orange-600" /> Active Plant Wash Batches
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {mockWashBatches.map((batch) => (
                      <div key={batch.id} className="flex items-center justify-between p-4 border rounded-xl bg-card hover:bg-muted/50 transition-colors">
                        <div className="flex items-center gap-3">
                          <div className="p-3 bg-orange-100 dark:bg-orange-950/50 rounded-lg">
                            <Factory className="h-5 w-5 text-orange-600" />
                          </div>
                          <div>
                            <p className="font-semibold text-foreground">{batch.batchNumber}</p>
                            <p className="text-xs text-muted-foreground">{batch.garmentCount} Garments &middot; {batch.totalWeightKg} kg</p>
                          </div>
                        </div>
                        <Badge variant="outline" className={cn('capitalize', getStatusColor(batch.status))}>
                          {batch.status}
                        </Badge>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="flow" className="mt-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <ShieldCheck className="h-5 w-5 text-green-600" /> Organization Garment Allocation
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {mockTenants.map((tenant) => (
                      <div key={tenant.id} className="p-4 border rounded-xl space-y-2">
                        <div className="flex justify-between items-center">
                          <span className="font-semibold text-base">{tenant.name} ({tenant.code})</span>
                          <Badge variant="secondary">Active</Badge>
                        </div>
                        <p className="text-xs text-muted-foreground">Location: {tenant.timezone} &middot; Currency: {tenant.currency}</p>
                        <div className="grid grid-cols-3 gap-2 pt-2 text-xs">
                          <div className="p-2 bg-muted/40 rounded text-center">
                            <span className="text-muted-foreground">In Use</span>
                            <p className="font-bold text-sm text-blue-600">1,400</p>
                          </div>
                          <div className="p-2 bg-muted/40 rounded text-center">
                            <span className="text-muted-foreground">In Wash</span>
                            <p className="font-bold text-sm text-orange-600">1,200</p>
                          </div>
                          <div className="p-2 bg-muted/40 rounded text-center">
                            <span className="text-muted-foreground">Ready</span>
                            <p className="font-bold text-sm text-green-600">950</p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>

        {/* Right Column - Status Distribution & Alerts */}
        <div className="space-y-6">
          {/* Status Distribution */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-lg">Garment Status Breakdown</CardTitle>
              <Badge variant="outline" className="text-xs">Real-time</Badge>
            </CardHeader>
            <CardContent>
              <div className="space-y-3 max-h-[300px] overflow-y-auto pr-1">
                {STATUS_DISTRIBUTION.map((item) => (
                  <div key={item.status} className="flex items-center justify-between">
                    <Badge className={cn('text-xs px-2 py-0.5', getStatusColor(item.status))} variant="default">
                      {item.label}
                    </Badge>
                    <div className="flex items-center gap-3 w-[150px]">
                      <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
                        <div className="h-full bg-primary rounded-full" style={{ width: `${(item.count / 12450) * 100}%` }} />
                      </div>
                      <span className="text-xs font-mono text-right w-12">{formatNumber(item.count)}</span>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Recent Alerts */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-lg">Recent Alerts</CardTitle>
              <Button variant="ghost" size="sm">View All</Button>
            </CardHeader>
            <CardContent>
              <div className="space-y-2.5">
                {RECENT_ALERTS.map((alert) => (
                  <div
                    key={alert.id}
                    className={cn(
                      'flex items-start gap-3 p-3 rounded-lg border text-xs',
                      alert.severity === 'high' && 'border-red-200 bg-red-50/50 dark:bg-red-950/20',
                      alert.severity === 'medium' && 'border-yellow-200 bg-yellow-50/50 dark:bg-yellow-950/20',
                      alert.severity === 'low' && 'border-blue-200 bg-blue-50/50 dark:bg-blue-950/20'
                    )}
                  >
                    <div className="p-1.5 rounded-full bg-white dark:bg-black/20 shadow-sm">
                      {alert.type === 'missing' && <AlertTriangle className="h-3.5 w-3.5 text-red-600" />}
                      {alert.type === 'sla' && <Clock className="h-3.5 w-3.5 text-red-600" />}
                      {alert.type === 'qc' && <CheckCircle className="h-3.5 w-3.5 text-yellow-600" />}
                      {alert.type === 'rotation' && <RotateCcw className="h-3.5 w-3.5 text-blue-600" />}
                      {alert.type === 'maintenance' && <Factory className="h-3.5 w-3.5 text-blue-600" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-foreground">{alert.message}</p>
                      <p className="text-[10px] text-muted-foreground mt-0.5">{alert.time}</p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Quick Actions */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg">Quick Operations</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-2.5 sm:grid-cols-2">
                {QUICK_ACTIONS.map((action) => (
                  <Button
                    key={action.label}
                    variant="outline"
                    className="h-auto py-3 px-3 flex items-center justify-start gap-2.5 text-left text-xs font-medium"
                    asChild
                  >
                    <a href={action.href}>
                      <div className={cn('p-1.5 rounded-md text-white', action.color)}>
                        <action.icon className="h-4 w-4" />
                      </div>
                      <span>{action.label}</span>
                    </a>
                  </Button>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

// Mock data
const mockWashBatches = [
  { id: 'batch-1', batchNumber: 'WB-20260815-001', status: 'WASHING', garmentCount: 150, totalWeightKg: 75 },
  { id: 'batch-2', batchNumber: 'WB-20260815-002', status: 'DRYING', garmentCount: 120, totalWeightKg: 60 },
  { id: 'batch-3', batchNumber: 'WB-20260815-003', status: 'QC_PENDING', garmentCount: 100, totalWeightKg: 50 },
  { id: 'batch-4', batchNumber: 'WB-20260815-004', status: 'PACKED', garmentCount: 200, totalWeightKg: 100 },
];

const mockTenants = [
  { id: 'tenant-1', name: 'City General Hospital', code: 'CGH', status: 'ACTIVE', timezone: 'Asia/Kolkata', currency: 'INR' },
  { id: 'tenant-2', name: 'Metro Medical Center', code: 'MMC', status: 'ACTIVE', timezone: 'Asia/Kolkata', currency: 'INR' },
  { id: 'tenant-3', name: 'Grand Hotel Chain', code: 'GHC', status: 'ACTIVE', timezone: 'Asia/Kolkata', currency: 'INR' },
];
