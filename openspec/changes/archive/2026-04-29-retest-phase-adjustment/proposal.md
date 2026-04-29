## Why

目前問題單的「覆測階段」語意模糊，無法清楚區分「測試人員執行測試」與「業務單位確認覆測」兩個不同負責人的動作。拆分為兩個獨立階段可提升問題單流程的清晰度與責任歸屬。

## What Changes

- 將原「覆測階段」重新命名為「測試階段」，欄位保留：測試人員（下拉）、測試日期、測試結果（OK/NG）
- 新增「業務單位覆測階段」，欄位包含：業務單位覆測人員（**文字輸入框**，非下拉）、覆測日期、覆測結果（OK/NG）
- 問題單表單（新增/編輯）新增業務單位覆測階段區塊
- 問題單詳細頁新增業務單位覆測階段顯示區塊
- Google Sheets 新增對應欄位（業務單位覆測人員、覆測日期、覆測結果）
- GAS Code.gs 的讀取/寫入邏輯同步更新

## Capabilities

### New Capabilities

（無新增獨立 capability，屬於現有能力的欄位擴充）

### Modified Capabilities

- `issue-form`: 新增業務單位覆測階段區塊（業務單位覆測人員文字框、覆測日期、覆測結果），「覆測階段」標題改為「測試階段」
- `issue-detail`: 詳細頁新增業務單位覆測階段顯示區塊，標題同步調整

## Impact

- `docs/app.js`：IssueFormView、IssueDetailView 欄位與標題調整
- `gas/Code.gs`：`getIssues`、`addIssue`、`updateIssue` 欄位對應更新
- Google Sheets：需手動新增 3 個欄位（業務單位覆測人員、覆測日期、覆測結果）
