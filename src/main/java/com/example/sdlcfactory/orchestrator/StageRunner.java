package com.example.sdlcfactory.orchestrator;

import com.example.sdlcfactory.agent.AgentClient;
import com.example.sdlcfactory.agent.Tools;
import com.example.sdlcfactory.checks.CheckResult;
import com.example.sdlcfactory.checks.Checks;
import com.example.sdlcfactory.config.FactoryProperties;
import com.example.sdlcfactory.skills.SkillRegistry;
import com.example.sdlcfactory.workspace.Workspace;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Component;

import java.nio.file.Path;
import java.time.Instant;
import java.util.ArrayList;
import java.util.List;

/**
 * The executor↔critic loop for a single stage. Pre-check → (executor → critic)* → post-check.
 *
 * Returns ESCALATE if iterations exhaust without a PASS verdict, FAIL if pre-check fails or
 * post-check fails after a PASS verdict (structural disagreement with critic), PASS otherwise.
 */
@Component
public class StageRunner {

    private static final Logger log = LoggerFactory.getLogger(StageRunner.class);

    private final AgentClient agent;
    private final SkillRegistry skills;
    private final Checks checks;
    private final FactoryProperties props;

    public StageRunner(AgentClient agent, SkillRegistry skills, Checks checks, FactoryProperties props) {
        this.agent = agent;
        this.skills = skills;
        this.checks = checks;
        this.props = props;
    }

    public StageResult run(Workspace ws, Stage stage, String taskDescription) {
        Instant start = Instant.now();
        Path artifact = ws.artifactPathFor(stage);

        // 1. Pre-check
        CheckResult pre = checks.pre(stage, artifact, ws.root());
        if (!pre.passed()) {
            log.warn("[{}] pre-check failed: {}", stage.id(), pre.failures());
            return new StageResult(stage, Verdict.FAIL, 0, pre.failures(), List.of(), null, start, Instant.now());
        }

        // 2. Iterative executor↔critic
        int maxIter = stage.isCoding() ? props.maxIterations().coding() : props.maxIterations().defaultValue();
        int maxToolTurns = stage.isCoding() ? props.maxToolTurns().coding() : props.maxToolTurns().defaultValue();

        String executorSystem = skills.executor(stage);
        String criticSystem = skills.critic(stage);

        String reviewerFeedback = null;
        Verdict verdict = Verdict.FAIL;
        String lastReviewerVerbatim = null;
        int iter = 0;

        // Tools sandbox to the workspace root so the agent can read/write any artifact.
        Tools rwTools = new Tools(ws.root(), Tools.Mode.READ_WRITE);
        Tools roTools = new Tools(ws.root(), Tools.Mode.READ_ONLY);

        while (iter < maxIter) {
            iter++;
            String userPrompt = buildExecutorPrompt(ws, stage, taskDescription, reviewerFeedback, iter);
            log.info("[{}] iteration {} executor", stage.id(), iter);
            agent.run(executorSystem, userPrompt, rwTools, maxToolTurns);

            // Confirm artifact exists in some form before invoking critic.
            CheckResult exists = artifactExistsCheck(stage, artifact);
            if (!exists.passed()) {
                reviewerFeedback = "Executor produced no artifact at " + artifact + ". " +
                        "Use the write_file tool to create it. The pipeline only inspects files on disk.";
                continue;
            }

            String criticPrompt = buildCriticPrompt(ws, stage, taskDescription, reviewerFeedback);
            log.info("[{}] iteration {} critic", stage.id(), iter);
            AgentClient.Result criticOut = agent.run(criticSystem, criticPrompt, roTools,
                    Math.min(maxToolTurns, 30));
            lastReviewerVerbatim = criticOut.text();
            verdict = Verdict.parse(criticOut.text());

            if (verdict == Verdict.PASS) break;
            reviewerFeedback = criticOut.text();
        }

        if (verdict != Verdict.PASS) {
            verdict = Verdict.ESCALATE;
        }

        // 3. Post-check (structural). Only run if critic said PASS — if it didn't, we're already done.
        List<String> postFailures = new ArrayList<>();
        if (verdict == Verdict.PASS) {
            CheckResult post = checks.post(stage, artifact);
            if (!post.passed()) {
                log.warn("[{}] post-check failed despite critic PASS: {}", stage.id(), post.failures());
                verdict = Verdict.FAIL;
                postFailures = post.failures();
            }
        }

        return new StageResult(stage, verdict, iter, List.of(), postFailures,
                lastReviewerVerbatim, start, Instant.now());
    }

