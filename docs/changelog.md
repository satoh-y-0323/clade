# 変更履歴

## [v1.26.0] - 2026-04-24

### New

- `plan-to-manifest.js`: clade-parallel v0.6.0 の `max_retries` フィールドに対応。plan-report フロントマターのグループに `max_retries: N` を指定すると manifest に出力される。省略時（デフォルト 0）は行を出力しない
- `agent-planner.md`: フィールド説明テーブルに `group-*.max_retries` を追加

## [v1.25.0] - 2026-04-24

### New

- `plan-to-manifest.js`: `phase_scales` フィールドのサポートを追加。plan-report フロントマターに `phase_scales: { developer: medium, reviewer: small }` と記述するだけでタイムアウト値を自動解決。グループ直書きの `timeout_sec` が優先される（後方互換あり）
- `agent-planner.md`: `phase_scales` の記述方法と scale 判断基準（small: 1〜2タスク / medium: 3〜5 / large: 6以上）を追記。`core.md` からタイムアウト数値の目安ブロックを削除しトークン節約

### Fix

- `hook-utils.js`: `path` モジュール未 require（`getProjectRoot` が worktree 環境で常にフォールバックしていた問題）を修正
- `write-file.js`: CLI の `--path`/`--file` 引数にパストラバーサル防御を追加
- `pre-tool.js`: `rm` ブロックパターンを強化（`-rfv`・`-fr` 等の複合フラグ変形に対応）。`--force-with-lease` を警告対象に追加
- `apply-diff.js`・`write-report.js`・`record-approval.js`: パストラバーサル防御・パス検証を追加
- `stop.js`: `wx` フラグによる排他書き込み・Markdown インジェクション対策
- `update-clade-section.js`・`cluster-promote-core.js`: ANSI サニタイズ・バリデーション強化
- `statusline.js`: stdin タイムアウト（5秒）・サイズ制限（64KB）追加
- `enable-sandbox.js`: `enableWeakerNestedSandbox: false` ハードコードバグを修正（`true` に変更）
- `clade-update.js`: SSRF 防止・パストラバーサル防御・ダウンロードサイズ上限・リダイレクト上限を追加

## [v1.24.2] - 2026-04-23

### Fix

- `plan-to-manifest.js`: reviewer 並列実行の出力指示を標準フロー（`clear-tmp-file.js` → Write ツールで tmp → `write-report.js --file`）に統一。`write-report.js` 直接呼び出しを廃止
- `plan-to-manifest.js`: `read_only: true` タスクに `cwd: ../..` を自動付与（`write-report.js` が `process.cwd()` を使うためリポジトリルートからの実行が必要）

### Changed

- `agent-planner.md`: `timeout_sec` / `idle_timeout_sec` の目安値を小/中/大規模の3段階で明記。`read_only: true` タスクで runner.py が強制的に `idle_timeout_sec` を None にする挙動を注記に追加
- `core.md` Phase 3 / Phase 4 にタイムアウト値の目安と reviewer の cwd 自動付与を注記として追加

## [v1.24.1] - 2026-04-23

### Changed

- developer 並列実行の判断ロジックを `agent-developer.md` から `core.md` Phase 3 に移動。reviewer 並列実行（Phase 4）と同じ構造に統一し、`agent-developer.md` をシンプルモード・マイルストーンモードのみに簡素化

## [v1.24.0] - 2026-04-23

### New

- `plan-to-manifest.js` に `--phase developer|reviewer` オプションを追加。developer フェーズと reviewer フェーズのマニフェストを個別生成できるようになり、フルワークフローで developer 並列 → tester → reviewer 並列の多段並列実行が可能になった
- `parallel_groups` に `phase` フィールドを追加（`phase: developer` / `phase: reviewer`。省略時は developer 扱いで後方互換）
- `core.md` Phase 4 に clade-parallel による reviewer 並列実行フローを追加（code-reviewer + security-reviewer を同時実行）
- `core.md` の逐次実行ルールに clade-parallel 除外注記を追加（別プロセス起動のため permissions race condition が発生しない）
- `clade-parallel-manifest.md` に `phase` フィールド仕様・フルワークフロー例・マルチラウンド制約を追記

## [v1.23.1] - 2026-04-23

### Fix

- `clade-manifest.json` の `skills` リストに `project/planner/clade-parallel-manifest.md` が漏れていた問題を修正。v1.23.0 で追加されたこのファイルが `/update` 経由でユーザーに配布されていなかった

