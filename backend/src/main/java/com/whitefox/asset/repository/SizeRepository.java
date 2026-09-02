package com.whitefox.asset.repository;

import com.whitefox.asset.entity.SizeEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface SizeRepository extends JpaRepository<SizeEntity, UUID> {
    Optional<SizeEntity> findByCode(String code);
    List<SizeEntity> findByIsStandardTrueOrderBySortOrderAsc();
}