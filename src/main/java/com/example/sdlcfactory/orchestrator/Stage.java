package com.example.sdlcfactory.orchestrator;

public enum Stage {
    REQUIREMENTS("requirements", "requirement.md", false),
    DESIGN("design", "design.md", false),
    TASKS("tasks", "tasks/", false),
    CODING("coding", "workdir/", true),
    REVIEW("review", "review.md", false);

    private final String id;
    private final String artifact;
    private final boolean coding;

    Stage(String id, String artifact, boolean coding) {
        this.id = id;
        this.artifact = artifact;
        this.coding = coding;
    }

    public String id() { return id; }
    public String artifact() { return artifact; }
    public boolean isCoding() { return coding; }
    public boolean isDirectoryArtifact() { return artifact.endsWith("/"); }

    public String executorSkill() { return id + "-executor.md"; }
    public String criticSkill() { return id + "-critic.md"; }
}
