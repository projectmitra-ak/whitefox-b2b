package com.whitefox.asset.repository;

import com.whitefox.asset.entity.RFIDTag;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface RFIDTagRepository extends JpaRepository<RFIDTag, UUID> {
    Optional<RFIDTag> findByEpc(String epc);
    List<RFIDTag> findByStatus(RFIDTag.TagStatus status);
    List<RFIDTag> findByGarmentId(UUID garmentId);
    Optional<RFIDTag> findByGarmentIdAndStatus(UUID garmentId, RFIDTag.TagStatus status);
}