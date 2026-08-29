# Changelog

## 2026-08-29 — M1 逐字稿格式與自動部署

### 新增與優化

- 上傳表單新增兩種輸出格式：
  - `逐句純文字`：每句一行，不含時間碼。
  - `含時間戳逐句文字`：每句一行，格式為 `[HH:MM:SS] sentence`。
- Gemini 一般模式保留 topic 的 `custom_vocabulary`；時間戳模式依 API 限制停用 `custom_vocabulary`。
- Worker 發生不可重試錯誤時，工作狀態會改為 `failed`，避免畫面永久停在 `Transcribing`。
- Jobs 列表新增 `Failed` 狀態顯示。
- 新增 GitHub Actions 正式部署流程：推送 `main` 後依序執行 build、lint、Python compile、Supabase migrations、等待 Vercel Production，再透過 AWS OIDC 與 SSM 更新 EC2 Worker。
- GitHub 只保存加密的 `SUPABASE_DB_URL`；AWS 使用短期 OIDC 憑證，不保存長期 AWS access key。

### 真實端到端驗證

測試素材為 NASA Stephen Hawking 公開英文影片，約 5 分 03 秒、51.71 MiB。兩次成功測試皆由正式 Vercel 網站送出，經 Supabase queue、AWS EC2 Worker、Gemini 3.5 Transcribe，再由網站下載 TXT。

| 模式 | 結果 | 端到端耗時 | 約即時倍速 | 行數 | 字元數 | 格式驗證 |
| --- | --- | ---: | ---: | ---: | ---: | --- |
| 逐句純文字 | Done | 25.74 秒 | 11.77× | 32 | 2,719 | 每句一行，無時間碼 |
| 含時間戳 | Done | 30.03 秒 | 10.09× | 32 | 3,059 | 32/32 行有時間碼；由 `00:00:00` 單調遞增至 `00:04:37` |

下載驗證檔：

- `transcript-cfce81e9.txt`：逐句純文字。
- `transcript-05bee0c4.txt`：含時間戳。

### 驗證時發現並修正的問題

- 第一次時間戳測試收到 Gemini `400 invalid_request`，原因是 `custom_vocabulary` 與 timestamps 不相容。
- 該次工作原本會停留在 `Transcribing`；修正後，失敗工作會顯示 `Failed`。
- 移除時間戳模式的 `custom_vocabulary` 後重跑，30.03 秒完成並成功下載。
- 修正後 `npm run build`、`npm run lint`、Python compile 與完整 GitHub Actions 部署皆通過。

### 成本記錄

- Gemini 3.5 Transcribe 官方付費估算約 `US$0.005 / 分鐘`；每次 5.05 分鐘約 `US$0.02525`。
- 兩次成功格式驗證合計約 `US$0.05050`；若帳號仍適用免費額度，Gemini 實際費用可能為 `US$0`。
- 第一次被 400 拒絕的時間戳請求未產生成品，未納入上述估算；最終是否有極少量 token 費用以 Google Billing 入帳為準。
- 兩次成功測試的 EC2 處理時間合計約 55.77 秒；既有 t3.small 本來就處於 running，歸因到測試的額外 compute 少於 `US$0.001`。EBS、Secrets Manager 與 public IPv4 為既有持續成本，未因這兩次測試新增資源。

成本依據：[Gemini Developer API pricing](https://ai.google.dev/gemini-api/docs/pricing)；AWS 實際帳單與 Cost Explorer 有延遲，最終金額以入帳資料為準。
