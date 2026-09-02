package com.whitefox.asset.entity;

import com.whitefox.common.BaseEntity;
import jakarta.persistence.*;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import java.util.UUID;

@Entity
@Table(name = "garment_type", indexes = {
    @Index(name = "idx_garment_type_category", columnList = "category"),
    @Index(name = "idx_garment_type_active", columnList = "is_active")
})
public class GarmentType extends BaseEntity {

    @NotBlank
    @Size(max = 50)
    @Column(nullable = false, unique = true, length = 50)
    private String code;

    @NotBlank
    @Size(max = 100)
    @Column(nullable = false, length = 100)
    private String name;

    @Column(columnDefinition = "text")
    private String description;

    @NotNull
    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 30)
    private Category category;

    @Column(name = "default_wash_program_id")
    private UUID defaultWashProgramId;

    @Column(name = "default_wash_temp_celsius")
    private Integer defaultWashTempCelsius = 60;

    @Column(name = "typical_lifespan_washes")
    private Integer typicalLifespanWashes = 100;

    @Size(max = 255)
    @Column(name = "fabric_composition", length = 255)
    private String fabricComposition;

    @Column(name = "care_instructions", columnDefinition = "text")
    private String careInstructions;

    @Column(name = "standard_weight_grams")
    private Integer standardWeightGrams;

    @Column(name = "color_fastness_rating")
    private Integer colorFastnessRating;

    @Column(name = "shrinkage_tolerance_percent", precision = 4, scale = 2)
    private java.math.BigDecimal shrinkageTolerancePercent = java.math.BigDecimal.valueOf(3.00);

    @Column(name = "is_active")
    private Boolean isActive = true;

    public enum Category {
        UPPER_BODY, LOWER_BODY, FULL_BODY, LINEN, TOWEL, ACCESSORY, OTHER
    }

    // Getters and Setters
    public String getCode() { return code; }
    public void setCode(String code) { this.code = code; }
    public String getName() { return name; }
    public void setName(String name) { this.name = name; }
    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }
    public Category getCategory() { return category; }
    public void setCategory(Category category) { this.category = category; }
    public UUID getDefaultWashProgramId() { return defaultWashProgramId; }
    public void setDefaultWashProgramId(UUID defaultWashProgramId) { this.defaultWashProgramId = defaultWashProgramId; }
    public Integer getDefaultWashTempCelsius() { return defaultWashTempCelsius; }
    public void setDefaultWashTempCelsius(Integer defaultWashTempCelsius) { this.defaultWashTempCelsius = defaultWashTempCelsius; }
    public Integer getTypicalLifespanWashes() { return typicalLifespanWashes; }
    public void setTypicalLifespanWashes(Integer typicalLifespanWashes) { this.typicalLifespanWashes = typicalLifespanWashes; }
    public String getFabricComposition() { return fabricComposition; }
    public void setFabricComposition(String fabricComposition) { this.fabricComposition = fabricComposition; }
    public String getCareInstructions() { return careInstructions; }
    public void setCareInstructions(String careInstructions) { this.careInstructions = careInstructions; }
    public Integer getStandardWeightGrams() { return standardWeightGrams; }
    public void setStandardWeightGrams(Integer standardWeightGrams) { this.standardWeightGrams = standardWeightGrams; }
    public Integer getColorFastnessRating() { return colorFastnessRating; }
    public void setColorFastnessRating(Integer colorFastnessRating) { this.colorFastnessRating = colorFastnessRating; }
    public java.math.BigDecimal getShrinkageTolerancePercent() { return shrinkageTolerancePercent; }
    public void setShrinkageTolerancePercent(java.math.BigDecimal shrinkageTolerancePercent) { this.shrinkageTolerancePercent = shrinkageTolerancePercent; }
    public Boolean getIsActive() { return isActive; }
    public void setIsActive(Boolean isActive) { this.isActive = isActive; }
}