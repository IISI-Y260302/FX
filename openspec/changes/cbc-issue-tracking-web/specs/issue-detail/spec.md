## ADDED Requirements

### Requirement: 問題單詳細頁顯示
系統 SHALL 提供問題單詳細頁，分三個區塊（提出/處理/覆測）顯示所有欄位，附件以縮圖方式呈現並可點擊放大或下載。

#### Scenario: 開啟問題單詳細頁
- **WHEN** 使用者點擊列表中的問題單編號
- **THEN** 系統顯示該問題單所有欄位內容，附件顯示為可點擊縮圖

#### Scenario: 附件連結顯示
- **WHEN** 問題單有附件時
- **THEN** 詳細頁顯示 Google Drive 圖片縮圖及「開啟原始檔」連結

### Requirement: 問題單狀態流程
系統 SHALL 依照問題單生命週期管理狀態轉換。

```
Open → (處理完成) → Closed
Closed → (覆測 NG) → Reopen
Reopen → (重新處理) → Closed
任何狀態 → (軟刪除) → 已刪除
```

#### Scenario: 填寫處理方式後自動關閉
- **WHEN** 處理人員填寫「問題原因及處理方式」並填入處理完成日期
- **THEN** 問題狀態自動更新為「Closed」

#### Scenario: 覆測結果 NG 重開問題單
- **WHEN** 測試人員或覆測人員填寫測試結果或覆測結果為「NG」
- **THEN** 問題狀態自動更新為「Reopen」
