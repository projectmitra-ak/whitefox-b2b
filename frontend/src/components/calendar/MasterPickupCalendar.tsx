'use client';

import { useState, useEffect } from 'react';
import {
  useWhiteFoxStore,
  type PickupRequest,
  type PickupStatus,
  type PickupPriority,
  type WfTenant,
  type Driver,
  PICKUP_STATUS_LABELS,
} from '@/lib/store';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Calendar as CalendarIcon,
  Clock,
  Truck,
  Building2,
  Plus,
  ChevronLeft,
  ChevronRight,
  Sparkles,
  AlertCircle,
  CheckCircle2,
  Package,
  MapPin,
  Flame,
  Phone,
  Filter,
  UserCheck,
  Navigation,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { cn } from '@/lib/utils';

interface MasterPickupCalendarProps {
  mode: 'ADMIN' | 'TENANT' | 'DRIVER';
  tenantId?: string;
  driverId?: string;
}

export function MasterPickupCalendar({ mode, tenantId, driverId }: MasterPickupCalendarProps) {
  const {
    pickupRequests,
    tenants,
    drivers,
    addPickupRequest,
    updatePickupRequest,
    assignDriverToPickup,
    setDriverStatus,
  } = useWhiteFoxStore();

  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    setMounted(true);
  }, []);

  const [currentDate, setCurrentDate] = useState<Date>(new Date(2026, 8, 4)); // Sept 2026
  const [selectedDateStr, setSelectedDateStr] = useState<string>('2026-09-04');
  const [filterTenant, setFilterTenant] = useState<string>(tenantId ?? 'ALL');
  const [filterStatus, setFilterStatus] = useState<string>('ALL');
  const [showScheduleModal, setShowScheduleModal] = useState<boolean>(false);

  // Active target tenant for tenant mode
  const currentTenant = tenants.find((t) => t.id === (tenantId ?? 'tnt-1')) ?? tenants[0];
  const currentDriver = drivers.find((d) => d.id === driverId);

  // Month navigation
  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();
  const monthName = currentDate.toLocaleString('default', { month: 'long' });

  const firstDayIndex = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  if (!mounted) {
    return (
      <div className="flex items-center justify-center min-h-[300px]">
        <div className="w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  // Filter pickups
  const filteredPickups = pickupRequests.filter((p) => {
    if (mode === 'TENANT' && p.tenantId !== (tenantId ?? 'tnt-1')) return false;
    if (mode === 'DRIVER' && driverId && p.assignedDriverId !== driverId) return false;
    if (mode === 'ADMIN' && filterTenant !== 'ALL' && p.tenantId !== filterTenant) return false;
    if (filterStatus !== 'ALL' && p.status !== filterStatus) return false;
    return true;
  });

  const selectedDatePickups = filteredPickups.filter((p) => p.pickupDate === selectedDateStr);

  const prevMonth = () => {
    setCurrentDate(new Date(year, month - 1, 1));
  };

  const nextMonth = () => {
    setCurrentDate(new Date(year, month + 1, 1));
  };

  return (
    <div className="space-y-6">
      {/* ── Top Summary & Action Card ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 bg-card border rounded-2xl shadow-sm">
        <div>
          <div className="flex items-center gap-2">
            <CalendarIcon className="w-6 h-6 text-indigo-600" />
            <h2 className="text-xl font-bold">
              {mode === 'ADMIN'
                ? 'Master Laundry Pickup & Fleet Dispatch Calendar'
                : mode === 'DRIVER'
                ? 'Driver Route & Pickup Mission Calendar'
                : 'Laundry Pickup Scheduling & Fleet Tracker'}
            </h2>
            <Badge className="bg-indigo-600 text-white font-semibold">
              {mode === 'ADMIN'
                ? 'All Clients Schedule'
                : mode === 'DRIVER'
                ? `${currentDriver?.name ?? 'Driver'} · ${currentDriver?.vehicleNumber ?? 'Van'}`
                : currentTenant?.name}
            </Badge>
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            {mode === 'ADMIN'
              ? 'View all scheduled pickups across hospitals & clients, manage pickup dates, time slots, and assign van drivers'
              : mode === 'DRIVER'
              ? 'Check upcoming hospital pickup dates, ward locations, hamper counts, and launch turn-by-turn navigation'
              : 'Choose your preferred date and time slot to request automated laundry hamper collection by WhiteFox fleet'}
          </p>
        </div>

        {mode !== 'DRIVER' && (
          <Button
            onClick={() => setShowScheduleModal(true)}
            className="bg-indigo-600 hover:bg-indigo-700 text-white gap-2 font-semibold shadow-sm cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            Schedule Laundry Pickup
          </Button>
        )}
      </div>

      {/* ── Calendar & Day Details Split Grid ── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left: Interactive Calendar (7 Cols) */}
        <Card className="lg:col-span-7 shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-3">
            <div className="flex items-center gap-2">
              <span className="font-bold text-base text-foreground">
                {monthName} {year}
              </span>
              <Badge variant="outline" className="text-xs font-mono">
                {filteredPickups.length} Pickups Marked
              </Badge>
            </div>
            <div className="flex items-center gap-1">
              <Button variant="outline" size="icon" onClick={prevMonth} className="h-8 w-8 cursor-pointer">
                <ChevronLeft className="w-4 h-4" />
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  const today = new Date(2026, 8, 4);
                  setCurrentDate(today);
                  setSelectedDateStr('2026-09-04');
                }}
                className="text-xs font-semibold h-8 cursor-pointer"
              >
                Today
              </Button>
              <Button variant="outline" size="icon" onClick={nextMonth} className="h-8 w-8 cursor-pointer">
                <ChevronRight className="w-4 h-4" />
              </Button>
            </div>
          </CardHeader>
          <CardContent className="p-4 pt-0">
            {/* Weekday Header */}
            <div className="grid grid-cols-7 gap-1 text-center font-bold text-xs text-muted-foreground mb-2">
              <span>Sun</span>
              <span>Mon</span>
              <span>Tue</span>
              <span>Wed</span>
              <span>Thu</span>
              <span>Fri</span>
              <span>Sat</span>
            </div>

            {/* Days Grid */}
            <div className="grid grid-cols-7 gap-1.5">
              {/* Empty leading days */}
              {Array.from({ length: firstDayIndex }).map((_, idx) => (
                <div key={`empty-${idx}`} className="h-20 rounded-xl bg-muted/10 border border-transparent" />
              ))}

              {/* Month Days */}
              {Array.from({ length: daysInMonth }).map((_, idx) => {
                const dayNum = idx + 1;
                const dateKey = `${year}-${String(month + 1).padStart(2, '0')}-${String(dayNum).padStart(2, '0')}`;
                const dayPickups = filteredPickups.filter((p) => p.pickupDate === dateKey);
                const isSelected = selectedDateStr === dateKey;
                const isToday = dateKey === '2026-09-04';

                return (
                  <div
                    key={dateKey}
                    onClick={() => setSelectedDateStr(dateKey)}
                    className={cn(
                      'min-h-[85px] p-1.5 rounded-xl border transition-all cursor-pointer flex flex-col justify-between',
                      isSelected
                        ? 'border-indigo-600 bg-indigo-50/50 dark:bg-indigo-950/40 ring-2 ring-indigo-500/20 shadow-xs'
                        : isToday
                        ? 'border-violet-300 bg-violet-50/30 dark:bg-violet-950/20'
                        : 'bg-card border-border hover:border-indigo-300'
                    )}
                  >
                    <div className="flex items-center justify-between">
                      <span
                        className={cn(
                          'text-xs font-bold w-5 h-5 flex items-center justify-center rounded-full',
                          isSelected
                            ? 'bg-indigo-600 text-white'
                            : isToday
                            ? 'bg-violet-600 text-white'
                            : 'text-foreground'
                        )}
                      >
                        {dayNum}
                      </span>
                      {dayPickups.length > 0 && (
                        <span className="text-[10px] font-bold text-indigo-600 font-mono">
                          {dayPickups.length}
                        </span>
                      )}
                    </div>

                    {/* Pickup Dots / Badges */}
                    <div className="space-y-1 mt-1 overflow-hidden">
                      {dayPickups.slice(0, 2).map((p) => (
                        <div
                          key={p.id}
                          className={cn(
                            'text-[9px] font-bold truncate px-1 py-0.5 rounded-sm',
                            p.priority === 'STERILIZATION_URGENT'
                              ? 'bg-red-100 text-red-800'
                              : p.priority === 'EXPRESS_SAME_DAY'
                              ? 'bg-amber-100 text-amber-800'
                              : 'bg-blue-100 text-blue-800'
                          )}
                          title={`${p.tenantName} (${p.timeSlot})`}
                        >
                          {p.tenantCode} · {p.timeSlot.split(' - ')[0]}
                        </div>
                      ))}
                      {dayPickups.length > 2 && (
                        <span className="text-[9px] text-muted-foreground font-semibold block">
                          +{dayPickups.length - 2} more
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {/* Right: Selected Date Pickups & Action Cards (5 Cols) */}
        <Card className="lg:col-span-5 shadow-sm flex flex-col justify-between">
          <CardHeader className="pb-3 border-b">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-base flex items-center gap-2">
                  <Clock className="w-4 h-4 text-indigo-600" />
                  Missions on {new Date(selectedDateStr).toLocaleDateString('default', { month: 'short', day: 'numeric', year: 'numeric' })}
                </CardTitle>
                <CardDescription className="text-xs">
                  {selectedDatePickups.length} pickups scheduled for this day
                </CardDescription>
              </div>
              <Badge className="bg-indigo-600 text-white text-xs">{selectedDatePickups.length} Missions</Badge>
            </div>
          </CardHeader>

          <CardContent className="p-4 space-y-3 flex-1 overflow-y-auto max-h-[480px]">
            {selectedDatePickups.length === 0 ? (
              <div className="text-center py-12 space-y-3">
                <CalendarIcon className="w-10 h-10 text-muted-foreground mx-auto" />
                <p className="text-sm font-semibold text-foreground">No pickups on this date</p>
                <p className="text-xs text-muted-foreground max-w-xs mx-auto">
                  {mode === 'DRIVER'
                    ? 'You have no collection missions assigned for this date.'
                    : `Click the button below to schedule a laundry collection for ${selectedDateStr}.`}
                </p>
                {mode !== 'DRIVER' && (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setShowScheduleModal(true)}
                    className="text-xs text-indigo-600 border-indigo-200 cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5 mr-1" /> Schedule for this date
                  </Button>
                )}
              </div>
            ) : (
              selectedDatePickups.map((p) => {
                const statusInfo = PICKUP_STATUS_LABELS[p.status];

                return (
                  <div
                    key={p.id}
                    className="p-4 rounded-xl border bg-muted/20 hover:border-indigo-300 transition-all space-y-3 shadow-xs"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <span className="font-bold text-sm text-foreground flex items-center gap-1.5">
                          <Building2 className="w-4 h-4 text-blue-600" />
                          {p.tenantName}
                        </span>
                        <p className="text-xs text-muted-foreground mt-0.5 flex items-center gap-1">
                          <Clock className="w-3 h-3 text-indigo-500" /> Window: <strong>{p.timeSlot}</strong>
                        </p>
                      </div>
                      <Badge variant="outline" className={cn('text-[10px]', statusInfo.color)}>
                        {statusInfo.label}
                      </Badge>
                    </div>

                    <div className="grid grid-cols-2 gap-2 text-xs bg-white dark:bg-card p-2.5 rounded-lg border">
                      <div>
                        <span className="text-muted-foreground text-[10px] block">Est. Volume:</span>
                        <span className="font-bold text-foreground">
                          {p.estimatedHampers} Hampers (~{p.estimatedGarments} pcs)
                        </span>
                      </div>
                      <div>
                        <span className="text-muted-foreground text-[10px] block">Pickup Dock / Ward:</span>
                        <span className="font-medium text-foreground truncate block">{p.pickupLocation}</span>
                      </div>
                    </div>

                    {p.specialInstructions && (
                      <p className="text-[11px] text-muted-foreground bg-amber-50 dark:bg-amber-950/30 p-2 rounded-md border border-amber-200 text-amber-900 dark:text-amber-200">
                        <strong>Note:</strong> {p.specialInstructions}
                      </p>
                    )}

                    {/* Driver Route & Action Buttons */}
                    {mode === 'DRIVER' && (
                      <div className="pt-2 border-t flex flex-wrap items-center justify-between gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            if (driverId) {
                              setDriverStatus(driverId, 'EN_ROUTE_PICKUP');
                              updatePickupRequest(p.id, { status: 'DRIVER_EN_ROUTE' });
                              toast.success(`🚀 Heading to ${p.tenantName}! Status: En Route`);
                            }
                          }}
                          className="text-xs gap-1 text-blue-600 border-blue-200 hover:bg-blue-50 cursor-pointer"
                        >
                          <Navigation className="w-3.5 h-3.5" /> Start Navigation
                        </Button>

                        <Button
                          size="sm"
                          onClick={() => {
                            if (driverId) {
                              setDriverStatus(driverId, 'PICKED_UP');
                              updatePickupRequest(p.id, { status: 'PICKED_UP' });
                              toast.success(`🧺 Picked up ${p.estimatedHampers} hampers from ${p.tenantName}!`);
                            }
                          }}
                          className="text-xs gap-1 bg-orange-600 hover:bg-orange-700 text-white cursor-pointer"
                        >
                          <Package className="w-3.5 h-3.5" /> Mark Picked Up
                        </Button>
                      </div>
                    )}

                    {/* Driver Assignment Dropdown (for Admin) */}
                    {mode === 'ADMIN' && (
                      <div className="pt-2 border-t flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                        <div className="flex items-center gap-2 text-xs">
                          <Truck className="w-3.5 h-3.5 text-amber-600" />
                          <span className="text-muted-foreground font-medium">Assign Driver:</span>
                        </div>
                        <div className="w-44">
                          <Select
                            value={p.assignedDriverId ?? 'UNASSIGNED'}
                            onValueChange={(driverId) => {
                              if (driverId === 'UNASSIGNED') {
                                updatePickupRequest(p.id, { assignedDriverId: null, assignedDriverName: undefined, status: 'SCHEDULED' });
                              } else {
                                assignDriverToPickup(p.id, driverId);
                                toast.success(`Assigned pickup to driver!`);
                              }
                            }}
                          >
                            <SelectTrigger className="h-8 text-xs bg-background">
                              <SelectValue placeholder="Select Driver" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="UNASSIGNED">-- Unassigned --</SelectItem>
                              {drivers.map((d) => (
                                <SelectItem key={d.id} value={d.id}>
                                  {d.name} ({d.vehicleNumber ?? 'Van'})
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </CardContent>
        </Card>
      </div>

      {/* ── Master List of All Scheduled Pickups Table ── */}
      <Card className="shadow-sm">
        <CardHeader className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-3 border-b">
          <div>
            <CardTitle className="text-base flex items-center gap-2">
              <Truck className="w-5 h-5 text-amber-600" />
              {mode === 'DRIVER' ? 'Your Assigned Pickup Missions' : 'All Scheduled Fleet Pickup Missions'}
            </CardTitle>
            <CardDescription className="text-xs">
              Filter and view collection dates, destination hospital locations, time slots, and status updates
            </CardDescription>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {mode === 'ADMIN' && (
              <div className="w-44">
                <Select value={filterTenant} onValueChange={setFilterTenant}>
                  <SelectTrigger className="text-xs h-8">
                    <SelectValue placeholder="All Clients" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ALL">All Clients</SelectItem>
                    {tenants.map((t) => (
                      <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            <div className="w-36">
              <Select value={filterStatus} onValueChange={setFilterStatus}>
                <SelectTrigger className="text-xs h-8">
                  <SelectValue placeholder="All Statuses" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">All Statuses</SelectItem>
                  <SelectItem value="SCHEDULED">Scheduled</SelectItem>
                  <SelectItem value="DRIVER_ASSIGNED">Driver Assigned</SelectItem>
                  <SelectItem value="DRIVER_EN_ROUTE">En Route</SelectItem>
                  <SelectItem value="PICKED_UP">Picked Up</SelectItem>
                  <SelectItem value="COMPLETED">Completed</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>

        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/40">
                <TableHead>Pickup Date & Time Slot</TableHead>
                {mode !== 'TENANT' && <TableHead>Hospital / Client</TableHead>}
                <TableHead>Destination Location / Ward</TableHead>
                <TableHead>Est. Volume</TableHead>
                <TableHead>Priority</TableHead>
                {mode !== 'DRIVER' && <TableHead>Assigned Driver</TableHead>}
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredPickups.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center py-10 text-muted-foreground">
                    No pickups match the selected criteria.
                  </TableCell>
                </TableRow>
              ) : (
                filteredPickups.map((p) => {
                  const statusInfo = PICKUP_STATUS_LABELS[p.status];
                  return (
                    <TableRow key={p.id} className="hover:bg-muted/40 text-xs">
                      <TableCell>
                        <p className="font-bold text-foreground">{p.pickupDate}</p>
                        <span className="text-muted-foreground font-mono">{p.timeSlot}</span>
                      </TableCell>
                      {mode !== 'TENANT' && (
                        <TableCell>
                          <p className="font-semibold text-sm">{p.tenantName}</p>
                          <Badge variant="outline" className="text-[10px]">{p.tenantCode}</Badge>
                        </TableCell>
                      )}
                      <TableCell className="max-w-[160px] truncate">{p.pickupLocation}</TableCell>
                      <TableCell className="font-mono font-semibold">
                        {p.estimatedHampers} hampers (~{p.estimatedGarments} pcs)
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant="outline"
                          className={cn(
                            'text-[10px]',
                            p.priority === 'STERILIZATION_URGENT'
                              ? 'bg-red-100 text-red-800 border-red-300'
                              : p.priority === 'EXPRESS_SAME_DAY'
                              ? 'bg-amber-100 text-amber-800 border-amber-300'
                              : 'bg-slate-100 text-slate-800'
                          )}
                        >
                          {p.priority.replace(/_/g, ' ')}
                        </Badge>
                      </TableCell>
                      {mode !== 'DRIVER' && (
                        <TableCell>
                          {p.assignedDriverName ? (
                            <div className="flex items-center gap-1.5">
                              <Truck className="w-3.5 h-3.5 text-amber-600" />
                              <span className="font-semibold">{p.assignedDriverName}</span>
                            </div>
                          ) : (
                            <span className="text-muted-foreground italic">Unassigned</span>
                          )}
                        </TableCell>
                      )}
                      <TableCell>
                        <Badge variant="outline" className={cn('text-[10px]', statusInfo.color)}>
                          {statusInfo.label}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            setSelectedDateStr(p.pickupDate);
                            toast(`Selected date: ${p.pickupDate}`);
                          }}
                          className="text-xs text-indigo-600 font-semibold cursor-pointer"
                        >
                          View in Calendar
                        </Button>
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* ── Schedule Laundry Pickup Modal ── */}
      {showScheduleModal && (
        <SchedulePickupModal
          open={showScheduleModal}
          onClose={() => setShowScheduleModal(false)}
          defaultTenant={currentTenant}
          allTenants={tenants}
          mode={mode as 'ADMIN' | 'TENANT'}
        />
      )}
    </div>
  );
}

/* ──────────────── Helper Modal for Scheduling Pickup ──────────────── */
function SchedulePickupModal({
  open,
  onClose,
  defaultTenant,
  allTenants,
  mode,
}: {
  open: boolean;
  onClose: () => void;
  defaultTenant: WfTenant;
  allTenants: WfTenant[];
  mode: 'ADMIN' | 'TENANT';
}) {
  const { addPickupRequest } = useWhiteFoxStore();

  const [tenantId, setTenantId] = useState<string>(defaultTenant?.id ?? allTenants[0]?.id ?? '');
  const [pickupDate, setPickupDate] = useState<string>('2026-09-05');
  const [timeSlot, setTimeSlot] = useState<string>('09:00 AM - 11:00 AM');
  const [estimatedHampers, setEstimatedHampers] = useState<number>(5);
  const [pickupLocation, setPickupLocation] = useState<string>('Main Hospital Soiled Linen Receiving Dock');
  const [priority, setPriority] = useState<PickupPriority>('NORMAL');
  const [specialInstructions, setSpecialInstructions] = useState<string>('Regular soiled uniform collection.');

  const targetTenant = allTenants.find((t) => t.id === tenantId) ?? defaultTenant;

  const handleBook = () => {
    if (!pickupDate) {
      toast.error('Please select a pickup date');
      return;
    }

    addPickupRequest({
      tenantId: targetTenant.id,
      tenantName: targetTenant.name,
      tenantCode: targetTenant.code,
      pickupDate,
      timeSlot,
      estimatedHampers,
      estimatedGarments: estimatedHampers * 25,
      pickupLocation,
      priority,
      status: 'SCHEDULED',
      assignedDriverId: null,
      specialInstructions,
    });

    toast.success(
      `🎉 Pickup booked for ${targetTenant.name} on ${pickupDate} (${timeSlot})! Notification sent to WhiteFox Fleet dispatch.`
    );
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <CalendarIcon className="w-5 h-5 text-indigo-600" />
            Schedule Laundry Hamper Pickup
          </DialogTitle>
          <DialogDescription className="text-xs">
            Reserve a time slot with the WhiteFox logistics van fleet for soiled garment collection
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2 text-xs">
          {mode === 'ADMIN' && (
            <div>
              <Label className="text-xs font-semibold">Client Organization:</Label>
              <Select value={tenantId} onValueChange={setTenantId}>
                <SelectTrigger className="mt-1">
                  <SelectValue placeholder="Select Client" />
                </SelectTrigger>
                <SelectContent>
                  {allTenants.map((t) => (
                    <SelectItem key={t.id} value={t.id}>
                      {t.name} ({t.code})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="text-xs font-semibold">Pickup Date:</Label>
              <Input
                type="date"
                value={pickupDate}
                onChange={(e) => setPickupDate(e.target.value)}
                className="mt-1"
              />
            </div>
            <div>
              <Label className="text-xs font-semibold">Estimated Hampers:</Label>
              <Input
                type="number"
                min={1}
                max={50}
                value={estimatedHampers}
                onChange={(e) => setEstimatedHampers(Number(e.target.value) || 1)}
                className="mt-1"
              />
            </div>
          </div>

          <div>
            <Label className="text-xs font-semibold">Preferred Time Window:</Label>
            <Select value={timeSlot} onValueChange={setTimeSlot}>
              <SelectTrigger className="mt-1">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="08:00 AM - 10:00 AM">Morning Early (08:00 AM - 10:00 AM)</SelectItem>
                <SelectItem value="10:00 AM - 12:00 PM">Morning Mid (10:00 AM - 12:00 PM)</SelectItem>
                <SelectItem value="02:00 PM - 04:00 PM">Afternoon (02:00 PM - 04:00 PM)</SelectItem>
                <SelectItem value="05:00 PM - 07:00 PM">Evening (05:00 PM - 07:00 PM)</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label className="text-xs font-semibold">Pickup Ward / Dock Location:</Label>
            <Input
              value={pickupLocation}
              onChange={(e) => setPickupLocation(e.target.value)}
              placeholder="e.g. ICU Bay 2, Basement Loading Dock"
              className="mt-1"
            />
          </div>

          <div>
            <Label className="text-xs font-semibold">Collection Priority:</Label>
            <Select value={priority} onValueChange={(v) => setPriority(v as PickupPriority)}>
              <SelectTrigger className="mt-1">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="NORMAL">Standard Routine Wash</SelectItem>
                <SelectItem value="EXPRESS_SAME_DAY">⚡ Express Same-Day Turnaround</SelectItem>
                <SelectItem value="STERILIZATION_URGENT">🛡️ High Priority Bio-Sterilization</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label className="text-xs font-semibold">Special Instructions for Van Driver:</Label>
            <Input
              value={specialInstructions}
              onChange={(e) => setSpecialInstructions(e.target.value)}
              placeholder="e.g. Red bags require separate decontamination"
              className="mt-1"
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose} className="cursor-pointer">
            Cancel
          </Button>
          <Button
            onClick={handleBook}
            className="bg-indigo-600 hover:bg-indigo-700 text-white font-semibold cursor-pointer"
          >
            Confirm & Schedule Pickup
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
