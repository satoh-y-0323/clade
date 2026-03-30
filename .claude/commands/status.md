# /status コマンド

現在のセッション状態・適用中のルール・インスティンクト蓄積状況を表示する。

## 実行手順
1. 現在のエージェントと適用ルールを確認する
2. セッションファイルの存在を確認:
   ```bash
   ls -t .claude/memory/sessions/*.tmp 2>/dev/null | head -3
   ```
3. 観察データの蓄積状況を確認:
   ```bash
   wc -l .claude/instincts/raw/observations.jsonl 2>/dev/null
   ls .claude/instincts/clusters/ 2>/dev/null
   ls .claude/skills/project/ 2>/dev/null
   ```
4. 以下の形式で表示する:

---
## 現在のステータス

### セッション
- 本日: {YYYYMMDD}
- 最新セッションファイル: {ファイル名 or なし}
- 残タスク数: {件数}

### 適用中の設定
- エージェント: {名前 or 未選択}
- 適用ルール: {ファイル一覧}
- 有効スキル: {スキル一覧}

### 継続学習の状態
- 観察データ: {行数}件蓄積済み
- プロジェクト固有スキル: {件数}個
- プロジェクト固有ルール（個別）: {件数}個
- インスティンクトクラスタ: {件数}個

### 利用可能なコマンド
- `/agent:developer` `/agent:architect` `/agent:reviewer` — エージェント切り替え
- `/init-session` — セッション復元
- `/end-session` — セッション保存
- `/cluster-promote` — インスティンクト昇格
- `/promote` — グローバル展開
---
