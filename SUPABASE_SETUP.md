# Supabase追加機能セットアップ

1. Supabase DashboardのSQL Editorで
   `supabase/migrations/202606090001_membership_social_features.sql`
   を実行します。
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
