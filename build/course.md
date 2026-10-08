# Novice to Agentic AI Developer — Fast-Track Curriculum (Oct 2026)

Oct 8, 2026 · @Paul Cachia

Progress, quiz scores and check-ins live in Progress tracker. A weekly AI news and products brief is scheduled for Mondays at 07:46 UK.

## TL;DR

At 12 hours a week, plan on about 26 weeks (roughly six months) to go from zero to competent: shipping a paid SaaS product and running a supervised multi-agent business system. Full-time at 7 hours a day, the same plan takes about 9 weeks. The quickest route is not "learn to code first, then AI". Build something real with an AI coding agent in week 2, then go back and learn just enough terminal, Git, Python/TypeScript, web stack and security to understand, check and fix what the agent produced. Karpathy now says the field has moved past "vibe coding" to "agentic engineering", and that gap between producing code and supervising it is the skill this curriculum teaches.

- **Path:** about 324 hours over 9 phases, ordered by how soon each one gets you shipping. First deployed app in week 2, a paid SaaS around week 16, a supervised multi-agent "business ops" system by week 26. Full-time: about 9 weeks. The best free 2025–2026 resources are the freeCodeCamp Claude Code courses (2026), Anthropic's free Claude Academy (relaunched 20 August 2026), DeepLearning.AI's Anthropic short courses, Andrew Ng's *Agentic AI*, Karpathy's talks, GitHub's own *GitHub for Beginners* series (season 3, 2026) and the Hugging Face MCP course.
- **Tools:** use Claude Code as your main agent (Claude Pro, $20/month, about £16–£20). Keep a second agent (Codex CLI or Gemini CLI, both with free or cheap tiers) to cross-check its work and avoid lock-in. Use Lovable/Bolt/v0 only for throwaway prototypes. The two best-documented ways vibe-coded products fail are security (Supabase tables with Row-Level Security switched off) and agents with unchecked access to production.
- **GitHub is the backbone, not a side topic.** It is taught in depth in Phase 1 (Module 1.4) and then used in every later phase as the task queue, review gate and audit trail for your agents.
- **Reality check on "a company that builds companies":** in late 2026, agents can reliably automate well-specified workflows (research, drafting, coding, triage, reporting) when a human approves the results. A fully autonomous business is still a demo, not a dependable way to operate. Design for "human as CEO and approver, agents as staff", and give agents more autonomy only once evals and logs show they can handle it.

## How to use this curriculum

- **Skip rule:** every module ends with a "ready to move on when…" checkpoint. If you can already pass it, skip the module. With a light coding background you will probably skim Phase 1 and parts of Phase 2, but do not skip Module 1.4 (GitHub in depth).
- **Verification marks:** ✔ means the page was confirmed to exist during research and its key details were checked. ◐ means an official docs URL or well-known resource that was not opened individually, so check it loads first. If a duration or date could not be confirmed, the table says so. YouTube creators often retitle or re-upload videos; if a link breaks, search for the exact title on the named channel.
- **Pricing:** USD prices are converted at roughly £0.80 per $1, before UK VAT. Your checkout price in GBP may be higher once 20% VAT is added.
- **Core habit:** build alongside every resource. Pause the video, make the agent do the step, then ask it to explain what it did. Watching without building is the most common reason self-taught learners stall.
- **One rule for the whole course:** never ship code you cannot get the agent to explain to you.

## Phase 0 – Orientation (Week 1, \~6 hours)

**Objectives:** understand what vibe coding and agentic engineering mean, where the field is in late 2026, and how to learn with an AI pair. **Prerequisites:** none.

### Key context

- **Origin:** Andrej Karpathy coined "vibe coding" in a post on X on 2 February 2025, meaning it for throwaway weekend projects. Collins English Dictionary made it Word of the Year for 2025 (CNN, 6 November 2025).
- **The 2026 shift:** at Sequoia's AI Ascent (released 29 April 2026), Karpathy separated the two ideas. Vibe coding raises the floor; agentic engineering is about preserving the quality bar of professional software. His written summary calls the agent fallible and stochastic and says the agentic engineer does not blindly accept generated code. Secondary sources report he joined Anthropic's pre-training team in May 2026, worth bearing in mind when he talks about Claude.
- **Model landscape in late 2026 (from release trackers, so check vendor pages):** Anthropic shipped Claude Fable 5.1 and Claude Mythos 5.1 (restricted) on 1 September, Claude Opus 5.5 on 22 September and, per one tracker, Claude Sonnet 5.5 on 28 September. OpenAI shipped GPT-6 Astra on 3 September, GPT-6 Sol and Luna on 22 September and GPT-6.1 Sol on 29 September. Google shipped Gemini 3.8 Flash on 2 September; trackers disagree on whether "Gemini 4 Argon" (30 September) has shipped. Open-weight options include DeepSeek V4.1, Qwen 3.8 and Mistral Large 4.
- **What this means for you:** frontier models change every few weeks. Learn concepts and workflows rather than model names.

### Resources

| Resource | Creator | URL | Duration | Date | Cost | Why / skip | Status |
| --- | --- | --- | --- | --- | --- | --- | --- |
| Andrej Karpathy: From Vibe Coding to Agentic Engineering | Sequoia Capital | https://www.youtube.com/watch?v=96jN2OCOfLs | 29:49 | 29 Apr 2026 | Free | **Primary.** The framing from the man who coined the term. 15:46 onwards is the core. | ✔ |
| Sequoia Ascent 2026 summary | Karpathy (blog) | https://karpathy.bearblog.dev/sequoia-ascent-2026/ | \~20 min read | 2026 | Free | His own cleaned-up transcript. Keep section 7. | ✔ |
| Claude Code: A Highly Agentic Coding Assistant (first 2 lessons now) | DeepLearning.AI × Anthropic | https://www.deeplearning.ai/courses/claude-code-a-highly-agentic-coding-assistant | \~1–2 h total | Aug 2025 | Free | Shows how simple an agent's architecture is: a few search, list and read tools. Takes away the "magic". | ✔ |
| AI Fluency: Framework & Foundations | Claude Academy | https://academy.claude.com | \~1–2 h | relaunched 20 Aug 2026 | Free | A short "4D" model for working with AI. Skip the educator and nonprofit variants. | ✔ |

**Exercise:** write a one-page "learning contract": three products you want to build, your weekly hours, and one rule: *I never ship code I cannot get the agent to explain to me.*

**Ready to move on when…** you can explain to a non-technical co-founder how vibe coding (prototype, accept all changes) differs from agentic engineering (write a spec, review diffs, run tests and evals).

**Pitfalls:** binge-watching hype videos, hopping between tools, and believing "no-code" means "no understanding needed".

## Phase 1 – Computer Foundations (Weeks 1–3, \~24 hours; Module 1.4 Part B lands in Week 11)

**Objectives:** use the terminal on macOS or Windows/WSL; understand file systems and environment variables; install software with Homebrew or winget; work in VS Code; use Git and GitHub properly, including SSH keys, conflicts, rebase, pull request review, Issues/Projects and the GitHub CLI; understand HTTP, DNS, client/server and hosting. **Prerequisites:** Phase 0.

### Module 1.1 – Terminal, file system, environment variables, package managers (\~6 h)

| Resource | Creator | URL | Duration | Date | Cost | Why / skip | Status |
| --- | --- | --- | --- | --- | --- | --- | --- |
| 60 Linux Commands you NEED to know (in 10 minutes) | NetworkChuck | https://www.youtube.com/watch?v=gd7BXuUQ91w | \~10 min | \~2021–23 (older, foundational) | Free | The fastest tour of commands that also work in the macOS terminal. | ✔ exists |
| Linux for Hackers EP 1 (8+ episode series) | NetworkChuck | https://www.youtube.com/watch?v=VbEx7B\_PTOE | not confirmed | \~2021–23 (older, foundational) | Free | Watch EP1–2 for shell basics. Skip the "hacking" episodes. | ✔ exists |
| Install WSL | Microsoft Learn | https://learn.microsoft.com/windows/wsl/install | Reference | Current | Free | **Windows users: do all development inside WSL (Ubuntu).** Agent tooling assumes a Unix shell. | ◐ |
| Homebrew / winget | Official | https://brew.sh · https://learn.microsoft.com/windows/package-manager/ | Reference | Current | Free | Install everything through a package manager. | ◐ |

