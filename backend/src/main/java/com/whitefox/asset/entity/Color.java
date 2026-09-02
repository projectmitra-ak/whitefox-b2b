package com.whitefox.asset.entity;

import com.whitefox.common.BaseEntity;
import jakarta.persistence.*;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

@Entity
@Table(name = "color")
public class Color extends BaseEntity {

    @NotBlank
    @Size(max = 30)
    @Column(nullable = false, unique = true, length = 30)
    private String code;

    @NotBlank
    @Size(max = 100)
    @Column(nullable = false, length = 100)
    private String name;

    @Size(max = 7)
    @Column(name = "hex_code", length = 7)
    private String hexCode;

    @Size(max = 20)
    @Column(name = "pantone_code", length = 20)
    private String pantoneCode;

    @Column(name = "is_standard")
    private Boolean isStandard = true;

    @Column(name = "sort_order")
    private Integer sortOrder = 0;

    // Getters and Setters
    public String getCode() { return code; }
    public void setCode(String code) { this.code = code; }
    public String getName() { return name; }
    public void setName(String name) { this.name = name; }
    public String getHexCode() { return hexCode; }
    public void setHexCode(String hexCode) { this.hexCode = hexCode; }
    public String getPantoneCode() { return pantoneCode; }
    public void setPantoneCode(String pantoneCode) { this.pantoneCode = pantoneCode; }
    public Boolean getIsStandard() { return isStandard; }
    public void setIsStandard(Boolean isStandard) { this.isStandard = isStandard; }
    public Integer getSortOrder() { return sortOrder; }
    public void setSortOrder(Integer sortOrder) { this.sortOrder = sortOrder; }
}