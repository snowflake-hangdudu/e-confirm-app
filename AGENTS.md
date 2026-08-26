# Expo HAS CHANGED

Read the exact versioned docs at https://docs.expo.dev/versions/v57.0.0/ before writing any code.

# 人体图高亮（必须遵守）

部位指认的精细高亮 **必须** 按定稿方法：对 `react-native-body-highlighter` 的肌肉 **子路径做手动分割后直接填色**，与底图同源对齐。

完整说明、腹部范例、禁止事项与优化清单见：

**[docs/body-map-highlight.md](./docs/body-map-highlight.md)**

不要再改回：自研整身简陋 SVG、手绘 fillMask 主高亮、Mask 裁切整块腹肌作分区主方案。
