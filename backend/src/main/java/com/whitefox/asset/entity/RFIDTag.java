package com.whitefox.asset.entity;

import com.whitefox.common.BaseEntity;
import jakarta.persistence.*;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "rfid_tag", indexes = {
    @Index(name = "idx_rfid_tag_epc", columnList = "epc", unique = true),
    @Index(name = "idx_rfid_tag_status", columnList = "status"),
    @Index(name = "idx_rfid_tag_garment", columnList = "garment_id")
})
public class RFIDTag extends BaseEntity {

    @NotBlank
    @Size(max = 100)
    @Column(nullable = false, unique = true, length = 100)
    private String epc;

    @NotNull
    @Enumerated(EnumType.STRING)
    @Column(name = "tag_type", nullable = false, length = 30)
    private TagType tagType = TagType.UHF_PASSIVE;

    @Size(max = 100)
    @Column(length = 100)
    private String manufacturer;

    @Size(max = 100)
    @Column(length = 100)
    private String model;

    @Size(max = 30)
    @Column(name = "encoding_standard", length = 30)
    private String encodingStandard = "GS1_EPC_GEN2";

    @NotNull
    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private TagStatus status = TagStatus.UNENCODED;

    @Column(name = "encoded_at")
    private Instant encodedAt;

    @Column(name = "verified_at")
    private Instant verifiedAt;

    @Column(name = "attached_at")
    private Instant attachedAt;

    @Column(name = "last_read_at")
    private Instant lastReadAt;

    @Column(name = "read_count")
    private Long readCount = 0L;

    @Column(name = "garment_id")
    private UUID garmentId;

    @Size(max = 50)
    @Column(name = "batch_number", length = 50)
    private String batchNumber;

    @Column(name = "warranty_expiry")
    private java.time.LocalDate warrantyExpiry;

    @Column(columnDefinition = "jsonb")
    private String metadata = "{}";

    public enum TagType {
        UHF_PASSIVE, UHF_ACTIVE, HF_PASSIVE, NFC, BLE
    }

    public enum TagStatus {
        UNENCODED, ENCODED, VERIFIED, ATTACHED, ACTIVE, DAMAGED, LOST, RETIRED
    }

    // Getters and Setters
    public String getEpc() { return epc; }
    public void setEpc(String epc) { this.epc = epc; }
    public TagType getTagType() { return tagType; }
    public void setTagType(TagType tagType) { this.tagType = tagType; }
    public String getManufacturer() { return manufacturer; }
    public void setManufacturer(String manufacturer) { this.manufacturer = manufacturer; }
    public String getModel() { return model; }
    public void setModel(String model) { this.model = model; }
    public String getEncodingStandard() { return encodingStandard; }
    public void setEncodingStandard(String encodingStandard) { this.encodingStandard = encodingStandard; }
    public TagStatus getStatus() { return status; }
    public void setStatus(TagStatus status) { this.status = status; }
    public Instant getEncodedAt() { return encodedAt; }
    public void setEncodedAt(Instant encodedAt) { this.encodedAt = encodedAt; }
    public Instant getVerifiedAt() { return verifiedAt; }
    public void setVerifiedAt(Instant verifiedAt) { this.verifiedAt = verifiedAt; }
    public Instant getAttachedAt() { return attachedAt; }
    public void setAttachedAt(Instant attachedAt) { this.attachedAt = attachedAt; }
    public Instant getLastReadAt() { return lastReadAt; }
    public void setLastReadAt(Instant lastReadAt) { this.lastReadAt = lastReadAt; }
    public Long getReadCount() { return readCount; }
    public void setReadCount(Long readCount) { this.readCount = readCount; }
    public UUID getGarmentId() { return garmentId; }
    public void setGarmentId(UUID garmentId) { this.garmentId = garmentId; }
    public String getBatchNumber() { return batchNumber; }
    public void setBatchNumber(String batchNumber) { this.batchNumber = batchNumber; }
    public java.time.LocalDate getWarrantyExpiry() { return warrantyExpiry; }
    public void setWarrantyExpiry(java.time.LocalDate warrantyExpiry) { this.warrantyExpiry = warrantyExpiry; }
    public String getMetadata() { return metadata; }
    public void setMetadata(String metadata) { this.metadata = metadata; }
}