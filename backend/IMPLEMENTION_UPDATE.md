# Backend 仕様変更書

対象：Blog Risk Checker Backend（FastAPI）
認証：Firebase Auth または Google Cloud Identity Platform が発行する **IDトークン（JWT）** を検証する方式
DB：GCP DB に **ユーザプロファイル** と **check所有者** を保存する（パスワードは保存しない）

---

## 1. 変更目的

Backend は、各 `/v1/*` API で **ログイン済みユーザのID（uid）** を確定する。
Backend は、`checkId` 等のリソースを **uid単位で分離**し、不正アクセスを防ぐ。

---

## 2. 変更範囲

### 2.1 認証の追加（必須）

* すべての `/v1/*` エンドポイントは **認証必須**とする。
* リクエストは `Authorization: Bearer <id_token>` を必須とする。

### 2.2 所有者チェック（必須）

* `checkId` を入力に取る処理は、**checkの所有者 uid と一致**する場合のみ実行する。

### 2.3 DBレイヤ追加/変更（必須）

* `users`：uid を主キーにユーザプロファイルを保存する。
* `checks`：`checkId -> uid` の紐付けを永続化する（最低限これだけ必要）。

---

## 3. 認証仕様

### 3.1 リクエスト要件

* Header：

  * `Authorization: Bearer <id_token>`
  * `Content-Type: application/json`

### 3.2 トークン検証要件

Backend は、各リクエストで以下を検証する。

* token の署名が正しい
* token が期限切れではない
* 発行元（issuer）が正しい
* 宛先（audience / project）が正しい

Backend は、検証結果から以下を取り出す。

* `uid`（ユーザ識別子）
* `email`（取得できる場合）

### 3.3 認証失敗時のレスポンス

* token 不在 / 不正 / 期限切れ → `401 UNAUTHORIZED`
* token 正常だが所有者不一致 → `403 FORBIDDEN`

エラーフォーマット（既存方針踏襲）

```json
{
  "error": "UNAUTHORIZED",
  "message": "Missing or invalid token"
}
```

---

## 4. API仕様変更

### 4.1 新規：GET /v1/auth/me

目的：Backend が「ログイン済みユーザ」と「ユーザプロファイル」を返す。

**Request**

* `Authorization: Bearer <id_token>`

**Response 200**

```json
{
  "uid": "abc123",
  "email": "user@example.com",
  "role": "user",
  "profile": {
    "displayName": null,
    "defaultTone": "neutral",
    "defaultAudience": "general",
    "defaultPublishScope": "public"
  },
  "createdAt": "2026-01-31T00:00:00Z",
  "updatedAt": "2026-01-31T00:00:00Z",
  "lastLoginAt": "2026-01-31T00:00:00Z"
}
```

**挙動（初回ログイン同期）**

* `users/{uid}` が存在しない場合、Backend はレコードを作成する。
* 存在する場合、`lastLoginAt` と `updatedAt` を更新する。

---

### 4.2 既存：POST /v1/checks（認証必須 + 所有者紐付け）

**追加仕様**

* Backend は `uid` を取得する。
* Backend は `checkId` を発行する（uuid 推奨）。
* Backend は DB に `checks/{checkId}` を作成し、`uid` を保存する。

**推奨レスポンス（互換のため任意）**

* 既存レスポンスに影響を出したくない場合、`uid` は返さない。
* 返す場合は以下を追加してよい。

```json
{
  "checkId": "uuid",
  "report": { "...": "..." }
}
```

---

### 4.3 既存：POST /v1/checks/{checkId}/recheck（認証必須 + 所有者必須）

**追加仕様**

* Backend は `checks/{checkId}.uid` を読み、リクエストの `uid` と比較する。
* 一致しない場合、`403` を返す。
* 一致する場合のみ再解析する。

---

### 4.4 既存：POST /v1/patches（認証必須 + 所有者必須）

**追加仕様**

* Request に `checkId` を必須入力として扱う（finding単体では所有者判定できないため）。
* Backend は `checks/{checkId}.uid` と一致する場合のみ patch 生成を実行する。

---

### 4.5 既存：POST /v1/persona-review（認証必須 + 所有者必須）

**追加仕様**

* Request に `checkId` を必須入力として扱う。
* Backend は `checks/{checkId}.uid` 一致の場合のみ処理する。

---

### 4.6 既存：POST /v1/release（認証必須 + 所有者必須）

**追加仕様**

* Backend は `checks/{checkId}.uid` 一致を必須にする。
* `verdict='ok'` 条件は従来どおり強制する。
* Release 結果を保存する場合、`releases` に `uid` を保存する。

---

## 5. データモデル仕様（GCP DB）

### 5.1 users（必須）

キー：`uid`

フィールド

* `uid: string`（PK）
* `email: string | null`
* `role: 'user' | 'admin'`（MVPは `user` 固定でよい）
* `profile.displayName: string | null`
* `profile.defaultTone: string`
* `profile.defaultAudience: string`
* `profile.defaultPublishScope: string`
* `createdAt: timestamp`
* `updatedAt: timestamp`
* `lastLoginAt: timestamp`

### 5.2 checks（必須：所有者判定のため）

キー：`checkId`

フィールド

* `checkId: string`（PK）
* `uid: string`（owner）
* `createdAt: timestamp`
* `updatedAt: timestamp`

---

## 6. Backend 実装要件（設計）

### 6.1 認証依存関係

Backend は `get_current_user()` を提供する。

* 入力：Request headers
* 出力：`{ uid, email }`
* 失敗：`401`

各エンドポイントは `get_current_user()` を必須で呼ぶ。

### 6.2 所有者チェック関数

Backend は `assert_check_owner(uid, checkId)` を提供する。

* `checks/{checkId}` が存在しない → `404`（または `403`。方針を固定する）
* owner 不一致 → `403`
* 一致 → 続行

---

## 7. 設定（環境変数）

### 7.1 Backend（必須）

* `GOOGLE_CLOUD_PROJECT`
* `AUTH_PROVIDER`：`firebase` / `identity_platform`
* `DB_KIND`：`firestore` / `cloudsql`

### 7.2 Backend（任意）

* `CORS_ALLOWED_ORIGINS`
* `LOG_LEVEL`

---

## 8. ログと監査（推奨）

Backend は以下をログに出す。

* `uid`（PIIを避けたい場合はハッシュ化）
* `checkId`
* endpoint 名
* 処理時間
* 認証失敗理由（token内容は出さない）

---

## 9. 受け入れ基準

* 未認証で `/v1/checks` を呼ぶと `401` が返る。
* ユーザAの `checkId` をユーザBが `/recheck` すると `403` が返る。
* `/v1/auth/me` は初回呼び出しで `users/{uid}` を作成する。
* `/v1/patches` `/v1/persona-review` `/v1/release` は `checkId` 所有者一致を必須にする。

---