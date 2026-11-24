-- 沉浸式单页：内容、收藏、互动与行程数据
-- 同时适用于本地 PGlite 与 Neon/Postgres。

create table if not exists immersive_sections (
  slug text primary key,
  eyebrow text not null,
  nav_label text not null,
  title text not null,
  description text not null,
  accent text not null,
  sort_order integer not null default 0
);

create table if not exists immersive_destinations (
  id text primary key,
  name text not null,
  city text not null,
  category text not null,
  tagline text not null,
  description text not null,
  image text not null,
  rating numeric(2, 1) not null default 0,
  tags jsonb not null default '[]'::jsonb,
  hours text,
  sort_order integer not null default 0
);

create table if not exists immersive_routes (
  id text primary key,
  title text not null,
  subtitle text not null,
  duration text not null,
  destination_id text,
  image text not null,
  sort_order integer not null default 0
);

create table if not exists immersive_notes (
  id text primary key,
  title text not null,
  body text not null,
  author text not null,
  likes integer not null default 0,
  image text not null,
  category text not null default '编辑精选',
  created_at timestamptz not null default now()
);

create table if not exists immersive_plans (
  id text primary key,
  session_id text not null,
  destination text not null,
  start_date text,
  end_date text,
  travelers integer not null default 2,
  style text not null default '从容',
  created_at timestamptz not null default now()
);

create table if not exists immersive_favorites (
  session_id text not null,
  target_id text not null,
  created_at timestamptz not null default now(),
  primary key (session_id, target_id)
);

create table if not exists immersive_interactions (
  id bigserial primary key,
  session_id text not null,
  type text not null,
  target_id text,
  payload jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists immersive_interactions_session_idx
  on immersive_interactions (session_id, created_at desc);
create index if not exists immersive_plans_session_idx
  on immersive_plans (session_id, created_at desc);

-- 四个导航区内容
insert into immersive_sections (slug, nav_label, eyebrow, title, description, accent, sort_order) values
  ('home', '首页', 'SHICHENG JOURNAL 2026', '把时间交给一座城', '从一条街巷开始，慢慢认识北京。把风景留给眼睛，把故事带回日常。', '#D9B879', 1),
  ('dest', '目的地', 'DISCOVER THE CITY', '每一种北京都值得抵达', '不必按攻略打卡。选择你喜欢的节奏，让城市带你往前走。', '#B83C32', 2),
  ('trip', '行程', 'CURATED ROUTES', '不赶路也能走很远', '把经典景点串成一段舒服的旅程，留一点空白给途中偶然发生的事。', '#D9B879', 3),
  ('me', '我的', 'TRAVEL WITH INTENTION', '让远方成为生活的一部分', '旅行不只是抵达一个地点，而是把每一次出发慢慢整理成自己的故事。', '#B83C32', 4)
on conflict (slug) do nothing;

-- 目的地内容
insert into immersive_destinations (id, name, city, category, tagline, description, image, rating, tags, hours, sort_order) values
  ('palace', '故宫博物院', '北京', '人文古迹', '沿着红墙，走进六百年', '从午门进去，不必赶时间。中轴线的砖是暖的，东边的树比西边先黄。把讲解关掉一段，听屋顶上的风。', '/photos/palace.jpg', 4.9, '["世界遗产","中轴线"]'::jsonb, '08:30–17:00 · 周一闭馆', 1),
  ('summer', '颐和园', '北京', '自然山水', '昆明湖把天空摊平', '十七孔桥适合慢慢走，走到一半回头，佛香阁会自己站正。', '/photos/summer.jpg', 4.8, '["皇家园林","湖景"]'::jsonb, '06:30–18:00', 2),
  ('wall', '慕田峪长城', '北京', '自然山水', '在日出前抵达敌楼', '比八达岭空。雾会先把敌楼藏起来，再一节一节还你。', '/photos/wall.jpg', 4.9, '["日出","徒步"]'::jsonb, '07:30–18:00', 3),
  ('heaven', '天坛公园', '北京', '人文古迹', '祈年殿的蓝不是滤镜', '清晨人少，回音壁先别急着喊，先绕圜丘走一圈。', '/photos/heaven.jpg', 4.8, '["祈年殿","清晨"]'::jsonb, '06:00–21:00', 4),
  ('hutong', '烟袋斜街', '北京', '城市夜色', '银锭桥上看后海的灯', '傍晚再去。找一家不靠门口的炸酱面，坐下就别看表。', '/photos/hutong.jpg', 4.7, '["胡同","夜游"]'::jsonb, '傍晚最合适', 5),
  ('skyline', '国贸天际', '北京', '城市夜色', '风把整座城收成光河', '不必进最贵的酒吧。天台的风和一杯热茶，就够把整座城收成一条光河。', '/photos/night.jpg', 4.6, '["夜景","天台"]'::jsonb, '17:00–23:00', 6)
on conflict (id) do nothing;

-- 精选路线
insert into immersive_routes (id, title, subtitle, duration, destination_id, image, sort_order) values
  ('axis', '中轴一日', '午门走到景山', '01 DAY', 'palace', '/photos/palace.jpg', 1),
  ('lake', '湖上半日', '十七孔桥来回', 'HALF DAY', 'summer', '/photos/summer.jpg', 2),
  ('night', '胡同夜饭', '灯笼与炸酱面', 'EVENING', 'hutong', '/photos/hutong.jpg', 3),
  ('dawn', '长城日出', '慕田峪清晨', 'AT DAWN', 'wall', '/photos/wall.jpg', 4)
on conflict (id) do nothing;

-- 旅行手记
insert into immersive_notes (id, title, body, author, likes, image, category, created_at) values
  ('n1', '沿中轴线走完一个秋天', '从午门到神武门，不要看导航。砖缝里的草比讲解牌诚实。', '林晚', 1286, '/photos/palace.jpg', '编辑精选', now()),
  ('n2', '四合院里的早晨只有鸟', '雨儿胡同还没醒的时候，石榴叶子先亮。房间不多，刚好。', '周予', 864, '/photos/hotel.jpg', '编辑精选', now()),
  ('n3', '夜色把国贸收成一条河', '风比酒重要。站十分钟就够，再久会开始想工作。', '陈叙', 2104, '/photos/night.jpg', '旅行游记', now()),
  ('n4', '周末只去长城，然后什么都不做', '缆车下去之后，在山脚的馆子把腿坐热。这就是整个周末。', '阿禾', 932, '/photos/wall.jpg', '关注', now())
on conflict (id) do nothing;
