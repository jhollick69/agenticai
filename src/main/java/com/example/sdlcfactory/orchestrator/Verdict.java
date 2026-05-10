package com.example.sdlcfactory.orchestrator;

import java.util.regex.Matcher;
import java.util.regex.Pattern;

public enum Verdict {
    PASS, FAIL, ESCALATE;

    private static final Pattern VERDICT_LINE =
            Pattern.compile("(?im)^\\s*VERDICT:\\s*(PASS|FAIL)\\s*$");

    public static Verdict parse(String reviewerOutput) {
        if (reviewerOutput == null) return FAIL;
        Matcher m = VERDICT_LINE.matcher(reviewerOutput);
        Verdict last = FAIL;
        while (m.find()) {
            last = "PASS".equalsIgnoreCase(m.group(1)) ? PASS : FAIL;
        }
        return last;
    }
}