## [v1.23.0] - 2026-04-23

### New

- `CLAUDE.md` に `## Compact Instructions` セクションを追加（Clade 管理）。コンテキスト圧縮時に保持する情報（設計判断・決定事項・解決済みハマりどころ・進行中ステータス）と破棄する情報（雑談・解決済みエラーログ・冗長コード断片・期限切れタスク）を明示
- `plan-to-manifest.js` を clade-parallel v0.5 マニフェスト仕様に対応。グループごとに `timeout_sec`（省略時デフォルト 900）・`idle_timeout_sec`（worktree-developer 必須）・`read_only`（YAML boolean）を frontmatter から読み取って生成マニフェストに反映
- `skills/project/planner/clade-parallel-manifest.md` を追加。v0.5 マニフェストの記述ルールをプランナー専用スキルとして提供

### Fix

- `plan-to-manifest.js` の `clade_plan_version` を `"0.3"` に戻す。マニフェストフォーマットバージョンと clade-parallel ツールバージョンは独立して管理されるため

## [v1.22.0] - 2026-04-21

### New

- `worktree-developer` エージェントを追加。`isolation: "worktree"` で動作する非対話型 developer エージェント。clade-parallel による並列開発時に、各 worktree で独立してタスクを実装・コミットして終了する
- `plan-to-manifest.js` フックを追加。`plan-report` の YAML フロントマターから `parallel_groups` を読み取り、clade-parallel 用マニフェストを `.claude/manifests/` に生成する。完全一致・glob 包含・固定プレフィックス重複の 3 パターンによる静的衝突チェック付き
- `check-writes-isolation.js` フックを追加。clade-parallel の worktree エージェントが担当範囲外のファイルに書き込もうとした場合に PreToolUse でブロックする
- `agent-developer` に並列実行モードを追加。`plan-report` に `parallel_groups` が含まれ clade-parallel がインストールされている場合、各 worktree で `worktree-developer` を起動する並列実行フローに分岐する
- `agent-planner` の出力仕様に `parallel_groups` フロントマター定義を追加。clade-parallel 対応の計画を作成する際のタスク分割・依存関係定義の書式を規定

### Fix

- `settings.json` の `permissions.allow` に `.claude/` 配下への Write パーミッションを明示追加（`Write(**)` では `.claude/` 配下への直接 Write に確認ダイアログが出る問題を解消）
- `settings.json` の `permissions.allow` にフックスクリプト 6 件の Bash 実行許可を追加（`check-writes-isolation.js` / `clade-update.js` / `cluster-promote-core.js` / `plan-to-manifest.js` / `statusline.js` / `update-clade-section.js`）

## [v1.21.2] - 2026-04-20

### Fix

- `record-approval.js` にシェルインジェクション対策の `--comment-file <path>` オプションを追加。承認コメントに含まれるシェルメタ文字（`"`、`$`、`;` など）がコマンド文字列経由で渡されて実行される脆弱性を防ぐ。7 エージェントの呼び出し側（architect / code-reviewer / security-reviewer / planner / interviewer / doc-writer / workflow-builder テンプレート）を tmp ファイル経由方式に更新。レガシーの位置引数方式も後方互換で維持
- `workflow-builder` が生成するエージェントファイル一式で、サブエージェント定義ファイル（`.claude/agents/{name}.md`）が生成指示から抜けていた問題を修正。漏れがあると `/agent-{name}` 実行時に `subagent_type` が解決できずエラーになる
- `agent-planner` に「上流レポート・既存 plan-report の有無に関わらず必ず Q&A を実施する」予防ガードを追加（v1.21.1 の `agent-architect` と同パターン）
- `doc-writer` の権限セクションに残っていた「`.claude/reports/` への直接 Write は禁止」の矛盾を削除（v1.21.1 で Output セクションは修正済みだったが冒頭警告と権限欄に残存していた）
- `code-reviewer` / `security-reviewer` / `architect` の権限セクションを `report-output-common.md` フロー（tmp への Write + write-report.js 経由）に整合。interviewer/planner/tester と同じ書式に統一
- `workflow-builder` の実行許可リストに `clear-tmp-file.js` を追記（report-output-common.md のフローで必要）
- `architect` の frontmatter から未使用の `Edit` ツール宣言を削除（skills/architect.md の禁止事項と整合）

### New

