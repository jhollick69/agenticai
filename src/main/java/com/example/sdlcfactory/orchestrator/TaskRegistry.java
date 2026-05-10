package com.example.sdlcfactory.orchestrator;

import org.springframework.stereotype.Component;

import java.util.Collection;
import java.util.Optional;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.ConcurrentMap;

@Component
public class TaskRegistry {
    private final ConcurrentMap<String, TaskState> tasks = new ConcurrentHashMap<>();

    public TaskState create(String description) {
        TaskState t = new TaskState(description);
        tasks.put(t.id(), t);
        return t;
    }

    public Optional<TaskState> get(String id) {
        return Optional.ofNullable(tasks.get(id));
    }

    public Collection<TaskState> all() {
        return tasks.values();
    }
}
