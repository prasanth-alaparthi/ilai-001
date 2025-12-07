package com.muse.auth.feed;


import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;

public interface MediaStorage {
    String store(MultipartFile file, String suggestedPrefix) throws IOException;
}