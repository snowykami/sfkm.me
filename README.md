# Snowykami's 的首页

这是一个由Next.js（https://nextjs.org）创建的项目，使用了[`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app)。

仿照macOS界面的风格制作的个人主页。

## 预览

<!-- START_PREVIEW_IMAGE -->
![白天预览](./images/preview-light.png)
![夜间预览](./images/preview-dark.png)
<!-- END_PREVIEW_IMAGE -->

## 功能及特性

- [x] 个人资料，项目展示，技能展示，社交链接等
- [x] 所有窗口均可缩放和拖动，支持窗口最小化、最大化、关闭等操作
- [x] 响应式: 支持大部分比例桌面端和友好的移动端体验
- [x] 主题: 适配日间/夜间模式，支持动态检测和切换
- [x] 多语言: 简体中文/English/日本語，可动态切换和自动检测浏览器语言，可扩展
- [x] 播放器: 支持网易云音乐和外链音乐，且实现MediaSession API，支持进度保持

## 开始

启动开发服务器：

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

打开 [http://localhost:3000](http://localhost:3000) 在浏览器中查看结果。

## 构建

项目使用了静态构建，构建好后可以部署到任何静态文件服务器上。（单页应用）

```bash
npm run build

pnpm build

yarn build

bun build
```

## 其他

这个项目最初由vercel v0生成并完成基础组件，后续由作者本人进行修改和完善。