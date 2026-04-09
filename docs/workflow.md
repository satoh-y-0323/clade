# ワークフロー

Clade の標準ワークフローは4つのフェーズで構成されています。各フェーズでレポートを出力し、あなたの承認を待ってから次へ進みます。

## フェーズ構成

```
フェーズ1: 要件定義・設計
  /agent-interviewer  →  requirements-report（要件定義レポート）
  /agent-architect    →  architecture-report（アーキテクチャレポート）

フェーズ2: 計画立案
  /agent-planner      →  plan-report（作業計画レポート）

フェーズ3: 実装・テスト（TDD サイクル）
  /agent-tester       →  失敗するテストを作成（Red）
  /agent-developer    →  実装（Green → Refactor）
    [並列モード]      →  グループごとに worktree-developer を並列起動
                          全完了後に merger が自動マージ
  /agent-tester       →  テスト確認・test-report（テストレポート）

フェーズ4: レビュー・計画更新
  /agent-code-reviewer      →  code-review-report（コードレビューレポート）
  /agent-security-reviewer  →  security-review-report（セキュリティ診断レポート）
  /agent-planner            →  更新された plan-report

すべての指摘がなくなるまでフェーズ3〜4を繰り返す。
```

レポートはすべてタイムスタンプ付きで `.claude/reports/` に保存されます。

---

## 使用例：機能追加の流れ

### ステップ1 — 要件ヒアリング

```
> /agent-interviewer

今回の作業はどのようなものでしょうか？
1. 新規開発
2. 機能追加  ← 選択
3. バグ修正
...

どのようなことを実現したいですか？
→ "メールとパスワードでログインできるようにしたい"

どうなったら完成と判断しますか？
→ "登録・ログイン・自分のデータだけ見られる状態"

──────────────────────────────────────────
要件定義レポートを保存しました:
  .claude/reports/requirements-report-20260404-103012.md

このレポートを承認しますか？（yes / no）
> yes
──────────────────────────────────────────
```

### ステップ2 — 設計

```
> /agent-architect

requirements-report-20260404-103012.md を読み込み中...

[認証フロー・データモデル・API インターフェースを設計中...]

アーキテクチャ設計レポートを保存しました:
  .claude/reports/architecture-report-20260404-103521.md

この設計を承認しますか？（yes / no）
> yes
```

### ステップ3 — 計画 → 実装 → テスト → レビュー

```
> /agent-planner            # plan-report を生成
> /agent-tester             # 失敗するテストを作成（Red）
> /agent-developer          # 実装（Green → Refactor）
> /agent-tester             # テスト再実行・test-report を出力
> /agent-code-reviewer      # code-review-report を出力
> /agent-security-reviewer  # security-review-report を出力
```

各ステップでタイムスタンプ付きのレポートが保存され、あなたの承認を待ってから次に進みます。

---

## マイルストーン機能

大規模な開発では、`plan-report` にマイルストーンを設定できます。マイルストーンとは「そこまで完了したら動作確認可能な状態」に相当する開発単位です。

プランナーは計画立案時に以下を確認します：

```
マイルストーン完了後の挙動を選択してください:
  [confirm] 各マイルストーン完了後に確認ダイアログを表示する
  [auto]    確認なしで自動的に次のマイルストーンへ進む
```

- `confirm` — 途中で作業を止めたい場合に選択
- `auto` — 今日中に全体を完了させたい場合に選択

---

## Human-in-the-Loop

Clade は各フェーズで必ずあなたの承認を求めます。AIが自律的に暴走することはありません。

- レポート生成 → **あなたが承認** → 次フェーズへ
- マイルストーン完了 → **あなたが確認**（`confirm` モード時）→ 次マイルストーンへ
- レビュー指摘 → **あなたが確認** → 修正サイクルへ
