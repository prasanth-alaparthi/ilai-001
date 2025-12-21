package com.muse.notes.config;

import com.muse.notes.security.InternalServiceInterceptor;
import lombok.RequiredArgsConstructor;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.servlet.config.annotation.InterceptorRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

/**
 * Web MVC Configuration for Notes Service.
 * 
 * Registers the InternalServiceInterceptor to secure internal APIs.
 */
@Configuration
@RequiredArgsConstructor
public class WebMvcConfig implements WebMvcConfigurer {

    private final InternalServiceInterceptor internalServiceInterceptor;

    @Override
    public void addInterceptors(InterceptorRegistry registry) {
        registry.addInterceptor(internalServiceInterceptor)
                .addPathPatterns("/api/internal/**")
                .order(1); // High priority
    }
}
