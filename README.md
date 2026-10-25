# ktrip 旅跡

以原有旅遊手帳 demo 為核心的可安裝離線 PWA，保留旅記、相片、每日行程、購物清單、外幣記帳與備份功能。

## 開發

```sh
npm install
npm run dev
```

Vite 開發伺服器啟用 PWA 開發模式。Service Worker 與安裝功能需使用 `localhost` 或 HTTPS；直接以 `file://` 開啟 HTML 不支援。

## Production

```sh
npm run build
npm run preview
```

將 `dist/` 部署到支援 HTTPS 的靜態網站主機。首次連線載入後，Service Worker 會快取 app shell 與程式資產，之後可離線開啟；已瀏覽過的 Unsplash 相片也會快取供離線檢視。

## 離線資料與升級

- 旅記、行程、購物、匯率與支出儲存在 IndexedDB `ktrip-offline`，相片資料也包含在旅記資料中。
- 行程頁的日期由設定中的「旅程開始日」依 Day N 自動換算，並顯示星期。
- 設定中的「預設顯示幣別」可切換 TWD、JPY、KRW、USD、EUR 的旅費總額與支出折算顯示。
- 首次載入時會將舊版 `localStorage` 的 `ktrip_*` 資料遷移至 IndexedDB，保留原始 localStorage 資料不刪除。
- 瀏覽器儲存空間遭拒或 IndexedDB 載入失敗時，App 會顯示錯誤並停止載入示範資料，避免覆蓋個人紀錄。
- PWA 更新採自動更新；備份與還原功能仍可用於匯出及復原 JSON 資料。
