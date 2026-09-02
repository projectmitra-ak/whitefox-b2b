'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { cn, getStatusColor, getStatusLabel, formatNumber } from '@/lib/utils';
import { Plus, Search, Filter, Download, Eye, Edit, Tag, Truck, RotateCcw, X, Package, Users, Box, AlertTriangle } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

const mockGarments = Array.from({ length: 50 }, (_, i) => ({
  id: `garment-${i}`,
  assetId: `WF-TXT-${String(100000 + i).padStart(6, '0')}`,
  tenantId: 'tenant-1',
  status: ['IN_USE', 'IN_LOCKER', 'IN_LAUNDRY', 'WASHING', 'DRYING', 'QC_PASSED', 'PACKED', 'DISPATCHED', 'DELIVERED', 'MISSING'][i % 10] as any,
  garmentType: { name: ['Shirt', 'Trouser', 'Scrub', 'Bedsheet', 'Towel'][i % 5] },
  size: { label: ['S', 'M', 'L', 'XL', 'XXL'][i % 5] },
  color: { name: ['Blue', 'White', 'Green', 'Navy', 'Grey'][i % 5] },
  washCount: Math.floor(Math.random() * 100),
  currentBranch: { name: 'City General Hospital' },
  currentDepartment: { name: ['ICU', 'Emergency', 'Surgery', 'General Ward', 'OT'][i % 5] },
  rfidTag: { epc: `300833B2DDD901400000${String(i).padStart(6, '0')}` },
  garmentTypeId: `gt-${i}`,
  sizeId: `sz-${i}`,
  colorId: `cl-${i}`,
  statusChangedAt: new Date().toISOString(),
  rfidTagId: `rfid-${i}`,
  assignedEmployeeId: `emp-${i}`,
  setPosition: ['A', 'B', 'C'][i % 3] as 'A' | 'B' | 'C',
})) as import('@/types').Garment[];

