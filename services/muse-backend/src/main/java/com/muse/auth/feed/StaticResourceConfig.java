package com.muse.auth.feed;


import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.servlet.config.annotation.*;

@Configuration
public class StaticResourceConfig implements WebMvcConfigurer {

@Value("${app.media.storage-path:./uploads}")
    private String storagePath;

@Override
    public void addResourceHandlers(ResourceHandlerRegistry registry) {
        String location = "file:" + storagePath + "/";
        registry.addResourceHandler("/uploads/**")
                .addResourceLocations(location);
    }
}

 