import { Link, useRouterState } from "@tanstack/react-router";
import {
  CalendarDays,
  ChevronLeft,
  Compass,
  Heart,
  Home,
  Moon,
  Sun,
  User,
} from "lucide-react";
import { useEffect, useState } from "react";
import { Toaster, toast } from "sonner";
import { ComposeSheet } from "@/components/compose-sheet";
import { covers } from "@/data/content";
import { cn, tap } from "@/lib/cn";
import { useTrip } from "@/store/use-trip";

const tabs = [
  { to: "/home", label: "首页", icon: Home },
  { to: "/dest", label: "目的地", icon: Compass },
  { to: "/trips", label: "行程", icon: CalendarDays },
  { to: "/me", label: "我的", icon: User },
] as const;

const homeSections = [
  { id: "section-home", label: "首页", number: "01" },
  { id: "section-dest", label: "目的地", number: "02" },
  { id: "section-guide", label: "攻略", number: "03" },
  { id: "section-about", label: "关于我们", number: "04" },
] as const;

function scrollToHomeSection(id: string) {
  document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" });
}

function ThemeToggle() {
  const [dark, setDark] = useState(false);

  useEffect(() => {
    const saved = window.localStorage.getItem("shicheng-theme");
    const prefersDark = window.matchMedia ? window.matchMedia("(prefers-color-scheme: dark)").matches : false;
    const next = saved ? saved === "dark" : prefersDark;
    setDark(next);
    document.documentElement.dataset.theme = next ? "dark" : "light";
    document.querySelector('meta[name="theme-color"]')?.setAttribute("content", next ? "#1D2932" : "#F4F2EC");
  }, []);

  function toggle() {
    const next = !dark;
    setDark(next);
    document.documentElement.dataset.theme = next ? "dark" : "light";
    document.querySelector('meta[name="theme-color"]')?.setAttribute("content", next ? "#1D2932" : "#F4F2EC");
    window.localStorage.setItem("shicheng-theme", next ? "dark" : "light");
  }

  return (
    <button
      type="button"
      onClick={toggle}
      aria-label={dark ? "切换到日间模式" : "切换到夜间模式"}
      title={dark ? "日间模式" : "夜间模式"}
      className="theme-toggle"
      data-popup-ignore
    >
      {dark ? <Sun className="size-[18px]" /> : <Moon className="size-[18px]" />}
    </button>
  );
}

function SiteHeader() {
  const pathname = useRouterState({ select: (state) => state.location.pathname });
  const [activeSection, setActiveSection] = useState("section-home");
  useEffect(() => {
    if (pathname !== "/home") return;
    const nodes = homeSections.map((item) => document.getElementById(item.id)).filter(Boolean) as HTMLElement[];
    if (!nodes.length) return;
    const observer = new IntersectionObserver((entries) => {
      const visible = entries.filter((entry) => entry.isIntersecting).sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];
      if (visible) setActiveSection(visible.target.id);
    }, { rootMargin: "-22% 0px -55% 0px", threshold: [0, .15, .35, .6] });
    nodes.forEach((node) => observer.observe(node));
    return () => observer.disconnect();
  }, [pathname]);
  return (
    <>
      <a className="skip-link" href="#main-content">跳到主要内容</a>
      <div className="site-header-wrap">
        <nav className="site-header" aria-label="网站工具栏">
          <Link to="/home" className="site-brand" aria-label="拾程首页">
            <span className="site-brand-mark">拾</span>
            <span className="site-brand-word">拾程<span>SHICHENG</span></span>
          </Link>
          <div className="site-nav-links" aria-label="主导航">
            {pathname === "/home" ? homeSections.map((item) => (
              <button key={item.id} type="button" data-popup-ignore onClick={() => scrollToHomeSection(item.id)} className={cn("site-nav-link", activeSection === item.id && "is-active")} aria-current={activeSection === item.id ? "location" : undefined}>{item.label}</button>
            )) : tabs.map((item) => (
              <Link key={item.to} to={item.to} className={cn("site-nav-link", isPrimaryTabActive(pathname, item.to) && "is-active")} aria-current={isPrimaryTabActive(pathname, item.to) ? "page" : undefined}>{item.label}</Link>
            ))}
          </div>
          <div className="site-header-actions">
            <ThemeToggle />
            <Link to="/plan" search={{}} className="site-header-cta">开始规划 <span aria-hidden="true">↗</span></Link>
          </div>
        </nav>
      </div>
    </>
  );
}

