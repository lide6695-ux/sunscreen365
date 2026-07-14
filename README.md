# 防晒 365

可嵌入 Notion 的防晒打卡网页，记录保存在 Supabase。

## 部署

1. 在 Supabase 新建项目。
2. 打开 SQL Editor，执行 `supabase/schema.sql`。
3. 在 Project Settings -> API 复制：
   - Project URL
   - anon public key
4. 在 Vercel 导入这个项目。
5. 添加环境变量：
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`
6. 部署后，把 Vercel URL 用 Notion `/embed` 嵌入。

## 本地检查

```bash
pnpm install
pnpm build
```

## Vercel 环境变量

```text
VITE_SUPABASE_URL=你的 Supabase Project URL
VITE_SUPABASE_ANON_KEY=你的 Supabase anon public key
```
