package com.example.sdlcfactory.config;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.client.RestClient;

import java.time.Duration;

@Configuration
public class AnthropicConfig {

    @Bean
    RestClient anthropicRestClient(
            @Value("${anthropic.api-key:${ANTHROPIC_API_KEY:}}") String apiKey,
            @Value("${anthropic.base-url:https://api.anthropic.com}") String baseUrl,
            @Value("${anthropic.version:2023-06-01}") String version
    ) {
        if (apiKey == null || apiKey.isBlank()) {
            throw new IllegalStateException(
                    "ANTHROPIC_API_KEY is not set. Export it or set anthropic.api-key in application.yml."
            );
        }
        return RestClient.builder()
                .baseUrl(baseUrl)
                .defaultHeader("x-api-key", apiKey)
                .defaultHeader("anthropic-version", version)
                .defaultHeader("content-type", "application/json")
                .requestFactory(new org.springframework.http.client.JdkClientHttpRequestFactory(
                        java.net.http.HttpClient.newBuilder()
                                .connectTimeout(Duration.ofSeconds(30))
                                .build()))
                .build();
    }
}
