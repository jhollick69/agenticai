package com.example.sdlcfactory.orchestrator;

import java.time.Instant;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;
import java.util.concurrent.CopyOnWriteArrayList;

public class TaskState {

    public enum Status { PENDING, RUNNING, PASSED, FAILED, ESCALATED }

    private final String id = UUID.randomUUID().toString();
    private final String description;
    private final Instant createdAt = Instant.now();
    private volatile Status status = Status.PENDING;
    private volatile Stage currentStage;
    private volatile String error;
    private final List<StageResult> stageResults = new CopyOnWriteArrayList<>();

    public TaskState(String description) {
        this.description = description;
    }

    public String id() { return id; }
    public String description() { return description; }
    public Instant createdAt() { return createdAt; }
    public Status status() { return status; }
    public Stage currentStage() { return currentStage; }
    public String error() { return error; }
    public List<StageResult> stageResults() { return new ArrayList<>(stageResults); }

    public void setStatus(Status s) { this.status = s; }
    public void setCurrentStage(Stage s) { this.currentStage = s; }
    public void setError(String e) { this.error = e; }
    public void addStageResult(StageResult r) { this.stageResults.add(r); }
}