    private CheckResult artifactExistsCheck(Stage stage, Path artifact) {
        if (stage.isDirectoryArtifact()) {
            return java.nio.file.Files.isDirectory(artifact)
                    ? CheckResult.pass() : CheckResult.fail("dir missing");
        }
        return java.nio.file.Files.isRegularFile(artifact)
                ? CheckResult.pass() : CheckResult.fail("file missing");
    }

    private String buildExecutorPrompt(Workspace ws, Stage stage, String taskDescription,
                                       String feedback, int iter) {
        StringBuilder sb = new StringBuilder();
        sb.append("# Task\n").append(taskDescription).append("\n\n");
        sb.append("# Workspace root\n`").append(ws.root().toAbsolutePath()).append("`\n");
        sb.append("All tool paths are relative to this root.\n\n");
        sb.append("# Inputs you may read\n");
        sb.append(switch (stage) {
            case REQUIREMENTS -> "- features/issue.md  (the task description, also above)\n";
            case DESIGN       -> "- features/issue.md\n- features/requirement.md\n";
            case TASKS        -> "- features/requirement.md\n- features/design.md\n";
            case CODING       -> "- features/requirement.md\n- features/design.md\n- features/tasks/TASK-*.md\n- workdir/  (existing code, may be empty)\n";
            case REVIEW       -> "- features/requirement.md\n- features/design.md\n- features/tasks/\n- workdir/\n";
        });
        sb.append("\n# Output you must produce\n");
        sb.append("- ").append(switch (stage) {
            case REQUIREMENTS -> "features/requirement.md";
            case DESIGN       -> "features/design.md";
            case TASKS        -> "features/tasks/TASK-001.md, TASK-002.md, ... (one file per task)";
            case CODING       -> "files inside workdir/ that satisfy the tasks";
            case REVIEW       -> "features/review.md";
        }).append("\n\n");

        if (feedback != null && !feedback.isBlank()) {
            sb.append("# Previous reviewer feedback (iteration ").append(iter - 1).append(")\n");
            sb.append("Make targeted fixes only. Do not rewrite from scratch.\n\n");
            sb.append(feedback).append("\n");
        }
        return sb.toString();
    }

    private String buildCriticPrompt(Workspace ws, Stage stage, String taskDescription, String prevFeedback) {
        StringBuilder sb = new StringBuilder();
        sb.append("# Task being reviewed\n").append(taskDescription).append("\n\n");
        sb.append("# Workspace root\n`").append(ws.root().toAbsolutePath()).append("`\n\n");
        sb.append("# Artifact under review\n- ").append(switch (stage) {
            case REQUIREMENTS -> "features/requirement.md";
            case DESIGN       -> "features/design.md";
            case TASKS        -> "features/tasks/ (read every TASK-*.md)";
            case CODING       -> "workdir/ (recursively)";
            case REVIEW       -> "features/review.md";
        }).append("\n\n");
        if (prevFeedback != null && !prevFeedback.isBlank()) {
            sb.append("# Previous review (progressive context)\n");
            sb.append("Focus on whether the prior issues were fixed. Do NOT raise new minor issues.\n\n");
            sb.append(prevFeedback).append("\n\n");
        }
        sb.append("Use read_file and list_files to inspect. End with a final line:\n");
        sb.append("`VERDICT: PASS` or `VERDICT: FAIL`.\n");
        return sb.toString();
    }
}
