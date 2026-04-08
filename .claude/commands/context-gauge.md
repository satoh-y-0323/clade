# /context-gauge コマンド

コンテキスト使用率ゲージをトグルする。
現在の状態を確認し、有効なら無効化、無効なら有効化する。

## 実行手順

1. Read ツールで `.claude/settings.json` を読み込む
2. `statusLine` キーの有無で分岐する:

### `statusLine` が存在する場合（→ 無効化）

Edit ツールで `statusLine` ブロック全体を削除する。
前後のカンマも含めて JSON が壊れないよう削除すること。

削除対象の例:
```json
  "statusLine": {
    "type": "command",
    "command": "node .claude/hooks/statusline.js"
  }
```

完了後:「コンテキストゲージを **無効化** しました。Claude Code を再起動すると反映されます。」と伝える。

### `statusLine` が存在しない場合（→ 有効化）

Edit ツールで `settings.json` 末尾の閉じ `}` の直前に以下を追加する:

```json
  "statusLine": {
    "type": "command",
    "command": "node .claude/hooks/statusline.js"
  }
```

完了後:「コンテキストゲージを **有効化** しました。Claude Code を再起動すると反映されます。」と伝える。

## ゲージの見方

- 全10セル、1セル = 10%
- 使用率が増えると右から赤くなる
- 数値色: 60%超→黄、75%超→オレンジ、90%超→赤
