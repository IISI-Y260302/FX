## Context

目前 GAS `autoUpdateStatus()` 在每次 `updateIssue()` 後自動依欄位值計算狀態，使用者無法直接控制。此設計雖然自動化，但實際使用上容易造成非預期狀態覆蓋（例如：填了處理方式就自動 Closed，但業務還未確認）。

## Goals / Non-Goals

**Goals:**
- 移除 GAS `autoUpdateStatus()` 的自動判斷邏輯
- `updateIssue()` 直接將前端傳入的 `body.status` 寫入 Sheets
- 前端表單新增「問題狀態」下拉，讓使用者明確選擇 Open / Closed / Reopen
- 新增問題單時 status 預設為 `Open`（不變）

**Non-Goals:**
- 不新增「已刪除」作為表單可選狀態（刪除仍透過刪除按鈕操作）
- 不改變 `deleteIssue()` / `restoreIssue()` 邏輯

## Decisions

### 移除 autoUpdateStatus
- **決定**：直接刪除 `autoUpdateStatus(sheet, rowIdx)` 呼叫與函式
- **原因**：使用者反映自動邏輯造成非預期結果，手動控制更直覺
- **替代方案**：保留自動邏輯並加入「覆蓋開關」→ 複雜度增加，捨棄

### 表單狀態欄位位置
- **決定**：放在「業務單位覆測階段」區塊底部，緊接在覆測結果之後
- **原因**：狀態通常在覆測後才做最終確認，位置語意合理

## Risks / Trade-offs

- [風險] 使用者忘記手動更新狀態 → 接受，這是業務決策，不應由系統代勞
- [Trade-off] 失去自動化便利性 → 換取明確的狀態控制權
