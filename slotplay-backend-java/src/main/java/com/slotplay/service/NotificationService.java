package com.slotplay.service;

import com.slotplay.dto.NotificationResponse;
import com.slotplay.dto.PaginatedData;
import com.slotplay.entity.Notification;

import java.util.UUID;

public interface NotificationService {

    Notification createNotification(UUID userId, String type, String title, String body);

    PaginatedData<NotificationResponse> getUserNotifications(UUID userId, int page, int limit, String type);

    void markAsRead(UUID id, UUID userId);

    void markAllAsRead(UUID userId);

    void deleteNotification(UUID id, UUID userId);
}
