## ADDED Requirements

### Requirement: 問題狀態手動選擇
系統 SHALL 在問題單表單提供「問題狀態」下拉欄位，允許使用者手動選擇 Open / Closed / Reopen。

#### Scenario: 新增問題單時狀態預設 Open
- **WHEN** 使用者開啟新增問題單表單
- **THEN** 問題狀態欄位預設為「Open」

#### Scenario: 編輯時手動變更狀態
- **WHEN** 使用者在編輯表單選擇不同狀態並儲存
- **THEN** 問題單狀態依使用者選擇更新，系統不自動覆蓋
