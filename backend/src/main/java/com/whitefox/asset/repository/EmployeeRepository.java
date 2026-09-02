package com.whitefox.asset.repository;

import com.whitefox.asset.entity.Employee;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface EmployeeRepository extends JpaRepository<Employee, UUID> {
    Optional<Employee> findByTenantIdAndEmployeeCode(UUID tenantId, String employeeCode);
    Page<Employee> findByTenantId(UUID tenantId, Pageable pageable);
    List<Employee> findByTenantIdAndStatus(UUID tenantId, Employee.EmployeeStatus status);
    List<Employee> findByBranchId(UUID branchId);
    List<Employee> findByDepartmentId(UUID departmentId);
    List<Employee> findBySizeId(UUID sizeId);
}