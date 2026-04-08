# /context-gauge-off コマンド

コンテキスト使用率ゲージをステータスラインから非表示にする。
`.claude/settings.json` から `statusLine` 設定を削除する。

## 実行手順

1. Read ツールで `.claude/settings.json` を読み込む
2. `statusLine` キーが存在しない場合は「コンテキストゲージはすでに無効です。」と報告して終了する
3. 存在する場合、Edit ツールで `statusLine` ブロック全体（キーと値）を削除する
   - 削除対象の例:
     ```json
       "statusLine": {
         "type": "command",
         "command": "node .claude/hooks/statusline.js"
       }
     ```
   - 前後のカンマも含めて JSON が壊れないよう削除すること
4. 削除後、以下をユーザーに伝える:
   「コンテキストゲージを無効化しました。Claude Code を再起動すると反映されます。」
