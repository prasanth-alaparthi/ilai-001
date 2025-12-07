package com.muse.auth.feed;


import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.nio.file.*;

@Component
public class LocalMediaStorage implements MediaStorage {

@Value("${app.media.storage-path:./uploads}")
    private String storagePath;

@Value("${app.media.base-url:/uploads}")
    private String baseUrl;

@Override
    public String store(MultipartFile file, String suggestedPrefix) throws IOException {
        String originalName = file.getOriginalFilename();
        String ext = "";
        if (originalName != null && originalName.contains(".")) {
            ext = originalName.substring(originalName.lastIndexOf('.'));
        }
        String filename = suggestedPrefix + "_" + System.currentTimeMillis() + "_" + Math.abs(file.hashCode()) + ext;
        Path targetDir = Path.of(storagePath);
        if (!Files.exists(targetDir)) {
            Files.createDirectories(targetDir);
        }
        Path target = targetDir.resolve(filename);
        Files.copy(file.getInputStream(), target, StandardCopyOption.REPLACE_EXISTING);
        return baseUrl + "/" + filename;
    }
}