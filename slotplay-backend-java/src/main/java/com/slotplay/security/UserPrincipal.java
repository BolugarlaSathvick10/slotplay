package com.slotplay.security;

import com.slotplay.entity.User;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.userdetails.UserDetails;

import java.io.Serializable;
import java.util.*;

public class UserPrincipal implements UserDetails, Serializable {

    private static final long serialVersionUID = 1L;

    private final UUID id;
    private final String email;
    private final String name;
    private final String password;
    private final String role;
    private final Integer roleId;
    private final boolean isVerified;
    private final String phone;
    private final String avatarUrl;
    private final Collection<? extends GrantedAuthority> authorities;

    public UserPrincipal(UUID id, String email, String name, String password,
                         String role, Integer roleId, boolean isVerified,
                         String phone, String avatarUrl,
                         Collection<? extends GrantedAuthority> authorities) {
        this.id = id;
        this.email = email;
        this.name = name;
        this.password = password;
        this.role = role;
        this.roleId = roleId;
        this.isVerified = isVerified;
        this.phone = phone;
        this.avatarUrl = avatarUrl;
        this.authorities = authorities;
    }

    public static UserPrincipal create(User user) {
        List<GrantedAuthority> authorities = getAuthoritiesForRole(user.getRole().getName());

        return new UserPrincipal(
                user.getId(),
                user.getEmail(),
                user.getName(),
                user.getPasswordHash(),
                user.getRole().getName(),
                user.getRole().getId(),
                user.isVerified(),
                user.getPhone(),
                user.getAvatarUrl(),
                authorities
        );
    }

    public static List<GrantedAuthority> getAuthoritiesForRole(String roleName) {
        Set<String> roles = new HashSet<>();
        String normalized = roleName != null ? roleName.toLowerCase().trim() : "user";

        switch (normalized) {
            case "admin":
                roles.add("ROLE_ADMIN");
                roles.add("ROLE_OWNER");
                roles.add("ROLE_USER");
                roles.add("ROLE_PLAYER");
                break;
            case "owner":
                roles.add("ROLE_OWNER");
                roles.add("ROLE_USER");
                roles.add("ROLE_PLAYER");
                break;
            case "user":
            default:
                roles.add("ROLE_USER");
                roles.add("ROLE_PLAYER");
                break;
        }

        List<GrantedAuthority> authorities = new ArrayList<>();
        for (String r : roles) {
            authorities.add(new SimpleGrantedAuthority(r));
        }
        return authorities;
    }

    public UUID getId() {
        return id;
    }

    public String getEmail() {
        return email;
    }

    public String getName() {
        return name;
    }

    public String getRole() {
        return role;
    }

    public Integer getRoleId() {
        return roleId;
    }

    public boolean isVerified() {
        return isVerified;
    }

    public String getPhone() {
        return phone;
    }

    public String getAvatarUrl() {
        return avatarUrl;
    }

    @Override
    public Collection<? extends GrantedAuthority> getAuthorities() {
        return authorities;
    }

    @Override
    public String getPassword() {
        return password;
    }

    @Override
    public String getUsername() {
        return email;
    }

    @Override
    public boolean isAccountNonExpired() {
        return true;
    }

    @Override
    public boolean isAccountNonLocked() {
        return true;
    }

    @Override
    public boolean isCredentialsNonExpired() {
        return true;
    }

    @Override
    public boolean isEnabled() {
        return true;
    }
}
