package com.whitefox.security.authorization;

import com.whitefox.common.tenant.TenantContext;
import com.whitefox.security.entity.AppUser;
import com.whitefox.security.service.UserDetailsServiceImpl;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;

import java.util.Set;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class AuthorizationService {

    private final UserDetailsServiceImpl userDetailsService;

    public enum Permission {
        // Garment permissions
        GARMENT_VIEW_OWN,
        GARMENT_VIEW_TENANT,
        GARMENT_VIEW_ALL,
        GARMENT_CREATE,
        GARMENT_UPDATE,
        GARMENT_DELETE,
        GARMENT_TAG,
        GARMENT_ROTATE_OWN,
        GARMENT_ROTATE_TENANT,

        // Laundry permissions
        LAUNDRY_VIEW_OWN,
        LAUNDRY_VIEW_TENANT,
        LAUNDRY_VIEW_ALL,
        LAUNDRY_CREATE_PICKUP,
        LAUNDRY_MANAGE_PICKUP,
        LAUNDRY_MANAGE_WASH_BATCH,
        LAUNDRY_MANAGE_QC,
        LAUNDRY_MANAGE_DISPATCH,
        LAUNDRY_MANAGE_DELIVERY,

        // Reconciliation permissions
        RECONCILIATION_VIEW_OWN,
        RECONCILIATION_VIEW_TENANT,
        RECONCILIATION_VIEW_ALL,
        RECONCILIATION_RUN,
        RECONCILIATION_RESOLVE,

        // Inventory permissions
        INVENTORY_VIEW_OWN,
        INVENTORY_VIEW_TENANT,
        INVENTORY_VIEW_ALL,

        // Billing permissions
        BILLING_VIEW_OWN,
        BILLING_VIEW_TENANT,
        BILLING_VIEW_ALL,
        BILLING_GENERATE_INVOICE,

        // Admin permissions
        TENANT_MANAGE,
        USER_MANAGE_TENANT,
        USER_MANAGE_ALL,
        SYSTEM_CONFIG,
        AUDIT_LOG_VIEW
    }

    private static final Set<Permission> WHITEFOX_ADMIN_PERMISSIONS = Set.of(Permission.values());

    private static final Set<Permission> TENANT_ADMIN_PERMISSIONS = Set.of(
            Permission.GARMENT_VIEW_TENANT, Permission.GARMENT_CREATE, Permission.GARMENT_UPDATE,
            Permission.GARMENT_TAG, Permission.GARMENT_ROTATE_TENANT,
            Permission.LAUNDRY_VIEW_TENANT, Permission.LAUNDRY_CREATE_PICKUP,
            Permission.LAUNDRY_MANAGE_PICKUP, Permission.LAUNDRY_MANAGE_WASH_BATCH,
            Permission.LAUNDRY_MANAGE_QC, Permission.LAUNDRY_MANAGE_DISPATCH,
            Permission.LAUNDRY_MANAGE_DELIVERY,
            Permission.RECONCILIATION_VIEW_TENANT, Permission.RECONCILIATION_RUN,
            Permission.RECONCILIATION_RESOLVE,
            Permission.INVENTORY_VIEW_TENANT,
            Permission.BILLING_VIEW_TENANT, Permission.BILLING_GENERATE_INVOICE,
            Permission.USER_MANAGE_TENANT, Permission.AUDIT_LOG_VIEW
    );

    private static final Set<Permission> PLANT_MANAGER_PERMISSIONS = Set.of(
            Permission.GARMENT_VIEW_TENANT, Permission.GARMENT_UPDATE,
            Permission.LAUNDRY_VIEW_TENANT, Permission.LAUNDRY_MANAGE_WASH_BATCH,
            Permission.LAUNDRY_MANAGE_QC, Permission.LAUNDRY_MANAGE_DISPATCH,
            Permission.RECONCILIATION_VIEW_TENANT, Permission.RECONCILIATION_RUN,
            Permission.RECONCILIATION_RESOLVE,
            Permission.INVENTORY_VIEW_TENANT
    );

    private static final Set<Permission> DRIVER_PERMISSIONS = Set.of(
            Permission.GARMENT_VIEW_TENANT,
            Permission.LAUNDRY_CREATE_PICKUP, Permission.LAUNDRY_MANAGE_PICKUP,
            Permission.LAUNDRY_MANAGE_DELIVERY
    );

    private static final Set<Permission> EMPLOYEE_PERMISSIONS = Set.of(
            Permission.GARMENT_VIEW_OWN,
            Permission.LAUNDRY_VIEW_OWN,
            Permission.GARMENT_ROTATE_OWN,
            Permission.RECONCILIATION_VIEW_OWN,
            Permission.INVENTORY_VIEW_OWN,
            Permission.BILLING_VIEW_OWN
    );

    private static final Set<Permission> SUPERVISOR_PERMISSIONS = Set.of(
            Permission.GARMENT_VIEW_TENANT, Permission.GARMENT_UPDATE,
            Permission.LAUNDRY_VIEW_TENANT, Permission.LAUNDRY_CREATE_PICKUP,
            Permission.LAUNDRY_MANAGE_PICKUP, Permission.LAUNDRY_MANAGE_DELIVERY,
            Permission.RECONCILIATION_VIEW_TENANT, Permission.RECONCILIATION_RESOLVE,
            Permission.INVENTORY_VIEW_TENANT
    );

    public AppUser getCurrentUser() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth == null || !auth.isAuthenticated()) {
            return null;
        }
        return userDetailsService.loadUserEntityByUsername(auth.getName());
    }

    public UUID getCurrentTenantId() {
        AppUser user = getCurrentUser();
        return user != null && user.getTenant() != null ? user.getTenant().getId() : TenantContext.getTenantId();
    }

    public boolean hasPermission(Permission permission) {
        AppUser user = getCurrentUser();
        if (user == null) return false;

        Set<Permission> userPermissions = getPermissionsForRole(user.getRole());
        return userPermissions.contains(permission);
    }

    public boolean hasAnyPermission(Permission... permissions) {
        for (Permission p : permissions) {
            if (hasPermission(p)) return true;
        }
        return false;
    }

    public boolean hasAllPermissions(Permission... permissions) {
        for (Permission p : permissions) {
            if (!hasPermission(p)) return false;
        }
        return true;
    }

    public boolean canAccessTenant(UUID tenantId) {
        AppUser user = getCurrentUser();
        if (user == null) return false;

        // Platform admin can access any tenant
        if (user.getRole() == AppUser.Role.WHITEFOX_ADMIN) {
            return true;
        }

        // Other roles can only access their own tenant
        return user.getTenant() != null && user.getTenant().getId().equals(tenantId);
    }

    public boolean canAccessGarment(UUID garmentId, UUID garmentTenantId, UUID garmentEmployeeId) {
        AppUser user = getCurrentUser();
        if (user == null) return false;

        // Platform admin can access any garment
        if (user.getRole() == AppUser.Role.WHITEFOX_ADMIN) {
            return true;
        }

        // Must be same tenant
        if (user.getTenant() == null || !user.getTenant().getId().equals(garmentTenantId)) {
            return false;
        }

        // Employee can only see their own garments
        if (user.getRole() == AppUser.Role.EMPLOYEE) {
            return user.getId().equals(garmentEmployeeId);
        }

        // Tenant admin, plant manager, supervisor can see all tenant garments
        return true;
    }

    public boolean canAccessEmployee(UUID employeeId, UUID employeeTenantId) {
        AppUser user = getCurrentUser();
        if (user == null) return false;

        if (user.getRole() == AppUser.Role.WHITEFOX_ADMIN) {
            return true;
        }

        if (user.getTenant() == null || !user.getTenant().getId().equals(employeeTenantId)) {
            return false;
        }

        // Employee can only see themselves
        if (user.getRole() == AppUser.Role.EMPLOYEE) {
            return user.getId().equals(employeeId);
        }

        return true;
    }

    public boolean canAccessLaundryOperation(UUID operationTenantId) {
        return canAccessTenant(operationTenantId) && 
               hasAnyPermission(Permission.LAUNDRY_VIEW_TENANT, Permission.LAUNDRY_VIEW_ALL);
    }

    private Set<Permission> getPermissionsForRole(AppUser.Role role) {
        return switch (role) {
            case WHITEFOX_ADMIN -> WHITEFOX_ADMIN_PERMISSIONS;
            case TENANT_ADMIN -> TENANT_ADMIN_PERMISSIONS;
            case PLANT_MANAGER -> PLANT_MANAGER_PERMISSIONS;
            case PLANT_OPERATOR -> PLANT_MANAGER_PERMISSIONS;
            case DRIVER -> DRIVER_PERMISSIONS;
            case SUPERVISOR -> SUPERVISOR_PERMISSIONS;
            case EMPLOYEE -> EMPLOYEE_PERMISSIONS;
            case AUDITOR -> Set.of(
                    Permission.GARMENT_VIEW_TENANT, Permission.LAUNDRY_VIEW_TENANT,
                    Permission.RECONCILIATION_VIEW_TENANT, Permission.INVENTORY_VIEW_TENANT,
                    Permission.BILLING_VIEW_TENANT, Permission.AUDIT_LOG_VIEW
            );
        };
    }

    public Set<Permission> getCurrentUserPermissions() {
        AppUser user = getCurrentUser();
        if (user == null) return Set.of();
        return getPermissionsForRole(user.getRole());
    }
}