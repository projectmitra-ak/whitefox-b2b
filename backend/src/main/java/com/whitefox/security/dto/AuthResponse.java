package com.whitefox.security.dto;

import com.whitefox.security.entity.AppUser;
import java.util.UUID;

public class AuthResponse {

    private String accessToken;
    private String refreshToken;
    private String tokenType = "Bearer";
    private Long expiresIn;
    private UserInfo user;

    public AuthResponse() {}

    public AuthResponse(String accessToken, String refreshToken, String tokenType, Long expiresIn, UserInfo user) {
        this.accessToken = accessToken;
        this.refreshToken = refreshToken;
        this.tokenType = tokenType;
        this.expiresIn = expiresIn;
        this.user = user;
    }

    public String getAccessToken() { return accessToken; }
    public void setAccessToken(String accessToken) { this.accessToken = accessToken; }
    public String getRefreshToken() { return refreshToken; }
    public void setRefreshToken(String refreshToken) { this.refreshToken = refreshToken; }
    public String getTokenType() { return tokenType; }
    public void setTokenType(String tokenType) { this.tokenType = tokenType; }
    public Long getExpiresIn() { return expiresIn; }
    public void setExpiresIn(Long expiresIn) { this.expiresIn = expiresIn; }
    public UserInfo getUser() { return user; }
    public void setUser(UserInfo user) { this.user = user; }

    public static AuthResponseBuilder builder() {
        return new AuthResponseBuilder();
    }

    public static class AuthResponseBuilder {
        private String accessToken;
        private String refreshToken;
        private String tokenType = "Bearer";
        private Long expiresIn;
        private UserInfo user;

        public AuthResponseBuilder accessToken(String accessToken) { this.accessToken = accessToken; return this; }
        public AuthResponseBuilder refreshToken(String refreshToken) { this.refreshToken = refreshToken; return this; }
        public AuthResponseBuilder tokenType(String tokenType) { this.tokenType = tokenType; return this; }
        public AuthResponseBuilder expiresIn(Long expiresIn) { this.expiresIn = expiresIn; return this; }
        public AuthResponseBuilder user(UserInfo user) { this.user = user; return this; }

        public AuthResponse build() {
            return new AuthResponse(accessToken, refreshToken, tokenType, expiresIn, user);
        }
    }

    public static AuthResponse from(AppUser user, String accessToken, String refreshToken, long expiresIn) {
        UserInfo userInfo = new UserInfo(
            user.getId(),
            user.getEmail(),
            user.getUsername(),
            user.getFirstName(),
            user.getLastName(),
            user.getFullName(),
            user.getRole(),
            user.getStatus(),
            user.getTenant() != null ? user.getTenant().getId() : null,
            user.getTenant() != null ? user.getTenant().getName() : null,
            user.getTenant() != null ? user.getTenant().getCode() : null
        );

        return new AuthResponse(accessToken, refreshToken, "Bearer", expiresIn, userInfo);
    }

    public static class UserInfo {
        private UUID id;
        private String email;
        private String username;
        private String firstName;
        private String lastName;
        private String fullName;
        private AppUser.Role role;
        private AppUser.UserStatus status;
        private UUID tenantId;
        private String tenantName;
        private String tenantCode;

        public UserInfo() {}

        public UserInfo(UUID id, String email, String username, String firstName, String lastName, 
                        String fullName, AppUser.Role role, AppUser.UserStatus status, UUID tenantId, 
                        String tenantName, String tenantCode) {
            this.id = id;
            this.email = email;
            this.username = username;
            this.firstName = firstName;
            this.lastName = lastName;
            this.fullName = fullName;
            this.role = role;
            this.status = status;
            this.tenantId = tenantId;
            this.tenantName = tenantName;
            this.tenantCode = tenantCode;
        }

        public static UserInfoBuilder builder() {
            return new UserInfoBuilder();
        }

        public static class UserInfoBuilder {
            private UUID id;
            private String email;
            private String username;
            private String firstName;
            private String lastName;
            private String fullName;
            private AppUser.Role role;
            private AppUser.UserStatus status;
            private UUID tenantId;
            private String tenantName;
            private String tenantCode;

            public UserInfoBuilder id(UUID id) { this.id = id; return this; }
            public UserInfoBuilder email(String email) { this.email = email; return this; }
            public UserInfoBuilder username(String username) { this.username = username; return this; }
            public UserInfoBuilder firstName(String firstName) { this.firstName = firstName; return this; }
            public UserInfoBuilder lastName(String lastName) { this.lastName = lastName; return this; }
            public UserInfoBuilder fullName(String fullName) { this.fullName = fullName; return this; }
            public UserInfoBuilder role(AppUser.Role role) { this.role = role; return this; }
            public UserInfoBuilder status(AppUser.UserStatus status) { this.status = status; return this; }
            public UserInfoBuilder tenantId(UUID tenantId) { this.tenantId = tenantId; return this; }
            public UserInfoBuilder tenantName(String tenantName) { this.tenantName = tenantName; return this; }
            public UserInfoBuilder tenantCode(String tenantCode) { this.tenantCode = tenantCode; return this; }

            public UserInfo build() {
                return new UserInfo(id, email, username, firstName, lastName, fullName, role, status, tenantId, tenantName, tenantCode);
            }
        }

        public UUID getId() { return id; }
        public void setId(UUID id) { this.id = id; }
        public String getEmail() { return email; }
        public void setEmail(String email) { this.email = email; }
        public String getUsername() { return username; }
        public void setUsername(String username) { this.username = username; }
        public String getFirstName() { return firstName; }
        public void setFirstName(String firstName) { this.firstName = firstName; }
        public String getLastName() { return lastName; }
        public void setLastName(String lastName) { this.lastName = lastName; }
        public String getFullName() { return fullName; }
        public void setFullName(String fullName) { this.fullName = fullName; }
        public AppUser.Role getRole() { return role; }
        public void setRole(AppUser.Role role) { this.role = role; }
        public AppUser.UserStatus getStatus() { return status; }
        public void setStatus(AppUser.UserStatus status) { this.status = status; }
        public UUID getTenantId() { return tenantId; }
        public void setTenantId(UUID tenantId) { this.tenantId = tenantId; }
        public String getTenantName() { return tenantName; }
        public void setTenantName(String tenantName) { this.tenantName = tenantName; }
        public String getTenantCode() { return tenantCode; }
        public void setTenantCode(String tenantCode) { this.tenantCode = tenantCode; }
    }
}