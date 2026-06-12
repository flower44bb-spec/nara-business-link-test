# Instagram投稿連携の設定

事業者詳細ページから、管理者が承認済み・画像付きの事業者紹介をInstagramへ投稿できます。

## Meta側の準備

1. `@narakenseiren` をInstagramプロアカウント（ビジネスまたはクリエイター）にします。
2. InstagramアカウントをFacebookページへ接続します。
3. Meta for Developersでアプリを作成し、Instagram APIを追加します。
4. 投稿に必要な権限を付与した長期アクセストークンを発行します。
5. InstagramビジネスアカウントIDを取得します。

権限や審査の要否はMetaアプリの利用形態によって異なります。MetaのContent Publishing APIの案内を確認してください。

## Vercel環境変数

Production、Preview、Developmentの必要な環境へ次を登録します。

```text
INSTAGRAM_BUSINESS_ACCOUNT_ID=InstagramビジネスアカウントID
INSTAGRAM_ACCESS_TOKEN=長期アクセストークン
META_GRAPH_API_VERSION=v23.0
```

アクセストークンには `NEXT_PUBLIC_` を付けないでください。ブラウザへ公開されないサーバー専用環境変数として保存します。

## Supabase

SQL Editorで次のmigrationを実行します。

```text
supabase/migrations/202606120002_instagram_publish_logs.sql
```

ログテーブルが未作成でもInstagram投稿処理は実行できますが、投稿履歴は保存されません。

## 利用方法

1. 管理者でログインします。
2. 承認済みで画像が登録された事業者詳細を開きます。
3. 「Instagramへ投稿」を押します。
4. 投稿文を確認・編集し、「内容を確認して投稿」を押します。

Instagramは外部から取得できる公開HTTPS画像を必要とします。Supabase Storageの画像バケットを公開設定にしてください。
