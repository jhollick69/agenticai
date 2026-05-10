package com.example.sdlcfactory.orchestrator;

import java.time.Instant;
import java.util.List;

public record StageResult(
        Stage stage,
        Verdict verdict,
        int iterations,
        List<String> preCheckFailures,
        List<String> postCheckFailures,
        String lastReviewerVerbatim,
        Instant startedAt,
        Instant finishedAt
) {}
