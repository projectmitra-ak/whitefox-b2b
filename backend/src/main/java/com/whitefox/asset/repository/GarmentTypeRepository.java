package com.whitefox.asset.repository;

import com.whitefox.asset.entity.GarmentType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface GarmentTypeRepository extends JpaRepository<GarmentType, UUID> {
    Optional<GarmentType> findByCode(String code);
    List<GarmentType> findByCategory(GarmentType.Category category);
    List<GarmentType> findByIsActiveTrue();
}