package com.example.sdlcfactory.api;

import com.example.sdlcfactory.api.dto.CreateTaskRequest;
import com.example.sdlcfactory.api.dto.TaskView;
import com.example.sdlcfactory.orchestrator.PipelineService;
import com.example.sdlcfactory.orchestrator.TaskRegistry;
import com.example.sdlcfactory.orchestrator.TaskState;
import com.example.sdlcfactory.workspace.WorkspaceService;
import jakarta.validation.Valid;
import org.springframework.core.io.PathResource;
import org.springframework.core.io.Resource;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.net.URI;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.List;

@RestController
@RequestMapping("/tasks")
public class TaskController {

    private final TaskRegistry registry;
    private final PipelineService pipeline;
    private final WorkspaceService workspaces;

    public TaskController(TaskRegistry registry, PipelineService pipeline, WorkspaceService workspaces) {
        this.registry = registry;
        this.pipeline = pipeline;
        this.workspaces = workspaces;
    }

    @PostMapping
    public ResponseEntity<TaskView> create(@Valid @RequestBody CreateTaskRequest req) {
        TaskState state = registry.create(req.description());
        pipeline.run(state);
        return ResponseEntity.created(URI.create("/tasks/" + state.id())).body(TaskView.from(state));
    }

    @GetMapping
    public List<TaskView> list() {
        return registry.all().stream().map(TaskView::from).toList();
    }

    @GetMapping("/{id}")
    public ResponseEntity<TaskView> get(@PathVariable String id) {
        return registry.get(id)
                .map(t -> ResponseEntity.ok(TaskView.from(t)))
                .orElse(ResponseEntity.notFound().build());
    }

    @GetMapping(value = "/{id}/artifacts/{*relPath}")
    public ResponseEntity<Resource> artifact(@PathVariable String id, @PathVariable String relPath) {
        if (registry.get(id).isEmpty()) return ResponseEntity.notFound().build();
        Path root = workspaces.root().resolve(id).toAbsolutePath().normalize();
        // Strip the leading slash that {*relPath} captures.
        String clean = relPath.startsWith("/") ? relPath.substring(1) : relPath;
        Path file = root.resolve(clean).toAbsolutePath().normalize();
        if (!file.startsWith(root) || !Files.exists(file) || Files.isDirectory(file)) {
            return ResponseEntity.notFound().build();
        }
        return ResponseEntity.ok()
                .contentType(MediaType.TEXT_PLAIN)
                .body(new PathResource(file));
    }
}
