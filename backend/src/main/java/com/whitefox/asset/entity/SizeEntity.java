package com.whitefox.asset.entity;

import com.whitefox.common.BaseEntity;
import jakarta.persistence.*;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import java.math.BigDecimal;

@Entity
@Table(name = "size", indexes = {
    @Index(name = "idx_size_sort", columnList = "sort_order")
})
public class SizeEntity extends BaseEntity {

    @NotBlank
    @Size(max = 20)
    @Column(nullable = false, unique = true, length = 20)
    private String code;

    @NotBlank
    @Size(max = 50)
    @Column(nullable = false, length = 50)
    private String label;

    @Column(columnDefinition = "text")
    private String description;

    @NotNull
    @Column(name = "sort_order", nullable = false)
    private Integer sortOrder = 0;

    @Column(name = "chest_cm", precision = 6, scale = 2)
    private java.math.BigDecimal chestCm;

    @Column(name = "waist_cm", precision = 6, scale = 2)
    private java.math.BigDecimal waistCm;

    @Column(name = "hip_cm", precision = 6, scale = 2)
    private java.math.BigDecimal hipCm;

    @Column(name = "length_cm", precision = 6, scale = 2)
    private java.math.BigDecimal lengthCm;

    @Column(name = "is_standard")
    private Boolean isStandard = true;

    // Explicit getters and setters to avoid Lombok issues
    public String getCode() { return code; }
    public void setCode(String code) { this.code = code; }
    public String getLabel() { return label; }
    public void setLabel(String label) { this.label = label; }
    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }
    public Integer getSortOrder() { return sortOrder; }
    public void setSortOrder(Integer sortOrder) { this.sortOrder = sortOrder; }
    public java.math.BigDecimal getChestCm() { return chestCm; }
    public void setChestCm(java.math.BigDecimal chestCm) { this.chestCm = chestCm; }
    public java.math.BigDecimal getWaistCm() { return waistCm; }
    public void setWaistCm(java.math.BigDecimal waistCm) { this.waistCm = waistCm; }
    public java.math.BigDecimal getHipCm() { return hipCm; }
    public void setHipCm(java.math.BigDecimal hipCm) { this.hipCm = hipCm; }
    public java.math.BigDecimal getLengthCm() { return lengthCm; }
    public void setLengthCm(java.math.BigDecimal lengthCm) { this.lengthCm = lengthCm; }
    public Boolean getIsStandard() { return isStandard; }
    public void setIsStandard(Boolean isStandard) { this.isStandard = isStandard; }
}