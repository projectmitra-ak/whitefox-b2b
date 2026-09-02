package com.whitefox.asset.repository;

import com.whitefox.asset.entity.GarmentStatusHistory;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

@Repository
public interface GarmentStatusHistoryRepository extends JpaRepository<GarmentStatusHistory, UUID> {
    List<GarmentStatusHistory> findByGarmentIdOrderByCreatedAtDesc(UUID garmentId);
    List<GarmentStatusHistory> findByGarmentIdAndCreatedAtBetween(UUID garmentId, Instant start, Instant end);
    Page<GarmentStatusHistory> findByGarmentId(UUID garmentId, Pageable pageable);
}