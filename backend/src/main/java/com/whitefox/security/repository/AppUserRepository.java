package com.whitefox.security.repository;

import com.whitefox.security.entity.AppUser;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface AppUserRepository extends JpaRepository<AppUser, UUID> {
    Optional<AppUser> findByEmail(String email);
    Optional<AppUser> findByUsername(String username);
    List<AppUser> findByTenantId(UUID tenantId);
    List<AppUser> findByTenantIdAndRole(UUID tenantId, AppUser.Role role);
    List<AppUser> findByRole(AppUser.Role role);
    Page<AppUser> findByTenantId(UUID tenantId, Pageable pageable);
    boolean existsByEmail(String email);
    boolean existsByUsername(String username);

    @Modifying
    @Transactional
    @Query("UPDATE AppUser u SET u.passwordHash = :hash WHERE u.email = :email")
    int updatePasswordHashByEmail(String hash, String email);
}