package com.example.sdlcfactory.agent;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.ObjectNode;

import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.nio.file.*;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.stream.Stream;

/**
 * Filesystem tools the agent can invoke. All paths are resolved relative to {@link #root}
 * and rejected if they escape it.
 */
public class Tools {

    private static final ObjectMapper M = new ObjectMapper();

    public enum Mode { READ_ONLY, READ_WRITE }

    private final Path root;
    private final Mode mode;

    public Tools(Path root, Mode mode) {
        this.root = root.toAbsolutePath().normalize();
        this.mode = mode;
    }

    public Mode mode() { return mode; }

    /** Tool schemas in Anthropic API format. */
    public List<Map<String, Object>> schemas() {
        List<Map<String, Object>> tools = new ArrayList<>();
        tools.add(Map.of(
                "name", "read_file",
                "description", "Read a UTF-8 text file relative to the workspace root.",
                "input_schema", Map.of(
                        "type", "object",
                        "properties", Map.of(
                                "path", Map.of("type", "string", "description", "Relative path.")
                        ),
                        "required", List.of("path")
                )
        ));
        tools.add(Map.of(
                "name", "list_files",
                "description", "List files (recursively) under a directory relative to root.",
                "input_schema", Map.of(
                        "type", "object",
                        "properties", Map.of(
                                "path", Map.of("type", "string", "description", "Relative dir path; use '.' for root."),
                                "max", Map.of("type", "integer", "description", "Max entries to return (default 200).")
                        ),
                        "required", List.of("path")
                )
        ));
        if (mode == Mode.READ_WRITE) {
            tools.add(Map.of(
                    "name", "write_file",
                    "description", "Create or overwrite a UTF-8 text file. Parent dirs created automatically.",
                    "input_schema", Map.of(
                            "type", "object",
                            "properties", Map.of(
                                    "path", Map.of("type", "string"),
                                    "content", Map.of("type", "string")
                            ),
                            "required", List.of("path", "content")
                    )
            ));
            tools.add(Map.of(
                    "name", "delete_file",
                    "description", "Delete a file relative to root. No-op if missing.",
                    "input_schema", Map.of(
                            "type", "object",
                            "properties", Map.of(
                                    "path", Map.of("type", "string")
                            ),
                            "required", List.of("path")
                    )
            ));
        }
        return tools;
    }

    /** Execute a tool call by name. Returns a JSON-string result. */
    public String invoke(String name, JsonNode input) {
        try {
            return switch (name) {
                case "read_file"  -> readFile(input.path("path").asText(""));
                case "list_files" -> listFiles(input.path("path").asText("."),
                                              input.path("max").asInt(200));
                case "write_file" -> {
                    requireWrite();
                    yield writeFile(input.path("path").asText(""), input.path("content").asText(""));
                }
                case "delete_file" -> {
                    requireWrite();
                    yield deleteFile(input.path("path").asText(""));
                }
                default -> error("unknown tool: " + name);
            };
        } catch (Exception e) {
            return error(e.getClass().getSimpleName() + ": " + e.getMessage());
        }
    }

    private void requireWrite() {
        if (mode != Mode.READ_WRITE) throw new IllegalStateException("read-only context");
    }

    private Path safeResolve(String rel) {
        if (rel == null || rel.isBlank()) throw new IllegalArgumentException("empty path");
        Path p = root.resolve(rel).toAbsolutePath().normalize();
        if (!p.startsWith(root)) {
            throw new SecurityException("path escapes workspace root: " + rel);
        }
        return p;
    }

    private String readFile(String rel) throws IOException {
        Path p = safeResolve(rel);
        if (!Files.exists(p)) return error("not found: " + rel);
        if (Files.isDirectory(p)) return error("is a directory: " + rel);
        long size = Files.size(p);
        if (size > 512 * 1024) return error("file too large (" + size + " bytes): " + rel);
        String content = Files.readString(p, StandardCharsets.UTF_8);
        ObjectNode out = M.createObjectNode();
        out.put("path", rel);
        out.put("content", content);
        return out.toString();
    }

    private String listFiles(String rel, int max) throws IOException {
        Path p = safeResolve(rel);
        if (!Files.exists(p)) return error("not found: " + rel);
        ObjectNode out = M.createObjectNode();
        out.put("path", rel);
        var arr = out.putArray("entries");
        if (Files.isRegularFile(p)) {
            arr.add(root.relativize(p).toString());
            return out.toString();
        }
        try (Stream<Path> s = Files.walk(p)) {
            s.filter(Files::isRegularFile)
             .limit(Math.max(1, max))
             .forEach(f -> arr.add(root.relativize(f).toString()));
        }
        return out.toString();
    }

    private String writeFile(String rel, String content) throws IOException {
        Path p = safeResolve(rel);
        Files.createDirectories(p.getParent() != null ? p.getParent() : root);
        Files.writeString(p, content, StandardCharsets.UTF_8,
                StandardOpenOption.CREATE,
                StandardOpenOption.TRUNCATE_EXISTING);
        ObjectNode out = M.createObjectNode();
        out.put("path", rel);
        out.put("bytes", content.getBytes(StandardCharsets.UTF_8).length);
        out.put("ok", true);
        return out.toString();
    }

    private String deleteFile(String rel) throws IOException {
        Path p = safeResolve(rel);
        boolean existed = Files.deleteIfExists(p);
        ObjectNode out = M.createObjectNode();
        out.put("path", rel);
        out.put("deleted", existed);
        return out.toString();
    }

    private static String error(String msg) {
        ObjectNode out = M.createObjectNode();
        out.put("error", msg);
        return out.toString();
    }
}
