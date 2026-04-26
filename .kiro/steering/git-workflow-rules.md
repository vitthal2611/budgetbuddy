---
inclusion: manual
---

# Git Workflow & Version Control Rules

## Branch Strategy

### Main Branches
- `main` - Production-ready code, always deployable
- `develop` - Integration branch for features (optional)

### Feature Branches
Create feature branches from `main`:

```bash
# Create feature branch
git checkout -b feature/add-budget-templates

# Create bugfix branch
git checkout -b fix/transaction-date-validation

# Create hotfix branch
git checkout -b hotfix/security-patch
```

### Branch Naming Convention
- Features: `feature/description-in-kebab-case`
- Bug fixes: `fix/description-in-kebab-case`
- Hotfixes: `hotfix/description-in-kebab-case`
- Refactoring: `refactor/description-in-kebab-case`
- Documentation: `docs/description-in-kebab-case`

## Commit Message Rules

### Commit Message Format
```
<type>(<scope>): <subject>

<body>

<footer>
```

### Types
- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation changes
- `style`: Code style changes (formatting, no logic change)
- `refactor`: Code refactoring
- `perf`: Performance improvements
- `test`: Adding or updating tests
- `chore`: Build process, dependencies, tooling

### Examples
```bash
# Good commit messages
git commit -m "feat(transactions): add CSV import functionality"
git commit -m "fix(budget): correct envelope allocation calculation"
git commit -m "refactor(auth): simplify authentication flow"
git commit -m "docs(readme): update installation instructions"
git commit -m "perf(transactions): optimize transaction list rendering"

# Bad commit messages
git commit -m "fixed bug"
git commit -m "updates"
git commit -m "WIP"
git commit -m "asdfasdf"
```

### Commit Message Guidelines
- Use imperative mood: "add feature" not "added feature"
- Keep subject line under 50 characters
- Capitalize subject line
- No period at end of subject
- Separate subject from body with blank line
- Wrap body at 72 characters
- Explain what and why, not how

### Detailed Commit Example
```
feat(envelopes): add envelope borrowing feature

Allow users to borrow budget from one envelope to another when
overspending occurs. This helps maintain budget flexibility while
tracking where money is being reallocated.

- Add borrow modal component
- Update budget calculation logic
- Add borrow history tracking
- Update envelope UI to show borrowed amounts

Closes #123
```

## Commit Frequency

### Commit Often
- Commit logical units of work
- Don't wait until end of day
- Each commit should be a working state
- Easier to review and revert if needed

### When to Commit
✅ Commit when:
- Feature is complete and working
- Bug is fixed and tested
- Refactoring is done
- Tests are passing
- Code is reviewed (self-review)

❌ Don't commit:
- Broken code
- Commented-out code
- Debug console.logs
- Temporary files
- Sensitive data

## .gitignore Rules

### Required Entries
```gitignore
# Dependencies
node_modules/
package-lock.json  # If using yarn

# Environment variables
.env
.env.local
.env.development
.env.production
.env.test

# Build output
build/
dist/

# Firebase
.firebase/
firebase-debug.log
firestore-debug.log

# IDE
.vscode/
.idea/
*.swp
*.swo
.DS_Store

# Testing
coverage/

# Logs
npm-debug.log*
yarn-debug.log*
yarn-error.log*

# Temporary files
*.tmp
.cache/
```

## Pull Request Rules

### Before Creating PR
- [ ] Code is tested locally
- [ ] All tests pass
- [ ] No console errors
- [ ] Code is self-reviewed
- [ ] Commits are clean and logical
- [ ] Branch is up to date with main

### PR Title Format
Same as commit messages:
```
feat(transactions): add CSV import functionality
fix(budget): correct envelope allocation calculation
```

### PR Description Template
```markdown
## Description
Brief description of changes

## Type of Change
- [ ] Bug fix
- [ ] New feature
- [ ] Breaking change
- [ ] Documentation update

## Changes Made
- List specific changes
- Be detailed but concise

## Testing
- How was this tested?
- What scenarios were covered?

## Screenshots (if applicable)
Add screenshots for UI changes

## Checklist
- [ ] Code follows project style guidelines
- [ ] Self-review completed
- [ ] Comments added for complex logic
- [ ] Documentation updated
- [ ] No new warnings
- [ ] Tests added/updated
```

### PR Size Guidelines
- Keep PRs small and focused (< 400 lines changed)
- One feature/fix per PR
- Split large features into multiple PRs
- Easier to review and less risky to merge

## Code Review Rules

