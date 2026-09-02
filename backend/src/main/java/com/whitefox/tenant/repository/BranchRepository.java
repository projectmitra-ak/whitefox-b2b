package com.whitefox.tenant.repository;

import com.whitefox.tenant.entity.Branch;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface BranchRepository extends JpaRepository<Branch, UUID> {
    Optional<Branch> findByTenantIdAndCode(UUID tenantId, String code);
    List<Branch> findByTenantId(UUID tenantId);
    List<Branch> findByTenantIdAndStatus(UUID tenantId, Branch.BranchStatus status);
    List<Branch> findByBranchType(Branch.BranchType branchType);
    Page<Branch> findByTenantId(UUID tenantId, Pageable pageable);
}