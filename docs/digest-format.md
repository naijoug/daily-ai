# Digest 文件格式（供定时汇总任务使用）

`scripts/import.mjs` 把一份 digest 转成 `src/content/posts/<type>-<YYYY-MM-DD-HHMM>.md`。
本文规定 digest 里**可选**的机器可读字段：每条的 AI 评分、日摘要，以及产品登记（`## 新产品` 小节 / `[P:slug]` 标记），再加上**双语条目**（每条的译文引用）。没有这些字段的旧格式照样能导入。

## 文件名与类型

- 文件名：`YYYY-MM-DD-HHMM.md`（北京时间），例如 `2026-10-22-0915.md`。
- 类型：路径中含 `x-ai` → `x-ai`；含 `tech` → `tech`；否则传 `--type x-ai|tech`。
- 导入：`node scripts/import.mjs <file> [...]`，同 id 会覆盖（幂等）。

## 正文结构

```markdown
# AI 热点（覆盖 10/22 09:20 – 13:20 北京时间）
日摘要：Gemini 4 Argon 开放 API，Claude Code 支持后台任务；本地跑 DeepSeek 的新教程最实用。

## AI 热点
1. **标题**：正文……https://x.com/xxx/status/123 [AI:4]
2. **标题**：正文……[链接](https://example.com) [AI:3]

## 有趣用法和干货
1. **标题**：正文……https://x.com/yyy/status/456 [AI:5]
```

- 第一行 `# 标题（覆盖时段）`，括号里的内容成为 coverage。
- `## 小标题` 分节（AI 热点 / 有趣用法和干货 / 新产品 / 开源 / 科技新闻 / 中文社区 等）。
- **每条新闻或干货是一个顶格的列表项**：`1. ` 编号或 `- ` 开头，整条写在一行（不要在条目内换行或分段）。嵌套子列表需缩进，且不算独立条目。

## 双语条目（每条必填：源语言正文 + 另一语言译文）

站点 UI 支持 EN / 中文切换，**条目内容不随 UI 语言切换**：每条以**来源语言**写正文，并在**紧接着的下一行**附另一种语言的译文，站点把译文渲染成默认折叠的区域（按钮「Show 中文」/「Show English」，随 UI 语言显示）。

**规则**

1. **源语言**按来源判断：英文来源（HN、Lobsters、英文 X 帖、英文博客/官方公告、arXiv、Techmeme 等）→ **英文正文 + 中文译文**；中文来源（V2EX、LinuxDo、宝玉/歸藏等中文作者的 X 帖、掘金、IT之家、机器之心、量子位、InfoQ 中文、36kr 等）→ **中文正文 + 英文译文**。拿不准时看第一条链接的域名/作者。
2. **译文写成一行 Markdown 引用 `> ...`，紧贴条目行**，条目行与引用之间**不能有空行**。可选前缀 `> [en] ` / `> [zh] ` 显式指定译文语言；不写则按汉字占比自动判断（推荐写上，更稳）。
3. **链接、`[P:...]`、`[AI:N]` 只写在正文行**（`[AI:N]` 仍须是正文行的最后一段），译文里不要放这些标记；译文里可以保留行内 Markdown 链接，但通常不需要。
4. 译文忠实但精炼：保留加粗标题、数字、专有名词、代码片段；不额外加评论。长度与正文相当即可。
5. 阅读时长只按**正文**计算，译文不计入；条目 id、AI 评分、收藏、导入脚本都只认正文行，**条目序号不受译文引用影响**。
6. 译文引用**只能紧跟条目**。不挂在条目下的说明（`> 说明：…`）仍按旧规则，被当作说明并经过内部说明过滤；译文引用则原样保留，不做过滤。
7. 旧文件（没有译文）照常显示，只是没有折叠区域。

**示例**

```markdown
1. **Anthropic launches OSS Scanner**: free, regular vulnerability scans of critical open-source projects, every finding with a PoC. https://x.com/ClaudeDevs/status/1 [AI:5]
> [zh] **Anthropic 推出 OSS Scanner**：免费定期扫描关键开源项目的漏洞，每个发现附 PoC。
2. **V2EX：Codex 桌面版崩溃转储会悄悄吃掉几十上百 GB**：……https://www.v2ex.com/t/123 [AI:4]
> [en] **V2EX: Codex desktop crash dumps silently eat tens to hundreds of GB**: ...
```

**英文日摘要（可选）**：在 `日摘要：…` 的下一行加一行 `Summary: …`（顶格，英文 1–2 句，不含链接和 Markdown；也接受 `Day summary:` / `DAY_SUMMARY_EN:`）。导入后写入 frontmatter `daySummaryEn`。站点按 UI 语言显示对应摘要，缺哪个就回退到另一个。注意：不要在 `Summary:` 前加 `>`。

