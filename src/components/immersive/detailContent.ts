import type {
  ImmersiveDestination,
  ImmersiveNote,
  ImmersiveRoute,
} from "@/lib/immersive/types";

/**
 * 沉浸式详情页统一数据结构。
 * 目的地 / 路线 / 手记 / 住宿 / 时刻 / 画廊 / 徽章都复用这一套，
 * 保证每张卡片点开后都有一致的全屏阅读体验。
 */
export type DetailBlock = {
  heading: string;
  body: string;
  points?: string[];
};

export type DetailData = {
  id: string;
  kind: "destination" | "route" | "note" | "stay" | "moment" | "gallery" | "badge";
  kicker: string;
  title: string;
  subtitle: string;
  image: string;
  gallery?: string[];
  meta?: { label: string; value: string }[];
  tags?: string[];
  intro: string;
  blocks: DetailBlock[];
  quote?: { text: string; by: string };
  relatedIds?: string[];
};

/* ------------------------------------------------------------------ */
/* 目的地：每条路线都写足「看什么 / 怎么走 / 什么时候来」三层信息      */
/* ------------------------------------------------------------------ */

type DestinationCopy = {
  intro: string;
  blocks: DetailBlock[];
  quote: { text: string; by: string };
  bestTime: string;
  walk: string;
};