**Exercise:** in the terminal, create `~/code/sandbox`, make some files, set an environment variable, print it and add it to your shell profile. Then remove it again, and learn why secrets shouldn't live in profiles that get synced.

### Module 1.2 – VS Code, Git and GitHub from zero, SSH keys (\~6 h)

| Resource | Creator | URL | Duration | Date | Cost | Why / skip | Status |
| --- | --- | --- | --- | --- | --- | --- | --- |
| Git and GitHub for Beginners – Crash Course | freeCodeCamp (Gwen Faraday) | https://www.youtube.com/watch?v=RGOj5yH7evk | \~1 h 08 m | \~2020 (older, foundational) | Free | **Primary.** Commits, branches, PRs and SSH. Skip password auth; use SSH or the GitHub CLI instead. | ✔ |
| GitHub for Beginners S3: Git and GitHub in VS Code | GitHub (Kedasha Kerr) | https://github.blog/developer-skills/github/github-for-beginners-getting-started-with-git-and-github-in-vs-code/ | \~15 min | 25 May 2026 | Free | Stage, commit, push and review diffs from the editor. | ✔ |
| VS Code Docs | Microsoft | https://code.visualstudio.com/docs | Reference/videos | Current | Free | Learn the integrated terminal, Source Control panel and extensions. | ◐ |

### Module 1.3 – How the web works (\~4 h)

| Resource | Creator | URL | Duration | Date | Cost | Why / skip | Status |
| --- | --- | --- | --- | --- | --- | --- | --- |
| DNS Explained in 100 Seconds | Fireship | https://www.youtube.com/watch?v=UVR9lhUGAyU | \~2 min | not confirmed (older, foundational) | Free | The fastest mental model of DNS. Then watch Fireship's other "100 Seconds" videos (HTTP, REST, JSON) as each comes up. | ✔ |
| MDN – Learn web development / HTTP | Mozilla | https://developer.mozilla.org/en-US/docs/Learn | Reading | Current | Free | The best free reference on HTTP methods, status codes and headers. | ◐ |

### Module 1.4 – GitHub in Depth (\~8 h: Part A in Week 3, Part B in Week 11)

**Objectives:** resolve merge conflicts calmly, know when to merge vs rebase, tidy history with interactive rebase and recover anything with reflog; review a pull request properly, including PRs an agent wrote (read the diff, run it, comment inline, request changes, approve, squash-merge); run a project with Issues, Projects boards, labels and `Closes #n` automation, which becomes the task queue your agents work from; use the GitHub CLI (`gh`), which Claude Code itself depends on; protect `main` with rulesets, required checks, secret scanning and push protection; connect Claude Code to GitHub with `/install-github-app`, `@claude` in issues and PRs, automatic code review, and worktrees for running agents in parallel.

#### Part A – Git depth (Week 3, \~3.5 h)

| Resource | Creator | URL | Duration | Date | Cost | Why / skip | Status |
| --- | --- | --- | --- | --- | --- | --- | --- |
| Learn Git Rebase in 6 minutes // explained with live animations! | The Modern Coder | https://www.youtube.com/watch?v=f1wnYdLEpgI | 6:43 | Nov 2017 (older, foundational) | Free | The best-rated rebase explainer on YouTube; the animations make it click. | ✔ |
| Git MERGE vs REBASE: The Definitive Guide | The Modern Coder | https://www.youtube.com/watch?v=zOnwgxiC0OA | \~8 min | \~2023 | Free | 3-way vs fast-forward merge, the rebase workflow, and the "rebase pitfalls" chapter at 6:41. | ✔ |
| Git for Professionals Tutorial | freeCodeCamp (Tobias Günther) | https://www.youtube.com/watch?v=Uszj\_k0DGsg | 40:42 | 2021 (older, foundational) | Free | The "undo anything" toolkit: branching strategies, conflicts, stash, reflog. | ✔ |
| Advanced Git Tutorial – Interactive Rebase, Cherry-Picking, Reflog, Submodules | freeCodeCamp (Tobias Günther) | https://www.freecodecamp.org/news/advanced-git-interactive-rebase-cherry-picking-reflog-and-more/ | \~35 min | Nov 2021 | Free | Squash an agent's 12 messy commits into 2. Skip the submodules section. | ✔ |
| 13 Advanced (but useful) Git Techniques and Shortcuts | Fireship | https://www.youtube.com/watch?v=ecK3EnyGD8o | 8:07 | 7 Sep 2021 | Free | Aliases, amend, revert vs reset, stash, bisect, hooks. | ✔ |
| Learn Git Branching | learngitbranching.js.org | https://learngitbranching.js.org | \~2 h | Ongoing | Free | Practise rebase and cherry-pick on a visual graph. Do "Ramping Up" and "Moving Work Around". | ◐ |
| Oh Shit, Git!?! | ohshitgit.com | https://ohshitgit.com | 15 min | Ongoing | Free | The panic page. Bookmark it. | ◐ |
| GitHub Skills: Resolve merge conflicts | GitHub | https://github.com/skills (catalogue now at https://learn.github.com/skills) | <1 h | Current | Free | Hands-on in your own repo, graded by Actions. Free in public repositories. | ✔ exists |

#### Part B – GitHub as your agents' operating system (Week 11, \~4.5 h)

| Resource | Creator | URL | Duration | Date | Cost | Why / skip | Status |
| --- | --- | --- | --- | --- | --- | --- | --- |
| GitHub for Beginners S3: Issues and Projects | GitHub (Kedasha Kerr) | https://github.blog/developer-skills/github/github-for-beginners-getting-started-with-github-issues-and-projects/ (video: https://youtu.be/c67GaAkf1BE) | \~15 min + 8-min read | 2 Mar 2026 | Free | **Primary.** Issue → board → PR with `Closes #n` auto-closing. | ✔ |
| GitHub for Beginners S3: GitHub Actions | GitHub (Kedasha Kerr) | https://github.blog/developer-skills/github/github-for-beginners-getting-started-with-github-actions/ | \~15 min | 16 Mar 2026 | Free | Your first workflow. Pairs with the Phase 5 CI work. | ✔ |
| GitHub for Beginners S3: GitHub security | GitHub (Kedasha Kerr) | https://github.blog/developer-skills/github/github-for-beginners-getting-started-with-github-security/ | \~15 min | 30 Mar 2026 | Free | Secret scanning, push protection, Dependabot: the leaked-key fix from Phase 5. | ✔ |
| GitHub for Beginners S2: Code review and refactoring with Copilot | GitHub (Kedasha Kerr) | https://github.blog/ai-and-ml/github-copilot/github-for-beginners-code-review-and-refactoring-with-github-copilot/ | \~15 min | 9 Jun 2025 | Free | How AI review fits into human PR review. Copilot flavour, but the principles transfer to Claude. | ✔ |
| GitHub Skills: Review pull requests | GitHub | https://github.com/skills | <30 min | Current | Free | Comment, suggest changes, apply, approve, merge, hands-on. | ✔ exists |
| GitHub Docs: Reviewing pull requests; Rulesets | GitHub | https://docs.github.com/en/pull-requests · https://docs.github.com/en/repositories/configuring-branches-and-merges-in-your-repository/managing-rulesets | Reading | Current | Free | Require a PR and passing checks before anything reaches `main`. | ◐ |
| GitHub CLI manual + "Top gh commands" | GitHub; Adam Johnson | https://cli.github.com/manual/ · https://adamj.eu/tech/2025/11/24/github-top-gh-cli-commands/ | Reading | Current; 24 Nov 2025 | Free | `gh auth login`, `gh pr create/checkout/review`, `gh issue list`. No standout CLI video was found; the manual plus the exercise is the honest recommendation. | ◐ / ✔ listed |
| Claude Code GitHub Actions | Anthropic | https://code.claude.com/docs/en/github-actions | Reading | Current | Free (uses your subscription or API) | `/install-github-app`, `@claude`, review workflow, scheduled runs, cost caps. | ✔ |
| Claude Code: Code Review | Anthropic | https://code.claude.com/docs/en/code-review | Reading | Current | Free | Automatic review on every PR with no workflow file. | ◐ |
| Claude Code + Git worktrees guide | devtoollab | https://devtoollab.com/blog/claude-code-git-worktrees-parallel-agents-guide | Reading | 2026 | Free | `claude --worktree` (shipped v2.1.49, Feb 2026), `.worktreeinclude`, subagent isolation. A video titled "Claude Code Worktrees in 7 Minutes" also exists, creator unverified. | ✔ / ◐ |

