package com.slotplay.service;

import com.slotplay.dto.UploadResult;
import org.springframework.web.multipart.MultipartFile;

public interface StorageService {

    UploadResult upload(MultipartFile file, String category);

    UploadResult upload(byte[] bytes, String originalFilename, String contentType, String category);

    void delete(String key);

    String getUrl(String key);
}