const destinationCopy: Record<string, DestinationCopy> = {
  palace: {
    intro:
      "故宫不是一座只能仰望的博物馆。它更像一座被时间慢慢填满的城：清晨的光从东华门斜进来，午后的风穿过太和殿广场，闭馆前的半小时，红墙会把一天的暖意慢慢吐出来。",
    bestTime: "开馆后第一小时 / 闭馆前四十分钟",
    walk: "午门 → 太和门 → 三大殿 → 乾清宫 → 御花园 → 神武门",
    blocks: [
      {
        heading: "先看清中轴，再去看细节",
        body: "故宫的秩序感来自那条看不见的中轴线。站在午门城楼上往北望，太和殿、中和殿、保和殿依次排开，所有重要的建筑都压在线上。理解这一点之后，再转去看东西六宫，才不会只觉得房间很多。",
        points: ["太和殿广场是全院最开阔的地方，适合先建立方向感", "东西六宫更像生活区，尺度小、院落深，适合慢慢绕", "御花园的堆秀山是视线终点，也是最容易拍到红墙与蓝天的地方"],
      },
      {
        heading: "把讲解关掉一段",
        body: "顺着人流听完所有讲解，往往会错过建筑本身的声音。试着在某一个院落里停五分钟：看屋脊上的走兽、看砖缝里长出来的草、看阳光怎样一寸寸挪过台阶。这些细节比年代数字更容易被记住。",
      },
      {
        heading: "四季各有各的颜色",
        body: "春天的御花园有花，夏天的广场有强烈的阴影，秋天银杏把角楼染成金色，冬天雪后的故宫最接近水墨。若只能选一次，初秋的下午最稳妥——光线柔和，游客也比假日少一些。",
      },
    ],
    quote: { text: "砖是暖的。走过六百年，它还记得每一步的分量。", by: "拾程编辑部" },
  },
  summer: {
    intro:
      "颐和园把山水、长廊和宫殿放进了一幅可以走进去的画里。昆明湖占了全园四分之三，风从湖面过来时，夏天也会变得慢一点。",
    bestTime: "清晨六点半 / 日落前一小时",
    walk: "东宫门 → 长廊 → 佛香阁 → 十七孔桥 → 昆明湖西堤",
    blocks: [
      {
        heading: "先走长廊，再抬头看佛香阁",
        body: "长廊有七百多米，梁枋上的彩绘一幅接一幅。不要急着数完，走到一半回头，佛香阁会自己站到正中间——这是造园者留给游客的一个小小的惊喜。",
        points: ["长廊适合慢走，平均一米一幅画", "佛香阁是登高看昆明湖全景的最佳位置", "十七孔桥在冬至前后会出现「金光穿洞」"],
      },
      {
        heading: "湖边比景点更重要",
        body: "很多人只盯着几个标志性建筑，其实最舒服的时间是沿西堤走。那里游客少，柳枝垂到水面，能看见远处的玉泉山。带一瓶水，坐半小时，行程就圆满了。",
      },
      {
        heading: "给划船留一点时间",
        body: "如果天气好，可以从十七孔桥附近租一条船到湖心。换一个角度看万寿山，会发现刚才走过的长廊只是山脚下一道细细的线。",
      },
    ],
    quote: { text: "十七孔桥走到一半再回头，风景就会自己站正。", by: "旅行者手记" },
  },
  wall: {
    intro:
      "慕田峪的好，在于它保留了长城本来的起伏。城墙沿着山脊一起一伏，敌楼藏在雾里，走一段就喘一次，但每次喘完看到的景色都不一样。",
    bestTime: "日出前四十分钟抵达",
    walk: "北门 → 缆车上行 → 14 号敌楼 → 20 号敌楼 → 滑道下山",
    blocks: [
      {
        heading: "为什么选慕田峪",
        body: "八达岭更热闹，慕田峪更安静。这里的城墙有 16 座敌楼，植被覆盖率高，晴天能看见远处连绵的山。最重要的是，人流被分散在好几段城墙上，拍照不必等。",
        points: ["北线景色更开阔，南线更安静", "清晨常有云雾，敌楼会一节节从雾里露出来", "穿防滑鞋，城墙的台阶比看起来陡"],
      },
      {
        heading: "日出值得早起",
        body: "太阳升起前十分钟，山脊是深蓝色的；第一缕光先照到最高的敌楼，然后一路往下淌。这个过程只有十几分钟，但足够记住很久。",
      },
      {
        heading: "下山之后什么都别做",
        body: "缆车或滑道下山后，在山脚的馆子里坐一会儿，把腿坐热。旅行不一定要安排满，最强的记忆往往来自这段空白。",
      },
    ],
    quote: { text: "雾先把敌楼藏起来，再一节一节还给你。", by: "长城日出 · 手记" },
  },
  heaven: {
    intro:
      "天坛是用圆形和蓝色写成的建筑。祈年殿的三重檐顶在清晨最安静，回音壁前的低语、圜丘上的回声，都提醒你这里原本是人与天对话的地方。",
    bestTime: "开园后的第一小时",
    walk: "东门 → 七十二长廊 → 祈年殿 → 皇穹宇 → 回音壁 → 圜丘",
    blocks: [
      {
        heading: "先看祈年殿，再看圜丘",
        body: "祈年殿是天坛的标志，蓝色琉璃瓦在晴天几乎不像滤镜。但真正有趣的是圜丘：站在中心喊一声，声音会从四面八方回来，那是古代声学建筑的巧思。",
        points: ["祈年殿的柱子数量对应一年的月份与时辰", "回音壁需要两个人各站一端低声说话", "清晨的松柏林里有晨练的老人，很有生活气"],
      },
      {
        heading: "留出散步的时间",
        body: "天坛的林地很大，柏树高而直。从祈年殿走到圜丘有一段不短的路，正是这段路让建筑的出现变得有仪式感。别急着坐观光车。",
      },
    ],
    quote: { text: "先绕圜丘走一圈，再决定要不要喊那一声。", by: "拾程编辑部" },
  },
  hutong: {
    intro:
      "烟袋斜街很短，几百米就走到头。但它的价值不在长度，而在于把后海的水面、胡同的烟火和夜晚的灯串成了一条可以慢慢走的线。",
    bestTime: "傍晚到入夜",
    walk: "鼓楼 → 烟袋斜街 → 银锭桥 → 后海北沿 → 什刹海",
    blocks: [
      {
        heading: "银锭桥上看后海",
        body: "站在银锭桥上，西边是水面，东边是胡同。太阳落下去的时候，灯一盏盏亮起，水面把光揉碎。这是北京最不费力的一处夜景。",
        points: ["傍晚六点左右光线最好", "别站在桥中央不动，往北走一小段更安静", "找一家不靠门口的馆子坐下，别看表"],
      },
      {
        heading: "拐进旁边的胡同",
        body: "主街热闹，但真正的生活在两侧的窄巷里。门墩、砖雕、晾在院子里的衣服，这些细节比纪念品更值得停下来看。",
      },
    ],
    quote: { text: "坐在不靠门口的位置，把一个下午交给风。", by: "胡同夜饭 · 手记" },
  },
  tiananmen: {
    intro:
      "天安门广场的尺度，只有站在中央才能体会。城楼、纪念碑、人民大会堂与国家博物馆沿广场排开，北京的方向感在这里变得具体。",
    bestTime: "清晨升旗前后 / 日落前一小时",
    walk: "前门 → 广场 → 人民英雄纪念碑 → 城楼外观 → 国家博物馆",
    blocks: [
      { heading: "先看中轴，再看人群", body: "广场最重要的不是某一栋建筑，而是它们之间那条看不见的线。站在纪念碑北侧向南望，前门与城楼会依次落在视线上。", points: ["清晨人少，适合拍建筑全貌", "广场很大，穿一双好走的鞋", "遵守现场预约与安检安排"] },
      { heading: "建筑各有性格", body: "人民大会堂的柱廊庄重，国家博物馆的横向体量克制。把两者放在一起看，会更容易理解现代北京的城市语言。" },
      { heading: "留一段空白", body: "不必把广场周边所有点都打完。找一处台阶坐下，看人流与灯光慢慢变化，也是旅行的一部分。" },
    ],
    quote: { text: "站在广场中央，城市的方向感第一次变得具体。", by: "拾程编辑部" },
  },
  'great-hall': {
    intro:
      "人民大会堂的秩序感来自重复的柱廊与沉稳的体量。白天看结构，夜晚看灯光，同一栋建筑会呈现两种完全不同的性格。",
    bestTime: "傍晚到入夜",
    walk: "广场西侧 → 柱廊外观 → 台阶视角 → 夜间回望",
    blocks: [
      { heading: "柱廊是最鲜明的记忆", body: "成排的立柱把建筑的庄重感直接推到眼前。站在台阶下往上看，体量比照片更有压迫感，也因此更容易记住。", points: ["傍晚侧光适合拍柱廊", "夜间灯光亮起后适合拍全景", "外观参观以现场开放安排为准"] },
      { heading: "换一个角度", body: "从广场东侧回望，大会堂与国家博物馆正好形成一组对话：一个向内凝聚，一个向外展开。" },
    ],
    quote: { text: "灯亮起来之后，建筑的秩序被重新描了一遍。", by: "拾程建筑笔记" },
  },
  'national-museum': {
    intro:
      "中国国家博物馆的展线很长，从古代中国一路铺到当代。它适合用半天慢慢看，也适合只挑几个真正想看的展厅。",
    bestTime: "开馆后第一小时",
    walk: "西门入场 → 古代中国 → 专题展厅 → 复兴之路 → 广场侧外观",
    blocks: [
      { heading: "不要试图全部看完", body: "先选一条主线：青铜器、陶瓷、书画或近现代史。把注意力集中在一条线上，记忆会更清楚。", points: ["提前预约，带身份证件", "展厅很大，控制参观节奏", "重点展厅优先，剩余留给偶遇"] },
      { heading: "建筑本身也值得看", body: "横向展开的立面与广场尺度相呼应。出来之后在台阶上回望，会更容易理解它与天安门广场的关系。" },
    ],
    quote: { text: "把一个下午交给上下五千年，反而觉得时间不够用。", by: "拾程编辑部" },
  },
  ditan: {
    intro:
      "地坛比天坛安静得多。方泽坛的石阶、古柏的树影与红色的墙面，让这里更像一处可以慢下来的城市林地。",
    bestTime: "清晨或午后",
    walk: "南门 → 方泽坛 → 古树区 → 城墙遗址 → 书屋",
    blocks: [
      { heading: "先去方泽坛", body: "方泽坛是地坛的核心。站在层层石台上，会发现这里的轴线感不靠高度，而靠水平的铺展。", points: ["清晨光线穿过古柏很好看", "园区大，适合慢走一圈", "安静区域请放低声音"] },
      { heading: "读一段《我与地坛》", body: "带一本书，在树荫下坐二十分钟。地坛的气质，比景点本身更需要慢慢体会。" },
    ],
    quote: { text: "有些地方，不赶路才能看见。", by: "拾程编辑部" },
  },
  yuanmingyuan: {
    intro:
      "圆明园同时保存着园林的轻盈与遗址的沉重。福海的水面依旧开阔，西洋楼的石柱则把时间的另一面留在原地。",
    bestTime: "上午或秋日午后",
    walk: "南门 → 西洋楼遗址 → 福海 → 蓬莱瑶台 → 园区湖岸",
    blocks: [
      { heading: "先看遗址，再看风景", body: "西洋楼遗址的石柱是圆明园最直接的记忆点。看过之后再去湖边，风景会多出一层含义。", points: ["遗址区适合慢慢走，注意台阶", "福海湖面开阔，适合傍晚", "园区很大，选一条主线即可"] },
      { heading: "不要只拍石柱", body: "圆明园的植物与水系很丰富。把镜头从遗址移开，会看到一座仍在生长的园林。" },
    ],
    quote: { text: "遗址让人停住，湖水让人继续往前走。", by: "拾程编辑部" },
  },
  shichahai: {
    intro:
      "什刹海把水面、胡同与灯火放在一起。傍晚从银锭桥往北走，鼓楼的轮廓落进水里，北京就从景点变回了生活。",
    bestTime: "日落前后一小时",
    walk: "鼓楼 → 烟袋斜街 → 银锭桥 → 后海北沿 → 什刹海",
    blocks: [
      { heading: "银锭桥上看水", body: "站在桥上，西边是水面，东边是胡同。灯一盏盏亮起时，水会把光揉碎，这是北京最不费力的夜景。", points: ["傍晚六点左右光线最好", "往北走一小段更安静", "找一家不靠门口的馆子坐下"] },
      { heading: "拐进旁边的胡同", body: "主街热闹，真正的生活在两侧的窄巷里。门墩、砖雕、晾在院子里的衣服，比纪念品更值得停下来看。" },
    ],
    quote: { text: "坐在不靠门口的位置，把一个傍晚交给水面的光。", by: "拾程手记" },
  },
  nanluoguxiang: {
    intro:
      "南锣鼓巷的格局像一根鱼骨，主街两侧排开整齐的胡同。它热闹，但只要拐进窄巷，老城的日常尺度会立刻回来。",
    bestTime: "上午或傍晚",
    walk: "南锣鼓巷主街 → 雨儿胡同 → 帽儿胡同 → 鼓楼东大街",
    blocks: [
      { heading: "主街之外才是重点", body: "主街适合感受人气，真正耐看的是两侧支巷。门楼、砖雕和院里的树，会把商业气息慢慢推远。", points: ["从主街拐进雨儿胡同", "帽儿胡同更安静", "避开周末下午的人流高峰"] },
      { heading: "把脚步放慢", body: "这里的乐趣不在打卡，而在走。走二十分钟，再找一家小店坐下来，胡同的节奏才会真正出现。" },
    ],
    quote: { text: "拐进一条窄巷，北京就从景点变回了生活。", by: "拾程编辑部" },
  },
};

