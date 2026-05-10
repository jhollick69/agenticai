package com.example.sdlcfactory.checks;

import java.util.List;

public record CheckResult(boolean passed, List<String> failures) {
    public static CheckResult pass() { return new CheckResult(true, List.of()); }
    public static CheckResult fail(String... msgs) { return new CheckResult(false, List.of(msgs)); }
    public static CheckResult fail(List<String> msgs) {
        return new CheckResult(msgs.isEmpty(), msgs);
    }
}
