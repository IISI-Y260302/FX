## 1. 前端表單調整（IssueFormView）

- [x] 1.1 將「覆測階段」區塊標題改為「測試階段」
- [x] 1.2 移除「覆測階段」中的業務單位覆測人員（下拉）、覆測日期、覆測結果欄位
- [x] 1.3 新增「業務單位覆測階段」獨立卡片區塊，緊接在「測試階段」之後
- [x] 1.4 在「業務單位覆測階段」新增欄位：業務單位覆測人員（`<input type="text">`）
- [x] 1.5 在「業務單位覆測階段」新增欄位：覆測日期（`<input type="date">`）
- [x] 1.6 在「業務單位覆測階段」新增欄位：覆測結果（`<select>`: OK / NG）
- [x] 1.7 確認 `form` 物件新增對應欄位（`bizReviewer`、`reviewDate`、`reviewResult`）
- [x] 1.8 確認 `submit()` 送出 payload 包含新欄位

## 2. 前端詳細頁調整（IssueDetailView）

- [x] 2.1 將詳細頁「覆測階段」卡片標題改為「測試階段」
- [x] 2.2 移除詳細頁「測試階段」卡片中的業務單位覆測欄位
- [x] 2.3 新增「業務單位覆測階段」獨立卡片，顯示業務單位覆測人員、覆測日期、覆測結果

## 3. GAS 後端調整（Code.gs）

- [x] 3.1 確認 `COLUMN_MAP` 中有 `bizReviewer`（業務單位覆測人員）、`reviewDate`（覆測日期）、`reviewResult`（覆測結果）欄位對應
- [x] 3.2 確認 `getIssues()` 正確讀取上述三欄
- [x] 3.3 確認 `addIssue()` 與 `updateIssue()` 正確寫入上述三欄
- [x] 3.4 將修改後的 Code.gs 複製到 Google Apps Script 編輯器並部署新版本

## 4. Google Sheets 手動調整

- [x] 4.1 確認 Google Sheets 已有「業務單位覆測人員」、「覆測日期」、「覆測結果」欄位（若無則新增）
- [x] 4.2 確認欄位名稱與 GAS `COLUMN_MAP` 一致

## 5. 測試與部署

- [x] 5.1 新增問題單：確認業務單位覆測階段欄位正常顯示與儲存
- [x] 5.2 編輯問題單：確認業務單位覆測人員可自由輸入文字
- [x] 5.3 詳細頁：確認測試階段與業務單位覆測階段分別顯示正確
- [x] 5.4 更新 `index.html` 版本號（`app.js?v=N`），git push 部署至 GitHub Pages
