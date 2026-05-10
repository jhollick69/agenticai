package com.example.sdlcfactory.orchestrator;

import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.assertEquals;

class VerdictTest {

    @Test
    void parses_pass_on_own_line() {
        assertEquals(Verdict.PASS, Verdict.parse("Findings...\nVERDICT: PASS"));
    }

    @Test
    void parses_fail_on_own_line() {
        assertEquals(Verdict.FAIL, Verdict.parse("Findings...\nVERDICT: FAIL"));
    }

    @Test
    void takes_last_verdict_when_multiple() {
        assertEquals(Verdict.PASS, Verdict.parse("VERDICT: FAIL\n... fixed ...\nVERDICT: PASS"));
    }

    @Test
    void no_verdict_defaults_to_fail() {
        assertEquals(Verdict.FAIL, Verdict.parse("looks good"));
    }

    @Test
    void null_input_is_fail() {
        assertEquals(Verdict.FAIL, Verdict.parse(null));
    }

    @Test
    void case_insensitive() {
        assertEquals(Verdict.PASS, Verdict.parse("verdict: pass"));
    }
}
