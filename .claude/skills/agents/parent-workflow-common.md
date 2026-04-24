# Parent Workflow Common Rules

親 Claude が `/agent-{name}` コマンドから 1 発型サブエージェント（interviewer / architect / planner / code-reviewer / security-reviewer）を起動する際の **Step 4〜8 共通フロー** を定義する。

各コマンド（`.claude/commands/agent-*.md`）の Step 1〜3 はコマンド固有（上流レポート読み込み / Q&A / コンテキスト整理）のため共通化しない。
Step 4〜8 を共通化することで、5 コマンド間の重複を排除しつつ挙動を完全に同一に保つ。

## 呼び出し元が指定する変数

各コマンドは以下の変数を指定して本フローを参照する:

| 変数 | 意味 | 例（interviewer） | 例（architect） | 例（planner） | 例（code-reviewer） | 例（security-reviewer） |
|---|---|---|---|---|---|---|
| `{agent_type}` | Agent ツールの subagent_type | `interviewer` | `architect` | `planner` | `code-reviewer` | `security-reviewer` |
| `{report_baseName}` | 出力レポートのファイル名プレフィックス | `requirements-report` | `architecture-report` | `plan-report` | `code-review-report` | `security-review-report` |
| `{approval_category}` | `record-approval.js` の第3引数 | `requirements` | `architecture` | `plan` | `code-review` | `security-review` |
| `{report_jp_name}` | 承認確認メッセージ内のレポート種別日本語名 | `要件定義レポート` | `アーキテクチャ設計レポート` | `作業計画レポート` | `コードレビューレポート` | `セキュリティ診断レポート` |
| `{approval_target_jp}` | 承認確認メッセージ内の「この○○を承認しますか？」の○○ | `レポート` | `設計` | `計画` | `レポート` | `レポート` |
| `{request_summary}` | サブエージェントへの作業依頼 1 行要約 | `要件定義レポートの作成` | `アーキテクチャ設計レポートの作成` | `作業計画レポート（plan-report）の作成` | `コードレビューレポートの作成` | `セキュリティ診断レポートの作成` |
| `{prompt_body}` | コマンド固有の Q&A 結果・上流レポートパス等を含むプロンプト本体 | （コマンド側で定義） | （コマンド側で定義） | （コマンド側で定義） | （コマンド側で定義） | （コマンド側で定義） |
| `{extra_output_instructions}` | 出力指示への追加行（任意。不要ならこの行は省略） | 省略 | 省略 | 省略（planner は Step 4 をインライン保持） | 省略 | 省略 |

> **注記（planner）**: `plan-report` の生成は「## YAML フロントマターの出力ルール」という巨大なセクションを `## 出力指示` の後に含める必要があるため、planner のみ **Step 4 をインラインに保持**し、Step 5〜8 のみ本共通ファイルを参照する。

---

## Step 4: サブエージェントの一発起動

Agent ツールで `subagent_type: {agent_type}` を指定して起動する。プロンプトに以下を含める:

```
## 作業依頼
{request_summary}

{prompt_body}

## 出力指示
- 出力先: `.claude/reports/{report_baseName}-*.md`（write-report.js 経由）
{extra_output_instructions}
- 最終メッセージにレポートファイルパスを必ず含めること（形式: `ファイル: .claude/reports/{report_baseName}-YYYYMMDD-HHmmss.md`）
- AskUserQuestion / SendMessage は使わないこと
- レポート生成後は終了すること（承認確認は親 Claude が担当）
```

否認後の再生成時はプロンプトに以下を追加する:
```
## 再生成モード
- 前回レポート: {前回レポートパス}
- ユーザーからの修正指示: {指示内容}
```

## Step 5: レポートパスの受け取り

サブエージェントの最終出力から正規表現 `.claude/reports/{report_baseName}-\d{8}-\d{6}\.md` でレポートファイルパスを抽出する。

## Step 6: 承認確認

ユーザーに以下をテキストで提示する:

```
{report_jp_name}を `{ファイルパス}` に保存しました。内容を確認して、この{approval_target_jp}を承認しますか？（yes / no）
修正が必要な場合はその内容もお知らせください。
```

## Step 7: 承認記録

シェルインジェクション対策としてコメントは tmp ファイル経由で渡す:

1. `node .claude/hooks/clear-tmp-file.js --path .claude/tmp/approval-comment.md` を実行
2. Write ツールで `.claude/tmp/approval-comment.md` にユーザーの承認コメントを書き込む（コメントなしの場合は空文字列）
3. 以下を実行:

```bash
node .claude/hooks/record-approval.js {ファイル名} {yes|no} {approval_category} --comment-file .claude/tmp/approval-comment.md
```

## Step 8: 否認時の再起動

否認の場合、修正指示と前レポートパスを含めた新プロンプトで Step 4 から繰り返す。
