## ADDED Requirements

### Requirement: Google OAuth 登入
系統 SHALL 使用 Google Identity Services (GIS) SDK 實作 Google OAuth 2.0 登入，未登入使用者只能看到登入頁面。

#### Scenario: 使用者登入
- **WHEN** 未登入使用者點擊「以 Google 帳號登入」按鈕並完成 Google 授權
- **THEN** 系統取得 id_token、解析使用者 email 與姓名，與 Google Sheets 白名單比對後允許進入系統

#### Scenario: 非白名單使用者登入
- **WHEN** 使用者以白名單外的 Google 帳號登入
- **THEN** 系統顯示「您的帳號尚未獲得授權，請聯絡管理員」，拒絕進入系統

#### Scenario: 使用者登出
- **WHEN** 使用者點擊「登出」
- **THEN** 系統清除本機 token，返回登入頁面

#### Scenario: Token 過期
- **WHEN** 使用者的 id_token 已過期（超過 1 小時）且嘗試執行操作
- **THEN** 系統提示「登入已過期，請重新登入」，引導使用者重新授權

### Requirement: 使用者角色權限
系統 SHALL 支援兩種角色：一般使用者與管理員，角色定義於 Google Sheets 使用者白名單分頁。

| 功能 | 一般使用者 | 管理員 |
|------|-----------|--------|
| 新增問題單 | ✅ | ✅ |
| 編輯自己的問題單 | ✅ | ✅ |
| 編輯他人的問題單 | ❌ | ✅ |
| 刪除自己的問題單 | ✅ | ✅ |
| 刪除他人的問題單 | ❌ | ✅ |
| 還原已刪除問題單 | ❌ | ✅ |
| 查看已刪除問題單 | ❌ | ✅ |

#### Scenario: 管理員取得完整操作權限
- **WHEN** 管理員登入系統
- **THEN** 所有管理功能（刪除任意問題單、查看已刪除）皆可存取

#### Scenario: API 層權限驗證
- **WHEN** 任意 API 呼叫帶有 id_token
- **THEN** Apps Script 驗證 token 有效性及使用者角色，不符合權限的操作回傳 HTTP 403
