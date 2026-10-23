package com.slotplay.service.impl;

import com.slotplay.dto.NotificationResponse;
import com.slotplay.dto.PaginatedData;
import com.slotplay.entity.Notification;
import com.slotplay.entity.User;
import com.slotplay.exception.AppException;
import com.slotplay.repository.NotificationRepository;
import com.slotplay.repository.UserRepository;
import com.slotplay.service.NotificationService;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@Transactional
public class NotificationServiceImpl implements NotificationService {

    private final NotificationRepository notificationRepository;
    private final UserRepository userRepository;

    public NotificationServiceImpl(
            NotificationRepository notificationRepository,
            UserRepository userRepository
    ) {
        this.notificationRepository = notificationRepository;
        this.userRepository = userRepository;
    }

    @Override
    public Notification createNotification(UUID userId, String type, String title, String body) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> AppException.notFound("User"));

        Notification notification = new Notification(user, type, title, body);
        return notificationRepository.save(notification);
    }

    @Override
    @Transactional(readOnly = true)
    public PaginatedData<NotificationResponse> getUserNotifications(UUID userId, int page, int limit, String type) {
        int safePage = Math.max(1, page);
        int safeLimit = Math.min(50, Math.max(1, limit));
        Pageable pageable = PageRequest.of(safePage - 1, safeLimit);

        Page<Notification> notificationPage;
        if (type != null && !type.trim().isEmpty()) {
            notificationPage = notificationRepository.findByUserIdAndTypeOrderByCreatedAtDesc(userId, type.trim(), pageable);
        } else {
            notificationPage = notificationRepository.findByUserIdOrderByCreatedAtDesc(userId, pageable);
        }

        List<NotificationResponse> dtos = notificationPage.getContent().stream()
                .map(n -> new NotificationResponse(
                        n.getId().toString(),
                        n.getType(),
                        n.getTitle(),
                        n.getBody(),
                        n.isRead(),
                        n.getCreatedAt()
                ))
                .collect(Collectors.toList());

        return new PaginatedData<>(
                dtos,
                safePage,
                safeLimit,
                notificationPage.getTotalElements(),
                notificationPage.getTotalPages()
        );
    }

    @Override
    public void markAsRead(UUID id, UUID userId) {
        Notification notification = notificationRepository.findByIdAndUserId(id, userId)
                .orElseThrow(() -> AppException.notFound("Notification"));

        notification.setRead(true);
        notificationRepository.save(notification);
    }

    @Override
    public void markAllAsRead(UUID userId) {
        notificationRepository.markAllAsReadForUser(userId);
    }

    @Override
    public void deleteNotification(UUID id, UUID userId) {
        Notification notification = notificationRepository.findByIdAndUserId(id, userId)
                .orElseThrow(() -> AppException.notFound("Notification"));

        notificationRepository.delete(notification);
    }
}
