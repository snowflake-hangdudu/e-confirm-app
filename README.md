# e确镜 Demo

医院手术部位确认 App（手机竖屏）。当前为无服务器本地 Demo。

## 技术

- Expo + React Native（可浏览器 / 真机调试）
- `react-native-body-highlighter` 人体底图 + 《手术部位》二级用语
- 精细高亮定稿：**库肌肉子路径手动分割**（见 [docs/body-map-highlight.md](./docs/body-map-highlight.md)）
- 本地会话状态（暂无后端）

## 运行

```bash
cd e-confirm-app
npm run web          # 浏览器竖屏调试（推荐日常）
npm start            # 再选 Expo Go 真机扫码
```

浏览器打开后，用 DevTools 切到手机尺寸（如 iPhone 12）。

## 演示流程

1. 选择患者 / 家属，填写信息 → 开始确认  
2. 正视/后视点选部位（部分区域会弹出细分列表）→ 可朗读 → 确认  
3. 护士填写计划手术并比对  
4. 一致后生成电子确认卡  

## 后续

- 后端可选 Node(Nest) 或 Java(Spring)，正式上线再部署  
- Demo 阶段不需要购买服务器  