### As a Reviewer
- Review within 24 hours
- Be constructive and respectful
- Ask questions, don't demand changes
- Approve when satisfied
- Test locally if needed

### Review Checklist
- [ ] Code follows project standards
- [ ] Logic is sound and efficient
- [ ] No security vulnerabilities
- [ ] Error handling is proper
- [ ] Tests are adequate
- [ ] Documentation is updated
- [ ] No unnecessary changes

### As an Author
- Respond to all comments
- Don't take feedback personally
- Explain your reasoning
- Make requested changes promptly
- Thank reviewers

## Merging Rules

### Merge Strategy
Use squash and merge for feature branches:

```bash
# Squash commits when merging
git merge --squash feature/my-feature
git commit -m "feat(scope): descriptive message"
```

### Before Merging
- [ ] All PR comments resolved
- [ ] CI/CD checks passing
- [ ] At least one approval
- [ ] Branch is up to date
- [ ] No merge conflicts

### After Merging
- Delete feature branch
- Deploy to staging/production
- Monitor for issues
- Close related issues

## Rebase vs Merge

### Use Rebase for Feature Branches
Keep feature branch up to date with main:

```bash
# Update feature branch
git checkout feature/my-feature
git fetch origin
git rebase origin/main

# If conflicts, resolve and continue
git add .
git rebase --continue
```

### Use Merge for Main Branch
Never rebase main branch:

```bash
# Merge feature into main
git checkout main
git merge --squash feature/my-feature
```

## Handling Conflicts

### Conflict Resolution Steps
1. Fetch latest changes: `git fetch origin`
2. Rebase on main: `git rebase origin/main`
3. Resolve conflicts in editor
4. Stage resolved files: `git add .`
5. Continue rebase: `git rebase --continue`
6. Force push if needed: `git push --force-with-lease`

### Conflict Prevention
- Pull/rebase frequently
- Keep PRs small
- Communicate with team
- Coordinate on shared files

## Reverting Changes

### Revert a Commit
```bash
# Revert specific commit
git revert <commit-hash>

# Revert without committing
git revert -n <commit-hash>
```

### Reset (Use Carefully)
```bash
# Soft reset (keep changes)
git reset --soft HEAD~1

# Hard reset (discard changes)
git reset --hard HEAD~1

# NEVER reset pushed commits on main
```

## Tags and Releases

### Semantic Versioning
Follow semver: `MAJOR.MINOR.PATCH`

- MAJOR: Breaking changes
- MINOR: New features (backward compatible)
- PATCH: Bug fixes

### Creating Tags
```bash
# Create annotated tag
git tag -a v1.2.0 -m "Release version 1.2.0"

# Push tag
git push origin v1.2.0

# Push all tags
git push origin --tags
```

### Release Notes
Document changes for each release:
```markdown
## v1.2.0 - 2026-04-23

### Added
- CSV import functionality
- Envelope borrowing feature

### Fixed
- Budget calculation bug
- Date validation issue

### Changed
- Improved transaction list performance
```

## Git Hooks (Optional)

### Pre-commit Hook
Prevent bad commits:

```bash
#!/bin/sh
# .git/hooks/pre-commit

# Run linter
npm run lint

# Run tests
npm test

# Check for console.logs
if git diff --cached | grep -E "console\.(log|debug|info)"; then
  echo "Error: Remove console.log statements"
  exit 1
fi
```

## Best Practices

### Do's
✅ Commit often with clear messages
✅ Keep commits atomic and focused
✅ Write descriptive PR descriptions
✅ Review your own code before PR
✅ Keep branches up to date
✅ Delete merged branches
✅ Use meaningful branch names

### Don'ts
❌ Don't commit sensitive data
❌ Don't commit broken code
❌ Don't force push to main
❌ Don't commit large binary files
❌ Don't use generic commit messages
❌ Don't commit commented-out code
❌ Don't commit node_modules

## Emergency Procedures

### Accidentally Committed Sensitive Data
```bash
# Remove from history (use with caution)
git filter-branch --force --index-filter \
  "git rm --cached --ignore-unmatch path/to/file" \
  --prune-empty --tag-name-filter cat -- --all

# Force push (coordinate with team)
git push origin --force --all

# Rotate compromised credentials immediately
```

### Recover Deleted Branch
```bash
# Find commit hash
git reflog

# Recreate branch
git checkout -b recovered-branch <commit-hash>
```

### Undo Last Commit (Not Pushed)
```bash
# Keep changes
git reset --soft HEAD~1

# Discard changes
git reset --hard HEAD~1
```