- サブエージェント逐次実行ルールを `.claude/rules/core.md` に追加。Claude Code の permissions チェッカーが並列実行に構造的に対応していないため、並列サブエージェント起動は race condition で許可/拒否が非決定的になる。特に Phase 4 の Step 6（code-reviewer）と Step 7（security-reviewer）を依存関係なしと判断して並列化してしまう誤用パターンを明示して禁止

## [v1.21.1] - 2026-04-20

### Fix

- `agent-architect` が既存の requirements-report がある場合に Q&A をスキップして設計に進む問題を修正。architect の本来の役割（掘り下げ）を保つため、常に最低限の Q&A（設計スコープ確認・深堀り点確認）を実施してからサブエージェントを起動するよう変更

### Changed

- `doc-writer` / `project-setup` のサブエージェントを `Write` ツール直接使用に変更。v1.20.1 で導入された write-file.js 経由ルールは SendMessage 継続後の Write DENIED 対策だったが、v1.21.0 の新アーキテクチャ（一発起動型）では不要になったため
- `mcp-setup` の write-file.js 関連記述をクリーンアップ（既に Write 権限はあった）

## [v1.21.0] - 2026-04-19

### Changed

- 全対話型エージェント（interviewer / architect / planner / tester / code-reviewer / security-reviewer）を「親 Claude が Q&A・承認確認を担当、サブエージェントはレポート生成のみ実行して終了」するアーキテクチャに刷新（SendMessage / AskUserQuestion を廃止）
- `workflow-builder` / `project-setup` / `mcp-setup` / `doc-writer` も同アーキテクチャに対応
- 各エージェントの frontmatter `tools:` から `AskUserQuestion` を削除

### New

- `templates/en/.claude/agents/workflow-builder.md` を新規追加（EN テンプレートに欠落していたファイル）

## [v1.20.2] - 2026-04-19

### New

- `clear-tmp-file.js` フックを追加: レポート出力フローの Step 0 として `.claude/tmp/<baseName>.md` を事前削除することで、2回目以降の実行で発生する「既存ファイル上書き確認プロンプト」を防止する

## [v1.20.1] - 2026-04-19

### Fix

- `/agent-project-setup` が対話を SendMessage で継続した後、バックグラウンド扱いになって `Write` ツールの権限を失い、`coding-conventions.md` の生成に失敗する問題を修正。`project-setup` エージェントの書き込みフローを `Write` から `write-file.js`（Bash 経由）に切り替えた

### Changed

- `project-setup` / `doc-writer` エージェント定義に「書き込み時は必ず相対パスで呼び出す」警告ブロックを追加。絶対パスに変換されると `permissions.allow` のパターン（`Bash(node .claude/hooks/write-file.js*)`）にマッチせず DENIED / 確認プロンプトが出る問題を未然に防止

## [v1.20.0] - 2026-04-19

### Changed

- レポート出力フローを全レポート出力エージェント（interviewer / architect / planner / tester / code-reviewer / security-reviewer）で共通化。`Write` ツールで `.claude/tmp/<baseName>.md` に書き込み、`write-report.js --file` で読み込ませる二段階方式に統一。OS の引数文字数制限（目安 8,000 文字）に左右されず、長大なレポートも安定して保存できる
- planner の実行モード判定を「plan-report の有無」から「最新 plan-report と requirements/architecture のタイムスタンプ比較」に変更。新しい要件で仕切り直したとき、自動的に初回モードに戻るようになった

### New

- 「現サイクル」の概念を導入。最新 plan-report のタイムスタンプ T_plan を基準に、下流レポート（test / code-review / security-review）は T_plan より新しいもののみを参照するルールを追加。前サイクルの古いレポートが次サイクルに混入することを防ぐ

### Fix

- v1.19.0 で削除した並列開発関連ファイル（`agents/merger.md` / `agents/worktree-developer.md` / `hooks/check-group-isolation.js`）を `clade-manifest.json` の `removed_files` に追加。既存ユーザーが `/update` を実行すると古いファイルが自動削除される

## [v1.19.0] - 2026-04-18

### Changed

- 並列実行サポートを廃止し、直列実行に一本化。Claude Code の permissions チェッカーで並列 subagent 起動時に race condition が発生し、全 tool が 76% の確率で DENIED される問題が根本原因
- `worktree-developer` エージェントを削除
- `merger` エージェントを削除
- `check-group-isolation.js` フックを削除
- `agent-developer` コマンドから並列モード（parallel_groups）を除去
- `agent-code-reviewer` / `agent-security-reviewer` コマンドから並列起動指示を除去
- planner スキルから `parallel_groups` YAML フロントマター定義を除去
- `settings.json` から `Bash(git worktree*)` / `Bash(cd * && git*)` 権限を削除

