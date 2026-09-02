package com.whitefox.asset.entity;

import com.whitefox.common.BaseEntity;
import jakarta.persistence.*;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import java.util.UUID;

@Entity
@Table(name = "wash_program", indexes = {
    @Index(name = "idx_wash_program_code", columnList = "code", unique = true)
})
public class WashProgram extends BaseEntity {

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
    @Column(name = "temperature_celsius", nullable = false)
    private Integer temperatureCelsius;

    @NotNull
    @Column(name = "duration_minutes", nullable = false)
    private Integer durationMinutes;

    @Column(name = "chemical_dosage_ml_per_kg", precision = 8, scale = 2)
    private java.math.BigDecimal chemicalDosageMlPerKg;

    @Enumerated(EnumType.STRING)
    @Column(name = "water_level", length = 20)
    private WaterLevel waterLevel;

    @Column(name = "spin_speed_rpm")
    private Integer spinSpeedRpm;

    @Column(name = "suitable_fabrics", columnDefinition = "text[]")
    private String[] suitableFabrics;

    @Column(name = "unsuitable_fabrics", columnDefinition = "text[]")
    private String[] unsuitableFabrics;

    @Column(name = "is_active")
    private Boolean isActive = true;

    public enum WaterLevel {
        LOW, MEDIUM, HIGH
    }

    // Getters and Setters
    public String getCode() { return code; }
    public void setCode(String code) { this.code = code; }
    public String getName() { return name; }
    public void setName(String name) { this.name = name; }
    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }
    public Integer getTemperatureCelsius() { return temperatureCelsius; }
    public void setTemperatureCelsius(Integer temperatureCelsius) { this.temperatureCelsius = temperatureCelsius; }
    public Integer getDurationMinutes() { return durationMinutes; }
    public void setDurationMinutes(Integer durationMinutes) { this.durationMinutes = durationMinutes; }
    public java.math.BigDecimal getChemicalDosageMlPerKg() { return chemicalDosageMlPerKg; }
    public void setChemicalDosageMlPerKg(java.math.BigDecimal chemicalDosageMlPerKg) { this.chemicalDosageMlPerKg = chemicalDosageMlPerKg; }
    public WaterLevel getWaterLevel() { return waterLevel; }
    public void setWaterLevel(WaterLevel waterLevel) { this.waterLevel = waterLevel; }
    public Integer getSpinSpeedRpm() { return spinSpeedRpm; }
    public void setSpinSpeedRpm(Integer spinSpeedRpm) { this.spinSpeedRpm = spinSpeedRpm; }
    public String[] getSuitableFabrics() { return suitableFabrics; }
    public void setSuitableFabrics(String[] suitableFabrics) { this.suitableFabrics = suitableFabrics; }
    public String[] getUnsuitableFabrics() { return unsuitableFabrics; }
    public void setUnsuitableFabrics(String[] unsuitableFabrics) { this.unsuitableFabrics = unsuitableFabrics; }
    public Boolean getIsActive() { return isActive; }
    public void setIsActive(Boolean isActive) { this.isActive = isActive; }
}