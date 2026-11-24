import {
  ArrowRight,
  ArrowUpRight,
  Award,
  Bookmark,
  CalendarDays,
  Check,
  ChevronDown,
  ChevronRight,
  Clock,
  Compass,
  Footprints,
  Heart,
  MapPin,
  Minus,
  Moon,
  PenLine,
  Plus,
  Quote,
  RotateCcw,
  Search,
  Send,
  Sparkles,
  Star,
  Sun,
  User,
  X,
} from "lucide-react";
import {
  forwardRef,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { Toaster, toast } from "sonner";
import { Photo } from "@/components/photo";
import { cn } from "@/lib/cn";
import {
  createImmersiveNote,
  createImmersivePlan,
  getImmersivePageData,
  logImmersiveInteraction,
  toggleImmersiveFavorite,
} from "@/lib/immersive/api";
import { getSessionId } from "@/lib/immersive/session";
import type {
  ImmersiveDestination,
  ImmersiveInteraction,
  ImmersiveNote,
  ImmersivePageData,
  ImmersivePlan,
  ImmersiveRoute,
  ImmersiveSection,
} from "@/lib/immersive/types";
import { DetailPageView } from "./DetailPage";
import { BadgeStrip, CityGallery, MomentsNarrative, StayCollection } from "./ImmersiveChapters";
import { TencentMap } from "./TencentMap";
import {
  badgeDetails,
  buildDestinationDetail,
  buildNoteDetail,
  buildRouteDetail,
  detailIndex,
  galleryDetails,
  momentDetails,
  registerDetails,
  stayDetails,
  type DetailData,
} from "./detailContent";
import "../../styles/immersive.css";

type OverlayState =
  | { kind: "destination"; destination: ImmersiveDestination }
  | { kind: "route"; route: ImmersiveRoute }
  | { kind: "planner"; destination?: string }
  | { kind: "note"; note: ImmersiveNote }
  | { kind: "detail"; data: DetailData }
  | { kind: "compose" }
  | null;

const sectionIds = ["home", "dest", "trip", "me"] as const;

type InteractionType =
  | "nav"
  | "open_destination"
  | "favorite"
  | "open_route"
  | "open_note"
  | "plan"
  | "note"
  | "map"
  | "theme"
  | "open_detail"
  | "gallery"
  | "moment"
  | "stay";

const fallbackSections: ImmersiveSection[] = [
  { slug: "home", navLabel: "首页", eyebrow: "SHICHENG JOURNAL 2026", title: "把时间交给一座城", description: "", accent: "#D9B879", sortOrder: 1 },
  { slug: "dest", navLabel: "目的地", eyebrow: "DISCOVER THE CITY", title: "每一种北京都值得抵达", description: "", accent: "#B83C32", sortOrder: 2 },
  { slug: "trip", navLabel: "行程", eyebrow: "CURATED ROUTES", title: "不赶路也能走很远", description: "", accent: "#D9B879", sortOrder: 3 },
  { slug: "me", navLabel: "我的", eyebrow: "TRAVEL WITH INTENTION", title: "让远方成为生活的一部分", description: "", accent: "#B83C32", sortOrder: 4 },
];

const THEME_STORAGE_KEY = "shicheng-immersive-mode";

function prefersReducedMotion(): boolean {
  return typeof window !== "undefined" && window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
}

function formatDate(value: string | null | undefined): string {
  if (!value) return "待定";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return `${date.getMonth() + 1}月${date.getDate()}日`;
}

/** 让任意可见文本块支持键盘激活，和原生按钮行为一致。 */
function keyActivate(onClick: () => void) {
  return (event: React.KeyboardEvent<HTMLElement>) => {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      onClick();
    }
  };
}

type ClickableProps = {
  onClick: () => void;
  label?: string;
  className?: string;
};

function clickableProps({ onClick, label, className }: ClickableProps) {
  return {
    className: cn("imm-clickable", className),
    role: "button" as const,
    tabIndex: 0,
    title: label,
    "aria-label": label,
    onClick,
    onKeyDown: keyActivate(onClick),
  };
}

function useLockBodyScroll(locked: boolean) {
  useEffect(() => {
    if (!locked) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previous;
    };
  }, [locked]);
}

