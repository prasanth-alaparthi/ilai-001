package com.muse.notes;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.context.annotation.ComponentScan;
import org.springframework.scheduling.annotation.EnableAsync; // Added EnableAsync
import org.springframework.scheduling.annotation.EnableScheduling;

@EnableScheduling
@EnableAsync // Enable asynchronous method execution
@SpringBootApplication
@ComponentScan(basePackages = {"com.muse.notes"}) // Scan its own package
public class NotesServiceApplication {

	public static void main(String[] args) {
		SpringApplication.run(NotesServiceApplication.class, args);
	}
}