---

## [v1.18.4] - 2026-04-18

### Fix

- バックグラウンドエージェントが `write-report.js` を絶対パスで呼び出すと `permissions.allow` のパターン（`Bash(node .claude/hooks/write-report.js*)`）にマッチせず拒否される問題を修正。`reviewer-common.md` に「相対パス必須・絶対パス禁止」の明示ルールを追加

---

## [v1.18.3] - 2026-04-18

### Fix

- レビューエージェントがバックグラウンド並列実行時にレポートを書き込めない問題を修正。Claude Code の権限チェックは Bash コマンド全体（ヒアドキュメント本文含む）の文字数に上限があり、レポートが長い場合に無条件拒否されていた。`reviewer-common.md` の出力フローを「必ず分割出力・1回 2000 文字以内」に変更することで対処

---

## [v1.18.2] - 2026-04-18

### Fix

- `code-reviewer` / `security-reviewer` のスキルファイルが参照するチェックリストパスが古いままだった問題を修正。チェックリストをサブフォルダへ移動した際に `skills/agents/` 側の参照パスが更新されておらず、レビュー時にチェックリストが読み込まれない状態だった

---

## [v1.18.1] - 2026-04-17

### Fix

- `/update` 実行後に旧パスのファイルが残存する問題を修正。`clade-manifest.json` に `removed_files` フィールドを追加し、ファイルが別パスへ移動された際に旧パスのファイルを自動削除するようになった

---

## [v1.18.0] - 2026-04-17

### New

- `/update` コマンドに対話型の差分処理ループを追加。`settings.json` / `settings.local.json` に差分がある場合は内容を表示して上書きするかユーザーに確認し、拒否された場合は `.new` ファイルを残して手動マージを案内するようになった
- `clade-manifest.json` に `protected_files` カテゴリを追加。`memory/memory.json` のような蓄積データを `/update` から保護し、既存ファイルがある場合は一切上書きしないよう変更
- ローカル `clade-manifest.json` の新フィールド `language` で JA/EN を識別するようになった。`setup_en.sh` / `setup_en.ps1` でセットアップされた EN 版プロジェクトで `/update` を実行すると、リリースの英語版テンプレートから正しく更新される

### Fix

- `/update` で配布対象にもかかわらず更新されていなかったファイルを `clade-manifest.json` に登録: `agent-doc-writer.md`, `context-gauge.md`, `cluster-promote-core.js`, `update-clade-section.js`, `group-config.json`, `skills/project/code-reviewer/code-review-checklist.md`, `skills/project/security-reviewer/security-review-checklist.md`, `skills/project/mcp-servers.md`, `skills/project/playwright-mcp.md`
- EN 版のセットアップ（`setup_en.sh` / `setup_en.ps1`）では `.claude/VERSION` と `.claude/clade-manifest.json` が配置されず `/update` コマンドが動作しなかった問題を修正
- `setup_en.ps1` に `[Console]::OutputEncoding = [System.Text.Encoding]::UTF8` を追加して `setup.ps1` と挙動を揃えた

---

## [v1.17.3] - 2026-04-17

### Fix

- `settings.json` の `enableWeakerNestedSandbox` を `true` に変更。サブエージェントが sandbox 内で Bash を実行できず write-report.js が一切呼び出せなかった根本原因を解決

---

## [v1.17.2] - 2026-04-17

### Fix

- tester・planner・architect・code-reviewer・security-reviewer・reviewer-common の全レポート出力フローに追記モード（append）と失敗時フォールバックを追加
- code-reviewer・security-reviewer スキルファイルのヒアドキュメント terminator インデントバグを修正
- Bash 書き込みが失敗した場合、サブエージェントが単独で諦めず親 Claude へ委譲するよう明示指示を追加

---

## [v1.17.1] - 2026-04-17

### Fix

- `hook-utils.js` に `isWorktree()` を追加。worktree 内から実行された場合は `stop.js`・`pre-compact.js` が即時終了するよう修正。worktree エージェントがメインリポジトリのセッションファイルを上書きする問題を根本解決

---

## [v1.17.0] - 2026-04-17

### New