export function ImmersivePage() {
  const sessionId = useMemo(() => getSessionId(), []);
  const [data, setData] = useState<ImmersivePageData | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [activeSection, setActiveSection] = useState<string>("home");
  const [progress, setProgress] = useState(0);
  const [overlay, setOverlay] = useState<OverlayState>(null);
  // 服务端与首次客户端渲染都从 light 开始，避免 localStorage 造成 hydration 不一致。
  const [mode, setMode] = useState<"light" | "dark">("light");
  const [themeWash, setThemeWash] = useState<"to-dark" | "to-light" | null>(null);
  const themeWashTimer = useRef<number | null>(null);
  const heroRef = useRef<HTMLElement | null>(null);

  const sections = data?.sections?.length ? data.sections : fallbackSections;
  const destinations = data?.destinations ?? [];
  const routes = data?.routes ?? [];
  const notes = data?.notes ?? [];
  const favorites = data?.favorites ?? [];
  const plans = data?.plans ?? [];
  const interactions = data?.interactions ?? [];

  const load = useCallback(async () => {
    setLoading(true);
    setLoadError("");
    try {
      const result = await getImmersivePageData({ data: { sessionId } });
      setData(result);
    } catch (error) {
      setLoadError(error instanceof Error ? error.message : "内容加载失败");
    } finally {
      setLoading(false);
    }
  }, [sessionId]);

  useEffect(() => {
    void load();
  }, [load]);

  // 数据库内容到达后注册到详情索引，卡片与相关推荐共享同一套子页面。
  useEffect(() => {
    if (!data) return;
    registerDetails([
      ...data.destinations.map(buildDestinationDetail),
      ...data.routes.map((route) => buildRouteDetail(route, data.destinations)),
      ...data.notes.map(buildNoteDetail),
    ]);
  }, [data]);

  useEffect(() => {
    if (window.localStorage.getItem(THEME_STORAGE_KEY) === "dark") setMode("dark");
  }, []);

  useEffect(() => {
    window.localStorage.setItem(THEME_STORAGE_KEY, mode);
    document.querySelector('meta[name="theme-color"]')?.setAttribute("content", mode === "dark" ? "#171512" : "#F7F3ED");
  }, [mode]);

  useEffect(() => () => {
    if (themeWashTimer.current) window.clearTimeout(themeWashTimer.current);
  }, []);

  const track = useCallback(
    (type: InteractionType, targetId?: string, payload?: Record<string, unknown>) => {
      void logImmersiveInteraction({
        data: { sessionId, type, targetId, payload },
      }).catch(() => undefined);
    },
    [sessionId],
  );

  function toggleMode() {
    const next = mode === "light" ? "dark" : "light";
    setMode(next);
    setThemeWash(next === "dark" ? "to-dark" : "to-light");
    if (themeWashTimer.current) window.clearTimeout(themeWashTimer.current);
    themeWashTimer.current = window.setTimeout(() => setThemeWash(null), 740);
    track("theme", next);
  }

  const openDetail = useCallback(
    (detail: DetailData) => {
      setOverlay({ kind: "detail", data: detail });
      track("open_detail", detail.id);
    },
    [track],
  );

  function openDetailById(id: string) {
    const detail = detailIndex[id];
    if (detail) openDetail(detail);
  }

  function goTo(slug: string) {
    const node = document.getElementById(`section-${slug}`);
    if (!node) return;
    node.scrollIntoView({
      behavior: prefersReducedMotion() ? "auto" : "smooth",
      block: "start",
    });
    setActiveSection(slug);
    track("nav", slug);
  }

  useEffect(() => {
    const onScroll = () => {
      const max = document.documentElement.scrollHeight - window.innerHeight;
      setProgress(max > 0 ? Math.min(1, window.scrollY / max) : 0);
      if (!prefersReducedMotion() && heroRef.current) {
        const shift = Math.min(window.scrollY, 900);
        heroRef.current.style.setProperty("--hero-shift", `${shift * 0.32}px`);
        heroRef.current.style.setProperty("--hero-fade", String(Math.max(0, 1 - shift / 700)));
      }
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    const nodes = sectionIds
      .map((id) => document.getElementById(`section-${id}`))
      .filter((node): node is HTMLElement => Boolean(node));
    if (!nodes.length || !("IntersectionObserver" in window)) return;
    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((entry) => entry.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];
        if (visible) setActiveSection(visible.target.id.replace("section-", ""));
      },
      { rootMargin: "-28% 0px -55% 0px", threshold: [0, 0.15, 0.35, 0.6] },
    );
    nodes.forEach((node) => observer.observe(node));
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    const reveal = (node: HTMLElement) => node.classList.add("is-in");
    const nodes = Array.from(document.querySelectorAll<HTMLElement>("[data-reveal]"));
    if (!("IntersectionObserver" in window)) {
      nodes.forEach(reveal);
      return;
    }
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            reveal(entry.target as HTMLElement);
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.12, rootMargin: "0px 0px -6% 0px" },
    );
    const watch = (node: HTMLElement) => {
      if (node.dataset.revealWatched) return;
      node.dataset.revealWatched = "1";
      observer.observe(node);
    };
    nodes.forEach(watch);
    // 分类切换 / 搜索 / 展开会重建节点，持续补观察新增元素，避免它们停在 opacity: 0。
    const mutation = new MutationObserver(() => {
      document.querySelectorAll<HTMLElement>("[data-reveal]:not(.is-in)").forEach(watch);
    });
    mutation.observe(document.getElementById("main-content") ?? document.body, {
      childList: true,
      subtree: true,
    });
    const fallback = window.setTimeout(() => {
      document.querySelectorAll<HTMLElement>("[data-reveal]:not(.is-in)").forEach(reveal);
    }, 6000);
    return () => {
      observer.disconnect();
      mutation.disconnect();
      window.clearTimeout(fallback);
    };
  }, [Boolean(data)]);

  async function handleFavorite(destination: ImmersiveDestination) {
    try {
      const result = await toggleImmersiveFavorite({
        data: { sessionId, targetId: destination.id },
      });
      setData((prev) => {
        if (!prev) return prev;
        return {
          ...prev,
          favorites: result.saved
            ? [...prev.favorites, destination.id]
            : prev.favorites.filter((id) => id !== destination.id),
          stats: { ...prev.stats, interactionCount: prev.stats.interactionCount + 1 },
        };
      });
      toast.success(result.saved ? `已收藏 ${destination.name}` : `已取消收藏 ${destination.name}`);
      track("favorite", destination.id, { action: result.saved ? "add" : "remove" });
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "收藏失败");
    }
  }

  async function handlePlan(input: {
    destination: string;
    startDate: string;
    endDate: string;
    travelers: number;
    style: "从容" | "深度" | "轻探险" | "亲子";
  }) {
    try {
      const result = await createImmersivePlan({ data: { sessionId, ...input } });
      setData((prev) =>
        prev
          ? {
              ...prev,
              plans: [result.plan, ...prev.plans],
              stats: { ...prev.stats, interactionCount: prev.stats.interactionCount + 1 },
            }
          : prev,
      );
      setOverlay(null);
      toast.success("行程已保存到「我的」");
      track("plan", result.plan.id, { destination: input.destination });
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "保存行程失败");
    }
  }

  async function handleNote(input: { title: string; body: string; author: string }) {
    try {
      const result = await createImmersiveNote({ data: { sessionId, ...input } });
      setData((prev) =>
        prev
          ? {
              ...prev,
              notes: [result.note, ...prev.notes],
              stats: { ...prev.stats, noteCount: prev.stats.noteCount + 1, interactionCount: prev.stats.interactionCount + 1 },
            }
          : prev,
      );
      setOverlay(null);
      toast.success("手记已发布");
      track("note", result.note.id, { title: input.title });
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "发布失败");
    }
  }

  function openDestination(destination: ImmersiveDestination) {
    track("open_destination", destination.id);
    openDetail(buildDestinationDetail(destination));
  }

  function openRoute(route: ImmersiveRoute) {
    track("open_route", route.id);
    openDetail(buildRouteDetail(route, destinations));
  }

  function openNote(note: ImmersiveNote) {
    track("open_note", note.id);
    openDetail(buildNoteDetail(note));
  }

  return (
    <div className="imm-page" data-theme={mode} data-theme-wash={themeWash ?? undefined}>
      <div className="imm-theme-wash" aria-hidden="true" />
      <Toaster position="top-center" richColors closeButton />
      <div className="imm-progress" style={{ transform: `scaleX(${progress})` }} />

      <button type="button" className="imm-floating-brand" onClick={() => goTo("home")} aria-label="拾程首页">
        <span>拾</span>
        <small>拾程</small>
      </button>
      <button
        type="button"
        className="imm-floating-theme"
        onClick={toggleMode}
        aria-label={mode === "light" ? "切换到夜间模式" : "切换到白天模式"}
        title={mode === "light" ? "切换到夜间模式" : "切换到白天模式"}
      >
        {mode === "light" ? <Moon size={18} /> : <Sun size={18} />}
      </button>
      <button type="button" className="imm-floating-cta" onClick={() => setOverlay({ kind: "planner" })} aria-label="开始规划行程">
        <Compass size={18} />
        <span>规划</span>
      </button>

      <aside className="imm-rail" aria-label="主导航">
        <button type="button" className="imm-rail-brand" onClick={() => goTo("home")} aria-label="回到首页">
          <span>拾</span>
        </button>
        <span className="imm-rail-caption">CHAPTERS</span>
        <span className="imm-rail-line" aria-hidden="true">
          <i style={{ height: `${Math.max(8, progress * 100)}%` }} />
        </span>
        <div className="imm-rail-links">
          {sections.map((section, index) => (
            <button
              key={section.slug}
              type="button"
              className={cn("imm-rail-link", activeSection === section.slug && "is-active")}
              onClick={() => goTo(section.slug)}
              aria-current={activeSection === section.slug ? "location" : undefined}
            >
              <span className="imm-rail-index">0{index + 1}</span>
              <span className="imm-rail-text">{section.navLabel}</span>
              <span className="imm-rail-dot" />
            </button>
          ))}
        </div>
        <span className="imm-rail-divider" />
        <button type="button" className="imm-rail-plan" onClick={() => setOverlay({ kind: "planner" })}>
          <Compass size={17} />
          <span>开始规划</span>
        </button>
        <span className="imm-rail-foot">SC · 2026</span>
      </aside>

      <main id="main-content">
        <HeroSection
          ref={heroRef}
          section={sections[0]}
          stats={data?.stats}
          onExplore={() => goTo("dest")}
          onPlan={() => setOverlay({ kind: "planner" })}
          onOpenById={openDetailById}
          loading={loading}
        />

        <DestSection
          section={sections[1]}
          destinations={destinations}
          favorites={favorites}
          loading={loading}
          onOpen={openDestination}
          onFavorite={handleFavorite}
          onOpenDetail={openDetail}
          onOpenById={openDetailById}
          onGoHome={() => goTo("home")}
        />

        <TripSection
          section={sections[2]}
          routes={routes}
          destinations={destinations}
          mode={mode}
          onOpenRoute={openRoute}
          onOpenDestination={openDestination}
          onPlan={(destination) => setOverlay({ kind: "planner", destination })}
          onMapTrack={(view) => track("map", view)}
          onOpenDetail={openDetail}
          onOpenById={openDetailById}
        />

        <MeSection
          section={sections[3]}
          notes={notes}
          plans={plans}
          favorites={favorites}
          destinations={destinations}
          interactions={interactions}
          onOpenNote={openNote}
          onCompose={() => setOverlay({ kind: "compose" })}
          onPlan={() => setOverlay({ kind: "planner" })}
          onOpenDestination={openDestination}
          onOpenDetail={openDetail}
          onOpenById={openDetailById}
          onGoTo={goTo}
        />
        <section className="imm-outro" data-reveal>
          <div className="imm-outro-inner">
            <span {...clickableProps({ onClick: () => setOverlay({ kind: "planner" }), className: "imm-eyebrow imm-eyebrow--light", label: "开启下一程" })}>YOUR NEXT CHAPTER</span>
            <h2 {...clickableProps({ onClick: () => setOverlay({ kind: "planner" }), label: "规划下一程" })}>下一程，<br /><em>由你决定。</em></h2>
            <p {...clickableProps({ onClick: () => setOverlay({ kind: "planner" }), label: "开始规划行程" })}>不必等到万事俱备。先选一个想去的地方，旅程自然会慢慢展开。</p>
            <button type="button" className="imm-outro-btn" onClick={() => setOverlay({ kind: "planner" })}>
              开始规划 <ArrowRight size={17} />
            </button>
          </div>
          <div {...clickableProps({ onClick: () => goTo("home"), className: "imm-outro-mark", label: "回到首页" })}>拾</div>
        </section>
      </main>

      <footer className="imm-footer">
        <div>
          <span {...clickableProps({ onClick: () => goTo("home"), className: "imm-footer-mark", label: "回到首页" })}>拾</span>
          <div {...clickableProps({ onClick: () => goTo("home"), label: "回到拾程首页" })}>
            <strong>拾程 SHICHENG</strong>
            <p>把每一次出发，变成值得记住的故事。</p>
          </div>
        </div>
        <div className="imm-footer-meta">
          <span {...clickableProps({ onClick: () => openDetailById("gallery-atlas"), label: "查看品牌专题" })}>© 2026 SHICHENG · TRAVEL WITH INTENTION</span>
          <span {...clickableProps({ onClick: () => openDetailById("gallery-atlas"), label: "了解站点技术" })}>{data?.dbSource === "neon" ? "NEON POSTGRES" : "LOCAL PGLITE"} · FULL STACK</span>
        </div>
      </footer>

      <nav className="imm-mobile-nav" aria-label="移动端章节导航">
        {sections.map((section, index) => (
          <button
            key={section.slug}
            type="button"
            className={cn("imm-mobile-nav-item", activeSection === section.slug && "is-active")}
            onClick={() => goTo(section.slug)}
          >
            {section.navLabel}
            <small>0{index + 1}</small>
          </button>
        ))}
      </nav>

      {loadError ? (
        <div className="imm-error" role="alert">
          <span>后端数据加载失败：{loadError}</span>
          <button type="button" onClick={() => void load()}>
            <RotateCcw size={14} /> 重试
          </button>
        </div>
      ) : null}

      <OverlayLayer
        overlay={overlay}
        onClose={() => setOverlay(null)}
        destinations={destinations}
        favorites={favorites}
        onFavorite={handleFavorite}
        onPlan={handlePlan}
        onNote={handleNote}
        onOpenDetailById={openDetailById}
        onOpenPlanner={(destination) => setOverlay({ kind: "planner", destination })}
      />
    </div>
  );
}

