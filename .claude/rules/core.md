# Core Rules（全エージェント共通）

## 作業原則
- 1タスク = 1コミットの粒度を保つ
- 不明な点はユーザーに確認してから進む
- Bash コマンドに長文をコマンドライン引数として渡してはならない。
  理由: OS の引数文字数制限（目安8,000文字）でエラーになる。
  代替: ヒアドキュメント（`<<'EOF'`）やパイプで stdin 経由で渡すこと。
- Bash コマンドが引数の文字数制限エラーで失敗した場合、別の方法を自分で試みることは禁止。
  エラー内容をユーザーに報告し、指示を待つこと。

## コミュニケーション
- 作業開始前に計画を1〜3行で提示する
- 完了後は何をしたかを簡潔に報告する
- 失敗した場合は理由と代替案を提示する
- 長い処理は進捗を報告しながら進める

## セキュリティ
- 秘密鍵・APIキー・パスワードをコードに直接書かない
- .env ファイルは .gitignore に含まれていることを確認する

## 標準ワークフロー（フェーズ構成）

### AIとしての厳守ルール
AIが自律的にエージェントを選択・連携させる場合は、以下のワークフローを**必ず厳守**する。
フェーズをスキップしたり、順序を入れ替えることは禁止。

### サブエージェントは必ず逐次実行する（並列禁止）

複数のサブエージェント呼び出しを**同一メッセージ内で並列実行してはならない**。必ず 1 つずつ呼び出し、結果受け取り・承認フローを完了してから次のサブエージェントを呼び出すこと。

**Why:** Claude Code の permissions チェッカーは並列実行に対応していない。並列でサブエージェントを呼び出すと、Bash・Write など全ツールの権限チェックが race condition となり、タイミング次第で許可・拒否が変わる非決定的な挙動になる。**一見動作しているように見えても、権限チェックが偶然通っているだけ**の状態であり、再現性がない。

**典型的な誤用パターン（Phase 4）:**
- Step 6（code-reviewer）と Step 7（security-reviewer）を「依存関係がないから並列化できる」と判断し、同一メッセージで両方 Agent ツールを呼び出してしまう
- 正しくは **Step 6 完了・承認 → Step 7 開始** の順で逐次実行する

**注記: clade-parallel は上記ルールの対象外**

clade-parallel は外部オーケストレーションツールであり、Claude Code の Agent ツールを呼び出すのではなく **別プロセスとして claude CLI を起動する**。そのため permissions race condition は発生せず、このルールの適用対象外となる。`plan-to-manifest.js` で生成した manifest を `clade-parallel run` に渡す形での並列実行は安全である。

### ユーザーが直接エージェントを指定した場合の確認ルール
ユーザーが `/agent-xxx` を直接呼び出した場合、**親 Claude がコマンドファイル（`.claude/commands/agent-xxx.md`）を Read して** 作業開始前に以下を確認する:

```
標準ワークフロー（フェーズ構成）に沿って作業を進めますか？
  [yes] ワークフローに従い、次フェーズへの連携も行います
  [no]  このエージェントの作業のみ実施し、完了後にユーザーへ報告して終了します
```

- **yes の場合**: 以下の標準ワークフローを厳守して進める
- **no の場合**: 指定されたエージェントの作業のみ実施し、完了後はユーザーへ完了報告して終了する（次エージェントへの連携は行わない）

なお、エージェントの Q&A・承認確認・否認時の再起動は全て親 Claude が担当する。サブエージェントはレポート/ファイル生成のみを実行して終了する。

---

### フェーズ1: 要件定義・設計
```
Step 0. /agent-interviewer  → 要件ヒアリング・requirements-report 出力・承認
        ※ 機能追加・バグ修正では必ず実施。新規開発の場合は省略可。
Step 1. /agent-architect    → requirements-report 読み込み・設計・architecture-report 出力・承認
```
このフェーズ完了時点で存在するレポート: requirements-report, architecture-report

### フェーズ2: 初回計画立案
```
Step 2. /agent-planner      → requirements-report + architecture-report を読み込み
                              初回 plan-report 出力・承認
                              ※ test/review レポートはまだ存在しないためスキップ（正常）
```
このフェーズ完了時点で存在するレポート: + plan-report

### フェーズ3: 実装・テスト（TDDサイクル）

```
Step 3. /agent-tester → plan-report 確認・テスト仕様設計・失敗テスト作成（Red）
```

#### Step 4: developer 実装

plan-report の YAML フロントマターに `phase: developer` の `parallel_groups` が1件以上存在し、かつ clade-parallel が導入済みの場合 → **clade-parallel で並列実行する:**

