import type { LucideIcon } from "lucide-react";
import {
  Bath,
  BedDouble,
  BookOpen,
  Landmark,
  Palette,
  SunMedium,
  Users,
  UtensilsCrossed,
} from "lucide-react";

export type SpotCategory = "history" | "museum" | "night" | "nature";

export type HomeTab = "推荐" | "必玩景点" | "同城周末" | "最新游记" | "关注";

export type Spot = {
  id: string;
  name: string;
  rating: number;
  reviews: string;
  distance: string;
  tags: string[];
  categories: SpotCategory[];
  image: string;
  price: string;
  hours: string;
  address: string;
  blurb: string;
};

export type Note = {
  id: string;
  title: string;
  body: string;
  author: string;
  likes: number;
  image: string;
  tab: HomeTab;
  followed?: boolean;
  mine?: boolean;
};

export const HOME_TABS: HomeTab[] = ["推荐", "必玩景点", "同城周末", "最新游记", "关注"];

export const spots: Spot[] = [
  {
    id: "palace",
    name: "故宫博物院",
    rating: 4.9,
    reviews: "15.6万条评价",
    distance: "距您 3.5km",
    tags: ["世界遗产", "中轴线"],
    categories: ["history", "museum"],
    image: "/photos/palace.jpg",
    price: "¥60 起",
    hours: "08:30 – 17:00 · 周一闭馆",
    address: "东城区景山前街 4 号",
    blurb: "从午门进去，不必赶时间。中轴线的砖是暖的，东边的树比西边先黄。把讲解关掉一段，听屋顶上的风。",
  },
  {
    id: "summer",
    name: "颐和园",
    rating: 4.8,
    reviews: "12.1万条评价",
    distance: "距您 12km",
    tags: ["皇家园林", "湖景"],
    categories: ["history", "nature"],
    image: "/photos/summer.jpg",
    price: "¥30 起",
    hours: "06:30 – 18:00",
    address: "海淀区新建宫门路 19 号",
    blurb: "昆明湖把天空摊平。十七孔桥适合慢慢走，走到一半回头，佛香阁会自己站正。",
  },
  {
    id: "wall",
    name: "慕田峪长城",
    rating: 4.9,
    reviews: "9.4万条评价",
    distance: "距您 68km",
    tags: ["日出", "徒步"],
    categories: ["history", "nature"],
    image: "/photos/wall.jpg",
    price: "¥40 起",
    hours: "07:30 – 18:00",
    address: "怀柔区渤海镇慕田峪村",
    blurb: "比八达岭空。日出前到，雾会先把敌楼藏起来，再一节一节还你。下山可以坐缆车，也可以把腿留给城砖。",
  },
  {
    id: "heaven",
    name: "天坛公园",
    rating: 4.8,
    reviews: "8.7万条评价",
    distance: "距您 6.2km",
    tags: ["祈年殿", "清晨"],
    categories: ["history", "nature"],
    image: "/photos/heaven.jpg",
    price: "¥15 起",
    hours: "06:00 – 21:00",
    address: "东城区天坛内东里 7 号",
    blurb: "祈年殿的蓝不是滤镜。清晨人少，回音壁先别急着喊，先绕圜丘走一圈。",
  },
  {
    id: "hutong",
    name: "烟袋斜街",
    rating: 4.7,
    reviews: "6.8万条评价",
    distance: "距您 5.1km",
    tags: ["胡同", "夜游"],
    categories: ["night"],
    image: "/photos/hutong.jpg",
    price: "免费漫步",
    hours: "傍晚最合适",
    address: "西城区烟袋斜街",
    blurb: "傍晚再去。银锭桥上看后海的灯，比店招好看。找一家不靠门口的炸酱面，坐下就别看表。",
  },
  {
    id: "skyline",
    name: "国贸天际",
    rating: 4.6,
    reviews: "3.2万条评价",
    distance: "距您 8.4km",
    tags: ["夜景", "天台"],
    categories: ["night"],
    image: "/photos/night.jpg",
    price: "茶饮即可",
    hours: "17:00 – 23:00",
    address: "朝阳区建国门外大街 1 号",
    blurb: "不必进最贵的酒吧。天台的风和一杯热茶，就够把整座城收成一条光河。",
  },
];

