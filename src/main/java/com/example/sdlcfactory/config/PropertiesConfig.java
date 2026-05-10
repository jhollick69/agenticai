package com.example.sdlcfactory.config;

import org.springframework.boot.context.properties.EnableConfigurationProperties;
import org.springframework.context.annotation.Configuration;

@Configuration
@EnableConfigurationProperties(FactoryProperties.class)
public class PropertiesConfig {
}
