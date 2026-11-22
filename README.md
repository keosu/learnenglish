# Echo 听讯

每天用 AI 前沿与国际时政新闻练英语听力的 PWA。每条新闻被改写成 8–10 句适合朗读的英文播报，配中文、重点短语、句子解析（结构与听读提示）和听后小测；支持逐句朗读、慢速、跟读停顿、盲听、单句循环和收藏。

在线地址：<https://keosu.github.io/learnenglish/>

## 每日内容

`.github/workflows/daily.yml` 每天北京时间 06:10 运行：

1. 抓取 TechCrunch、The Verge、MIT Technology Review、Ars Technica、OpenAI、BBC、NPR、The Guardian 等公开 RSS。
2. 用 GitHub Models（Actions 自带的 `GITHUB_TOKEN`，无需另配密钥）挑选要闻并生成课程；不可用时改用 Pollinations 免费接口。
3. 把结果写入 `public/news/<日期>.json` 并提交，保留最近 30 天，然后构建并发布到 GitHub Pages。

也可以在 Actions 页面手动运行 “Daily news and Pages”。

## 本地开发

要求 Node.js 24。

```bash
npm install
npm run dev
npm test
npm run build
```

本地生成当天内容：

```bash
GITHUB_TOKEN=$(gh auth token) npm run news          # GitHub Models
NEWS_PROVIDER=pollinations npm run news             # 只用免 key 的 Pollinations（每 45 秒一次，较慢）
```

## 朗读与数据

- 朗读用浏览器自带的 Web Speech API，在「我的」里选择声音和语速。
- 收藏、收听记录和解析缓存都保存在本机 IndexedDB。
- 安装到桌面后以全屏模式打开，不显示浏览器和系统栏；新闻 JSON 走网络优先缓存，离线时显示最近读过的内容。