export const plays = [
  { id: "axis", title: "中轴一日", subtitle: "午门走到景山", spotId: "palace", image: "/photos/palace.jpg" },
  { id: "lake", title: "湖上半日", subtitle: "十七孔桥来回", spotId: "summer", image: "/photos/summer.jpg" },
  { id: "night", title: "胡同夜饭", subtitle: "灯笼与炸酱面", spotId: "hutong", image: "/photos/hutong.jpg" },
  { id: "dawn", title: "长城日出", subtitle: "慕田峪清晨", spotId: "wall", image: "/photos/wall.jpg" },
];

export const seedNotes: Note[] = [
  {
    id: "n1",
    title: "沿中轴线走完一个秋天",
    body: "从午门到神武门，不要看导航。砖缝里的草比讲解牌诚实。",
    author: "林晚",
    likes: 1286,
    image: "/photos/palace.jpg",
    tab: "推荐",
    followed: true,
  },
  {
    id: "n2",
    title: "四合院里的早晨只有鸟",
    body: "雨儿胡同还没醒的时候，石榴叶子先亮。房间不多，刚好。",
    author: "周予",
    likes: 864,
    image: "/photos/hotel.jpg",
    tab: "推荐",
    followed: true,
  },
  {
    id: "n3",
    title: "夜色把国贸收成一条河",
    body: "风比酒重要。站十分钟就够，再久会开始想工作。",
    author: "陈叙",
    likes: 2104,
    image: "/photos/night.jpg",
    tab: "推荐",
  },
  {
    id: "n4",
    title: "周末只去长城，然后什么都不做",
    body: "缆车下去之后，在山脚的馆子把腿坐热。这就是整个周末。",
    author: "阿禾",
    likes: 932,
    image: "/photos/wall.jpg",
    tab: "同城周末",
  },
  {
    id: "n5",
    title: "天坛的蓝，比滤镜干净",
    body: "祈年殿会把天空比下去。带一件薄外套，回音壁的风是直的。",
    author: "小满",
    likes: 741,
    image: "/photos/heaven.jpg",
    tab: "推荐",
  },
  {
    id: "n6",
    title: "南锣走慢一点，灯才好看",
    body: "银锭桥上停一下。后海的灯不是景点，是住在这儿的人还没睡。",
    author: "林晚",
    likes: 1560,
    image: "/photos/hutong.jpg",
    tab: "同城周末",
    followed: true,
  },
  {
    id: "n7",
    title: "昆明湖的风是横向的",
    body: "十七孔桥不要正着拍。侧过来，桥洞会自己排成一行。",
    author: "周予",
    likes: 688,
    image: "/photos/summer.jpg",
    tab: "同城周末",
    followed: true,
  },
];

export const hotel = {
  id: "courtyard",
  name: "拾光庭院",
  tags: ["四合院", "设计师酒店"],
  district: "东城",
  address: "雨儿胡同 18 号",
  image: "/photos/hotel.jpg",
  distances: [
    { icon: "walk" as const, text: "距南锣鼓巷步行约 800m" },
    { icon: "train" as const, text: "距北新桥地铁站约 600m" },
    { icon: "plane" as const, text: "距首都机场约 28km" },
  ],
  about: "雨儿胡同里的一进四合院。灰砖、木廊、一棵石榴。房间不多，早晨只有鸟。",
};

export type Room = {
  id: string;
  name: string;
  en: string;
  meta: string;
  price: number;
  image: string;
};

export const rooms: Room[] = [
  {
    id: "deluxe",
    name: "豪华客房",
    en: "Deluxe Room",
    meta: "大床 · 含早 · 入住当日 18:00 前可免费取消",
    price: 1280,
    image: "/photos/room.jpg",
  },
  {
    id: "court",
    name: "庭院套房",
    en: "Courtyard Suite",
    meta: "独立小院 · 双床 · 含双早 · 可延迟至 14:00 退房",
    price: 2180,
    image: "/photos/hotel.jpg",
  },
  {
    id: "king",
    name: "观景大床",
    en: "King View",
    meta: "望向正房 · 大床 · 不含早 · 不可取消",
    price: 1560,
    image: "/photos/night.jpg",
  },
];

