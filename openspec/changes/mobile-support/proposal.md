## Why

目前 CBC 系統測試問題管理系統僅針對桌面瀏覽器設計，版面在手機螢幕上顯示異常（表格超出畫面、按鈕過小、輸入欄位難以操作）。測試人員在現場以手機回報問題或查閱問題單時體驗極差，需要完整的響應式支援。

## What Changes

- 所有頁面版面改為 Mobile-first 響應式設計（Tailwind CSS breakpoints）
- 問題單列表頁：桌面顯示表格，手機改為卡片列表
- 問題單表單頁：調整欄位間距、輸入框大小，適合手機觸控操作
- 問題單詳細頁：欄位改為單欄垂直排列
- 儀表板頁：圖表卡片改為單欄排列，數字摘要卡片調整為 2x2 格
- Header 導覽列：手機顯示漢堡選單（Hamburger Menu），展開後顯示導覽連結
- 附件縮圖：調整尺寸與間距適合手機觸控

## Capabilities

### New Capabilities

- `mobile-nav`: 手機版漢堡選單導覽，取代桌面橫向導覽列

### Modified Capabilities

- `issue-list`: 手機版改為卡片列表取代表格
- `issue-form`: 響應式表單佈局與觸控友善輸入
- `issue-detail`: 手機版單欄垂直詳細頁佈局
- `dashboard`: 響應式圖表與統計卡片排列
- `file-upload`: 手機觸控友善附件縮圖與上傳按鈕

## Impact

- `docs/app.js`：所有 Vue 元件 template 的 CSS class 調整（Tailwind responsive prefix）
- `docs/index.html`：無需變更（已使用 Tailwind CDN）
- 不影響後端 GAS API
- 不新增外部依賴