function isPrimaryTabActive(pathname: string, to: (typeof tabs)[number]["to"]) {
  if (to === "/home") return pathname === "/home";
  if (to === "/dest") return pathname === "/dest" || pathname.startsWith("/spot/") || pathname === "/rank";
  if (to === "/trips") return pathname === "/trips" || pathname.startsWith("/plan") || pathname.startsWith("/hotel/");
  return pathname === "/me" || pathname.startsWith("/companions");
}

function RightNavigation() {
  const pathname = useRouterState({ select: (state) => state.location.pathname });
  return (
    <nav className="site-right-nav" aria-label="主导航">
      <span className="site-right-nav-label">MENU</span>
      {tabs.map((item, index) => {
        const Icon = item.icon;
        const active = isPrimaryTabActive(pathname, item.to);
        return (
          <Link
            key={item.to}
            to={item.to}
            className={cn("site-right-nav-link", active && "is-active")}
            aria-current={active ? "page" : undefined}
            title={item.label}
          >
            <Icon size={18} strokeWidth={1.7} />
            <span>{item.label}</span>
            <small>0{index + 1}</small>
          </Link>
        );
      })}
      <span className="site-right-nav-foot" aria-hidden="true">SC</span>
    </nav>
  );
}

function SiteFooter() {
  return (
    <footer className="site-footer">
      <div className="site-footer-inner">
        <div className="site-footer-brand">
          <span className="site-brand-mark">拾</span>
          <div><strong>拾程 SHICHENG</strong><p>把每一次出发，变成值得记住的故事。</p></div>
        </div>
        <div className="site-footer-links">
          <div><strong>探索</strong><Link to="/dest">目的地</Link><Link to="/rank" search={{ cat: "all" }}>灵感榜单</Link></div>
          <div><strong>规划</strong><Link to="/plan" search={{}}>智能规划</Link><Link to="/trips">我的行程</Link></div>
          <div><strong>关于拾程</strong><Link to="/me">个人档案</Link><Link to="/companions">寻找同行人</Link></div>
        </div>
      </div>
      <div className="site-footer-bottom"><span>© 2026 SHICHENG · TRAVEL WITH INTENTION</span><span>慢一点，也能抵达更多。</span></div>
    </footer>
  );
}

function TabLink({
  to,
  label,
  icon: Icon,
  active,
}: {
  to: "/home" | "/dest" | "/trips" | "/me";
  label: string;
  icon: typeof Home;
  active: boolean;
}) {
  return (
    <Link
      to={to}
      aria-label={label}
      aria-current={active ? "page" : undefined}
      className={cn(
        "flex min-h-12 flex-col items-center justify-center gap-0.5 rounded-xl text-xs",
        active ? "text-cinnabar" : "text-mute",
        tap,
      )}
    >
      <Icon className="size-5" strokeWidth={1.75} />
      {label}
    </Link>
  );
}

function TabBar() {
  const pathname = useRouterState({ select: (state) => state.location.pathname });
  if (pathname === "/home") return (
    <nav aria-label="页面章节导航" className="mobile-tabbar safe-bottom home-mobile-nav">
      {homeSections.map((item) => <button key={item.id} type="button" data-popup-ignore onClick={() => scrollToHomeSection(item.id)}>{item.label}</button>)}
    </nav>
  );
  return (
    <nav aria-label="移动端主导航" className="mobile-tabbar safe-bottom">
      <div className="mx-auto grid max-w-md grid-cols-4">{tabs.map((item) => <TabLink key={item.to} {...item} active={isPrimaryTabActive(pathname, item.to)} />)}</div>
    </nav>
  );
}

