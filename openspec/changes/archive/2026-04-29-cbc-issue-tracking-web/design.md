## Context

CBC 系統測試目前以 Excel 管理問題單，多人協作困難。本設計採用 GitHub Pages（靜態前端）+ Google Apps Script（API）+ Google Sheets（資料庫）的無伺服器架構，最大化利用 Google Workspace 生態系統，零基礎設施成本。

現有 Google Sheets 問題紀錄表結構良好，可直接沿用並擴充。

## Goals / Non-Goals

**Goals:**
- 提供 Web 化問題單 CRUD 操作
- Google OAuth 身分驗證與角色權限控管
- 圖片附件上傳至 Google Drive
- 問題統計儀表板
- 匯出 Excel / PDF
- 完全免費、無需維護伺服器

**Non-Goals:**
- 即時通知（Email 通知非本次範圍）
- 行動 App
- 多語言（繁中為主）
- 自訂工作流程引擎

## Decisions

### D1: 後端採用 Google Apps Script 而非 Node.js / Firebase Functions
**決策**: 使用 Google Apps Script Web App 作為 API 層
**理由**: 
- 直接使用 SpreadsheetApp / DriveApp 原生 API，無需額外授權設定
- 免費額度充足（6分鐘執行時間/次，每日執行上限充裕）
- 不需要管理伺服器、CI/CD pipeline

**替代方案**: Firebase Functions → 需要 Firebase 專案設定、計費設定，複雜度較高

### D2: 前端採用 Vue 3 CDN + Tailwind CSS CDN
**決策**: 不使用打包工具（Webpack/Vite），直接以 CDN 引入
**理由**:
- GitHub Pages 部署簡單，無需 build 流程
- 專案規模小，CDN 方案足夠
- 降低維護複雜度

**替代方案**: React + Vite → 需要 Node.js 環境與 GitHub Actions CI/CD

### D3: 軟刪除而非硬刪除
**決策**: 問題狀態欄新增「已刪除」值，不移除 Sheets 列
**理由**: 保留稽核軌跡，避免誤刪後無法復原；Sheets 不適合頻繁的列刪除操作

### D4: id_token 驗證而非 Session
**決策**: 前端每次 API 呼叫攜帶 Google id_token，Apps Script 呼叫 tokeninfo API 驗證
**理由**: 靜態前端無法維護 Session；id_token 短效（1小時），安全性足夠
**風險**: tokeninfo API 呼叫增加每次請求延遲約 200-500ms → 可接受

### D5: 匯出在前端完成
**決策**: 由 Apps Script 回傳完整 JSON，前端用 SheetJS（Excel）與 jsPDF（PDF）產生檔案
**理由**: 減少 Apps Script 執行時間；避免二進位檔案在 Apps Script 傳輸的複雜性

## Risks / Trade-offs

- **[Apps Script Cold Start]** 久未使用後首次呼叫約 2-3 秒 → 前端顯示 loading 狀態緩解體驗問題
- **[Google Sheets 列數上限]** 單一 Sheet 建議不超過 50,000 列 → 每專案一個 Sheet 分頁，問題單量不會達到上限
- **[CORS 設定]** Apps Script Web App 須設定為「所有人（包含匿名）可存取」，由 id_token 驗證控管安全 → 可接受
- **[Apps Script 執行配額]** 每日呼叫次數有限制（免費版 20,000 次/日）→ 測試團隊規模下不會觸及上限
- **[圖片大小]** Google Drive 上傳大圖可能逾時 → 前端限制附件上傳大小為 5MB

## Migration Plan

1. 複製現有 Google Sheets 問題紀錄表，作為 Web 系統資料來源
2. 新增「使用者白名單」分頁
3. 部署 Google Apps Script Web App
4. 建立 GitHub Repository，部署前端至 GitHub Pages
5. 現有 Excel 資料可手動匯入或繼續並行使用

## Open Questions

- 是否需要多專案切換功能（目前假設單一專案一個 Sheets）？
- 問題單編號格式是否需加入專案代號前綴（如 `FTE-0001`）？
