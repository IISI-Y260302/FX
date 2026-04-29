## ADDED Requirements

### Requirement: 匯出 Excel
系統 SHALL 支援將問題單列表（依目前篩選條件）匯出為 `.xlsx` 格式，使用 SheetJS 在前端產生檔案，格式對應現有 Excel 問題紀錄表欄位順序。

#### Scenario: 匯出全部問題單為 Excel
- **WHEN** 使用者點擊「匯出 Excel」按鈕（無篩選條件）
- **THEN** 瀏覽器下載 `CBC系統測試問題紀錄表_YYYYMMDD.xlsx`，包含所有非刪除問題單，欄位順序與原 Excel 一致

#### Scenario: 匯出篩選後問題單為 Excel
- **WHEN** 使用者已套用篩選條件後點擊「匯出 Excel」
- **THEN** 瀏覽器下載的 Excel 只包含篩選後的問題單

### Requirement: 匯出 PDF
系統 SHALL 支援將問題單列表或單一問題單詳細內容匯出為 PDF，使用 jsPDF 在前端產生。

#### Scenario: 匯出列表為 PDF
- **WHEN** 使用者點擊「匯出 PDF」按鈕
- **THEN** 瀏覽器下載 `CBC系統測試問題紀錄表_YYYYMMDD.pdf`，包含表格形式的問題單列表

#### Scenario: 匯出單一問題單詳細為 PDF
- **WHEN** 使用者在問題單詳細頁點擊「列印/匯出 PDF」
- **THEN** 瀏覽器下載包含該問題單所有欄位的 PDF 文件

#### Scenario: PDF 不含已刪除問題單
- **WHEN** 一般使用者匯出 PDF
- **THEN** 匯出結果不包含已刪除狀態的問題單
