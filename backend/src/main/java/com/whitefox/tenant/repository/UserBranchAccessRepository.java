package com.whitefox.tenant.repository;

import com.whitefox.tenant.entity.UserBranchAccess;
import com.whitefox.tenant.entity.UserBranchAccess.UserBranchAccessId;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface UserBranchAccessRepository extends JpaRepository<UserBranchAccess, UserBranchAccessId> {
    List<UserBranchAccess> findByUserId(UUID userId);
    List<UserBranchAccess> findByBranchId(UUID branchId);
}