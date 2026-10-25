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

## GitHub Pages

此專案已設定 GitHub Actions 部署至 GitHub Pages。將程式推送至 GitHub repository 的 `main` 分支後，在 repository 的 **Settings → Pages → Build and deployment → Source** 選擇 **GitHub Actions**，之後每次推送 `main` 都會自動建置及發布。部署網址通常為 `https://<帳號>.github.io/<repository>/`。

GitHub Pages 網站通常是公開的。旅遊紀錄存於各裝置瀏覽器的 IndexedDB，不會隨網站部署上傳或跨裝置同步；部署只發布應用程式檔案。請勿將匯出的 `ktrip_Backup_*.json`、`ktrip_Journal_*.md`、`ktrip_Expenses_*.csv` 或其他含私人資料的檔案加入 Git。這些常見匯出檔及資料庫檔已列入 `.gitignore`，但新增其他檔名的備份時仍需自行確認 Git 狀態。

## 離線資料與升級

- 旅記、行程、購物、匯率與支出儲存在 IndexedDB `ktrip-offline`，相片資料也包含在旅記資料中。
- 行程頁的日期由設定中的「旅程開始日」依 Day N 自動換算，並顯示星期。
- 設定中的「預設顯示幣別」可切換 TWD、JPY、KRW、USD、EUR 的旅費總額與支出折算顯示。
- 首次載入時會將舊版 `localStorage` 的 `ktrip_*` 資料遷移至 IndexedDB，保留原始 localStorage 資料不刪除。
- 瀏覽器儲存空間遭拒或 IndexedDB 載入失敗時，App 會顯示錯誤並停止載入示範資料，避免覆蓋個人紀錄。
- PWA 更新採自動更新；備份與還原功能仍可用於匯出及復原 JSON 資料。
