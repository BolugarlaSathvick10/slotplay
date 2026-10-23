package com.slotplay.service.impl;

import com.slotplay.dto.AdminUserResponse;
import com.slotplay.dto.PaginatedData;
import com.slotplay.entity.Role;
import com.slotplay.entity.User;
import com.slotplay.exception.AppException;
import com.slotplay.repository.RoleRepository;
import com.slotplay.repository.UserRepository;
import com.slotplay.service.AdminUserService;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;

@Service
@Transactional
public class AdminUserServiceImpl implements AdminUserService {

    private final UserRepository userRepository;
    private final RoleRepository roleRepository;

    public AdminUserServiceImpl(UserRepository userRepository, RoleRepository roleRepository) {
        this.userRepository = userRepository;
        this.roleRepository = roleRepository;
    }

    @Override
    @Transactional(readOnly = true)
    public PaginatedData<AdminUserResponse> listUsers(int page, int limit, String search) {
        int safePage = Math.max(1, page);
        int safeLimit = Math.max(1, limit);
        Pageable pageable = PageRequest.of(safePage - 1, safeLimit, Sort.by(Sort.Direction.DESC, "createdAt"));

        Page<User> userPage;
        if (search != null && !search.trim().isBlank()) {
            String term = search.trim();
            userPage = userRepository.findByNameContainingIgnoreCaseOrEmailContainingIgnoreCase(term, term, pageable);
        } else {
            userPage = userRepository.findAll(pageable);
        }

        List<AdminUserResponse> dtos = userPage.getContent().stream()
                .map(this::toAdminUserResponse)
                .toList();

        int pages = safeLimit > 0 ? (int) Math.ceil((double) userPage.getTotalElements() / safeLimit) : 1;
        if (pages == 0) {
            pages = 1;
        }

        return new PaginatedData<>(dtos, safePage, safeLimit, userPage.getTotalElements(), pages);
    }

    @Override
    public AdminUserResponse updateUserRole(UUID userId, int roleId) {
        if (roleId < 1 || roleId > 3) {
            throw AppException.badRequest("Invalid roleId");
        }

        User user = userRepository.findById(userId)
                .orElseThrow(() -> AppException.notFound("User"));

        Role role = roleRepository.findById(roleId)
                .orElseThrow(() -> AppException.notFound("Role"));

        user.setRole(role);
        User saved = userRepository.save(user);

        return toAdminUserResponse(saved);
    }

    @Override
    public AdminUserResponse updateUserVerification(UUID userId, boolean isVerified) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> AppException.notFound("User"));

        user.setVerified(isVerified);
        User saved = userRepository.save(user);

        return toAdminUserResponse(saved);
    }

    private AdminUserResponse toAdminUserResponse(User user) {
        return new AdminUserResponse(
                user.getId().toString(),
                user.getName(),
                user.getEmail(),
                user.getPhone(),
                user.getRole().getId(),
                user.isVerified(),
                user.getCreatedAt()
        );
    }
}