const HeroSection = forwardRef<
  HTMLElement,
  {
    section: ImmersiveSection;
    stats?: ImmersivePageData["stats"];
    onExplore: () => void;
    onPlan: () => void;
    onOpenById: (id: string) => void;
    loading: boolean;
  }
>(function HeroSection({ section, stats, onExplore, onPlan, onOpenById, loading }, ref) {
  return (
    <section id="section-home" ref={ref} className="imm-section imm-hero">
      <div className="imm-hero-bg">
        <img src="/photos/hero-great-wall.jpg" alt="群山之间蜿蜒的长城" />
        <div className="imm-hero-shade" />
      </div>
      <div className="imm-aurora imm-aurora-a" />
      <div className="imm-aurora imm-aurora-b" />
      <div className="imm-aurora imm-aurora-c" />
      <div className="imm-hero-inner">
        <div className="imm-hero-copy" data-reveal>
          <p {...clickableProps({ onClick: () => onOpenById("gallery-atlas"), className: "imm-eyebrow imm-eyebrow--light", label: "查看城市图库" })}>
            <span /> {section.eyebrow}
          </p>
          <h1 {...clickableProps({ onClick: () => onOpenById("gallery-atlas"), className: "imm-hero-title", label: "查看北京城市专题" })}>
            把时间交给
            <br />
            <em>一座城</em>
          </h1>
          <p {...clickableProps({ onClick: () => onOpenById("gallery-atlas"), className: "imm-hero-lead", label: "阅读城市旅行提案" })}>
            从一条街巷开始，慢慢认识北京。
            <br />
            把风景留给眼睛，把故事带回日常。
          </p>
          <div {...clickableProps({ onClick: () => onOpenById("gallery-atlas"), className: "imm-hero-feature", label: "查看 2026 城市旅行提案" })}>
            <Award size={15} /> 2026 城市旅行提案 · 北京特辑
            <span>·</span> 六处目的地 / 四条主题路线
          </div>
          <div className="imm-hero-actions">
            <button type="button" className="imm-primary-btn" onClick={onExplore}>
              开始探索 <ArrowRight size={17} />
            </button>
            <button type="button" className="imm-ghost-btn" onClick={onPlan}>
              <Sparkles size={17} /> 规划我的行程
            </button>
          </div>
        </div>
        <div className="imm-hero-stats" data-reveal>
          <StatCard label="目的地" value={loading ? "--" : String(stats?.destinationCount ?? 0)} unit="处" onClick={() => onOpenById("dest-palace")} />
          <StatCard label="精选路线" value={loading ? "--" : String(stats?.routeCount ?? 0)} unit="条" onClick={() => onOpenById("route-axis")} />
          <StatCard label="旅行手记" value={loading ? "--" : String(stats?.noteCount ?? 0)} unit="篇" onClick={() => onOpenById("gallery-atlas")} />
          <StatCard label="收藏地点" value={loading ? "--" : String(stats?.favoriteCount ?? 0)} unit="处" onClick={() => onOpenById("badge-walker")} />
          <div {...clickableProps({ onClick: () => onOpenById("gallery-atlas"), className: "imm-stat imm-stat--live", label: "查看实时数据来源" })}>
            <span className="imm-stat-pulse" />
            <strong>LIVE</strong>
            <small>数据来自数据库</small>
          </div>
        </div>
      </div>
      <div className="imm-hero-bottom">
        <span {...clickableProps({ onClick: () => onOpenById("gallery-atlas"), label: "查看北京坐标专题" })}>39°54′ N · 116°24′ E</span>
        <button type="button" onClick={onExplore} aria-label="向下滚动">
          SCROLL TO EXPLORE <span className="imm-scroll-line" />
        </button>
        <span {...clickableProps({ onClick: () => onOpenById("moment-dusk"), label: "查看一座城的四季" })}>一座城的四季</span>
      </div>
    </section>
  );
});