**小节标题保持中文**（`## AI 热点`、`## 新产品`、`## 有趣用法和干货`、`## 开源`、`## 科技新闻`、`## 中文社区` 等），站点按中文标题映射成英文显示，所以请不要改动标题措辞；digest 格式保持稳定。

**产品一句话**：`## 新产品` 条目导入时，若有译文，会同时写入产品的 `oneLiner`（中文）和 `oneLinerEn`（英文）。

**自检**：每个条目行（含 `1.` 编号）下面应当紧跟一行 `> [en|zh] …`；`grep -c '^> \['` 的数量应等于条目数。

## 字段 1：AI 评分（每条必填）

**语法**：在条目那一行的**行尾**追加 `[AI:N]`，N 为 `1`–`5` 的整数，前面留一个空格。

```
1. **tsrs：TypeScript 编译器移植到 Rust**：……https://blog.cloudflare.com/typescript-rust-port/ [AI:5]
```

- 正则：`/\s*[\[［]\s*AI\s*[:：]\s*([1-5])\s*[\]］]\s*$/i`（也容忍全角 `［AI：5］`，但请输出半角 `[AI:5]`）。
- 必须是行的最后一段文字；放在行中间的不会被识别。
- 导入时标记会从正文删掉，按条目顺序写成 frontmatter `scores: [5,4,3,...]`。
- 漏标的条目记为 `0`（不显示评分），导入脚本会打印警告。
- 评分标准（面向关注 AI 与开发工具的工程师）：
  - **5** 必看：会直接改变工作方式或需要立刻行动（重大模型/工具发布、严重安全漏洞、可马上用的高价值技巧）
  - **4** 值得细读：有实操价值的工具、方法、开源项目或重要行业动态
  - **3** 了解即可：常规更新、有参考价值的讨论
  - **2** 边缘相关：八卦、融资、与开发关系不大的新闻
  - **1** 噪音：几乎没有信息量

## 字段 2：日摘要（每份 digest 一行）

**语法**：单独一行，顶格以 `日摘要：`（全角冒号；也接受 `日摘要:` 或 `DAY_SUMMARY:`）开头，后接摘要文本。建议放在标题行之后。

```
日摘要：PHP 爆 9.2 分 RCE 漏洞、eMudhra CA 私钥被秒破，TS 编译器移植 Rust；OpenAI 公开 agent 内部事故。
```

- 中文 1–2 句，约 60 字（不超过 90 字），不含链接和 Markdown。
- 写的是**截至本期的整天**（北京时间自然日）要点，而不只是本期；后面的 digest 可以综合前面几期重写。
- 导入后写入 frontmatter `daySummary`。站点首页卡片和日页取**当天时间最晚、且带 daySummary 的那一期**。

## 字段 3：产品登记（可选，`## 新产品` 小节 + `[P:…]` 标记）

导入时会把产品登记进 `src/content/products/<slug>.json`（站点 /products/ 产品库），并把条目与产品互相链接。两种写法可以混用：

**写法 A：`## 新产品` 小节**——小节里的每一条都会被登记为产品，不需要额外标记：

```markdown
## 新产品
1. **Needle**：面向 agent 的外呼引擎，自动找客户写邮件 https://needle.app [P:needle|办公|global] [AI:3]
2. **Kilo Code 2.0**：开源编程 Agent 发布 2.0，支持云端并行任务 https://kilo.ai/blog/2 [AI:4]
```

**写法 B：任意小节里的条目加 `[P:slug]`**——新闻里提到已登记的产品时用它做显式关联（不存在时也会新建）：

```markdown
1. **豆包工作上线定时任务**：…… https://www.doubao.com/work [P:doubao-work] [AI:4]
```

**标记语法**：`[P:<slug>|<类别>|<地区>]`，放在 `[AI:N]` **前面**（`[AI:N]` 仍须是行尾最后一段），前面留一个空格。

- `slug`：小写字母、数字和 `-`，例如 `claude-code`、`doubao-work`。在 `## 新产品` 小节里可省略（写成 `[P:|办公|cn]` 或干脆不写标记），会用加粗名称或官网域名生成。
- `类别`（可选）：`对话助手` / `编程/Agent` / `办公` / `图像` / `视频` / `音频` / `搜索` / `研究` / `开发者平台` / `其他`，缺省为 `其他`。
- `地区`（可选）：`cn` / `global`（也接受 `国内` / `海外`）；缺省时 `.cn` 域名或中文名记为 `cn`，否则 `global`。
- 正则：`/\s*[\[［]\s*P\s*[:：]\s*([a-z0-9][a-z0-9-]*)?\s*(?:\|\s*([^|\]］]*?)\s*)?(?:\|\s*(cn|global|国内|海外)\s*)?[\]］]/gi`。
- 标记会从正文删掉；关联写进 post frontmatter `products: ["<条目序号>:<slug>", ...]`，日页条目下方会出现「产品 · slug」链接。

