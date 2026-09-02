package com.whitefox.tenant.repository;

import com.whitefox.tenant.entity.Department;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface DepartmentRepository extends JpaRepository<Department, UUID> {
    Optional<Department> findByBranchIdAndCode(UUID branchId, String code);
    List<Department> findByBranchId(UUID branchId);
    List<Department> findByBranchIdAndStatus(UUID branchId, Department.DepartmentStatus status);
    List<Department> findByDepartmentType(Department.DepartmentType type);
}