## 1. Header 漢堡選單

- [x] 1.1 在 App 根元件加入 `mobileMenuOpen` ref，控制選單展開/收合狀態
- [x] 1.2 Header 新增漢堡選單按鈕（`md:hidden`），圖示切換 ☰ / ✕
- [x] 1.3 桌面導覽連結加上 `hidden md:flex`，手機隱藏
- [x] 1.4 新增手機版垂直選單 block（`md:hidden`），含儀表板、問題單列表、新增問題單連結
- [x] 1.5 `navigate()` 函式內加入 `mobileMenuOpen.value = false`，點擊後自動收合選單

## 2. 問題單列表頁

- [x] 2.1 列表頁新增卡片列表 block（`block md:hidden`），每張卡片顯示編號、功能項目、嚴重度、狀態
- [x] 2.2 原有表格加上 `hidden md:block`，手機隱藏
- [x] 2.3 卡片點擊事件導向詳細頁（與表格列相同行為）
- [x] 2.4 篩選區塊調整為手機友善排列（欄位垂直堆疊）

## 3. 問題單表單頁

- [x] 3.1 表單各區塊（提出/處理/覆測）內的欄位格 `grid` 調整：手機單欄（`grid-cols-1`），桌面雙欄（`md:grid-cols-2`）
- [x] 3.2 確認所有 input / select / textarea 高度與 padding 適合觸控（`py-2` 以上）
- [x] 3.3 送出/取消按鈕調整為手機全寬（`w-full md:w-auto`）

## 4. 問題單詳細頁

- [x] 4.1 詳細頁欄位 grid 調整：手機單欄（`grid-cols-1`），桌面雙欄（`md:grid-cols-2`）
- [x] 4.2 操作按鈕列（編輯/刪除/還原）調整為手機 flex-wrap 或垂直排列
- [x] 4.3 確認附件縮圖在手機螢幕正常顯示且可點擊

## 5. 儀表板頁

- [x] 5.1 數字摘要卡片 grid 改為 `grid-cols-2 md:grid-cols-4`
- [x] 5.2 圖表容器 grid 改為 `grid-cols-1 md:grid-cols-2`
- [x] 5.3 Chart.js 選項確認設定 `responsive: true, maintainAspectRatio: false`，並為各圖表容器設定適當高度

## 6. 附件上傳

- [x] 6.1 確認 `<input type="file" accept="image/*">` 在手機可正常觸發相機/相簿選擇器
- [x] 6.2 附件刪除按鈕確認觸控區域足夠（padding 至少 `p-2`）

## 7. 測試與部署

- [ ] 7.1 使用瀏覽器 DevTools 模擬 iPhone SE（375px）、iPhone 14（390px）、iPad（768px）驗證各頁面版面
- [ ] 7.2 實機測試：Android 或 iOS 手機確認漢堡選單、卡片列表、表單輸入正常
- [x] 7.3 更新 `index.html` 版本號（`app.js?v=N`），git push 部署至 GitHub Pages
