package com.example.sdlcfactory.checks;

import com.example.sdlcfactory.orchestrator.Stage;
import org.springframework.stereotype.Component;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.ArrayList;
import java.util.List;
import java.util.regex.Pattern;
import java.util.stream.Stream;

/**
 * Deterministic pre/post validators per stage. The agent loop is sandwiched between
 * a pre-check (does the input we expect exist?) and a post-check (did the agent produce
 * an artifact that meets structural rules?). The critic agent makes the *semantic* call;
 * these checks make the *structural* call.
 */
@Component
public class Checks {

    private static final Pattern FRONT_MATTER = Pattern.compile("(?s)^---\\s*\\n(.*?)\\n---\\s*\\n");
    private static final Pattern HEADING_2 = Pattern.compile("(?m)^##\\s+(.+?)\\s*$");
    private static final Pattern AC_BULLET = Pattern.compile("(?m)^\\s*[-*]\\s+(.+)$");
    private static final Pattern SHALL = Pattern.compile("(?i)\\bshall\\b");
    private static final Pattern ASM = Pattern.compile("\\[ASM-\\d+\\]");

    public CheckResult pre(Stage stage, Path artifact, Path workspaceRoot) {
        // Pre-checks verify upstream inputs (read-only, structural).
        return switch (stage) {
            case REQUIREMENTS -> exists(workspaceRoot.resolve("features/issue.md"), "issue.md");
            case DESIGN       -> exists(workspaceRoot.resolve("features/requirement.md"), "requirement.md");
            case TASKS        -> exists(workspaceRoot.resolve("features/design.md"), "design.md");
            case CODING       -> exists(workspaceRoot.resolve("features/tasks"), "tasks/");
            case REVIEW       -> exists(workspaceRoot.resolve("workdir"), "workdir/");
        };
    }

    public CheckResult post(Stage stage, Path artifact) {
        return switch (stage) {
            case REQUIREMENTS -> postRequirements(artifact);
            case DESIGN       -> postDesign(artifact);
            case TASKS        -> postTasks(artifact);
            case CODING       -> postCoding(artifact);
            case REVIEW       -> postReview(artifact);
        };
    }

    private CheckResult exists(Path p, String label) {
        return Files.exists(p) ? CheckResult.pass() : CheckResult.fail("missing: " + label);
    }

    private CheckResult postRequirements(Path file) {
        List<String> errs = new ArrayList<>();
        String body = readOrEmpty(file, errs);
        if (body.length() < 300) errs.add("requirement.md < 300 chars (" + body.length() + ")");
        requireFrontmatter(body, errs, "id", "title", "status");
        var headings = headings(body);
        for (String h : List.of("Problem Statement", "User Stories", "Acceptance Criteria", "Scope Boundaries")) {
            if (!headings.contains(h)) errs.add("missing section: " + h);
        }
        if (!body.contains("### In Scope")) errs.add("missing subsection: ### In Scope");
        if (!body.contains("### Out of Scope")) errs.add("missing subsection: ### Out of Scope");

        // Every bullet under "## Acceptance Criteria" contains "shall".
        String ac = sectionBody(body, "Acceptance Criteria");
        if (ac != null) {
            var matcher = AC_BULLET.matcher(ac);
            int found = 0, ok = 0;
            while (matcher.find()) {
                found++;
                if (SHALL.matcher(matcher.group(1)).find()) ok++;
            }
            if (found == 0) errs.add("Acceptance Criteria has 0 bullets");
            else if (ok < found) errs.add((found - ok) + "/" + found + " AC bullets missing 'shall'");
        }
        return CheckResult.fail(errs);
    }

    private CheckResult postDesign(Path file) {
        List<String> errs = new ArrayList<>();
        String body = readOrEmpty(file, errs);
        if (body.length() < 500) errs.add("design.md < 500 chars (" + body.length() + ")");
        requireFrontmatter(body, errs, "id", "parent", "status");
        var headings = headings(body);
        for (String h : List.of("Overview", "Design Decisions", "Files to Create or Modify", "Integration Contract")) {
            if (!headings.contains(h)) errs.add("missing section: " + h);
        }
        if (!hasTableRow(body, "Design Decisions")) errs.add("Design Decisions table has no data rows");
        if (!hasTableRow(body, "Files to Create or Modify")) errs.add("Files table has no data rows");
        return CheckResult.fail(errs);
    }

    private CheckResult postTasks(Path dir) {
        List<String> errs = new ArrayList<>();
        if (!Files.isDirectory(dir)) {
            errs.add("tasks/ is not a directory");
            return CheckResult.fail(errs);
        }
        List<Path> taskFiles;
        try (Stream<Path> s = Files.list(dir)) {
            taskFiles = s.filter(p -> p.getFileName().toString().matches("TASK-\\d+\\.md")).toList();
        } catch (IOException e) {
            return CheckResult.fail("io: " + e.getMessage());
        }
        if (taskFiles.isEmpty()) errs.add("no TASK-NNN.md files");

        // frontmatter id/parent/depends_on; collect ids for cycle detection.
        java.util.Map<String, List<String>> deps = new java.util.LinkedHashMap<>();
        for (Path f : taskFiles) {
            String body = readOrEmpty(f, errs);
            requireFrontmatter(body, errs, "id", "parent", "depends_on");
            String id = frontmatterValue(body, "id");
            if (id != null) {
                deps.put(id, parseList(frontmatterValue(body, "depends_on")));
            }
        }
        // Cycle detection.
        for (String id : deps.keySet()) {
            if (hasCycle(id, deps, new java.util.HashSet<>(), new java.util.HashSet<>())) {
                errs.add("cycle in depends_on involving " + id);
                break;
            }
        }
        return CheckResult.fail(errs);
    }

