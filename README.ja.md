# Clade

**Clade** は [Claude Code](https://claude.ai/code) 上に構築されたマルチエージェント開発支援フレームワークです。  
インタビュアー・アーキテクト・プランナー・デベロッパー・テスター・レビュアーといった役割ごとに専門エージェントを用意し、構造化されたワークフローで連携させます。設定はすべて Markdown ファイルで記述するため、コードを書く必要はありません。

---

## 特徴

- **役割ベースのエージェント** — 各エージェントに明確な責務とルールを定義
- **構造化されたワークフロー** — 要件定義 → 設計 → 計画 → 実装 → テスト → レビューのフェーズ構成
- **Human-in-the-Loop** — 各フェーズでレポートを出力し、あなたの承認を待ってから次へ進む
- **完全カスタマイズ可能** — エージェント・ルール・スキルをチームの規約に合わせて自由に変更できる
- **コード不要** — すべての設定を Markdown ファイルで管理

---

## 必要なもの

- [Claude Code](https://claude.ai/code)（CLI または VS Code 拡張）
- Node.js v18 以上
- Git
- Windows（WSL 不要）

---

## はじめ方

### 1. リポジトリをクローンする

```bash
git clone https://github.com/satoh-y-0323/clade.git clade
cd clade
```

### 2. セットアップスクリプトを実行する

```powershell
# Windows（PowerShell）
Set-ExecutionPolicy -Scope Process -ExecutionPolicy Bypass
.\setup.ps1 -ProjectPath "C:\path\to\your\project"
```

`-ProjectPath` にはセットアップしたいプロジェクトのフルパスを指定します。  
`.claude/` ディレクトリをプロジェクトにコピーし、セッション管理フックを初期化します。

### 3. コーディング規約を設定する（推奨）

プロジェクトで Claude Code を開き、以下を実行します：

```
/agent-project-setup
```

使用言語とコーディング規約についてヒアリングし、`.claude/skills/project/coding-conventions.md` を自動生成します。

### 4. 作業を開始する

```
/agent-interviewer    # 要件ヒアリングから始める
```

または、任意のエージェントから直接始めることもできます：

```
/agent-developer      # 実装から始める
/agent-architect      # 設計から始める
```

---

## ワークフロー

```
フェーズ1: 要件定義・設計
  /agent-interviewer  →  requirements-report（要件定義レポート）
  /agent-architect    →  architecture-report（アーキテクチャレポート）

フェーズ2: 計画立案
  /agent-planner      →  plan-report（作業計画レポート）

フェーズ3: 実装・テスト（TDDサイクル）
  /agent-tester       →  失敗するテストを作成（Red）
  /agent-developer    →  実装（Green → Refactor）
  /agent-tester       →  テスト確認・test-report（テストレポート）

フェーズ4: レビュー
  /agent-code-reviewer      →  code-review-report（コードレビューレポート）
  /agent-security-reviewer  →  security-review-report（セキュリティ診断レポート）
  /agent-planner            →  更新された plan-report

すべての指摘がなくなるまでフェーズ3〜4を繰り返す。
```

レポートはすべてタイムスタンプ付きで `.claude/reports/` に保存されます。  
各フェーズはあなたの承認を待ってから次に進みます。

---

## 利用可能なエージェント

| コマンド | 役割 |
|---|---|
| `/agent-interviewer` | 要件ヒアリング |
| `/agent-architect` | システム設計・アーキテクチャ |
| `/agent-planner` | タスク計画・調整 |
| `/agent-developer` | 実装・デバッグ |
| `/agent-tester` | テスト設計・実行 |
| `/agent-code-reviewer` | コード品質レビュー |
| `/agent-security-reviewer` | セキュリティ脆弱性診断 |
| `/agent-project-setup` | コーディング規約の設定 |
| `/agent-mcp-setup` | MCP サーバの設定 |

---

## カスタマイズ

### コーディング規約
`/agent-project-setup` を実行すると、言語ごとの規約を対話形式で設定できます。  
TypeScript・Python・C#・Go・Java・Ruby など、あらゆる言語に対応しています。  
チーム独自のルールや社内コーディング規約も追加できます。

### スキル
プロジェクト固有の手順や規約を `.claude/skills/project/` に追加します。  
ここに置いたファイルは関連するエージェントが自動的に参照します。

### ルール
`.claude/rules/` を編集してエージェントの動作をカスタマイズできます。  
全エージェント共通の設定と、エージェントごとの個別設定の両方に対応しています。

### MCP サーバの追加
`/agent-mcp-setup` を実行すると、公開 MCP サーバや社内プライベート MCP サーバを追加し、スキルファイルを自動生成できます。

---

## セッション管理

```
/init-session    # 前回のセッション状態を復元する
/end-session     # セッションを保存して終了する
/status          # 現在のセッション状態を確認する
```

セッションの状態・メモリ・学習したパターンはセッションをまたいで自動保存されます。

---

## プロジェクト構成

```
clade/
├── .claude/             # Clade の設定（setup.ps1 がコピーするもの）
│   ├── agents/          # エージェント定義（YAML frontmatter + 指示）
│   ├── commands/        # カスタムスラッシュコマンド（/agent-xxx）
│   ├── hooks/           # ライフサイクルフック（セッション開始/終了・ツール前後）
│   ├── rules/           # エージェントの行動ルール（共通 + エージェントごと）
│   ├── skills/
│   │   └── project/     # プロジェクト固有のスキルファイル（コーディング規約等）
│   ├── reports/         # 生成されたレポート（自動作成）
│   ├── memory/          # セッションメモリ（自動管理）
│   └── CLAUDE.md        # Claude Code のエントリポイント
├── setup.ps1            # 既存プロジェクトへの導入スクリプト
├── README.md
└── LICENSE
```

---

## ライセンス

[MIT ライセンス](LICENSE)（[日本語参考訳](LICENSE.ja.md)）