const destinationGalleries: Record<string, string[]> = {
  palace: ["/photos/palace.jpg", "/photos/forbidden-hall.jpg", "/photos/beijing-atlas.jpg"],
  tiananmen: ["/photos/tiananmen.jpg", "/photos/great-hall.jpg", "/photos/national-museum.jpg"],
  'great-hall': ["/photos/great-hall.jpg", "/photos/tiananmen.jpg", "/photos/night.jpg"],
  'national-museum': ["/photos/national-museum.jpg", "/photos/tiananmen.jpg", "/photos/great-hall.jpg"],
  heaven: ["/photos/heaven.jpg", "/photos/ditan.jpg", "/photos/beijing-atlas.jpg"],
  ditan: ["/photos/ditan.jpg", "/photos/heaven.jpg", "/photos/beijing-atlas.jpg"],
  summer: ["/photos/summer.jpg", "/photos/yuanmingyuan.jpg", "/photos/beijing-atlas.jpg"],
  yuanmingyuan: ["/photos/yuanmingyuan.jpg", "/photos/summer.jpg", "/photos/beijing-atlas.jpg"],
  shichahai: ["/photos/shichahai.jpg", "/photos/nanluoguxiang.jpg", "/photos/night.jpg"],
  nanluoguxiang: ["/photos/nanluoguxiang.jpg", "/photos/shichahai.jpg", "/photos/nanluoguxiang.jpg"],
};

