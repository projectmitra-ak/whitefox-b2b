package com.whitefox.tenant.service;

import com.whitefox.common.tenant.TenantContext;
import com.whitefox.tenant.dto.CreateTenantRequest;
import com.whitefox.tenant.dto.TenantResponse;
import com.whitefox.tenant.dto.UpdateTenantRequest;
import com.whitefox.tenant.entity.Tenant;
import com.whitefox.tenant.repository.TenantRepository;
import com.whitefox.tenant.mapper.TenantMapper;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Collections;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Transactional
public class TenantService {

    private final TenantRepository tenantRepository;
    private final TenantMapper tenantMapper;

    public TenantResponse createTenant(CreateTenantRequest request) {
        String code = request.getCode();
        if (tenantRepository.existsByCode(code)) {
            throw new IllegalArgumentException("Tenant with code '" + code + "' already exists");
        }

        Tenant tenant = tenantMapper.toEntity(request);
        Tenant saved = tenantRepository.save(tenant);
        return tenantMapper.toResponse(saved);
    }

    @Transactional(readOnly = true)
    public Page<TenantResponse> getAllTenants(Pageable pageable) {
        if (TenantContext.isSystemContext()) {
            return tenantRepository.findAll(pageable).map(tenantMapper::toResponse);
        }

        UUID currentTenantId = TenantContext.getTenantId();
        if (currentTenantId != null) {
            return tenantRepository.findById(currentTenantId)
                    .map(tenant -> new PageImpl<>(Collections.singletonList(tenantMapper.toResponse(tenant)), pageable, 1))
                    .orElse(new PageImpl<>(Collections.emptyList(), pageable, 0));
        }

        return new PageImpl<>(Collections.emptyList(), pageable, 0);
    }

    @Transactional(readOnly = true)
    public TenantResponse getTenantById(UUID id) {
        Tenant tenant = tenantRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Tenant not found: " + id));

        validateTenantAccess(tenant.getId());
        return tenantMapper.toResponse(tenant);
    }

    public TenantResponse updateTenant(UUID id, UpdateTenantRequest request) {
        Tenant tenant = tenantRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Tenant not found: " + id));

        validateTenantAccess(tenant.getId());
        tenantMapper.updateEntity(tenant, request);
        Tenant saved = tenantRepository.save(tenant);
        return tenantMapper.toResponse(saved);
    }

    public void deleteTenant(UUID id) {
        Tenant tenant = tenantRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Tenant not found: " + id));

        validateTenantAccess(tenant.getId());
        tenant.setStatus(Tenant.TenantStatus.INACTIVE);
        tenantRepository.save(tenant);
    }

    private void validateTenantAccess(UUID tenantId) {
        if (!TenantContext.isSystemContext()) {
            UUID currentTenantId = TenantContext.getTenantId();
            if (currentTenantId == null || !currentTenantId.equals(tenantId)) {
                throw new SecurityException("Access denied to tenant: " + tenantId);
            }
        }
    }
}