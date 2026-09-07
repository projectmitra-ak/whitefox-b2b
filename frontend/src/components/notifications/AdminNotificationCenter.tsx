'use client';

import { useState, useEffect } from 'react';
import {
  useWhiteFoxStore,
  type AdminNotification,
  type RFIDGateType,
  GATE_LABELS,
} from '@/lib/store';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Bell,
  CheckCircle2,
  AlertTriangle,
  ShieldAlert,
  Radio,
  Trash2,
  Check,
  Building2,
  Shirt,
  Calendar,
  Layers,
  ChevronRight,
  Filter,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { cn } from '@/lib/utils';

/* ──────────────── Pop-up Modal Triggered When Admin Opens Dashboard ──────────────── */
export function AdminLoginNotificationPopup() {
  const { notifications, markNotificationRead, dismissPopup } = useWhiteFoxStore();
  const [mounted, setMounted] = useState(false);
  const [open, setOpen] = useState(false);
  const [currentNotif, setCurrentNotif] = useState<AdminNotification | null>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted) return;
    // Check for unread alerts or missing cloth notifications on login
    const unshownAlert = notifications.find(
      (n) => (!n.read || !n.isPopupShown) && n.type === 'MISSING_ALERT'
    ) ?? notifications.find((n) => !n.read || !n.isPopupShown);

    if (unshownAlert) {
      setCurrentNotif(unshownAlert);
      setOpen(true);
    }
  }, [notifications, mounted]);

  const handleAcknowledge = () => {
    if (currentNotif) {
      markNotificationRead(currentNotif.id);
      dismissPopup(currentNotif.id);
    }
    setOpen(false);
  };

  if (!mounted || !currentNotif) return null;

  const isMissing = currentNotif.type === 'MISSING_ALERT' || (currentNotif.missingGarments && currentNotif.missingGarments.length > 0);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="max-w-lg border-2 border-red-500/30 dark:border-red-900 shadow-2xl">
        <DialogHeader>
          <div className="flex items-center gap-3">
            <div
              className={cn(
                'p-2.5 rounded-2xl flex items-center justify-center',
                isMissing ? 'bg-red-100 text-red-600 dark:bg-red-950/80 dark:text-red-400' : 'bg-indigo-100 text-indigo-600'
              )}
            >
              {isMissing ? <ShieldAlert className="w-6 h-6 animate-bounce" /> : <Bell className="w-6 h-6" />}
            </div>
            <div>
              <DialogTitle className="text-lg font-black text-foreground">
                {isMissing ? '⚠️ Gate Discrepancy Alert' : '📡 New RFID Gate Notification'}
              </DialogTitle>
              <DialogDescription className="text-xs">
                WhiteFox Automated Gate Detection & Discrepancy System
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="space-y-4 py-2">
          {/* Notification Card */}
          <div
            className={cn(
              'p-4 rounded-xl border space-y-3',
              isMissing
                ? 'bg-red-50/70 dark:bg-red-950/30 border-red-200 dark:border-red-900'
                : 'bg-muted/40 border-border'
            )}
          >
            <div className="flex items-center justify-between">
              <Badge className={cn(isMissing ? 'bg-red-600 text-white' : 'bg-indigo-600 text-white')}>
                {currentNotif.gateName ?? 'RFID Checkpoint'}
              </Badge>
              <span className="text-xs text-muted-foreground font-medium">{currentNotif.timestamp}</span>
            </div>

            <div>
              <p className="font-bold text-sm text-foreground">{currentNotif.title}</p>
              <p className="text-xs text-muted-foreground mt-1 leading-relaxed">{currentNotif.message}</p>
            </div>

            {/* Client and Count Info */}
            <div className="grid grid-cols-2 gap-2 text-xs bg-white dark:bg-card p-3 rounded-lg border">
              <div>
                <span className="text-muted-foreground block text-[11px]">Client Organization</span>
                <span className="font-bold text-foreground">{currentNotif.tenantName ?? 'All Clients'}</span>
              </div>
              <div>
                <span className="text-muted-foreground block text-[11px]">Garment Count</span>
                <span className="font-bold text-foreground">
                  {currentNotif.detectedCount ?? 0} Detected / {currentNotif.expectedCount ?? 0} Expected
                </span>
              </div>
            </div>

            {/* Missing Garments Specific Breakdown */}
            {currentNotif.missingGarments && currentNotif.missingGarments.length > 0 && (
              <div className="space-y-2 pt-2 border-t border-red-200 dark:border-red-900">
                <p className="text-xs font-bold text-red-700 dark:text-red-300 flex items-center gap-1.5">
                  <AlertTriangle className="w-3.5 h-3.5" />
                  Identified Missing Clothes ({currentNotif.missingGarments.length}):
                </p>
                <div className="space-y-1.5">
                  {currentNotif.missingGarments.map((g, idx) => (
                    <div
                      key={idx}
                      className="flex items-center justify-between p-2 rounded-lg bg-white dark:bg-card border border-red-200 text-xs shadow-sm"
                    >
                      <div>
                        <span className="font-mono font-bold text-red-600">{g.assetId}</span>
                        <p className="text-[11px] text-muted-foreground font-medium">
                          {g.employeeName} · {g.department} ({g.garmentType})
                        </p>
                      </div>
                      <Badge variant="outline" className="bg-red-50 text-red-700 border-red-300 text-[10px]">
                        Missing at Gate
                      </Badge>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        <DialogFooter className="gap-2 sm:gap-0">
          <Button
            onClick={handleAcknowledge}
            className="w-full bg-violet-600 hover:bg-violet-700 text-white font-semibold cursor-pointer"
          >
            <Check className="w-4 h-4 mr-1.5" /> Acknowledge & Open Dashboard
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

/* ──────────────── Full Notification Center Tab / Inbox ──────────────── */
export function AdminNotificationCenter() {
  const {
    notifications,
    markNotificationRead,
    markAllNotificationsRead,
    clearNotifications,
  } = useWhiteFoxStore();

  const [filterType, setFilterType] = useState<'ALL' | 'MISSING_ALERT' | 'GATE_1' | 'GATE_2' | 'GATE_3'>('ALL');

  const unreadCount = notifications.filter((n) => !n.read).length;

  const filteredNotifications = notifications.filter((n) => {
    if (filterType === 'MISSING_ALERT') return n.type === 'MISSING_ALERT' || (n.missingGarments && n.missingGarments.length > 0);
    if (filterType === 'GATE_1') return n.gate === 'GATE_1_COLLECTION';
    if (filterType === 'GATE_2') return n.gate === 'GATE_2_CLEANING';
    if (filterType === 'GATE_3') return n.gate === 'GATE_3_DELIVERY';
    return true;
  });

  return (
    <Card className="shadow-sm">
      <CardHeader className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b">
        <div>
          <div className="flex items-center gap-2">
            <Bell className="w-5 h-5 text-violet-600" />
            <CardTitle className="text-lg">Admin Notification Center & Gate Discrepancy Stream</CardTitle>
            {unreadCount > 0 && (
              <Badge className="bg-red-600 text-white font-bold text-xs">{unreadCount} Unread</Badge>
            )}
          </div>
          <CardDescription className="mt-1">
            Historical and real-time alerts from RFID Gates (Collection, Cleaning, Delivery), detected client uniforms, and missing items
          </CardDescription>
        </div>

        <div className="flex items-center gap-2">
          {unreadCount > 0 && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                markAllNotificationsRead();
                toast.success('All notifications marked as read');
              }}
              className="text-xs gap-1 cursor-pointer"
            >
              <CheckCircle2 className="w-3.5 h-3.5 text-green-600" /> Mark All Read
            </Button>
          )}
          {notifications.length > 0 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                clearNotifications();
                toast.success('Notification inbox cleared');
              }}
              className="text-xs text-red-500 hover:text-red-600 hover:bg-red-50 gap-1 cursor-pointer"
            >
              <Trash2 className="w-3.5 h-3.5" /> Clear Inbox
            </Button>
          )}
        </div>
      </CardHeader>

      <CardContent className="p-6 space-y-4">
        {/* Filter Toolbar */}
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs text-muted-foreground font-semibold flex items-center gap-1 mr-1">
            <Filter className="w-3.5 h-3.5" /> Filter Alerts:
          </span>
          {[
            { id: 'ALL', label: `All Alerts (${notifications.length})` },
            {
              id: 'MISSING_ALERT',
              label: `🚨 Missing Cloth Alerts (${notifications.filter((n) => n.type === 'MISSING_ALERT').length})`,
              alert: true,
            },
            { id: 'GATE_1', label: 'Gate 1 (Collection)' },
            { id: 'GATE_2', label: 'Gate 2 (Cleaning)' },
            { id: 'GATE_3', label: 'Gate 3 (Delivery)' },
          ].map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setFilterType(tab.id as typeof filterType)}
              className={cn(
                'px-3 py-1.5 rounded-full text-xs font-semibold border transition-all cursor-pointer',
                filterType === tab.id
                  ? 'bg-violet-600 text-white border-violet-600 shadow-sm'
                  : tab.alert
                  ? 'bg-red-50 text-red-700 border-red-200 hover:bg-red-100'
                  : 'bg-muted/60 text-muted-foreground border-border hover:bg-muted'
              )}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Notifications List */}
        <div className="space-y-3 pt-2">
          {filteredNotifications.length === 0 ? (
            <div className="text-center py-12 border rounded-2xl bg-muted/20 space-y-2">
              <CheckCircle2 className="w-8 h-8 text-muted-foreground mx-auto" />
              <p className="text-sm font-semibold text-foreground">No notifications in this filter</p>
              <p className="text-xs text-muted-foreground max-w-sm mx-auto">
                Trigger RFID scans in the RFID Tunneling Station tab to simulate real-time gate pass alerts.
              </p>
            </div>
          ) : (
            filteredNotifications.map((notif) => {
              const isMissing = notif.type === 'MISSING_ALERT' || (notif.missingGarments && notif.missingGarments.length > 0);

              return (
                <div
                  key={notif.id}
                  onClick={() => markNotificationRead(notif.id)}
                  className={cn(
                    'p-4 rounded-2xl border transition-all cursor-pointer space-y-3',
                    !notif.read && 'ring-2 ring-violet-500/30',
                    isMissing
                      ? 'bg-red-50/50 dark:bg-red-950/20 border-red-200 dark:border-red-900/60'
                      : notif.read
                      ? 'bg-card border-border hover:border-violet-300'
                      : 'bg-violet-50/30 dark:bg-violet-950/20 border-violet-200 dark:border-violet-900/40'
                  )}
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <Badge
                        className={cn(
                          'text-xs font-semibold',
                          isMissing
                            ? 'bg-red-600 text-white'
                            : notif.gate === 'GATE_1_COLLECTION'
                            ? 'bg-blue-600 text-white'
                            : notif.gate === 'GATE_2_CLEANING'
                            ? 'bg-amber-600 text-white'
                            : 'bg-emerald-600 text-white'
                        )}
                      >
                        {notif.gateName ?? 'Gate Alert'}
                      </Badge>
                      <Badge variant="outline" className="text-xs">
                        Client: {notif.tenantName ?? 'All Clients'}
                      </Badge>
                      {!notif.read && (
                        <Badge className="bg-violet-600 text-white text-[10px] px-1.5 py-0">NEW</Badge>
                      )}
                    </div>
                    <span className="text-xs text-muted-foreground">{notif.timestamp}</span>
                  </div>

                  <div>
                    <h4 className="font-bold text-sm text-foreground flex items-center gap-1.5">
                      {isMissing && <AlertTriangle className="w-4 h-4 text-red-600 shrink-0" />}
                      {notif.title}
                    </h4>
                    <p className="text-xs text-muted-foreground mt-1 leading-relaxed">{notif.message}</p>
                  </div>

                  {/* Missing Garment Pill Box */}
                  {notif.missingGarments && notif.missingGarments.length > 0 && (
                    <div className="p-3 bg-red-100/70 dark:bg-red-950/40 rounded-xl border border-red-200 dark:border-red-900 space-y-1.5">
                      <p className="text-xs font-bold text-red-800 dark:text-red-200 flex items-center gap-1">
                        <ShieldAlert className="w-3.5 h-3.5" /> Missing Garment Report:
                      </p>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        {notif.missingGarments.map((missing, idx) => (
                          <div
                            key={idx}
                            className="bg-white dark:bg-card p-2 rounded-lg border border-red-200 text-xs shadow-xs"
                          >
                            <span className="font-mono font-bold text-red-600">{missing.assetId}</span>
                            <p className="text-foreground text-[11px] font-medium">
                              Staff: {missing.employeeName} ({missing.employeeCode})
                            </p>
                            <p className="text-muted-foreground text-[10px]">
                              Dept: {missing.department} · {missing.garmentType}
                            </p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      </CardContent>
    </Card>
  );
}
