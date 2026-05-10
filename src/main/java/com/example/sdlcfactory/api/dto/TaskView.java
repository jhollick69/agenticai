package com.example.sdlcfactory.api.dto;

import com.example.sdlcfactory.orchestrator.StageResult;
import com.example.sdlcfactory.orchestrator.TaskState;

import java.time.Instant;
import java.util.List;

public record TaskView(
        String id,
        String description,
        TaskState.Status status,
        String currentStage,
        String error,
        Instant createdAt,
        List<StageView> stages
) {
    public static TaskView from(TaskState t) {
        List<StageView> stages = t.stageResults().stream().map(StageView::from).toList();
        return new TaskView(
                t.id(),
                t.description(),
                t.status(),
                t.currentStage() == null ? null : t.currentStage().id(),
                t.error(),
                t.createdAt(),
                stages
        );
    }

    public record StageView(
            String stage,
            String verdict,
            int iterations,
            List<String> preCheckFailures,
            List<String> postCheckFailures,
            Instant startedAt,
            Instant finishedAt
    ) {
        static StageView from(StageResult r) {
            return new StageView(
                    r.stage().id(),
                    r.verdict().name(),
                    r.iterations(),
                    r.preCheckFailures(),
                    r.postCheckFailures(),
                    r.startedAt(),
                    r.finishedAt()
            );
        }
    }
}