- worktree 並列開発の権限設定を修正。`settings.local.json.example` の git 権限パターンを個別化し、`cd && git` 複合コマンドの許可・`.claude/` 配下への Write/Edit 権限を追加
- `settings.json` に merger エージェント向けの `git -C`・`git checkout` 権限を追加
- merger エージェントに `cd /path && git ...` 禁止ルールを冒頭追加
- `hook-utils.js` に `getProjectRoot()` を追加。worktree 実行時も `stop.js`・`pre-compact.js` がメインリポジトリのセッションファイルに正しく書き込めるよう修正
- `group-config.json` をデフォルト値で配布に追加

---

## [v1.16.7] - 2026-04-16

### Fix

- SendMessage 継続フローの agentId 処理を改善。終了条件を「agentId が消えた時」から「レポート/ドキュメント承認時」に変更。複数の agentId 行が出力された場合は最後の行を使用。保存済み agentId を後続ターンでも使い続ける。中断時に SendMessage で終了メッセージを送る手順を追加
- doc-writer・mcp-setup・project-setup に「AskUserQuestion は使わず 1 問ずつテキストで返す」指示を追加。複数の質問が一度にまとめて出力される問題を修正

対象: agent-interviewer・agent-architect・agent-planner・agent-doc-writer・agent-mcp-setup・agent-project-setup

---

## [v1.16.6] - 2026-04-16

### Fix

- doc-writer・mcp-setup・project-setup のコマンドファイルに SendMessage 継続フローを追加。複数ターンのヒアリング対話が必要なユーティリティエージェントでも、ユーザーの回答ごとに新しいエージェントを再スポーンしていた O(N²) トークン消費を O(N) に改善する（v1.16.3 で interviewer・architect・planner に適用した修正と同等）

---

## [v1.16.5] - 2026-04-16

### New

- `settings.json` に `CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS=1` を追加。Agent Teams を有効にすることで、インタビュアー・アーキテクト・プランナーが SendMessage によって同一エージェントを継続できるようになり、ユーザーとの対話ごとにエージェントを再スポーンする O(N²) トークン消費を O(N) に改善する

---

## [v1.16.4] - 2026-04-16

### Fix

- `"type": "module"` を持つプロジェクトで hooks が ES モジュールとして解釈され `require is not defined` エラーになる問題を修正。`.claude/hooks/package.json`（`{"type": "commonjs"}`）を追加し、hooks ディレクトリを CommonJS として明示することで解決

---

## [v1.16.3] - 2026-04-16

### Fix

- インタビュアー・アーキテクト・プランナーのコマンドファイルに SendMessage による継続フローを追加。ユーザーの回答ごとに新しいエージェントを再スポーンしていた問題（O(N²) トークン消費）を修正。agentId を保存して SendMessage で同一エージェントを継続させることで O(N) に改善する

---

## [v1.16.2] - 2026-04-16

### Fix

- `/update` コマンドのブートストラップ問題を修正。`clade-update.js` は自分自身をスキップする設計のため、スクリプトに新しいハンドラを追加しても旧スクリプトで実行すると有効にならなかった。二段階更新方式（`--apply-files` 内部モード）を導入し、Stage 1 で新スクリプトをディスクにコピーしてから Stage 2 として別プロセスで起動することで、新コードが同一更新実行内で使用されるようになった

---

## [v1.16.1] - 2026-04-16

### Fix

- `/update` コマンドがエージェント定義・エージェントスキル・スキルファイルを更新しないバグを修正。`clade-manifest.json` に `agents`・`agent_skills` セクションを追加し、`clade-update.js` にコピーハンドラを実装した

---

## [v1.16.0] - 2026-04-16

### New

- インタラクティブエージェント（interviewer・architect・planner）に `background: false` を追加。Claude Desktop など将来的にデフォルトがバックグラウンド実行に変わった場合でも、ユーザーとの対話が必要なエージェントが必ずフォアグラウンドで実行されることを保証する

### Fix

- セットアップスクリプトが `.claude/` をまるごとコピーする際、配布用リポジトリ固有の `rules/local.md` がユーザープロジェクトに混入するバグを修正

---

## [v1.15.0] - 2026-04-15

### New

- `/agent-doc-writer` を追加。Mermaid図・README・操作手順書・API仕様書・逆引き仕様書などのドキュメント生成に特化したユーティリティエージェント。対象・読み手・目的・粒度を事前にヒアリングしてから生成するため、細かすぎる出力を防げる。

---

## [v1.14.5] - 2026-04-14

### Fix

