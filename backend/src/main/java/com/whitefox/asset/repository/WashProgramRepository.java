package com.whitefox.asset.repository;

import com.whitefox.asset.entity.WashProgram;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface WashProgramRepository extends JpaRepository<WashProgram, UUID> {
    Optional<WashProgram> findByCode(String code);
    List<WashProgram> findByIsActiveTrue();
}