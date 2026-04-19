# ADR-001: SendMessage ベースの対話アーキテクチャを廃止し親子分担方式へ移行

## ステータス
承認（2026-04-20）

## コンテキスト

Clade フレームワークでは、interviewer / architect / planner / doc-writer / workflow-builder / project-setup / mcp-setup の 7 エージェントが、ユーザーとの複数回対話（マルチターン Q&A）を行うために `SendMessage` ベースのアーキテクチャを採用していた。

このアーキテクチャでは以下のフローを採用していた:
1. サブエージェントが `AskUserQuestion` ツールで質問を生成し、`agentId` とともに親 Claude に返す
2. 親 Claude がユーザーに質問を中継し、回答を `SendMessage(to=agentId, 回答)` でサブエージェントに返す
3. サブエージェントが回答を受け取り、追加質問またはレポート生成へ進む

clade_test2 での実機検証により、**SendMessage で再開したサブエージェントが Write ツールを DENIED される事象が再現**することが判明した。Claude Code の仕様上、`SendMessage` 継続後のサブエージェントのツール権限は保証されず、このツール権限問題に対する回避策は存在しない。

結果として、上記 7 エージェントはいずれも正常にレポートを生成できない状態（機能不全）となっていた。

`report-output-common.md` には「Bash / Write が失敗した場合（最終手段）」として親 Claude への委譲フローが定義されていたが、これはあくまで緊急回避策であり、根本的な解決策ではなかった。

## 決定

以下の新アーキテクチャへ移行する:

1. **SendMessage ベースの多ターン対話を全廃する**
   - サブエージェントが `AskUserQuestion` でユーザーに質問し、`SendMessage` で回答を受け取るフローを全て廃止する

2. **親子分担方式を採用する（C案）**
   - 親 Claude が Q&A を全て担当: コマンドファイル（`.claude/commands/agent-*.md`）にユーザーとの Q&A ロジック・質問文・承認確認フローを集約する
   - サブエージェントは一発起動: 親 Claude が Q&A を完了した後、結果をまとめたプロンプトでサブエージェントを 1 回だけ起動する。サブエージェントはレポート / ファイルを生成して終了する
   - 専門知識はスキルファイルへ: サブエージェント用の専門知識・レポートフォーマット・出力手順はスキルファイル（`.claude/skills/agents/*.md`）に集約する

3. **`CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS=1` を削除する（D1案）**
   - `SendMessage` 機能廃止に伴い、この環境変数に依存する機能が残らなくなるため削除する

4. **委譲フロー（最終手段）を削除する**
   - `SendMessage` 継続後の障害を前提とした緊急回避策は、新アーキテクチャでは不要となるため削除する

## 理由

- **Claude Code の仕様制約への根本的な対処**: `SendMessage` 継続後のツール権限問題はフレームワーク側の工夫で解決できない。唯一の確実な解決策は「対話継続を使わない」アーキテクチャに切り替えることである
- **アーキテクチャの統一と保守性向上**: 全 7 エージェントが同一パターン（親が Q&A / 子が生成）に従うことで、学習コスト・保守コストを低減できる
- **親コンテキストの軽量化**: 親 Claude はコマンドファイルと上流レポートの要約のみを参照する（サブエージェント用スキルファイルを Read しない）ため、コンテキスト消費が抑えられる
- **承認サイクルの明確化**: 承認確認を親 Claude が担当することで、サブエージェントが承認ロジックを持つ必要がなくなり、責務が明確になる

## 影響

**positive:**
- 全 7 エージェントが安定して動作するようになる（ツール権限問題の根本解消）
- アーキテクチャが統一され、新エージェント追加時の設計が明確になる
- サブエージェントがシンプルになる（生成専念）
- 拡張性向上（コマンドファイルを追加するだけで新エージェントを定義できる）

**negative:**
- **Breaking change**: 既存プロジェクトは `/update` コマンドで一括更新が必要
- コマンドファイルに Q&A ロジックが集約されるため、ファイルが肥大化する可能性がある（初期実装では重複を許容し、リファクタは v1.22.0 以降で検討）
- EN 版テンプレート同期作業量が増加する

**変更対象ファイル:**
- `.claude/commands/agent-{interviewer,architect,planner,doc-writer,workflow-builder,project-setup,mcp-setup}.md` — 新構造で全面書き直し
- `.claude/agents/{interviewer,architect,planner,doc-writer,workflow-builder,project-setup,mcp-setup}.md` — `AskUserQuestion` ツール削除・行動スタイル更新
- `.claude/skills/agents/{interviewer,architect,planner}.md` — Q&A・承認確認の記述を削除
- `.claude/skills/agents/report-output-common.md` — 委譲フロー（最終手段）セクション削除
- `.claude/settings.json` — `CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS=1` エントリ削除
- `templates/en/.claude/` — 上記全対応ファイルの英語版同期

## 代替案

**案A: SendMessage 依存継続 + Write 権限問題の回避策を探索**
- 却下理由: Claude Code の仕様制約であり、フレームワーク側でのアーキテクチャ的な回避策が存在しない。`report-output-common.md` の「最終手段」セクションのような緊急回避策は保守性を著しく悪化させる

**案B: 全てのエージェントを標準ワークフローから外して単独ツール化**
- 却下理由: Clade のコア思想（エージェントが協調して設計→実装→テスト→レビューのサイクルを回す）に反する。エージェント間の連携による品質担保が失われる

**案D2: `CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS=1` を保守的に残す**
- 却下理由: `SendMessage` 廃止後は使用されないため、死にコードとして残ることになる。削除して設計をクリーンに保つことを優先する
