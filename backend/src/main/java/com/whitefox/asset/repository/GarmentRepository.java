package com.whitefox.asset.repository;

import com.whitefox.asset.entity.Garment;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.Instant;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface GarmentRepository extends JpaRepository<Garment, UUID> {

    Optional<Garment> findByAssetId(String assetId);

    Optional<Garment> findByRfidTagId(UUID rfidTagId);

    Page<Garment> findByTenantId(UUID tenantId, Pageable pageable);

    Page<Garment> findByTenantIdAndStatus(UUID tenantId, Garment.GarmentStatus status, Pageable pageable);

    List<Garment> findByTenantIdAndStatusIn(UUID tenantId, List<Garment.GarmentStatus> statuses);

    Page<Garment> findByAssignedEmployeeId(UUID employeeId, Pageable pageable);

    List<Garment> findByCurrentBranchId(UUID branchId);

    List<Garment> findByCurrentDepartmentId(UUID departmentId);

    List<Garment> findByGarmentTypeId(UUID garmentTypeId);

    List<Garment> findByWashCountGreaterThanEqual(Integer washCount);

    @Query("SELECT g FROM Garment g WHERE g.tenant.id = :tenantId AND g.status IN :statuses")
    List<Garment> findByTenantIdAndStatuses(@Param("tenantId") UUID tenantId, @Param("statuses") List<Garment.GarmentStatus> statuses);

    @Query("SELECT COUNT(g) FROM Garment g WHERE g.tenant.id = :tenantId AND g.status = :status")
    long countByTenantIdAndStatus(@Param("tenantId") UUID tenantId, @Param("status") Garment.GarmentStatus status);

    @Query("SELECT g FROM Garment g WHERE g.tenant.id = :tenantId AND g.predictedRetirementDate <= :date")
    List<Garment> findDueForReplacement(@Param("tenantId") UUID tenantId, @Param("date") java.time.LocalDate date);

    @Query("SELECT g FROM Garment g WHERE g.rfidTag.epc = :epc")
    Optional<Garment> findByRfidEpc(@Param("epc") String epc);

    @Query("SELECT g FROM Garment g WHERE g.tenant.id = :tenantId AND g.status = :status ORDER BY g.statusChangedAt ASC")
    List<Garment> findOldestByStatus(@Param("tenantId") UUID tenantId, @Param("status") Garment.GarmentStatus status, Pageable pageable);
}