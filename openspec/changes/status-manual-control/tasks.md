## 1. GAS 後端調整（Code.gs）

- [ ] 1.1 移除 `updateIssue()` 中的 `autoUpdateStatus(sheet, rowIdx)` 呼叫
- [ ] 1.2 在 `updateIssue()` 中新增 `setCell(sheet, rowIdx, COL.STATUS, body.status)` 寫入使用者傳入的狀態
- [ ] 1.3 刪除（或保留備用）`autoUpdateStatus()` 函式
- [ ] 1.4 將修改後的 Code.gs 複製到 Google Apps Script 編輯器並部署新版本

## 2. 前端表單調整（IssueFormView）

- [ ] 2.1 在「業務單位覆測階段」區塊新增「問題狀態」下拉（Open / Closed / Reopen）
- [ ] 2.2 確認 `form.status` 預設值為 `'Open'`（新增時）
- [ ] 2.3 確認 `submit()` payload 已包含 `status`（`...form` 展開即包含）

## 3. 測試與部署

- [ ] 3.1 新增問題單：確認狀態預設 Open，可手動改為 Closed / Reopen
- [ ] 3.2 編輯問題單：確認儲存後狀態依選擇更新，不被自動覆蓋
- [ ] 3.3 更新 `index.html` 版本號（`app.js?v=N`），git push 部署至 GitHub Pages
