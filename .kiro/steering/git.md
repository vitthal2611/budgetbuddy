---
inclusion: auto
---

# Git Best Practices - Enforced Rules

## Commit Message Standards (MANDATORY)

### Commit Message Format
ALL commits MUST follow this format:

```
<type>(<scope>): <subject>

[optional body]

[optional footer]
```

### Required Types
- `feat`: New feature for the user
- `fix`: Bug fix for the user
- `docs`: Documentation only changes
- `style`: Formatting, missing semicolons, etc (no code change)
- `refactor`: Refactoring production code
- `perf`: Performance improvements
- `test`: Adding tests, refactoring tests
- `chore`: Updating build tasks, package manager configs, etc

### Commit Message Rules (STRICT)
1. **Subject line MUST be 50 characters or less**
2. **Use imperative mood**: "add feature" NOT "added feature" or "adds feature"
3. **Capitalize first letter** of subject
4. **No period** at end of subject line
5. **Body MUST be wrapped at 72 characters** (if present)
6. **Separate subject from body** with blank line

### Valid Examples
```bash
feat(transactions): add CSV import functionality
fix(budget): correct envelope allocation calculation
docs(readme): update installation instructions
refactor(auth): simplify authentication flow
perf(list): optimize transaction rendering with virtualization
test(transactions): add unit tests for date validation
chore(deps): update Firebase to v12.11.0
```

### Invalid Examples (DO NOT USE)
```bash
❌ "fixed bug"                    # No type, not descriptive
❌ "Updated files"                # No type, vague
❌ "feat: added new feature"      # Wrong tense (should be "add")
❌ "WIP"                          # Not descriptive
❌ "asdfasdf"                     # Meaningless
❌ "Fix bug in transaction modal that was causing issues when users tried to save" # Too long (>50 chars)
```

## Branch Naming Standards (MANDATORY)

### Branch Name Format
```
<type>/<description-in-kebab-case>
```

### Branch Types
- `feature/` - New features
- `fix/` - Bug fixes
- `hotfix/` - Urgent production fixes
- `refactor/` - Code refactoring
- `docs/` - Documentation updates
- `test/` - Test additions/updates
- `chore/` - Maintenance tasks

### Valid Branch Names
```bash
feature/add-budget-templates
fix/transaction-date-validation
hotfix/security-patch-auth
refactor/simplify-envelope-logic
docs/update-api-documentation
test/add-integration-tests
chore/update-dependencies
```

### Invalid Branch Names (DO NOT USE)
```bash
❌ my-feature                    # No type prefix
❌ feature/My_Feature            # Wrong case (use kebab-case)
❌ fix-bug                       # No type prefix
❌ feature/add feature           # Spaces not allowed
❌ FEATURE/NEW-THING             # Wrong case
```

## Files That Must NEVER Be Committed

### Sensitive Files (CRITICAL)
```
.env
.env.local
.env.development
.env.production
.env.test
*.key
*.pem
*.p12
secrets.json
credentials.json
```

### Build & Dependencies
```
node_modules/
build/
dist/
.cache/
coverage/
```

### Firebase
```
.firebase/
firebase-debug.log
firestore-debug.log
ui-debug.log
```

### IDE & OS
```
.vscode/
.idea/
*.swp
*.swo
.DS_Store
Thumbs.db
```

### Temporary Files
```
*.tmp
*.log
npm-debug.log*
yarn-debug.log*
yarn-error.log*
```

## Pre-Commit Checklist (MANDATORY)

Before EVERY commit, verify:
- [ ] **No console.log statements** in production code
- [ ] **No commented-out code** (remove it)
- [ ] **No TODO comments** without issue reference
- [ ] **No sensitive data** (API keys, passwords, tokens)
- [ ] **No large files** (>1MB) without justification
- [ ] **Code is formatted** consistently
- [ ] **No syntax errors** (run `npm run build`)
- [ ] **Tests pass** (if applicable)
- [ ] **Commit message follows format**

## What to Commit

### ✅ ALWAYS Commit
- Source code files (`.js`, `.jsx`, `.css`)
- Configuration files (`package.json`, `firebase.json`)
- Documentation (`.md` files)
- Public assets (images, icons in `public/`)
- Test files
- `.gitignore` file