**How the Claude–GitHub pieces fit:** `/install-github-app` from Claude Code installs the GitHub App, stores a secret and opens a pull request with the workflow files; you need the GitHub CLI installed and authenticated first. Mentioning `@claude` in an issue or PR comment has Claude analyse code, implement changes and push commits; a `prompt` input runs it automatically on any GitHub event, including a cron schedule. Boris Cherny, who created Claude Code, listed spinning up three to five worktrees each running its own session as his top tip in February 2026.

**Module 1.4 half-day exercise:**

1. **Conflicts and recovery.** In your sandbox repo, create two branches that edit the same line. Merge one; rebase the other onto `main` and resolve the conflict in VS Code's merge editor. Squash the branch to a single commit with `git rebase -i`. Then "break" `main` with `git reset --hard HEAD~3` and recover it from `git reflog`.
2. **Issues as an agent queue.** Create three issues, a Kanban project and labels. Have Claude Code pick up issue #1 on a branch and open a PR whose description says `Closes #1`. Review it yourself: leave an inline comment, request a change, approve, squash-merge, and watch the issue close.
3. **Lock the door.** Add a ruleset requiring a PR, one approval and a passing check before merging to `main`. Turn on secret scanning and push protection, then try to push a fake API key and watch it get blocked.
4. **Wire in Claude.** Run `/install-github-app`, comment `@claude` on an issue, and read the review Claude leaves on your next PR. Notice what it catches and what it misses.

**Phase 1 project:** create a repo, clone it over SSH, write a README in VS Code, then commit, push, open a PR and merge it.

**Ready to move on when…** you can do that without notes; explain what happens between typing a URL and seeing the page (DNS → server → HTTP response); set and read an environment variable; resolve a conflict without panic; explain merge vs rebase in one sentence each; recover a "lost" commit from reflog; review and squash-merge an agent's PR with at least one requested change; and `main` cannot be pushed to directly.

**Pitfalls:** fighting Windows instead of using WSL; committing `.env` files (add `.gitignore` first); running commands you don't understand (ask Claude to "explain each flag" first); rebasing a branch someone else has pulled; treating green CI as approval (tests check what's there, not what's missing); `--force` instead of `--force-with-lease`; and installing GitHub Apps without reading the permission list. The Claude GitHub App asks for a single permission set covering all Claude features, including read-and-write on Actions, Contents, Issues, Pull requests and Workflows, and GitHub won't let you accept a subset. For tighter scope you can build a custom app with only Contents, Issues and Pull requests, though that covers only the Action, not Code Review.

## Phase 2 – Programming Foundations, Fast (Weeks 4–7, \~45 hours)

**Objectives:** read and debug Python and TypeScript; use virtual environments and `uv`/`pip`; call APIs and handle JSON; understand async basics; use Node.js and npm/pnpm; know just enough HTML/CSS. The aim is to read code, not memorise it. **Prerequisites:** Phase 1.

### Module 2.1 – Python from zero (\~20 h)

| Resource | Creator | URL | Duration | Date | Cost | Why / skip | Status |
| --- | --- | --- | --- | --- | --- | --- | --- |
| Python Full Course for Beginners | Programming with Mosh | https://www.youtube.com/watch?v=K5KVEU3aaeQ | \~2 h | labelled 2025 | Free | **Primary fast track.** Enough to read agent code. | ✔ exists |
| Harvard CS50P – Introduction to Programming with Python | David J. Malan via freeCodeCamp | https://www.youtube.com/watch?v=nLRL\_NcnK-4 (playlist: https://www.youtube.com/playlist?list=PLhQjrBD2T3817j24-GogXmWqO5Q5vYy0V; problem sets: https://pll.harvard.edu/course/cs50s-introduction-programming-python) | \~16 h | \~2022–23 (older, foundational) | Free (paid edX cert optional) | **For depth:** lectures on functions, exceptions, libraries, file I/O and OOP, plus 3–4 problem sets with the AI explaining, not solving. | ✔ |
| uv docs | Astral | https://docs.astral.sh/uv/ | Reference | Current | Free | The fast default for Python projects in 2026: `uv init`, `uv add`, `uv run`. | ◐ |

**Exercise:** write a Python script that calls a public JSON API and writes the results to a CSV. Then make an `asyncio` version that fetches 5 cities at once.

### Module 2.2 – JavaScript/TypeScript, Node.js, npm/pnpm (\~18 h)

| Resource | Creator | URL | Duration | Date | Cost | Why / skip | Status |
| --- | --- | --- | --- | --- | --- | --- | --- |
| Beginner's TypeScript (18 exercises) | Matt Pocock / Total TypeScript | https://www.totaltypescript.com/tutorials/beginners-typescript | \~3–4 h | Sep 2022 (older, foundational) | Free | **Primary.** Types are the cheapest way to catch AI mistakes. Skip the paid Pro workshops. Pair it with https://nodejs.org/en/learn for modules, npm scripts and `.env`. | ✔ |

### Module 2.3 – Just-enough HTML/CSS and reading code (\~7 h)

| Resource | Creator | URL | Duration | Date | Cost | Why / skip | Status |
| --- | --- | --- | --- | --- | --- | --- | --- |
| MDN – HTML & CSS basics | Mozilla | https://developer.mozilla.org/en-US/docs/Learn | \~4 h | Current | Free | Box model, flexbox and semantic tags. Tailwind/shadcn handle the rest. | ◐ |
| Claude Code for Beginners (debugging and navigation sections) | freeCodeCamp | https://www.freecodecamp.org/news/claude-code-for-beginners/ | 4 h 27 m (\~1.5 h here) | 14 May 2026 | Free | Using the agent to explain a codebase you've never seen. | ✔ |

**How to learn with AI here:** ask "explain this line by line", "what breaks if I remove X?" and "write a failing test that shows the bug". Have it quiz you. Don't ask it to "just fix it" until you can say what's wrong.

**Phase 2 project:** a Python CLI and a small TypeScript script that both call the same API, each committed with a README.

**Ready to move on when…** you can take a 100-line file you didn't write, explain what it does, find where it reads the API key, and fix a planted bug with the AI's help while giving the explanation yourself.

**Pitfalls:** tutorial hell (cap this phase at about 45 hours), memorising syntax, and skipping virtual environments.

## Phase 3 – How LLMs Work, Practically (Week 8, \~15 hours)

**Objectives:** understand tokens, context windows, embeddings, temperature, system prompts, tool calling, structured outputs, hallucination, cost, the model landscape, and prompt and context engineering. **Prerequisites:** Phase 2.

| Resource | Creator | URL | Duration | Date | Cost | Why / skip | Status |
| --- | --- | --- | --- | --- | --- | --- | --- |
| Deep Dive into LLMs like ChatGPT | Andrej Karpathy | https://www.youtube.com/watch?v=7xTGNNLPyMI | 3 h 31 m | 5 Feb 2025 | Free | **Primary.** Pre-training, tokens, fine-tuning (SFT) and RL, plus the best explanation of *why* models hallucinate. Watch at 1.25×. | ✔ |
| Effective context engineering for AI agents | Anthropic Applied AI team | https://www.anthropic.com/engineering/effective-context-engineering-for-ai-agents | \~30 min | 29 Sep 2025 | Free | Moves past prompt engineering to curating everything that goes into the context window. Underpins CLAUDE.md, skills and subagents. | ✔ |
| Building with the Claude API | Claude Academy | https://academy.claude.com (legacy: anthropic.skilljar.com/building-with-the-claude-api) | several h | 2026 | Free | Hands-on tool use, structured outputs and caching. | ✔ |
| Prompting docs: Anthropic, OpenAI, Google | Vendors | https://docs.anthropic.com · https://platform.openai.com/docs · https://ai.google.dev | Reading | Current | Free | **For balance:** structured outputs and tool calling work much the same across vendors. | ◐ |

