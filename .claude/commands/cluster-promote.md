# /cluster-promote コマンド

観察データ（インスティンクト）をクラスタリングして、
プロジェクト固有のスキルまたはルールに昇格させる。

## 実行手順
1. 以下のファイルを読み込む:
   - `.claude/instincts/raw/observations.jsonl`
   - `.claude/instincts/raw/patterns_*.json`（全て）

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
   - スキル → `.claude/skills/project/{name}.md`
   - ルール → `.claude/rules/{role}/individual/{name}.md`
   - クラスタ情報 → `.claude/instincts/clusters/{YYYYMMDD}-{name}.json`

5. 処理済みの観察データをアーカイブ:
   ```bash
   mv .claude/instincts/raw/observations.jsonl \
      .claude/instincts/raw/observations_{YYYYMMDD}_archived.jsonl
   ```
