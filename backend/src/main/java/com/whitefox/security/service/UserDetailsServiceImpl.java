package com.whitefox.security.service;

import com.whitefox.security.entity.AppUser;
import com.whitefox.security.repository.AppUserRepository;
import lombok.RequiredArgsConstructor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.UUID;

@Service
public class UserDetailsServiceImpl implements UserDetailsService {

    private static final Logger log = LoggerFactory.getLogger(UserDetailsServiceImpl.class);

    private final AppUserRepository userRepository;
    private final org.springframework.security.crypto.password.PasswordEncoder passwordEncoder;

    public UserDetailsServiceImpl(AppUserRepository userRepository, org.springframework.security.crypto.password.PasswordEncoder passwordEncoder) {
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
    }

    @Override
    @Transactional(readOnly = true)
    public UserDetails loadUserByUsername(String email) throws UsernameNotFoundException {
        log.debug("Loading user by email: {}", email);
        AppUser user = userRepository.findByEmail(email)
                .orElseThrow(() -> new UsernameNotFoundException("User not found: " + email));

        log.debug("Found user: {}, status: {}, tenant: {}, passwordHash: {}", 
            user.getEmail(), user.getStatus(), 
            user.getTenant() != null ? user.getTenant().getId() : "null",
            user.getPasswordHash());

        boolean matches = passwordEncoder.matches("admin123", user.getPasswordHash());
        log.debug("Password match test with 'admin123': {}", matches);

        if (user.getStatus() != AppUser.UserStatus.ACTIVE) {
            throw new UsernameNotFoundException("User account is not active: " + email);
        }

        return org.springframework.security.core.userdetails.User.builder()
                .username(user.getEmail())
                .password(user.getPasswordHash())
                .authorities(user.getRole().name())
                .accountExpired(false)
                .accountLocked(user.getStatus() == AppUser.UserStatus.LOCKED)
                .credentialsExpired(false)
                .disabled(user.getStatus() != AppUser.UserStatus.ACTIVE)
                .build();
    }

    @Transactional(readOnly = true)
    public AppUser loadUserEntityByUsername(String email) {
        return userRepository.findByEmail(email)
                .orElseThrow(() -> new UsernameNotFoundException("User not found: " + email));
    }

    @Transactional(readOnly = true)
    public AppUser loadUserEntityById(UUID userId) {
        return userRepository.findById(userId)
                .orElseThrow(() -> new UsernameNotFoundException("User not found: " + userId));
    }
}