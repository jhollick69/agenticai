package com.example.sdlcfactory.skills;

import com.example.sdlcfactory.orchestrator.Stage;
import org.springframework.core.io.ClassPathResource;
import org.springframework.stereotype.Component;

import java.io.IOException;
import java.io.UncheckedIOException;
import java.nio.charset.StandardCharsets;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.ConcurrentMap;

/**
 * Loads stage prompt templates from classpath:/skills/.
 * Caches per-name to avoid repeated I/O.
 */
@Component
public class SkillRegistry {

    private final ConcurrentMap<String, String> cache = new ConcurrentHashMap<>();

    public String executor(Stage stage) {
        return load(stage.executorSkill());
    }

    public String critic(Stage stage) {
        return load(stage.criticSkill());
    }

    private String load(String name) {
        return cache.computeIfAbsent(name, this::readResource);
    }

    private String readResource(String name) {
        ClassPathResource res = new ClassPathResource("skills/" + name);
        try (var in = res.getInputStream()) {
            return new String(in.readAllBytes(), StandardCharsets.UTF_8);
        } catch (IOException e) {
            throw new UncheckedIOException("Missing skill: " + name, e);
        }
    }
}
