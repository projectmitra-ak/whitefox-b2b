package com.whitefox.tenant.entity;

import com.whitefox.common.BaseEntity;
import jakarta.persistence.*;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.Instant;
import java.util.HashSet;
import java.util.Set;
import java.util.UUID;

@Entity
@Table(name = "contract", indexes = {
    @Index(name = "idx_contract_tenant", columnList = "tenant_id"),
    @Index(name = "idx_contract_status", columnList = "status"),
    @Index(name = "idx_contract_dates", columnList = "start_date, end_date"),
    @Index(name = "idx_contract_number", columnList = "contract_number", unique = true)
})
public class Contract extends BaseEntity {

    @NotNull
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "tenant_id", nullable = false)
    private Tenant tenant;

    @NotBlank
    @Size(max = 100)
    @Column(name = "contract_number", nullable = false, unique = true, length = 100)
    private String contractNumber;

    @NotBlank
    @Size(max = 255)
    @Column(nullable = false, length = 255)
    private String name;

    @Column(columnDefinition = "text")
    private String description;

    @NotNull
    @Enumerated(EnumType.STRING)
    @Column(name = "contract_type", nullable = false, length = 30)
    private ContractType contractType = ContractType.LAUNDRY_SERVICE;

    @NotNull
    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private ContractStatus status = ContractStatus.DRAFT;

    @NotNull
    @Column(name = "start_date", nullable = false)
    private LocalDate startDate;

    @Column(name = "end_date")
    private LocalDate endDate;

    @Column(name = "auto_renewal")
    private Boolean autoRenewal = false;

    @Column(name = "renewal_notice_days")
    private Integer renewalNoticeDays = 30;

    @NotNull
    @Column(name = "sla_hours", nullable = false)
    private Integer slaHours = 24;

    @Column(name = "sla_penalty_percent", precision = 5, scale = 2)
    private BigDecimal slaPenaltyPercent = BigDecimal.ZERO;

    @NotNull
    @Enumerated(EnumType.STRING)
    @Column(name = "pricing_model", nullable = false, length = 30)
    private PricingModel pricingModel = PricingModel.PER_WASH;

    @NotNull
    @Column(name = "base_price", nullable = false, precision = 12, scale = 2)
    private BigDecimal basePrice = BigDecimal.ZERO;

    @Size(max = 3)
    @Column(name = "currency", length = 3)
    private String currency = "INR";

    @Column(name = "tax_rate", precision = 5, scale = 2)
    private BigDecimal taxRate = BigDecimal.valueOf(18.00);

    @NotNull
    @Enumerated(EnumType.STRING)
    @Column(name = "billing_cycle", nullable = false, length = 20)
    private BillingCycle billingCycle = BillingCycle.MONTHLY;

    @Column(name = "payment_terms_days")
    private Integer paymentTermsDays = 30;

    @Column(name = "included_services", columnDefinition = "jsonb")
    private String includedServices = "[]";

    @Column(name = "excluded_services", columnDefinition = "jsonb")
    private String excludedServices = "[]";

    @Column(columnDefinition = "text")
    private String termsAndConditions;

    @Column(name = "signed_at")
    private Instant signedAt;

    @Column(name = "signed_by")
    private UUID signedBy;

    @OneToMany(mappedBy = "contract", cascade = CascadeType.ALL, orphanRemoval = true)
    private Set<ContractPricingTier> pricingTiers = new HashSet<>();

    public enum ContractType {
        LAUNDRY_SERVICE, RENTAL, PURCHASE, MAINTENANCE, FULL_SERVICE
    }

    public enum ContractStatus {
        DRAFT, ACTIVE, EXPIRED, TERMINATED, RENEWAL_PENDING
    }

    public enum PricingModel {
        PER_WASH, PER_GARMENT_MONTH, PER_EMPLOYEE_MONTH, FLAT_RATE, TIERED
    }

    public enum BillingCycle {
        WEEKLY, BIWEEKLY, MONTHLY, QUARTERLY, ANNUALLY
    }

    // Getters and Setters
    public Tenant getTenant() { return tenant; }
    public void setTenant(Tenant tenant) { this.tenant = tenant; }
    public String getContractNumber() { return contractNumber; }
    public void setContractNumber(String contractNumber) { this.contractNumber = contractNumber; }
    public String getName() { return name; }
    public void setName(String name) { this.name = name; }
    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }
    public ContractType getContractType() { return contractType; }
    public void setContractType(ContractType contractType) { this.contractType = contractType; }
    public ContractStatus getStatus() { return status; }
    public void setStatus(ContractStatus status) { this.status = status; }
    public LocalDate getStartDate() { return startDate; }
    public void setStartDate(LocalDate startDate) { this.startDate = startDate; }
    public LocalDate getEndDate() { return endDate; }
    public void setEndDate(LocalDate endDate) { this.endDate = endDate; }
    public Boolean getAutoRenewal() { return autoRenewal; }
    public void setAutoRenewal(Boolean autoRenewal) { this.autoRenewal = autoRenewal; }
    public Integer getRenewalNoticeDays() { return renewalNoticeDays; }
    public void setRenewalNoticeDays(Integer renewalNoticeDays) { this.renewalNoticeDays = renewalNoticeDays; }
    public Integer getSlaHours() { return slaHours; }
    public void setSlaHours(Integer slaHours) { this.slaHours = slaHours; }
    public BigDecimal getSlaPenaltyPercent() { return slaPenaltyPercent; }
    public void setSlaPenaltyPercent(BigDecimal slaPenaltyPercent) { this.slaPenaltyPercent = slaPenaltyPercent; }
    public PricingModel getPricingModel() { return pricingModel; }
    public void setPricingModel(PricingModel pricingModel) { this.pricingModel = pricingModel; }
    public BigDecimal getBasePrice() { return basePrice; }
    public void setBasePrice(BigDecimal basePrice) { this.basePrice = basePrice; }
    public String getCurrency() { return currency; }
    public void setCurrency(String currency) { this.currency = currency; }
    public BigDecimal getTaxRate() { return taxRate; }
    public void setTaxRate(BigDecimal taxRate) { this.taxRate = taxRate; }
    public BillingCycle getBillingCycle() { return billingCycle; }
    public void setBillingCycle(BillingCycle billingCycle) { this.billingCycle = billingCycle; }
    public Integer getPaymentTermsDays() { return paymentTermsDays; }
    public void setPaymentTermsDays(Integer paymentTermsDays) { this.paymentTermsDays = paymentTermsDays; }
    public String getIncludedServices() { return includedServices; }
    public void setIncludedServices(String includedServices) { this.includedServices = includedServices; }
    public String getExcludedServices() { return excludedServices; }
    public void setExcludedServices(String excludedServices) { this.excludedServices = excludedServices; }
    public String getTermsAndConditions() { return termsAndConditions; }
    public void setTermsAndConditions(String termsAndConditions) { this.termsAndConditions = termsAndConditions; }
    public Instant getSignedAt() { return signedAt; }
    public void setSignedAt(Instant signedAt) { this.signedAt = signedAt; }
    public UUID getSignedBy() { return signedBy; }
    public void setSignedBy(UUID signedBy) { this.signedBy = signedBy; }
    public Set<ContractPricingTier> getPricingTiers() { return pricingTiers; }
    public void setPricingTiers(Set<ContractPricingTier> pricingTiers) { this.pricingTiers = pricingTiers; }
}