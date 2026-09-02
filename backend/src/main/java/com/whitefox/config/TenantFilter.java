package com.whitefox.config;

import com.whitefox.common.tenant.TenantContext;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.util.UUID;

public class TenantFilter extends OncePerRequestFilter {

    private static final Logger log = LoggerFactory.getLogger(TenantFilter.class);

    @Value("${whitefox.multi-tenancy.header-name:X-Tenant-ID}")
    private String tenantHeaderName;

    @Value("${whitefox.multi-tenancy.default-tenant:system}")
    private String defaultTenant;

    @Override
    protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response, FilterChain filterChain)
            throws ServletException, IOException {

        // Temporarily skip tenant filter for debugging
        filterChain.doFilter(request, response);
    }

    private boolean isSystemEndpoint(String uri) {
        return uri.startsWith("/api/v1/system") ||
               uri.startsWith("/api/v1/auth") ||
               uri.startsWith("/actuator") ||
               uri.startsWith("/v3/api-docs") ||
               uri.startsWith("/swagger-ui");
    }
}