```bash
node .claude/hooks/plan-to-manifest.js --phase developer {plan-report の絶対パス}
clade-parallel run {developer-manifest パス} --report {developer-manifest パスの .md を -report.json に置換したパス}
```
完了後、全タスク成功ならユーザーに報告する。失敗タスクがある場合は失敗タスク名・終了コード・stderr の概要をユーザーに報告し、対応方針（`clade-parallel run --resume {developer-manifest パス}` で成功済みタスクをスキップして再実行 / 逐次モードでの修正）を確認する。

タイムアウトは plan-report の `phase_scales` で指定する（詳細は `.claude/commands/agent-planner.md` 参照）。

上記以外（`phase: developer` グループなし / clade-parallel 未導入）→ **逐次実行:**
```
Step 4. /agent-developer → plan-report 確認・実装（Green → Refactor）
```

```
Step 5. /agent-tester → テスト再実行・test-report 出力・承認
```
このフェーズ完了時点で存在するレポート: + test-report

### フェーズ4: レビュー・計画更新

#### Step 5.5: plan-updater の実行

Step 5 完了後・Step 6+7 の前に、Agent ツールで `subagent_type: plan-updater` を起動する。
プロンプトに最新の plan-report の絶対パスを渡す。

plan-updater は plan-report の YAML フロントマターから reviewer 並列グループを削除する。
これにより Step 6+7 は常に逐次実行となる。

> **将来の拡張:** plan-updater の内部ロジックで `git diff --stat` の変更ファイル数を確認し、
> 大規模レビューの場合のみ reviewer グループを残す自動判断を実装予定。

#### Step 6+7: レビュー実行

plan-report の YAML フロントマターに `phase: reviewer` の `parallel_groups` が1件以上存在し、かつ clade-parallel が導入済みの場合 → **clade-parallel で並列実行する:**

```bash
node .claude/hooks/plan-to-manifest.js --phase reviewer {plan-report の絶対パス}
clade-parallel run {reviewer-manifest パス} --report {reviewer-manifest パスの .md を -report.json に置換したパス}
```
完了後、生成された code-review-report と security-review-report を Read してユーザーに報告・承認を求める。失敗タスクがある場合は失敗タスク名・終了コード・stderr の概要をユーザーに報告し、対応方針（`clade-parallel run --resume {reviewer-manifest パス}` で成功済みタスクをスキップして再実行 / 逐次モードでの修正）を確認する。

タイムアウトは plan-report の `phase_scales.reviewer` で指定する。
`idle_timeout_sec` は runner.py が read_only タスクで強制 None にするため指定不要。
reviewer タスクの `cwd` は `plan-to-manifest.js` が自動で `../..` を付与する（設定不要）。

上記以外（`phase: reviewer` グループなし / clade-parallel 未導入）→ **逐次実行:**
```
Step 6. /agent-code-reviewer     → code-review-report 出力・承認
Step 7. /agent-security-reviewer → security-review-report 出力・承認
```

#### Step 8:
```
Step 8. /agent-planner → 全レポート統合・更新 plan-report 出力・承認
```
指摘がなくなるまで Step 3〜8 を繰り返す。

### TDD フロー（developer ↔ tester）
1. `/agent-tester` でテスト仕様設計・失敗テスト作成（Red）
2. `/agent-developer` で実装（Green）→ tester に再確認依頼
3. `/agent-developer` でリファクタ（Refactor）→ tester に再確認依頼
4. 不合格がなくなるまで 2〜3 を繰り返す

---

### マイルストーン対応ワークフロー

大規模開発では、`plan-report` にマイルストーンが設定される場合がある。
マイルストーンとは「そこまで完了したら動作確認可能な状態」に相当する開発単位であり、完了時にコミットを行う。

#### プランナーの責務（計画立案時）
マイルストーンを含む計画を出力する際は、`plan-report` を承認依頼する前に必ずユーザーへ以下を確認する:

```
マイルストーン完了後の挙動を選択してください:
  [confirm] 各マイルストーン完了・コミット後に「続きを処理しますか？」の確認ダイアログを表示する
            （途中で作業を止めたい場合はこちら）
  [auto]    各マイルストーン完了・コミット後に確認なしで自動的に次のマイルストーンへ進む
            （今日中に全体を完了させたい場合はこちら）
```

選択結果を `plan-report` の冒頭のメタ情報セクションに以下の形式で必ず明記する:

```
## メタ情報
- milestone_mode: confirm  # または auto
```

マイルストーンが存在しない（小規模な）計画の場合はこの確認を省略してよい。

#### デベロッパーの責務（実装時）
`plan-report` を読み込んだとき、プロンプトに「作業対象マイルストーン: N」が指定されている場合は、そのマイルストーンのタスクのみを実装してコミットし、次のマイルストーンには進まずに作業を終了する。

マイルストーン間の継続確認（`milestone_mode: confirm` / `auto`）は `/agent-developer` コマンド（親Claude）が制御する。
