package com.example.sdlcfactory.orchestrator;

import com.example.sdlcfactory.workspace.Workspace;
import com.example.sdlcfactory.workspace.WorkspaceService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;

@Service
public class PipelineService {

    private static final Logger log = LoggerFactory.getLogger(PipelineService.class);

    private final WorkspaceService workspaceService;
    private final StageRunner stageRunner;

    public PipelineService(WorkspaceService workspaceService, StageRunner stageRunner) {
        this.workspaceService = workspaceService;
        this.stageRunner = stageRunner;
    }

    @Async
    public void run(TaskState task) {
        try {
            task.setStatus(TaskState.Status.RUNNING);
            Workspace ws = workspaceService.forTask(task.id(), task.description());

            for (Stage stage : Stage.values()) {
                task.setCurrentStage(stage);
                log.info("task {} entering stage {}", task.id(), stage.id());
                StageResult result = stageRunner.run(ws, stage, task.description());
                task.addStageResult(result);

                if (result.verdict() != Verdict.PASS) {
                    log.warn("task {} stage {} verdict {}", task.id(), stage.id(), result.verdict());
                    task.setStatus(result.verdict() == Verdict.ESCALATE
                            ? TaskState.Status.ESCALATED
                            : TaskState.Status.FAILED);
                    return;
                }
            }
            task.setCurrentStage(null);
            task.setStatus(TaskState.Status.PASSED);
        } catch (Exception e) {
            log.error("task {} crashed", task.id(), e);
            task.setError(e.getClass().getSimpleName() + ": " + e.getMessage());
            task.setStatus(TaskState.Status.FAILED);
        }
    }
}