export function buildDestinationDetail(destination: ImmersiveDestination): DetailData {
  const copy = destinationCopy[destination.id] ?? {
    intro: destination.description,
    bestTime: "全天开放",
    walk: "按自己的节奏慢行",
    quote: { text: destination.tagline, by: "拾程编辑部" },
    blocks: [
      { heading: "慢慢走，别赶路", body: destination.description },
      { heading: "把时间留给细节", body: "不必把每个点都走完。选择一两处喜欢的地方坐下来，旅行才会真正留下。" },
    ],
  };
  return {
    id: `dest-${destination.id}`,
    kind: "destination",
    kicker: `DESTINATION / ${destination.city}`,
    title: destination.name,
    subtitle: destination.tagline,
    image: destination.image,
    gallery: destinationGalleries[destination.id] ?? [destination.image, "/photos/beijing-atlas.jpg", "/photos/night.jpg"],
    meta: [
      { label: "评分", value: `${destination.rating.toFixed(1)} / 5.0` },
      { label: "开放", value: destination.hours || "全天开放" },
      { label: "最佳时刻", value: copy.bestTime },
      { label: "建议路线", value: copy.walk },
    ],
    tags: destination.tags,
    intro: copy.intro,
    blocks: copy.blocks,
    quote: copy.quote,
    relatedIds: ["stay-courtyard", "moment-dawn", "route-axis"],
  };
}

/* ------------------------------------------------------------------ */
/* 路线                                                                */
/* ------------------------------------------------------------------ */

const routeCopy: Record<string, { intro: string; blocks: DetailBlock[]; quote: string }> = {
  axis: {
    intro: "从中午到傍晚，沿着北京最古老的一条线走完。这条路线不追求景点数量，只追求方向的确定感。",
    blocks: [
      { heading: "上午 · 午门到三大殿", body: "开馆就进去，先看太和殿广场的空旷，再看两侧殿宇的秩序。广场上风大，记得戴帽子。", points: ["午门入场", "太和门广场", "三大殿", "乾清宫"] },
      { heading: "下午 · 景山回望", body: "从神武门出来过马路就是景山。登到万春亭，整条中轴线会完整地铺在眼前，这是理解北京最好的一个视角。", points: ["神武门", "景山万春亭", "俯瞰故宫全景"] },
      { heading: "晚上 · 王府井收尾", body: "走了一天，找一家馆子坐下。把当天看到的方向在心里重新走一遍，路线就真正变成了自己的。", points: ["晚餐", "散步", "记录今天的一张照片"] },
    ],
    quote: "不赶路，也能把一天走得很长。",
  },
  square: {
    intro: "从城楼到大会堂，这条路线把北京最庄严的一组建筑放在同一个下午。重点不是数量，而是看清它们之间的关系。",
    blocks: [
      { heading: "第一站 · 天安门城楼", body: "先在广场南侧建立方向感，再抬头看城楼的重檐与红灯。清晨光线柔和，适合拍建筑全貌。" },
      { heading: "第二站 · 人民大会堂", body: "沿广场西侧走到大会堂。成排的立柱是最鲜明的记忆点，傍晚侧光会把柱廊的层次拉得很清楚。" },
      { heading: "第三站 · 广场夜色", body: "日落后灯亮起，建筑轮廓被重新描一遍。站在广场中央回望，理解这座城市的尺度。" },
    ],
    quote: "建筑之间的距离，也是风景的一部分。",
  },
  museum: {
    intro: "把半天交给中国国家博物馆。展线很长，选一条主线慢慢看，比全部扫一遍更容易留下记忆。",
    blocks: [
      { heading: "先选一条主线", body: "青铜器、陶瓷、书画或近现代史，先选一个方向。把注意力集中在一条线上，细节才会浮现。" },
      { heading: "留一小时给专题展", body: "常设展之后，挑一个临时展览补上。它往往能提供区别于教科书的观察角度。" },
      { heading: "出来看一眼广场", body: "博物馆与天安门广场彼此呼应。站在台阶上回望，建筑与城市的关系会更清楚。" },
    ],
    quote: "看展不必贪多，带走一件真正记住的文物就够。",
  },
  ritual: {
    intro: "天坛与地坛，一南一北，是北京最值得清晨出发的一组坛庙。它们气质不同，却共同定义了城市的秩序感。",
    blocks: [
      { heading: "上午 · 天坛", body: "从东门进，先走七十二长廊到祈年殿，再去皇穹宇与圜丘。清晨的柏树林最有生活气。" },
      { heading: "午后 · 地坛", body: "转场地坛，先看方泽坛，再沿古树区慢走。相比天坛，这里更安静，适合留白。" },
      { heading: "把两座坛放在一起记", body: "一个强调蓝天与圆形，一个强调古柏与水平铺展。看过两者，北京坛庙的性格就完整了。" },
    ],
    quote: "同一座城，可以有两种安静。",
  },
  gardens: {
    intro: "颐和园与圆明园相距不远，却呈现皇家园林的两种命运：一处仍完整，一处留下遗址。",
    blocks: [
      { heading: "上午 · 颐和园", body: "从东宫门进，沿长廊走，回头看佛香阁，再到十七孔桥。湖面会把天空摊平。" },
      { heading: "下午 · 圆明园", body: "先看西洋楼遗址的石柱，再去福海湖岸。遗址与风景放在一起，情绪会更完整。" },
      { heading: "傍晚留白", body: "两座园区都很大，不要试图走完。坐在湖边二十分钟，比多打两个卡更值得。" },
    ],
    quote: "一处看见秩序，一处看见时间。",
  },
  lanes: {
    intro: "什刹海与南锣鼓巷，把水面和胡同接在一起。这一晚不安排景点，只安排走路与坐下。",
    blocks: [
      { heading: "鼓楼出发", body: "傍晚从鼓楼出发，沿烟袋斜街往北，看灯笼怎样一盏盏亮起来。" },
      { heading: "银锭桥看水", body: "在银锭桥上站五分钟，看后海的水面把光揉碎，这是北京最不费力的夜景。" },
      { heading: "拐进南锣鼓巷", body: "主街热闹，两侧的窄巷才藏着日常。走累了找一家馆子坐下，别再看表。" },
    ],
    quote: "灯笼亮起来，北京就慢下来了。",
  },
};

