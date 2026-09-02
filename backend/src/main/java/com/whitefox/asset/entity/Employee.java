package com.whitefox.asset.entity;

import com.whitefox.common.BaseEntity;
import com.whitefox.tenant.entity.Tenant;
import jakarta.persistence.*;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import java.time.LocalDate;
import java.util.UUID;

@Entity
@Table(name = "employee", indexes = {
    @Index(name = "idx_employee_tenant", columnList = "tenant_id"),
    @Index(name = "idx_employee_branch", columnList = "branch_id"),
    @Index(name = "idx_employee_department", columnList = "department_id"),
    @Index(name = "idx_employee_status", columnList = "status"),
    @Index(name = "idx_employee_code", columnList = "employee_code"),
    @Index(name = "idx_employee_tenant_code", columnList = "tenant_id, employee_code", unique = true)
})
public class Employee extends BaseEntity {

    @NotNull
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "tenant_id", nullable = false)
    private Tenant tenant;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "branch_id")
    private com.whitefox.tenant.entity.Branch branch;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "department_id")
    private com.whitefox.tenant.entity.Department department;

    @NotBlank
    @Size(max = 50)
    @Column(name = "employee_code", nullable = false, length = 50)
    private String employeeCode;

    @NotBlank
    @Size(max = 100)
    @Column(name = "first_name", nullable = false, length = 100)
    private String firstName;

    @NotBlank
    @Size(max = 100)
    @Column(name = "last_name", nullable = false, length = 100)
    private String lastName;

    @Size(max = 100)
    @Column(name = "middle_name", length = 100)
    private String middleName;

    @Size(max = 255)
    @Column(length = 255)
    private String email;

    @Size(max = 30)
    @Column(length = 30)
    private String phone;

    @Column(name = "date_of_birth")
    private LocalDate dateOfBirth;

    @Enumerated(EnumType.STRING)
    @Column(length = 10)
    private Gender gender;

    @Column(name = "hire_date")
    private LocalDate hireDate;

    @Column(name = "termination_date")
    private LocalDate terminationDate;

    @Enumerated(EnumType.STRING)
    @Column(name = "employment_type", length = 20)
    private EmploymentType employmentType = EmploymentType.FULL_TIME;

    @Size(max = 100)
    @Column(length = 100)
    private String role;

    @Size(max = 20)
    @Column(length = 20)
    private String grade;

    @NotNull
    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private EmployeeStatus status = EmployeeStatus.ACTIVE;

    @Column(name = "uniform_required")
    private Boolean uniformRequired = true;

    @Column(name = "sets_allocated")
    private Integer setsAllocated = 3;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "size_id")
    private SizeEntity size;

    @Column(name = "measurements", columnDefinition = "jsonb")
    private String measurements = "{}";

    @Column(name = "preferences", columnDefinition = "jsonb")
    private String preferences = "{}";

    @Column(columnDefinition = "jsonb")
    private String metadata = "{}";

    public enum Gender {
        MALE, FEMALE, OTHER, PREFER_NOT_TO_SAY
    }

    public enum EmploymentType {
        FULL_TIME, PART_TIME, CONTRACT, TEMPORARY, INTERN
    }

    public enum EmployeeStatus {
        ACTIVE, INACTIVE, ON_LEAVE, TERMINATED, SUSPENDED
    }

    // Getters and Setters
    public Tenant getTenant() { return tenant; }
    public void setTenant(Tenant tenant) { this.tenant = tenant; }
    public com.whitefox.tenant.entity.Branch getBranch() { return branch; }
    public void setBranch(com.whitefox.tenant.entity.Branch branch) { this.branch = branch; }
    public com.whitefox.tenant.entity.Department getDepartment() { return department; }
    public void setDepartment(com.whitefox.tenant.entity.Department department) { this.department = department; }
    public String getEmployeeCode() { return employeeCode; }
    public void setEmployeeCode(String employeeCode) { this.employeeCode = employeeCode; }
    public String getFirstName() { return firstName; }
    public void setFirstName(String firstName) { this.firstName = firstName; }
    public String getLastName() { return lastName; }
    public void setLastName(String lastName) { this.lastName = lastName; }
    public String getMiddleName() { return middleName; }
    public void setMiddleName(String middleName) { this.middleName = middleName; }
    public String getEmail() { return email; }
    public void setEmail(String email) { this.email = email; }
    public String getPhone() { return phone; }
    public void setPhone(String phone) { this.phone = phone; }
    public LocalDate getDateOfBirth() { return dateOfBirth; }
    public void setDateOfBirth(LocalDate dateOfBirth) { this.dateOfBirth = dateOfBirth; }
    public Gender getGender() { return gender; }
    public void setGender(Gender gender) { this.gender = gender; }
    public LocalDate getHireDate() { return hireDate; }
    public void setHireDate(LocalDate hireDate) { this.hireDate = hireDate; }
    public LocalDate getTerminationDate() { return terminationDate; }
    public void setTerminationDate(LocalDate terminationDate) { this.terminationDate = terminationDate; }
    public EmploymentType getEmploymentType() { return employmentType; }
    public void setEmploymentType(EmploymentType employmentType) { this.employmentType = employmentType; }
    public String getRole() { return role; }
    public void setRole(String role) { this.role = role; }
    public String getGrade() { return grade; }
    public void setGrade(String grade) { this.grade = grade; }
    public EmployeeStatus getStatus() { return status; }
    public void setStatus(EmployeeStatus status) { this.status = status; }
    public Boolean getUniformRequired() { return uniformRequired; }
    public void setUniformRequired(Boolean uniformRequired) { this.uniformRequired = uniformRequired; }
    public Integer getSetsAllocated() { return setsAllocated; }
    public void setSetsAllocated(Integer setsAllocated) { this.setsAllocated = setsAllocated; }
    public SizeEntity getSize() { return size; }
    public void setSize(SizeEntity size) { this.size = size; }
    public String getMeasurements() { return measurements; }
    public void setMeasurements(String measurements) { this.measurements = measurements; }
    public String getPreferences() { return preferences; }
    public void setPreferences(String preferences) { this.preferences = preferences; }
    public String getMetadata() { return metadata; }
    public void setMetadata(String metadata) { this.metadata = metadata; }

    public String getFullName() {
        return firstName + (middleName != null ? " " + middleName : "") + " " + lastName;
    }
}