- `statusline.js` のリセット時刻が表示されない不具合を修正。Claude Code が `rate_limits.resets_at` を Unix タイムスタンプ（秒）で渡しているのに `new Date()` がミリ秒として解釈し、1970年1月の日付になっていた。数値の場合は `× 1000` してミリ秒に変換するよう修正

---

## [v1.14.4] - 2026-04-14

### New

- `getting-started.md` にワークフロー選択ガイドを追加。「直接指示でOK / `/agent-developer` から / フルワークフロー」の3段階を具体例付きで解説し、`/init-session` のトリアージ機能との連携も案内

---

## [v1.14.3] - 2026-04-14

### New

- `/init-session` にタスク規模トリアージを追加。新しいタスクを開始する際に small / medium / large の3択で作業規模を選ぶと、適切なワークフロー（直接指示 / `/agent-developer` / フルワークフロー）を案内するようになった

---

## [v1.14.2] - 2026-04-14

### Fix

- `setup.ps1` の文字化け修正: bash 経由で実行した際に日本語が CP932 で出力されていた問題を修正。スクリプト先頭に `[Console]::OutputEncoding = UTF8` を追加し、UTF-8 で正しく出力されるようにした

---

## [v1.14.1] - 2026-04-13

### Fix

- `context-gauge.md` を EN テンプレートにも正しく同期するよう修正（`ja_only` の誤分類を解消）
- EN 版 `context-gauge.md` のゲージ説明を rate_limits 対応後の表示形式に更新

---

## [v1.14.0] - 2026-04-13

### New

- `statusline` にラベルと `rate_limits` 対応を追加。`context usage:` ラベルを先頭に表示し、プランが rate_limits データを提供する場合（Pro・Max など）は `5hour limits:` と `7day limits:` のゲージ・使用率・リセット時間を横並びで表示する

### Changed

- `core.md` から cli.js に既に組み込まれているルール4件を削除（重複排除によるトークン節約）

---

## [v1.13.0] - 2026-04-12

### New

- `/end-session` に `--no-promote` フラグを追加（昇格候補提示ステップをスキップ）
- session-start hook を廃止し `/init-session` 手動実行に統一（system-reminder サイズ制限の回避）

### Fix

- `.tmp` 読み込み時に `CLADE:SESSION:JSON` ブロックを除去してトークン消費を削減
- `agent-workflow-builder` の追記先を `/update` で消えない `## User Agents` セクションに変更
- `cluster-promote` エラーメッセージのセクション名を修正（`## Global Rules` → `## User Rules`）

---

## [v1.12.0] - 2026-04-11

### New

- `update-clade-section.js` に `remove-rule` サブコマンドを追加（`add-rule` と対称的な設計）

### Fix

- `.tmp` フォーマットに `CLADE:SESSION:JSON` ブロックを追加し、機械的パースの耐性を向上
- `stop.js` が事実ログ更新時に JSON ブロックを消してしまうバグを修正

---

## [v1.11.0] - 2026-04-11

### New: 整理コマンドの追加

- `/prune-rules` — `/cluster-promote` で昇格したルールを対話形式で整理。重複・類似ルールの統合と孤立クラスタの削除をサポート
- `/prune-reports` — 蓄積したレポートファイルを種別ごとに直近N件を残して削除

### Fix

- セッション開始時のセットアップ未実行警告が誤発していた問題を修正（`settings.local.json` の有無で判定するよう変更）
- `/cluster-promote` のセクション見出し照合を部分一致に変更し、見出しの微妙なバリエーションで候補が抽出されなくなる問題を修正

---

## [v1.10.1] - 2026-04-11

### Fix

- `/cluster-promote` で昇格したルールが Global Rules に追記されていた問題を修正。正しく User Rules セクションに追記されるよう改善
- `.claude/instincts/raw/` ディレクトリを `.gitignore` に追加。個人データが誤って GitHub に公開されるのを防止

---

## [v1.10.0] - 2026-04-11

### New: 育てる動線の強化

- `/end-session` に昇格候補の提示機能を統合。セッション終了時に `/cluster-promote` が検出したルール・スキル候補を一覧表示し、その場で保存・保留・スキップを選択できるようになりました
- セッション終了時に使用エージェント・作業時間などのメタ情報をセッションファイルに自動記録するよう改善
- ルール昇格時に CLAUDE.md の `User Rules` セクションへの自動追記に対応

### New: ドキュメント

- 変更履歴ページ（`/changelog`）を GitHub Pages に追加
- トップページに「最近の更新」セクションを追加（最新3バージョンの概要を表示）

