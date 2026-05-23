// ================================================================
//  Carton Wiki 数据层 — 40种纸箱类型完整数据
//  fefcoCode 字段遵循 FEFCO 国际标准编号
//  排序在 WikiS.init() 中按 fefcoCode 自动排序
// ================================================================

var cartonWikiData = [
  // ─── FEFCO 0200 系列：开槽型纸箱 ──────────────────────────────

  // ─── 01: RSC ─ FEFCO 0200 ─────────────────────────────────
  {
    id: "rsc",
    code: "RSC",
    fefcoCode: "0200",
    nameEn: "Regular Slotted Carton",
    nameCn: "常规开槽纸箱",
    popularity: 60,
    asciiArt:
      "       ┌─────────────────────┐\n" +
      "       │                     │\n" +
      "  ┌────┴────────────────────┴────┐\n" +
      "  │  [    箱底面（单层）]       │\n" +
      "  └───────────────────────────────┘",
    structure: "四个摇盖长度相等或成比例，内外摇盖交错搭接，最通用的纸箱结构。",
    applications: ["快递物流包装（最常用）", "食品饮料包装", "电子产品包装", "日用百货运输"],
    pros: ["成本最低，适合大批量生产", "结构简单，易于自动化组装", "适用面广，90%的纸箱都是RSC"],
    cons: ["抗压强度一般（摇盖搭接处易变形）", "密封性较差（需胶带封口）", "不适合重型或易碎品"],
    costLevel: 1,
    equipment: ["瓦楞纸板生产线", "印刷开槽机", "自动打包机"],
    fluteTypes: ["A瓦", "B瓦", "C瓦", "E瓦", "BC瓦", "AB瓦"],
    layers: ["单层（3层）", "双层（5层）", "三层（7层）"],
    comparisonParams: { protection:3, stackability:4, printability:4, assemblyEase:5, storageEfficiency:4, costEfficiency:5, automation:5, sustainability:4, customization:2 }
  },

  // ─── 02: HSC ─ FEFCO 0201 ─────────────────────────────────
  {
    id: "hsc",
    code: "HSC",
    fefcoCode: "0201",
    nameEn: "Half Slotted Carton",
    nameCn: "半开槽纸箱",
    popularity: 15,
    asciiArt:
      "       ┌─────────────────────┐\n" +
      "       │                     │\n" +
      "  ┌────┴────────────────────┴────┐\n" +
      "  │  [    无顶盖（一端开口）]   │\n" +
      "  └───────────────────────────────┘",
    structure: "只有底部摇盖，顶部完全开口，适合需要频繁取放物品的场景。",
    applications: ["仓储货架展示", "机械零件分拣盒", "邮局包裹箱", "抽屉式包装"],
    pros: ["顶部全开口，取放方便", "可嵌套堆叠，节省空间", "用料略少（比RSC少一组摇盖）"],
    cons: ["无顶盖保护，防尘性差", "堆叠时需注意重心", "不适合长途运输"],
    costLevel: 2,
    equipment: ["瓦楞纸板生产线", "印刷开槽机"],
    fluteTypes: ["B瓦", "C瓦", "BC瓦"],
    layers: ["单层（3层）", "双层（5层）"],
    comparisonParams: { protection:2, stackability:3, printability:3, assemblyEase:5, storageEfficiency:5, costEfficiency:4, automation:4, sustainability:4, customization:3 }
  },

  // ─── 03: FOL ─ FEFCO 0202 ─────────────────────────────────
  {
    id: "fol",
    code: "FOL",
    fefcoCode: "0202",
    nameEn: "Full Overlap Carton",
    nameCn: "全叠盖纸箱",
    popularity: 20,
    asciiArt:
      "       ┌─────────────────────┐\n" +
      "       │║                   ║│\n" +
      "  ┌────┴────────────────────┴────┐\n" +
      "  │║  [  摇盖完全重叠  ]    ║│\n" +
      "  └───────────────────────────────┘",
    structure: "外摇盖长度等于或大于箱宽，完全重叠覆盖箱口，提供双重保护层。",
    applications: ["重型机械出口包装", "玻璃陶瓷易碎品", "长途海运货物", "高价值设备包装"],
    pros: ["双重盖保护，抗压性强", "密封性好，防尘防潮", "适合重型/易碎品"],
    cons: ["用纸量增加，成本较高", "组装稍复杂（需固定重叠处）", "空箱体积大，返程运输不经济"],
    costLevel: 3,
    equipment: ["瓦楞纸板生产线", "印刷开槽机", "自动打包机", "智能仓储系统"],
    fluteTypes: ["A瓦", "C瓦", "BC瓦", "AB瓦"],
    layers: ["双层（5层）", "三层（7层）", "四层（9层）"],
    comparisonParams: { protection:5, stackability:5, printability:3, assemblyEase:3, storageEfficiency:3, costEfficiency:2, automation:3, sustainability:2, customization:3 }
  },

  // ─── 04: TEL ─ FEFCO 0203 ─────────────────────────────────
  {
    id: "tel",
    code: "TEL",
    fefcoCode: "0203",
    nameEn: "Telescope Carton",
    nameCn: "套盖纸箱",
    popularity: 10,
    asciiArt:
      "       ╔═══════════════════╗\n" +
      "       ║   套盖（可分离）   ║\n" +
      "       ╚═══════════════════╝\n" +
      "       ┌─────────────────────┐\n" +
      "       │   箱体（主体）      │",
    structure: "箱盖和箱体分离，套盖式设计，盖子的深度通常覆盖箱体的一部分。",
    applications: ["鞋盒", "礼品包装盒", "精密仪器包装", "服装高档包装"],
    pros: ["外观精美，适合零售展示", "套盖提供额外保护", "可设计性高（印刷/烫金）"],
    cons: ["用纸量大，成本较高", "组装需套合，稍费时", "不适合自动化高速生产"],
    costLevel: 5,
    equipment: ["模切机", "自动糊盒机", "智能仓储系统"],
    fluteTypes: ["E瓦", "F瓦", "G瓦", "N瓦"],
    layers: ["单层（3层）", "微瓦（E/F/G）"],
    comparisonParams: { protection:4, stackability:3, printability:5, assemblyEase:2, storageEfficiency:3, costEfficiency:1, automation:2, sustainability:3, customization:5 }
  },

  // ─── 05: FOLDR ─ FEFCO 0204 ───────────────────────────────
  {
    id: "foldr",
    code: "FOLDR",
    fefcoCode: "0204",
    nameEn: "Folding Carton",
    nameCn: "折叠纸箱（纸盒）",
    popularity: 25,
    asciiArt:
      "       ╔═══════════════════╗\n" +
      "       ║    折叠平放运输     ║\n" +
      "       ╚═══════════════════╝\n" +
      "       ┌─────────────────────┐\n" +
      "       │  展开 → 折叠 → 成型 │",
    structure: "平板状态运输，使用时折叠成型，无需胶水贴合，典型的折叠纸盒结构。",
    applications: ["食品包装（ cereal 盒）", "药品包装", "化妆品包装", "玩具包装"],
    pros: ["平板运输，节省物流成本", "自动成型，适合高速包装线", "印刷效果好，适合品牌展示"],
    cons: ["承重能力有限（非运输包装）", "需要精确的模切和压痕", "不适合重型产品"],
    costLevel: 2,
    equipment: ["模切机", "自动糊盒机", "印刷机（胶印/柔印）"],
    fluteTypes: ["E瓦", "F瓦", "G瓦", "N瓦", "卡纸"],
    layers: ["单层（3层微瓦）", "卡纸（无瓦楞）"],
    comparisonParams: { protection:2, stackability:3, printability:5, assemblyEase:5, storageEfficiency:5, costEfficiency:4, automation:5, sustainability:4, customization:4 }
  },

  // ─── 06: DC ─ FEFCO 0205 ──────────────────────────────────
  {
    id: "dc",
    code: "DC",
    fefcoCode: "0205",
    nameEn: "Die Cut Carton",
    nameCn: "模切纸箱",
    popularity: 30,
    asciiArt:
      "       ╔═══════════════════╗\n" +
      "       ║   ◇   异形模切    ◇  ║\n" +
      "       ╚═══════════════════╝\n" +
      "       ┌─────────────────────┐\n" +
      "       │  [ 一把模切刀成型 ]  │",
    structure: "通过模切刀版一次性冲切出复杂形状，可带锁扣、提手、展示窗等功能结构。",
    applications: ["电商定制包装（品牌Logo）", "展示包装（POP展示盒）", "带提手的礼品盒", "异形产品包装（自行车）"],
    pros: ["形状自由，可实现复杂结构", "自带锁扣，无需胶带", "品牌展示效果好"],
    cons: ["模切版成本高（需开版费）", "小批量不经济", "生产速度比开槽箱慢"],
    costLevel: 4,
    equipment: ["模切机（平压/圆压）", "自动糊盒机", "印刷机"],
    fluteTypes: ["E瓦", "F瓦", "B瓦", "BC瓦"],
    layers: ["单层（3层）", "双层（5层）"],
    comparisonParams: { protection:3, stackability:3, printability:5, assemblyEase:4, storageEfficiency:4, costEfficiency:2, automation:3, sustainability:3, customization:5 }
  },

  // ─── 07: BLS ─ FEFCO 0206 ─────────────────────────────────
  {
    id: "bls",
    code: "BLS",
    fefcoCode: "0206",
    nameEn: "Bliss Carton",
    nameCn: "布利斯纸箱",
    popularity: 8,
    asciiArt:
      "       ┌─────────────────────┐\n" +
      "       │║      三片式      ║│\n" +
      "  ┌────┴────────────────────┴────┐\n" +
      "  │║ [主体+两侧端板]         ║│\n" +
      "  └───────────────────────────────┘",
    structure: "由三片独立纸板组装而成：主体、两个端板，通过插槽或胶带连接，无摇盖设计。",
    applications: ["大型家电包装（冰箱/洗衣机）", "家具包装", "汽车零部件", "需要高抗压的方形物品"],
    pros: ["抗压强度极高（无摇盖弱点）", "用料效率高（比同强度RSC省纸）", "组装后外形规整"],
    cons: ["组装较复杂，需三步成型", "不适合小批量（需三片模切）", "自动化难度大"],
    costLevel: 3,
    equipment: ["模切机", "自动组装机（大型）", "瓦楞纸板生产线"],
    fluteTypes: ["A瓦", "C瓦", "BC瓦", "AB瓦"],
    layers: ["双层（5层）", "三层（7层）"],
    comparisonParams: { protection:5, stackability:5, printability:2, assemblyEase:2, storageEfficiency:4, costEfficiency:3, automation:2, sustainability:4, customization:2 }
  },

  // ─── 11: TRY ─ FEFCO 0212 ─────────────────────────────────
  {
    id: "try",
    code: "TRY",
    fefcoCode: "0212",
    nameEn: "Tray Carton",
    nameCn: "托盘式纸箱",
    popularity: 18,
    asciiArt:
      "       ┌─────────────────────┐\n" +
      "       │                     │\n" +
      "       │   [  无顶盖托盘  ]  │\n" +
      "       │  ╔═════════════╗   │\n" +
      "       │  ║  开放展示    ║   │",
    structure: "无顶盖的开放式托盘结构，四壁直立，底部承托，适合展示和分拣场景。",
    applications: ["超市货架展示托盘", "水果蔬菜包装托盘", "电商仓储分拣盒", "邮政速递托盘"],
    pros: ["开放设计，商品展示效果好", "可套叠，空托盘节省空间", "取放商品方便快捷"],
    cons: ["无顶盖保护", "抗压能力有限", "不适合堆叠过高"],
    costLevel: 2,
    equipment: ["模切机", "自动糊盒机"],
    fluteTypes: ["B瓦", "E瓦", "BC瓦"],
    layers: ["单层（3层）", "双层（5层）"],
    comparisonParams: { protection:2, stackability:3, printability:4, assemblyEase:5, storageEfficiency:5, costEfficiency:4, automation:4, sustainability:4, customization:3 }
  },

  // ─── 10: RETF ─ FEFCO 0211 ────────────────────────────────
  {
    id: "retf",
    code: "RETF",
    fefcoCode: "0211",
    nameEn: "Roll End Tuck Front",
    nameCn: "自锁纸箱（前插式）",
    popularity: 12,
    asciiArt:
      "       ┌─────────────────────┐\n" +
      "       │  [  无需胶带自锁  ] │\n" +
      "       │   ╔═════════════╗   │\n" +
      "       │   ║ 插舌锁紧结构 ║   │\n" +
      "       └─────────────────────┘",
    structure: "通过预设的插舌和锁孔结构自行锁紧，无需胶带或胶水即可完成封箱。",
    applications: ["电商快递箱（环保无胶带）", "食品外卖包装", "礼品包装（易拆封）", "返程物流箱（可重复使用）"],
    pros: ["无需胶带，环保且降低成本", "组装快速，适合自动化", "防盗性好（拆封有痕迹）"],
    cons: ["结构设计复杂，模具成本高", "插舌可能意外松开（需精确设计）", "承重比胶带封口稍差"],
    costLevel: 3,
    equipment: ["模切机", "自动糊盒机", "智能仓储系统"],
    fluteTypes: ["B瓦", "C瓦", "E瓦", "BC瓦"],
    layers: ["单层（3层）", "双层（5层）"],
    comparisonParams: { protection:3, stackability:4, printability:4, assemblyEase:4, storageEfficiency:4, costEfficiency:3, automation:4, sustainability:5, customization:4 }
  },

  // ─── FEFCO 0300 系列：托盘/角撑型 ─────────────────────────────

  // ─── 12: CTRY ─ FEFCO 0310 ────────────────────────────────
  {
    id: "ctry",
    code: "CTRY",
    fefcoCode: "0310",
    nameEn: "Corner Tray",
    nameCn: "角撑托盘",
    popularity: 5,
    asciiArt:
      "         ╔═════════════╗\n" +
      "       ┌─╝             ╚─┐\n" +
      "       │   角撑加固托盘     │\n" +
      "       └─╗             ╔─┘\n" +
      "         ╚═════════════╝",
    structure: "托盘四角有三角形角撑片加固，提高托盘整体强度和刚性，防止变形。",
    applications: ["重型物品托盘（瓷砖/地板）", "仓储用堆垛托盘", "工业零部件托盘", "可循环使用运输托盘"],
    pros: ["角撑设计，抗压强度高", "可折叠平放，返程运输经济", "适合重型/规则物品"],
    cons: ["结构复杂，生产成本较高", "不适合异形/不规则物品", "外观较工业风，不适合零售"],
    costLevel: 3,
    equipment: ["模切机", "自动糊盒机", "瓦楞纸板生产线"],
    fluteTypes: ["A瓦", "C瓦", "BC瓦", "AB瓦"],
    layers: ["双层（5层）", "三层（7层）"],
    comparisonParams: { protection:4, stackability:5, printability:2, assemblyEase:3, storageEfficiency:4, costEfficiency:3, automation:3, sustainability:4, customization:2 }
  },

  // ─── 08: CSSC ─ FEFCO 0207 ────────────────────────────────
  {
    id: "cssc",
    code: "CSSC",
    fefcoCode: "0207",
    nameEn: "Center Special Slotted Carton",
    nameCn: "中缝开槽纸箱",
    popularity: 8,
    asciiArt:
      "       ┌──────────┬──────────┐\n" +
      "       │          │          │\n" +
      "  ┌────┴──────────┴──────────┴────┐\n" +
      "  │   [ 中缝设计，对称摇盖 ]    │\n" +
      "  └───────────────────────────────┘",
    structure: "摇盖从纸箱中心向两侧打开，对称设计，适合需要从中部取放物品的场景。",
    applications: ["长条形物品包装（管材/窗帘杆）", "服装悬挂包装", "五金工具包装", "需要中部操作的设备"],
    pros: ["对称设计，美观且实用", "中部开口，取放方便", "适合长条形/不规则物品"],
    cons: ["非标准设计，模具成本高", "自动化生产难度较大", "市场认知度低"],
    costLevel: 2,
    equipment: ["模切机", "印刷开槽机"],
    fluteTypes: ["B瓦", "C瓦", "BC瓦"],
    layers: ["单层（3层）", "双层（5层）"],
    comparisonParams: { protection:3, stackability:4, printability:3, assemblyEase:3, storageEfficiency:4, costEfficiency:3, automation:2, sustainability:4, customization:4 }
  },

  // ─── 09: DCB ─ FEFCO 0209 ─────────────────────────────────
  {
    id: "dcb",
    code: "DCB",
    fefcoCode: "0209",
    nameEn: "Double Cover Carton",
    nameCn: "双盖纸箱",
    popularity: 6,
    asciiArt:
      "       ╔═══════════════════╗\n" +
      "       ║     顶盖（可分离） ║\n" +
      "       ╚═══════════════════╝\n" +
      "       ┌─────────────────────┐\n" +
      "       │     箱体主体        │\n" +
      "       ╔═══════════════════╗\n" +
      "       ║    底盖（可分离）  ║",
    structure: "顶盖和底盖均可分离，箱体完全开放，适合需要全方位接触的物品。",
    applications: ["艺术品/油画运输箱", "精密仪器全方位保护", "需多角度操作设备的包装", "高档礼品双重开启"],
    pros: ["双重保护（顶+底盖）", "全方位接触，便于操作", "高档感强，适合奢侈品"],
    cons: ["用纸量最大，成本最高", "组装需两步（顶+底）", "空箱体积大"],
    costLevel: 5,
    equipment: ["模切机", "自动糊盒机", "智能仓储系统"],
    fluteTypes: ["A瓦", "C瓦", "AB瓦", "BC瓦"],
    layers: ["双层（5层）", "三层（7层）", "四层（9层）"],
    comparisonParams: { protection:5, stackability:4, printability:4, assemblyEase:1, storageEfficiency:2, costEfficiency:1, automation:1, sustainability:2, customization:3 }
  },

  // ─── FEFCO 0500 系列：特殊折叠型 ─────────────────────────────

  // ─── 13: FPF ─ FEFCO 0501 ─────────────────────────────────
  {
    id: "fpf",
    code: "FPF",
    fefcoCode: "0501",
    nameEn: "Five Panel Folding Carton",
    nameCn: "五面板折叠箱",
    popularity: 10,
    asciiArt:
      "       ┌──┬──┬──┬──┬──┐\n" +
      "       │P1│P2│P3│P4│P5│\n" +
      "       └──┴──┴──┴──┴──┘\n" +
      "       [五面板 → 折叠包裹成型]",
    structure: "由五块相连的面板组成，通过折叠将物品全方位包裹，无重叠接缝。",
    applications: ["长条形物品（地毯卷/管材）", "纺织品卷装包装", "需要紧密包裹的不规则物品", "邮递管道包装"],
    pros: ["全方位包裹，密封性好", "无重叠接缝，外观整洁", "用纸效率高"],
    cons: ["只适合长条形/卷状物品", "组装需精确折叠", "内部缓冲需额外设计"],
    costLevel: 3,
    equipment: ["模切机", "印刷开槽机"],
    fluteTypes: ["B瓦", "C瓦", "BC瓦"],
    layers: ["单层（3层）", "双层（5层）"],
    comparisonParams: { protection:4, stackability:3, printability:3, assemblyEase:3, storageEfficiency:4, costEfficiency:3, automation:3, sustainability:4, customization:3 }
  },

  // ─── 14: PWB ─ FEFCO 0502 ─────────────────────────────────
  {
    id: "pwb",
    code: "PWB",
    fefcoCode: "0502",
    nameEn: "Pad Wrapped Carton",
    nameCn: "垫纸包裹箱",
    popularity: 5,
    asciiArt:
      "         ╔═════════════╗\n" +
      "       ┌─╝  垫纸+包裹  ╚─┐\n" +
      "       │  [  一片式包裹  ]  │\n" +
      "       └─────────────────────┘",
    structure: "由单片纸板通过折叠和包裹动作成型，类似包装纸的包裹方式，无粘接。",
    applications: ["轻质物品包装（文件/服装）", "临时包装/搬家箱", "低成本电商包装", "可手动快速包裹"],
    pros: ["极简设计，成本最低之一", "一片式，无需组装", "适合手动快速包装"],
    cons: ["结构强度低", "不适合重型/易碎品", "外观简陋，不适合品牌包装"],
    costLevel: 3,
    equipment: ["瓦楞纸板生产线", "印刷机（简易）"],
    fluteTypes: ["B瓦", "E瓦"],
    layers: ["单层（3层）"],
    comparisonParams: { protection:1, stackability:2, printability:3, assemblyEase:5, storageEfficiency:5, costEfficiency:5, automation:2, sustainability:4, customization:1 }
  },

  // ─── FEFCO 0400 系列：自锁型 ─────────────────────────────────

  // ─── 15: SLB ─ FEFCO 0401 ─────────────────────────────────
  {
    id: "slb",
    code: "SLB",
    fefcoCode: "0401",
    nameEn: "Self-Locking Bottom Carton",
    nameCn: "自锁底纸箱",
    popularity: 15,
    asciiArt:
      "       ┌─────────────────────┐\n" +
      "       │  [ 底部自动锁合 ]  │\n" +
      "       │   ╔═════════════╗   │\n" +
      "       │   ║ 展开→按压→锁 ║   │\n" +
      "       └─────────────────────┘",
    structure: "底部预设自锁结构，箱体展开后按压底部即可自动锁紧，无需胶带封底。",
    applications: ["电商快递箱（自动封底）", "自动包装线专用箱", "需要快速组装的批量包装", "返程可折叠运输箱"],
    pros: ["底部自锁，组装速度极快", "无需封底胶带，降低成本", "适合高速自动包装线"],
    cons: ["底部结构复杂，模具成本高", "自锁舌可能磨损（重复使用性差）", "承重比胶带封底稍弱"],
    costLevel: 3,
    equipment: ["模切机", "自动成型机", "印刷开槽机"],
    fluteTypes: ["B瓦", "C瓦", "BC瓦"],
    layers: ["单层（3层）", "双层（5层）"],
    comparisonParams: { protection:3, stackability:4, printability:4, assemblyEase:5, storageEfficiency:4, costEfficiency:3, automation:5, sustainability:4, customization:3 }
  },

  // ═══════════════════════════════════════════════════════════════
  //  以下为补充纸箱类型（2026-05-22 新增）
  // ═══════════════════════════════════════════════════════════════

  // ─── 16: OSC ─ FEFCO 0203 ─────────────────────────────────
  {
    id: "osc",
    code: "OSC",
    fefcoCode: "0203",
    nameEn: "Overlap Slotted Carton",
    nameCn: "重叠开槽纸箱",
    popularity: 12,
    structure: "外摇盖长度大于箱宽的一半，形成部分重叠搭接，比RSC密封性更好。",
    applications: ["食品饮料运输", "化工品包装", "需要更好密封的常规运输", "电商标准箱替代"],
    pros: ["摇盖重叠搭接，密封性优于RSC", "抗压强度比RSC略高", "结构简单，生产成本低"],
    cons: ["用纸量比RSC略多", "外观不如RSC整齐", "自动化组装稍复杂"],
    costLevel: 2,
    equipment: ["瓦楞纸板生产线", "印刷开槽机", "自动打包机"],
    fluteTypes: ["A瓦", "B瓦", "C瓦", "BC瓦", "AB瓦"],
    layers: ["单层（3层）", "双层（5层）"],
    comparisonParams: { protection:4, stackability:4, printability:4, assemblyEase:5, storageEfficiency:4, costEfficiency:4, automation:5, sustainability:4, customization:2 }
  },

  // ─── 17: HSC-HC ─ FEFCO 0208 ────────────────────────────
  {
    id: "hsc_hc",
    code: "HSC+HC",
    fefcoCode: "0208",
    nameEn: "Half Slotted Container with Half Cover",
    nameCn: "带半盖的半开槽纸箱",
    popularity: 8,
    structure: "半开槽箱体配合一个半高度盖子，盖子仅覆盖箱口的一半面积。",
    applications: ["水果蔬菜展示包装", "超市货架陈列", "需要部分遮盖的仓储", "分拣周转箱"],
    pros: ["半盖设计，兼顾展示和保护", "取放方便", "可嵌套堆叠节省空间"],
    cons: ["半盖保护性有限", "不适合长途运输", "堆叠高度受限"],
    costLevel: 2,
    equipment: ["瓦楞纸板生产线", "印刷开槽机"],
    fluteTypes: ["B瓦", "C瓦", "E瓦", "BC瓦"],
    layers: ["单层（3层）", "双层（5层）"],
    comparisonParams: { protection:3, stackability:3, printability:3, assemblyEase:5, storageEfficiency:5, costEfficiency:4, automation:4, sustainability:4, customization:3 }
  },

  // ─── 18: SNAP ─ FEFCO 0215 ──────────────────────────────
  {
    id: "snap",
    code: "SNAP",
    fefcoCode: "0215",
    nameEn: "Snap Bottom (1-2-3 Bottom) Container",
    nameCn: "卡扣底纸箱（1-2-3底）",
    popularity: 18,
    structure: "底部采用1-2-3卡扣锁合设计，四个翻板依次折叠互锁，无需胶带封底。",
    applications: ["电商快递箱", "鞋类包装", "礼品包装", "食品外卖包装"],
    pros: ["底部自动锁合，无需胶带", "组装快速，适合手工和自动线", "底部平整，承重均匀"],
    cons: ["卡扣设计精度要求高", "重复使用后锁合力下降", "不适合超重物品"],
    costLevel: 2,
    equipment: ["模切机", "印刷开槽机", "自动成型机"],
    fluteTypes: ["B瓦", "C瓦", "E瓦", "BC瓦"],
    layers: ["单层（3层）", "双层（5层）"],
    comparisonParams: { protection:4, stackability:4, printability:4, assemblyEase:5, storageEfficiency:4, costEfficiency:4, automation:5, sustainability:4, customization:3 }
  },

  // ─── 19: ILB ─ FEFCO 0216 ──────────────────────────────
  {
    id: "ilb",
    code: "ILB",
    fefcoCode: "0216",
    nameEn: "Interlocking Bottom Container",
    nameCn: "互锁底纸箱",
    popularity: 10,
    structure: "底部通过两个相对摇盖的插舌与另外两个摇盖的切口互锁固定，无需胶水胶带。",
    applications: ["电商包装", "服装鞋帽包装", "轻型产品运输", "零售展示包装"],
    pros: ["底部互锁牢固", "无需胶带，环保且美观", "组装便捷"],
    cons: ["互锁结构设计复杂", "不适合重型物品", "模切精度要求高"],
    costLevel: 3,
    equipment: ["模切机", "印刷开槽机", "自动糊盒机"],
    fluteTypes: ["B瓦", "C瓦", "E瓦", "BC瓦"],
    layers: ["单层（3层）", "双层（5层）"],
    comparisonParams: { protection:3, stackability:4, printability:4, assemblyEase:4, storageEfficiency:4, costEfficiency:3, automation:4, sustainability:5, customization:3 }
  },

  // ─── 20: SLBC ─ FEFCO 0217 ─────────────────────────────
  {
    id: "slbc",
    code: "SLBC",
    fefcoCode: "0217",
    nameEn: "Self-Locking Bottom Container",
    nameCn: "自锁底纸箱（带盖）",
    popularity: 7,
    structure: "底部和顶部均有自锁结构，完全免胶带设计，展开按压即可成型封箱。",
    applications: ["高端电商品牌包装", "奢侈品包装", "礼品盒", "需重复开合的包装"],
    pros: ["顶底双自锁，完全免胶带", "外观精美，适合品牌展示", "可重复开合"],
    cons: ["结构设计复杂，成本较高", "模具开版费用高", "不适合重型货物"],
    costLevel: 4,
    equipment: ["模切机", "自动糊盒机", "印刷机（高品质）"],
    fluteTypes: ["E瓦", "F瓦", "B瓦", "卡纸"],
    layers: ["单层（3层）", "微瓦（E/F）", "卡纸"],
    comparisonParams: { protection:3, stackability:3, printability:5, assemblyEase:4, storageEfficiency:4, costEfficiency:2, automation:3, sustainability:5, customization:5 }
  },

  // ─── 21: FTC ─ FEFCO 0300 ──────────────────────────────
  {
    id: "ftc",
    code: "FTC",
    fefcoCode: "0300",
    nameEn: "Full Telescope Container",
    nameCn: "全套入式纸箱",
    popularity: 15,
    structure: "盖和体完全分离，盖套入箱体，套入深度大，提供全面保护。",
    applications: ["鞋盒", "礼品盒", "精密仪器包装", "高档零售包装"],
    pros: ["外观精美，适合零售展示", "套合紧密，保护性好", "盖和体可独立印刷"],
    cons: ["用纸量大，成本高", "两片式组装费时", "空箱体积大"],
    costLevel: 4,
    equipment: ["模切机", "自动糊盒机", "印刷机"],
    fluteTypes: ["E瓦", "F瓦", "G瓦", "卡纸"],
    layers: ["单层（3层微瓦）", "卡纸（无瓦楞）"],
    comparisonParams: { protection:4, stackability:3, printability:5, assemblyEase:2, storageEfficiency:3, costEfficiency:2, automation:2, sustainability:3, customization:5 }
  },

  // ─── 22: FTC-F ─ FEFCO 0301 ────────────────────────────
  {
    id: "ftc_f",
    code: "FTC+F",
    fefcoCode: "0301",
    nameEn: "Full Telescope Container with Flaps",
    nameCn: "带摇盖的全套入式纸箱",
    popularity: 6,
    structure: "全套入式设计，但箱体和盖上各带有一组摇盖，增加内层保护。",
    applications: ["高档酒类包装", "茶叶礼品盒", "陶瓷艺术品包装", "精密仪器双重保护"],
    pros: ["双重保护（套入+摇盖）", "密封性极好", "适合高价值商品"],
    cons: ["结构复杂，成本最高", "组装需两步以上", "不适合大批量生产"],
    costLevel: 5,
    equipment: ["模切机", "自动糊盒机", "印刷机（高精度）"],
    fluteTypes: ["E瓦", "F瓦", "卡纸"],
    layers: ["单层（3层微瓦）", "卡纸"],
    comparisonParams: { protection:5, stackability:3, printability:5, assemblyEase:1, storageEfficiency:2, costEfficiency:1, automation:1, sustainability:2, customization:5 }
  },

  // ─── 23: FTHSC ─ FEFCO 0303 ────────────────────────────
  {
    id: "fthsc",
    code: "FTHSC",
    fefcoCode: "0303",
    nameEn: "Full Telescope Half Slotted Container with Cover",
    nameCn: "全套入半开槽带盖纸箱",
    popularity: 5,
    structure: "半开槽箱体配合全套入式盖子，盖子完全套入箱体，适合重型物品。",
    applications: ["大型机械零部件", "家电包装", "汽车配件", "工业设备运输"],
    pros: ["套入式盖保护全面", "适合重型物品", "盖子可重复使用"],
    cons: ["成本较高", "空箱体积大", "不适合自动化"],
    costLevel: 4,
    equipment: ["瓦楞纸板生产线", "印刷开槽机", "模切机"],
    fluteTypes: ["A瓦", "C瓦", "BC瓦", "AB瓦"],
    layers: ["双层（5层）", "三层（7层）"],
    comparisonParams: { protection:5, stackability:4, printability:2, assemblyEase:2, storageEfficiency:2, costEfficiency:2, automation:2, sustainability:3, customization:2 }
  },

  // ─── 24: PTC ─ FEFCO 0308 ──────────────────────────────
  {
    id: "ptc",
    code: "PTC",
    fefcoCode: "0308",
    nameEn: "Partial Telescope Container",
    nameCn: "部分套入式纸箱",
    popularity: 8,
    structure: "盖子仅部分套入箱体（深度较浅），比全套入式省材料，兼顾美观与成本。",
    applications: ["服装零售包装", "日用消费品", "食品礼盒", "轻工业品包装"],
    pros: ["外观优于普通纸箱", "比全套入式省纸", "套合方便快捷"],
    cons: ["保护性不如全套入式", "套入深度浅，易脱落", "不适合重物"],
    costLevel: 3,
    equipment: ["模切机", "自动糊盒机", "印刷机"],
    fluteTypes: ["B瓦", "C瓦", "E瓦", "卡纸"],
    layers: ["单层（3层）", "卡纸"],
    comparisonParams: { protection:3, stackability:3, printability:5, assemblyEase:3, storageEfficiency:3, costEfficiency:3, automation:3, sustainability:3, customization:4 }
  },

  // ─── 25: DCC ─ FEFCO 0314 ──────────────────────────────
  {
    id: "dcc",
    code: "DCC",
    fefcoCode: "0314",
    nameEn: "Double Cover Container",
    nameCn: "双盖容器",
    popularity: 4,
    structure: "顶部和底部各有独立的分离式盖子，箱体完全开放，可全方位接触内部物品。",
    applications: ["大型油画/艺术品运输", "精密仪器全方位保护", "需多角度操作的设备", "高档礼品展示"],
    pros: ["顶底双盖，全方位保护", "完全开放便于操作", "适合极高价值商品"],
    cons: ["用纸量最大", "三片式组装最复杂", "成本最高，空箱体积大"],
    costLevel: 5,
    equipment: ["瓦楞纸板生产线", "印刷开槽机", "模切机"],
    fluteTypes: ["A瓦", "C瓦", "AB瓦", "BC瓦"],
    layers: ["双层（5层）", "三层（7层）", "四层（9层）"],
    comparisonParams: { protection:5, stackability:4, printability:3, assemblyEase:1, storageEfficiency:2, costEfficiency:1, automation:1, sustainability:2, customization:3 }
  },

  // ─── 26: FFB ─ FEFCO 0400 ──────────────────────────────
  {
    id: "ffb",
    code: "FFB",
    fefcoCode: "0400",
    nameEn: "Folder Type Box (One-Piece)",
    nameCn: "单片式折叠纸箱",
    popularity: 20,
    structure: "由单片纸板通过折叠成型，无需胶水或胶带，底部通过插舌或卡扣固定。",
    applications: ["电商快递箱", "食品包装", "药品包装", "日用品包装"],
    pros: ["单片式，生产效率高", "平板运输，节省物流空间", "组装简便，无需工具"],
    cons: ["承重能力有限", "密封性不如RSC", "不适合重型或易碎品"],
    costLevel: 2,
    equipment: ["模切机", "印刷开槽机", "自动成型机"],
    fluteTypes: ["B瓦", "C瓦", "E瓦", "BC瓦"],
    layers: ["单层（3层）"],
    comparisonParams: { protection:3, stackability:3, printability:4, assemblyEase:5, storageEfficiency:5, costEfficiency:4, automation:5, sustainability:4, customization:3 }
  },

  // ─── 27: FFC ─ FEFCO 0402 ──────────────────────────────
  {
    id: "ffc",
    code: "FFC",
    fefcoCode: "0402",
    nameEn: "Folder Type Box with Cover",
    nameCn: "带盖折叠纸箱",
    popularity: 14,
    structure: "单片折叠纸箱带有一体式翻盖，翻盖可反复开合，适合需频繁取放的物品。",
    applications: ["文件档案盒", "办公用品包装", "工具收纳盒", "零售展示包装"],
    pros: ["一体式翻盖，反复开合", "无需额外配件", "外观整洁美观"],
    cons: ["翻盖处易磨损", "承重有限", "密封性一般"],
    costLevel: 2,
    equipment: ["模切机", "自动糊盒机", "印刷机"],
    fluteTypes: ["E瓦", "F瓦", "B瓦", "卡纸"],
    layers: ["单层（3层）", "卡纸"],
    comparisonParams: { protection:3, stackability:3, printability:4, assemblyEase:5, storageEfficiency:5, costEfficiency:4, automation:4, sustainability:4, customization:4 }
  },

  // ─── 28: FPF-5P ─ FEFCO 0410 ───────────────────────────
  {
    id: "fpf_5p",
    code: "FPF-5P",
    fefcoCode: "0410",
    nameEn: "Five Panel Folder",
    nameCn: "五面板折叠箱（标准型）",
    popularity: 22,
    structure: "由五块相连面板组成，通过折叠将物品全方位包裹，最后一片面板插入锁合。",
    applications: ["长条形物品（地毯/窗帘/管材）", "纺织卷装包装", "不规则形状物品", "管道运输包装"],
    pros: ["全方位包裹，密封性好", "用纸效率高", "适合长条形物品"],
    cons: ["仅适合特定形状物品", "需精确折叠", "不适合方形/重型物品"],
    costLevel: 2,
    equipment: ["模切机", "印刷开槽机"],
    fluteTypes: ["B瓦", "C瓦", "BC瓦"],
    layers: ["单层（3层）", "双层（5层）"],
    comparisonParams: { protection:4, stackability:3, printability:3, assemblyEase:3, storageEfficiency:4, costEfficiency:4, automation:3, sustainability:4, customization:3 }
  },

  // ─── 29: CLB ─ FEFCO 0419 ──────────────────────────────
  {
    id: "clb",
    code: "CLB",
    fefcoCode: "0419",
    nameEn: "Crash-Lock Bottom Folder",
    nameCn: "压锁底折叠纸箱",
    popularity: 16,
    structure: "底部通过交叉折叠的四个翻板自动互锁（crash-lock），无需胶带胶水，一按即锁。",
    applications: ["披萨盒", "快餐包装", "蛋糕盒", "电商标准箱"],
    pros: ["底部一按即锁，组装极快", "无需胶带胶水", "适合高速自动包装线"],
    cons: ["底部承重有限", "不适合重物", "预制需精确折叠定型"],
    costLevel: 2,
    equipment: ["模切机", "预折机", "自动糊盒机"],
    fluteTypes: ["B瓦", "E瓦", "F瓦"],
    layers: ["单层（3层）", "微瓦"],
    comparisonParams: { protection:3, stackability:3, printability:4, assemblyEase:5, storageEfficiency:5, costEfficiency:4, automation:5, sustainability:4, customization:3 }
  },

  // ─── 30: SNB ─ FEFCO 0420 ──────────────────────────────
  {
    id: "snb",
    code: "SNB",
    fefcoCode: "0420",
    nameEn: "Snap-Lock Bottom Folder",
    nameCn: "卡锁底折叠纸箱",
    popularity: 14,
    structure: "底部通过卡扣结构锁合，类似FEFCO 0215的底部设计，但整体为折叠型纸箱。",
    applications: ["高端食品包装", "化妆品包装", "茶叶盒", "保健品包装"],
    pros: ["底部卡扣牢固", "外观精美", "无需胶带，适合品牌展示"],
    cons: ["模切成本较高", "不适合重型物品", "生产速度略慢"],
    costLevel: 3,
    equipment: ["模切机", "自动糊盒机", "印刷机"],
    fluteTypes: ["E瓦", "F瓦", "B瓦", "卡纸"],
    layers: ["单层（3层）", "卡纸"],
    comparisonParams: { protection:3, stackability:3, printability:5, assemblyEase:4, storageEfficiency:4, costEfficiency:3, automation:4, sustainability:4, customization:4 }
  },

  // ─── 31: FCT ─ FEFCO 0421 ──────────────────────────────
  {
    id: "fct",
    code: "FCT",
    fefcoCode: "0421",
    nameEn: "Four Corner Tray",
    nameCn: "四角托盘",
    popularity: 12,
    structure: "四壁通过角部插舌折叠成型的托盘式结构，底部和四壁一体成型。",
    applications: ["水果蔬菜运输托盘", "超市生鲜陈列", "电商仓储分拣", "轻型零件周转"],
    pros: ["四角加固，结构稳固", "可折叠平放，节省运输空间", "取放方便"],
    cons: ["无顶盖保护", "不适合长途运输", "堆叠高度有限"],
    costLevel: 2,
    equipment: ["模切机", "自动糊盒机", "印刷开槽机"],
    fluteTypes: ["B瓦", "C瓦", "E瓦", "BC瓦"],
    layers: ["单层（3层）", "双层（5层）"],
    comparisonParams: { protection:2, stackability:3, printability:3, assemblyEase:5, storageEfficiency:5, costEfficiency:4, automation:4, sustainability:4, customization:3 }
  },

  // ─── 32: SLT ─ FEFCO 0428 ──────────────────────────────
  {
    id: "slt",
    code: "SLT",
    fefcoCode: "0428",
    nameEn: "Self-Locking Tray",
    nameCn: "自锁托盘",
    popularity: 10,
    structure: "四壁通过自锁结构自动固定，无需胶水，展开后按压即可成型。",
    applications: ["快递分拣托盘", "水果包装", "超市货架陈列", "轻型产品内托"],
    pros: ["自锁成型，组装极快", "无需胶水", "适合自动化生产线"],
    cons: ["自锁结构强度有限", "不适合重物", "不适合潮湿环境"],
    costLevel: 2,
    equipment: ["模切机", "自动成型机", "印刷开槽机"],
    fluteTypes: ["B瓦", "C瓦", "E瓦"],
    layers: ["单层（3层）"],
    comparisonParams: { protection:2, stackability:3, printability:3, assemblyEase:5, storageEfficiency:5, costEfficiency:4, automation:5, sustainability:4, customization:3 }
  },

  // ─── 33: SB ─ FEFCO 0501 ───────────────────────────────
  {
    id: "sb",
    code: "SB",
    fefcoCode: "0501",
    nameEn: "Slide Box (Tube and Sleeve)",
    nameCn: "滑入式纸箱（管套式）",
    popularity: 10,
    structure: "由内箱体和外管套两部分组成，内箱可沿外管套滑动抽出，类似抽屉盒。",
    applications: ["高档礼品盒", "电子产品包装", "化妆品包装", "文具收纳盒"],
    pros: ["抽出式开合体验优雅", "适合高档品牌展示", "内外可独立印刷"],
    cons: ["两片式，成本较高", "组装需两步", "不适合大批量运输包装"],
    costLevel: 4,
    equipment: ["模切机", "自动糊盒机", "印刷机"],
    fluteTypes: ["E瓦", "F瓦", "G瓦", "卡纸"],
    layers: ["单层（3层微瓦）", "卡纸"],
    comparisonParams: { protection:4, stackability:2, printability:5, assemblyEase:2, storageEfficiency:3, costEfficiency:2, automation:2, sustainability:3, customization:5 }
  },

  // ─── 34: SBF ─ FEFCO 0502 ──────────────────────────────
  {
    id: "sbf",
    code: "SBF",
    fefcoCode: "0502",
    nameEn: "Slide Box with Flaps",
    nameCn: "带摇盖滑入式纸箱",
    popularity: 5,
    structure: "滑入式纸箱变体，内箱体带有摇盖，增加内层密封性。",
    applications: ["高档茶叶包装", "酒类包装", "奢侈品礼盒", "精密仪器盒"],
    pros: ["双重保护（滑入+摇盖）", "密封性优于普通滑入式", "品牌展示效果好"],
    cons: ["成本更高", "组装复杂", "不适合大批量"],
    costLevel: 5,
    equipment: ["模切机", "自动糊盒机", "印刷机（高品质）"],
    fluteTypes: ["E瓦", "F瓦", "卡纸"],
    layers: ["单层（3层微瓦）", "卡纸"],
    comparisonParams: { protection:5, stackability:2, printability:5, assemblyEase:1, storageEfficiency:3, costEfficiency:1, automation:1, sustainability:2, customization:5 }
  },

  // ─── 35: SBH ─ FEFCO 0503 ──────────────────────────────
  {
    id: "sbh",
    code: "SBH",
    fefcoCode: "0503",
    nameEn: "Slide Box with Hinged Cover",
    nameCn: "带铰链盖滑入式纸箱",
    popularity: 4,
    structure: "滑入式纸箱的变体，外管套顶部带有铰链连接的翻盖。",
    applications: ["珠宝首饰盒", "手表包装盒", "高档礼品", "收藏品包装"],
    pros: ["铰链盖可反复开合", "整体保护性好", "高端品牌形象"],
    cons: ["成本最高", "工艺复杂", "仅适合小批量高价值商品"],
    costLevel: 5,
    equipment: ["模切机", "自动糊盒机", "印刷机（特种印刷）"],
    fluteTypes: ["E瓦", "F瓦", "G瓦", "卡纸"],
    layers: ["卡纸", "微瓦"],
    comparisonParams: { protection:4, stackability:2, printability:5, assemblyEase:1, storageEfficiency:3, costEfficiency:1, automation:1, sustainability:2, customization:5 }
  },

  // ─── 36: DRAWER ─ FEFCO 0511 ───────────────────────────
  {
    id: "drawer",
    code: "DRAWER",
    fefcoCode: "0511",
    nameEn: "Slide Box (Drawer Style)",
    nameCn: "抽屉式纸箱",
    popularity: 8,
    structure: "典型的抽屉式设计，内盒像抽屉一样从外盒中抽出，开口方向通常为长边侧面。",
    applications: ["巧克力礼盒", "茶叶礼盒", "化妆品套装", "高档文具套装"],
    pros: ["抽屉式开合体验独特", "适合多层内容物陈列", "品牌展示效果极佳"],
    cons: ["工艺复杂成本高", "组装耗时长", "不适合运输包装"],
    costLevel: 5,
    equipment: ["模切机", "自动糊盒机", "印刷机（高精度）", "烫金/UV等后道工艺"],
    fluteTypes: ["E瓦", "F瓦", "卡纸"],
    layers: ["卡纸", "微瓦"],
    comparisonParams: { protection:4, stackability:2, printability:5, assemblyEase:1, storageEfficiency:3, costEfficiency:1, automation:1, sustainability:2, customization:5 }
  },

  // ─── 37: RB ─ FEFCO 0601 ───────────────────────────────
  {
    id: "rb",
    code: "RB",
    fefcoCode: "0601",
    nameEn: "Rigid Box (Two-Piece)",
    nameCn: "两片式刚性纸箱",
    popularity: 6,
    structure: "由独立的外盒和内盒组成，通常使用厚纸板（灰板纸）裱糊成型，不属于瓦楞纸箱范畴。",
    applications: ["奢侈品包装（包包/鞋子）", "高档茶叶/红酒礼盒", "手机/平板包装", "珠宝首饰盒"],
    pros: ["质感高级，品牌形象极佳", "坚固耐用可长期保存", "可做复杂表面处理（烫金/植绒）"],
    cons: ["不属于瓦楞纸箱，纸箱机械不适用", "手工组装为主，产量低", "成本极高，运输体积大"],
    costLevel: 5,
    equipment: ["灰板纸切割机", "裱纸机", "模切机", "手工组装线"],
    fluteTypes: ["灰板纸", "无瓦楞"],
    layers: ["灰板纸+铜版纸裱糊"],
    comparisonParams: { protection:5, stackability:2, printability:5, assemblyEase:1, storageEfficiency:2, costEfficiency:1, automation:1, sustainability:1, customization:5 }
  },

  // ─── 38: RBH ─ FEFCO 0602 ──────────────────────────────
  {
    id: "rbh",
    code: "RBH",
    fefcoCode: "0602",
    nameEn: "Rigid Box with Hinged Cover",
    nameCn: "铰链盖刚性纸箱",
    popularity: 4,
    structure: "两片式刚性纸箱的变体，盖子通过布料/纸带铰链连接在盒体上。",
    applications: ["礼品套装盒", "高档文具盒", "医疗器械包装", "珍藏版产品包装"],
    pros: ["铰链连接不会丢失盖子", "开合体验高级", "适合珍藏/收藏"],
    cons: ["铰链连接增加工艺难度", "成本极高", "不适合大批量生产"],
    costLevel: 5,
    equipment: ["灰板纸切割机", "裱纸机", "手工组装线"],
    fluteTypes: ["灰板纸", "无瓦楞"],
    layers: ["灰板纸+铜版纸裱糊"],
    comparisonParams: { protection:5, stackability:2, printability:5, assemblyEase:1, storageEfficiency:2, costEfficiency:1, automation:1, sustainability:1, customization:5 }
  },

  // ─── 39: PART-01 ─ FEFCO 0701 ──────────────────────────
  {
    id: "part_01",
    code: "PART-01",
    fefcoCode: "0701",
    nameEn: "Partition (Cross Type)",
    nameCn: "十字隔板",
    popularity: 15,
    structure: "由两片交叉的瓦楞纸板组成的十字形分隔内衬，放入纸箱内将空间分为四格。",
    applications: ["瓶装饮料分隔（4瓶装）", "玻璃器皿分隔", "易碎品内衬", "电子产品缓冲分隔"],
    pros: ["结构简单，生产成本低", "有效防止物品碰撞", "可配合各类纸箱使用"],
    cons: ["仅固定四格，灵活性有限", "分隔数量不可调", "需要纸箱配合使用"],
    costLevel: 1,
    equipment: ["瓦楞纸板生产线", "分切机", "自动插隔板机"],
    fluteTypes: ["B瓦", "C瓦", "E瓦"],
    layers: ["单层（3层）"],
    comparisonParams: { protection:4, stackability:2, printability:1, assemblyEase:5, storageEfficiency:5, costEfficiency:5, automation:5, sustainability:5, customization:2 }
  },

  // ─── 40: PAD ─ FEFCO 0709 ──────────────────────────────
  {
    id: "pad",
    code: "PAD",
    fefcoCode: "0709",
    nameEn: "Pad (Plain)",
    nameCn: "平板垫片",
    popularity: 25,
    structure: "最简单的瓦楞纸板附件，平整的矩形纸板片，用于纸箱内的分层、衬底或缓冲。",
    applications: ["纸箱分层分隔", "底部/顶部衬垫", "产品缓冲保护", "堆叠层间隔离"],
    pros: ["生产极其简单，成本最低", "用途广泛，灵活性高", "可裁切为任意尺寸"],
    cons: ["无结构强度", "保护性有限", "仅作为辅助配件使用"],
    costLevel: 1,
    equipment: ["瓦楞纸板生产线", "分切机"],
    fluteTypes: ["A瓦", "B瓦", "C瓦", "E瓦", "BC瓦", "AB瓦"],
    layers: ["单层（3层）", "双层（5层）"],
    comparisonParams: { protection:2, stackability:1, printability:1, assemblyEase:5, storageEfficiency:5, costEfficiency:5, automation:5, sustainability:5, customization:1 }
  }
];
