package ru.flagman.monitoring.config;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.config.Customizer;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.core.userdetails.User;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.provisioning.InMemoryUserDetailsManager;
import org.springframework.security.web.SecurityFilterChain;

/** ROLE_ADMIN — управление и аналитика; ROLE_STAFF — остатки, стоп-лист, горячие предложения, заказы. */
@Configuration
@EnableWebSecurity
public class SecurityConfig {

    @Bean
    SecurityFilterChain filterChain(HttpSecurity http) throws Exception {
        http.csrf(c -> c.disable())
            .sessionManagement(s -> s.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
            .authorizeHttpRequests(a -> a
                .requestMatchers("/api/admin/**", "/api/supplies/**", "/api/analytics/**").hasRole("ADMIN")
                .requestMatchers("/api/**").hasAnyRole("ADMIN", "STAFF")
                .anyRequest().denyAll())
            .httpBasic(Customizer.withDefaults());
        return http.build();
    }

    @Bean
    PasswordEncoder passwordEncoder() { return new BCryptPasswordEncoder(); }

    @Bean
    UserDetailsService users(PasswordEncoder enc,
                             @Value("${app.users.admin-password}") String adminPwd,
                             @Value("${app.users.staff-password}") String staffPwd) {
        return new InMemoryUserDetailsManager(
                User.withUsername("admin").password(enc.encode(adminPwd)).roles("ADMIN").build(),
                User.withUsername("staff").password(enc.encode(staffPwd)).roles("STAFF").build());
    }
}
