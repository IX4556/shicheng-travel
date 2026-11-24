import { useEffect, useState } from "react";
import {
  ArrowRight,
  ArrowUpRight,
  ChevronLeft,
  ChevronRight,
  Clock,
  Compass,
  Layers,
  MapPin,
  Pause,
  Play,
  Sparkles,
  Star,
} from "lucide-react";
import { Photo } from "@/components/photo";
import { cn } from "@/lib/cn";
import {
  badgeDetails,
  galleryDetails,
  momentDetails,
  stayDetails,
  type DetailData,
} from "./detailContent";

/* ------------------------------------------------------------------ */
/* 城市画廊：全屏大图自动轮播，可手动切换                              */
/* ------------------------------------------------------------------ */

const gallerySlides = [galleryDetails[0], momentDetails[2], galleryDetails[1], momentDetails[3]];

/** 让章节内的静态文案也具备与按钮一致的点击 / 键盘反馈。 */
function clickableProps(onClick: () => void, label: string, className?: string) {
  return {
    className: cn("imm-clickable", className),
    role: "button" as const,
    tabIndex: 0,
    title: label,
    "aria-label": label,
    onClick,
    onKeyDown: (event: React.KeyboardEvent<HTMLElement>) => {
      if (event.key === "Enter" || event.key === " ") {
        event.preventDefault();
        onClick();
      }
    },
  };
}

