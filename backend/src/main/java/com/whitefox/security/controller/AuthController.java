package com.whitefox.security.controller;

import com.whitefox.common.tenant.TenantContext;
import com.whitefox.security.dto.AuthRequest;
import com.whitefox.security.dto.AuthResponse;
import com.whitefox.security.dto.RefreshTokenRequest;
import com.whitefox.security.entity.AppUser;
import com.whitefox.security.service.JwtService;
import com.whitefox.security.service.UserDetailsServiceImpl;
import com.whitefox.tenant.entity.Tenant;
import com.whitefox.tenant.repository.TenantRepository;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.userdetails.User;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.*;

import java.util.UUID;

@RestController
@RequestMapping("/v1/auth")
@RequiredArgsConstructor
@Tag(name = "Authentication", description = "Authentication and authorization APIs")
public class AuthController {

    private final AuthenticationManager authenticationManager;
    private final JwtService jwtService;
    private final UserDetailsServiceImpl userDetailsService;
    private final PasswordEncoder passwordEncoder;
    private final TenantRepository tenantRepository;

    private UserDetails toUserDetails(AppUser user) {
        return User.builder()
                .username(user.getEmail())
                .password(user.getPasswordHash())
                .authorities(user.getRole().name())
                .build();
    }

    @PostMapping("/login")
    @Operation(summary = "Authenticate user and return JWT tokens")
    public ResponseEntity<AuthResponse> login(@Valid @RequestBody AuthRequest request) {
        Authentication authentication = authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(request.getEmail(), request.getPassword())
        );

        SecurityContextHolder.getContext().setAuthentication(authentication);

        AppUser user = userDetailsService.loadUserEntityByUsername(request.getEmail());

        UUID tenantId = user.getTenant() != null ? user.getTenant().getId() : null;
        if (tenantId != null) {
            TenantContext.setTenantId(tenantId);
        }

        UserDetails userDetails = toUserDetails(user);
        String accessToken = jwtService.generateToken(userDetails, tenantId);
        String refreshToken = jwtService.generateRefreshToken(userDetails, tenantId);

        user.setLastLoginAt(java.time.Instant.now());
        user.setFailedLoginAttempts(0);
        user.setLockedUntil(null);

        return ResponseEntity.ok(AuthResponse.from(user, accessToken, refreshToken, 86400000L));
    }

    @PostMapping("/refresh")
    @Operation(summary = "Refresh access token using refresh token")
    public ResponseEntity<AuthResponse> refreshToken(@Valid @RequestBody RefreshTokenRequest request) {
        String refreshToken = request.getRefreshToken();
        String email = jwtService.extractUsername(refreshToken);

        if (email == null) {
            return ResponseEntity.badRequest().build();
        }

        AppUser user = userDetailsService.loadUserEntityByUsername(email);

        if (!jwtService.isTokenValid(refreshToken, toUserDetails(user))) {
            return ResponseEntity.status(401).build();
        }

        UUID tenantId = user.getTenant() != null ? user.getTenant().getId() : null;
        UserDetails userDetails = toUserDetails(user);

        String newAccessToken = jwtService.generateToken(userDetails, tenantId);
        String newRefreshToken = jwtService.generateRefreshToken(userDetails, tenantId);

        return ResponseEntity.ok(AuthResponse.from(user, newAccessToken, newRefreshToken, 86400000L));
    }

    @PostMapping("/logout")
    @Operation(summary = "Logout user (client-side token invalidation)")
    public ResponseEntity<Void> logout(HttpServletRequest request) {
        SecurityContextHolder.clearContext();
        TenantContext.clear();
        return ResponseEntity.ok().build();
    }

    @GetMapping("/me")
    @Operation(summary = "Get current authenticated user info")
    public ResponseEntity<AuthResponse.UserInfo> getCurrentUser(Authentication authentication) {
        if (authentication == null || !authentication.isAuthenticated()) {
            return ResponseEntity.status(401).build();
        }

        String email = authentication.getName();
        AppUser user = userDetailsService.loadUserEntityByUsername(email);

        return ResponseEntity.ok(AuthResponse.UserInfo.builder()
                .id(user.getId())
                .email(user.getEmail())
                .username(user.getUsername())
                .firstName(user.getFirstName())
                .lastName(user.getLastName())
                .fullName(user.getFullName())
                .role(user.getRole())
                .status(user.getStatus())
                .tenantId(user.getTenant() != null ? user.getTenant().getId() : null)
                .tenantName(user.getTenant() != null ? user.getTenant().getName() : null)
                .tenantCode(user.getTenant() != null ? user.getTenant().getCode() : null)
                .build());
    }

    @PostMapping("/change-password")
    @Operation(summary = "Change user password")
    public ResponseEntity<Void> changePassword(
            @RequestParam String currentPassword,
            @RequestParam String newPassword,
            Authentication authentication) {

        String email = authentication.getName();
        AppUser user = userDetailsService.loadUserEntityByUsername(email);

        if (!passwordEncoder.matches(currentPassword, user.getPasswordHash())) {
            return ResponseEntity.badRequest().build();
        }

        user.setPasswordHash(passwordEncoder.encode(newPassword));
        user.setPasswordChangedAt(java.time.Instant.now());

        return ResponseEntity.ok().build();
    }

    @PostMapping("/forgot-password")
    @Operation(summary = "Request password reset")
    public ResponseEntity<Void> forgotPassword(@RequestParam String email) {
        return ResponseEntity.ok().build();
    }

    @PostMapping("/reset-password")
    @Operation(summary = "Reset password with token")
    public ResponseEntity<Void> resetPassword(
            @RequestParam String token,
            @RequestParam String newPassword) {
        return ResponseEntity.ok().build();
    }
}