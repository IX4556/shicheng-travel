import { useEffect, useState } from "react";
import {
  ArrowLeft,
  ArrowRight,
  ArrowUpRight,
  ChevronLeft,
  ChevronRight,
  Compass,
  Heart,
  Layers,
  MapPin,
  Sparkles,
  X,
} from "lucide-react";
import { Photo } from "@/components/photo";
import { cn } from "@/lib/cn";
import { detailIndex, type DetailData } from "./detailContent";

/**
 * 沉浸式全屏详情页：所有卡片共用同一个「子页面」容器。
 * 支持大图封面、多图画廊、分段长文、相关推荐与规划入口。
 */
export function DetailPageView({
  data,
  onClose,
  onOpenRelated,
  onPlan,
  onFavorite,
  saved = false,
}: {
  data: DetailData;
  onClose: () => void;
  onOpenRelated: (id: string) => void;
  onPlan: (destination?: string) => void;
  onFavorite?: () => void;
  saved?: boolean;
}) {
  const images = data.gallery?.length ? data.gallery : [data.image];
  const [imageIndex, setImageIndex] = useState(0);

  useEffect(() => {
    setImageIndex(0);
  }, [data.id]);

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
      if (event.key === "ArrowRight") setImageIndex((i) => (i + 1) % images.length);
      if (event.key === "ArrowLeft") setImageIndex((i) => (i - 1 + images.length) % images.length);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [images.length, onClose]);

  const related = (data.relatedIds ?? [])
    .map((id) => detailIndex[id])
    .filter((item): item is DetailData => Boolean(item))
    .slice(0, 3);

  return (
    <div className="imm-detail-page" role="dialog" aria-modal="true" aria-label={data.title}>
      <div className="imm-detail-topbar">
        <button type="button" className="imm-detail-back" onClick={onClose}>
          <ArrowLeft size={17} /> 返回探索
        </button>
        <span className="imm-detail-topbar-label">
          <Layers size={13} /> IMMERSIVE STORY · {data.kind.toUpperCase()}
        </span>
        <button type="button" className="imm-detail-close" onClick={onClose} aria-label="关闭详情">
          <X size={19} />
        </button>
      </div>

      <div className="imm-detail-scroll">
        <header className="imm-detail-cover">
          <Photo
            src={images[imageIndex]}
            alt={`${data.title} · 图片 ${imageIndex + 1}`}
            fallback={data.title}
            className="imm-detail-cover-media"
            imageClassName="imm-detail-cover-img"
          />
          <div className="imm-detail-cover-shade" />
          <div className="imm-detail-cover-copy">
            <span className="imm-detail-kicker">{data.kicker}</span>
            <h1>{data.title}</h1>
            <p>{data.subtitle}</p>
          </div>
          {images.length > 1 ? (
            <div className="imm-detail-cover-nav">
              <button type="button" onClick={() => setImageIndex((i) => (i - 1 + images.length) % images.length)} aria-label="上一张图片">
                <ChevronLeft size={18} />
              </button>
              <span>{String(imageIndex + 1).padStart(2, "0")} / {String(images.length).padStart(2, "0")}</span>
              <button type="button" onClick={() => setImageIndex((i) => (i + 1) % images.length)} aria-label="下一张图片">
                <ChevronRight size={18} />
              </button>
            </div>
          ) : null}
        </header>

        <div className="imm-detail-body">
          <div className="imm-detail-lead">
            <span className="imm-detail-lead-mark">导读</span>
            <p>{data.intro}</p>
          </div>

          {data.meta?.length ? (
            <div className="imm-detail-meta-grid">
              {data.meta.map((item) => (
                <div key={item.label}>
                  <span>{item.label}</span>
                  <strong>{item.value}</strong>
                </div>
              ))}
            </div>
          ) : null}

          {data.tags?.length ? (
            <div className="imm-detail-tags">
              {data.tags.map((tag) => <em key={tag}>{tag}</em>)}
            </div>
          ) : null}

          <article className="imm-detail-article">
            {data.blocks.map((block, index) => (
              <section key={block.heading}>
                <span className="imm-detail-num">{String(index + 1).padStart(2, "0")}</span>
                <div>
                  <h2>{block.heading}</h2>
                  <p>{block.body}</p>
                  {block.points?.length ? (
                    <ul>
                      {block.points.map((point) => (
                        <li key={point}><MapPin size={13} /> {point}</li>
                      ))}
                    </ul>
                  ) : null}
                </div>
              </section>
            ))}
          </article>

          {data.quote ? (
            <blockquote className="imm-detail-quote">
              <span>“</span>
              <p>{data.quote.text}</p>
              <cite>— {data.quote.by}</cite>
            </blockquote>
          ) : null}

          {images.length > 1 ? (
            <div className="imm-detail-gallery" aria-label="图片画廊">
              {images.map((image, index) => (
                <button
                  key={image + index}
                  type="button"
                  className={cn("imm-detail-thumb", index === imageIndex && "is-active")}
                  onClick={() => setImageIndex(index)}
                  aria-label={`查看第 ${index + 1} 张图片`}
                >
                  <img src={image} alt="" />
                  <span>{String(index + 1).padStart(2, "0")}</span>
                </button>
              ))}
            </div>
          ) : null}

          {related.length ? (
            <div className="imm-detail-related">
              <div className="imm-detail-related-head">
                <div><Compass size={17} /><strong>继续探索</strong></div>
                <span>RELATED STORIES</span>
              </div>
              <div className="imm-detail-related-grid">
                {related.map((item) => (
                  <button key={item.id} type="button" className="imm-detail-related-card" onClick={() => onOpenRelated(item.id)}>
                    <img src={item.image} alt="" />
                    <span>
                      <small>{item.kicker}</small>
                      <strong>{item.title}</strong>
                      <em>打开故事 <ArrowUpRight size={14} /></em>
                    </span>
                  </button>
                ))}
              </div>
            </div>
          ) : null}

          <div className="imm-detail-cta">
            <div>
              <span className="imm-eyebrow imm-eyebrow--light">MAKE IT YOURS</span>
              <h3>把这段故事，变成你的下一程。</h3>
              <p>选一个方向，留一段空白，剩下的交给路上的偶遇。</p>
            </div>
            <div className="imm-detail-cta-actions">
              {onFavorite ? (
                <button type="button" className={cn("imm-ghost-btn", saved && "is-saved")} onClick={onFavorite}>
                  <Heart size={16} fill={saved ? "currentColor" : "none"} /> {saved ? "已收藏" : "收藏"}
                </button>
              ) : null}
              <button type="button" className="imm-primary-btn" onClick={() => onPlan(data.title)}>
                <Sparkles size={16} /> 规划这段旅程 <ArrowRight size={16} />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
