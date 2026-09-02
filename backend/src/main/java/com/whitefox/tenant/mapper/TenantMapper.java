package com.whitefox.tenant.mapper;

import com.whitefox.tenant.dto.CreateTenantRequest;
import com.whitefox.tenant.dto.TenantResponse;
import com.whitefox.tenant.dto.UpdateTenantRequest;
import com.whitefox.tenant.entity.Tenant;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;
import org.mapstruct.MappingTarget;
import org.mapstruct.factory.Mappers;

@Mapper(componentModel = "spring")
public interface TenantMapper {

    TenantMapper INSTANCE = Mappers.getMapper(TenantMapper.class);

    @Mapping(target = "id", ignore = true)
    @Mapping(target = "createdAt", ignore = true)
    @Mapping(target = "updatedAt", ignore = true)
    @Mapping(target = "createdBy", ignore = true)
    @Mapping(target = "updatedBy", ignore = true)
    @Mapping(target = "branches", ignore = true)
    Tenant toEntity(CreateTenantRequest request);

    @Mapping(target = "id", ignore = true)
    @Mapping(target = "createdAt", ignore = true)
    @Mapping(target = "updatedAt", ignore = true)
    @Mapping(target = "createdBy", ignore = true)
    @Mapping(target = "updatedBy", ignore = true)
    @Mapping(target = "branches", ignore = true)
    void updateEntity(@MappingTarget Tenant tenant, UpdateTenantRequest request);

    TenantResponse toResponse(Tenant tenant);
}