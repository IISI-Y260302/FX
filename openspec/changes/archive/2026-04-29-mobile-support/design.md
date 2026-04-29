## Context

CBC 系統測試問題管理系統目前以 Vue 3 + Tailwind CSS 實作，部署於 GitHub Pages。現有 UI 針對桌面瀏覽器設計，未使用 Tailwind 的響應式前綴（`sm:`、`md:`、`lg:`）。手機使用者遇到表格橫向溢出、導覽列擁擠、按鈕過小等問題。

## Goals / Non-Goals

**Goals:**
- 所有頁面在手機（375px+）、平板（768px+）、桌面（1024px+）均可正常使用
- 手機版導覽列改為漢堡選單
- 問題單列表在手機改為卡片佈局
- 表單、詳細頁、儀表板調整為單欄響應式佈局
- 不新增任何外部依賴

**Non-Goals:**
- 原生 App（iOS/Android）
- PWA / 離線支援
- 觸控手勢（swipe 等進階互動）
- 後端 GAS API 任何變更

## Decisions

### 決策 1：Mobile-first with Tailwind breakpoints

**選擇**：使用 Tailwind CSS `sm:` / `md:` / `lg:` 響應式前綴，不引入額外 CSS 框架。

**理由**：專案已使用 Tailwind CDN，零依賴成本。Mobile-first 原則確保小螢幕體驗為基準，大螢幕用 breakpoint 擴展。

**替代方案**：引入 Bootstrap 5 → 增加依賴且與現有 Tailwind 衝突風險高，捨棄。

---

### 決策 2：列表頁手機版改卡片，桌面保留表格

**選擇**：用 `hidden md:block` / `block md:hidden` 切換表格與卡片列表兩種渲染。

**理由**：表格在手機上需橫向捲動，體驗差。卡片每筆獨立一行，資訊清晰且觸控友善。兩種模式共用同一份資料，不需額外 API。

**替代方案**：表格加 `overflow-x-auto` 允許橫向捲動 → 體驗不佳，捨棄。

---

### 決策 3：漢堡選單用 Vue reactive state 控制開關

**選擇**：在現有 App 元件加入 `mobileMenuOpen` ref，用 `v-show` 切換選單展開/收合，不引入額外 JS 套件。

**理由**：符合現有 Vue 3 Composition API 風格，最小改動量。

---

### 決策 4：儀表板卡片 grid 由 4 欄改為手機 2 欄

**選擇**：`grid grid-cols-2 md:grid-cols-4` — 手機 2x2，桌面 1x4。

**理由**：4 個摘要卡片在手機單欄太窄，2 欄可兼顧可讀性與空間效率。

## Risks / Trade-offs

- **[Risk] 卡片/表格雙模式 HTML 重複** → 透過 Vue template 組織清楚，接受少量 HTML 重複以換取清晰的響應式邏輯
- **[Risk] 漢堡選單點擊導覽後未自動關閉** → 在 `navigate()` 函式中加入 `mobileMenuOpen.value = false`
- **[Risk] Chart.js 圖表在小螢幕寬度顯示不完整** → 設定 `responsive: true, maintainAspectRatio: false` 並限制容器高度

## Migration Plan

1. 修改 `docs/app.js` 中各頁面元件的 template CSS class
2. 新增漢堡選單 state 與 template 至 App 根元件
3. 問題單列表頁新增卡片模式 template block
4. 更新 `docs/index.html` 版本號（cache busting）
5. 無需資料庫 migration，無需 GAS 變更
6. Rollback：git revert 單一 commit 即可還原
