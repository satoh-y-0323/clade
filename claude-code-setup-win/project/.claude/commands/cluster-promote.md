# /cluster-promote コマンド

観察データ（インスティンクト）をクラスタリングして、
プロジェクト固有のスキルまたはルールに昇格させる。

## 実行手順
1. 以下のファイルを読み込む:
   - Read ツールで `.claude/instincts/raw/observations.jsonl` を読み込む
   - Glob ツールで `.claude/instincts/raw/patterns_*.json` を検索し、Read ツールで全て読み込む

2. 以下の基準でパターンを分類する:

   **スキル候補**（手順として再利用できるもの）:
   - 同じツール・同じ文脈で3回以上成功したパターン
   - 特定の問題を解決した一連の手順

   **ルール候補**（守るべき制約・避けるべきこと）:
   - 2回以上失敗した後に別アプローチで成功したパターン
   - 特定の操作が常にエラーを引き起こすパターン

3. 候補リストをユーザーに提示する:
   ```
   ## 昇格候補

   ### スキル候補
   1. {パターン名}: {説明} (出現: {N}回)
   2. ...

   ### ルール候補
   1. {パターン名}: {説明} (失敗: {N}回 → 成功パターン発見)
   2. ...

   昇格するものを番号で選んでください（例: 1,3）またはallで全て
   ```

4. 承認されたものを保存:
   - スキル → Write ツールで `.claude/skills/project/{name}.md` に保存
   - ルール → Write ツールで `.claude/rules/{role}/individual/{name}.md` に保存
   - クラスタ情報 → Write ツールで `.claude/instincts/clusters/{YYYYMMDD}-{name}.json` に保存

5. 処理済みの観察データをアーカイブする:
   Read ツールで `.claude/instincts/raw/observations.jsonl` の内容を読み取り、
   Write ツールで `.claude/instincts/raw/observations_{YYYYMMDD}_archived.jsonl` に書き込む。
   その後 Write ツールで元のファイルを空（""）にする。
   ※ シェルコマンドは使用しない（クロスプラットフォーム対応）
