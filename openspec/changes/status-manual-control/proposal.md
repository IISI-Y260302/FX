## Why

目前問題單狀態（Closed / Reopen）由系統自動判斷，邏輯依賴「問題原因及處理方式」、「處理完成日期」、「測試結果」、「覆測結果」欄位組合，容易造成使用者非預期的狀態變更。改為手動控制可讓使用者明確決定問題單當前狀態，減少誤判。

## What Changes

- **移除** GAS `autoUpdateStatus()` 自動狀態計算邏輯
- 問題單「問題狀態」欄位改為可手動選擇：Open / Closed / Reopen
- 表單（IssueFormView）新增「問題狀態」下拉選單，讓使用者直接設定
- GAS `updateIssue()` 直接儲存使用者傳入的 status，不再自動覆蓋

## Capabilities

### New Capabilities

（無）

### Modified Capabilities

- `issue-form`: 新增「問題狀態」手動選擇下拉（Open / Closed / Reopen），移除自動判斷說明
- `issue-detail`: 問題狀態流程說明更新為手動控制

## Impact

- `gas/Code.gs`：移除 `autoUpdateStatus()` 呼叫，`updateIssue()` 直接寫入 `body.status`
- `docs/app.js`：IssueFormView 新增「問題狀態」下拉欄位（`form.status`）
