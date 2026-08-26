# 人体图高亮方案（定稿）

> **后续一切部位精细化 / 对齐优化，必须按本文方法执行。**  
> 已踩坑方案（自研整身 SVG、手绘 fillMask、Mask 裁切叠加）禁止再作为默认路线。

## 产品原则

1. **底图**：`react-native-body-highlighter` 高清肌肉外形（正/后视、男/女）。
2. **交互**：点肌肉块 → 二级弹层选《手术部位》用语（可多选）；文书以用语为准，图为示意。
3. **高亮**：能直接用库肌肉路径的，就用库路径；不要另画一套漂移坐标。

## 定稿方法：库肌肉子路径手动分割

库把一块肌肉拆成多条 SVG `path`（`common` / `left` / `right`）。  
手术用语比库 slug 更细时，**不要**再手绘区域轮廓去「套」在图上，而是：

1. 从库抽出对应肌肉路径表（见 `src/data/frontMusclePaths.ts`）。
2. **按侧别 + 纵向分带（或其它可复现规则）筛选子路径**。
3. 在与 Body **相同**的 `viewBox`（男正视 `0 0 724 1448`）和 **相同**像素尺寸（`200×scale` × `400×scale`）叠加层里，直接 `fill` 这些子路径。

这样高亮与底图 **同源路径、天然对齐**，相当于「手动分割库资源后兼容使用」。

### 腹部范例（已落地）

| 手术用语 | 库肌肉 | 画面侧（库 left/right） | 纵向分带 |
|---------|--------|-------------------------|----------|
| 右上腹 | abs + obliques | left（画面左 = 患者右） | upper |
| 上腹部 | abs | both | upper |
| 左上腹 | abs + obliques | right | upper |
| 脐部 | abs | both | mid |
| 右下腹 | abs + obliques | left | mid + lower |
| 下腹部 | abs | both | lower |
| 左下腹 | abs + obliques | right | mid + lower |

实现位置：

- 分割与适配：`src/data/surgicalAdaptation.ts` → `FRONT_ABD_PATHS` / `pickBandPaths`
- 叠加绘制：`src/components/BodyMap.tsx` → `FineHighlights`（无 Mask 时直接画 `paths`）
- 用语字典：`src/data/bodyRegions.ts`
- 点选映射：`src/data/bodyHighlighterMap.ts`

分带阈值（路径起点 Y，库坐标）：`upper < 510`，`mid < 580`，其余 `lower`。男/女阈值若偏差明显，可按性别分开标定，但 **仍须走子路径筛选，不得改回手绘蒙版主路径**。

### 凑满整区时回退库原生高亮

某一区用语 **全部选中** 时，改为 Body 的 `data` 原生红填整块肌肉（如腹七项 → `abs` + `obliques`），不再叠子路径。见 `FRONT_FULL_LIB_GROUPS`。

### 四肢

库 slug 与用语基本 1:1，直接 `kind: 'muscle'` 写入 Body `data`，无需子路径分割。

### 胸 / 头等

优先：`pathSide` 取单侧库路径直接填（与腹同思路）。  
仅正中缝等库路径盖不住的例外（如胸骨正中）才允许小范围 `fillMask`，且须单独注明原因。

## 坐标系注意

- 正视：**画面左 = 患者解剖右**（面对面）。转换用 `anatomicalFromSvg` / `svgSideFromAnatomical`。
- 叠加层必须与 Body 同 `viewBox`、同宽高，禁止用百分比 SVG 或另一套自估坐标。
- 女正视库 viewBox 为 `-50 -40 734 1538`，与男不同；女身体素若扩展精细分割，须按女库路径与 viewBox 单独标定。

### 胸部（男女分别取库路径）