export function buildRouteDetail(
  route: ImmersiveRoute,
  destinations: ImmersiveDestination[],
): DetailData {
  const copy = routeCopy[route.id] ?? {
    intro: route.subtitle,
    blocks: [{ heading: "按自己的节奏走", body: "把经典景点串成一段舒服的旅程，留一点空白给途中偶然发生的事。" }],
    quote: "不赶路，也能走很远。",
  };
  const destination = destinations.find((item) => item.id === route.destinationId);
  return {
    id: `route-${route.id}`,
    kind: "route",
    kicker: `CURATED ROUTE / ${route.duration}`,
    title: route.title,
    subtitle: route.subtitle,
    image: route.image,
    gallery: [route.image, destinationGalleries[route.destinationId]?.[1] ?? "/photos/beijing-atlas.jpg", "/photos/night.jpg"],
    meta: [
      { label: "时长", value: route.duration },
      { label: "核心目的地", value: destination?.name ?? "北京" },
      { label: "节奏", value: "从容 · 留白" },
    ],
    tags: ["城市漫游", "主题路线", "适合独行"],
    intro: copy.intro,
    blocks: copy.blocks,
    quote: { text: copy.quote, by: "拾程路线编辑" },
    relatedIds: [`dest-${route.destinationId}`, route.id === "lanes" ? "moment-dusk" : "moment-noon", "stay-courtyard"],
  };
}

/* ------------------------------------------------------------------ */
/* 手记                                                                */
/* ------------------------------------------------------------------ */

const noteCopy: Record<string, DetailBlock[]> = {
  n1: [
    { heading: "不看导航的一天", body: "从午门进，顺着人流往北。砖缝里的草比讲解牌诚实，它告诉我这条路被走过多少遍。" },
    { heading: "秋天的颜色", body: "御花园的银杏黄得很慢。坐在角落看半小时，光从一片叶子挪到另一片叶子，时间就变得具体了。" },
    { heading: "走完之后", body: "出神武门的时候腿很酸，但心里很清楚：这一天没有浪费。" },
  ],
  n2: [
    { heading: "雨儿胡同的早晨", body: "石榴叶子先亮，然后是鸟叫，最后才是人的声音。四合院的早晨有一套自己的顺序。" },
    { heading: "房间不多，刚好", body: "住的地方只有几间房，院子里的水缸养着两条鱼。早上坐在门槛上，什么都不做也很舒服。" },
  ],
  n3: [
    { heading: "银锭桥上的风", body: "风比酒重要。水面把灯揉碎，车流声被隔在胡同外，只剩脚下轻轻的水声。" },
    { heading: "十分钟够了", body: "再久就会开始想工作。城市旅行需要一点距离，十分钟刚好。" },
  ],
  n4: [
    { heading: "只去故宫", body: "周末什么都不安排，只从午门走到神武门。御花园的角落里，银杏叶慢慢把光挪走。" },
    { heading: "这就是整个周末", body: "没有别的安排，也不需要。空白本身也是一种收获。" },
  ],
};

export function buildNoteDetail(note: ImmersiveNote): DetailData {
  return {
    id: `note-${note.id}`,
    kind: "note",
    kicker: `TRAVEL NOTE / ${note.category}`,
    title: note.title,
    subtitle: `${note.author} · ${formatShortDate(note.createdAt)}`,
    image: note.image,
    gallery: [note.image, "/photos/shichahai.jpg", "/photos/night.jpg"],
    meta: [
      { label: "作者", value: note.author },
      { label: "分类", value: note.category },
      { label: "喜欢", value: `${note.likes.toLocaleString("zh-CN")} 人` },
    ],
    tags: [note.category, "真实手记", "拾程社区"],
    intro: note.body,
    blocks: noteCopy[note.id] ?? [
      { heading: "写下这一刻", body: note.body },
      { heading: "留给下一次出发", body: "把沿途的微光记下来，下一次出发就有据可循。" },
    ],
    quote: { text: "把故事带回来，旅程才算真正完成。", by: "拾程" },
    relatedIds: ["moment-dusk", "dest-shichahai", "dest-palace"],
  };
}