export const stayOptions = [
  { checkIn: "2026-11-12", checkOut: "2026-11-16" },
  { checkIn: "2026-11-20", checkOut: "2026-11-22" },
  { checkIn: "2026-12-04", checkOut: "2026-12-07" },
];

export const rankFilters: { id: "all" | SpotCategory; label: string }[] = [
  { id: "all", label: "全部景点" },
  { id: "history", label: "历史古迹" },
  { id: "museum", label: "博物馆" },
  { id: "night", label: "夜游胜地" },
  { id: "nature", label: "自然景观" },
];

export const categories: {
  id: string;
  label: string;
  icon: LucideIcon;
  action:
    | { type: "rank"; cat: "all" | SpotCategory }
    | { type: "hotel" }
    | { type: "spot"; id: string }
    | { type: "tab"; tab: HomeTab }
    | { type: "soon"; message: string };
}[] = [
  { id: "spots", label: "景点", icon: Landmark, action: { type: "rank", cat: "all" } },
  { id: "stay", label: "酒店", icon: BedDouble, action: { type: "hotel" } },
  { id: "food", label: "美食", icon: UtensilsCrossed, action: { type: "spot", id: "hutong" } },
  { id: "guide", label: "攻略", icon: BookOpen, action: { type: "tab", tab: "最新游记" } },
  { id: "weekend", label: "周末", icon: SunMedium, action: { type: "tab", tab: "同城周末" } },
  { id: "show", label: "展览", icon: Palette, action: { type: "rank", cat: "museum" } },
  { id: "family", label: "亲子", icon: Users, action: { type: "spot", id: "summer" } },
  {
    id: "onsen",
    label: "温泉",
    icon: Bath,
    action: { type: "soon", message: "城内温泉不多，这季先把慕田峪的风走一走" },
  },
];

export type City =
  | { id: string; name: string; en: string; open: true; image: string; line: string }
  | { id: string; name: string; en: string; open: false; mark: string; line: string };

export const cities: City[] = [
  { id: "beijing", name: "北京", en: "BEIJING", open: true, image: "/photos/palace.jpg", line: "中轴线正黄着" },
  { id: "shanghai", name: "上海", en: "SHANGHAI", open: false, mark: "沪", line: "下一本手帐" },
  { id: "hangzhou", name: "杭州", en: "HANGZHOU", open: false, mark: "杭", line: "下一本手帐" },
  { id: "chengdu", name: "成都", en: "CHENGDU", open: false, mark: "蓉", line: "下一本手帐" },
  { id: "xian", name: "西安", en: "XI'AN", open: false, mark: "安", line: "下一本手帐" },
];

export const planDays = [
  { day: "01", title: "中轴线", spotId: "palace", note: "午门进，景山收" },
  { day: "02", title: "昆明湖", spotId: "summer", note: "十七孔桥来回" },
  { day: "03", title: "灯笼胡同", spotId: "hutong", note: "银锭桥上看灯" },
  { day: "04", title: "慕田峪", spotId: "wall", note: "日出，然后闲着" },
];

export const covers = [
  "/photos/palace.jpg",
  "/photos/hutong.jpg",
  "/photos/wall.jpg",
  "/photos/summer.jpg",
  "/photos/heaven.jpg",
  "/photos/night.jpg",
];

export function spotById(id: string) {
  return spots.find((spot) => spot.id === id);
}

export function formatStay(iso: string) {
  const [year, month, day] = iso.split("-").map(Number);
  const date = new Date(year, month - 1, day);
  const weeks = "日一二三四五六";
  return {
    md: `${String(month).padStart(2, "0")}.${String(day).padStart(2, "0")}`,
    week: `周${weeks[date.getDay()]}`,
  };
}

export function nightsBetween(checkIn: string, checkOut: string) {
  const [ay, am, ad] = checkIn.split("-").map(Number);
  const [by, bm, bd] = checkOut.split("-").map(Number);
  const start = new Date(ay, am - 1, ad).getTime();
  const end = new Date(by, bm - 1, bd).getTime();
  return Math.max(1, Math.round((end - start) / 86400000));
}

export function money(value: number) {
  return `¥${value.toLocaleString("zh-CN")}`;
}
