package com.whitefox.tenant.entity;

import com.whitefox.security.entity.AppUser;
import jakarta.persistence.*;
import jakarta.validation.constraints.NotNull;
import java.io.Serializable;
import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "user_branch_access")
@IdClass(UserBranchAccess.UserBranchAccessId.class)
public class UserBranchAccess {

    @Id
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private AppUser user;

    @Id
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "branch_id", nullable = false)
    private Branch branch;

    @NotNull
    @Enumerated(EnumType.STRING)
    @Column(name = "access_level", nullable = false, length = 20)
    private AccessLevel accessLevel = AccessLevel.READ;

    @Column(name = "granted_at")
    private Instant grantedAt = Instant.now();

    @Column(name = "granted_by")
    private UUID grantedBy;

    public enum AccessLevel {
        READ, WRITE, ADMIN
    }

    public static class UserBranchAccessId implements Serializable {
        private AppUser user;
        private Branch branch;

        public UserBranchAccessId() {}

        public UserBranchAccessId(AppUser user, Branch branch) {
            this.user = user;
            this.branch = branch;
        }

        public AppUser getUser() { return user; }
        public void setUser(AppUser user) { this.user = user; }
        public Branch getBranch() { return branch; }
        public void setBranch(Branch branch) { this.branch = branch; }

        @Override
        public boolean equals(Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;
            UserBranchAccessId that = (UserBranchAccessId) o;
            return user.equals(that.user) && branch.equals(that.branch);
        }

        @Override
        public int hashCode() {
            return java.util.Objects.hash(user, branch);
        }
    }

    public AppUser getUser() { return user; }
    public void setUser(AppUser user) { this.user = user; }
    public Branch getBranch() { return branch; }
    public void setBranch(Branch branch) { this.branch = branch; }
    public AccessLevel getAccessLevel() { return accessLevel; }
    public void setAccessLevel(AccessLevel accessLevel) { this.accessLevel = accessLevel; }
    public Instant getGrantedAt() { return grantedAt; }
    public void setGrantedAt(Instant grantedAt) { this.grantedAt = grantedAt; }
    public UUID getGrantedBy() { return grantedBy; }
    public void setGrantedBy(UUID grantedBy) { this.grantedBy = grantedBy; }
}