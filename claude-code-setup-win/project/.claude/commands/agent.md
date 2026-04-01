# /agent コマンド

指定したエージェントをサブエージェントとして起動する。

## 使い方
```
/agent:architect   # 設計・アーキテクチャ担当
/agent:developer   # 実装・テスト・デバッグ担当
/agent:reviewer    # コードレビュー・品質確認担当
```

## 動作
各エージェントは `.claude/agents/{name}.md` の YAML frontmatter に従い、
指定されたモデル・ツール・権限でサブエージェントとして起動される。
ルールファイルはエージェントのシステムプロンプト内の指示により自動的に読み込まれる。

| エージェント | モデル | 主な権限 |
|---|---|---|
| architect | sonnet | 読み書き・実行（削除は確認後）|
| developer | sonnet | 読み書き・実行・TodoWrite |
| reviewer | sonnet | 読み取り・実行のみ（書き込み不可）|
