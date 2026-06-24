# Account Book

Account Book 是一个移动端优先的个人记账 PWA，采用“信封预算”思路管理现金流：收入先进入未分配资金，再分配到不同信封；支出从对应信封扣除，并在流水、统计和数据页中回看。

项目默认本地优先运行，账本数据保存在当前浏览器的 IndexedDB 中，不依赖后端服务。

## 功能特性

- 移动端优先：适合手机浏览器使用，也可以添加到桌面作为 PWA。
- 本地记账：收入、支出、收入分配、信封转账和余额统计都在本地完成。
- 信封预算：支持自定义信封，用于区分住房、交通、餐饮、储蓄等资金用途。
- 类目管理：支持自定义收入类目和支出类目。
- 流水回看：默认查看本月流水，按日期分组展示，每组显示当日收入、支出、笔数，并在同时存在收入和支出时显示净流入或净流出。
- 列表加载：流水页每次至少展示 50 条记录，并通过“显示更多”继续展开，避免长列表一次性铺满页面。
- 统计分析：按月份、支出类目和信封查看趋势与占比。
- 数据管理：支持 CSV 流水导出，以及 JSON 完整备份和恢复。
- 离线可用：构建后通过 PWA 缓存静态资源，已缓存页面可离线打开。

## 技术栈

- Vite + React + TypeScript
- Dexie + IndexedDB
- Chart.js + react-chartjs-2
- vite-plugin-pwa
- Vitest + Testing Library
- GitHub Pages + GitHub Actions

## 本地开发

安装依赖：

```bash
npm install
```

启动开发服务：

```bash
npm run dev
```

如果默认端口不可用，可以指定端口：

```bash
npm run dev -- --host 127.0.0.1 --port 5180
```

开发服务启动后，浏览器打开 Vite 输出的 Local 地址即可。

## 测试与构建

提交前建议至少运行：

```bash
npm run test:run
npm run build
```

脚本说明：

- `npm run dev`：启动 Vite 开发服务。
- `npm run test:run`：运行 Vitest 测试。
- `npm run build`：执行 TypeScript 构建检查并生成生产包。
- `npm run preview`：本地预览生产构建结果。
- `npm run lint`：执行 `tsc -b --noEmit` 类型检查。

## GitHub Pages 部署

仓库包含 GitHub Actions 部署流程：`.github/workflows/deploy.yml`。

触发方式：

- 推送到 `main` 分支时自动构建并部署到 GitHub Pages。
- 在 GitHub Actions 页面手动运行 `Deploy to GitHub Pages` workflow。

部署流程会执行：

1. Checkout 仓库代码。
2. 使用 Node.js 20。
3. 执行 `npm install`。
4. 执行 `npm run build`。
5. 上传 `dist` 并发布到 GitHub Pages。

Vite 会根据 `GITHUB_REPOSITORY` 自动设置 GitHub Pages 的 base path。例如仓库是 `yiyyr/account-book` 时，页面通常发布到：

```text
https://yiyyr.github.io/account-book/
```

首次启用 GitHub Pages 时，需要在仓库 `Settings -> Pages` 中确认 Source 使用 `GitHub Actions`。

## 推荐发布流程

当前仓库的部署 workflow 只监听 `main` 分支。因此：

- 直接推送到 `main` 会触发 GitHub Actions，并在构建成功后更新 GitHub Pages。
- 推送到其他分支通常不会部署 Pages，除非之后开 PR 合并到 `main`，或手动调整 workflow。
- 如果只是个人项目、改动已经本地验证通过，直接推送 `main` 是可以的。
- 如果希望保守一点，可以新建分支、开 PR，通过后再合并到 `main`。

常用命令：

```bash
git status
npm run test:run
npm run build
git add src/components/Records.tsx src/styles.css README.md
git commit -m "Improve records list grouping"
git push origin main
```

推送后可以在 GitHub 仓库的 Actions 页面查看 `Deploy to GitHub Pages` 运行结果。该 workflow 支持 `workflow_dispatch`，所以如果需要重新发布，可以在 Actions 页面手动 rerun 或手动触发。

## 数据与隐私

Account Book v1 是本地优先应用：

- 不需要注册或登录。
- 不会主动上传账本数据。
- 账本数据保存在当前浏览器的 IndexedDB 中。
- CSV 导出和 JSON 备份都由用户手动触发。
- 更换设备、清理浏览器数据或卸载浏览器，可能导致本地账本不可用。

建议定期在“数据”页面导出 JSON 备份。

未来如果加入云同步，需要在启用前明确展示同步服务、同步范围、退出方式和隐私影响。

## 项目结构

```text
src/
  components/        页面组件与移动端导航
  data/              Dexie 数据库、仓储接口、导入导出
  domain/            账本类型、金额工具、余额计算
  hooks/             IndexedDB 实时数据 hooks
  test/              Vitest 测试配置
```

## License

MIT