function StatCard({ label, value, unit, onClick }: { label: string; value: string; unit: string; onClick?: () => void }) {
  return (
    <div {...(onClick ? clickableProps({ onClick, className: "imm-stat", label: `查看${label}详情` }) : { className: "imm-stat" })}>
      <small>{label}</small>
      <strong>
        {value}
        <em>{unit}</em>
      </strong>
    </div>
  );
}

function DestSection({
  section,
  destinations,
  favorites,
  loading,
  onOpen,
  onFavorite,
  onOpenDetail,
  onOpenById,
  onGoHome,
}: {
  section: ImmersiveSection;
  destinations: ImmersiveDestination[];
  favorites: string[];
  loading: boolean;
  onOpen: (destination: ImmersiveDestination) => void;
  onFavorite: (destination: ImmersiveDestination) => void;
  onOpenDetail: (data: DetailData) => void;
  onOpenById: (id: string) => void;
  onGoHome: () => void;
}) {
  const [category, setCategory] = useState("全部");
  const [query, setQuery] = useState("");
  const [expanded, setExpanded] = useState(false);

  // 每个分类都给出完整的景点集合，避免切换分类后只剩单张卡片。
  const categoryGroups = useMemo<Record<string, ImmersiveDestination[]>>(() => {
    const pick = (ids: string[]) =>
      ids
        .map((id) => destinations.find((item) => item.id === id))
        .filter((item): item is ImmersiveDestination => Boolean(item));
    return {
      全部: destinations,
      人文古迹: pick(["palace", "national-museum", "heaven", "ditan", "yuanmingyuan", "great-hall"]),
      城市地标: pick(["tiananmen", "great-hall", "palace", "national-museum", "shichahai"]),
      自然山水: pick(["summer", "shichahai", "yuanmingyuan", "ditan"]),
      城市夜色: pick(["shichahai", "great-hall", "nanluoguxiang", "tiananmen"]),
      胡同街巷: pick(["nanluoguxiang", "shichahai", "ditan", "hutong"]),
    };
  }, [destinations]);
  const categories = Object.keys(categoryGroups);
  const limit = category === "全部" ? 6 : 3;
  const visible = useMemo(() => {
    const q = query.trim();
    const group = categoryGroups[category] ?? destinations;
    const pool = group.length ? group : destinations;
    return pool.filter((item) => {
      return !q || `${item.name}${item.tagline}${item.tags.join("")}${item.description}`.includes(q);
    });
  }, [category, categoryGroups, destinations, query]);

  return (
    <section id="section-dest" className="imm-section imm-dest">
      <div className="imm-section-inner">
        <div className="imm-section-head" data-reveal>
          <div>
            <p {...clickableProps({ onClick: () => onOpenById("gallery-atlas"), className: "imm-eyebrow imm-eyebrow--accent", label: "查看城市灵感图库" })}>
              <span /> {section.eyebrow}
            </p>
            <h2 {...clickableProps({ onClick: () => onOpenById("gallery-atlas"), className: "imm-section-title", label: "查看目的地专题" })}>{section.title}</h2>
          </div>
          <p {...clickableProps({ onClick: () => onOpenById("gallery-atlas"), className: "imm-section-lead", label: "阅读目的地导览" })}>{section.description}</p>
        </div>

        <div className="imm-editorial-strip" data-reveal>
          <div {...clickableProps({ onClick: () => onOpenById("gallery-atlas"), label: "探索城市气质" })}>
            <span>01</span>
            <strong>城市气质</strong>
            <p>红墙、湖面、胡同与天际线，四种表情拼成一座城。</p>
          </div>
          <div {...clickableProps({ onClick: () => onOpenById("route-axis"), label: "查看慢行路线" })}>
            <span>02</span>
            <strong>慢行尺度</strong>
            <p>按自己的节奏走，不赶路，也能把一天走得很长。</p>
          </div>
          <div {...clickableProps({ onClick: () => onOpenById("gallery-atlas"), label: "阅读真实手记" })}>
            <span>03</span>
            <strong>真实手记</strong>
            <p>把沿途的微光记下来，让下一次出发有据可循。</p>
          </div>
        </div>

        <div className="imm-filters" data-reveal>
          <div className="imm-chips" role="group" aria-label="目的地分类">
            {categories.map((item) => (
              <button
                key={item}
                type="button"
                className={cn("imm-chip", category === item && "is-active")}
                aria-pressed={category === item}
                onClick={() => {
                  setCategory(item);
                  setExpanded(false);
                }}
              >
                {item}
              </button>
            ))}
          </div>
          <label className="imm-search">
            <Search size={17} />
            <input
              value={query}
              onChange={(event) => {
                setQuery(event.target.value);
                setExpanded(false);
              }}
              placeholder="搜索景点、街巷或灵感"
              aria-label="搜索目的地"
            />
            {query ? (
              <button type="button" onClick={() => setQuery("")} aria-label="清除搜索">
                <X size={15} />
              </button>
            ) : null}
          </label>
        </div>

        {loading ? (
          <div className="imm-dest-grid">
            {[0, 1, 2, 3].map((item) => (
              <div key={item} className="imm-skeleton" />
            ))}
          </div>
        ) : visible.length === 0 ? (
          <div
            {...clickableProps({
              onClick: () => {
                setQuery("");
                setCategory("全部");
                setExpanded(false);
              },
              className: "imm-empty",
              label: "清除筛选条件，显示全部地点",
            })}
            data-reveal
          >
            <Compass size={26} />
            <strong>暂时没有找到相关内容</strong>
            <span>点击这里，清除筛选条件继续探索。</span>
          </div>
        ) : (
          <>
          <div className="imm-dest-grid" data-reveal>
            {(expanded ? visible : visible.slice(0, limit)).map((destination, index) => (
              <article
                key={destination.id}
                className="imm-dest-card"
                style={{ animationDelay: `${index * 80}ms` }}
              >
                <button type="button" className="imm-dest-open" onClick={() => onOpen(destination)} aria-label={`查看${destination.name}详情`}>
                  <Photo
                    src={destination.image}
                    alt={destination.name}
                    fallback={destination.name}
                    className="imm-dest-media"
                    imageClassName="imm-dest-media-img"
                  />
                  <span className="imm-dest-index">{String(index + 1).padStart(2, "0")} / {destination.city}</span>
                  <span className="imm-dest-body">
                    <span className="imm-dest-tags">
                      {destination.tags.slice(0, 2).map((tag) => (
                        <em key={tag}>{tag}</em>
                      ))}
                    </span>
                    <strong>{destination.name}</strong>
                    <span className="imm-dest-tagline">{destination.tagline}</span>
                    <span className="imm-dest-more">
                      展开详情 <ArrowUpRight size={16} />
                    </span>
                  </span>
                </button>
                <button
                  type="button"
                  className={cn("imm-fav", favorites.includes(destination.id) && "is-active")}
                  aria-label={favorites.includes(destination.id) ? `取消收藏${destination.name}` : `收藏${destination.name}`}
                  aria-pressed={favorites.includes(destination.id)}
                  onClick={() => onFavorite(destination)}
                >
                  <Heart size={17} fill={favorites.includes(destination.id) ? "currentColor" : "none"} />
                </button>
              </article>
            ))}
          </div>
          <div className="imm-dest-expand">
            <button
              type="button"
              className="imm-dest-expand-btn"
              onClick={() => setExpanded((v) => !v)}
              aria-expanded={expanded}
              disabled={visible.length <= limit}
              title={visible.length <= limit ? "当前分类已展示全部图片" : undefined}
            >
              {visible.length <= limit
                ? "已展示全部图片"
                : expanded
                  ? "收起图片"
                  : `展开更多 · 还有 ${visible.length - limit} 张`}
              <ChevronDown size={17} className={expanded ? "is-up" : undefined} />
            </button>
            <span>{expanded ? visible.length : Math.min(visible.length, limit)} / {visible.length}</span>
          </div>
          </>
        )}
      </div>
      <CityGallery onOpenDetail={onOpenDetail} />
    </section>
  );
}

