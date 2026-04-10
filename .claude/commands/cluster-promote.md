# /cluster-promote コマンド

Bash 実行ログとセッション振り返りを分析して、
プロジェクト固有のスキルまたはルールに昇格させる。

## 実行手順

### ステップ1: データ収集

以下を確認・Read する:
1. `.claude/instincts/raw/bash-log.jsonl` — 存在する場合のみ Read する
2. Glob で `.claude/memory/sessions/*.tmp` を全件検索し、Read ツールで全て読み込む

### ステップ2: 分析

#### A. Bash ログからルール候補を抽出

bash-log.jsonl の各レコードを分析し、失敗を示すものを特定する:
- `err: true` のレコード
- `out` フィールドに失敗を示すキーワードを含むレコード:
  `error`, `Error`, `failed`, `FAILED`, `denied`, `not found`, `No such file`,
  `cannot`, `invalid`, `refused`, `timed out`, `command not found` 等

同種のエラーをグループ化してルール候補としてまとめる。
例: 「コマンド引数が長すぎる → ヒアドキュメントを使う」

#### B. セッション振り返りからスキル・ルール候補を抽出

各 `.tmp` ファイルの以下のセクションを読む:
- `## うまくいったアプローチ` → スキル候補（繰り返し成功した手順）
- `## 試みたが失敗したアプローチ` → ルール候補（避けるべき操作）

複数セッションで繰り返し言及されているものを高信頼候補とする。

### ステップ3: 候補をユーザーに提示

```
## 昇格候補

### スキル候補（繰り返し成功した手順）
1. {スキル名}: {概要} ({N}セッションで言及)
2. ...

### ルール候補（Bash ログの失敗パターン）
1. {ルール名}: {何が起きたか・どう避けるか} ({N}回発生)
2. ...

### ルール候補（セッション振り返りの失敗パターン）
1. {ルール名}: {何が失敗したか・教訓}
2. ...

昇格するものを番号で選んでください（例: 1,3）/ all / none
```

### ステップ4: 承認されたものを保存

**スキル** → Write で `.claude/skills/project/{name}.md` に保存:
- フロントマターなし・Markdown 形式で手順を記述
- 「いつ使うか」「手順」「注意点」を記載

**ルール** → Write で `.claude/rules/{name}.md` に保存:
- 「〜してはいけない」「〜の場合は〜する」形式で記述
- 違反した場合の影響も記載

**ルールを保存した場合、必ず続けて以下を実行する:**
```
Bash: node .claude/hooks/update-clade-section.js add-rule {name}
```
- exit 0: 正常追記（または CLADE マーカーが見つからず no-op）
- exit 2: 既に CLAUDE.md に存在するため no-op（問題なし）
- exit 1: 書き込みエラー → ユーザーに警告を表示し、手動で `.claude/CLAUDE.md` の `## Global Rules (Clade 管理)` セクションに `@rules/{name}.md` を追記するよう案内する

**クラスタ情報** → Write で `.claude/instincts/clusters/{YYYYMMDD}-{name}.json` に保存:
```json
{
  "type": "skill | rule",
  "name": "{name}",
  "summary": "{一行概要}",
  "promotedAt": "{YYYY-MM-DD}",
  "source": "bash-log | session-tmp"
}
```

### ステップ5: bash-log.jsonl をアーカイブ

bash-log.jsonl が存在し内容がある場合のみ実施:
1. Read で内容を確認
2. Write で `.claude/instincts/raw/bash-log_{YYYYMMDD}_archived.jsonl` に書き込む
3. Write で元ファイル（bash-log.jsonl）を `""` (空文字) でリセットする

※ シェルコマンドは使用しない（クロスプラットフォーム対応）
