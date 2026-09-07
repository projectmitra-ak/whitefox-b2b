'use client';

import { useState } from 'react';
import {
  useWhiteFoxStore,
  type Invoice,
  type WfTenant,
  type BillingSettings,
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
  Receipt,
  Plus,
  Pencil,
  Trash2,
  Printer,
  Download,
  Percent,
  Calculator,
  Building2,
  Calendar,
  CheckCircle2,
  Sparkles,
  FileSpreadsheet,
  Shirt,
  ShieldCheck,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { cn } from '@/lib/utils';

interface DetailedBillingViewProps {
  mode: 'ADMIN' | 'TENANT';
  tenantId?: string;
}

export function DetailedBillingView({ mode, tenantId }: DetailedBillingViewProps) {
  const {
    invoices,
    tenants,
    billingSettings,
    addInvoice,
    updateInvoice,
    deleteInvoice,
    updateBillingSettings,
  } = useWhiteFoxStore();

  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);
  const [showPreviewModal, setShowPreviewModal] = useState<boolean>(false);
  const [showInvoiceModal, setShowInvoiceModal] = useState<boolean>(false);
  const [editingInvoice, setEditingInvoice] = useState<Invoice | null>(null);
  const [filterTenant, setFilterTenant] = useState<string>(tenantId ?? 'ALL');
  const [showGstConfigModal, setShowGstConfigModal] = useState<boolean>(false);

  // Filter invoices
  const targetInvoices = invoices.filter((inv) => {
    if (mode === 'TENANT') {
      return inv.tenantId === (tenantId ?? 'tnt-1');
    }
    if (filterTenant !== 'ALL') {
      return inv.tenantId === filterTenant;
    }
    return true;
  });

  const totalBilled = targetInvoices.reduce((s, inv) => s + inv.totalAmount, 0);
  const totalGarmentsCleaned = targetInvoices.reduce((s, inv) => s + inv.totalGarmentsCleaned, 0);
  const totalGstCollected = targetInvoices.reduce((s, inv) => s + inv.taxAmount, 0);

  const handleOpenInvoicePreview = (inv: Invoice) => {
    setSelectedInvoice(inv);
    setShowPreviewModal(true);
  };

  return (
    <div className="space-y-6">
      {/* ── Top Summary & Admin GST Setting Bar ── */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="p-4 bg-card shadow-sm border">
          <p className="text-xs text-muted-foreground font-semibold">Total Invoiced Amount</p>
          <p className="text-2xl font-black text-foreground mt-1">₹{totalBilled.toLocaleString()}</p>
          <p className="text-[11px] text-emerald-600 font-medium mt-0.5">Across {targetInvoices.length} billing cycles</p>
        </Card>

        <Card className="p-4 bg-card shadow-sm border">
          <p className="text-xs text-muted-foreground font-semibold">Total Garments Washed</p>
          <p className="text-2xl font-black text-blue-600 mt-1">{totalGarmentsCleaned.toLocaleString()} pcs</p>
          <p className="text-[11px] text-muted-foreground mt-0.5">RFID validated cycles</p>
        </Card>

        <Card className="p-4 bg-card shadow-sm border">
          <p className="text-xs text-muted-foreground font-semibold">Total GST (Tax) Amount</p>
          <p className="text-2xl font-black text-indigo-600 mt-1">₹{totalGstCollected.toLocaleString()}</p>
          <p className="text-[11px] text-muted-foreground mt-0.5">At standard {billingSettings.defaultGstPercent}% GST</p>
        </Card>

        {mode === 'ADMIN' && (
          <Card className="p-4 bg-gradient-to-br from-violet-50 to-indigo-50 dark:from-violet-950/40 dark:to-indigo-950/40 border-violet-200 dark:border-violet-900 shadow-sm flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-violet-900 dark:text-violet-200 flex items-center gap-1">
                  <Percent className="w-3.5 h-3.5 text-violet-600" /> GST Tax Setting
                </span>
                <Badge className="bg-violet-600 text-white font-bold">{billingSettings.defaultGstPercent}%</Badge>
              </div>
              <p className="text-[11px] text-muted-foreground mt-1">
                Admin configurable rate applied to all generated invoices
              </p>
            </div>
            <Button
              size="sm"
              variant="outline"
              onClick={() => setShowGstConfigModal(true)}
              className="w-full mt-2 text-xs font-semibold text-violet-700 dark:text-violet-300 border-violet-300 hover:bg-violet-100 cursor-pointer h-8"
            >
              <Percent className="w-3 h-3 mr-1" /> Adjust GST & Rates
            </Button>
          </Card>
        )}
      </div>

      {/* ── Main Invoices Table Card ── */}
      <Card className="shadow-sm">
        <CardHeader className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b">
          <div>
            <CardTitle className="text-lg flex items-center gap-2">
              <Receipt className="w-5 h-5 text-emerald-600" />
              {mode === 'ADMIN' ? 'Commercial Laundry Invoices & Tax Statements' : 'Organization Invoices & Detailed Wash Bills'}
            </CardTitle>
            <CardDescription className="mt-0.5">
              Itemized billing statements: unit wash rates, express surcharges, missing cloth deductions & GST breakdown
            </CardDescription>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {mode === 'ADMIN' && (
              <>
                <div className="w-48">
                  <Select value={filterTenant} onValueChange={setFilterTenant}>
                    <SelectTrigger className="text-xs h-9">
                      <SelectValue placeholder="All Clients" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="ALL">All Organizations</SelectItem>
                      {tenants.map((t) => (
                        <SelectItem key={t.id} value={t.id}>
                          {t.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <Button
                  size="sm"
                  onClick={() => {
                    setEditingInvoice(null);
                    setShowInvoiceModal(true);
                  }}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white gap-1 font-semibold text-xs h-9 cursor-pointer"
                >
                  <Plus className="w-4 h-4" /> Generate Detailed Bill
                </Button>
              </>
            )}
          </div>
        </CardHeader>

        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/40">
                <TableHead>Invoice #</TableHead>
                {mode === 'ADMIN' && <TableHead>Client Organization</TableHead>}
                <TableHead>Billing Period</TableHead>
                <TableHead>Total Clothes</TableHead>
                <TableHead>Rate / Wash</TableHead>
                <TableHead>Base Amount</TableHead>
                <TableHead>GST ({billingSettings.defaultGstPercent}%)</TableHead>
                <TableHead>Grand Total (₹)</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {targetInvoices.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={mode === 'ADMIN' ? 10 : 9} className="text-center py-10 text-muted-foreground">
                    No invoices found. {mode === 'ADMIN' && 'Click "Generate Detailed Bill" to issue an itemized statement.'}
                  </TableCell>
                </TableRow>
              ) : (
                targetInvoices.map((inv) => (
                  <TableRow key={inv.id} className="hover:bg-muted/40">
                    <TableCell className="font-mono font-bold text-foreground">
                      {inv.invoiceNumber}
                    </TableCell>
                    {mode === 'ADMIN' && (
                      <TableCell>
                        <p className="font-semibold text-sm">{inv.tenantName}</p>
                        <Badge variant="outline" className="text-[10px]">
                          {inv.tenantCode}
                        </Badge>
                      </TableCell>
                    )}
                    <TableCell className="text-xs text-muted-foreground font-medium">
                      {inv.billingPeriodStart} to {inv.billingPeriodEnd}
                    </TableCell>
                    <TableCell className="font-mono font-semibold">
                      {inv.totalGarmentsCleaned.toLocaleString()} pcs
                    </TableCell>
                    <TableCell className="font-mono text-xs">
                      ₹{inv.ratePerWash}/cloth
                    </TableCell>
                    <TableCell className="font-mono text-xs text-muted-foreground">
                      ₹{inv.baseAmount.toLocaleString()}
                    </TableCell>
                    <TableCell className="font-mono text-xs text-indigo-600 font-semibold">
                      ₹{inv.taxAmount.toLocaleString()} ({inv.taxGstPercent}%)
                    </TableCell>
                    <TableCell className="font-mono font-black text-sm text-foreground">
                      ₹{inv.totalAmount.toLocaleString()}
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant="outline"
                        className={cn(
                          inv.status === 'PAID'
                            ? 'bg-emerald-100 text-emerald-800 border-emerald-300'
                            : inv.status === 'PENDING'
                            ? 'bg-amber-100 text-amber-800 border-amber-300'
                            : 'bg-red-100 text-red-800 border-red-300'
                        )}
                      >
                        {inv.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleOpenInvoicePreview(inv)}
                          className="text-xs gap-1 cursor-pointer h-8"
                        >
                          <Printer className="w-3.5 h-3.5 text-slate-600" /> View / Print Tax Bill
                        </Button>

                        {mode === 'ADMIN' && (
                          <>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => {
                                setEditingInvoice(inv);
                                setShowInvoiceModal(true);
                              }}
                              className="h-8 w-8 text-blue-600 cursor-pointer"
                              title="Edit Bill"
                            >
                              <Pencil className="w-3.5 h-3.5" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => {
                                deleteInvoice(inv.id);
                                toast.success(`Invoice ${inv.invoiceNumber} removed`);
                              }}
                              className="h-8 w-8 text-red-500 cursor-pointer"
                              title="Delete Bill"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </Button>
                          </>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* ── Modal 1: Printable & Downloadable Detailed GST Tax Invoice Modal ── */}
      {selectedInvoice && (
        <Dialog open={showPreviewModal} onOpenChange={setShowPreviewModal}>
          <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <div className="flex items-center justify-between">
                <div>
                  <DialogTitle className="text-xl font-bold flex items-center gap-2">
                    <Receipt className="w-5 h-5 text-emerald-600" />
                    Tax Invoice & Itemized Wash Statement
                  </DialogTitle>
                  <DialogDescription className="text-xs font-mono">
                    Invoice #{selectedInvoice.invoiceNumber} · GST Compliant B2B Tax Document
                  </DialogDescription>
                </div>
                <Badge
                  className={cn(
                    'font-mono text-xs px-3 py-1',
                    selectedInvoice.status === 'PAID'
                      ? 'bg-emerald-600 text-white'
                      : 'bg-amber-600 text-white'
                  )}
                >
                  {selectedInvoice.status}
                </Badge>
              </div>
            </DialogHeader>

            {/* Printable Tax Invoice Paper Box */}
            <div className="p-6 rounded-2xl border bg-white dark:bg-card text-foreground space-y-6 shadow-xs text-xs">
              {/* Header Info */}
              <div className="flex justify-between border-b pb-4">
                <div>
                  <h3 className="font-black text-base text-violet-700">WHITEFOX LAUNDRY TECHNOLOGIES</h3>
                  <p className="text-muted-foreground text-[11px] mt-0.5">B2B Commercial RFID Laundry & Linen Automation</p>
                  <p className="text-muted-foreground text-[11px]">GSTIN: 27AABCW1234F1Z8 · Mumbai, MH, India</p>
                </div>
                <div className="text-right">
                  <p className="font-bold text-foreground">INVOICE TO:</p>
                  <p className="font-bold text-sm text-blue-600">{selectedInvoice.tenantName}</p>
                  <p className="text-muted-foreground">Code: {selectedInvoice.tenantCode}</p>
                  <p className="text-muted-foreground">Billing Period: {selectedInvoice.billingPeriodStart} to {selectedInvoice.billingPeriodEnd}</p>
                  <p className="text-muted-foreground">Due Date: {selectedInvoice.dueDate}</p>
                </div>
              </div>

              {/* Itemized Cost Breakdown Table */}
              <div className="space-y-2">
                <p className="font-bold text-sm">Itemized Garment Wash & Surcharge Breakdown:</p>
                <div className="border rounded-xl overflow-hidden">
                  <table className="w-full text-left">
                    <thead className="bg-muted/60 text-[11px] font-bold text-muted-foreground border-b">
                      <tr>
                        <th className="p-2.5">Description</th>
                        <th className="p-2.5 text-center">Garment Type</th>
                        <th className="p-2.5 text-center">Quantity (pcs)</th>
                        <th className="p-2.5 text-right">Rate / Cloth (₹)</th>
                        <th className="p-2.5 text-right">Amount (₹)</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y text-xs">
                      {selectedInvoice.items && selectedInvoice.items.length > 0 ? (
                        selectedInvoice.items.map((item) => (
                          <tr key={item.id}>
                            <td className="p-2.5 font-medium">{item.description}</td>
                            <td className="p-2.5 text-center font-mono text-[11px]">{item.garmentType}</td>
                            <td className="p-2.5 text-center font-mono">{item.quantity}</td>
                            <td className="p-2.5 text-right font-mono">₹{item.ratePerWash}</td>
                            <td className="p-2.5 text-right font-mono font-bold">₹{item.amount.toLocaleString()}</td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td className="p-2.5 font-medium">Standard RFID Medical / Staff Uniform Wash & Iron Cycle</td>
                          <td className="p-2.5 text-center font-mono">Uniform / Scrub</td>
                          <td className="p-2.5 text-center font-mono">{selectedInvoice.totalGarmentsCleaned}</td>
                          <td className="p-2.5 text-right font-mono">₹{selectedInvoice.ratePerWash}</td>
                          <td className="p-2.5 text-right font-mono font-bold">₹{selectedInvoice.baseAmount.toLocaleString()}</td>
                        </tr>
                      )}

                      {/* Surcharges */}
                      {selectedInvoice.expressCharges > 0 && (
                        <tr className="bg-slate-50/50 dark:bg-slate-900/30">
                          <td colSpan={4} className="p-2.5 text-muted-foreground font-medium">
                            ⚡ Express Turnaround Surcharge (&lt;12 Hours)
                          </td>
                          <td className="p-2.5 text-right font-mono font-semibold">
                            ₹{selectedInvoice.expressCharges.toLocaleString()}
                          </td>
                        </tr>
                      )}
                      {selectedInvoice.disinfectionCharges > 0 && (
                        <tr className="bg-slate-50/50 dark:bg-slate-900/30">
                          <td colSpan={4} className="p-2.5 text-muted-foreground font-medium">
                            🛡️ Autoclave & Thermal Barrier Disinfection QC (75°C)
                          </td>
                          <td className="p-2.5 text-right font-mono font-semibold">
                            ₹{selectedInvoice.disinfectionCharges.toLocaleString()}
                          </td>
                        </tr>
                      )}
                      {selectedInvoice.missingGarmentPenalty > 0 && (
                        <tr className="bg-red-50/50 dark:bg-red-950/20">
                          <td colSpan={4} className="p-2.5 text-red-600 font-medium">
                            ⚠️ Missing Garment Replacement Deduction
                          </td>
                          <td className="p-2.5 text-right font-mono font-semibold text-red-600">
                            +₹{selectedInvoice.missingGarmentPenalty.toLocaleString()}
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Tax & Total Calculation Box */}
              <div className="flex justify-end pt-2">
                <div className="w-72 space-y-1.5 p-4 rounded-xl bg-slate-50 dark:bg-slate-900 border">
                  <div className="flex justify-between text-xs text-muted-foreground">
                    <span>Taxable Subtotal:</span>
                    <span className="font-mono font-semibold text-foreground">
                      ₹{(selectedInvoice.baseAmount + selectedInvoice.expressCharges + selectedInvoice.disinfectionCharges + (selectedInvoice.missingGarmentPenalty || 0)).toLocaleString()}
                    </span>
                  </div>
                  <div className="flex justify-between text-xs text-muted-foreground">
                    <span>GST ({selectedInvoice.taxGstPercent}%):</span>
                    <span className="font-mono font-semibold text-indigo-600">
                      ₹{selectedInvoice.taxAmount.toLocaleString()}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm font-bold pt-2 border-t text-foreground">
                    <span>Grand Total:</span>
                    <span className="font-mono text-base text-emerald-600">
                      ₹{selectedInvoice.totalAmount.toLocaleString()}
                    </span>
                  </div>
                </div>
              </div>

              {/* Footer Note */}
              <p className="text-[11px] text-muted-foreground pt-2 border-t">
                <strong>Notes:</strong> {selectedInvoice.notes ?? 'Payment due within 15 days of invoice date. Electronic B2B invoice generated by WhiteFox RFID System.'}
              </p>
            </div>

            <DialogFooter className="flex flex-col sm:flex-row gap-2">
              <Button
                variant="outline"
                onClick={() => window.print()}
                className="gap-1.5 text-xs font-semibold cursor-pointer"
              >
                <Printer className="w-4 h-4" /> Print Tax Invoice
              </Button>
              <Button
                onClick={() => {
                  toast.success(`Invoice ${selectedInvoice.invoiceNumber} downloaded as PDF`);
                  setShowPreviewModal(false);
                }}
                className="bg-emerald-600 hover:bg-emerald-700 text-white gap-1.5 text-xs font-semibold cursor-pointer"
              >
                <Download className="w-4 h-4" /> Download PDF Statement
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}

      {/* ── Modal 2: Admin GST Percentage & Base Rates Adjuster Modal ── */}
      {showGstConfigModal && (
        <Dialog open={showGstConfigModal} onOpenChange={setShowGstConfigModal}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Percent className="w-5 h-5 text-violet-600" />
                Configure GST Tax & Commercial Wash Rates
              </DialogTitle>
              <DialogDescription className="text-xs">
                Changes here will automatically update tax calculation for all future invoice generations
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 py-3">
              <div>
                <Label className="text-xs font-bold">Admin GST Tax Rate (%):</Label>
                <div className="grid grid-cols-4 gap-2 mt-2">
                  {[0, 5, 12, 18, 28].map((gst) => (
                    <button
                      key={gst}
                      type="button"
                      onClick={() => updateBillingSettings({ defaultGstPercent: gst })}
                      className={cn(
                        'py-2 rounded-xl text-xs font-bold border transition-all cursor-pointer',
                        billingSettings.defaultGstPercent === gst
                          ? 'bg-violet-600 text-white border-violet-600 shadow-md'
                          : 'bg-muted/60 text-muted-foreground hover:bg-muted border-border'
                      )}
                    >
                      {gst}% GST
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <Label className="text-xs">Custom Standard Wash Rate / Cloth (₹):</Label>
                <Input
                  type="number"
                  value={billingSettings.defaultRatePerWash}
                  onChange={(e) =>
                    updateBillingSettings({ defaultRatePerWash: Number(e.target.value) || 18 })
                  }
                  className="mt-1"
                />
              </div>

              <div>
                <Label className="text-xs">Disinfection & Barrier Sterilization Surcharge (₹):</Label>
                <Input
                  type="number"
                  value={billingSettings.disinfectionRate}
                  onChange={(e) =>
                    updateBillingSettings({ disinfectionRate: Number(e.target.value) || 0 })
                  }
                  className="mt-1"
                />
              </div>

              <div>
                <Label className="text-xs">Missing Garment Replacement Fine (₹):</Label>
                <Input
                  type="number"
                  value={billingSettings.missingGarmentFine}
                  onChange={(e) =>
                    updateBillingSettings({ missingGarmentFine: Number(e.target.value) || 0 })
                  }
                  className="mt-1"
                />
              </div>
            </div>

            <DialogFooter>
              <Button
                onClick={() => {
                  setShowGstConfigModal(false);
                  toast.success(`GST Tax Rate set to ${billingSettings.defaultGstPercent}%!`);
                }}
                className="w-full bg-violet-600 hover:bg-violet-700 text-white font-semibold cursor-pointer"
              >
                Save GST & Rate Configuration
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}

      {/* ── Modal 3: Generate / Edit Invoice Modal ── */}
      {showInvoiceModal && (
        <InvoiceGenerationModal
          open={showInvoiceModal}
          onClose={() => setShowInvoiceModal(false)}
          tenants={tenants}
          gstPercent={billingSettings.defaultGstPercent}
          initial={editingInvoice}
        />
      )}
    </div>
  );
}

/* ──────────────── Helper Modal for Invoice Creation ──────────────── */
function InvoiceGenerationModal({
  open,
  onClose,
  tenants,
  gstPercent,
  initial,
}: {
  open: boolean;
  onClose: () => void;
  tenants: WfTenant[];
  gstPercent: number;
  initial: Invoice | null;
}) {
  const { addInvoice, updateInvoice } = useWhiteFoxStore();

  const [tenantId, setTenantId] = useState<string>(initial?.tenantId ?? tenants[0]?.id ?? '');
  const [totalGarments, setTotalGarments] = useState<number>(initial?.totalGarmentsCleaned ?? 850);
  const [ratePerWash, setRatePerWash] = useState<number>(initial?.ratePerWash ?? 18);
  const [expressCharges, setExpressCharges] = useState<number>(initial?.expressCharges ?? 1000);
  const [disinfectionCharges, setDisinfectionCharges] = useState<number>(initial?.disinfectionCharges ?? 1500);
  const [missingPenalty, setMissingPenalty] = useState<number>(initial?.missingGarmentPenalty ?? 0);
  const [gstRate, setGstRate] = useState<number>(initial?.taxGstPercent ?? gstPercent);
  const [status, setStatus] = useState<'PAID' | 'PENDING' | 'OVERDUE'>(initial?.status ?? 'PENDING');
  const [notes, setNotes] = useState<string>(initial?.notes ?? 'Bi-weekly RFID commercial laundry cycle.');

  const selectedTenant = tenants.find((t) => t.id === tenantId) ?? tenants[0];

  const baseAmount = totalGarments * ratePerWash;
  const taxableSubtotal = baseAmount + expressCharges + disinfectionCharges + missingPenalty;
  const taxAmount = (taxableSubtotal * gstRate) / 100;
  const totalAmount = taxableSubtotal + taxAmount;

  const handleSave = () => {
    if (!selectedTenant) {
      toast.error('Please select a client organization');
      return;
    }

    const invoiceData: Omit<Invoice, 'id'> = {
      invoiceNumber: initial?.invoiceNumber ?? `INV-2026-${String(Math.floor(100 + Math.random() * 900))}`,
      tenantId: selectedTenant.id,
      tenantName: selectedTenant.name,
      tenantCode: selectedTenant.code,
      billingPeriodStart: initial?.billingPeriodStart ?? '2026-08-16',
      billingPeriodEnd: initial?.billingPeriodEnd ?? '2026-08-31',
      totalGarmentsCleaned: totalGarments,
      ratePerWash,
      baseAmount,
      expressCharges,
      disinfectionCharges,
      missingGarmentPenalty: missingPenalty,
      taxGstPercent: gstRate,
      taxAmount,
      totalAmount,
      status,
      issuedDate: new Date().toISOString().slice(0, 10),
      dueDate: '2026-09-15',
      notes,
    };

    if (initial) {
      updateInvoice(initial.id, invoiceData);
      toast.success(`Invoice ${initial.invoiceNumber} updated`);
    } else {
      addInvoice(invoiceData);
      toast.success(`Invoice ${invoiceData.invoiceNumber} generated for ${selectedTenant.name}!`);
    }

    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Calculator className="w-5 h-5 text-emerald-600" />
            {initial ? 'Edit Laundry Invoice' : 'Generate Detailed Laundry Bill'}
          </DialogTitle>
          <DialogDescription className="text-xs">
            Calculates base cost per garment wash, add-on surcharges, and configurable GST
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          <div>
            <Label className="text-xs">Client Organization:</Label>
            <Select value={tenantId} onValueChange={setTenantId}>
              <SelectTrigger className="mt-1">
                <SelectValue placeholder="Select Client" />
              </SelectTrigger>
              <SelectContent>
                {tenants.map((t) => (
                  <SelectItem key={t.id} value={t.id}>
                    {t.name} ({t.code})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="text-xs">Garments Cleaned (pcs):</Label>
              <Input
                type="number"
                value={totalGarments}
                onChange={(e) => setTotalGarments(Number(e.target.value) || 0)}
                className="mt-1"
              />
            </div>
            <div>
              <Label className="text-xs">Cost per Cloth / Wash (₹):</Label>
              <Input
                type="number"
                value={ratePerWash}
                onChange={(e) => setRatePerWash(Number(e.target.value) || 0)}
                className="mt-1"
              />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-2">
            <div>
              <Label className="text-xs">Express Surcharge (₹):</Label>
              <Input
                type="number"
                value={expressCharges}
                onChange={(e) => setExpressCharges(Number(e.target.value) || 0)}
                className="mt-1"
              />
            </div>
            <div>
              <Label className="text-xs">Disinfection (₹):</Label>
              <Input
                type="number"
                value={disinfectionCharges}
                onChange={(e) => setDisinfectionCharges(Number(e.target.value) || 0)}
                className="mt-1"
              />
            </div>
            <div>
              <Label className="text-xs">GST Rate (%):</Label>
              <Input
                type="number"
                value={gstRate}
                onChange={(e) => setGstRate(Number(e.target.value) || 0)}
                className="mt-1 font-bold text-indigo-600"
              />
            </div>
          </div>

          <div>
            <Label className="text-xs">Payment Status:</Label>
            <Select value={status} onValueChange={(v) => setStatus(v as typeof status)}>
              <SelectTrigger className="mt-1">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="PENDING">Pending Payment</SelectItem>
                <SelectItem value="PAID">Paid / Completed</SelectItem>
                <SelectItem value="OVERDUE">Overdue</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Live Calculation Preview Card */}
          <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-900 border text-xs space-y-1">
            <div className="flex justify-between text-muted-foreground">
              <span>Base Cloth Wash ({totalGarments} × ₹{ratePerWash}):</span>
              <span className="font-mono font-semibold text-foreground">₹{baseAmount.toLocaleString()}</span>
            </div>
            <div className="flex justify-between text-muted-foreground">
              <span>GST ({gstRate}%):</span>
              <span className="font-mono font-semibold text-indigo-600">₹{taxAmount.toLocaleString()}</span>
            </div>
            <div className="flex justify-between font-bold text-sm text-foreground pt-1 border-t">
              <span>Grand Total:</span>
              <span className="font-mono text-emerald-600">₹{totalAmount.toLocaleString()}</span>
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose} className="cursor-pointer">
            Cancel
          </Button>
          <Button
            onClick={handleSave}
            className="bg-emerald-600 hover:bg-emerald-700 text-white font-semibold cursor-pointer"
          >
            {initial ? 'Update Statement' : 'Issue Tax Invoice'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
