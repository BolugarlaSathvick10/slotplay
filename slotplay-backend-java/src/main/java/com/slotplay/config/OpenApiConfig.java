package com.slotplay.config;

import io.swagger.v3.oas.models.OpenAPI;
import io.swagger.v3.oas.models.info.Contact;
import io.swagger.v3.oas.models.info.Info;
import io.swagger.v3.oas.models.info.License;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class OpenApiConfig {

    @Bean
    public OpenAPI slotPlayOpenAPI() {
        return new OpenAPI()
            .info(new Info()
                .title("SlotPlay REST API")
                .description("Backend REST API for SlotPlay Sports Venue Booking Platform (Java 21 LTS / Spring Boot 3)")
                .version("1.0.0")
                .contact(new Contact()
                    .name("SlotPlay Team")
                    .email("support@slotplay.in"))
                .license(new License()
                    .name("Proprietary")));
    }
}