function TripSection({
  section,
  routes,
  destinations,
  mode,
  onOpenRoute,
  onOpenDestination,
  onPlan,
  onMapTrack,
  onOpenDetail,
  onOpenById,
}: {
  section: ImmersiveSection;
  routes: ImmersiveRoute[];
  destinations: ImmersiveDestination[];
  mode: "light" | "dark";
  onOpenRoute: (route: ImmersiveRoute) => void;
  onOpenDestination: (destination: ImmersiveDestination) => void;
  onPlan: (destination?: string) => void;
  onMapTrack: (view?: string) => void;
  onOpenDetail: (data: DetailData) => void;
  onOpenById: (id: string) => void;
}) {
  return (
    <section id="section-trip" className="imm-section imm-trip">
      <div className="imm-trip-glow" />
      <div className="imm-section-inner">
        <div className="imm-section-head imm-section-head--light" data-reveal>
          <div>
            <p {...clickableProps({ onClick: () => onOpenById("route-axis"), className: "imm-eyebrow imm-eyebrow--light", label: "查看中轴线路线" })}>
              <span /> {section.eyebrow}
            </p>
            <h2 {...clickableProps({ onClick: () => onOpenById("route-axis"), className: "imm-section-title", label: "查看主题路线" })}>不赶路，<br />也能走很远。</h2>
          </div>
          <p {...clickableProps({ onClick: () => onOpenById("route-axis"), className: "imm-section-lead", label: "阅读路线导览" })}>{section.description}</p>
        </div>

        <div className="imm-pace-grid" data-reveal>
          <div {...clickableProps({ onClick: () => onOpenById("route-axis"), label: "查看故宫到天安门路线" })}><Award size={18} /><strong>选一个方向</strong><span>从故宫到天安门，先定下今天的主题。</span></div>
          <div {...clickableProps({ onClick: () => onOpenById("route-lanes"), label: "查看胡同水岸路线" })}><Footprints size={18} /><strong>留一段空白</strong><span>不把时间填满，给偶遇留一个位置。</span></div>
          <div {...clickableProps({ onClick: () => onOpenById("moment-dusk"), label: "查看黄昏时刻故事" })}><Quote size={18} /><strong>带走一个故事</strong><span>回来之后写下来，旅程才算真正完成。</span></div>
        </div>

        <TencentMap
          mode={mode}
          destinations={destinations}
          onOpenDestination={onOpenDestination}
          onMapTrack={onMapTrack}
        />

        <div className="imm-route-list" data-reveal>
          {routes.map((route, index) => (
            <button key={route.id} type="button" className="imm-route-row" onClick={() => onOpenRoute(route)}>
              <span className="imm-route-num">{String(index + 1).padStart(2, "0")}</span>
              <Photo src={route.image} alt={route.title} fallback={route.title} className="imm-route-thumb" />
              <span className="imm-route-copy">
                <strong>{route.title}</strong>
                <small>{route.subtitle}</small>
              </span>
              <span className="imm-route-duration">
                <Clock size={14} /> {route.duration}
              </span>
              <ArrowUpRight className="imm-route-arrow" size={19} />
            </button>
          ))}
        </div>

        <div className="imm-trip-cta" data-reveal>
          <div {...clickableProps({ onClick: () => onPlan(), label: "开始规划下一段旅程" })}>
            <span className="imm-eyebrow imm-eyebrow--light">MAKE IT YOUR JOURNEY</span>
            <h3>下一段旅程，从这里开始。</h3>
          </div>
          <button type="button" className="imm-primary-btn" onClick={() => onPlan()}>
            生成专属路线 <Sparkles size={17} />
          </button>
        </div>
      </div>
      <MomentsNarrative onOpenDetail={onOpenDetail} />
    </section>
  );
}

