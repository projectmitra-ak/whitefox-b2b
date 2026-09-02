'use client';

import dynamic from 'next/dynamic';

const TenantAdminDashboard = dynamic(
  () => import('@/components/dashboard/TenantAdminDashboard').then((mod) => mod.TenantAdminDashboard),
  {
    ssr: false,
    loading: () => (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
          <p className="text-sm text-muted-foreground font-medium">Loading Tenant Portal...</p>
        </div>
      </div>
    ),
  }
);

export default function TenantDashboardPage() {
  return <TenantAdminDashboard />;
}