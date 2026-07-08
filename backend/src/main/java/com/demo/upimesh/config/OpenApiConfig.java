package com.demo.upimesh.config;

import io.swagger.v3.oas.models.OpenAPI;
import io.swagger.v3.oas.models.info.Contact;
import io.swagger.v3.oas.models.info.Info;
import io.swagger.v3.oas.models.info.License;
import io.swagger.v3.oas.models.servers.Server;
import org.springdoc.core.models.GroupedOpenApi;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

import java.util.List;

@Configuration
public class OpenApiConfig {

    @Bean
    public OpenAPI customOpenAPI() {
        return new OpenAPI()
                .info(new Info()
                        .title("UPI Offline Mesh API")
                        .version("0.0.1")
                        .description("""
                                REST API for the offline UPI mesh payment demo.

                                Simulates Bluetooth-mesh–based peer-to-peer payments where devices relay
                                encrypted packets until one reaches a bridge node with internet connectivity.

                                **Key concepts:**
                                - **Mesh simulation** — virtual devices gossip packets among themselves
                                - **Hybrid encryption** — RSA-OAEP wraps AES-256-GCM so intermediates cannot read payloads
                                - **Idempotency** — packet ciphertext hashes prevent duplicate settlement
                                - **Demo accounts** — pre-loaded accounts (alice, bob, carol, dave@demo) with PIN `1234`
                                """)
                        .contact(new Contact()
                                .name("Demo Team")
                                .email("hello@upimesh.dev")
                                .url("https://github.com/upimesh"))
                        .license(new License()
                                .name("MIT")
                                .url("https://opensource.org/licenses/MIT")))
                .servers(List.of(
                        new Server().url("http://localhost:8080").description("Local development server")
                ));
    }

    @Bean
    public GroupedOpenApi meshApi() {
        return GroupedOpenApi.builder()
                .group("mesh-api")
                .displayName("Mesh Network API")
                .packagesToScan("com.demo.upimesh.controller")
                .build();
    }
}
