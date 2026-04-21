# /agent-developer コマンド

実装・デバッグエージェント（developer）をサブエージェントとして起動する。
plan-report の内容に応じてシンプルモード・マイルストーンモード・並列実行モードを自動的に切り替える。

## ルールの読み込み
**起動時の最初のアクションとして** `.claude/skills/agents/developer.md` を Read し、ルールを確認してから作業を開始すること。

## 事前準備

1. Glob で `.claude/reports/plan-report-*.md` を検索し、最新ファイルが存在する場合は Read する
2. plan-report が存在する場合は以下を確認する:
   - `## メタ情報` セクションに `milestone_mode` が記載されているか（`confirm` / `auto` / 記載なし）
   - マイルストーン一覧が存在するか
3. plan-report が存在する場合は、ファイル冒頭の YAML フロントマターを確認する:
   - `parallel_groups` キーが存在するか確認する
   - 存在する場合は以下を Bash で実行して clade-parallel の導入状況を確認する:
     ```
     command -v clade-parallel >/dev/null 2>&1 && echo "installed" || echo "not installed"
     ```
   - `parallel_groups` が存在 **かつ** `clade-parallel` が導入済み の場合 → 並列実行モードへ
   - それ以外の場合 → 従来のシンプルモード / マイルストーンモードへ（警告不要）

---

## 並列実行モード（plan-report に parallel_groups が定義されており clade-parallel 導入済みの場合）

1. 以下を Bash で実行して manifest.md を生成する:
   ```
   node .claude/hooks/plan-to-manifest.js {plan-report の絶対パス}
   ```
   標準出力に出力されたパスを manifest パスとして記録する。
   スクリプトが終了コード 1 で失敗した場合はエラー内容をユーザーに報告して終了する。

2. 以下を Bash で実行して並列実行を開始する:
   ```
   clade-parallel run {manifest パス}
   ```
   完了まで待機する（timeout_sec はマニフェスト内のタスク設定に従う）。

3. 実行結果を確認する:
   - 全タスク成功の場合: 完了をユーザーに報告する
   - 失敗タスクがある場合: 失敗タスク名・終了コード・stderr の概要をユーザーに報告し、
     対応方針（再実行 or 逐次モードでの修正）をユーザーに確認する

---

## シンプルモード（マイルストーンなし・plan-report なし）

1. Agent ツールで `subagent_type: developer` を指定して起動する
   - プロンプトに現在の作業コンテキスト（ユーザーの依頼内容・既存レポートの有無）を含める
2. developer 完了後、`/agent-tester` を起動してテストを依頼する
3. test-report を確認し、テスト不合格の場合は developer を再起動（修正モード）して合格まで繰り返す

---

## マイルストーンモード（マイルストーンあり）

以下をマイルストーンの数だけ繰り返す:

### 各マイルストーンの処理

1. Agent ツールで `subagent_type: developer` を起動する
   - プロンプトに以下を明記する:
     ```
     作業対象マイルストーン: {N}「{タイトル}」
     このマイルストーンのタスクのみ実装してコミットしてください。
     次のマイルストーンには進まないでください。
     ```
2. developer 完了後、`/agent-tester` を起動してテストを依頼する
3. test-report を確認し、テスト不合格の場合は developer を再起動（修正モード）して合格まで繰り返す
4. テスト合格後、次のマイルストーンへ進む前に以下を行う:

**`milestone_mode: confirm` の場合:**
AskUserQuestion ツールを使って以下をユーザーに提示し、回答を待つ:
```
マイルストーン {N}「{タイトル}」完了・テスト合格。コミット済みです。

続けてマイルストーン {N+1}「{タイトル}」の作業を開始しますか？
  [yes] 続きを処理する
  [no]  ここで作業を終了する（次回セッションで /init-session を実行すれば再開できます）
```
- `yes` の場合: 次のマイルストーンへ進む
- `no` の場合: 作業を終了し、再開方法を案内して停止する

**`milestone_mode: auto` の場合:**
確認なしで即座に次のマイルストーンへ進む。

---

## 用途
- 新機能の実装・バグ修正・リファクタリング
- tester からの指摘対応
- テスト作成・実行は tester エージェントが担当するため、developer は行わない
