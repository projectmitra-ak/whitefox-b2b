package com.whitefox.common.tenant;

import java.util.UUID;

public final class TenantContext {

    private static final ThreadLocal<UUID> CURRENT_TENANT = new ThreadLocal<>();
    private static final ThreadLocal<Boolean> SYSTEM_CONTEXT = new ThreadLocal<>();

    private TenantContext() {}

    public static void setTenantId(UUID tenantId) {
        CURRENT_TENANT.set(tenantId);
    }

    public static UUID getTenantId() {
        return CURRENT_TENANT.get();
    }

    public static void setSystemContext(boolean isSystem) {
        SYSTEM_CONTEXT.set(isSystem);
    }

    public static boolean isSystemContext() {
        return Boolean.TRUE.equals(SYSTEM_CONTEXT.get());
    }

    public static void clear() {
        CURRENT_TENANT.remove();
        SYSTEM_CONTEXT.remove();
    }

    public static boolean hasTenant() {
        return CURRENT_TENANT.get() != null;
    }
}