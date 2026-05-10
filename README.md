# SDLC Factory (Spring Boot)

An artifact-driven, executor↔critic coding pipeline as a Spring Boot REST API.

It is a stripped-down, language-agnostic port of the GitLab/Jira/Bedrock SDLC
factory spec: same gating philosophy, fewer moving parts.

## Pipeline

For every task:

```
PRE-CHECK → (executor → critic)*  → POST-CHECK
```

Stages run in order:

| Stage         | Input                          | Output                             |
|---------------|--------------------------------|------------------------------------|
| requirements  | the task description           | `features/requirement.md`          |
| design        | requirement.md                 | `features/design.md`               |
| tasks         | design.md                      | `features/tasks/TASK-NNN.md`       |
| coding        | tasks/                         | files inside `workdir/`            |
| review        | requirement, design, workdir   | `features/review.md`               |

Each stage:

1. **Pre-check** — deterministic Java validators confirm upstream inputs exist.
2. **Executor** — Anthropic Messages API call with `read_file`, `list_files`,
   `write_file`, `delete_file` tools sandboxed to the task workspace.
3. **Critic** — same loop but read-only tools. Must end with
   `VERDICT: PASS` or `VERDICT: FAIL`.
4. If FAIL and iterations remain, the critic's feedback is fed back to the
   executor as targeted-fix instructions.
5. **Post-check** — deterministic structural validators on the produced
   artifact (frontmatter, section headings, EARS `shall` for ACs, no cycles
   in task DAG, etc).

Iteration budgets: 3 for non-coding stages, 5 for coding (configurable).

## Run it

```bash
export ANTHROPIC_API_KEY=sk-ant-...
./mvnw spring-boot:run
```

Optional overrides (`application.yml` or env):

```yaml
factory:
  workspace-root: ./workspace      # FACTORY_WORKSPACE
  model: claude-sonnet-4-6         # ANTHROPIC_MODEL
  max-iterations: { default: 3, coding: 5 }
  max-tool-turns:  { default: 30, coding: 200 }
```

## API

```bash
# kick off a task (any language; the agent picks the stack)
curl -s -X POST http://localhost:8080/tasks \
  -H 'content-type: application/json' \
  -d '{"description":"Build a Rust CLI that converts CSV to JSON"}'
# → { "id": "...", "status": "PENDING", ... }

# poll status
curl -s http://localhost:8080/tasks/{id} | jq

# fetch any artifact
curl -s http://localhost:8080/tasks/{id}/artifacts/features/design.md
curl -s http://localhost:8080/tasks/{id}/artifacts/workdir/src/main.rs
```

The pipeline runs asynchronously on a virtual-thread executor; `POST /tasks`
returns immediately with `PENDING`.

Final task statuses:

- `PASSED` — all 5 stages produced PASS verdicts and post-checks passed
- `FAILED` — a structural pre/post check failed
- `ESCALATED` — a stage's critic never returned PASS within the iteration budget

## Workspace layout

```
workspace/<task-id>/
├── features/
│   ├── issue.md            # the task description, written on intake
│   ├── requirement.md
│   ├── design.md
│   ├── tasks/
│   │   ├── TASK-001.md
│   │   └── TASK-002.md
│   └── review.md
└── workdir/                # the generated code, language-agnostic
```

Tools are sandboxed to `workspace/<task-id>/`; the agent cannot write outside it.

## Layout

```
src/main/java/com/example/sdlcfactory/
├── api/                  # REST controller + DTOs
├── orchestrator/         # Stage, StageRunner, PipelineService, Verdict
├── agent/                # AgentClient (HTTP), Tools (sandboxed FS)
├── checks/               # deterministic pre/post validators
├── workspace/            # per-task workspace dirs
├── skills/               # SkillRegistry — loads prompts from classpath
└── config/               # FactoryProperties, AnthropicConfig, AsyncConfig

src/main/resources/skills/    # 10 prompt templates (executor + critic per stage)
```

## What was dropped from the original spec

This is intentionally minimal. The following pieces of the original SDLC
Factory are out of scope here:

- GitLab CI/CD orchestration, dynamic child pipelines, deployment.yml
- Multi-repo coordination, contract checks across services, coordinated MRs
- Jira / GitLab issue scanners, plan-gate / review-gate manual gates
- AWS Bedrock / IRSA — talks to Anthropic Messages API directly
- Container builds (`agent-pair`, `checks` images)
- CloudWatch EMF observability, secret redaction, knowledge-base updates
- Skill catalogue YAML / explore-vs-inject distinction — prompts are loaded
  flat from `resources/skills/`

Every retained piece keeps the spec's core property: deterministic gates
sandwich every agent call, and every critic ends with `VERDICT: PASS` or
`VERDICT: FAIL`.
