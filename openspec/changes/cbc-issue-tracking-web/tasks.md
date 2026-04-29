## 1. 前置準備

- [x] 1.1 建立 GitHub Repository，設定 GitHub Pages（從 main branch /docs 或獨立 gh-pages branch）
- [x] 1.2 建立 Google Sheets 工作簿：複製現有問題紀錄表結構，新增「使用者白名單」分頁（欄位：Email、姓名、角色）
- [x] 1.3 建立 Google Drive 資料夾 `/CBC問題單附件/`，記錄資料夾 ID
- [x] 1.4 建立 Google Apps Script 專案，連結至上述 Google Sheets
- [x] 1.5 在 Google Cloud Console 建立 OAuth 2.0 用戶端 ID（Web application），設定授權來源為 GitHub Pages 網址

## 2. Google Apps Script 後端 API

- [x] 2.1 實作 `doGet` / `doPost` 路由框架，加入 CORS 標頭
- [x] 2.2 實作 `verifyToken(idToken)` 函式：呼叫 Google tokeninfo API 驗證 id_token，回傳 email
- [x] 2.3 實作 `getUserRole(email)` 函式：查詢使用者白名單分頁，回傳角色（admin / user / null）
- [x] 2.4 實作 `action=getOptions` API：回傳所有下拉選單資料（嚴重度、問題類型、測試結果、使用者名單、測試案例編號）
- [x] 2.5 實作 `action=list` API：讀取問題單列表，支援狀態/嚴重度/提出人員篩選參數，一般使用者過濾已刪除
- [x] 2.6 實作 `action=create` API：新增問題單，自動產生流水號編號（當前分頁最大編號+1，格式 0001）
- [x] 2.7 實作 `action=update` API：更新問題單欄位，驗證使用者角色與提出人員權限
- [x] 2.8 實作 `action=delete` API：軟刪除（更新問題狀態為「已刪除」），驗證刪除權限
- [x] 2.9 實作 `action=restore` API（管理員限定）：將已刪除問題單狀態還原為「Open」
- [x] 2.10 實作 `action=uploadFile` API：接收 base64 圖片，上傳至 Google Drive 對應資料夾，回傳分享連結
- [x] 2.11 實作 `action=stats` API：計算各統計維度數據（狀態分布、嚴重度分布、類型分布、近30日趨勢）
- [x] 2.12 部署 Apps Script 為 Web App（執行身分：我、存取對象：所有人），記錄 Web App URL

## 3. 前端基礎架構

- [x] 3.1 建立前端目錄結構：`index.html`、`app.js`、`style.css`（或使用子目錄）
- [x] 3.2 引入 CDN 依賴：Vue 3、Tailwind CSS、Chart.js、SheetJS、Google Identity Services SDK（已移除 jsPDF）
- [x] 3.3 實作 Google OAuth 登入頁面：顯示「以 Google 帳號登入」按鈕，登入後儲存 id_token 至 sessionStorage
- [x] 3.4 實作 API 呼叫封裝模組：所有 fetch 請求自動帶入 Authorization id_token，處理 403/401 回應導回登入頁
- [x] 3.5 實作路由機制（Vue Router 或 hash 路由）：登入頁 / 列表頁 / 新增頁 / 詳細頁 / 儀表板頁（儀表板為預設首頁）
- [x] 3.6 實作 Header 元件：顯示登入使用者姓名、角色標示、登出按鈕、頁面導覽連結

## 4. 問題單列表頁

- [x] 4.1 實作列表頁面，以表格顯示問題單（編號、提出日期、提出人員、功能項目、嚴重度、狀態、類型）
- [x] 4.2 實作篩選區塊：狀態下拉、嚴重度下拉、提出人員下拉、關鍵字搜尋輸入
- [x] 4.3 管理員顯示「顯示已刪除」勾選選項，勾選時列表包含已刪除問題單（以灰底區分）
- [x] 4.4 問題單編號欄位為連結，點擊導向詳細頁
- [x] 4.5 列表頁顯示「新增問題單」按鈕（所有登入使用者可見）

## 5. 問題單新增/編輯表單

- [x] 5.1 實作新增表單頁面，分三個區塊（提出/處理/覆測）顯示欄位
- [x] 5.2 提出人員欄位自動帶入登入者姓名（唯讀），提出日期預設今日
- [x] 5.3 測試案例編號下拉選單，選擇後自動填入測試功能項目
- [x] 5.4 問題嚴重度下拉（嚴重 / 功能無法運作 / 中 / 低 / 建議）
- [x] 5.5 問題類型下拉（Bug / 操作錯誤 / 需求 / 資料問題）
- [x] 5.6 測試/覆測結果下拉（OK / NG）
- [x] 5.7 實作附件上傳元件：支援 JPG/PNG/GIF，單檔 5MB 上限，最多 5 個附件，顯示縮圖預覽
- [x] 5.8 實作表單驗證：必填欄位（問題描述、問題嚴重度）
- [x] 5.9 實作編輯模式：依使用者角色控制欄位唯讀/可編輯狀態（非提出人員無法修改提出階段欄位）
- [x] 5.10 表單送出後回傳列表頁並顯示成功訊息

## 6. 問題單詳細頁

- [x] 6.1 實作詳細頁，分三個卡片區塊顯示提出/處理/覆測欄位
- [x] 6.2 附件區塊顯示縮圖，點擊開啟 Google Drive 原始連結
- [x] 6.3 顯示「編輯」按鈕（依角色決定可見性）
- [x] 6.4 提出人員或管理員顯示「刪除」按鈕，點擊彈出確認對話框後執行軟刪除
- [x] 6.5 管理員對已刪除問題單顯示「還原」按鈕

## 7. 儀表板頁

- [x] 7.1 實作儀表板頁面，頂部顯示 4 個數字摘要卡片（總數、Open 中、本週新增、本週關閉）
- [x] 7.2 實作問題狀態分布圓餅圖（Chart.js Pie）
- [x] 7.3 實作問題嚴重度分布長條圖（Chart.js Bar）
- [x] 7.4 實作問題類型分布長條圖（Chart.js Bar）
- [x] 7.5 實作近 30 天每日新增趨勢折線圖（Chart.js Line）

## 8. 匯出功能

- [x] 8.1 實作「匯出 Excel」功能：呼叫 Apps Script 取得完整資料 JSON，用 SheetJS 產生 .xlsx 檔案，欄位順序對應原 Excel
- ~~8.2 實作「匯出 PDF」功能（列表）~~ ❌ 已移除（jsPDF 不支援 CJK 字符）
- ~~8.3 實作單一問題單「列印/匯出 PDF」~~ ❌ 已移除

## 9. 測試與部署

- [x] 9.1 測試 Google OAuth 登入流程（白名單內/外帳號）
- [x] 9.2 測試問題單 CRUD 操作（新增、編輯、刪除、還原）
- [x] 9.3 測試角色權限控制（一般使用者 vs 管理員）
- [x] 9.4 測試圖片附件上傳（正常上傳、格式錯誤、超過大小）
- [x] 9.5 測試 Excel 與 PDF 匯出正確性
- [x] 9.6 確認 GitHub Pages 部署正常，HTTPS 連線無誤
- [x] 9.7 更新 README：記錄系統架構、部署步驟、Google Apps Script 設定說明
