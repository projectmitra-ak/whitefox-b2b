package com.whitefox.tenant.repository;

import com.whitefox.tenant.entity.Contract;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface ContractRepository extends JpaRepository<Contract, UUID> {
    Optional<Contract> findByContractNumber(String contractNumber);
    List<Contract> findByTenantId(UUID tenantId);
    List<Contract> findByTenantIdAndStatus(UUID tenantId, Contract.ContractStatus status);
    List<Contract> findByStatus(Contract.ContractStatus status);
    @Query("SELECT c FROM Contract c WHERE c.status = 'ACTIVE' AND c.endDate IS NOT NULL AND c.endDate <= :beforeDate")
    List<Contract> findExpiringContracts(LocalDate beforeDate);
    Page<Contract> findByTenantId(UUID tenantId, Pageable pageable);
}