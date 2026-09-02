package com.whitefox.asset.entity;

import com.whitefox.common.BaseEntity;
import com.whitefox.security.entity.AppUser;
import jakarta.persistence.*;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "garment_status_history", indexes = {
    @Index(name = "idx_garment_history_garment", columnList = "garment_id, created_at"),
    @Index(name = "idx_garment_history_status", columnList = "to_status")
})
public class GarmentStatusHistory extends BaseEntity {

    @NotNull
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "garment_id", nullable = false)
    private Garment garment;

    @Enumerated(EnumType.STRING)
    @Column(name = "from_status", length = 30)
    private Garment.GarmentStatus fromStatus;

    @NotNull
    @Enumerated(EnumType.STRING)
    @Column(name = "to_status", nullable = false, length = 30)
    private Garment.GarmentStatus toStatus;

    @Enumerated(EnumType.STRING)
    @Column(name = "location_type", length = 30)
    private Garment.LocationType locationType;

    @Column(name = "location_id")
    private UUID locationId;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "triggered_by")
    private AppUser triggeredBy;

    @Enumerated(EnumType.STRING)
    @Column(name = "trigger_type", length = 30)
    private TriggerType triggerType;

    @Column(name = "reference_id")
    private UUID referenceId;

    @Size(max = 50)
    @Column(name = "reference_type", length = 50)
    private String referenceType;

    @Column(columnDefinition = "text")
    private String notes;

    @Column(columnDefinition = "jsonb")
    private String metadata = "{}";

    public enum TriggerType {
        MANUAL, RFID_SCAN, WORKFLOW, SCHEDULED, SYSTEM, CORRECTION
    }

    // Getters and Setters
    public Garment getGarment() { return garment; }
    public void setGarment(Garment garment) { this.garment = garment; }
    public Garment.GarmentStatus getFromStatus() { return fromStatus; }
    public void setFromStatus(Garment.GarmentStatus fromStatus) { this.fromStatus = fromStatus; }
    public Garment.GarmentStatus getToStatus() { return toStatus; }
    public void setToStatus(Garment.GarmentStatus toStatus) { this.toStatus = toStatus; }
    public Garment.LocationType getLocationType() { return locationType; }
    public void setLocationType(Garment.LocationType locationType) { this.locationType = locationType; }
    public UUID getLocationId() { return locationId; }
    public void setLocationId(UUID locationId) { this.locationId = locationId; }
    public AppUser getTriggeredBy() { return triggeredBy; }
    public void setTriggeredBy(AppUser triggeredBy) { this.triggeredBy = triggeredBy; }
    public TriggerType getTriggerType() { return triggerType; }
    public void setTriggerType(TriggerType triggerType) { this.triggerType = triggerType; }
    public UUID getReferenceId() { return referenceId; }
    public void setReferenceId(UUID referenceId) { this.referenceId = referenceId; }
    public String getReferenceType() { return referenceType; }
    public void setReferenceType(String referenceType) { this.referenceType = referenceType; }
    public String getNotes() { return notes; }
    public void setNotes(String notes) { this.notes = notes; }
    public String getMetadata() { return metadata; }
    public void setMetadata(String metadata) { this.metadata = metadata; }
}