**条目内容约定**（新建产品时用来填字段）：

- 名称 = 行首 `**加粗**` 文字（取 `：` 前面的部分）。
- 官网 = 行内**第一个非社交平台链接**（x.com、github.com、公众号、YouTube、Product Hunt、Hugging Face 等不算）。**没有官网链接的条目不会新建产品**，导入时打印警告。
- 一句话介绍 = `：` 后面的正文去掉链接，取第一句（≤90 字）。
- AI 评分 = 该条的 `[AI:N]`。

**去重规则**（按顺序）：

1. `slug` 与已有产品相同 → 同一个产品。
2. 官网 URL 规范化（小写、去 `www.`、去 query/hash/末尾斜杠）后做**最长前缀匹配**，同时比对产品的 `url` 和备用 `domains`。例：`doubao.com/work/...` 归到「豆包工作」，`doubao.com/chat` 归到「豆包」；`kilocode.ai/...` 归到 `kilo-code`。
3. 名称规范化（去掉「｜公司」「 - 副标题」后缀、空白和标点，小写）后对比产品名、`aliases` 和别名表 `src/data/product-aliases.json`（例：`豆包` = `Doubao` = `豆包｜抖音`）。

命中已有产品时**不覆盖**已有字段，只会：`firstSeen` 取更早的日期、`updated` 取更晚的日期、补上缺失的评分、把新出现的名称写进 `aliases`。`firstSeen`（北京时间日期）决定首页日卡片上的「今日新产品」和 /products/ 的「本周新上榜」。

## 榜单快照（`scripts/products-refresh.mjs`，由每日 tech digest 调用）

```bash
cd /workspace/dailyai && export PATH=~/.local/node22/bin:$PATH && node scripts/products-refresh.mjs
```

- 抓取 Product Hunt AI RSS、Hugging Face trending Spaces API、OpenRouter rankings（App 与模型的本周 token 用量）、Artificial Analysis Intelligence Index，写成 `src/data/snapshots/<key>/<北京日期>.json`。
- 重新应用全部快照：榜单里能对上（同样的 URL / 别名去重规则）的**已登记产品**会追加一条 `rankings` 记录；不会因为上榜而自动新建产品。
- 幂等、只增不删：同一天重跑只覆盖当天快照和同 `source+list+date` 的记录；某个源抓取失败只打印 `!` 警告并跳过，不会写空文件；退出码恒为 0。`--dry` 只抓不写，`--only openrouter,hf` 只跑部分来源。
- 月度榜单（AICPB 公众号月榜、aicpb.com、a16z）和 LMArena（脚本访问 403）手工录入：按同样格式新建一个快照 JSON（注明 `url`、`period`、`published`、`note`，手工的加 `"manual": true`），下次运行脚本即会写进对应产品。

## 不要写进 digest 的内容

导入脚本会尽力过滤，但请源头就不要输出：关注列表 / 新关注账号、X List 名称或 ID、任务失败 / 限流 / 补跑 / 抓取失败等内部运行说明。

## 站点侧的存储（参考）

| 内容 | 位置 |
| --- | --- |
| AI 评分 | post frontmatter `scores: [..]`，与正文顶层列表项一一对应 |
| 日摘要 | post frontmatter `daySummary`（中文）、`daySummaryEn`（英文，可选） |
| 条目译文 | 正文里条目下方的 `> [en|zh] …` 引用，渲染为折叠区域；产品一句话英文版 `oneLinerEn` |
| UI 语言 | 读者浏览器 localStorage `dailyai:lang`（`en` / `zh`），默认 `en`；词典在 `src/lib/i18n.ts` |
| 条目 id | `<postId>-<序号>`，序号从 1 开始按正文顺序递增，例如 `tech-2026-10-21-2130-3` |
| 已读 / 个人评分 / 收藏 | 读者浏览器 localStorage `dailyai:v1`，收藏页可导出/导入 JSON；产品用 `product:<slug>` 作键 |
| 产品 | `src/content/products/<slug>.json`；条目关联在 post frontmatter `products` |
| 榜单快照 | `src/data/snapshots/<key>/<日期或月份>.json` |


## 标签（英文）

导入脚本 `scripts/import.mjs` 的 `TAG_RULES` 自动打标签，取值固定为英文（见 `src/content.config.ts` 的 `TAGS`）：Models、Agents、Dev Tools、Open Source、Products、Research、Industry、Security、Chinese Community。标签页 URL 用小写连字符 slug（如 `/tags/dev-tools/`）。产品 JSON 的 `tags` 也用同一组英文值。