### ❌ NEVER Commit
- `node_modules/` directory
- Build output (`build/`, `dist/`)
- Environment variables (`.env*` files)
- IDE settings (`.vscode/`, `.idea/`)
- Log files
- Temporary files
- Large binary files
- Sensitive credentials

## Commit Frequency Rules

### When to Commit
✅ Commit when:
- Feature is complete and working
- Bug is fixed and tested
- Logical unit of work is done
- Code compiles without errors
- Tests are passing
- Before switching tasks

### Commit Size Guidelines
- **Small commits** are better than large ones
- Each commit should be **one logical change**
- Aim for **100-300 lines changed** per commit
- If changing >500 lines, consider splitting into multiple commits

## Pull Request Rules (MANDATORY)

### Before Creating PR
- [ ] Branch is up to date with `main`
- [ ] All commits follow message format
- [ ] Code is tested locally
- [ ] No console errors in browser
- [ ] Build succeeds: `npm run build`
- [ ] Self-review completed
- [ ] No merge conflicts

### PR Title Format
MUST follow commit message format:
```
feat(transactions): add CSV import functionality
fix(budget): correct envelope allocation calculation
```

### PR Description (REQUIRED)
```markdown
## Description
[Brief description of changes]

## Type of Change
- [ ] Bug fix (non-breaking change which fixes an issue)
- [ ] New feature (non-breaking change which adds functionality)
- [ ] Breaking change (fix or feature that would cause existing functionality to not work as expected)
- [ ] Documentation update

## Changes Made
- [List specific changes]
- [Be detailed but concise]

## Testing
- [How was this tested?]
- [What scenarios were covered?]

## Screenshots (if UI changes)
[Add screenshots]

## Checklist
- [ ] Code follows project style guidelines
- [ ] Self-review completed
- [ ] No console.log statements
- [ ] No commented-out code
- [ ] Documentation updated (if needed)
- [ ] No new warnings
```

### PR Size Limits
- **Maximum 400 lines changed** per PR
- If larger, split into multiple PRs
- One feature/fix per PR
- Easier to review = faster merge

## Branch Management Rules

### Creating Branches
```bash
# Always create from main
git checkout main
git pull origin main
git checkout -b feature/my-new-feature
```

### Keeping Branch Updated
```bash
# Update your branch regularly
git checkout feature/my-feature
git fetch origin
git rebase origin/main

# If conflicts, resolve and continue
git add .
git rebase --continue
```

### Deleting Branches
```bash
# Delete local branch after merge
git branch -d feature/my-feature

# Delete remote branch
git push origin --delete feature/my-feature
```

## Merge Strategy (MANDATORY)

### Use Squash and Merge
- Squash all commits into one when merging to `main`
- Keeps main branch history clean
- One commit per feature/fix

```bash
# When merging PR
git checkout main
git merge --squash feature/my-feature
git commit -m "feat(scope): descriptive message"
git push origin main
```

### NEVER Force Push to Main
```bash
# ❌ FORBIDDEN
git push --force origin main

# ✅ ALLOWED (on feature branches only)
git push --force-with-lease origin feature/my-feature
```

## Handling Merge Conflicts

### Conflict Resolution Steps
1. **Fetch latest**: `git fetch origin`
2. **Rebase on main**: `git rebase origin/main`
3. **Resolve conflicts** in your editor
4. **Stage resolved files**: `git add .`
5. **Continue rebase**: `git rebase --continue`
6. **Force push** (if needed): `git push --force-with-lease`

### Conflict Prevention
- Pull/rebase frequently (at least daily)
- Keep PRs small and focused
- Communicate with team about shared files
- Merge PRs quickly to avoid drift

## Code Review Standards

### As a Reviewer
- Review within **24 hours**
- Be **constructive** and respectful
- Ask questions, don't demand
- Test locally if needed
- Approve when satisfied

### As an Author
- Respond to **all comments**
- Don't take feedback personally
- Make requested changes promptly
- Thank reviewers
- Re-request review after changes

## Reverting Changes

### Safe Revert
```bash
# Revert a commit (creates new commit)
git revert <commit-hash>

# Revert without committing immediately
git revert -n <commit-hash>
```