    private CheckResult postCoding(Path workdir) {
        List<String> errs = new ArrayList<>();
        if (!Files.isDirectory(workdir)) {
            errs.add("workdir/ is not a directory");
            return CheckResult.fail(errs);
        }
        long count;
        try (Stream<Path> s = Files.walk(workdir)) {
            count = s.filter(Files::isRegularFile).count();
        } catch (IOException e) {
            return CheckResult.fail("io: " + e.getMessage());
        }
        if (count == 0) errs.add("workdir/ is empty — agent produced no files");
        return CheckResult.fail(errs);
    }

    private CheckResult postReview(Path file) {
        List<String> errs = new ArrayList<>();
        String body = readOrEmpty(file, errs);
        if (body.length() < 200) errs.add("review.md < 200 chars (" + body.length() + ")");
        requireFrontmatter(body, errs, "id", "parent", "status");
        if (!body.contains("## Recommendation")) errs.add("missing section: Recommendation");
        boolean approve = body.contains("\nAPPROVE\n") || body.endsWith("\nAPPROVE");
        boolean reject = body.contains("\nREQUEST_CHANGES\n") || body.endsWith("\nREQUEST_CHANGES");
        if (!(approve ^ reject)) errs.add("Recommendation must be exactly APPROVE or REQUEST_CHANGES");
        return CheckResult.fail(errs);
    }

    // ---------- helpers ----------

    private String readOrEmpty(Path file, List<String> errs) {
        if (!Files.exists(file)) {
            errs.add("missing: " + file.getFileName());
            return "";
        }
        try { return Files.readString(file); }
        catch (IOException e) { errs.add("io: " + e.getMessage()); return ""; }
    }

    private void requireFrontmatter(String body, List<String> errs, String... keys) {
        var m = FRONT_MATTER.matcher(body);
        if (!m.find()) {
            errs.add("missing YAML frontmatter");
            return;
        }
        String fm = m.group(1);
        for (String k : keys) {
            if (!fm.matches("(?s).*(^|\\n)\\s*" + Pattern.quote(k) + "\\s*:.*")) {
                errs.add("frontmatter missing key: " + k);
            }
        }
    }

    private String frontmatterValue(String body, String key) {
        var m = FRONT_MATTER.matcher(body);
        if (!m.find()) return null;
        for (String line : m.group(1).split("\\n")) {
            int idx = line.indexOf(':');
            if (idx > 0 && line.substring(0, idx).trim().equals(key)) {
                return line.substring(idx + 1).trim();
            }
        }
        return null;
    }

    private List<String> parseList(String raw) {
        if (raw == null) return List.of();
        raw = raw.trim();
        if (raw.startsWith("[") && raw.endsWith("]")) {
            raw = raw.substring(1, raw.length() - 1);
        }
        if (raw.isBlank()) return List.of();
        return java.util.Arrays.stream(raw.split(","))
                .map(String::trim)
                .filter(s -> !s.isEmpty())
                .map(s -> s.replaceAll("^[\"']|[\"']$", ""))
                .toList();
    }

    private boolean hasCycle(String id, java.util.Map<String, List<String>> deps,
                             java.util.Set<String> stack, java.util.Set<String> visited) {
        if (stack.contains(id)) return true;
        if (visited.contains(id)) return false;
        stack.add(id);
        for (String d : deps.getOrDefault(id, List.of())) {
            if (hasCycle(d, deps, stack, visited)) return true;
        }
        stack.remove(id);
        visited.add(id);
        return false;
    }

    private List<String> headings(String body) {
        var out = new ArrayList<String>();
        var m = HEADING_2.matcher(body);
        while (m.find()) out.add(m.group(1).trim());
        return out;
    }

    private String sectionBody(String body, String heading) {
        Pattern start = Pattern.compile("(?m)^##\\s+" + Pattern.quote(heading) + "\\s*$");
        var ms = start.matcher(body);
        if (!ms.find()) return null;
        int from = ms.end();
        Pattern next = Pattern.compile("(?m)^##\\s+\\S");
        var mn = next.matcher(body);
        return mn.find(from) ? body.substring(from, mn.start()) : body.substring(from);
    }

    private boolean hasTableRow(String body, String heading) {
        String section = sectionBody(body, heading);
        if (section == null) return false;
        // A markdown table data row: starts with '|', not the header or separator.
        boolean sawHeader = false;
        for (String line : section.split("\\n")) {
            String t = line.trim();
            if (!t.startsWith("|")) continue;
            if (t.matches("^\\|[\\s:|-]+\\|?$")) { sawHeader = true; continue; }
            if (sawHeader) return true;
            sawHeader = true; // first | line is the header
        }
        return false;
    }
}