### Fix

- エージェントスキルファイルの heredoc 構文を修正

---

## [v1.9.0] - 2026-04-10

### New / Fix

- セッション開始時にセットアップ未実行を検出し、案内をユーザーに直接表示するよう改善
- ドキュメント: `/update` コマンドの説明をセッション管理ページに追加

---

## [v1.8.3] - 2026-04-10

### Fix

- セットアップ未実行の警告が「hook エラー」として表示されるだけだった問題を修正。警告内容が Claude のコンテキストに正しく伝わるよう変更

---

## [v1.8.2] - 2026-04-10

### Fix

- `/update` コマンド実行時に不要なディレクトリが作成される問題を修正

---

## [v1.8.1] - 2026-04-10

### Fix

- セットアップ未実行検出の誤検知を修正。`README.md` が存在するだけで警告が出ていた問題を解消

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

ドキュメントサイトにトラブルシューティングページを追加しました。使い始めのエンジニア・非エンジニアが詰まりやすい5つのケースをカバーしています。

- セットアップのやり方がわからない
- セットアップがうまくいかない
- Clade を入れてみたけど何をしたらいいかわからない
- カスタムコマンドが動かない
- エラーメッセージが出たけどどうしたらいいかわからない

### Fix

- エージェントスキルファイルのヒアドキュメント terminator を `CLADE_REPORT_EOF` に統一し、特殊文字を含むレポートが正しく保存されない問題を修正

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

---

## [v1.6.0] - 2026-04-08

### Apology

v1.5 以前の Clade をお使いの方へ、まずお詫び申し上げます。

`pre-tool.js` / `post-tool.js` フックが **全ツール実行を `observations.jsonl` に逐次記録し続けていました**。この仕組みは「実行パターンから自動学習する」という意図で設計されましたが、実際に生成されたデータは意味のある知見が得られないものでした。意図せず `.claude/instincts/raw/` にゴミファイルを蓄積させてしまい、申し訳ありませんでした。

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
| `/cluster-promote` の分析元 | `patterns_*.json` | `bash-log.jsonl` の失敗記録 + セッション `.tmp` ファイルの振り返り |

### Upgrade

**ステップ 1: ゴミデータを削除する（上記クリーンアップスクリプトを実行）**

**ステップ 2: フックファイルを更新する（セットアップスクリプトを再実行）**

---

## [v1.5.0] - 2026-04-08

### Features

