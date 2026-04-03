# 標準ワークフロー（詳細）

<!-- このファイルは .claude/rules/ 外のため auto-load されない。必要なエージェントが明示的に Read すること -->

## AIとしての厳守ルール
自律的にエージェント連携する場合はフェーズ順を必ず厳守。スキップ・順序変更禁止。

## ユーザーが直接エージェントを指定した場合
作業開始前に確認:
> 標準ワークフローに沿って進めますか？
> [yes] ワークフローに従い次フェーズへ連携
> [no]  このエージェントの作業のみ実施して終了

## フェーズ1: 要件定義・設計
- Step 0. `/agent-interviewer` → ヒアリング・requirements-report出力（機能追加/バグ修正時は必須）
- Step 1. `/agent-architect` → requirements-report読み込み・architecture-report出力
- 完了レポート: requirements-report, architecture-report

## フェーズ2: 初回計画立案
- Step 2. `/agent-planner` → 上記2レポートを読み込み・plan-report出力
- 完了レポート: + plan-report

## フェーズ3: 実装・テスト（TDDサイクル）
- Step 3. `/agent-tester` → テスト仕様設計・失敗テスト作成（Red）
- Step 4. `/agent-developer` → 実装（Green → Refactor）
- Step 5. `/agent-tester` → テスト再実行・test-report出力
- 完了レポート: + test-report

## フェーズ4: レビュー・計画更新
- Step 6. `/agent-code-reviewer` → code-review-report出力
- Step 7. `/agent-security-reviewer` → security-review-report出力
- Step 8. `/agent-planner` → 全レポート統合・更新plan-report出力
- 指摘がなくなるまで Step 3〜8 を繰り返す

## TDDフロー
1. tester でRed（失敗テスト作成）
2. developer でGreen（実装）→ testerに確認依頼
3. developer でRefactor → testerに再確認依頼
4. 不合格がなくなるまで 2〜3 を繰り返す
