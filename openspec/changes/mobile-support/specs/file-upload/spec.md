## MODIFIED Requirements

### Requirement: 觸控友善附件上傳
系統 SHALL 在手機上提供觸控友善的附件上傳操作，上傳按鈕與縮圖尺寸適合手指操作。

#### Scenario: 手機點擊上傳按鈕
- **WHEN** 使用者以手機在表單頁點擊上傳附件按鈕
- **THEN** 手機系統顯示相機/相簿選擇器（`<input type="file" accept="image/*">`），選擇後自動上傳

#### Scenario: 手機顯示附件縮圖
- **WHEN** 附件上傳完成後於手機顯示
- **THEN** 縮圖以適當尺寸（最小 64px）顯示，刪除按鈕觸控區域足夠（最小 44px）
