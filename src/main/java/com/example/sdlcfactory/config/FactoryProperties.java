package com.example.sdlcfactory.config;

import org.springframework.boot.context.properties.ConfigurationProperties;

@ConfigurationProperties(prefix = "factory")
public record FactoryProperties(
        String workspaceRoot,
        String model,
        int maxTokens,
        MaxIterations maxIterations,
        MaxToolTurns maxToolTurns
) {
    public record MaxIterations(int defaultValue, int coding) {
        public MaxIterations {
            if (defaultValue <= 0) defaultValue = 3;
            if (coding <= 0) coding = 5;
        }
    }

    public record MaxToolTurns(int defaultValue, int coding) {
        public MaxToolTurns {
            if (defaultValue <= 0) defaultValue = 30;
            if (coding <= 0) coding = 200;
        }
    }
}
