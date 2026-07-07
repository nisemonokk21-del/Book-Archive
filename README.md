# SCRIPT VAULT

演技ワークショップの題材（本・シーン）をストックするためのWebアプリ。

## 主な機能

- **本棚**: 題材にする本をタイトル・著者・ジャンル・あらすじ・登場人物つきで登録
  - 登場人物ごとに名前＋役柄・年齢・性格・関係性などの詳細メモを記録
  - 登録した本の編集・削除（削除時は紐づくシーンも一緒に削除）
  - タイトル・著者・人物名での検索、ジャンル絞り込み
- **シーン**: 演じてみたい場面を本に紐づけて記録
  - 📷 ページを撮影／写真を選んで保存（自動で圧縮）
  - ページ数・感情タグ・シーンタグ・本文/セリフ・個人メモ
  - 本・感情タグ・キーワードでの絞り込み検索
  - シーンの編集・削除

## 技術構成

- React 18 + Vite（静的サイト）
- Firebase Authentication / Cloud Firestore
- 公開: GitHub Pages（`/Book-Archive/`）

外部サーバーや秘密のAPIキーは不要で、画面とFirebaseだけで完結します。

## セットアップ

```bash
npm install
npm run dev
```

## 公開（GitHub Pages）

`main` または `claude/acting-workshop-app-15580h` ブランチに push すると
GitHub Actions（`.github/workflows/deploy.yml`）が自動でビルドし、
`gh-pages` ブランチに配信します。

初回のみ、以下の設定が必要です。

1. **GitHub Pages を有効化**
   リポジトリの Settings → Pages → Build and deployment →
   Source を「Deploy from a branch」、Branch を `gh-pages` / `/(root)` に設定。
   公開URLは `https://<ユーザー名>.github.io/Book-Archive/`。
2. **Firebase の承認済みドメインに公開URLを追加**
   Firebase Console → Authentication → Settings → 承認済みドメイン に
   `<ユーザー名>.github.io` を追加（これがないとログインできません）。

## データ保存について

写真は保存前に長辺1000px・JPEGに圧縮され、1枚あたりおよそ100〜300KBで
Firestore のドキュメント内に保存されます（1ドキュメント1MB制限内）。
Firestore 無料枠（1GiB）でも数千枚規模まで保存できます。
写真を使わず本文の手入力だけにすれば、容量はほぼ消費しません。
