# /agent コマンド

指定したエージェントをサブエージェントとして起動する。

## 使い方
```
/agent:architect          # 設計・アーキテクチャ担当
/agent:developer          # 実装・デバッグ担当（テスト作成はtesterが行う）
/agent:tester             # テスト仕様設計・実行・結果報告担当
/agent:code-reviewer      # コード品質・保守性・パフォーマンスのレビュー担当
/agent:security-reviewer  # セキュリティ脆弱性診断担当
```

## 動作
各エージェントは `.claude/agents/{name}.md` の YAML frontmatter に従い、
指定されたモデル・ツール・権限でサブエージェントとして起動される。

| エージェント | モデル | 主な権限 | レポート出力先 |
|---|---|---|---|
| architect | sonnet | 読み書き・実行（削除は確認後）| - |
| developer | sonnet | 読み書き・実行・TodoWrite | - |
| tester | sonnet | 読み取り・実行のみ（Write/Edit不可）| `.claude/reports/test-report.md` |
| code-reviewer | sonnet | 読み取り・実行のみ（Write/Edit不可）| `.claude/reports/code-review-report.md` |
| security-reviewer | sonnet | 読み取り・実行のみ（Write/Edit不可）| `.claude/reports/security-review-report.md` |

## developer ↔ tester 連携フロー（TDD）
1. `/agent:tester` でテスト仕様設計・失敗テスト作成（Red）
2. `/agent:developer` で実装（Green）→ testerに再確認依頼
3. `/agent:developer` でリファクタ（Refactor）→ testerに再確認依頼
4. 不合格がなくなるまで2〜3を繰り返す

## developer ↔ reviewer 連携フロー
1. 実装完了後に `/agent:code-reviewer` でコード品質レビュー（`.claude/reports/code-review-report.md` に出力）
2. `/agent:security-reviewer` でセキュリティ診断（`.claude/reports/security-review-report.md` に出力）
3. `/agent:developer` で両レポートを読み込み、指摘事項を修正する
4. 指摘がなくなるまで繰り返す