function getActionDetail(title: string, section: string, isMap: boolean) {
  if (isMap) return {
    eyebrow: "3D 城市地图",
    description: "从高空视角浏览城市肌理、河道与地标分布，帮助你快速建立方位感。当前地图用于旅行灵感展示，真实道路、开放状态与导航请以地图服务为准。",
    highlights: ["城市地标", "街区肌理", "路线灵感"],
  };
  const rules: [RegExp, string, string[]][] = [
    [/收藏|喜欢/, "已为你整理收藏线索", ["收藏清单", "稍后再看", "行程备选"]],
    [/规划|生成路线|行程/, "把想去的地方串成一段旅程", ["日期与人数", "旅行节奏", "路线安排"]],
    [/搜索|查找|筛选/, "缩小范围，发现更合适的选择", ["目的地", "主题偏好", "精选推荐"]],
    [/酒店|房型|预订|入住/, "查看住宿相关信息", ["位置与交通", "房型设施", "入住须知"]],
    [/资料|设置|账户|会员/, "管理你的拾程旅行档案", ["个人资料", "偏好设置", "旅行记录"]],
    [/分享|邀请|同行/, "让旅程也能与同伴共享", ["同行邀请", "行程分享", "出行提醒"]],
    [/游记|故事|发布|写下/, "记录旅途中值得记住的片刻", ["添加照片", "写下故事", "保存草稿"]],
  ];
  const matched = rules.find(([pattern]) => pattern.test(title));
  const eyebrow = matched?.[1] ?? `继续探索「${section}」`;
  const highlights = matched?.[2] ?? ["相关介绍", "实用信息", "精选建议"];
  return {
    eyebrow,
    highlights,
    description: `你选择了「${title}」。这里为你展开与「${section}」相关的内容摘要，包含实用信息与下一步建议；你可以先了解重点，再回到页面继续操作。`,
  };
}

