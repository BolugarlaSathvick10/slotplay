package com.slotplay.config;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.slotplay.dto.ApiErrorResponse;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;
import org.springframework.http.MediaType;
import org.springframework.security.config.annotation.method.configuration.EnableMethodSecurity;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.annotation.web.configurers.AbstractHttpConfigurer;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.AuthenticationEntryPoint;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.access.AccessDeniedHandler;
import org.springframework.security.web.context.HttpSessionSecurityContextRepository;
import org.springframework.web.cors.CorsConfigurationSource;

@Configuration
@EnableWebSecurity
@EnableMethodSecurity
public class SecurityConfig {

    private final CorsConfigurationSource corsConfigurationSource;
    private final ObjectMapper objectMapper = new ObjectMapper();

    public SecurityConfig(CorsConfigurationSource corsConfigurationSource) {
        this.corsConfigurationSource = corsConfigurationSource;
    }

    @Bean
    public PasswordEncoder passwordEncoder() {
        // Enforce 12 rounds matching Node.js BCRYPT_ROUNDS = 12
        return new BCryptPasswordEncoder(12);
    }

    @Bean
    public SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception {
        http
            .cors(cors -> cors.configurationSource(corsConfigurationSource))
            .csrf(AbstractHttpConfigurer::disable)
            .sessionManagement(session -> session
                .sessionCreationPolicy(SessionCreationPolicy.IF_REQUIRED)
            )
            .securityContext(context -> context
                .securityContextRepository(new HttpSessionSecurityContextRepository())
            )
            .exceptionHandling(ex -> ex
                .authenticationEntryPoint(customAuthenticationEntryPoint())
                .accessDeniedHandler(customAccessDeniedHandler())
            )
            .authorizeHttpRequests(auth -> auth
                // Public / Health / Docs / Static assets
                .requestMatchers("/api/health").permitAll()
                .requestMatchers("/swagger-ui/**", "/swagger-ui.html", "/api-docs/**", "/v3/api-docs/**").permitAll()
                .requestMatchers("/uploads/**").permitAll()

                // Public Auth Endpoints
                .requestMatchers(HttpMethod.POST,
                    "/api/auth/register",
                    "/api/auth/login",
                    "/api/auth/verify-otp",
                    "/api/auth/verify-otp-email",
                    "/api/auth/resend-otp",
                    "/api/auth/forgot-password",
                    "/api/auth/reset-password"
                ).permitAll()

                // Protected Auth Endpoints
                .requestMatchers(HttpMethod.GET, "/api/auth/me").authenticated()
                .requestMatchers(HttpMethod.PUT, "/api/auth/me").authenticated()
                .requestMatchers(HttpMethod.POST, "/api/auth/logout").authenticated()
                .requestMatchers(HttpMethod.POST, "/api/auth/change-password").authenticated()

                // Public Ticket QR validation guard (for gate scanner / verification)
                .requestMatchers(HttpMethod.GET, "/api/bookings/ticket/**").permitAll()
                .requestMatchers(HttpMethod.POST, "/api/bookings/ticket/verify", "/api/bookings/verify-ticket").permitAll()

                // Bookings endpoints guard
                .requestMatchers("/api/bookings/**").authenticated()

                // Notifications endpoints guard
                .requestMatchers("/api/notifications/**").authenticated()

                // Admin endpoints guard
                .requestMatchers("/api/admin/**").hasRole("ADMIN")

                // Owner endpoints guard
                .requestMatchers("/api/owner/**").hasAnyRole("OWNER", "ADMIN")

                // Reviews endpoints guard
                .requestMatchers(HttpMethod.POST, "/api/reviews/**", "/api/venues/reviews").authenticated()

                // Public Venues Browse vs Authenticated Mutations
                .requestMatchers(HttpMethod.GET, "/api/venues/**").permitAll()
                .requestMatchers(HttpMethod.POST, "/api/venues/**").authenticated()
                .requestMatchers(HttpMethod.PUT, "/api/venues/**").authenticated()
                .requestMatchers(HttpMethod.PATCH, "/api/venues/**").authenticated()
                .requestMatchers(HttpMethod.DELETE, "/api/venues/**").authenticated()

                // Any other request allowed to reach DispatcherServlet (so unmatched routes return 404)
                .anyRequest().permitAll()
            );

        return http.build();
    }

    @Bean
    public AuthenticationEntryPoint customAuthenticationEntryPoint() {
        return (request, response, authException) -> {
            response.setStatus(HttpServletResponse.SC_UNAUTHORIZED);
            response.setContentType(MediaType.APPLICATION_JSON_VALUE);
            ApiErrorResponse error = ApiErrorResponse.of("Not authenticated", "UNAUTHORISED");
            response.getWriter().write(objectMapper.writeValueAsString(error));
        };
    }

    @Bean
    public AccessDeniedHandler customAccessDeniedHandler() {
        return (request, response, accessDeniedException) -> {
            response.setStatus(HttpServletResponse.SC_FORBIDDEN);
            response.setContentType(MediaType.APPLICATION_JSON_VALUE);
            ApiErrorResponse error = ApiErrorResponse.of("You do not have permission to perform this action", "FORBIDDEN");
            response.getWriter().write(objectMapper.writeValueAsString(error));
        };
    }

    @Bean
    public org.springframework.boot.web.servlet.server.CookieSameSiteSupplier cookieSameSiteSupplier(
            @org.springframework.beans.factory.annotation.Value("${server.servlet.session.cookie.same-site:lax}") String sameSite
    ) {
        if ("strict".equalsIgnoreCase(sameSite)) {
            return org.springframework.boot.web.servlet.server.CookieSameSiteSupplier.ofStrict();
        } else if ("none".equalsIgnoreCase(sameSite)) {
            return org.springframework.boot.web.servlet.server.CookieSameSiteSupplier.ofNone();
        }
        return org.springframework.boot.web.servlet.server.CookieSameSiteSupplier.ofLax();
    }
}