### Reset (Use with Extreme Caution)
```bash
# Soft reset (keep changes staged)
git reset --soft HEAD~1

# Hard reset (discard all changes)
git reset --hard HEAD~1

# ⚠️ NEVER reset commits that are pushed to main
```

## Tagging and Releases

### Semantic Versioning
Follow **semver**: `MAJOR.MINOR.PATCH`
- **MAJOR**: Breaking changes (v2.0.0)
- **MINOR**: New features, backward compatible (v1.1.0)
- **PATCH**: Bug fixes (v1.0.1)

### Creating Tags
```bash
# Create annotated tag
git tag -a v1.2.0 -m "Release version 1.2.0 - Add CSV import"

# Push tag to remote
git push origin v1.2.0

# Push all tags
git push origin --tags
```

## Emergency Procedures

### Accidentally Committed Sensitive Data
```bash
# 1. Remove file from git (keeps local copy)
git rm --cached .env

# 2. Add to .gitignore
echo ".env" >> .gitignore

# 3. Commit the removal
git commit -m "chore: remove sensitive file from git"

# 4. Push changes
git push origin main

# 5. IMMEDIATELY rotate all exposed credentials
```

### Recover Deleted Branch
```bash
# Find the commit hash
git reflog

# Recreate branch from commit
git checkout -b recovered-branch <commit-hash>
```

### Undo Last Commit (Not Pushed)
```bash
# Keep changes (undo commit only)
git reset --soft HEAD~1

# Discard changes completely
git reset --hard HEAD~1
```

## Daily Git Workflow

### Morning Routine
```bash
# 1. Update main branch
git checkout main
git pull origin main

# 2. Update your feature branch
git checkout feature/my-feature
git rebase origin/main

# 3. Start working
```

### Before Lunch/End of Day
```bash
# 1. Stage changes
git add .

# 2. Commit with proper message
git commit -m "feat(scope): add feature description"

# 3. Push to remote
git push origin feature/my-feature
```

## Git Commands Reference

### Essential Commands
```bash
# Check status
git status

# View changes
git diff

# View commit history
git log --oneline --graph

# Stage files
git add <file>
git add .

# Commit
git commit -m "type(scope): message"

# Push
git push origin <branch-name>

# Pull
git pull origin <branch-name>

# Create branch
git checkout -b feature/new-feature

# Switch branch
git checkout <branch-name>

# Delete branch
git branch -d <branch-name>

# View branches
git branch -a

# Stash changes
git stash
git stash pop
```

## Enforcement Checklist

Before ANY commit:
- [ ] Commit message follows format
- [ ] No console.log in code
- [ ] No commented-out code
- [ ] No sensitive data
- [ ] Code builds successfully
- [ ] Branch name follows format
- [ ] Changes are logical and focused

Before ANY push:
- [ ] All commits have proper messages
- [ ] Branch is up to date with main
- [ ] No merge conflicts
- [ ] Tests pass (if applicable)

Before ANY PR:
- [ ] PR title follows format
- [ ] PR description is complete
- [ ] Self-review completed
- [ ] No unnecessary files included
- [ ] Screenshots added (if UI changes)

## Violations and Consequences

### Common Violations
❌ Committing with message "WIP" or "updates"
❌ Committing `node_modules/`
❌ Committing `.env` files
❌ Force pushing to main
❌ Committing broken code
❌ Large commits (>500 lines) without justification

### How to Fix Violations
1. **Acknowledge the mistake**
2. **Fix immediately** (amend commit, revert, etc.)
3. **Learn from it**
4. **Update this guide** if needed

## Git Configuration

### Recommended Git Config
```bash
# Set your identity
git config --global user.name "Your Name"
git config --global user.email "your.email@example.com"

# Set default branch name
git config --global init.defaultBranch main

# Enable color output
git config --global color.ui auto

# Set default editor
git config --global core.editor "code --wait"

# Enable rebase by default for pull
git config --global pull.rebase true
```

## Remember

> "Commit early, commit often, commit with clear messages."

> "A good commit message explains WHY, not just WHAT."

> "When in doubt, make the commit smaller."

> "Never commit something you wouldn't want the world to see."