function formatShortDate(value: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "最近";
  return `${date.getMonth() + 1}月${date.getDate()}日`;
}

/* ------------------------------------------------------------------ */
/* 住宿 · 时刻 · 画廊 · 徽章：给新增卡片提供完整子页面内容              */
/* ------------------------------------------------------------------ */

export const stayDetails: DetailData[] = [
  {
    id: "stay-courtyard",
    kind: "stay",
    kicker: "STAY / COURTYARD",
    title: "雨儿胡同四合院",
    subtitle: "在老城的院子里醒来",
    image: "/photos/hotel.jpg",
    gallery: ["/photos/hotel.jpg", "/photos/room.jpg", "/photos/nanluoguxiang.jpg"],
    meta: [
      { label: "位置", value: "东城区 · 雨儿胡同" },
      { label: "房型", value: "院景双床 / 独卫" },
      { label: "适合", value: "两人 · 两晚" },
    ],
    tags: ["四合院", "胡同", "清晨鸟鸣"],
    intro: "院子不大，石榴树占了一角。早上先亮的是叶子，然后是鸟叫，最后才是巷子里推车经过的声音。住在这里，闹钟基本用不上。",
    blocks: [
      { heading: "房间不多，刚好", body: "只有几间房围着一个院子，晚上回来时院门轻轻一推，很容易生出「到家了」的感觉。" },
      { heading: "出门就是胡同", body: "步行几分钟到南锣鼓巷，往北是鼓楼。不需要打车，整座老城都在腿边。", points: ["步行 5 分钟到烟袋斜街", "步行 12 分钟到鼓楼", "附近有多家早点铺"] },
      { heading: "住两晚最合适", body: "第一晚熟悉路况，第二晚才能真正放松。把第二天留白，行程就不再是赶场。" },
    ],
    quote: { text: "房间不多，刚好。石榴叶子先亮，鸟叫第二。", by: "周予 · 手记" },
    relatedIds: ["dest-nanluoguxiang", "route-lanes", "moment-dawn"],
  },
  {
    id: "stay-hutong",
    kind: "stay",
    kicker: "STAY / LANE HOUSE",
    title: "什刹海胡同小栈",
    subtitle: "把后海的灯留在窗边",
    image: "/photos/room.jpg",
    gallery: ["/photos/room.jpg", "/photos/nanluoguxiang.jpg", "/photos/night.jpg"],
    meta: [
      { label: "位置", value: "西城区 · 后海北沿" },
      { label: "房型", value: "临街大床 / 露台" },
      { label: "适合", value: "情侣 · 夜游" },
    ],
    tags: ["胡同", "夜景", "露台"],
    intro: "从银锭桥往北走几分钟就到。夜里把窗推开，能听见水面上的风，也能看见灯笼在巷口晃。",
    blocks: [
      { heading: "露台是灵魂", body: "天气好的时候在露台坐十分钟，后海的灯光会顺着水面的方向铺开。" },
      { heading: "白天出去走", body: "这一带最适合步行。早上看胡同醒来，晚上看灯亮起，中间留给自己发呆。" },
    ],
    quote: { text: "把窗推开，整条胡同都在呼吸。", by: "拾程住宿编辑" },
    relatedIds: ["dest-nanluoguxiang", "moment-dusk", "route-lanes"],
  },
  {
    id: "stay-skyline",
    kind: "stay",
    kicker: "STAY / CITY VIEW",
    title: "国贸云端旅舍",
    subtitle: "在灯河上方睡一晚",
    image: "/photos/night.jpg",
    gallery: ["/photos/night.jpg", "/photos/great-hall.jpg", "/photos/beijing-atlas.jpg"],
    meta: [
      { label: "位置", value: "朝阳区 · 国贸" },
      { label: "房型", value: "高层城景 / 行政" },
      { label: "适合", value: "商务 · 城市旅行" },
    ],
    tags: ["天际线", "夜景", "高层"],
    intro: "房间在三十层以上，晚上不用出门就能看到整条灯河。玻璃擦得很干净，城市像一张缓慢流动的地图。",
    blocks: [
      { heading: "蓝调时刻", body: "日落后二十分钟，天空还留着一点蓝，灯光已经全开。这段时间只有十几分钟，别错过。" },
      { heading: "风比酒重要", body: "如果可以去天台，带件外套。站在高处十分钟，一天的喧嚣就散了。" },
    ],
    quote: { text: "不必进最贵的酒吧，风和高处就够。", by: "陈叙 · 手记" },
    relatedIds: ["dest-great-hall", "moment-night", "gallery-square"],
  },
];