- **`isolation: "worktree"` による並列開発** — `worktree-developer` エージェントが `Agent({ isolation: "worktree" })` で起動するようになり、各エージェントが自動的に独立した Git worktree を取得します。並列実行時の `Already in a worktree session` コンフリクトを解消しました（[clade#1](https://github.com/satoh-y-0323/clade/issues/1) 修正）。
- **`settings.local.json.example` テンプレート** — 推奨設定を含む `settings.local.json` テンプレートが追加されました。セットアップスクリプト実行時に自動配置されます。
- **セットアップスクリプトの自動配置** — 全セットアップスクリプトが `settings.local.json` を自動配置するステップを含むようになりました。

### Bug Fixes

- **Git worktree 内での `enable-sandbox.js` エラーを修正** — worktree 内での起動時にエラーが発生していた問題を修正
- **並列エージェントの権限不足を修正** — `settings.local.json.example` に必要な権限エントリを追加

### Upgrade

セットアップスクリプトを再実行してください:

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

## [v1.4.0] - 2026-04-08

### Features

- **並列開発** — プランナーが `plan-report` で `parallel_groups` を定義できるようになりました。`agent-developer` が複数の `worktree-developer` エージェントをバックグラウンドで並列起動し、完了後に自動でマージします。
- **`worktree-developer` エージェント** — 専用 worktree に入り、割り当てグループのタスクを実装するバックグラウンド専用エージェントを追加
- **`merger` エージェント** — 並列開発完了後に全 worktree ブランチをベースブランチへマージするエージェントを追加。コンフリクト検出時はユーザーに確認します。
- **ファイル所有権の強制** — グループの担当外ファイルへの書き込みをブロックするフックを追加。並列開発中の意図しない干渉を防ぎます。

### Bug Fixes

- バックグラウンドサブエージェントでの承認フローを修正
- `reviewer.md` → `code-reviewer.md` にリネーム（命名規約の統一）
- マイルストーン進捗管理を親 Claude に移動（バックグラウンド実行との非互換を解消）

### Upgrade

セットアップスクリプトを再実行してください:

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

- **全エージェントのマルチターン会話を修正** — エージェントが質問のたびに新しいセッションを起動していた問題を修正。全9エージェントが `AskUserQuestion` ツールを使うよう統一し、1セッション内でコンテキストを保持したまま会話できるようになりました。

### Upgrade

セットアップスクリプトを再実行してください（上記と同じコマンド）。

---

## [v1.3.2] - 2026-04-07

### Bug Fixes

- **エージェントのルールファイルパスを修正** — 全7ワークフローエージェントで、存在しないパスを参照していたためルールセットが読み込まれていなかった問題を修正
- **重複コンテンツを整理** — `agents/*.md` の冗長な記述を削除し、詳細ルールを `skills/agents/*.md` に統一

### Upgrade

セットアップスクリプトを再実行してください（上記と同じコマンド）。

---

## [v1.3.1] - 2026-04-07

### Bug Fixes

- **ヒアドキュメントによるレポート出力** — `write-report.js` が stdin からコンテンツを受け取るよう変更。OS のコマンドライン引数長制限（約8,000文字）を回避し、大きなレポートも正しく保存されるようになりました。
- OS の引数長制限でエラーになった場合、エージェントが別の方法を勝手に試みることを禁止するルールを追加

### Upgrade

セットアップスクリプトを再実行してください（上記と同じコマンド）。

---

## [v1.3.0] - 2026-04-06

### Features

- **VS Code 拡張の環境チェック** — セッション開始時に CLI / VS Code 拡張のどちらで動作しているかを検出。VS Code 拡張の場合は並列バックグラウンド実行の制限について警告し、逐次実行モードで続行するか CLI に切り替えるかを選択できます。
- **マイルストーンベースのワークフロー** — `plan-report` にマイルストーンを定義できるようになりました。`confirm` モード（マイルストーン完了後に確認）または `auto` モード（自動継続）を選択できます。

### Bug Fixes

- `sandbox` 設定のフォーマットを修正（`true` → オブジェクト形式）。boolean 形式は設定パースエラーを起こし、全 `permissions.allow` が無効になっていた
- `httpProxyPort: null` / `socksProxyPort: null` によるバリデーションエラーを修正

### Documentation

- README にセットアップ手順・CLI 推奨・VS Code 拡張の挙動説明を追加
- `CHANGELOG.md` を追加

### Upgrade

セットアップスクリプトを再実行してください（上記と同じコマンド）。

---

## [v1.2.0] - 2026-04-06

### Refactoring

- GitHub MCP を gh CLI に置き換え
  - `--mcp` / `-MCP` セットアップフラグと PAT 管理を廃止
  - `GITHUB_PERSONAL_ACCESS_TOKEN` が不要になりました
  - セットアップスクリプトで gh CLI の存在と認証状態を確認するよう変更

### Features

- エージェントごとの GitHub 操作権限を追加
  - 読み取り専用の `gh` コマンドは自動承認
  - 書き込み操作は確認ダイアログでゲート

### Bug Fixes

- `permissions.allow` のパスパターンと hooks フォーマットを修正

---

## [v1.1.1] - 2026-04-05

### Bug Fixes

- **英語版テンプレートの `settings.json` が欠けていた問題を修正** — v1.1.0 で英語テンプレートを使ってセットアップしたユーザーが、Clade フックスクリプトの実行ごとに権限確認を求められていた問題を解消

---

## [v1.1.0] - 2026-04-04

### Features

- **英語版テンプレート** — `templates/en/.claude/` に全ファイルの英語訳を追加
- 英語版セットアップスクリプト（`setup_en.ps1` / `setup_en.sh`）を追加
- **macOS/Linux サポート** — 日本語版の `setup.sh` を追加

---

## [v1.0.0] - 2026-04-04

初回リリース。

- 役割ベースの7エージェント: interviewer / architect / planner / developer / tester / code-reviewer / security-reviewer
- 構造化ワークフロー: 要件定義 → 設計 → 計画 → 実装 → テスト → レビュー
- 全フェーズでの Human-in-the-loop 承認
- セッションメモリ: セッションをまたいだ作業状態の自動保存・復元
- MCP サーバ対応: Playwright / Memory / Sequential-thinking
- プロジェクト内完結: 全設定が `.claude/` に収まる
- `/promote` でスキル・ルールをグローバルスコープへ昇格
