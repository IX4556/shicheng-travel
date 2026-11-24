-- 第二轮内容：把冷门目的地替换为北京热门地标与经典景点。
-- 图片均为 Wikimedia Commons 上对应景点的真实照片，已落地到 public/photos/。

delete from immersive_destinations
where id in ('wall', 'hutong', 'skyline');

insert into immersive_destinations (id, name, city, category, tagline, description, image, rating, tags, hours, sort_order) values
  ('palace', '故宫博物院', '北京', '人文古迹', '沿着红墙，走进六百年',
   '从午门进去，不必赶时间。太和殿广场的空旷、东西六宫的幽深、御花园的松弛，会在一条中轴线上依次展开。',
   '/photos/palace.jpg', 4.9, '["世界遗产","中轴线"]'::jsonb, '08:30–17:00 · 周一闭馆', 1),
  ('tiananmen', '天安门广场', '北京', '城市地标', '在广场中央，读懂城市的尺度',
   '城楼、广场、纪念碑在一条线上排开。清晨的旗袍与傍晚的灯光，让这里既是地标，也是一座城市的日常。',
   '/photos/tiananmen.jpg', 4.9, '["城市地标","广场"]'::jsonb, '全天开放 · 预约参观', 2),
  ('great-hall', '人民大会堂', '北京', '城市地标', '夜色里的庄严与秩序',
   '立柱、穹顶与灯光构成一种安静的秩序。站在广场西侧回望，建筑的体量会比照片里更具体。',
   '/photos/great-hall.jpg', 4.8, '["建筑","夜景"]'::jsonb, '外观全天可赏', 3),
  ('national-museum', '中国国家博物馆', '北京', '人文古迹', '把一个下午交给上下五千年',
   '从古代中国到复兴之路，展线很长。不必全部走完，选几个真正想看的展厅，反而更容易记住。',
   '/photos/national-museum.jpg', 4.8, '["博物馆","免费预约"]'::jsonb, '09:00–17:00 · 周一闭馆', 4),
  ('heaven', '天坛公园', '北京', '人文古迹', '祈年殿的蓝不是滤镜',
   '清晨人少，先在圜丘走一圈，再去看祈年殿的三重檐顶。柏树林里的晨练声，让古迹有了生活气。',
   '/photos/heaven.jpg', 4.8, '["祈年殿","世界遗产"]'::jsonb, '06:00–22:00', 5),
  ('ditan', '地坛公园', '北京', '人文古迹', '在古柏与方泽坛之间慢下来',
   '相比天坛，地坛更安静。方泽坛的石阶、古树与城墙遗址，适合把脚步放慢，也适合重新读一遍《我与地坛》。',
   '/photos/ditan.jpg', 4.6, '["坛庙","古柏"]'::jsonb, '06:00–21:00', 6),
  ('summer', '颐和园', '北京', '自然山水', '昆明湖把天空摊平',
   '十七孔桥适合慢慢走，走到一半回头，佛香阁会自己站正。沿西堤散步，比盯着景点更能读懂这座园林。',
   '/photos/summer.jpg', 4.8, '["皇家园林","湖景"]'::jsonb, '06:30–18:00', 7),
  ('yuanmingyuan', '圆明园', '北京', '人文古迹', '在遗址前，看见时间的重量',
   '西洋楼遗址的石柱、福海的湖面和重新长出的草木放在一起，风景因此有了另一层含义。',
   '/photos/yuanmingyuan.jpg', 4.7, '["遗址","园林"]'::jsonb, '07:00–19:00', 8),
  ('shichahai', '什刹海', '北京', '城市夜色', '银锭桥上看后海的灯',
   '傍晚沿湖走，鼓楼的轮廓落在水面，酒吧的灯一格格亮起。这里是北京最不费力的夜景。',
   '/photos/shichahai.jpg', 4.7, '["水岸","夜游"]'::jsonb, '全天开放 · 傍晚最佳', 9),
  ('nanluoguxiang', '南锣鼓巷', '北京', '胡同街巷', '在鱼骨胡同里，走进老城日常',
   '主街热闹，两侧窄巷才藏着真正的生活。门墩、砖雕和院里的树，让这条胡同比商业街更耐看。',
   '/photos/nanluoguxiang.jpg', 4.5, '["胡同","城市漫游"]'::jsonb, '全天开放', 10)
on conflict (id) do update set
  name = excluded.name,
  city = excluded.city,
  category = excluded.category,
  tagline = excluded.tagline,
  description = excluded.description,
  image = excluded.image,
  rating = excluded.rating,
  tags = excluded.tags,
  hours = excluded.hours,
  sort_order = excluded.sort_order;

-- 清掉与热门路线重复的旧路线；其中 night 指向已删除的 hutong 目的地。
delete from immersive_routes
where id in ('dawn', 'lake', 'night');

insert into immersive_routes (id, title, subtitle, duration, destination_id, image, sort_order) values
  ('axis', '中轴一日', '故宫到景山', '01 DAY', 'palace', '/photos/palace.jpg', 1),
  ('square', '广场建筑线', '城楼与大会堂', 'HALF DAY', 'tiananmen', '/photos/tiananmen.jpg', 2),
  ('museum', '博物馆半日', '国家博物馆', 'HALF DAY', 'national-museum', '/photos/national-museum.jpg', 3),
  ('ritual', '坛庙清晨', '天坛与地坛', 'MORNING', 'heaven', '/photos/heaven.jpg', 4),
  ('gardens', '双园记', '颐和园到圆明园', '01 DAY', 'summer', '/photos/summer.jpg', 5),
  ('lanes', '水岸胡同', '什刹海与南锣鼓巷', 'EVENING', 'shichahai', '/photos/shichahai.jpg', 6)
on conflict (id) do update set
  title = excluded.title,
  subtitle = excluded.subtitle,
  duration = excluded.duration,
  destination_id = excluded.destination_id,
  image = excluded.image,
  sort_order = excluded.sort_order;

update immersive_notes
set image = '/photos/palace.jpg'
where id = 'n1';

update immersive_notes
set title = '夜色把什刹海收成一条河',
    body = '银锭桥的风比酒重要。水面把灯揉碎，站十分钟就够把一天的喧嚣吹散。',
    image = '/photos/shichahai.jpg'
where id = 'n3';

update immersive_notes
set title = '周末只去故宫，然后什么都不做',
    body = '从午门走到神武门，在御花园的角落坐热腿。这就是整个周末。',
    image = '/photos/forbidden-hall.jpg'
where id = 'n4';
