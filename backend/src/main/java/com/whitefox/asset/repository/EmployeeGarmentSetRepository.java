package com.whitefox.asset.repository;

import com.whitefox.asset.entity.EmployeeGarmentSet;
import com.whitefox.asset.entity.Garment;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface EmployeeGarmentSetRepository extends JpaRepository<EmployeeGarmentSet, UUID> {
    Optional<EmployeeGarmentSet> findByEmployeeId(UUID employeeId);
    List<EmployeeGarmentSet> findBySetAGarmentId(UUID garmentId);
    List<EmployeeGarmentSet> findBySetBGarmentId(UUID garmentId);
    List<EmployeeGarmentSet> findBySetCGarmentId(UUID garmentId);
}