# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

---

## [v1.10.1] - 2026-04-11

### Fix

- `/cluster-promote` で昇格したルールが `## Global Rules (Clade 管理)` に追記されていた問題を修正。正しく `## User Rules` セクションに追記されるよう `update-clade-section.js`（JA・EN版）を修正
- `.claude/instincts/raw/` ディレクトリ全体を `.gitignore` に追加。アーカイブファイルが誤って GitHub に公開されるのを防止

---

## [v1.10.0] - 2026-04-11

### New: 育てる動線の強化

- `/end-session` に昇格候補の提示機能を統合。セッション終了時に `/cluster-promote` が検出したルール・スキル候補を一覧表示し、その場で保存・保留・スキップを選択できるようになりました
- セッション終了時に使用エージェント・作業時間などのメタ情報をセッションファイルに自動記録するよう改善
- ルール昇格時に CLAUDE.md の `User Rules` セクションへの自動追記（`update-clade-section.js`）に対応

### New: ドキュメント

- 変更履歴ページ（`/changelog`）を GitHub Pages に追加
- トップページに「最近の更新」セクションを追加（最新3バージョンの概要を表示）

### Fix

- エージェントスキルファイルの heredoc 構文を修正

---

## [v1.9.0] - 2026-04-10

### New / Fix

- セットアップ未実行警告を Claude コンテキスト経由でユーザーに表示するよう `CLAUDE.md` と `/init-session` コマンドに指示を追加
- 英語版テンプレートの同期: `agents/planner.md` にマイルストーン計画セクションを追加、`session-start.js` にセットアップ検出を追加、`write-report.js` に `--file` オプションを追加、`statusline.js` / `clade-update.js` を新規追加
- 英語版 `clade-update.js` を EN 専用ロジックに刷新。リリースの `templates/en/.claude/` を参照して `.claude/` を更新するよう変更（従来は JA ファイルで上書きしていたバグを修正）
- ドキュメント: `/update` コマンドの説明をセッション管理ページに追加

---

## [v1.8.3] - 2026-04-10

### Fix

- セットアップ未実行の警告が Claude に伝わらず「hookエラー」として表示されるだけだった問題を修正。`process.exit(1)` を削除し、警告テキストを Claude のコンテキストに正しく注入するよう変更

---

## [v1.8.2] - 2026-04-10

### Fix

- `/update` コマンド実行時に `templates/en/.claude` がユーザープロジェクトに作成されてしまう問題を修正。英語版テンプレートの更新処理はそのディレクトリが既に存在する場合のみ実行するよう変更

---

## [v1.8.1] - 2026-04-10

### Fix

- セットアップ未実行検出の対象から `README.md` を除外。一般的なプロジェクトに `README.md` が存在することが多く、誤検知の原因となっていたため

---

## [v1.8.0] - 2026-04-10

### New: `/update` コマンド

Clade 自体をアップデートするコマンドを追加しました。GitHub リリースの最新版と現在のインストールを比較し、差分を確認・適用・ロールバックできます。

```
/update          # 最新バージョンを確認・適用
/update --check  # 差分を確認するだけ（適用しない）
```

### New: VitePress ドキュメントサイト

公式ドキュメントサイト（VitePress）を追加し、GitHub Pages で公開しました。セットアップ手順・エージェント一覧・ワークフロー解説などをまとめています。

### New: セットアップ未実行検出

セットアップスクリプト（`setup.sh` / `setup.ps1`）を実行せずにそのまま使おうとした場合に、セッション開始時に警告と案内を表示する機能を追加しました。

### New: トラブルシューティングページ

ドキュメントサイトにトラブルシューティングページを追加しました。非エンジニアや使い始めのエンジニアが詰まりやすい5つのケースをカバーしています。

- セットアップのやり方がわからない
- セットアップがうまくいかない
- Clade を入れてみたけど何をしたらいいかわからない
- カスタムコマンドが動かない
- エラーメッセージが出たけどどうしたらいいかわからない

### Fix

- エージェントスキルファイルのヒアドキュメント terminator を `CLADE_REPORT_EOF` に統一し、特殊文字を含むレポートが正しく保存されない問題を修正
- `clade-update.js` を CommonJS（`require`）形式に変換し、既存フックとの互換性を確保

