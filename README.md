# ContextFlow

面向科技从业者的场景化职场英语应用。通过 AI、软件开发和跨团队协作中的真实任务，学习表达、完成练习，并按记忆状态复习。

## 本地运行

要求 Node.js 20+。

```bash
npm install
npm run dev
```

验证项目：

```bash
npm test
npm run build
```

## Android

项目使用 Capacitor。首次生成 Android 工程：

```bash
npm run build
npx cap add android
```

之后同步 Web 更新并在 Android Studio 打开：

```bash
npm run android:sync
npm run android:open
```

在 Android Studio 中选择 `Build > Build Bundle(s) / APK(s) > Build APK(s)` 即可生成 APK。Android SDK 与 JDK 由 Android Studio 管理。

## 数据与离线

- 学习事件、掌握度、复习时间和设置均存储在设备 IndexedDB 中。
- 「我的」页面可导出、导入或清空数据。
- PWA service worker 会缓存应用外壳和课程内容，生产构建可离线使用。
- 首版不需要账号、后端或 AI API。
