## ADDED Requirements

### Requirement: 圖片/截圖附件上傳
系統 SHALL 支援問題單附件上傳（圖片格式：JPG、PNG、GIF），單檔上限 5MB，每張問題單最多 5 個附件。附件上傳至 Google Drive 指定資料夾，Google Sheets 儲存分享連結。

#### Scenario: 上傳附件成功
- **WHEN** 使用者選擇圖片檔案並上傳
- **THEN** 圖片儲存至 Google Drive `/CBC問題單附件/<問題單編號>/` 資料夾，Google Sheets 對應欄位更新為 Google Drive 分享連結，表單顯示縮圖預覽

#### Scenario: 附件格式不支援
- **WHEN** 使用者嘗試上傳非圖片格式（如 .exe、.zip）
- **THEN** 系統顯示「僅支援 JPG、PNG、GIF 格式」，阻止上傳

#### Scenario: 附件超過大小上限
- **WHEN** 使用者嘗試上傳超過 5MB 的圖片
- **THEN** 系統顯示「檔案大小不得超過 5MB」，阻止上傳

#### Scenario: 超過附件數量上限
- **WHEN** 問題單已有 5 個附件，使用者嘗試再次上傳
- **THEN** 系統顯示「每張問題單最多上傳 5 個附件」，阻止上傳

### Requirement: 觸控友善附件上傳
系統 SHALL 在手機上提供觸控友善的附件上傳操作，上傳按鈕與縮圖尺寸適合手指操作。

#### Scenario: 手機點擊上傳按鈕
- **WHEN** 使用者以手機在表單頁點擊上傳附件按鈕
- **THEN** 手機系統顯示相機/相簿選擇器（`<input type="file" accept="image/*">`），選擇後自動上傳

#### Scenario: 手機顯示附件縮圖
- **WHEN** 附件上傳完成後於手機顯示
- **THEN** 縮圖以適當尺寸（最小 64px）顯示，刪除按鈕觸控區域足夠（最小 44px）

### Requirement: 附件刪除
系統 SHALL 允許提出人員或管理員刪除問題單附件（從 Google Drive 移除）。

#### Scenario: 刪除附件
- **WHEN** 授權使用者點擊附件縮圖旁的刪除按鈕並確認
- **THEN** Google Drive 中對應檔案刪除，Sheets 中連結更新
