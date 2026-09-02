package com.whitefox.tenant.dto;

import com.whitefox.tenant.entity.Tenant;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.Instant;
import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class TenantResponse {

    private UUID id;
    private String code;
    private String name;
    private String legalName;
    private String taxId;
    private Tenant.TenantStatus status;
    private Tenant.Industry industry;
    private String addressLine1;
    private String addressLine2;
    private String city;
    private String state;
    private String country;
    private String postalCode;
    private Double gpsLatitude;
    private Double gpsLongitude;
    private String phone;
    private String email;
    private String website;
    private String logoUrl;
    private String timezone;
    private String currency;
    private String language;
    private String settings;
    private Instant createdAt;
    private Instant updatedAt;
    private UUID createdBy;
    private UUID updatedBy;
}