function MeSection({
  section,
  notes,
  plans,
  favorites,
  destinations,
  interactions,
  onOpenNote,
  onCompose,
  onPlan,
  onOpenDestination,
  onOpenDetail,
  onOpenById,
  onGoTo,
}: {
  section: ImmersiveSection;
  notes: ImmersiveNote[];
  plans: ImmersivePlan[];
  favorites: string[];
  destinations: ImmersiveDestination[];
  interactions: ImmersiveInteraction[];
  onOpenNote: (note: ImmersiveNote) => void;
  onCompose: () => void;
  onPlan: () => void;
  onOpenDestination: (destination: ImmersiveDestination) => void;
  onOpenDetail: (data: DetailData) => void;
  onOpenById: (id: string) => void;
  onGoTo: (slug: string) => void;
}) {
  const savedDestinations = destinations.filter((item) => favorites.includes(item.id));

  return (
    <section id="section-me" className="imm-section imm-me">
      <div className="imm-me-glow" />
      <div className="imm-section-inner">
        <div className="imm-section-head" data-reveal>
          <div>
            <p {...clickableProps({ onClick: () => onOpenById("gallery-atlas"), className: "imm-eyebrow imm-eyebrow--accent", label: "查看旅行灵感图库" })}>
              <span /> {section.eyebrow}
            </p>
            <h2 {...clickableProps({ onClick: () => onOpenById("badge-walker"), className: "imm-section-title", label: "查看城市漫游者徽章" })}>{section.title}</h2>
          </div>
          <p {...clickableProps({ onClick: () => onOpenById("gallery-atlas"), className: "imm-section-lead", label: "阅读旅行手记导览" })}>{section.description}</p>
        </div>

        <div className="imm-me-grid">
          <article className="imm-profile-card" data-reveal>
            <div className="imm-profile-top">
              <span {...clickableProps({ onClick: () => onOpenById("badge-walker"), className: "imm-avatar", label: "查看我的旅行者档案" })}><User size={24} /></span>
              <div>
                <strong>旅行者，你好</strong>
                <span>把远方慢慢变成日常</span>
              </div>
              <span {...clickableProps({ onClick: () => onOpenById("badge-walker"), className: "imm-member", label: "查看拾程会员权益" })}><Sparkles size={14} /> 拾程会员</span>
            </div>
            <div className="imm-badges">
              <span {...clickableProps({ onClick: () => onOpenById("badge-walker"), label: "查看城市漫游者徽章" })}><Award size={13} /> 城市漫游者</span>
              <span {...clickableProps({ onClick: () => onOpenById("badge-axis"), label: "查看中轴线徽章" })}><Footprints size={13} /> 中轴线打卡</span>
              <span {...clickableProps({ onClick: () => onOpenById("badge-walker"), label: "查看早春出行徽章" })}><Sparkles size={13} /> 早春出行</span>
            </div>
            <div className="imm-profile-stats">
              <div {...clickableProps({ onClick: () => onGoTo("dest"), label: "前往目的地查看收藏" })}><strong>{favorites.length}</strong><span>收藏地点</span></div>
              <div {...clickableProps({ onClick: onPlan, label: "规划新行程" })}><strong>{plans.length}</strong><span>我的行程</span></div>
              <div {...clickableProps({ onClick: () => onOpenById("gallery-atlas"), label: "查看互动专题" })}><strong>{interactions.length}</strong><span>互动记录</span></div>
            </div>
            <button type="button" className="imm-primary-btn imm-primary-btn--full" onClick={onPlan}>
              规划下一段旅程 <ArrowRight size={16} />
            </button>
          </article>

          <article className="imm-panel" data-reveal>
            <div className="imm-panel-head">
              <div {...clickableProps({
                onClick: () => (savedDestinations.length ? onOpenDestination(savedDestinations[0]) : onGoTo("dest")),
                label: savedDestinations.length ? "查看第一个收藏地点" : "前往目的地收藏",
              })}><Bookmark size={17} /><strong>我的收藏</strong></div>
              <span>{savedDestinations.length} ITEMS</span>
            </div>
            {savedDestinations.length ? (
              <div className="imm-mini-list">
                {savedDestinations.map((item) => (
                  <button key={item.id} type="button" className="imm-mini-row" onClick={() => onOpenDestination(item)}>
                    <Photo src={item.image} alt={item.name} fallback={item.name} className="imm-mini-thumb" />
                    <span><strong>{item.name}</strong><small>{item.city} · {item.category}</small></span>
                    <ChevronRight size={16} />
                  </button>
                ))}
              </div>
            ) : (
              <div {...clickableProps({ onClick: () => onGoTo("dest"), className: "imm-panel-empty", label: "前往目的地收藏" })}>
                <Heart size={20} />
                <span>还没有收藏。点击这里到「目的地」点一下爱心吧。</span>
              </div>
            )}
          </article>

          <article className="imm-panel" data-reveal>
            <div className="imm-panel-head">
              <div {...clickableProps({ onClick: onPlan, label: "规划新行程" })}><CalendarDays size={17} /><strong>我的行程</strong></div>
              <span>{plans.length} PLANS</span>
            </div>
            {plans.length ? (
              <div className="imm-timeline">
                {plans.slice(0, 4).map((plan) => (
                  <div
                    key={plan.id}
                    {...clickableProps({
                      onClick: () => {
                        const match = destinations.find((item) => item.name === plan.destination || item.city === plan.destination);
                        if (match) onOpenDestination(match);
                        else onOpenById("route-axis");
                      },
                      className: "imm-timeline-row",
                      label: `查看${plan.destination}详情`,
                    })}
                  >
                    <span className="imm-timeline-dot" />
                    <div>
                      <strong>{plan.destination}</strong>
                      <small>{formatDate(plan.startDate)} — {formatDate(plan.endDate)} · {plan.travelers} 人 · {plan.style}</small>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div {...clickableProps({ onClick: onPlan, className: "imm-panel-empty", label: "规划第一段行程" })}>
                <Compass size={20} />
                <span>还没有行程。点击这里先选一个想去的地方。</span>
              </div>
            )}
          </article>
        </div>

        <div className="imm-notes-head" data-reveal>
          <div {...clickableProps({ onClick: onCompose, label: "写下我的手记" })}>
            <span className="imm-eyebrow imm-eyebrow--accent">NOTES FROM THE ROAD</span>
            <h3>让别人的故事，成为你的下一站。</h3>
          </div>
          <button type="button" className="imm-ghost-btn imm-ghost-btn--dark" onClick={onCompose}>
            <PenLine size={16} /> 写下我的手记
          </button>
        </div>

        <div className="imm-notes-grid" data-reveal>
          {notes.slice(0, 4).map((note) => (
            <button key={note.id} type="button" className="imm-note-card" onClick={() => onOpenNote(note)}>
              <Photo src={note.image} alt={note.title} fallback={note.title} className="imm-note-thumb" />
              <span className="imm-note-body">
                <small>{note.author} · {note.category}</small>
                <strong>{note.title}</strong>
                <span>{note.body}</span>
                <em><Heart size={13} /> {note.likes.toLocaleString("zh-CN")}</em>
              </span>
            </button>
          ))}
        </div>

        <div className="imm-about" data-reveal>
          <div {...clickableProps({ onClick: () => onOpenById("dest-nanluoguxiang"), className: "imm-about-media", label: "查看南锣鼓巷详情" })}>
            <Photo src="/photos/nanluoguxiang.jpg" alt="南锣鼓巷的胡同日常" fallback="南锣鼓巷" imageClassName="imm-about-media-inner" />
          </div>
          <div>
            <span {...clickableProps({ onClick: () => onOpenById("gallery-atlas"), className: "imm-eyebrow imm-eyebrow--accent", label: "关于拾程" })}>ABOUT SHICHENG</span>
            <h3 {...clickableProps({ onClick: () => onOpenById("gallery-atlas"), label: "阅读拾程旅行理念" })}>把远方的风景，变成生活的一部分。</h3>
            <p {...clickableProps({ onClick: () => onOpenById("gallery-atlas"), label: "阅读拾程故事" })}>拾程相信，旅行不只是抵达一个地点。它是走进一条陌生街巷的好奇，是在城市转角遇见的微光，也是把每一次出发慢慢整理成自己的故事。</p>
            <div className="imm-about-values">
              <span {...clickableProps({ onClick: () => onOpenById("gallery-atlas"), label: "探索旅行灵感" })}><b>01</b> 灵感发现</span>
              <span {...clickableProps({ onClick: onPlan, label: "开始从容规划" })}><b>02</b> 从容规划</span>
              <span {...clickableProps({ onClick: onCompose, label: "写下真实记录" })}><b>03</b> 真实记录</span>
            </div>
          </div>
        </div>
      </div>
      <StayCollection onOpenDetail={onOpenDetail} />
      <BadgeStrip onOpenDetail={onOpenDetail} />
    </section>
  );
}

function OverlayLayer({
  overlay,
  onClose,
  destinations,
  favorites,
  onFavorite,
  onPlan,
  onNote,
  onOpenDetailById,
  onOpenPlanner,
}: {
  overlay: OverlayState;
  onClose: () => void;
  destinations: ImmersiveDestination[];
  favorites: string[];
  onFavorite: (destination: ImmersiveDestination) => void;
  onPlan: (input: {
    destination: string;
    startDate: string;
    endDate: string;
    travelers: number;
    style: "从容" | "深度" | "轻探险" | "亲子";
  }) => Promise<void>;
  onNote: (input: { title: string; body: string; author: string }) => Promise<void>;
  onOpenDetailById: (id: string) => void;
  onOpenPlanner: (destination?: string) => void;
}) {
  useLockBodyScroll(Boolean(overlay));

  useEffect(() => {
    if (!overlay) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [overlay, onClose]);

  if (!overlay) return null;

  if (overlay.kind === "detail") {
    const detail = overlay.data;
    const linkedDestination = detail.id.startsWith("dest-")
      ? destinations.find((item) => item.id === detail.id.slice(5))
      : undefined;
    return (
      <DetailPageView
        data={detail}
        onClose={onClose}
        onOpenRelated={onOpenDetailById}
        onPlan={(destination) => onOpenPlanner(destination)}
        onFavorite={linkedDestination ? () => onFavorite(linkedDestination) : undefined}
        saved={linkedDestination ? favorites.includes(linkedDestination.id) : false}
      />
    );
  }

  if (overlay.kind === "destination") {
    const destination = overlay.destination;
    const saved = favorites.includes(destination.id);
    return (
      <div className="imm-overlay" role="dialog" aria-modal="true" aria-label={`${destination.name}详情`}>
        <button type="button" className="imm-backdrop" onClick={onClose} aria-label="关闭" />
        <div className="imm-drawer">
          <div className="imm-overlay-head">
            <span>DESTINATION / {destination.city}</span>
            <button type="button" onClick={onClose} aria-label="关闭"><X size={19} /></button>
          </div>
          <div className="imm-detail-hero">
            <Photo src={destination.image} alt={destination.name} fallback={destination.name} className="imm-detail-image" />
          </div>
          <div className="imm-drawer-body">
            <div className="imm-detail-meta">
              <span><Star size={14} fill="currentColor" /> {destination.rating.toFixed(1)}</span>
              <span><Clock size={14} /> {destination.hours || "全天开放"}</span>
            </div>
            <h2>{destination.name}</h2>
            <p className="imm-detail-tagline">{destination.tagline}</p>
            <div className="imm-detail-tags">
              {destination.tags.map((tag) => <em key={tag}>{tag}</em>)}
            </div>
            <p className="imm-detail-desc">{destination.description}</p>
            <div className="imm-detail-facts">
              <div><span>位置</span><strong><MapPin size={14} /> {destination.city}</strong></div>
              <div><span>分类</span><strong>{destination.category}</strong></div>
            </div>
          </div>
          <div className="imm-overlay-foot">
            <button type="button" className="imm-ghost-btn" onClick={() => onFavorite(destination)}>
              <Heart size={16} fill={saved ? "currentColor" : "none"} /> {saved ? "已收藏" : "收藏"}
            </button>
            <button type="button" className="imm-primary-btn" onClick={onClose}>
              返回探索 <ArrowRight size={16} />
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (overlay.kind === "route") {
    const route = overlay.route;
    const destination = destinations.find((item) => item.id === route.destinationId);
    return (
      <div className="imm-overlay" role="dialog" aria-modal="true" aria-label={`${route.title}详情`}>
        <button type="button" className="imm-backdrop" onClick={onClose} aria-label="关闭" />
        <div className="imm-modal imm-modal--route">
          <div className="imm-overlay-head">
            <span>CURATED ROUTE / {route.duration}</span>
            <button type="button" onClick={onClose} aria-label="关闭"><X size={19} /></button>
          </div>
          <Photo src={route.image} alt={route.title} fallback={route.title} className="imm-modal-image" />
          <div className="imm-modal-body">
            <h2>{route.title}</h2>
            <p>{route.subtitle}</p>
            <div className="imm-route-steps">
              <span><b>01</b> 抵达 {destination?.name ?? "目的地"}</span>
              <span><b>02</b> 沿主题路线慢行</span>
              <span><b>03</b> 留一段空白给偶遇</span>
            </div>
            <button type="button" className="imm-primary-btn imm-primary-btn--full" onClick={onClose}>
              我知道了 <Check size={16} />
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (overlay.kind === "note") {
    const note = overlay.note;
    return (
      <div className="imm-overlay" role="dialog" aria-modal="true" aria-label={`${note.title}详情`}>
        <button type="button" className="imm-backdrop" onClick={onClose} aria-label="关闭" />
        <div className="imm-modal">
          <div className="imm-overlay-head">
            <span>TRAVEL NOTE / {note.category}</span>
            <button type="button" onClick={onClose} aria-label="关闭"><X size={19} /></button>
          </div>
          <Photo src={note.image} alt={note.title} fallback={note.title} className="imm-modal-image" />
          <div className="imm-modal-body">
            <small>{note.author} · {formatDate(note.createdAt)}</small>
            <h2>{note.title}</h2>
            <p>{note.body}</p>
            <div className="imm-note-likes"><Heart size={15} /> {note.likes.toLocaleString("zh-CN")} 人喜欢</div>
          </div>
        </div>
      </div>
    );
  }

  if (overlay.kind === "compose") {
    return <ComposeModal onClose={onClose} onSubmit={onNote} />;
  }

  return <PlannerDrawer onClose={onClose} destinations={destinations} initialDestination={overlay.destination} onSubmit={onPlan} />;
}

function PlannerDrawer({
  onClose,
  destinations,
  initialDestination,
  onSubmit,
}: {
  onClose: () => void;
  destinations: ImmersiveDestination[];
  initialDestination?: string;
  onSubmit: (input: {
    destination: string;
    startDate: string;
    endDate: string;
    travelers: number;
    style: "从容" | "深度" | "轻探险" | "亲子";
  }) => Promise<void>;
}) {
  const [destination, setDestination] = useState(initialDestination ?? destinations[0]?.name ?? "北京");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [travelers, setTravelers] = useState(2);
  const [style, setStyle] = useState<"从容" | "深度" | "轻探险" | "亲子">("从容");
  const [submitting, setSubmitting] = useState(false);

  async function submit() {
    setSubmitting(true);
    try {
      await onSubmit({ destination, startDate, endDate, travelers, style });
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="imm-overlay" role="dialog" aria-modal="true" aria-label="行程规划">
      <button type="button" className="imm-backdrop" onClick={onClose} aria-label="关闭" />
      <div className="imm-drawer imm-drawer--form">
        <div className="imm-overlay-head">
          <span>TRIP PLANNER / 行程规划</span>
          <button type="button" onClick={onClose} aria-label="关闭"><X size={19} /></button>
        </div>
        <div className="imm-drawer-body">
          <h2>把想去的地方，串成一段旅程。</h2>
          <p className="imm-form-lead">填写几个简单偏好，我们会把这段计划保存到「我的」。</p>
          <label className="imm-form-field">
            <span>目的地</span>
            <select value={destination} onChange={(event) => setDestination(event.target.value)}>
              {Array.from(new Set([destination, ...destinations.map((item) => item.name)])).map((name) => (
                <option key={name} value={name}>{name}</option>
              ))}
            </select>
          </label>
          <div className="imm-form-row">
            <label className="imm-form-field">
              <span>出发日期</span>
              <input type="date" value={startDate} onChange={(event) => setStartDate(event.target.value)} />
            </label>
            <label className="imm-form-field">
              <span>返程日期</span>
              <input type="date" value={endDate} min={startDate || undefined} onChange={(event) => setEndDate(event.target.value)} />
            </label>
          </div>
          <div className="imm-form-field">
            <span>出行人数</span>
            <div className="imm-stepper">
              <button type="button" onClick={() => setTravelers((value) => Math.max(1, value - 1))} aria-label="减少人数"><Minus size={16} /></button>
              <strong>{travelers} 人</strong>
              <button type="button" onClick={() => setTravelers((value) => Math.min(12, value + 1))} aria-label="增加人数"><Plus size={16} /></button>
            </div>
          </div>
          <div className="imm-form-field">
            <span>旅行节奏</span>
            <div className="imm-style-chips">
              {(["从容", "深度", "轻探险", "亲子"] as const).map((item) => (
                <button key={item} type="button" className={cn("imm-chip", style === item && "is-active")} onClick={() => setStyle(item)} aria-pressed={style === item}>
                  {item}
                </button>
              ))}
            </div>
          </div>
        </div>
        <div className="imm-overlay-foot">
          <button type="button" className="imm-ghost-btn" onClick={onClose}>取消</button>
          <button type="button" className="imm-primary-btn" onClick={() => void submit()} disabled={submitting}>
            {submitting ? "保存中…" : "保存行程"} <Send size={16} />
          </button>
        </div>
      </div>
    </div>
  );
}

function ComposeModal({
  onClose,
  onSubmit,
}: {
  onClose: () => void;
  onSubmit: (input: { title: string; body: string; author: string }) => Promise<void>;
}) {
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [author, setAuthor] = useState("旅行者");
  const [submitting, setSubmitting] = useState(false);

  async function submit() {
    setSubmitting(true);
    try {
      await onSubmit({ title, body, author });
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="imm-overlay" role="dialog" aria-modal="true" aria-label="发布旅行手记">
      <button type="button" className="imm-backdrop" onClick={onClose} aria-label="关闭" />
      <div className="imm-modal imm-modal--compose">
        <div className="imm-overlay-head">
          <span>WRITE A NOTE / 旅行手记</span>
          <button type="button" onClick={onClose} aria-label="关闭"><X size={19} /></button>
        </div>
        <div className="imm-modal-body">
          <h2>写下这一段旅程</h2>
          <label className="imm-form-field">
            <span>标题</span>
            <input value={title} onChange={(event) => setTitle(event.target.value)} placeholder="给这段故事起个名字" maxLength={80} />
          </label>
          <label className="imm-form-field">
            <span>署名</span>
            <input value={author} onChange={(event) => setAuthor(event.target.value)} maxLength={40} />
          </label>
          <label className="imm-form-field">
            <span>正文</span>
            <textarea value={body} onChange={(event) => setBody(event.target.value)} rows={5} placeholder="今天遇到了什么值得记住的事？" maxLength={600} />
          </label>
          <button
            type="button"
            className="imm-primary-btn imm-primary-btn--full"
            disabled={submitting || title.trim().length < 2 || body.trim().length < 4}
            onClick={() => void submit()}
          >
            {submitting ? "发布中…" : "发布手记"} <Send size={16} />
          </button>
        </div>
      </div>
    </div>
  );
}
