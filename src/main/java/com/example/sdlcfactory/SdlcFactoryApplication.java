package com.example.sdlcfactory;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.scheduling.annotation.EnableAsync;

@SpringBootApplication
@EnableAsync
public class SdlcFactoryApplication {
    public static void main(String[] args) {
        SpringApplication.run(SdlcFactoryApplication.class, args);
    }
}
