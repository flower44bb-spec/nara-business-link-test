# Supabase追加機能セットアップ

1. Supabase DashboardのSQL Editorで
   `supabase/migrations/202606090001_membership_social_features.sql`
   を実行します。
   続けて、トップページの実績集計用に
   `supabase/migrations/202606100001_business_metrics.sql`
   を実行します。
   事業者詳細項目と画像保存用に
   `supabase/migrations/202606100002_business_details_and_images.sql`
   も実行します。
   プロフィール・マルシェ画像用に
   `supabase/migrations/202606100003_profile_and_marche_images.sql`
   も実行します。
2. migration末尾のSQLを使い、最初の管理者を1名設定します。

```sql
update public.profiles
set role = 'admin'
where email = '管理者のメールアドレス';
```

3. Storageに以下の公開バケットが作成されていることを確認します。
   - `business-images`（既存）
   - `profile-images`
   - `marche-images`
4. Authのメール確認設定とSite URL、Redirect URLにVercelのURLを設定します。
5. LINE送信は未接続です。`notification_logs` の `delivery_status = 'pending'`
   をSupabase Edge Functionなどで監視し、Messaging APIへ接続できます。

## 既存データ

既存の `businesses`、`problems`、`collaborations`、`successes` は
`approval_status = 'approved'` として維持されます。migrationはテーブルや行を削除しません。
