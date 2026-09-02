package com.whitefox;

import com.whitefox.security.repository.AppUserRepository;
import org.springframework.boot.CommandLineRunner;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.boot.autoconfigure.security.servlet.SecurityAutoConfiguration;
import org.springframework.context.annotation.Bean;
import org.springframework.modulith.Modulith;
import org.springframework.scheduling.annotation.EnableAsync;
import org.springframework.scheduling.annotation.EnableScheduling;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;

@SpringBootApplication(exclude = {SecurityAutoConfiguration.class})
@EnableAsync
@EnableScheduling
public class WhitefoxApplication {

    public static void main(String[] args) {
        SpringApplication.run(WhitefoxApplication.class, args);
    }

    @Modulith
    static class ModuleConfiguration {
    }

    @Bean
    CommandLineRunner testPasswordEncoder(BCryptPasswordEncoder encoder) {
        return args -> {
            String hash = encoder.encode("admin123");
            System.out.println("=== GENERATED HASH FOR 'admin123': " + hash + " ===");
            boolean matches = encoder.matches("admin123", hash);
            System.out.println("=== MATCHES: " + matches + " ===");
        };
    }

    @Bean
    CommandLineRunner fixAdminPassword(AppUserRepository userRepository, PasswordEncoder passwordEncoder) {
        return args -> {
            String newHash = passwordEncoder.encode("admin123");
            int updated = userRepository.updatePasswordHashByEmail(newHash, "admin@whitefox.com");
            System.out.println("=== UPDATED ADMIN PASSWORD HASH: " + newHash + " (rows: " + updated + ") ===");
        };
    }
}