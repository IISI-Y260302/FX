## MODIFIED Requirements

### Requirement: 問題單狀態流程
系統 SHALL 允許授權使用者手動設定問題單狀態（Open / Closed / Reopen），系統不自動計算或覆蓋狀態。

#### Scenario: 手動設定狀態為 Closed
- **WHEN** 使用者在編輯表單將問題狀態改為「Closed」並儲存
- **THEN** 問題單狀態更新為 Closed

#### Scenario: 手動設定狀態為 Reopen
- **WHEN** 使用者在編輯表單將問題狀態改為「Reopen」並儲存
- **THEN** 問題單狀態更新為 Reopen
