# CBC 系統測試問題管理系統

中央銀行外匯資料處理系統（FTE）Web 化問題單管理平台。

## 系統架構

```
GitHub Pages (靜態前端)
  └── Vue 3 + Tailwind CSS + Chart.js + SheetJS + jsPDF
        │
        │ HTTPS (JSON API)
        ▼
Google Apps Script (後端 API)
  └── 驗證 / CRUD / 統計 / 附件上傳
        │
        ├── Google Sheets (資料庫)
        └── Google Drive  (附件儲存)
```

## 部署步驟

### 步驟 1：建立 Google Sheets

1. 開啟現有的 `系統測試問題紀錄表.xlsx`，匯入 Google Sheets（或直接複製）
2. 新增一個分頁名稱為 **`使用者白名單`**，欄位如下：

   | A (Email) | B (姓名) | C (角色) |
   |-----------|---------|---------|
   | user@example.com | 王小明 | user |
   | admin@example.com | 管理員 | admin |

   > 角色只有 `user` 和 `admin` 兩種

3. 確認以下分頁名稱正確：
   - `系統測試問題紀錄表`（資料從第 6 列開始）
   - `測試案例編號及功能項目`（A欄：案例編號，B欄：功能名稱）
   - `使用者白名單`（如上）

### 步驟 2：建立 Google Drive 附件資料夾

1. 在 Google Drive 建立資料夾，例如 `/CBC問題單附件`
2. 記錄該資料夾的 ID（從 URL 取得：`https://drive.google.com/drive/folders/[FOLDER_ID]`）

### 步驟 3：建立 Google Apps Script

1. 在 Google Sheets 中點選「擴充功能 > Apps Script」
2. 刪除預設的 `Code.gs` 內容，貼上 `gas/Code.gs` 的完整內容
3. 儲存專案
4. 點選「專案設定（齒輪圖示）> 指令碼屬性」，新增：
   - 名稱：`DRIVE_FOLDER_ID`，值：步驟 2 取得的資料夾 ID

### 步驟 4：部署 Apps Script 為 Web App

1. 點選「部署 > 新增部署作業」
2. 選擇類型：**網路應用程式**
3. 設定：
   - **執行身分**：我（YOUR_GOOGLE_ACCOUNT）
   - **具有存取權的使用者**：所有人
4. 點選「部署」，複製 **網路應用程式 URL**

### 步驟 5：建立 Google OAuth 2.0 用戶端 ID

1. 前往 [Google Cloud Console](https://console.cloud.google.com/)
2. 建立專案（或使用現有專案）
3. 啟用「Google Identity」API
4. 「憑證 > 建立憑證 > OAuth 2.0 用戶端 ID」
5. 應用程式類型選「網頁應用程式」
6. **已授權的 JavaScript 來源** 填入：
   - `https://YOUR_USERNAME.github.io`（部署後）
   - `http://localhost:PORT`（本地測試用）
7. 複製**用戶端 ID**

### 步驟 6：設定前端

編輯 `docs/app.js`，填入以下設定：

```javascript
const CONFIG = {
  GAS_URL:          'https://script.google.com/macros/s/YOUR_DEPLOYMENT_ID/exec',
  GOOGLE_CLIENT_ID: 'YOUR_CLIENT_ID.apps.googleusercontent.com'
};
```

### 步驟 7：部署至 GitHub Pages

1. 將本專案推送至 GitHub Repository
2. 前往 Repository 設定 > Pages
3. Source 選擇 `main` branch，目錄選 `/docs`
4. 等待部署完成，取得網址（如 `https://USERNAME.github.io/REPO_NAME`）
5. 將此網址加入 Google Cloud Console 的已授權來源

## 專案結構

```
├── docs/                    # GitHub Pages 前端
│   ├── index.html           # 主頁面 (CDN 引入)
│   └── app.js               # Vue 3 應用程式
├── gas/
│   └── Code.gs              # Google Apps Script API
├── openspec/                # 變更規格文件
└── README.md
```

## 功能說明

| 功能 | 說明 |
|------|------|
| Google OAuth 登入 | 白名單管控，自動帶入姓名 |
| 問題單新增/編輯 | 20 欄位，分提出/處理/覆測三階段 |
| 問題單列表 | 篩選（狀態/嚴重度/人員）+ 關鍵字搜尋 |
| 軟刪除 | 提出人員可刪自己的；管理員可刪任何及還原 |
| 圖片附件 | 上傳至 Google Drive，存分享連結 |
| 儀表板 | 狀態/嚴重度/類型分布圓餅/長條圖 + 趨勢折線圖 |
| 匯出 Excel | SheetJS，對應原 Excel 欄位格式 |
| 匯出 PDF | jsPDF + AutoTable |

## 問題嚴重度定義

| 等級 | 說明 |
|------|------|
| 嚴重 | 整個系統測試中止 |
| 功能無法運作 | 某一類測試案例無法執行 |
| 中 | 一般性錯誤，其他測試可繼續 |
| 低 | 較小問題，測試不受影響 |
| 建議 | 系統改善建議 |

## 使用者角色權限

| 功能 | 一般使用者 | 管理員 |
|------|-----------|--------|
| 新增問題單 | ✅ | ✅ |
| 編輯自己的問題單 | ✅ | ✅ |
| 編輯他人的問題單 | ❌ | ✅ |
| 刪除自己的問題單 | ✅ | ✅ |
| 刪除他人的問題單 | ❌ | ✅ |
| 查看/還原已刪除 | ❌ | ✅ |
