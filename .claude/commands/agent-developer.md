# /agent-developer コマンド

実装・デバッグエージェント（developer）をサブエージェントとして起動する。
plan-report の内容に応じてシンプルモード・マイルストーンモード・並列モードを自動的に切り替える。

## ルールの読み込み
**起動時の最初のアクションとして** `.claude/skills/agents/developer.md` を Read し、ルールを確認してから作業を開始すること。

## 事前準備

1. Glob で `.claude/reports/plan-report-*.md` を検索し、最新ファイルが存在する場合は Read する
2. plan-report が存在する場合は以下を確認する:
   - YAML フロントマターに `parallel_groups` が定義されているか → **並列モード**
   - `## メタ情報` セクションに `milestone_mode` が記載されているか（`confirm` / `auto` / 記載なし）
   - マイルストーン一覧が存在するか

---

## シンプルモード（マイルストーンなし・plan-report なし・parallel_groups なし）

1. Agent ツールで `subagent_type: developer` を指定して起動する
   - プロンプトに現在の作業コンテキスト（ユーザーの依頼内容・既存レポートの有無）を含める
2. developer 完了後、`/agent-tester` を起動してテストを依頼する
3. test-report を確認し、テスト不合格の場合は developer を再起動（修正モード）して合格まで繰り返す

---

## マイルストーンモード（マイルストーンあり・parallel_groups なし）

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

## 並列モード（parallel_groups が存在する場合）

### Step 1: 事前実装フェーズ（pre_implementation が存在する場合）

1. Agent ツールで `subagent_type: developer` を起動する
   - プロンプトに以下を明記する:
     ```
     事前実装フェーズです。以下のファイルを実装してコミットしてください。
     これらはインターフェース・型定義など、並列開発前に確定が必要なファイルです。
     {pre_implementation のファイル一覧}
     ```
2. developer 完了後、コミットが完了していることを確認する

### Step 2: 並列実装フェーズ

全グループを **バックグラウンドで同時起動** する:

```
各グループ（group-a, group-b, ...）に対して:
  Agent ツールで subagent_type: worktree-developer を run_in_background: true で起動する
  プロンプトに以下を含める:
    - グループID（例: group-a）
    - plan-report の当該グループのタスク一覧
    - 「EnterWorktree(name: "group-a") を最初のアクションとして呼び出すこと」
```

### Step 3: 全グループ完了を待機

全バックグラウンドエージェントの完了通知を受け取る。
各エージェントの完了メッセージからブランチ名を収集する。

ブランチ名の取得方法:
- 各 worktree-developer の完了メッセージに含まれるブランチ名を使用する
- または `git worktree list` で確認する

### Step 4: マージフェーズ

Agent ツールで `subagent_type: merger` を起動する:
```
プロンプトに以下を含める:
  - ベースブランチ名（通常 main）
  - マージ対象ブランチ一覧（Step 3 で収集したもの）
```

### Step 5: マージ後のテスト

merger 完了後、`/agent-tester` を起動してテストを依頼する。
テスト不合格の場合は developer を起動（修正モード）して合格まで繰り返す。

### Step 6: マイルストーン継続確認

マイルストーンがある場合、テスト合格後に `milestone_mode` に従って次のマイルストーンへの継続を確認する（マイルストーンモードの Step 4 と同じ処理）。

---

## 用途
- 新機能の実装・バグ修正・リファクタリング
- tester からの指摘対応
- テスト作成・実行は tester エージェントが担当するため、developer は行わない