export function CityGallery({ onOpenDetail }: { onOpenDetail: (data: DetailData) => void }) {
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  const slide = gallerySlides[index];

  useEffect(() => {
    if (paused) return;
    const timer = window.setInterval(() => setIndex((i) => (i + 1) % gallerySlides.length), 6500);
    return () => window.clearInterval(timer);
  }, [paused]);

  function go(step: number) {
    setIndex((i) => (i + step + gallerySlides.length) % gallerySlides.length);
  }

  return (
    <div
      className="imm-gallery"
      data-reveal
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
    >
      <div className="imm-gallery-stage" key={slide.id}>
        <Photo
          src={slide.image}
          alt={slide.title}
          fallback={slide.title}
          className="imm-gallery-media"
          imageClassName="imm-gallery-img"
        />
        <div className="imm-gallery-shade" />
        <div className="imm-gallery-copy" key={`copy-${slide.id}`}>
          <span {...clickableProps(() => onOpenDetail(slide), `查看${slide.title}`, "imm-gallery-kicker")}>{slide.kicker}</span>
          <h2 {...clickableProps(() => onOpenDetail(slide), `进入${slide.title}图集`)}>{slide.title}</h2>
          <p {...clickableProps(() => onOpenDetail(slide), `阅读${slide.title}图注`)}>{slide.intro}</p>
          <div className="imm-gallery-actions">
            <button type="button" className="imm-gallery-open" onClick={() => onOpenDetail(slide)}>
              <ArrowUpRight size={17} /> 进入图集故事
            </button>
            <span className="imm-gallery-counter">
              {String(index + 1).padStart(2, "0")} <i /> {String(gallerySlides.length).padStart(2, "0")}
            </span>
          </div>
        </div>
      </div>

      <div className="imm-gallery-controls">
        <button type="button" onClick={() => go(-1)} aria-label="上一张城市图集">
          <ChevronLeft size={20} />
        </button>
        <button type="button" className="imm-gallery-play" onClick={() => setPaused((v) => !v)} aria-label={paused ? "继续播放" : "暂停播放"}>
          {paused ? <Play size={16} /> : <Pause size={16} />}
        </button>
        <button type="button" onClick={() => go(1)} aria-label="下一张城市图集">
          <ChevronRight size={20} />
        </button>
      </div>

      <div className="imm-gallery-tabs" role="tablist" aria-label="城市图集切换">
        {gallerySlides.map((item, i) => (
          <button
            key={item.id}
            type="button"
            role="tab"
            aria-selected={i === index}
            className={cn("imm-gallery-tab", i === index && "is-active")}
            onClick={() => setIndex(i)}
          >
            <span>{String(i + 1).padStart(2, "0")}</span>
            {item.title}
          </button>
        ))}
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* 时刻叙事：四张大图错落留白，支持自动 / 手动轮播                     */
/* ------------------------------------------------------------------ */

const momentIcons = [Sparkles, Compass, Layers, Star];

export function MomentsNarrative({ onOpenDetail }: { onOpenDetail: (data: DetailData) => void }) {
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);

  useEffect(() => {
    if (paused) return;
    const timer = window.setInterval(() => setIndex((i) => (i + 1) % momentDetails.length), 3000);
    return () => window.clearInterval(timer);
  }, [paused]);

  function go(step: number) {
    setIndex((i) => (i + step + momentDetails.length) % momentDetails.length);
  }

  return (
    <div className="imm-moments" data-reveal>
      <div className="imm-moments-intro">
        <span {...clickableProps(() => onOpenDetail(momentDetails[index]), "查看当前时刻", "imm-eyebrow imm-eyebrow--light")}><span /> FOUR MOMENTS OF A CITY</span>
        <h2 {...clickableProps(() => onOpenDetail(momentDetails[index]), "阅读四个时刻故事")}>同一座城，<br />四个完全不同的时刻。</h2>
        <p {...clickableProps(() => onOpenDetail(momentDetails[index]), "阅读时刻导览")}>把一天拆开来看：清晨、正午、黄昏、深夜。每一段时间，都有属于自己的颜色和声音。</p>
      </div>

      <div
        className="imm-moment-stage"
        aria-live="polite"
        onMouseEnter={() => setPaused(true)}
        onMouseLeave={() => setPaused(false)}
      >
        {momentDetails.map((moment, i) => {
          const Icon = momentIcons[i % momentIcons.length];
          return (
            <section
              key={moment.id}
              className={cn("imm-moment", i === index && "is-active")}
              aria-hidden={i !== index}
            >
              <Photo
                src={moment.image}
                alt={moment.title}
                fallback={moment.title}
                className="imm-moment-media"
                imageClassName="imm-moment-img"
              />
              <div className="imm-moment-shade" />
              <div className="imm-moment-copy">
                <span {...clickableProps(() => onOpenDetail(moment), `查看${moment.title}`, "imm-moment-index")}>{String(i + 1).padStart(2, "0")} / 04</span>
                <span {...clickableProps(() => onOpenDetail(moment), `查看${moment.title}`, "imm-moment-kicker")}><Icon size={15} /> {moment.kicker}</span>
                <h3 {...clickableProps(() => onOpenDetail(moment), `阅读${moment.title}`)}>{moment.title}</h3>
                <p {...clickableProps(() => onOpenDetail(moment), `阅读${moment.subtitle}`)}>{moment.subtitle}</p>
                <div className="imm-moment-tags">
                  {moment.tags?.map((tag) => (
                    <em key={tag} {...clickableProps(() => onOpenDetail(moment), `查看${tag}相关时刻`)}>{tag}</em>
                  ))}
                </div>
                <button type="button" className="imm-moment-btn" onClick={() => onOpenDetail(moment)} tabIndex={i === index ? 0 : -1}>
                  读这段时刻 <ArrowRight size={16} />
                </button>
              </div>
              <div className="imm-moment-meta">
                <span {...clickableProps(() => onOpenDetail(moment), `查看${moment.title}时刻信息`)}><Clock size={14} /> {moment.meta?.[0]?.value ?? "全天"}</span>
                <span {...clickableProps(() => onOpenDetail(moment), `查看${moment.title}地点`)}><MapPin size={14} /> 北京</span>
              </div>
            </section>
          );
        })}
      </div>

      <div className="imm-moment-controls">
        <button type="button" className="imm-moment-arrow" onClick={() => go(-1)} aria-label="上一个时刻">
          <ChevronLeft size={19} />
        </button>
        <div className="imm-moment-dots" role="tablist" aria-label="切换时刻">
          {momentDetails.map((moment, i) => (
            <button
              key={moment.id}
              type="button"
              role="tab"
              aria-selected={i === index}
              aria-label={`查看${moment.title}`}
              className={cn("imm-moment-dot", i === index && "is-active")}
              onClick={() => setIndex(i)}
            >
              <span>{String(i + 1).padStart(2, "0")}</span>
              <em>{moment.title}</em>
            </button>
          ))}
        </div>
        <button
          type="button"
          className="imm-moment-arrow imm-moment-play"
          onClick={() => setPaused((value) => !value)}
          aria-label={paused ? "继续轮播" : "暂停轮播"}
        >
          {paused ? <Play size={17} /> : <Pause size={17} />}
        </button>
        <button type="button" className="imm-moment-arrow" onClick={() => go(1)} aria-label="下一个时刻">
          <ChevronRight size={19} />
        </button>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* 栖居精选：大图住宿卡片                                              */
/* ------------------------------------------------------------------ */

export function StayCollection({ onOpenDetail }: { onOpenDetail: (data: DetailData) => void }) {
  return (
    <div className="imm-stay">
      <div className="imm-stay-head" data-reveal>
        <div {...clickableProps(() => onOpenDetail(stayDetails[0]), "查看精选住宿")}>
          <span className="imm-eyebrow imm-eyebrow--accent">WHERE TO STAY</span>
          <h3>住一处风景，<br />把旅行延长一点。</h3>
          <p>一段好的住宿，不是行程的终点，而是让城市真正慢下来的开始。</p>
        </div>
        <span {...clickableProps(() => onOpenDetail(stayDetails[0]), "查看三处精选住宿", "imm-stay-count")}>03 PLACES · CURATED</span>
      </div>
      <div className="imm-stay-grid" data-reveal>
        {stayDetails.map((stay, index) => (
          <button key={stay.id} type="button" className="imm-stay-card" onClick={() => onOpenDetail(stay)}>
            <Photo
              src={stay.image}
              alt={stay.title}
              fallback={stay.title}
              className="imm-stay-media"
              imageClassName="imm-stay-img"
            />
            <span className="imm-stay-num">{String(index + 1).padStart(2, "0")}</span>
            <span className="imm-stay-body">
              <small>{stay.kicker}</small>
              <strong>{stay.title}</strong>
              <span>{stay.subtitle}</span>
              <em><Star size={13} fill="currentColor" /> 查看住宿故事 <ArrowUpRight size={14} /></em>
            </span>
          </button>
        ))}
      </div>
    </div>
  );
}

/** 徽章卡片：让「我的」里的每个徽章也有完整子页面。 */
export function BadgeStrip({ onOpenDetail }: { onOpenDetail: (data: DetailData) => void }) {
  return (
    <div className="imm-badges-advanced" data-reveal>
      {badgeDetails.map((badge) => (
        <button key={badge.id} type="button" className="imm-badge-card" onClick={() => onOpenDetail(badge)}>
          <span className="imm-badge-icon"><Sparkles size={17} /></span>
          <span className="imm-badge-copy">
            <strong>{badge.title}</strong>
            <small>{badge.subtitle}</small>
          </span>
          <ArrowUpRight size={16} />
        </button>
      ))}
    </div>
  );
}
