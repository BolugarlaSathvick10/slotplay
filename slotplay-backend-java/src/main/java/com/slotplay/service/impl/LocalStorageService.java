package com.slotplay.service.impl;

import com.slotplay.dto.UploadResult;
import com.slotplay.exception.AppException;
import com.slotplay.service.StorageService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import javax.imageio.ImageIO;
import java.awt.image.BufferedImage;
import java.io.ByteArrayInputStream;
import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.List;
import java.util.Set;
import java.util.UUID;

@Service
public class LocalStorageService implements StorageService {

    private static final Logger log = LoggerFactory.getLogger(LocalStorageService.class);

    private static final Set<String> ALLOWED_MIME_TYPES = Set.of(
            "image/jpeg",
            "image/png",
            "image/webp"
    );

    private static final Set<String> ALLOWED_EXTENSIONS = Set.of(
            "jpg", "jpeg", "png", "webp"
    );

    @Value("${slotplay.storage.upload-dir:uploads}")
    private String uploadDir;

    @jakarta.annotation.PostConstruct
    public void validateStorageDirectory() {
        try {
            Path root = Paths.get(uploadDir).toAbsolutePath().normalize();
            if (!Files.exists(root)) {
                Files.createDirectories(root);
                log.info("[LocalStorage] Created upload directory at: {}", root);
            }
            if (!Files.isWritable(root)) {
                throw new IllegalStateException("Upload directory is not writable: " + root);
            }
            log.info("[LocalStorage] Upload directory validated and writable at: {}", root);
        } catch (IOException e) {
            throw new IllegalStateException("Failed to initialize upload directory: " + uploadDir + " - " + e.getMessage(), e);
        }
    }

    public void setUploadDir(String uploadDir) {
        this.uploadDir = uploadDir;
    }

    @Override
    public UploadResult upload(MultipartFile file, String category) {
        if (file == null || file.isEmpty()) {
            throw new AppException("Uploaded file is empty", HttpStatus.BAD_REQUEST, "EMPTY_FILE");
        }

        try {
            return upload(file.getBytes(), file.getOriginalFilename(), file.getContentType(), category);
        } catch (IOException e) {
            log.error("Failed to read uploaded file: {}", e.getMessage(), e);
            throw new AppException("Failed to read file", HttpStatus.INTERNAL_SERVER_ERROR, "STORAGE_ERROR");
        }
    }

    @Override
    public UploadResult upload(byte[] bytes, String originalFilename, String contentType, String category) {
        if (bytes == null || bytes.length == 0) {
            throw new AppException("Uploaded file is empty", HttpStatus.BAD_REQUEST, "EMPTY_FILE");
        }

        // Validate MIME type
        String resolvedContentType = (contentType != null) ? contentType.toLowerCase() : "application/octet-stream";
        String ext = extractExtension(originalFilename, resolvedContentType);

        if (!ALLOWED_MIME_TYPES.contains(resolvedContentType) || !ALLOWED_EXTENSIONS.contains(ext)) {
            throw new AppException(
                    "File type not allowed. Accepted: " + String.join(", ", ALLOWED_MIME_TYPES),
                    HttpStatus.BAD_REQUEST,
                    "INVALID_FILE_TYPE"
            );
        }

        // Magic bytes / image content validation
        validateImageBytes(bytes, resolvedContentType, ext);

        // Normalize category
        String safeCategory = (category != null && !category.trim().isEmpty())
                ? category.trim().replaceAll("[^a-zA-Z0-9_-]", "")
                : "misc";

        String uniqueFilename = UUID.randomUUID() + "." + ext;
        String key = safeCategory + "/" + uniqueFilename;

        try {
            Path categoryPath = Paths.get(uploadDir, safeCategory).toAbsolutePath().normalize();
            Files.createDirectories(categoryPath);

            Path targetPath = categoryPath.resolve(uniqueFilename);
            Files.write(targetPath, bytes);

            String url = getUrl(key);
            log.info("[LocalStorage] Uploaded file: key={}, size={} bytes, url={}", key, bytes.length, url);

            return new UploadResult(url, key, resolvedContentType, bytes.length);
        } catch (IOException e) {
            log.error("[LocalStorage] Failed to save file to disk: {}", e.getMessage(), e);
            throw new AppException("Failed to store file", HttpStatus.INTERNAL_SERVER_ERROR, "STORAGE_ERROR");
        }
    }

    @Override
    public void delete(String key) {
        if (key == null || key.trim().isEmpty()) {
            return;
        }

        try {
            Path filePath = Paths.get(uploadDir, key).toAbsolutePath().normalize();
            Files.deleteIfExists(filePath);
            log.info("[LocalStorage] Deleted file: key={}", key);
        } catch (IOException e) {
            log.warn("[LocalStorage] Could not delete file: key={}, error={}", key, e.getMessage());
        }
    }

    @Override
    public String getUrl(String key) {
        if (key == null) return null;
        if (key.startsWith("http://") || key.startsWith("https://")) {
            return key;
        }
        if (key.startsWith("/")) {
            return key;
        }
        return "/uploads/" + key;
    }

    private String extractExtension(String filename, String contentType) {
        if (filename != null && filename.contains(".")) {
            String sub = filename.substring(filename.lastIndexOf('.') + 1).toLowerCase();
            if (ALLOWED_EXTENSIONS.contains(sub)) {
                return "jpeg".equals(sub) ? "jpg" : sub;
            }
        }

        return switch (contentType) {
            case "image/png" -> "png";
            case "image/webp" -> "webp";
            default -> "jpg";
        };
    }

    private void validateImageBytes(byte[] bytes, String contentType, String ext) {
        if (bytes.length < 4) {
            throw new AppException("Uploaded file is not a valid image", HttpStatus.BAD_REQUEST, "INVALID_IMAGE");
        }

        // Magic byte checks
        boolean isJpeg = (bytes[0] == (byte) 0xFF && bytes[1] == (byte) 0xD8);
        boolean isPng = (bytes[0] == (byte) 0x89 && bytes[1] == (byte) 0x50 && bytes[2] == (byte) 0x4E && bytes[3] == (byte) 0x47);
        boolean isWebp = bytes.length >= 12
                && bytes[0] == (byte) 'R' && bytes[1] == (byte) 'I' && bytes[2] == (byte) 'F' && bytes[3] == (byte) 'F'
                && bytes[8] == (byte) 'W' && bytes[9] == (byte) 'E' && bytes[10] == (byte) 'B' && bytes[11] == (byte) 'P';

        if (isJpeg || isPng || isWebp) {
            // Header is a known valid image format
            return;
        }

        // Secondary verification using ImageIO
        try {
            BufferedImage image = ImageIO.read(new ByteArrayInputStream(bytes));
            if (image == null) {
                throw new AppException("Uploaded file is not a valid image", HttpStatus.BAD_REQUEST, "INVALID_IMAGE");
            }
        } catch (Exception e) {
            throw new AppException("Uploaded file is not a valid image", HttpStatus.BAD_REQUEST, "INVALID_IMAGE");
        }
    }
}
