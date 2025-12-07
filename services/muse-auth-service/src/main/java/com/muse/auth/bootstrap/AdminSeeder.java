package com.muse.auth.bootstrap;

import com.muse.auth.auth.enums.AccountStatus;
import com.muse.auth.auth.enums.Role;
import com.muse.auth.auth.entity.User;
import com.muse.auth.auth.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

@Component
@RequiredArgsConstructor
public class AdminSeeder implements CommandLineRunner {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;

    @Override
    public void run(String[] args) {
        if (userRepository.findByUsername("admin").isPresent()) return;

        User admin = User.builder()
                .username("admin")
                .email("admin@example.com")
                .passwordHash(passwordEncoder.encode("changeMe123!"))
                .role(Role.ADMIN)
                .status(AccountStatus.ACTIVE)
                .build();

        userRepository.save(admin);
    }
}
