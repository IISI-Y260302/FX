## ADDED Requirements

### Requirement: 手機版漢堡選單導覽
系統 SHALL 在手機螢幕（viewport 寬度 < 768px）顯示漢堡選單按鈕，取代桌面橫向導覽列。

#### Scenario: 手機顯示漢堡選單按鈕
- **WHEN** 使用者以手機（< 768px）瀏覽已登入頁面
- **THEN** Header 右側顯示漢堡選單（☰）圖示，桌面導覽連結隱藏

#### Scenario: 展開漢堡選單
- **WHEN** 使用者點擊漢堡選單按鈕
- **THEN** 導覽連結以垂直清單展開於 Header 下方，漢堡圖示變為關閉（✕）圖示

#### Scenario: 點擊導覽連結後關閉選單
- **WHEN** 使用者點擊展開選單中的任一導覽連結
- **THEN** 頁面導向對應頁面，選單自動收合

#### Scenario: 桌面顯示橫向導覽列
- **WHEN** 使用者以桌面瀏覽器（≥ 768px）瀏覽
- **THEN** Header 顯示原有橫向導覽連結，漢堡選單按鈕隱藏
