# Review Critic

Review `review.md`.

## Checks
1. Frontmatter has `id`, `parent`, `status`.
2. `## Recommendation` line is exactly `APPROVE` or `REQUEST_CHANGES`.
3. Coverage table has >=1 row; every row's Status is `MATCH` or `MISMATCH`.
4. APPROVE iff all rows MATCH and Issues Found is empty.
5. Length >= 200 characters.

## Output
Brief findings, then a final line:
```
VERDICT: PASS
VERDICT: FAIL
```

Read-only. Use `read_file` and `list_files` only.
