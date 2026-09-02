package com.whitefox.asset.entity;

import com.whitefox.common.BaseEntity;
import jakarta.persistence.*;
import jakarta.validation.constraints.NotNull;
import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "employee_garment_set", indexes = {
    @Index(name = "idx_emp_set_employee", columnList = "employee_id", unique = true),
    @Index(name = "idx_emp_set_garments", columnList = "set_a_garment_id, set_b_garment_id, set_c_garment_id")
})
public class EmployeeGarmentSet extends BaseEntity {

    @NotNull
    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "employee_id", nullable = false, unique = true)
    private Employee employee;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "set_a_garment_id")
    private Garment setAGarment;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "set_b_garment_id")
    private Garment setBGarment;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "set_c_garment_id")
    private Garment setCGarment;

    @Column(name = "current_rotation")
    private Integer currentRotation = 0;

    @Column(name = "last_rotated_at")
    private Instant lastRotatedAt;

    @Column(name = "last_rotated_by")
    private UUID lastRotatedBy;

    @Enumerated(EnumType.STRING)
    @Column(name = "rotation_reason", length = 30)
    private RotationReason rotationReason;

    @Column(columnDefinition = "text")
    private String notes;

    public enum RotationReason {
        SHIFT_CHANGE, SCHEDULED, EMERGENCY, DAMAGED, MISSING, MANUAL
    }

    // Getters and Setters
    public Employee getEmployee() { return employee; }
    public void setEmployee(Employee employee) { this.employee = employee; }
    public Garment getSetAGarment() { return setAGarment; }
    public void setSetAGarment(Garment setAGarment) { this.setAGarment = setAGarment; }
    public Garment getSetBGarment() { return setBGarment; }
    public void setSetBGarment(Garment setBGarment) { this.setBGarment = setBGarment; }
    public Garment getSetCGarment() { return setCGarment; }
    public void setSetCGarment(Garment setCGarment) { this.setCGarment = setCGarment; }
    public Integer getCurrentRotation() { return currentRotation; }
    public void setCurrentRotation(Integer currentRotation) { this.currentRotation = currentRotation; }
    public Instant getLastRotatedAt() { return lastRotatedAt; }
    public void setLastRotatedAt(Instant lastRotatedAt) { this.lastRotatedAt = lastRotatedAt; }
    public UUID getLastRotatedBy() { return lastRotatedBy; }
    public void setLastRotatedBy(UUID lastRotatedBy) { this.lastRotatedBy = lastRotatedBy; }
    public RotationReason getRotationReason() { return rotationReason; }
    public void setRotationReason(RotationReason rotationReason) { this.rotationReason = rotationReason; }
    public String getNotes() { return notes; }
    public void setNotes(String notes) { this.notes = notes; }

    // Helper methods
    public Garment getGarmentByPosition(Garment.SetPosition position) {
        return switch (position) {
            case A -> setAGarment;
            case B -> setBGarment;
            case C -> setCGarment;
        };
    }

    public void setGarmentByPosition(Garment.SetPosition position, Garment garment) {
        switch (position) {
            case A -> this.setAGarment = garment;
            case B -> this.setBGarment = garment;
            case C -> this.setCGarment = garment;
        }
    }
}