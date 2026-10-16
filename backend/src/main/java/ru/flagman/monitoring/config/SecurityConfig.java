package ru.flagman.monitoring.config;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;
import org.springframework.http.MediaType;
import org.springframework.security.config.Customizer;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;

import java.util.Arrays;
import java.util.List;

/** Роли пользователей загружаются из PostgreSQL через DatabaseUserDetailsService. */
@Configuration
@EnableWebSecurity
public class SecurityConfig {

    @Bean
    SecurityFilterChain filterChain(HttpSecurity http) throws Exception {
        http.cors(Customizer.withDefaults())
            // Безопасно только для stateless Basic Auth. При переходе на cookies включить CSRF.
            .csrf(c -> c.disable())
            .sessionManagement(s -> s.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
            .authorizeHttpRequests(a -> a
                .requestMatchers("/v3/api-docs/**", "/swagger-ui/**", "/swagger-ui.html").permitAll()
                // Preflight CORS не должен блокироваться проверкой роли.
                .requestMatchers(HttpMethod.OPTIONS, "/**").permitAll()
                // Управление учётными записями всегда остаётся только у администратора.
                .requestMatchers("/api/admin/users/**").hasRole("ADMIN")
                // Сотрудникам нужен доступ на чтение каталога для работы с заказами,
                // но любые изменения каталога остаются административными.
                // Чтение блюд нужно сотрудникам для оформления заказов.
                .requestMatchers(HttpMethod.GET,
                    "/api/admin/dishes", "/api/admin/dishes/**")
                    .hasAnyRole("ADMIN", "STAFF")
                .requestMatchers("/api/admin/**").hasRole("ADMIN")
                // История поставок доступна обеим ролям. Изменение статуса — обеим;
                // регистрация новой поставки/приёмка пока остаётся за администратором.
                .requestMatchers(HttpMethod.GET, "/api/supplies", "/api/supplies/**")
                    .hasAnyRole("ADMIN", "STAFF")
                .requestMatchers(HttpMethod.PATCH, "/api/supplies/**")
                    .hasAnyRole("ADMIN", "STAFF")
                .requestMatchers("/api/supplies/**").hasRole("ADMIN")
                .requestMatchers("/api/analytics/**").hasRole("ADMIN")
                .requestMatchers("/api/**").hasAnyRole("ADMIN", "STAFF")
                .anyRequest().denyAll())
            .httpBasic(b -> b.authenticationEntryPoint((request, response, ex) -> {
                // Не отправляем WWW-Authenticate: браузер не откроет системное Basic Auth окно.
                response.setStatus(401);
                response.setContentType(MediaType.APPLICATION_JSON_VALUE);
                response.getWriter().write("{\"error\":\"unauthorized\"}");
            }))
            .exceptionHandling(e -> e.accessDeniedHandler((request, response, ex) -> {
                // ВРЕМЕННАЯ ДИАГНОСТИКА: выясняем, кто именно получает 403.
                var auth = org.springframework.security.core.context.SecurityContextHolder
                    .getContext()
                    .getAuthentication();

                System.err.println("=== ACCESS DENIED ===");
                System.err.println("URI: " + request.getRequestURI());
                System.err.println("METHOD: " + request.getMethod());
                System.err.println("PRINCIPAL: " +
                    (auth != null ? auth.getName() : "null"));
                System.err.println("AUTHORITIES: " +
                    (auth != null ? auth.getAuthorities() : "null"));
                System.err.println("EXCEPTION: " + ex.getMessage());

                response.setStatus(403);
                response.setContentType(MediaType.APPLICATION_JSON_VALUE);
                response.getWriter().write(
                    "{\"error\":\"forbidden\",\"message\":\"insufficient_permissions\"}"
                );
            }));

        return http.build();
    }

    @Bean
    PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder(12);
    }

    @Bean
    CorsConfigurationSource corsConfigurationSource(
            @Value("${app.cors.allowed-origins:http://localhost:5173}") String origins) {
        CorsConfiguration config = new CorsConfiguration();
        config.setAllowedOrigins(Arrays.stream(origins.split(","))
            .map(String::trim)
            .filter(s -> !s.isEmpty())
            .toList());
        config.setAllowedMethods(List.of("GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"));
        config.setAllowedHeaders(List.of("Authorization", "Content-Type", "Accept"));
        config.setAllowCredentials(false);

        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/**", config);
        return source;
    }
}