export default function GarmentsPage() {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [typeFilter, setTypeFilter] = useState('all');
  const [selectedGarment, setSelectedGarment] = useState<any>(null);

  const filteredGarments = mockGarments.filter(g => {
    const matchesSearch = g.assetId.toLowerCase().includes(search.toLowerCase()) ||
      g.garmentType?.name.toLowerCase().includes(search.toLowerCase()) ||
      g.rfidTag?.epc.toLowerCase().includes(search.toLowerCase());
    const matchesStatus = statusFilter === 'all' || g.status === statusFilter;
    const matchesType = typeFilter === 'all' || g.garmentType?.name === typeFilter;
    return matchesSearch && matchesStatus && matchesType;
  });

  const statusCounts = mockGarments.reduce((acc, g) => {
    acc[g.status] = (acc[g.status] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  return (
    <div className="space-y-6 p-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Garment Management</h1>
          <p className="text-muted-foreground">Track and manage all textile assets across your organization</p>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="outline" size="sm">
            <Download className="mr-2 h-4 w-4" />
            Export
          </Button>
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            Add Garment
          </Button>
        </div>
      </div>

      {/* Summary Stats */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
        <Card className="bg-whitefox-50 dark:bg-whitefox-950/50 border-whitefox-200 dark:border-whitefox-800">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Garments</p>
                <p className="text-3xl font-bold text-whitefox-600">{formatNumber(mockGarments.length)}</p>
              </div>
              <div className="p-3 bg-whitefox-100 dark:bg-whitefox-900 rounded-xl">
                <Package className="h-6 w-6 text-whitefox-600" />
              </div>
            </div>
          </CardContent>
        </Card>
        {[
          { key: 'IN_USE', label: 'In Use', color: 'blue', icon: Users },
          { key: 'IN_LOCKER', label: 'In Locker', color: 'green', icon: Box },
          { key: 'IN_LAUNDRY', label: 'In Laundry', color: 'orange', icon: Truck },
          { key: 'MISSING', label: 'Missing', color: 'red', icon: AlertTriangle },
        ].map((stat) => (
          <Card key={stat.key}>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">{stat.label}</p>
                  <p className="text-3xl font-bold text-foreground">{formatNumber(statusCounts[stat.key] || 0)}</p>
                </div>
                <div className={cn('p-3 rounded-xl', `bg-${stat.color}-100 dark:bg-${stat.color}-900/30`)}>
                  <stat.icon className={cn('h-6 w-6', `text-${stat.color}-600`)} />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by Asset ID, Type, RFID..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="All Statuses" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="IN_USE">In Use</SelectItem>
                <SelectItem value="IN_LOCKER">In Locker</SelectItem>
                <SelectItem value="IN_LAUNDRY">In Laundry</SelectItem>
                <SelectItem value="WASHING">Washing</SelectItem>
                <SelectItem value="DRYING">Drying</SelectItem>
                <SelectItem value="QC_PASSED">QC Passed</SelectItem>
                <SelectItem value="PACKED">Packed</SelectItem>
                <SelectItem value="DISPATCHED">Dispatched</SelectItem>
                <SelectItem value="DELIVERED">Delivered</SelectItem>
                <SelectItem value="MISSING">Missing</SelectItem>
              </SelectContent>
            </Select>
            <Select value={typeFilter} onValueChange={setTypeFilter}>
              <SelectTrigger className="w-[160px]">
                <SelectValue placeholder="All Types" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="Shirt">Shirt</SelectItem>
                <SelectItem value="Trouser">Trouser</SelectItem>
                <SelectItem value="Scrub">Scrub</SelectItem>
                <SelectItem value="Bedsheet">Bedsheet</SelectItem>
                <SelectItem value="Towel">Towel</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Content */}
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Asset ID</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Size</TableHead>
                  <TableHead>Color</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Wash Count</TableHead>
                  <TableHead>Location</TableHead>
                  <TableHead>RFID</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredGarments.map((garment) => (
                  <TableRow key={garment.id} onClick={() => setSelectedGarment(garment)}>
                    <TableCell className="font-mono font-medium">{garment.assetId}</TableCell>
                    <TableCell>{garment.garmentType?.name ?? 'N/A'}</TableCell>
                    <TableCell>{garment.size?.label ?? 'N/A'}</TableCell>
                    <TableCell>{garment.color?.name ?? 'N/A'}</TableCell>
                    <TableCell>
                      <Badge variant="outline" className={cn('capitalize', getStatusColor(garment.status))}>
                        {getStatusLabel(garment.status)}
                      </Badge>
                    </TableCell>
                    <TableCell className="font-mono">{garment.washCount}</TableCell>
                    <TableCell>
                      <div>{garment.currentBranch?.name}</div>
                      <div className="text-xs text-muted-foreground">{garment.currentDepartment?.name}</div>
                    </TableCell>
                    <TableCell className="font-mono text-xs">{garment.rfidTag?.epc.slice(-12) ?? 'N/A'}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1">
                        <Button variant="ghost" size="icon" title="View"><Eye className="h-4 w-4" /></Button>
                        <Button variant="ghost" size="icon" title="Edit"><Edit className="h-4 w-4" /></Button>
                        <Button variant="ghost" size="icon" title="Tag"><Tag className="h-4 w-4" /></Button>
                        <Button variant="ghost" size="icon" title="Rotate"><RotateCcw className="h-4 w-4" /></Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

      {/* Detail Modal */}
      {selectedGarment && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <Card className="w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>{selectedGarment.assetId}</CardTitle>
              <Button variant="ghost" size="icon" onClick={() => setSelectedGarment(null)}>
                <X className="h-4 w-4" />
              </Button>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <label className="text-xs text-muted-foreground">Type</label>
                  <p className="font-medium">{selectedGarment.garmentType.name}</p>
                </div>
                <div>
                  <label className="text-xs text-muted-foreground">Size</label>
                  <p className="font-medium">{selectedGarment.size.label}</p>
                </div>
                <div>
                  <label className="text-xs text-muted-foreground">Color</label>
                  <p className="font-medium">{selectedGarment.color.name}</p>
                </div>
                <div>
                  <label className="text-xs text-muted-foreground">Status</label>
                  <Badge variant="outline" className={cn('capitalize', getStatusColor(selectedGarment.status))}>
                    {getStatusLabel(selectedGarment.status)}
                  </Badge>
                </div>
                <div>
                  <label className="text-xs text-muted-foreground">Wash Count</label>
                  <p className="font-medium">{selectedGarment.washCount}</p>
                </div>
                <div>
                  <label className="text-xs text-muted-foreground">RFID EPC</label>
                  <p className="font-mono text-sm">{selectedGarment.rfidTag.epc}</p>
                </div>
                <div>
                  <label className="text-xs text-muted-foreground">Location</label>
                  <p className="font-medium">{selectedGarment.currentBranch?.name}</p>
                </div>
                <div>
                  <label className="text-xs text-muted-foreground">Department</label>
                  <p className="font-medium">{selectedGarment.currentDepartment?.name}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
