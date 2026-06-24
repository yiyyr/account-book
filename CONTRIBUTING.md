# Contributing

欢迎提交 issue 和 pull request。这个项目优先保持个人使用场景下的简单、离线可用和可备份。

## Development

```bash
npm install
npm run dev
```

提交前建议运行：

```bash
npm run test:run
npm run build
```

## Guidelines

- 优先保持移动端表单和统计页面易用。
- 涉及余额、导入导出、同步接口的改动需要补测试。
- 不要把用户数据发送到第三方服务，除非功能明确引入云同步并更新隐私说明。
- 新增持久化字段时，需要考虑 JSON 备份兼容性。
