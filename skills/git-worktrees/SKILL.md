---
name: git-worktrees
description: Use when starting work on a new feature branch that benefits from an isolated working directory.
---

# Git Worktrees

Use git worktrees for isolated feature development. Each feature gets its own working directory.

## Why Worktrees?

- **No stash juggling** — each feature has its own directory with its own state
- **Parallel work** — switch between features by switching directories, not branches
- **Clean experiments** — discard a worktree without affecting anything else

## Process

### 1. Choose Worktree Location

Priority order:
1. `.worktrees/` directory (if exists or can be created)
2. `../worktrees/` sibling directory
3. Ask the user

**Important**: Ensure the worktree directory is in `.gitignore`.

### 2. Create the Worktree

```bash
# Create a new branch and worktree
git worktree add .worktrees/<feature-name> -b feature/<feature-name>

# Or use an existing branch
git worktree add .worktrees/<feature-name> feature/<feature-name>
```

### 3. Set Up the Worktree

Auto-detect and run project setup:

```bash
# Node.js
[ -f package.json ] && npm install

# Rust
[ -f Cargo.toml ] && cargo build

# Python
[ -f requirements.txt ] && pip install -r requirements.txt

# Go
[ -f go.mod ] && go mod download
```

### 4. Work in the Worktree

```bash
cd .worktrees/<feature-name>
# Work normally — commits go to the feature branch
```

### 5. Clean Up

```bash
# When done with the feature
git worktree remove .worktrees/<feature-name>
```

## When to Use vs. Not Use

| Situation | Use Worktrees? |
|-----------|---------------|
| New feature with its own branch | Yes |
| Quick one-file fix | No — just branch normally |
| Parallel features in progress | Yes — one worktree per feature |
| Exploratory prototype | Yes — easy to discard |

## Integration

- Works with `subagent-driven-development` — each subagent can work in its own worktree
- Feeds into `finishing-a-development-branch` concepts — clean up worktree when merging
