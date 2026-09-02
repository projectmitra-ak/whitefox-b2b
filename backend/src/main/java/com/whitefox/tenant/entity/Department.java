package com.whitefox.tenant.entity;

import com.whitefox.common.BaseEntity;
import jakarta.persistence.*;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import java.util.UUID;

@Entity
@Table(name = "department", indexes = {
    @Index(name = "idx_department_branch", columnList = "branch_id"),
    @Index(name = "idx_department_type", columnList = "department_type"),
    @Index(name = "idx_department_branch_code", columnList = "branch_id, code", unique = true)
})
public class Department extends BaseEntity {

    @NotNull
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "branch_id", nullable = false)
    private Branch branch;

    @NotBlank
    @Size(max = 50)
    @Column(nullable = false, length = 50)
    private String code;

    @NotBlank
    @Size(max = 255)
    @Column(nullable = false, length = 255)
    private String name;

    @Column(columnDefinition = "text")
    private String description;

    @Enumerated(EnumType.STRING)
    @Column(name = "department_type", length = 30)
    private DepartmentType departmentType;

    @Size(max = 20)
    @Column(length = 20)
    private String floor;

    @Size(max = 50)
    @Column(length = 50)
    private String wing;

    @NotNull
    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private DepartmentStatus status = DepartmentStatus.ACTIVE;

    @Column(name = "garment_requirements", columnDefinition = "jsonb")
    private String garmentRequirements = "{}";

    public enum DepartmentType {
        ICU, EMERGENCY, SURGERY, GENERAL_WARD, OT, RADIOLOGY, LABORATORY,
        PHARMACY, ADMIN, HOUSEKEEPING, LAUNDRY, KITCHEN, FRONT_DESK, MAINTENANCE, OTHER
    }

    public enum DepartmentStatus {
        ACTIVE, INACTIVE
    }

    // Getters and Setters
    public Branch getBranch() { return branch; }
    public void setBranch(Branch branch) { this.branch = branch; }
    public String getCode() { return code; }
    public void setCode(String code) { this.code = code; }
    public String getName() { return name; }
    public void setName(String name) { this.name = name; }
    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }
    public DepartmentType getDepartmentType() { return departmentType; }
    public void setDepartmentType(DepartmentType departmentType) { this.departmentType = departmentType; }
    public String getFloor() { return floor; }
    public void setFloor(String floor) { this.floor = floor; }
    public String getWing() { return wing; }
    public void setWing(String wing) { this.wing = wing; }
    public DepartmentStatus getStatus() { return status; }
    public void setStatus(DepartmentStatus status) { this.status = status; }
    public String getGarmentRequirements() { return garmentRequirements; }
    public void setGarmentRequirements(String garmentRequirements) { this.garmentRequirements = garmentRequirements; }
}