---

## [v1.7.0] - 2026-04-09

### New: `/agent-workflow-builder`

業務ヒアリングからエージェント群を自動生成するメタエージェントを追加しました。

「Clade を使って Clade のエージェントを作る」再帰的な構造で、非エンジニアでも自分の業務に特化したワークフローを構築できます。

**4フェーズで動作します:**

1. **ヒアリング** — 職種・繰り返し作業・IN/OUT を 5〜6 問で聴取
2. **ワークフロー設計** — ステップごとにエージェントを提案し、ユーザーが確認・調整
3. **エージェントファイル生成** — 各ステップの `.md` 指示書と統括コマンドを自動生成
4. **CLAUDE.md 更新** — `Available Agents` セクションに生成したエージェントを自動追記

```
/agent-workflow-builder
```

質問は「代表例の選択肢 + 自由入力」形式なので、どんな職種・業種にも対応できます。  
生成されるエージェントは既存の interviewer / developer / reviewer の設計をベースにしており、そのまま使えるクオリティで出力されます。

---

## [v1.6.0] - 2026-04-08

### Apology

v1.5 以前の Clade をお使いの方へ、まずお詫び申し上げます。

`pre-tool.js` / `post-tool.js` フックが **全ツール実行を `observations.jsonl` に逐次記録し続けていました**。この仕組みは「実行パターンから自動学習する」という意図で設計されましたが、実際に生成されたデータは "Read → Edit → Bash のような当たり前のシーケンス" の羅列にすぎず、スキルやルールに昇格する意味のある知見は何も得られませんでした。意図せず `.claude/instincts/raw/` にゴミファイルを蓄積させてしまい、申し訳ありませんでした。

v1.6 では観察システムを根本から見直し、本当に役立つデータだけを収集するよう改設計しました。

### New: Cleanup Scripts

過去バージョンで蓄積されたゴミデータを削除するスクリプトを追加しました。

**日本語版（Windows）:**
```powershell
Set-ExecutionPolicy -Scope Process -ExecutionPolicy Bypass
.\cleanup.ps1 -ProjectPath "C:\path\to\your\project"
```

**日本語版（macOS/Linux）:**
```bash
chmod +x cleanup.sh
./cleanup.sh /path/to/your/project
```

**英語版（Windows）:**
```powershell
Set-ExecutionPolicy -Scope Process -ExecutionPolicy Bypass
.\cleanup_en.ps1 -ProjectPath "C:\path\to\your\project"
```

**英語版（macOS/Linux）:**
```bash
chmod +x cleanup_en.sh
./cleanup_en.sh /path/to/your/project
```

スクリプトは以下を削除します（存在しない場合は自動スキップ）:
- `.claude/instincts/raw/observations.jsonl`
- `.claude/instincts/raw/patterns_*.json`
- `.claude/hooks/extract-patterns.js`

### Changed: Observation System Redesign

観察システムを以下のように再設計しました:

| | v1.5 以前 | v1.6 |
|---|---|---|
| 記録対象 | 全ツール実行（Read・Edit・Bash・Glob 等） | Bash コマンドのみ |
| 記録先 | `observations.jsonl` | `bash-log.jsonl` |
| 自動パターン抽出 | あり（`extract-patterns.js`） | なし（廃止） |
| `/cluster-promote` の分析元 | `patterns_*.json`（ツール連鎖のみ） | `bash-log.jsonl` の失敗記録 + セッション `.tmp` ファイルの振り返り |

**v1.6 の `/cluster-promote` が分析するもの:**
- `bash-log.jsonl` — Bash コマンドの失敗記録（コマンド内容・エラー出力）→ **ルール候補**
- `memory/sessions/*.tmp` — セッション終了時に手書きした「うまくいったこと・失敗したこと」→ **スキル候補・ルール候補**

### Removed
- `extract-patterns.js` — 自動パターン抽出スクリプトを廃止
- `stop.js` から観察データ件数の集計・`extract-patterns.js` 呼び出しを削除
- `pre-tool.js` から全ツール記録処理を削除

### Upgrade

