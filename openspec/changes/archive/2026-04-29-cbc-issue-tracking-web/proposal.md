## Why

目前 CBC（中央銀行外匯資料處理系統）系統測試問題單以 Excel 檔案管理，多人協作時容易發生版本衝突、難以即時追蹤問題狀態，且無法支援統計分析與儀表板展示。需要一個 Web 化的問題單管理系統，讓測試團隊可以隨時在線上新增、追蹤、更新問題單，並提供統計視覺化與報表匯出功能。

## What Changes

- 建立靜態 Web 前端，部署於 GitHub Pages
- 使用 Google Apps Script 作為 API 後端，直接讀寫 Google Sheets
- 以 Google Sheets 作為資料儲存，延續現有問題紀錄表格式
- 問題單附件（圖片/截圖）上傳至 Google Drive，Sheets 中儲存連結
- 使用 Google OAuth 進行身分驗證，控管存取權限
- 提出人員自動帶入登入者姓名；處理人員、覆測人員從固定名單下拉選擇
- 問題單流水號每專案從 0001 重新計算
- 軟刪除機制：問題單標記為「已刪除」，不從 Sheets 移除
- 刪除權限：提出人員可刪除自己的問題單；管理員可刪除任何問題單
- 問題嚴重度調整為：嚴重 / 功能無法運作 / 中 / 低 / 建議
- 儀表板展示問題統計（嚴重度分布、狀態分布、類型分布、每日趨勢）
- 支援匯出為 Excel（SheetJS）與 PDF（jsPDF）

## Capabilities

### New Capabilities

- `issue-form`: 問題單新增/編輯表單，含 20 個欄位、下拉選單、附件上傳
- `issue-list`: 問題單列表頁，含篩選（狀態/嚴重度/提出人員）與搜尋
- `issue-detail`: 問題單詳細頁，分三階段（提出/處理/覆測）顯示與編輯
- `issue-delete`: 軟刪除功能，依角色控制刪除權限
- `user-auth`: Google OAuth 登入、使用者白名單管理、角色權限（一般/管理員）
- `file-upload`: 圖片/截圖上傳至 Google Drive，回傳分享連結
- `dashboard`: 問題統計儀表板，Chart.js 圖表展示
- `data-export`: 匯出 Excel（SheetJS）與 PDF（jsPDF）

### Modified Capabilities

（無現有規格需修改）

## Impact

- **前端**：GitHub Pages 靜態網站（Vue 3 CDN + Tailwind CSS CDN + Chart.js + SheetJS + jsPDF）
- **後端**：Google Apps Script Web App（doGet / doPost API）
- **資料**：Google Sheets（沿用現有問題紀錄表結構，新增使用者白名單分頁）
- **儲存**：Google Drive（問題單附件）
- **認證**：Google Identity Services（OAuth 2.0 id_token 驗證）
- **外部依賴**：Google Workspace（Sheets API、Drive API、tokeninfo API）
