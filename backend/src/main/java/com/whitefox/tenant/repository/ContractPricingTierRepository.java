package com.whitefox.tenant.repository;

import com.whitefox.tenant.entity.ContractPricingTier;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface ContractPricingTierRepository extends JpaRepository<ContractPricingTier, UUID> {
    List<ContractPricingTier> findByContractIdOrderByMinQuantityAsc(UUID contractId);
}