**ステップ 1: ゴミデータを削除する（上記クリーンアップスクリプトを実行）**

**ステップ 2: フックファイルを更新する（セットアップスクリプトを再実行）**

**日本語版（Windows）:**
```powershell
.\setup.ps1 -ProjectPath "C:\path\to\your\project"
```

**日本語版（macOS/Linux）:**
```bash
./setup.sh /path/to/your/project
```

**英語版（Windows）:**
```powershell
.\setup_en.ps1 -ProjectPath "C:\path\to\your\project"
```

**英語版（macOS/Linux）:**
```bash
./setup_en.sh /path/to/your/project
```

> **Note:** セットアップスクリプトは既存の `.claude/` を検出した場合に上書き確認を行います。`y` を入力すると新しいフックファイルが配置されます。

---

## [v1.5.0] - 2026-04-08

### Features
- **`isolation: "worktree"` for parallel development** — `worktree-developer` agents now launch via `Agent({ isolation: "worktree" })` instead of `EnterWorktree`. Each agent automatically receives a dedicated, isolated Git worktree. This resolves the `Already in a worktree session` conflict that occurred when two agents called `EnterWorktree` concurrently (fixes [clade#1](https://github.com/satoh-y-0323/clade/issues/1)).
- **`group-config.json` for group ID tracking** — Because `isolation: "worktree"` assigns auto-generated worktree names, each `worktree-developer` now writes `.claude/group-config.json` at startup to record its assigned group ID. The `check-group-isolation.js` hook reads this file first (falling back to CWD-based detection for backwards compatibility).
- **`settings.local.json.example` template** — A recommended `settings.local.json` configuration is now included in both `.claude/` and `templates/en/.claude/`. Setup scripts deploy this as `settings.local.json` automatically during setup.
- **Auto-deploy `settings.local.json` in setup scripts** — All four setup scripts (`setup.sh`, `setup.ps1`, `setup_en.sh`, `setup_en.ps1`) now include a `[2/4]` step that copies `settings.local.json.example` to `settings.local.json`, with an overwrite prompt if the file already exists.

### Bug Fixes
- **Fix `enable-sandbox.js` in Git worktrees** — The sandbox enable script now detects when it is running inside a Git worktree and exits early, preventing errors during worktree agent startup.
- **Fix permissions for `isolation: "worktree"` agents** — `isolation: "worktree"` agents read `settings.local.json` instead of `settings.json`. Added `Read(**)`, `Glob(**)`, `Grep(**)`, `Bash(git:*)`, and `Bash(node*)` to `settings.local.json.example` so parallel agents have the permissions they need.
- **Fix `settings.json` permissions cleanup** — Removed redundant and overly broad permission entries introduced during debugging.

### Documentation
- Added `## 設定ファイル` / `## Settings Files` section to `CLAUDE.md` (ja/en) explaining the role of `settings.local.json` and why it is required for `isolation: "worktree"` agents.

### Upgrade

Re-run the setup script on your existing project to apply the changes:

**English (Windows):**
```powershell
.\setup_en.ps1 -ProjectPath "C:\path\to\your\project"
```

**English (macOS/Linux):**
```bash
./setup_en.sh /path/to/your/project
```

**Japanese (Windows):**
```powershell
.\setup.ps1 -ProjectPath "C:\path\to\your\project"
```

**Japanese (macOS/Linux):**
```bash
./setup.sh /path/to/your/project
```

> **Note:** The setup script will prompt before overwriting an existing `settings.local.json`.

---

## [v1.4.0] - 2026-04-08

### Features
- **Parallel development** — The planner can now define `parallel_groups` in plan-report YAML frontmatter to split work across independent agent groups. `agent-developer` detects parallel groups, launches multiple `worktree-developer` agents in background (each in an isolated Git worktree), and automatically triggers the merger when all groups complete.
- **`worktree-developer` agent** — New background-only agent that enters a dedicated worktree via `EnterWorktree`, implements the assigned group's tasks with file-ownership enforcement, and exits with a branch name for the merger.
- **`merger` agent** — New agent that merges all worktree branches into the base branch after parallel development. Detects conflicts and guides the user through resolution with `AskUserQuestion`.
- **File ownership enforcement** — New `check-group-isolation.js` hook (defined in `worktree-developer` frontmatter hooks) blocks `Write`, `Edit`, and `Bash rm` operations that target files outside the group's assigned scope, preventing cross-group interference.

### Bug Fixes
- **Fix approval flow in background sub-agents** — `code-reviewer` and `security-reviewer` sub-agents were using `AskUserQuestion` directly, but background sub-agents cannot display dialogs. Approval flow has been moved to the parent Claude (`agent-code-reviewer` / `agent-security-reviewer` commands).
- **Rename `reviewer.md` → `code-reviewer.md`** — Agent file renamed for consistency with the command name and report naming convention.
- **Milestone orchestration moved to parent Claude** — Milestone progress confirmation and tester coordination were removed from the `developer` agent (incompatible with background execution) and consolidated into the `agent-developer` command.

### Upgrade

Re-run the setup script on your existing project to apply the changes:

**English (Windows):**
```powershell
.\setup_en.ps1 -ProjectPath "C:\path\to\your\project"
```

**English (macOS/Linux):**
```bash
./setup_en.sh /path/to/your/project
```

**Japanese (Windows):**
```powershell
.\setup.ps1 -ProjectPath "C:\path\to\your\project"
```

**Japanese (macOS/Linux):**
```bash
./setup.sh /path/to/your/project
```

---

## [v1.3.3] - 2026-04-07

### Bug Fixes
- **Fix multi-turn conversation in all agents** — SubAgents were spawning a new Agent invocation for each question, causing context loss and inefficiency. All 9 agents (ja + en templates) now explicitly use the `AskUserQuestion` tool for interactive questions, enabling true multi-turn conversation within a single agent session.

### Upgrade

Re-run the setup script on your existing project to apply the changes:

**English (Windows):**
```powershell
.\setup_en.ps1 -ProjectPath "C:\path\to\your\project"
```

**English (macOS/Linux):**
```bash
./setup_en.sh /path/to/your/project
```

**Japanese (Windows):**
```powershell
.\setup.ps1 -ProjectPath "C:\path\to\your\project"
```

**Japanese (macOS/Linux):**
```bash
./setup.sh /path/to/your/project
```

---

## [v1.3.2] - 2026-04-07

### Bug Fixes
- **Fix broken rule file paths in all agent files** — All 7 workflow agents (ja + en templates) referenced non-existent `.claude/rules/*/name.md` paths in their `## Rules to Load` / `## 読み込むルールファイル` sections. The actual detailed rules live in `.claude/skills/agents/`. Agents were silently failing to load their full ruleset. Paths now correctly point to `.claude/skills/agents/name.md`.
- **Deduplicate Pre-Work Checks and Report Output sections** — Verbose content in `agents/*.md` that duplicated (and in some cases contradicted) `skills/agents/*.md` has been replaced with one-line delegations. This also fixes tester/reviewer/security-reviewer agents that were only checking `plan-report` for pre-work, while the skills files correctly require checking `requirements-report`, `architecture-report`, and `plan-report`.

### Upgrade

Re-run the setup script on your existing project to apply the changes:

**English (Windows):**
```powershell
.\setup_en.ps1 -ProjectPath "C:\path\to\your\project"
```

**English (macOS/Linux):**
```bash
./setup_en.sh /path/to/your/project
```

**Japanese (Windows):**
```powershell
.\setup.ps1 -ProjectPath "C:\path\to\your\project"
```

**Japanese (macOS/Linux):**
```bash
./setup.sh /path/to/your/project
```

---

## [v1.3.1] - 2026-04-07

### Bug Fixes
- **Heredoc-based report output** — `write-report.js` now reads content from stdin when no content argument is provided. Agents are instructed to pass report content via heredoc (`<<'REPORT'`), which eliminates the OS command-line argument length limit (~8,000 characters) and preserves newlines correctly. The previous split `new` → `append` approach caused missing newlines at chunk boundaries.
- **Prohibit retrying on argument-length errors** — Added a rule to `core.md` (ja/en): if a Bash command fails due to argument length limits, agents must stop and report the error to the user instead of silently trying alternative approaches.

### Upgrade

Re-run the setup script on your existing project to apply the changes:

**English (Windows):**
```powershell
.\setup_en.ps1 -ProjectPath "C:\path\to\your\project"
```

**English (macOS/Linux):**
```bash
./setup_en.sh /path/to/your/project
```

**Japanese (Windows):**
```powershell
.\setup.ps1 -ProjectPath "C:\path\to\your\project"
```

**Japanese (macOS/Linux):**
```bash
./setup.sh /path/to/your/project
```

---

## [v1.3.0] - 2026-04-06

### Features
- **VS Code extension environment check** — On session start, Clade now detects whether it is running inside the VS Code extension or the CLI. If the VS Code extension is detected, users are warned about the parallel background execution limitation and can choose to continue in sequential mode or switch to CLI with guided instructions.
- **Milestone-based workflow** — `plan-report` now supports milestones. When milestones are defined, the planner asks whether to run in `confirm` mode (pause after each milestone) or `auto` mode (continue automatically). The developer commits at each milestone boundary accordingly.

### Bug Fixes
- **`sandbox` config format** — Changed `sandbox` from `true` (boolean) to an object (`{ enabled, autoAllowBashIfSandboxed, ... }`). The boolean form caused a settings parse error on CLI startup, which silently disabled all `permissions.allow` entries.
- **Removed `httpProxyPort: null` and `socksProxyPort: null`** — These fields must be a number or omitted entirely; `null` caused a settings validation error.

### Documentation
- Removed GitHub MCP references from README setup instructions (`-MCP` / `--mcp` flag, PAT explanation, `github` MCP server entry in the built-in servers table)
- Added CLI recommendation and VS Code extension behavior explanation to README
- Added `CHANGELOG.md`

### Upgrade

Re-run the setup script on your existing project to apply the changes:

**English (Windows):**
```powershell
.\setup_en.ps1 -ProjectPath "C:\path\to\your\project"
```

**English (macOS/Linux):**
```bash
./setup_en.sh /path/to/your/project
```

**Japanese (Windows):**
```powershell
.\setup.ps1 -ProjectPath "C:\path\to\your\project"
```

**Japanese (macOS/Linux):**
```bash
./setup.sh /path/to/your/project
```

---

## [v1.2.0] - 2026-04-06

### Refactoring
- Replace GitHub MCP with gh CLI for GitHub operations
  - Remove `--mcp` / `-MCP` setup flag and PAT management
  - Add gh CLI presence and auth status check to setup scripts
  - `GITHUB_PERSONAL_ACCESS_TOKEN` is no longer required

### Features
- Add per-agent GitHub operation permissions
  - Read-only `gh` commands are auto-approved via `permissions.allow`
  - Write operations are gated by confirmation dialog
  - Permissions are defined directly in each agent file

### Bug Fixes
- Fix `permissions.allow` path patterns and hooks format in `settings.json`
- Allow absolute paths in `permissions.allow`

---

## [v1.1.1] - 2026-04-05

### Bug Fixes
- **English template: `settings.json` was missing** — Added `templates/en/.claude/settings.json` which was absent in v1.1.0. Users who set up with the English template were repeatedly prompted for permission every time a Clade hook script ran.
- Auto-approve all internal Clade hook scripts via `permissions.allow` (`write-report.js`, `record-approval.js`, `clear-file-history.js`, `enable-sandbox.js`, `manage-playwright-origins.js`)

---

## [v1.1.0] - 2026-04-04

### Features
- **English template** — Added `templates/en/.claude/` with full English translation of all template files
- Added `setup_en.ps1` (Windows) and `setup_en.sh` (macOS/Linux) for English setup
- **macOS/Linux support** — Added `setup.sh` for macOS/Linux users (Japanese template)

---

## [v1.0.0] - 2026-04-04

Initial release.

- 7 role-based agents: interviewer, architect, planner, developer, tester, code-reviewer, security-reviewer
- Structured workflow: Requirements → Design → Planning → Implementation → Testing → Review
- Human-in-the-loop approval at every phase
- Session memory: automatically saves and restores work across sessions
- MCP server support: Playwright, Memory, Sequential-thinking
- Project-contained by default — all config lives in `.claude/`
- Promote skills and rules to global scope with `/promote`