**Cost intuition (from third-party trackers such as https://benchr.org/timeline, so verify):** prices per million input/output tokens vary about 100×. GPT-6 Luna is about $0.10 / $0.50; Claude Sonnet 5.5 about $2 / $10; Claude Opus 5.5 about $4 / $20; GPT-6 Astra about $10 / $50. Send easy steps to cheap models and save frontier models for planning and review. That is the biggest cost lever in agent systems.

**Exercise:** send the same prompt to two vendors and ask for schema-constrained JSON. Measure tokens and cost, then overfill a small context on purpose and watch the quality drop.

**Ready to move on when…** you can explain what tokens are, what temperature does, why with tool calling "the model asks; your code executes", and why bloated context makes agents worse.

**Pitfalls:** treating models as databases of truth, ignoring cost, and chasing leaderboards.

## Phase 4 – AI-Assisted Coding Tools (Weeks 2 and 9–11, \~30 hours)

**Speed hack:** in week 2, alongside Phase 1, do Module 4.1's first video and deploy a tiny static site to Vercel. Early wins keep you going.

**Objectives:** become fluent in Claude Code (CLAUDE.md, slash commands, hooks, subagents, skills, plugins, MCP, headless/CI, the Agent SDK) and know the alternatives. **Prerequisites:** Phase 1.

### Module 4.1 – Claude Code deep dive (\~20 h)

Claude Code runs in the terminal, in IDE extensions, as a desktop app and on the web. The free Claude plan does not include it.

| Plan | Price | Usage |
| --- | --- | --- |
| Pro (the minimum) | $20/month, or $17/month billed annually | Rolling 5-hour windows plus weekly limits, shared with Claude chat |
| Max 5x | $100/month | 5× Pro |
| Max 20x | $200/month | 20× Pro |

| Resource | Creator | URL | Duration | Date | Cost | Why / skip | Status |
| --- | --- | --- | --- | --- | --- | --- | --- |
| Claude Code Full Course | freeCodeCamp (Eric, ex-Amazon/Microsoft) | https://www.freecodecamp.org/news/claude-code-full-course/ | \~1.5 h | 5 Aug 2026 | Free | **Watch this first.** The newest full course: VS Code setup, `/goal`, Skills, MCP, GitHub, deployment. | ✔ |
| Claude Code for Beginners \[Full Course\] | freeCodeCamp | https://www.freecodecamp.org/news/claude-code-for-beginners/ | 4 h 27 m | 14 May 2026 | Free | Good second pass: scaffolding, audits, debugging. | ✔ |
| Claude Code Essentials | freeCodeCamp (Andrew Brown, ExamPro) | https://www.freecodecamp.org/news/claude-code-essentials/ | \~12 h | Mar 2026 | Free | **The exhaustive reference:** permissions, sandboxing, dev containers, GitHub Actions, Agent SDK, memory, MCP, Git worktrees. Watch selectively. | ✔ |
| Claude Code 101 | Claude Academy | https://academy.claude.com/courses/claude-code-101 | \~1.5 h | rebuilt 2026 | Free (exercises need Pro/API) | Official baseline, with a badge. | ✔ |
| Claude Code in Action | Claude Academy | https://academy.claude.com/courses/claude-code-in-action | \~1 h, 9 lessons + quiz | 2026 | Free | Context, custom commands, MCP, GitHub, hooks, SDK. | ✔ |
| Introduction to Agent Skills / Introduction to Subagents | Claude Academy | https://academy.claude.com/courses/introduction-to-agent-skills · https://academy.claude.com/courses/introduction-to-subagents | \~1 h each | 2026 | Free | Reusable SKILL.md packages; context isolation. | ✔ |
| Claude Code: A Highly Agentic Coding Assistant | DeepLearning.AI × Anthropic | https://www.deeplearning.ai/courses/claude-code-a-highly-agentic-coding-assistant | \~2 h | Aug 2025 | Free | Parallel sessions with worktrees, hooks, Playwright MCP, Figma to UI. | ✔ |
| Agent Skills with Anthropic | DeepLearning.AI | https://www.deeplearning.ai/courses/agent-skills-with-anthropic | 10 lessons | 2025–26 | Free | Skills across Claude.ai, Claude Code, the API and the Agent SDK. | ✔ |
| Claude Code video roadmap (Tech With Tim; Nick Saraev 4 h course and 3 h advanced course) | developereducators.com | https://developereducators.com/roadmap/claude-code/ | 20 videos | 2026 | Free | A curated index of popular YouTube videos. | ✔ |
| Claude Code docs | Anthropic | https://code.claude.com/docs | Reference | Continuously updated | Free | **The source of truth.** Videos go out of date; the docs don't. | ✔ |
| Claude Code for Professional Developers | Code with Mosh | codewithmosh.com | \~9 h | 2026 | Paid (\~$249 ≈ £200) | Only if you want one polished linear course. The free courses cover most of it. | ◐ |

**Concepts to master, in order:**

1. **CLAUDE.md:** short project memory covering architecture, commands and conventions.
2. **Plan mode:** explore → plan → code → commit.
3. **Permissions and sandboxing:** never use blanket "skip permissions" on a machine that holds production credentials.
4. **Slash commands and Skills:** stored in `.claude/skills/<name>/SKILL.md`.
5. **Hooks:** deterministic scripts that run at `PreToolUse`, `PostToolUse` or `Stop`, e.g. auto-format, block `rm -rf`, run tests. A hook always runs; a prompt is only a suggestion.
6. **Subagents:** separate contexts for research, review and testing, which can run in parallel.
7. **MCP servers:** connections to GitHub, Supabase, Playwright, Notion and so on.
8. **Plugins:** shareable bundles of skills, hooks, agents and MCP config.
9. **Headless/CI:** `claude -p` in scripts and GitHub Actions.
10. **Claude Agent SDK:** the same harness, as a library. Renamed from "Claude Code SDK" on 29 September 2025, alongside Claude Code 2.0. The packages are now `claude-agent-sdk` and `@anthropic-ai/claude-agent-sdk`, so older tutorials import the wrong ones. Docs: https://code.claude.com/docs/en/agent-sdk/overview and the migration guide at https://platform.claude.com/docs/en/agent-sdk/migration-guide.

**Exercise:** in an existing repo, set up a CLAUDE.md, a `/release-notes` skill, a lint-after-edit hook, a `security-reviewer` subagent and the Playwright MCP server. Then run a headless `claude -p` task from a shell script.

### Module 4.2 – The alternatives: honest comparison (\~10 h)

| Tool | Type | Entry price (Oct 2026) | Strengths | Weaknesses | Use it when… |
| --- | --- | --- | --- | --- | --- |
| Claude Code | Terminal/IDE/desktop agent | Pro $20; Max $100/$200 | Mature extension model; strong on long tasks; Agent SDK reuse | Claude models only; usage windows can cut you off mid-task; no free tier | Your main agent |
| OpenAI Codex | Agent; open-source CLI (Apache-2.0) | Free and Go ($8) tiers; Plus $20 is the first plan that lists CLI/IDE; Pro from $100 | Open-source; cloud tasks; GPT-6-class models | Plan and credit rules change often | Second-opinion reviewer |
| Gemini CLI | Open-source terminal agent | Free quota; paid via API | Generous free tier; 1M-token context | Quotas have changed before | Zero-cost experiments |
| Cursor | AI IDE (VS Code fork) | Hobby free; Pro $20; Pro+ $60; Ultra $200 | Best editor UX; multi-model | Credits run out faster than the dollar figure suggests | If you prefer an IDE |
| Windsurf | AI IDE | \~$20 | Similar to Cursor | Moved to daily/weekly quotas in March 2026, per a pricing tracker | Cursor alternative |
| GitHub Copilot | IDE assistant + agent | Pro \~$10 | Cheapest paid option; built into GitHub | Less autonomous | Tight budget, team settings |
| Replit Agent | Browser IDE + hosting | Free + paid | No setup; hosting included | In July 2025 the agent deleted a production database during a declared code freeze (1,206 executives, 1,196 companies). Replit then added dev/prod separation | Hosted prototypes |
| Lovable / Bolt / v0 | Prompt-to-app builders | Free tiers + \~$20+ | Fastest from idea to clickable UI | CVE-2025-48757: a March 2025 scan of 1,645 apps from Lovable's showcase found about 10.3% with inadequate RLS | Demos and mockups. Export to GitHub and harden with Claude Code |

Price comparison checked 28 Sep 2026: https://www.developersdigest.tech/blog/ai-coding-tools-pricing-2026.

**Recommendation:** pay for one $20 primary (Claude Pro), and use Gemini CLI (free) or a cheap Codex tier as the cross-checker. Upgrade to Max 5x only if you hit limits more than twice a week.

**Ready to move on when…** you can start from a fresh repo and, with only Claude Code plus your own review, ship a feature on a branch with tests, a hook-enforced lint and a PR, and explain every file that changed.

**Pitfalls:** clicking "accept all" on database or infrastructure commands, letting CLAUDE.md grow to 2,000 lines, installing dozens of random MCP servers (each is a supply-chain and prompt-injection risk), and tool FOMO.

## Phase 5 – Building Real Apps (Weeks 12–17, \~60 hours)

**Objectives:** build with Next.js/React and TypeScript; use Postgres via Supabase or Neon, plus auth; take payments with Stripe; deploy to Vercel, Railway, Fly.io or Cloudflare; learn Docker basics and manage secrets; add testing, CI/CD with GitHub Actions, and monitoring; apply vibe-coding security basics; finish with a SaaS that takes real money. **Prerequisites:** Phases 2 and 4.

| Resource | Creator | URL | Duration | Date | Cost | Why / skip | Status |
| --- | --- | --- | --- | --- | --- | --- | --- |
| SaaS App Full Course 2026 – Launch Your SaaS in Under 7 Days with Next JS, Supabase & Payments | JavaScript Mastery | https://www.youtube.com/watch?v=XUkNR-JfHwo | 3 h 56 m | uploaded 23 May 2025 (retitled 2026) | Free | **Primary end-to-end build.** Payments use Clerk Billing, not Stripe, so add Stripe from its docs. | ✔ |
| Next.js Learn | Vercel | https://nextjs.org/learn | \~8–10 h | Continuously updated | Free | The current official App Router tutorial. | ◐ |
| Next.js 13 Crash Course | Net Ninja | https://www.youtube.com/watch?v=TJQbDPGzm0Y | playlist | \~2023 (older; some APIs have changed) | Free | Clear teaching. Pair it with the docs. | ✔ exists |
| Supabase Tutorial for Beginners | Net Ninja | https://www.youtube.com/channel/UCW5YeuERMmlnqo4oq8vwUpg | playlist | \~2022 (older) | Free | The Supabase mental model. Neon (https://neon.com/docs) is the alternative if you don't want bundled auth. | ✔ exists (URL not confirmed) |
| Supabase docs – RLS and Auth | Supabase | https://supabase.com/docs/guides/database/postgres/row-level-security | Reference | Current | Free | **Mandatory.** The single most important security setting for vibe-coded apps. | ◐ |
| Stripe docs – Checkout, Billing, webhooks | Stripe | https://docs.stripe.com | Reference | Current | Fees per transaction | Use Checkout and the Customer Portal; never build your own payment UI. | ◐ |
| Vercel / Railway / Fly.io / Cloudflare docs | Vendors | https://vercel.com/docs · https://docs.railway.com · https://fly.io/docs · https://developers.cloudflare.com | Reference | Current | Free tiers | Vercel for Next.js; Railway/Fly for workers and agents; Cloudflare for DNS and edge. | ◐ |
| 100+ Docker Concepts you Need to Know | Fireship | search the title on https://www.youtube.com/@Fireship | \~10 min | \~2024 (older, foundational) | Free | Enough to containerise an agent worker. | ✔ exists (URL not confirmed) |
| Claude Code Essentials – dev containers & GitHub Actions | freeCodeCamp | https://www.freecodecamp.org/news/claude-code-essentials/ | \~2 h of 12 | Mar 2026 | Free | Running the agent inside CI. | ✔ |
| GitHub for Beginners S3: GitHub Actions | GitHub (Kedasha Kerr) | https://github.blog/developer-skills/github/github-for-beginners-getting-started-with-github-actions/ | \~15 min | 16 Mar 2026 | Free | Your first workflow, before you add tests to it. | ✔ |
| GitHub Actions docs; OWASP Top 10 (+ LLM Top 10) | GitHub; OWASP | https://docs.github.com/actions · https://owasp.org | Reference | Current | Free | Run tests on every PR, and have Claude audit your app against OWASP. | ◐ |

### Security for vibe-coded apps (non-negotiable, \~6 h)

1. **No RLS.** In the Lovable case (CVE-2025-48757), Matt Palmer's statement (29 May 2025) reports that his 21 March 2025 scan found 303 endpoints across 170 of 1,645 projects (about 10.3%) with inadequate RLS settings. **Fix:** turn on RLS for every table, write policies based on `auth.uid()`, and test while logged out.
2. **Leaked keys.** The `service_role` key or API keys end up in front-end code or Git. **Fix:** keep them in server-only env vars, put `.env` in `.gitignore`, turn on GitHub push protection (see Module 1.4), and rotate anything that has leaked.
3. **Agents with production access.** This is what happened with Replit and SaaStr. **Fix:** separate dev and prod databases, give agents a read-only prod role, keep backups, and add a hook that blocks destructive SQL.
4. **Injection.** SQL injection and prompt injection through user content. **Fix:** use parameterised queries or an ORM, and treat everything the model reads as untrusted.
5. **Unverified webhooks.** **Fix:** verify Stripe signatures and make handlers idempotent (safe to run twice).

**Monitoring:** Sentry, platform logs and PostHog all have free tiers.

**Capstone 1 (paid micro-SaaS):** a Next.js + Supabase + Stripe app that solves a problem from your sales world, such as an account-research brief generator. It needs auth and RLS, a Stripe subscription (test mode, then live), CI on every PR with a ruleset protecting `main`, Sentry and a custom domain, and it launches to 10 people.

**Ready to move on when…** a stranger can sign up, pay, use the app and cancel; logged-out queries to every table return nothing; CI blocks a failing test; and you can draw the architecture from memory.

**Pitfalls:** building your own auth or payments, skipping test mode, and launching without backups.

## Phase 6 – Building AI Agents (Weeks 17–22, \~60 hours)

**Objectives:** use the Claude and OpenAI APIs, including tool use; understand the agent loop and Anthropic's "Building effective agents" patterns; build and use MCP servers; compare agent frameworks; add RAG, memory and structured outputs; set up evals, observability, guardrails and cost control; run background agents, and know when computer-use or browser agents fit. **Prerequisites:** Phases 3–5.

### Module 6.1 – APIs, tool use, the agent loop (\~12 h)

| Resource | Creator | URL | Duration | Date | Cost | Why / skip | Status |
| --- | --- | --- | --- | --- | --- | --- | --- |
| Agentic AI | Andrew Ng / DeepLearning.AI | https://www.deeplearning.ai/courses/agentic-ai | 9 h 55 m, 31 videos | launched 7 Oct 2025, updated 31 Aug 2026 | Free to watch; certificate needs Pro | **Primary, vendor-neutral.** Reflection, tool use, planning, multi-agent systems, evals, error analysis. | ✔ |
| Building effective agents | Anthropic (Erik Schluntz & Barry Zhang) | https://www.anthropic.com/engineering/building-effective-agents | \~30 min | Dec 2024 (older, foundational) | Free | The canonical patterns: chaining, routing, parallelisation, orchestrator-workers, evaluator-optimiser, then autonomous agents. Start simple. | ◐ |
| Claude Certified Developer Foundations prep course | freeCodeCamp | https://www.freecodecamp.org/news/unlock-the-power-of-ai-agents-with-the-new-claude-certified-developer-foundations-course/ | \~8 h | 2026 | Free | Agent architectures, MCP, JSON outputs, caching, prompt-injection defence, cost. | ✔ |
| Building toward Computer Use with Anthropic | DeepLearning.AI (Colt Steele) | https://www.deeplearning.ai/courses | 1 h 35 m | 2025 | Free | API basics up to computer use. Model names are older. | ✔ listed |

**Exercise:** write an agent loop by hand in about 80 lines of Python: messages → model → tool call → your code runs it → append the result → repeat. Add a max-steps limit and a cost counter. After this, every framework makes sense.

### Module 6.2 – Model Context Protocol (\~10 h)

| Resource | Creator | URL | Duration | Date | Cost | Why / skip | Status |
| --- | --- | --- | --- | --- | --- | --- | --- |
| MCP: Build Rich-Context AI Apps with Anthropic | DeepLearning.AI (Elie Schoppik) | https://www.deeplearning.ai/courses/mcp-build-rich-context-ai-apps-with-anthropic | 1 h 38 m, 11 videos | May 2025 | Free | **Primary:** build both a server and a client. | ✔ |
| MCP Course (with Anthropic) | Hugging Face | https://huggingface.co/learn/mcp-course/en/unit0/introduction | multi-unit | 2025 (now "legacy") | Free + free certificate | Theory → end-to-end app → deployed use case. | ✔ |
| The Context Course | Hugging Face | https://huggingface.co/context-course | multi-unit | 2026 | Free | Skills, plugins, MCP, subagents and hooks across Claude Code, Codex and OpenCode. | ✔ |
| modelcontextprotocol.io | MCP project | https://modelcontextprotocol.io | Reference | Current | Free | The spec and SDKs. Claude Academy's MCP intro and advanced courses are official, shorter alternatives. | ◐ |

**Exercise:** build a read-only MCP server for your Phase 5 app and connect it to Claude Code and one other client.

### Module 6.3 – Frameworks compared (\~12 h)

| Framework | Language | Best for | Watch-outs | Learn from |
| --- | --- | --- | --- | --- |
| Claude Agent SDK | Py/TS | Claude Code's harness inside your own app | Claude-only; no longer uses Claude Code's system prompt by default | https://code.claude.com/docs/en/agent-sdk/overview ✔ |
| OpenAI Agents SDK | Py/TS | Lightweight handoffs, guardrails, tracing | Built around OpenAI | https://openai.github.io/openai-agents-python/ ◐; James Briggs, "Agents SDK from OpenAI! Full Tutorial" https://www.youtube.com/watch?v=35nxORG1mtg (\~22 min, \~Mar 2025) + playlist https://www.youtube.com/playlist?list=PLIUOU7oqGTLjsFQaIyhcC1u2Nu1MmBTbs ✔ |
| LangGraph | Py/TS | Durable state machines, human-in-the-loop | Steeper learning curve | LangChain Academy "Introduction to LangGraph" (free) https://academy.langchain.com/courses/intro-to-langgraph ✔ (Sep 2024; older, foundational) |
| Pydantic AI | Python | Type-safe structured outputs | Smaller ecosystem | https://ai.pydantic.dev ◐ |
| CrewAI | Python | Quick role-based multi-agent prototypes | Harder to control precisely | https://docs.crewai.com ◐ |
| Google ADK | Py/Java/TS | Gemini/Vertex deployments | Pulls you towards Google Cloud | https://google.github.io/adk-docs ◐ |
| Mastra | TypeScript | TS-native agents for Next.js teams | Younger project | https://mastra.ai/docs ◐ |
| Vercel AI SDK | TypeScript | Streaming chat/tool UIs, multi-provider | A plumbing layer, not an orchestrator | https://ai-sdk.dev/docs ◐ |

**Recommendation:** start with the plain API and your own hand-written loop. Then add the Claude Agent SDK (it matches your Claude Code skills) and the Vercel AI SDK (multi-provider, which hedges vendor risk). Add LangGraph only when you need durable, branching workflows with approvals.

### Module 6.4 – RAG, memory, evals, observability, guardrails, cost, background and browser agents (\~26 h)

| Topic | Resource | URL | Notes | Status |
| --- | --- | --- | --- | --- |
| Evals | Agentic AI (Ng), evals module | https://www.deeplearning.ai/courses/agentic-ai | Build an eval set *before* you tune prompts | ✔ |
| Observability | Langfuse (open-source); alternatives LangSmith, Braintrust | https://langfuse.com/docs · https://docs.smith.langchain.com · https://www.braintrust.dev/docs | Traces, cost, prompt versions | ◐ |
| RAG | Supabase pgvector | https://supabase.com/docs/guides/ai | Use pgvector in the Postgres you already run before adding a separate vector DB | ◐ |
| Memory/context | Anthropic context engineering | https://www.anthropic.com/engineering/effective-context-engineering-for-ai-agents | Compaction, note-taking, isolating context in subagents | ✔ |
| Guardrails | freeCodeCamp CCDV-F course; OWASP LLM Top 10 | links above | Least privilege, allow-listed tools, human approval for any write | ✔ / ◐ |
| Computer use & browser agents | DLAI Computer Use; Playwright MCP | links above | Slow and brittle. Use APIs where they exist | ✔ |
| Background agents | Agent SDK hosting docs; Railway/Fly workers | https://code.claude.com/docs/en/agent-sdk/overview | Queue workers with checkpoints, timeouts and budgets | ✔ / ◐ |

**Cost controls:** a budget cap per run, a max-steps limit, a cheap model for routing, prompt caching, cost logged per task, and alerts at 50%, 80% and 100% of the monthly budget.

**Capstone 2 (production agent):** a prospect-research agent that takes a company name, uses web search and your MCP server, and writes a structured brief to Supabase. It needs 30 eval cases, Langfuse tracing, a cost cap, and human approval before any email is sent.

**Ready to move on when…** the agent passes at least 90% of your evals, every run is traced with its cost, and you can show a blocked prompt-injection attempt.

**Pitfalls:** going multi-agent before a single agent works, skipping evals, and giving agents write access to email or the CRM on day one.

## Phase 7 – Automation and Multi-Agent Business Systems (Weeks 22–25, \~30 hours)

**Objectives:** n8n, Make and Zapier; orchestration; connecting to email, CRM, Slack and Notion; scheduled agents; human-in-the-loop design; an "AI-run business" stack and its limits. **Prerequisites:** Phase 6.

| Resource | Creator | URL | Duration | Date | Cost | Why / skip | Status |
| --- | --- | --- | --- | --- | --- | --- | --- |
| n8n Tutorial for Beginners – The Complete Course | YouTube playlist (creator not confirmed) | https://www.youtube.com/playlist?list=PLYLEmQupIzOEEvgtBduSgYLaug7LKqlSo | 10 videos | 2025 | Free | **Primary structured intro.** | ✔ exists |
| Master n8n in 2 Hours: Complete Beginner's Guide for 2026 | YouTube (Automatable) | https://www.youtube.com/watch?v=AURnISajubk | \~2 h | 2026 | Free | The fastest current alternative. | ✔ exists |
| Ultimate n8n Course: Beginner to Pro in 17 Hours (2026) | YouTube (creator not confirmed) | https://www.youtube.com/watch?v=TZ43SRdTMs0 | \~17 h | 2026 | Free | The deep option: sub-workflows, agent tools, schema validation. | ✔ exists |
| n8n docs | n8n | https://docs.n8n.io | Reference | Current | Free to self-host | Self-host it on Railway or Hetzner. | ◐ |
| Make / Zapier help | Make, Zapier | https://www.make.com/en/help · https://help.zapier.com | Reference | Current | Free tiers | **For balance:** Zapier is quickest for colleagues, Make is cheaper for complex flows, n8n gives the most control. | ◐ |
| Claude Code GitHub Actions – scheduled runs | Anthropic | https://code.claude.com/docs/en/github-actions | Reading | Current | Free | A `prompt` on a cron schedule, e.g. a daily report from commits and open issues, with `--max-turns` and tool allow-lists as the cost cap. | ✔ |
| The Next $100B Market: Selling to AI Agents | Greg Isenberg | https://www.youtube.com/watch?v=MlptIfpoLlw | \~14 min | 2 Jun 2026 | Free | Business models for agent-native companies. Related episodes: Allie K. Miller, "How to Build an AI-Native Company in 2026" (12 Aug 2026); Ryan Carson, "Most Valuable Skill of 2026: Managing AI Agents" (24 Jul 2026). | ✔ |

### The "AI-run business" reference stack

| Layer | Tooling | Human control point |
| --- | --- | --- |
| Inbox/triage | n8n + Gmail/Outlook + a cheap classifier model | You approve outbound replies |
| CRM ops | HubSpot/Attio/Pipedrive via API or MCP | Agents draft; you bulk-approve |
| Research & content | Agent SDK workers on a schedule | Editorial queue in Notion/Slack |
| Engineering | GitHub Issues → Claude Code (`@claude` or headless in Actions) → PR | You review and merge; rulesets block direct pushes to `main` |
| Finance/reporting | Stripe + Supabase → weekly report agent | Read-only access |
| Observability | Langfuse + Sentry + Slack alerts | A kill switch for each workflow |

**On "a company that builds companies":** a realistic 2026 design is a pipeline. Each stage is a well-specified workflow with evals, and each hands off to the next.

1. An idea-research agent finds candidate ideas.
2. A validation step scores each market.
3. A landing page and waitlist go up.
4. Agents draft outreach.
5. **You** make the go/no-go call.
6. Claude Code builds the MVP from a spec template.
7. A launch checklist runs.

Agents can take on much of the *work* at each stage, but not the *judgement*. The Replit and Lovable incidents show what happens when the human checkpoints are removed.

**Capstone 3 (multi-agent ops system):** three agents (triage, research, reporting) orchestrated by n8n or LangGraph, with a shared Supabase state table, approvals posted to Slack, schedules, Langfuse traces and a monthly budget cap.

**Ready to move on when…** the system runs unattended for 7 days, every external action has gone through an approval, and a runbook exists.

**Pitfalls:** automating a process you've never done by hand, letting agents talk to customers unsupervised, and ignoring GDPR when sending personal data to model vendors.

## Phase 8 – Shipping, Product and Entrepreneurship (Weeks 25–26 and ongoing, \~50 hours with capstones)

**Objectives:** idea validation, MVP scoping, analytics, landing pages, marketing automation, pricing, UK/EU legal basics, building in public. Your sales background is a big advantage here.

| Topic | Resource | URL | Status |
| --- | --- | --- | --- |
| AI-native business models | Greg Isenberg (Startup Ideas Podcast, 380+ episodes) | https://www.youtube.com/@GregIsenberg | ✔ |
| Product analytics | PostHog docs | https://posthog.com/docs | ◐ |
| UK GDPR | ICO guidance | https://ico.org.uk/for-organisations/ | ◐ |
| EU AI Act | European Commission | https://digital-strategy.ec.europa.eu | ◐ |

### UK/EU compliance essentials

The Digital Omnibus on AI (Regulation (EU) 2026/1744, published in the Official Journal on 24 July 2026) entered into force on 27 July 2026, according to the European Commission's notice "AI Omnibus enters into force". It changed the timetable:

| Obligation | Applies from |
| --- | --- |
| Annex III high-risk systems (employment, credit scoring, education, biometrics, critical infrastructure) | 2 December 2027 (moved from 2 August 2026) |
| Annex I AI embedded in regulated products | 2 August 2028 |
| Article 50 transparency: disclose AI interactions, label AI-generated content | 2 August 2026 (already applies) |
| Machine-readable marking for generative systems already on the market | 2 December 2026 (grace period ends) |

**What this means for you:** if EU users can talk to your agent, disclose that it's AI now, and avoid hiring or credit-scoring use cases for the time being.

**UK:** there is no UK equivalent of the AI Act. UK GDPR and ICO guidance apply: a lawful basis for processing, a privacy notice, a data processing agreement with every AI vendor, and data minimisation before anything is sent to a model. This is orientation, not legal advice. Get a solicitor to review before you process customer personal data at scale.

**Capstone 4 (real launch):** 20 customer conversations to validate the idea, charging from day one, a landing page with a waitlist, a public launch, and either 10 paying customers or a written decision to kill it. Capstone 3 runs operations behind it.

## Week-by-Week Schedules

### Part-time (\~12 h/week, 26 weeks, \~324 hours)

Weeks 3 and 11 carry the two halves of Module 1.4 (GitHub in depth). If week 3 overruns, push "how the web works" into week 4. If you already know the Phase 1–2 material, expect about 20 weeks.

| Week | Focus | Deliverable |
| --- | --- | --- |
| 1 | Phase 0 + terminal (Karpathy talk, NetworkChuck, WSL/Homebrew) | Learning contract |
| 2 | Quick win: fCC Claude Code Full Course + fCC Git crash course | Static site on Vercel |
| 3 | SSH/VS Code + how the web works + **Module 1.4 Part A** (conflicts, rebase, reflog) | PR workflow without notes; conflict resolved and commit recovered |
| 4 | Python I (Mosh; CS50P lectures 0–3) | API → CSV script |
| 5 | Python II (CS50P 4–6; uv) | Async fetcher |
| 6 | TypeScript + Node (Total TypeScript) | TS CLI tool |
| 7 | HTML/CSS + reading code | Planted-bug fix |
| 8 | LLMs (Karpathy Deep Dive; context engineering) | Two-vendor JSON test |
| 9 | Claude Code core (101, in Action, docs) | CLAUDE.md + plan-mode feature |
| 10 | Hooks, skills, subagents, MCP | Skill + hook + subagent + MCP |
| 11 | Alternatives + headless/CI + **Module 1.4 Part B** (Issues/Projects, PR review, rulesets, `gh`, `/install-github-app`, worktrees) | Same task in 2 agents; agent PR reviewed and squash-merged; `main` protected |
| 12 | Next.js (nextjs.org/learn) | Skeleton with auth |
| 13 | Supabase + RLS | RLS-tested schema |
| 14 | SaaS build (JS Mastery) | Core feature |
| 15 | Stripe + webhooks | Test-mode subscriptions |
| 16 | Deploy, CI, Sentry, security audit | **Capstone 1 live** |
| 17 | Launch to 10 users; Ng Agentic AI modules 1–2 | First feedback |
| 18 | Hand-built agent loop (Claude Academy API course) | 80-line agent |
| 19 | MCP (DLAI; Hugging Face) | Your MCP server |
| 20 | Frameworks (Agent SDK; OpenAI Agents SDK; LangGraph) | Same agent in 2 frameworks |
| 21 | Evals, observability, RAG | Eval set + traces |
| 22 | **Capstone 2** | Production agent |
| 23 | n8n + integrations | Inbox triage |
| 24 | Multi-agent + HITL | Slack approval loop |
| 25 | **Capstone 3** + compliance | 7-day unattended run |
| 26 | Validation + launch | **Capstone 4 launched** |

### Accelerated full-time (6–8 h/day, \~35 h/week, \~9 weeks)

| Week | Content (part-time weeks covered) |
| --- | --- |
| 1 | Phases 0–1 + Claude Code quick win + Git depth (1–3) |
| 2 | Python + TypeScript (4–7) |
| 3 | LLMs + Claude Code deep dive (8–10) |
| 4 | Alternatives + GitHub Part B + Next.js/Supabase (11–13) |
| 5 | SaaS, Stripe, deploy → **Capstone 1** (14–16) |
| 6 | Agent loop, MCP, frameworks (17–20) |
| 7 | Evals/observability → **Capstone 2** (21–22) |
| 8 | n8n, multi-agent, HITL → **Capstone 3** (23–25) |
| 9 | Launch sprint → **Capstone 4** (26) |

**Daily rhythm:** 2 hours of video/docs, 4 hours of building, 1 hour writing up and committing. Don't compress below about 8 weeks. Below that, your understanding stops keeping up with the agent's output; in Karpathy's words, you can't outsource your understanding.

## Day-One Toolkit and Monthly Costs (GBP, ex-VAT estimates)

Expect about £16/month during Phases 1–4 and £30–£80/month once you are shipping (Phases 5–8). Optional Max 5x adds about £64.

| Item | Purpose | Monthly cost |
| --- | --- | --- |
| Claude Pro (includes Claude Code) | Primary agent | \~£16 ($20) |
| Gemini CLI free / ChatGPT Free or Go | Second-opinion agent | £0–£6.40 |
| GitHub (free), GitHub CLI, VS Code | Code, Issues/Projects, Actions, secret scanning, editor | £0 |
| Vercel Hobby, Supabase Free, Neon Free | Hosting/DB | £0 (Supabase Pro \~£20 once live) |
| Stripe | Payments | Transaction fees only |
| Anthropic/OpenAI API credits | Agent building (Phase 6+) and `@claude` in GitHub if not using a subscription token | £5–£30 with caps |
| Railway or Hetzner VPS | n8n and agent workers | £4–£10 |
| Langfuse / Sentry / PostHog free tiers | Observability | £0 |
| Domain | Launch | \~£1 (£10–£15/year) |

GitHub Actions minutes are free on public repositories and limited on private ones; Claude Code's GitHub Action consumes those minutes plus API tokens (or your subscription if you authenticate with an OAuth token).

## Staying Current

- **YouTube** (handles not individually checked): Karpathy, freeCodeCamp, Anthropic, OpenAI, Google for Developers, DeepLearning.AI, Sequoia Capital, GitHub (the *GitHub for Beginners* series), Fireship, The Modern Coder, Matt Pocock, Theo (t3.gg), IndyDevDan, Cole Medin, AI Jason, Nate Herk, Greg Isenberg, Riley Brown, Matthew Berman (news; skim), Dave Ebbelaar, Ray Fernando, Tech With Tim, Net Ninja, Traversy Media, Programming with Mosh, NetworkChuck.
- **Newsletters and podcasts:** Simon Willison's blog, the Anthropic Engineering blog, the GitHub Blog (tag: github-for-beginners), Latent Space, Ben's Bites, The Rundown AI, The Startup Ideas Podcast, Sequoia's "Training Data".
- **Communities:** the Anthropic/Claude Discord, the Hugging Face Discord (#mcp-course-questions), the n8n forum, r/ClaudeAI, r/LocalLLaMA.
- **Docs that outlast the videos:** https://code.claude.com/docs, https://docs.github.com, https://modelcontextprotocol.io, https://supabase.com/docs, https://docs.stripe.com.

## Glossary

- **Agent / agent loop:** an LLM that picks tools and repeats model → tool call → execution → observation until the goal is met.
- **Agentic engineering:** Karpathy's 2026 term for professionally supervising coding agents.
- **CLAUDE.md:** a project memory file loaded automatically.
- **Context engineering:** choosing what goes into the model's working memory (its context window).
- **Embedding / vector DB:** numbers that represent meaning, and the store used to search them (RAG).
- **Evals:** test suites for agent quality.
- **Hallucination:** output that is confident but false.
- **Hook:** a deterministic script that runs at a lifecycle event.
- **Interactive rebase:** rewriting a branch's commits (reorder, squash, edit) before sharing them.
- **MCP:** Model Context Protocol, an open standard for tools and data (Anthropic, Nov 2024).
- **Plugin:** a bundle of skills, hooks, subagents and MCP config.
- **Prompt injection:** malicious instructions hidden in content the model reads.
- **Pull request (PR):** a proposed change to a branch, with a diff, discussion, review and checks before merge.
- **Reflog:** Git's log of where HEAD has pointed; the way back from almost any mistake.
- **RLS:** Postgres Row-Level Security.
- **Ruleset / branch protection:** GitHub rules that stop direct pushes and require reviews and checks on `main`.
- **Skill:** a SKILL.md folder loaded on demand.
- **Subagent:** a delegated agent with its own isolated context.
- **Token:** a chunk of text, and the unit of billing.
- **Vibe coding:** building by prompting, without reading the code (Karpathy, Feb 2025).
- **Worktree:** a parallel Git checkout, used to run agents side by side.

## Skip List (Not Worth a Novice's Time in 2026)

1. **Training or fine-tuning your own models,** including Karpathy's "Zero to Hero" series. Brilliant, but come back to it later.
2. **LeetCode and CS-theory courses.** You need to be able to read, test and design code.
3. **Prompt-engineering courses from 2023 to early 2025** built on "magic phrases". Context engineering and evals have replaced them.
4. **Old "Claude Code SDK" tutorials.** The SDK was renamed in September 2025.
5. **Learning several IDEs or agents in depth.** One primary plus one checker is enough.
6. **Git submodules, GitFlow and complex branching models.** Trunk-based with short-lived branches and PRs is all a one-person team with agents needs.
7. **Kubernetes, microservices, AWS certifications, or building your own auth, payments or vector DBs.**
8. **Multi-agent frameworks before a single agent passes its evals.**
9. **Installing every MCP server or plugin.** Each one adds attack surface.
10. **Paid "AI agency" courses and Skool upsells** that promise autonomous income.
11. **Chasing every model release.** Re-evaluate once a quarter.

## Caveats and Verification Notes

- **Verification limits.** Resources marked ◐ are standard official URLs not opened individually. Several YouTube creators (the n8n courses, "Claude Code Worktrees in 7 Minutes") could not be confirmed, and durations taken from aggregators are approximate. The URL and date for "Building effective agents" come from prior knowledge. GitHub Skills has moved to learn.github.com and its new catalogue page did not render during research, so start from the github.com/skills repositories if the new site is awkward. No standout GitHub CLI video was found; the manual plus the exercise is the recommendation.
- **Model and pricing data** come mostly from third-party trackers dated September–October 2026, and they partly conflict, especially on Google's current flagship. Confirm on vendor pages.
- **Incident figures.** The Lovable numbers come from Matt Palmer's own "Statement on CVE-2025-48757" (29 May 2025): 170 of 1,645 apps, about 10.3%. The Replit details come from Jason Lemkin's account as reported by Tom's Hardware (July 2025). Statistics that trace back to vendor marketing have been left out deliberately.
- **This field moves fast.** Expect much of the tool-specific video content to date within months. Fall back on the official docs and Claude Academy. The underlying concepts will outlast every tool named here: the agent loop, context, evals, least privilege, human checkpoints, and a protected `main` branch with reviewed pull requests.

### Sources opened during research

- [Karpathy: Sequoia Ascent 2026 summary](https://karpathy.bearblog.dev/sequoia-ascent-2026/)
- [Claude Code GitHub Actions docs](https://code.claude.com/docs/en/github-actions)
- [Claude Agent SDK migration guide](https://platform.claude.com/docs/en/agent-sdk/migration-guide)
- [GitHub for Beginners: Issues and Projects (2 Mar 2026)](https://github.blog/developer-skills/github/github-for-beginners-getting-started-with-github-issues-and-projects/)
- [GitHub for Beginners series index](https://github.blog/tag/github-for-beginners/)
- [Introducing GitHub Skills](https://github.blog/news-insights/product-news/introducing-github-skills/)
- [freeCodeCamp: Advanced Git (Tobias Günther)](https://www.freecodecamp.org/news/advanced-git-interactive-rebase-cherry-picking-reflog-and-more/)
- [freeCodeCamp: Claude Code Full Course](https://www.freecodecamp.org/news/claude-code-full-course/)
- [freeCodeCamp: Claude Code Essentials](https://www.freecodecamp.org/news/claude-code-essentials/)
- [DeepLearning.AI: Agentic AI](https://www.deeplearning.ai/courses/agentic-ai)
- [DeepLearning.AI: MCP with Anthropic](https://www.deeplearning.ai/courses/mcp-build-rich-context-ai-apps-with-anthropic)
- [Hugging Face MCP Course](https://huggingface.co/learn/mcp-course/en/unit0/introduction)
- [AI coding tools pricing comparison 2026](https://www.developersdigest.tech/blog/ai-coding-tools-pricing-2026)
- [Claude Code git worktrees guide (devtoollab)](https://devtoollab.com/blog/claude-code-git-worktrees-parallel-agents-guide)
- [Vibe App Scanner: Lovable security / CVE-2025-48757](https://vibeappscanner.com/lovable-security)
- [Replit production database deletion (kpath.ai incident note)](https://www.kpath.ai/learn/incidents/replit-production-database-deletion)
- [EU AI Act Digital Omnibus deadlines (Usercentrics)](https://usercentrics.com/knowledge-hub/eu-ai-act-high-risk-delay-article-50-transparency-consent/)
- [AI model release timeline (benchr)](https://benchr.org/timeline)
