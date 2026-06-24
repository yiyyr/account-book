# Account Book

一个手机优先的信封预算记账 PWA。收入先进入“未分配资金”，再分配到必要支出、闲暇、旅游、储蓄等自定义信封；支出从对应信封扣减，并按月份、类目和信封统计。

## Features

- 手机浏览器访问，可添加到桌面，支持离线打开已缓存页面。
- 本地优先：账本数据保存在当前浏览器 IndexedDB，不需要租服务器。
- 信封预算：收入、支出、收入分配、信封转账、余额统计。
- 自定义信封和收入/支出类目。
- 可视化统计：月度趋势、支出类目占比、信封消耗排行。
- 数据输出：CSV 交易明细导出、JSON 完整备份和恢复。
- 同步预留：数据读写集中在 `LedgerRepository`，后续可以接 Supabase/Firebase 等云端实现。

## Tech Stack

- Vite + React + TypeScript
- Dexie + IndexedDB
- Chart.js + react-chartjs-2
- vite-plugin-pwa
- Vitest + Testing Library
- GitHub Pages + GitHub Actions

## Local Development

```bash
npm install
npm run dev
```

手机和电脑在同一局域网时，可以访问 Vite 输出的 Network 地址。生产部署后，手机直接访问 GitHub Pages 地址即可，电脑不需要开机。

## Build And Test

```bash
npm run test:run
npm run build
```

## GitHub Pages Deployment

1. 推送到 GitHub 仓库的 `main` 分支。
2. 在仓库 Settings -> Pages 中，将 Source 设为 GitHub Actions。
3. workflow 会执行 `npm install` 和 `npm run build`，并发布 `dist`。
4. Vite 会根据 `GITHUB_REPOSITORY` 自动设置项目页 base path。

首次上传到 GitHub：

```bash
git add .
git commit -m "Initial account book PWA"
git remote add origin https://github.com/<your-name>/<repo>.git
git push -u origin main
```

## Data And Privacy

v1 不包含用户登录和云同步。数据只存储在当前浏览器的 IndexedDB 中；更换设备、清理浏览器数据或卸载浏览器可能导致本地账本不可用。建议定期在“数据”页面导出 JSON 备份。

## Project Structure

```text
src/
  components/        UI pages and mobile navigation
  data/              Dexie database, repository interface, import/export
  domain/            Ledger types, money helpers, balance calculations
  hooks/             Live IndexedDB data hooks
  test/              Vitest setup
```

## License

MIT
