# Architecture Patterns Rules

## 推奨パターン
- Repository パターン: データアクセス層の抽象化
- Service Layer: ビジネスロジックの集約
- CQRS: 読み書き分離が必要な場合（過剰設計に注意）
- Event-Driven: 非同期処理・疎結合が必要な場合

## アンチパターン（避けること）
- God Object: 1クラスに責務を詰め込みすぎない
- Anemic Domain Model: ドメインオブジェクトにロジックを持たせる
- Circular Dependency: 循環依存は必ず解消する
- Premature Optimization: 計測前の最適化はしない

## レイヤー規則
```
Presentation → Application → Domain → Infrastructure
```
各レイヤーは下位レイヤーにのみ依存する。上位レイヤーへの依存は禁止。
