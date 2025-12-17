package com.muse.ai;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.scheduling.annotation.EnableScheduling;

@SpringBootApplication
@EnableScheduling
public class MuseAiServiceApplication {

    public static void main(String[] args) {
        SpringApplication.run(MuseAiServiceApplication.class, args);
    }

}