export const momentDetails: DetailData[] = [
  {
    id: "moment-dawn",
    kind: "moment",
    kicker: "MOMENT / 06:00",
    title: "广场的第一束光",
    subtitle: "天安门醒来的方式",
    image: "/photos/tiananmen.jpg",
    gallery: ["/photos/tiananmen.jpg", "/photos/great-hall.jpg", "/photos/beijing-atlas.jpg"],
    meta: [{ label: "时刻", value: "日出前后四十分钟" }, { label: "关键词", value: "晨光 · 城楼 · 安静" }],
    tags: ["清晨", "天安门", "广场"],
    intro: "天还是深蓝色的时候，城楼的轮廓先亮起来。第一缕光落在红墙上，再慢慢移到广场的石板。",
    blocks: [
      { heading: "早起是有回报的", body: "清晨的广场属于愿意多走几步的人。人少，光线干净，建筑的比例也最容易看清。" },
      { heading: "给自己留一段沉默", body: "不要急着拍照。站在广场南侧先看五分钟，等光把城楼完全点亮，再按快门。" },
    ],
    quote: { text: "光先把城楼点亮，再把广场还给人。", by: "拾程手记" },
    relatedIds: ["dest-tiananmen", "route-square", "stay-courtyard"],
  },
  {
    id: "moment-noon",
    kind: "moment",
    kicker: "MOMENT / 12:00",
    title: "正午的宫墙",
    subtitle: "阴影最短，颜色最实",
    image: "/photos/palace.jpg",
    gallery: ["/photos/palace.jpg", "/photos/heaven.jpg", "/photos/summer.jpg"],
    meta: [{ label: "时刻", value: "十一点到十四点" }, { label: "关键词", value: "红墙 · 金瓦 · 强光" }],
    tags: ["正午", "故宫", "建筑"],
    intro: "正午的光把红墙压得很实，琉璃瓦亮到刺眼。这是最适合看建筑结构、也最需要找阴影的时刻。",
    blocks: [
      { heading: "看屋脊上的走兽", body: "光线最强的时候，屋檐的层次反而最清楚。抬头看那些小小的走兽，比低头看地图有趣。" },
      { heading: "躲进一条窄巷", body: "正午适合短暂停在阴影里。喝杯水，等最强的一段时间过去，再继续走。" },
    ],
    quote: { text: "砖缝里的草，比讲解牌诚实。", by: "沿中轴线走完一个秋天" },
    relatedIds: ["dest-palace", "route-axis", "gallery-atlas"],
  },
  {
    id: "moment-dusk",
    kind: "moment",
    kicker: "MOMENT / 18:00",
    title: "黄昏的胡同",
    subtitle: "灯笼一盏盏亮起来",
    image: "/photos/nanluoguxiang.jpg",
    gallery: ["/photos/nanluoguxiang.jpg", "/photos/summer.jpg", "/photos/night.jpg"],
    meta: [{ label: "时刻", value: "日落前后一小时" }, { label: "关键词", value: "灯火 · 归家 · 烟火" }],
    tags: ["黄昏", "胡同", "烟火"],
    intro: "太阳落下去，胡同里的灯一盏盏亮起。下班的人推车经过，饭馆开始上桌，城市从景点变回了生活。",
    blocks: [
      { heading: "银锭桥上站五分钟", body: "西边是水面，东边是胡同。这是北京最不费力的一处夜景，也是一天里最松弛的时刻。" },
      { heading: "坐下来，别看表", body: "找一家不靠门口的馆子，点一碗面。黄昏不适合赶路，适合停一会儿。" },
    ],
    quote: { text: "灯笼亮起来，北京就慢下来了。", by: "胡同夜饭 · 手记" },
    relatedIds: ["dest-nanluoguxiang", "route-lanes", "stay-hutong"],
  },
  {
    id: "moment-night",
    kind: "moment",
    kicker: "MOMENT / 22:00",
    title: "深夜的灯河",
    subtitle: "城市像一张缓慢流动的地图",
    image: "/photos/night.jpg",
    gallery: ["/photos/night.jpg", "/photos/great-hall.jpg", "/photos/beijing-atlas.jpg"],
    meta: [{ label: "时刻", value: "二十一点之后" }, { label: "关键词", value: "蓝调 · 车流 · 高处" }],
    tags: ["夜景", "天际线", "城市"],
    intro: "夜色把城市的轮廓重新描了一遍。车流是水，楼群是岸，站在高处十分钟，就能把一天的喧嚣吹散。",
    blocks: [
      { heading: "找一个免费的高处", body: "不必进最贵的酒吧。商场天台、过街天桥，只要视线打开，就足够看见那条光河。" },
      { heading: "十分钟就好", body: "再久会开始想工作。城市旅行需要一点距离，十分钟的安静比一整晚的应酬更有用。" },
    ],
    quote: { text: "风比酒重要。站十分钟，城市就安静了。", by: "陈叙 · 旅行手记" },
    relatedIds: ["dest-great-hall", "stay-skyline", "gallery-square"],
  },
];