| 手术用语 | 实现 |
|---------|------|
| 右胸 / 右乳 | Body `data` 原生高亮 `chest` + `side: left`（库按性别换路径） |
| 左胸 / 左乳 | Body `data` 原生高亮 `chest` + `side: right` |
| 胸骨正中 | 按性别 **viewBox 中心** 生成正中带（女中心 x≈317，男≈362；禁止女套男坐标） |

实现：`FRONT_CHEST_MUSCLE` + `FRONT_CHEST_PATHS`（仅胸骨）+ `sternumPath(gender)`。

### 男 / 女必须分开适配

| 项 | 男 | 女 |
|----|----|----|
| viewBox | `0 0 724 1448`（中心 x=362） | `-50 -40 734 1538`（中心 x=317） |
| 路径表 | `MALE_FRONT_MUSCLE_PATHS` | `FEMALE_FRONT_MUSCLE_PATHS` |
| 腹部分带 | upper&lt;510, mid&lt;580（Y 锚点） | **子路径序号表** `FEMALE_ABS_BANDS` / `FEMALE_OBL_BANDS`（female-iter-1） |
| 胸骨正中 | `sternumPath('male')` 绕 362 | `sternumPath('female')` 绕乳缝视觉中心 **x≈330**（非纯几何 317；female-iter-3） |
| 胸/乳 | Body `data` 原生 `chest`+side | 同左（库自动换女路径） |
| 头 | Mask 裁切 head 路径 | 整头 → 库原生 `head`；五官 → `maskFemale`（female-iter-2） |
| 颈 | 曾用男 Mask | 库 `neck` common / left / right 直绘（female-iter-2） |
| 叠加层样式 | FineHighlights | 轻描边、略降不透明度（female-iter-3） |
| 叠加层 viewBox | 当前 `gender` | 同左 |

**切换性别时清空全部已选标签**（`selectedPartIds = []`），避免男路径高亮套在女体上（或反过来）造成错位。

### 女体三轮迭代（female-iter-1/2/3）

| 轮次 | 目标 | 结论 |
|------|------|------|
| female-iter-1 | 腹分带 + 胸骨 Y/宽 | 女左腹无独立 lower 锚点，改序号分带；胸骨贴胸缝 |
| female-iter-2 | 头/颈对齐男体精细度 | 整头原生；五官 `maskFemale`；颈库路径直绘 |
| female-iter-3 | 样式收口 + 五官蒙版微调 | 胸骨乳缝中心 x≈330；眼/鼻/唇下移避开发髻；叠加层描边；`?qa=` 验收 |

正中类小矢量（如胸骨）须按性别生成；女体不要复用男蒙版坐标。

## 明确禁止（已验证失败）

| 做法 | 问题 |
|------|------|
| 自研整身简陋分区 SVG | 精细度差，像积木 |
| 手绘区域 `fillMask` 作主高亮 | 坐标易整体偏移 |
| `Mask`/`ClipPath` 裁切整块肌肉作腹部分区主方案 | Web 上易错位、左右区丢失 |
| 开源人体库换库 / 商用 3D | Demo 预算与集成成本不符 |

## 后续优化清单（按本文方法）

1. 头面五官：若 Mask 在 Web 仍有缝隙，改为更细的女库子路径表（若库有拆分）。
2. 后视：用语已是库级粒度，保持 slug 映射；若需更细，同样抽后视路径再分割。
3. 正式版若需超越库精细度：再评估定制医疗 SVG，而不是在现有叠加层上堆手绘色块。

## 浏览器验收（Demo）

指认页支持：`http://localhost:8081/?gender=female&qa=f-abd-ru,f-sternum`（逗号分隔部位 id）。

## 关键文件速查

```
src/data/surgicalAdaptation.ts   # 分割规则 + buildAdaptation
src/data/frontMusclePaths.ts     # 从人体库抽出的路径
src/data/bodyHighlighterMap.ts   # 点击 → 用语列表
src/data/bodyRegions.ts          # 《手术部位》字典
src/components/BodyMap.tsx       # Body + FineHighlights
```