export function Stage({
  children,
  tabs = true,
  wide = true,
  header = true,
}: {
  children: React.ReactNode;
  tabs?: boolean;
  wide?: boolean;
  header?: boolean;
}) {
  const pathname = useRouterState({ select: (state) => state.location.pathname });
  const setCompose = useTrip((state) => state.setCompose);
  const [actionPopup, setActionPopup] = useState<{
    title: string;
    section: string;
    description: string;
    isMap: boolean;
    highlights: string[];
    eyebrow: string;
  } | null>(null);

  useEffect(() => {
    const onAction = (event: MouseEvent) => {
      const target = event.target;
      if (!(target instanceof Element)) return;
      const button = target.closest("button");
      if (!button || button.disabled) return;
      if (
        button.type === "submit" ||
        button.closest('[role="dialog"], [aria-modal="true"], .mobile-tabbar, .site-right-nav, form') ||
        button.hasAttribute("aria-pressed") ||
        button.hasAttribute("data-popup-ignore") ||
        button.getAttribute("aria-label")?.includes("关闭")
      ) return;

      const title = (button.getAttribute("aria-label") || button.innerText || button.title || "查看详情").trim().replace(/\\s+/g, " ");
      if (!title) return;
      const section = button.closest("section, article, aside, main") || button.parentElement;
      const heading = section?.querySelector("h1, h2, h3");
      const sectionTitle = heading?.textContent?.trim() || "拾程 · 旅行灵感";
      const isMap = /地图|路线|足迹|周边|导航/.test(title);
      const detail = getActionDetail(title, sectionTitle, isMap);
      setActionPopup({ title, section: sectionTitle, isMap, ...detail });
    };
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setActionPopup(null);
    };
    document.addEventListener("click", onAction);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("click", onAction);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, []);

  useEffect(() => {
    void useTrip.persist.rehydrate();
  }, []);

  useEffect(() => {
    setCompose(false);
  }, [pathname, setCompose]);

  return (
    <div className={cn("site-app min-h-dvh bg-paper text-ink", pathname === "/home" && "is-home")}>
      {header ? <SiteHeader /> : null}
      <div id="main-content" className={cn("site-canvas relative mx-auto min-h-[calc(100dvh-76px)] w-full", wide ? "max-w-none" : "max-w-md")}>
        {children}
      </div>
      {header ? <SiteFooter /> : null}
      {tabs ? <TabBar /> : null}
      <ComposeSheet covers={covers} />
      {actionPopup ? (
        <div className="sc-action-backdrop" role="presentation" onMouseDown={(event) => {
          if (event.target === event.currentTarget) setActionPopup(null);
        }}>
          <section className="sc-action-dialog" role="dialog" aria-modal="true" aria-labelledby="sc-action-title">
            <div className="sc-action-topline"><span>SHICHENG · QUICK VIEW</span><button type="button" data-popup-ignore onClick={() => setActionPopup(null)} aria-label="关闭弹出页面">×</button></div>
            <p className="sc-action-context">{actionPopup.section}</p>
            <h2 id="sc-action-title">{actionPopup.title}</h2>
            <p className="sc-action-description">{actionPopup.description}</p>
            {actionPopup.isMap ? (
              <>
                <img className="sc-action-map" src="/photos/3d-map.png" alt="北京河道、古建筑与城市街区的 3D 实景风格地图" />
                <div className="sc-action-map-note"><span>3D 城市视角</span><span>示意地图 · 非实时导航</span></div>
              </>
            ) : (
              <div className="sc-action-detail">
                <span className="sc-action-orbit" aria-hidden="true">拾</span>
                <div className="sc-action-detail-copy"><strong>{actionPopup.eyebrow}</strong><small>{actionPopup.highlights.join(" · ")}</small></div>
              </div>
            )}
            {!actionPopup.isMap ? (
              <div className="sc-action-highlights">
                {actionPopup.highlights.map((item) => <span key={item}>{item}</span>)}
              </div>
            ) : null}
            <div className="sc-action-footer"><span>让每一次出发，都有迹可循。</span><button type="button" data-popup-ignore onClick={() => setActionPopup(null)}>我知道了 <span>↗</span></button></div>
          </section>
        </div>
      ) : null}
      <Toaster position="top-center" toastOptions={{ classNames: { toast: "bg-card text-ink border border-line font-sans shadow-lift" } }} />
    </div>
  );
}

export function BackButton({ onClick, light = false }: { onClick: () => void; light?: boolean }) {
  return (
    <button type="button" aria-label="返回" onClick={onClick} className={cn("flex size-11 items-center justify-center rounded-full shadow-soft", light ? "bg-card text-ink" : "bg-card text-ink ring-1 ring-line", tap)}>
      <ChevronLeft className="size-5" strokeWidth={1.75} />
    </button>
  );
}

export function HeartButton({ active, onClick, light = false, label }: { active: boolean; onClick: () => void; light?: boolean; label?: string }) {
  return (
    <button type="button" aria-label={active ? "取消收藏" : label ?? "收藏"} aria-pressed={active} onClick={onClick} className={cn("flex size-11 items-center justify-center rounded-full shadow-soft", light ? "bg-card" : "bg-card ring-1 ring-line", tap)}>
      <Heart className={cn("size-5", active ? "fill-cinnabar text-cinnabar" : "text-ink")} fill={active ? "currentColor" : "none"} strokeWidth={1.75} />
    </button>
  );
}

export function Seal({ className }: { className?: string }) {
  return <span className={cn("inline-flex size-10 items-center justify-center border border-cinnabar font-serif text-lg text-cinnabar", className)}>程</span>;
}

export function notify(message: string) {
  toast(message);
}