export const galleryDetails: DetailData[] = [
  {
    id: "gallery-atlas",
    kind: "gallery",
    kicker: "GALLERY / CENTRAL AXIS",
    title: "从中轴线上空看北京",
    subtitle: "一条线，把六百年的秩序摊开",
    image: "/photos/beijing-atlas.jpg",
    gallery: ["/photos/beijing-atlas.jpg", "/photos/palace.jpg", "/photos/heaven.jpg"],
    meta: [{ label: "视角", value: "高空俯瞰" }, { label: "季节", value: "初秋黄昏" }],
    tags: ["中轴线", "鸟瞰", "城市肌理"],
    intro: "从高空看，红墙、灰瓦、蓝顶依次排开。中轴线像一根针，把散落的城市缝在一起。",
    blocks: [
      { heading: "秩序感从哪里来", body: "所有重要建筑都压在同一条南北向的线上。这种对称不是偶然，而是一座都城对秩序的表达。" },
      { heading: "线外的生活", body: "把视线从轴线移开，胡同的屋顶像水波一样铺开。宏大叙事与日常生活，其实只隔一条街。" },
    ],
    quote: { text: "城市的方向感，在这里一眼就能读懂。", by: "中轴鸟瞰 · 图注" },
    relatedIds: ["dest-palace", "moment-noon", "route-axis"],
  },
  {
    id: "gallery-square",
    kind: "gallery",
    kicker: "GALLERY / TIANANMEN SQUARE",
    title: "广场夜色",
    subtitle: "建筑、灯光与一座城市的秩序",
    image: "/photos/great-hall.jpg",
    gallery: ["/photos/great-hall.jpg", "/photos/tiananmen.jpg", "/photos/night.jpg"],
    meta: [{ label: "地点", value: "北京 · 天安门广场" }, { label: "时刻", value: "蓝调时分" }],
    tags: ["天安门", "人民大会堂", "夜色"],
    intro: "灯亮起来之后，城楼、大会堂与博物馆的轮廓被重新描了一遍。广场的秩序在夜里变得更清楚。",
    blocks: [
      { heading: "沿广场慢慢走", body: "从城楼西侧走到人民大会堂，建筑一栋接一栋。不要急着拍照，先看清它们的体量与距离。" },
      { heading: "对岸的光", body: "灯亮之后，整片广场变成一张发光的平面。这是城市旅行最容易被忽略的一层。" },
    ],
    quote: { text: "灯光把建筑的秩序重新描了一遍。", by: "拾程图库" },
    relatedIds: ["stay-skyline", "moment-night", "dest-great-hall"],
  },
];

export const badgeDetails: DetailData[] = [
  {
    id: "badge-walker",
    kind: "badge",
    kicker: "BADGE / 01",
    title: "城市漫游者",
    subtitle: "用脚步认识一座城",
    image: "/photos/nanluoguxiang.jpg",
    meta: [{ label: "获得方式", value: "完成 3 次章节探索" }, { label: "状态", value: "已解锁" }],
    tags: ["探索", "步行", "成就"],
    intro: "旅行不一定要有目的地。漫游者相信，最好的风景往往出现在没有计划的那条街上。",
    blocks: [
      { heading: "如何获得", body: "浏览首页、目的地与行程三个章节，即可解锁。它记录的是好奇心，而不是里程。" },
      { heading: "下一步", body: "试着关掉导航，在一个陌生的街区走二十分钟。你大概率会遇见一家想再来的小店。" },
    ],
    quote: { text: "把时间交给一座城，而不是一张行程表。", by: "拾程" },
    relatedIds: ["dest-nanluoguxiang", "moment-dusk"],
  },
  {
    id: "badge-axis",
    kind: "badge",
    kicker: "BADGE / 02",
    title: "中轴线打卡",
    subtitle: "从午门走到景山",
    image: "/photos/palace.jpg",
    meta: [{ label: "获得方式", value: "查看故宫与天坛详情" }, { label: "状态", value: "进行中" }],
    tags: ["中轴线", "地标", "成就"],
    intro: "一条线串起六百年。走过它，你会重新理解「对称」这两个字在城市里意味着什么。",
    blocks: [
      { heading: "如何获得", body: "查看故宫博物院与天坛公园的详情页，即可解锁。" },
      { heading: "完整走法", body: "午门进、神武门出，再登景山万春亭回望。一天的时间，足够把这条线记在心里。" },
    ],
    quote: { text: "站在万春亭上，北京才有了方向。", by: "拾程路线编辑" },
    relatedIds: ["dest-palace", "gallery-atlas", "route-axis"],
  },
  {
    id: "badge-spring",
    kind: "badge",
    kicker: "BADGE / 03",
    title: "早春出行",
    subtitle: "在花开之前出发",
    image: "/photos/summer.jpg",
    meta: [{ label: "获得方式", value: "查看颐和园详情" }, { label: "状态", value: "可解锁" }],
    tags: ["春季", "园林", "成就"],
    intro: "早春的园林还没完全醒，柳枝刚绿，湖面还有一点凉。这个时候去，人少，光也好。",
    blocks: [
      { heading: "如何获得", body: "查看颐和园详情页，规划一次春季出行，即可解锁。" },
      { heading: "为什么是早春", body: "花还没开，颜色最克制。适合慢慢走，也适合把一整个冬天积攒的注意力重新打开。" },
    ],
    quote: { text: "柳枝刚绿的时候，园林最安静。", by: "拾程编辑部" },
    relatedIds: ["dest-summer", "moment-noon"],
  },
];

/** 全站详情索引：相关推荐通过 id 在这里查找。 */
export const detailIndex: Record<string, DetailData> = Object.fromEntries(
  [...stayDetails, ...momentDetails, ...galleryDetails, ...badgeDetails].map((item) => [item.id, item]),
);

export function registerDetails(items: DetailData[]) {
  for (const item of items) detailIndex[item.id] = item;
}
