package com.whitefox.asset.entity;

import com.whitefox.common.BaseEntity;
import com.whitefox.tenant.entity.Tenant;
import jakarta.persistence.*;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;
import java.util.UUID;

@Entity
@Table(name = "garment", indexes = {
    @Index(name = "idx_garment_tenant", columnList = "tenant_id"),
    @Index(name = "idx_garment_asset_id", columnList = "asset_id", unique = true),
    @Index(name = "idx_garment_status", columnList = "status"),
    @Index(name = "idx_garment_rfid", columnList = "rfid_tag_id"),
    @Index(name = "idx_garment_employee", columnList = "assigned_employee_id"),
    @Index(name = "idx_garment_branch", columnList = "current_branch_id"),
    @Index(name = "idx_garment_type", columnList = "garment_type_id"),
    @Index(name = "idx_garment_wash_count", columnList = "wash_count"),
    @Index(name = "idx_garment_status_changed", columnList = "status_changed_at")
})
public class Garment extends BaseEntity {

    @NotNull
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "tenant_id", nullable = false)
    private Tenant tenant;

    @NotBlank
    @Size(max = 50)
    @Column(name = "asset_id", nullable = false, unique = true, length = 50)
    private String assetId;

    @NotNull
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "garment_type_id", nullable = false)
    private GarmentType garmentType;

    @NotNull
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "size_id", nullable = false)
    private SizeEntity size;

    @NotNull
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "color_id", nullable = false)
    private Color color;

    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "rfid_tag_id", unique = true)
    private RFIDTag rfidTag;

    @NotNull
    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 30)
    private GarmentStatus status = GarmentStatus.PROCURED;

    @Enumerated(EnumType.STRING)
    @Column(name = "previous_status", length = 30)
    private GarmentStatus previousStatus;

    @Column(name = "status_changed_at")
    private Instant statusChangedAt = Instant.now();

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "current_branch_id")
    private com.whitefox.tenant.entity.Branch currentBranch;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "current_department_id")
    private com.whitefox.tenant.entity.Department currentDepartment;

    @Enumerated(EnumType.STRING)
    @Column(name = "current_location_type", length = 30)
    private LocationType currentLocationType;

    @Column(name = "current_location_id")
    private UUID currentLocationId;

    @Size(max = 50)
    @Column(name = "locker_number", length = 50)
    private String lockerNumber;

    @Column(name = "assigned_employee_id")
    private UUID assignedEmployeeId;

    @Enumerated(EnumType.STRING)
    @Column(name = "set_position", length = 1)
    private SetPosition setPosition;

    @Column(name = "manufacture_date")
    private LocalDate manufactureDate;

    @Column(name = "procurement_date")
    private LocalDate procurementDate;

    @Column(name = "first_use_date")
    private LocalDate firstUseDate;

    @Column(name = "wash_count")
    private Integer washCount = 0;

    @Column(name = "repair_count")
    private Integer repairCount = 0;

    @Column(name = "qc_pass_count")
    private Integer qcPassCount = 0;

    @Column(name = "qc_fail_count")
    private Integer qcFailCount = 0;

    @Column(name = "total_days_in_use")
    private Integer totalDaysInUse = 0;

    @Column(name = "total_days_in_laundry")
    private Integer totalDaysInLaundry = 0;

    @Column(name = "last_wash_date")
    private Instant lastWashDate;

    @Column(name = "last_qc_date")
    private Instant lastQcDate;

    @Column(name = "predicted_retirement_date")
    private LocalDate predictedRetirementDate;

    @Column(name = "condition_rating")
    private Integer conditionRating;

    @Column(name = "last_condition_check")
    private Instant lastConditionCheck;

    @Column(columnDefinition = "text")
    private String notes;

    @Column(name = "purchase_cost", precision = 10, scale = 2)
    private BigDecimal purchaseCost;

    @Column(name = "depreciation_per_wash", precision = 10, scale = 4)
    private BigDecimal depreciationPerWash;

    @Column(name = "current_book_value", precision = 10, scale = 2)
    private BigDecimal currentBookValue;

    @Column(columnDefinition = "jsonb")
    private String metadata = "{}";

    public enum GarmentStatus {
        PROCURED, TAGGED, ALLOCATED, IN_USE, IN_LOCKER,
        IN_TRANSIT, RECEIVED_AT_PLANT, SORTING, WASHING,
        DRYING, QC_PENDING, QC_PASSED, QC_FAILED,
        REPAIRING, REPAIRED, PACKED, DISPATCHED,
        DELIVERED, MISSING, LOST, DAMAGED, RETIRED, DISPOSED
    }

    public enum LocationType {
        BRANCH, DEPARTMENT, LOCKER, PLANT, TRANSIT,
        WASHING_MACHINE, DRYER, QC_STATION, PACKING_STATION, DISPATCH_AREA, TRUCK
    }

    public enum SetPosition {
        A, B, C
    }

    // Getters and Setters
    public Tenant getTenant() { return tenant; }
    public void setTenant(Tenant tenant) { this.tenant = tenant; }
    public String getAssetId() { return assetId; }
    public void setAssetId(String assetId) { this.assetId = assetId; }
    public GarmentType getGarmentType() { return garmentType; }
    public void setGarmentType(GarmentType garmentType) { this.garmentType = garmentType; }
    public SizeEntity getSize() { return size; }
    public void setSize(SizeEntity size) { this.size = size; }
    public Color getColor() { return color; }
    public void setColor(Color color) { this.color = color; }
    public RFIDTag getRfidTag() { return rfidTag; }
    public void setRfidTag(RFIDTag rfidTag) { this.rfidTag = rfidTag; }
    public GarmentStatus getStatus() { return status; }
    public void setStatus(GarmentStatus status) { this.status = status; }
    public GarmentStatus getPreviousStatus() { return previousStatus; }
    public void setPreviousStatus(GarmentStatus previousStatus) { this.previousStatus = previousStatus; }
    public Instant getStatusChangedAt() { return statusChangedAt; }
    public void setStatusChangedAt(Instant statusChangedAt) { this.statusChangedAt = statusChangedAt; }
    public com.whitefox.tenant.entity.Branch getCurrentBranch() { return currentBranch; }
    public void setCurrentBranch(com.whitefox.tenant.entity.Branch currentBranch) { this.currentBranch = currentBranch; }
    public com.whitefox.tenant.entity.Department getCurrentDepartment() { return currentDepartment; }
    public void setCurrentDepartment(com.whitefox.tenant.entity.Department currentDepartment) { this.currentDepartment = currentDepartment; }
    public LocationType getCurrentLocationType() { return currentLocationType; }
    public void setCurrentLocationType(LocationType currentLocationType) { this.currentLocationType = currentLocationType; }
    public UUID getCurrentLocationId() { return currentLocationId; }
    public void setCurrentLocationId(UUID currentLocationId) { this.currentLocationId = currentLocationId; }
    public String getLockerNumber() { return lockerNumber; }
    public void setLockerNumber(String lockerNumber) { this.lockerNumber = lockerNumber; }
    public UUID getAssignedEmployeeId() { return assignedEmployeeId; }
    public void setAssignedEmployeeId(UUID assignedEmployeeId) { this.assignedEmployeeId = assignedEmployeeId; }
    public SetPosition getSetPosition() { return setPosition; }
    public void setSetPosition(SetPosition setPosition) { this.setPosition = setPosition; }
    public LocalDate getManufactureDate() { return manufactureDate; }
    public void setManufactureDate(LocalDate manufactureDate) { this.manufactureDate = manufactureDate; }
    public LocalDate getProcurementDate() { return procurementDate; }
    public void setProcurementDate(LocalDate procurementDate) { this.procurementDate = procurementDate; }
    public LocalDate getFirstUseDate() { return firstUseDate; }
    public void setFirstUseDate(LocalDate firstUseDate) { this.firstUseDate = firstUseDate; }
    public Integer getWashCount() { return washCount; }
    public void setWashCount(Integer washCount) { this.washCount = washCount; }
    public Integer getRepairCount() { return repairCount; }
    public void setRepairCount(Integer repairCount) { this.repairCount = repairCount; }
    public Integer getQcPassCount() { return qcPassCount; }
    public void setQcPassCount(Integer qcPassCount) { this.qcPassCount = qcPassCount; }
    public Integer getQcFailCount() { return qcFailCount; }
    public void setQcFailCount(Integer qcFailCount) { this.qcFailCount = qcFailCount; }
    public Integer getTotalDaysInUse() { return totalDaysInUse; }
    public void setTotalDaysInUse(Integer totalDaysInUse) { this.totalDaysInUse = totalDaysInUse; }
    public Integer getTotalDaysInLaundry() { return totalDaysInLaundry; }
    public void setTotalDaysInLaundry(Integer totalDaysInLaundry) { this.totalDaysInLaundry = totalDaysInLaundry; }
    public Instant getLastWashDate() { return lastWashDate; }
    public void setLastWashDate(Instant lastWashDate) { this.lastWashDate = lastWashDate; }
    public Instant getLastQcDate() { return lastQcDate; }
    public void setLastQcDate(Instant lastQcDate) { this.lastQcDate = lastQcDate; }
    public LocalDate getPredictedRetirementDate() { return predictedRetirementDate; }
    public void setPredictedRetirementDate(LocalDate predictedRetirementDate) { this.predictedRetirementDate = predictedRetirementDate; }
    public Integer getConditionRating() { return conditionRating; }
    public void setConditionRating(Integer conditionRating) { this.conditionRating = conditionRating; }
    public Instant getLastConditionCheck() { return lastConditionCheck; }
    public void setLastConditionCheck(Instant lastConditionCheck) { this.lastConditionCheck = lastConditionCheck; }
    public String getNotes() { return notes; }
    public void setNotes(String notes) { this.notes = notes; }
    public BigDecimal getPurchaseCost() { return purchaseCost; }
    public void setPurchaseCost(BigDecimal purchaseCost) { this.purchaseCost = purchaseCost; }
    public BigDecimal getDepreciationPerWash() { return depreciationPerWash; }
    public void setDepreciationPerWash(BigDecimal depreciationPerWash) { this.depreciationPerWash = depreciationPerWash; }
    public BigDecimal getCurrentBookValue() { return currentBookValue; }
    public void setCurrentBookValue(BigDecimal currentBookValue) { this.currentBookValue = currentBookValue; }
    public String getMetadata() { return metadata; }
    public void setMetadata(String metadata) { this.metadata = metadata; }
}