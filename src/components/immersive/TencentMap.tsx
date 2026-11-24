import { useEffect, useMemo, useRef, useState } from "react";
import { ArrowUpRight, Crosshair, Minus, Plus, RotateCcw } from "lucide-react";
import { cn } from "@/lib/cn";
import type { ImmersiveDestination } from "@/lib/immersive/types";
import { BeijingVectorMap, type VectorMapHandle } from "./BeijingVectorMap";

/**
 * 合规地图组件（腾讯地图为默认服务商）。
 * 有本地代理时加载腾讯地图 GL 真实瓦片；无代理时展示 2.5D 倾斜视角的北京影像地图，
 * 地标按真实经纬度相对定位，支持拖拽平移、滚轮/按钮缩放、聚焦与路线连线。
 * 前端不携带任何地图密钥。
 */
declare global {
  interface Window {
    TMap?: any;
  }
}

type Attraction = {
  id: string;
  name: string;
  lat: number;
  lng: number;
  image: string;
  tagline: string;
};

type MapCategory = {
  id: string;
  tab: string;
  caption: string;
  kicker: string;
  title: string;
  description: string;
  center: { lat: number; lng: number };
  zoom: number;
  fallbackImage: string;
  attractions: Attraction[];
};

const categories: MapCategory[] = [
  {
    id: "popular",
    tab: "热门地标",
    caption: "BEIJING LANDMARKS · 北京热门地标",
    kicker: "EXPLORE MAP · 01 / 04",
    title: "从地图认识北京",
    description: "故宫、天安门、大会堂、国博与坛庙按真实坐标落在同一张地图上。",
    center: { lat: 39.914, lng: 116.397 },
    zoom: 12,
    fallbackImage: "/photos/beijing-atlas.jpg",
    attractions: [
      { id: "palace", name: "故宫博物院", lat: 39.9163, lng: 116.3972, image: "/photos/palace.jpg", tagline: "沿着红墙，走进六百年" },
      { id: "tiananmen", name: "天安门广场", lat: 39.9055, lng: 116.3976, image: "/photos/tiananmen.jpg", tagline: "在广场中央，读懂城市的尺度" },
      { id: "great-hall", name: "人民大会堂", lat: 39.9045, lng: 116.395, image: "/photos/great-hall.jpg", tagline: "夜色里的庄严与秩序" },
      { id: "national-museum", name: "中国国家博物馆", lat: 39.9042, lng: 116.401, image: "/photos/national-museum.jpg", tagline: "把一个下午交给上下五千年" },
    ],
  },
  {
    id: "axis",
    tab: "中轴线",
    caption: "CENTRAL AXIS · 北京中轴线",
    kicker: "EXPLORE MAP · 02 / 04",
    title: "一条线，看懂北京",
    description: "从永定门到钟鼓楼，故宫与天坛沿中轴线依次展开。",
    center: { lat: 39.91, lng: 116.398 },
    zoom: 13,
    fallbackImage: "/photos/tiananmen.jpg",
    attractions: [
      { id: "tiananmen", name: "天安门", lat: 39.9055, lng: 116.3976, image: "/photos/tiananmen.jpg", tagline: "广场与城楼构成城市的正面" },
      { id: "palace", name: "故宫博物院", lat: 39.9163, lng: 116.3972, image: "/photos/palace.jpg", tagline: "六百年的秩序压在一条线上" },
      { id: "heaven", name: "天坛公园", lat: 39.8822, lng: 116.4066, image: "/photos/heaven.jpg", tagline: "圆形与蓝色写成的建筑" },
    ],
  },
  {
    id: "gardens",
    tab: "皇家园林",
    caption: "IMPERIAL GARDENS · 皇家园林",
    kicker: "EXPLORE MAP · 03 / 04",
    title: "湖面与遗址之间",
    description: "颐和园与圆明园相距不远，却呈现皇家园林的两种时间。",
    center: { lat: 40.003, lng: 116.287 },
    zoom: 12,
    fallbackImage: "/photos/summer.jpg",
    attractions: [
      { id: "summer", name: "颐和园", lat: 39.9999, lng: 116.2755, image: "/photos/summer.jpg", tagline: "昆明湖把天空摊平" },
      { id: "yuanmingyuan", name: "圆明园", lat: 40.008, lng: 116.298, image: "/photos/yuanmingyuan.jpg", tagline: "在遗址前，看见时间的重量" },
    ],
  },
  {
    id: "lanes",
    tab: "胡同水岸",
    caption: "HUTONG & WATER · 胡同水岸",
    kicker: "EXPLORE MAP · 04 / 04",
    title: "老城的日常尺度",
    description: "什刹海与南锣鼓巷，把水面和胡同接在一起。",
    center: { lat: 39.939, lng: 116.393 },
    zoom: 14,
    fallbackImage: "/photos/shichahai.jpg",
    attractions: [
      { id: "shichahai", name: "什刹海", lat: 39.9407, lng: 116.383, image: "/photos/shichahai.jpg", tagline: "银锭桥上看后海的灯" },
      { id: "nanluoguxiang", name: "南锣鼓巷", lat: 39.9366, lng: 116.403, image: "/photos/nanluoguxiang.jpg", tagline: "在鱼骨胡同里，走进老城日常" },
    ],
  },
];

const SDK_URL = "https://map.qq.com/api/gljs?v=1.exp";

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

/**
 * 腾讯地图 GL 需要 WorkBuddy 提供的本地地图代理。
 * 未注入或仍是占位符时，使用 2.5D 影像地图，避免无效鉴权请求。
 */
const proxyHost = (() => {
  const value = (import.meta.env.VITE_TMAP_PROXY_HOST as string | undefined)?.trim() ?? "";
  if (!value || value.includes("__WB_") || /placeholder/i.test(value)) return null;
  return value.replace(/\/$/, "");
})();

let sdkPromise: Promise<void> | null = null;

function loadTMapSdk(): Promise<void> {
  if (typeof window === "undefined") return Promise.reject(new Error("SSR"));
  if (!proxyHost) return Promise.reject(new Error("map proxy unavailable"));
  if (window.TMap) return Promise.resolve();
  if (sdkPromise) return sdkPromise;

  sdkPromise = new Promise<void>((resolve, reject) => {
    const existing = document.querySelector<HTMLScriptElement>(`script[data-tmap-sdk="true"]`);
    if (existing) {
      existing.addEventListener("load", () => resolve());
      existing.addEventListener("error", () => reject(new Error("TMap SDK load failed")));
      return;
    }

    const config = document.createElement("script");
    config.type = "text/javascript";
    config.text = `window._TMapSecurityConfig = { serviceHost: ${JSON.stringify(proxyHost)} };`;
    document.head.appendChild(config);

    const script = document.createElement("script");
    script.src = SDK_URL;
    script.async = true;
    script.dataset.tmapSdk = "true";
    script.onload = () => resolve();
    script.onerror = () => reject(new Error("TMap SDK load failed"));
    document.head.appendChild(script);
  });

  return sdkPromise;
}

function markerIcon(active: boolean) {
  const fill = active ? "#B83C32" : "#D9B879";
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="34" height="42" viewBox="0 0 34 42"><path d="M17 1C8.7 1 2 7.7 2 16c0 10.5 15 25 15 25s15-14.5 15-25C32 7.7 25.3 1 17 1Z" fill="${fill}" stroke="#FFFFFF" stroke-width="2"/><circle cx="17" cy="16" r="5.5" fill="#FFFFFF"/></svg>`;
  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
}

export function TencentMap({
  mode,
  destinations,
  onOpenDestination,
  onMapTrack,
}: {
  mode: "light" | "dark";
  destinations: ImmersiveDestination[];
  onOpenDestination: (destination: ImmersiveDestination) => void;
  onMapTrack: (view?: string) => void;
}) {
  const [categoryIndex, setCategoryIndex] = useState(0);
  const category = categories[categoryIndex];
  const [activeId, setActiveId] = useState(category.attractions[0].id);
  const [status, setStatus] = useState<"loading" | "ready" | "fallback">("loading");
  const vectorRef = useRef<VectorMapHandle>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<any>(null);
  const markersRef = useRef<any>(null);
  const labelsRef = useRef<any>(null);
  const routeRef = useRef<any>(null);

  const active = useMemo(
    () => category.attractions.find((item) => item.id === activeId) ?? category.attractions[0],
    [category, activeId],
  );
  const destination = destinations.find((item) => item.id === active.id);

  useEffect(() => {
    let disposed = false;
    let timeout: number | undefined;

    loadTMapSdk()
      .then(() => {
        if (disposed || !containerRef.current || !window.TMap) return;
        const TMap = window.TMap;
        const map = new TMap.Map(containerRef.current, {
          center: new TMap.LatLng(category.center.lat, category.center.lng),
          zoom: category.zoom,
        });
        mapRef.current = map;

        let tilesLoaded = false;
        map.on("tilesloaded", () => {
          if (disposed) return;
          tilesLoaded = true;
          setStatus("ready");
        });
        timeout = window.setTimeout(() => {
          if (!disposed && !tilesLoaded) setStatus("fallback");
        }, 6000);
      })
      .catch(() => {
        if (!disposed) setStatus("fallback");
      });

    return () => {
      disposed = true;
      if (timeout) window.clearTimeout(timeout);
      if (mapRef.current?.destroy) {
        mapRef.current.destroy();
        mapRef.current = null;
      }
    };
    // 只在挂载时创建地图，后续通过 setGeometries 更新。
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const map = mapRef.current;
    if (!map || status === "fallback" || !window.TMap) return;
    const TMap = window.TMap;

    map.panTo(new TMap.LatLng(category.center.lat, category.center.lng));
    map.zoomTo(category.zoom);

    const markerGeometries = category.attractions.map((item, index) => ({
      id: item.id,
      styleId: item.id === activeId ? "active" : "default",
      position: new TMap.LatLng(item.lat, item.lng),
      rank: index,
    }));
    const labelGeometries = category.attractions.map((item) => ({
      id: `label-${item.id}`,
      styleId: "label",
      position: new TMap.LatLng(item.lat, item.lng),
      content: item.name,
    }));
    const path = category.attractions.map((item) => new TMap.LatLng(item.lat, item.lng));

    if (!markersRef.current) {
      markersRef.current = new TMap.MultiMarker({
        map,
        styles: {
          default: new TMap.MarkerStyle({ width: 34, height: 42, anchor: { x: 17, y: 42 }, src: markerIcon(false) }),
          active: new TMap.MarkerStyle({ width: 34, height: 42, anchor: { x: 17, y: 42 }, src: markerIcon(true) }),
        },
        geometries: markerGeometries,
      });
      markersRef.current.on("click", (event: any) => {
        const id = event?.geometry?.id;
        if (typeof id === "string") setActiveId(id);
      });

      labelsRef.current = new TMap.MultiLabel({
        map,
        styles: {
          label: new TMap.LabelStyle({
            color: "#FFFFFF",
            size: 12,
            offset: { x: 0, y: -24 },
            angle: 0,
            alignment: "center",
            verticalAlignment: "bottom",
          }),
        },
        geometries: labelGeometries,
      });

      if (path.length > 1) {
        routeRef.current = new TMap.MultiPolyline({
          map,
          styles: {
            route: new TMap.PolylineStyle({ color: "#B83C32", width: 4, borderWidth: 1, borderColor: "#FFFFFF", lineCap: "round" }),
          },
          geometries: [{ id: "route", styleId: "route", paths: path }],
        });
      }
    } else {
      markersRef.current.setGeometries(markerGeometries);
      labelsRef.current?.setGeometries(labelGeometries);
      routeRef.current?.setGeometries(path.length > 1 ? [{ id: "route", styleId: "route", paths: path }] : []);
    }
  }, [category, activeId, status]);

  function switchCategory(index: number) {
    const next = (index + categories.length) % categories.length;
    if (next === categoryIndex) return;
    setCategoryIndex(next);
    setActiveId(categories[next].attractions[0].id);
    onMapTrack(categories[next].id);
  }

  function focusActive() {
    const map = mapRef.current;
    if (map && status === "ready") {
      map.panTo(new window.TMap.LatLng(active.lat, active.lng));
      return;
    }
    vectorRef.current?.focus();
  }

  function zoomBy(delta: number) {
    const map = mapRef.current;
    if (map && status === "ready") {
      map.zoomTo(Math.min(17, Math.max(10, (map.getZoom?.() ?? category.zoom) + delta)));
      return;
    }
    vectorRef.current?.zoomBy(delta > 0 ? 0.8 : 1.25);
  }

  function resetView() {
    const map = mapRef.current;
    if (map && status === "ready") {
      map.panTo(new window.TMap.LatLng(category.center.lat, category.center.lng));
      map.zoomTo(category.zoom);
      return;
    }
    vectorRef.current?.reset();
  }

  return (
    <div className="imm-atlas">
      <div className={cn("imm-atlas-media", mode === "dark" && "is-dark")}>
        <div ref={containerRef} className="imm-tmap-canvas" aria-label="北京热门景点地图" />
        <div
          className={cn("imm-tmap-fallback", "is-vector", status === "ready" && "is-hidden")}
          style={{ opacity: status === "ready" ? 0 : 1 }}
          aria-hidden={status === "ready"}
        >
          <BeijingVectorMap
            ref={vectorRef}
            category={category}
            activeId={activeId}
            onSelect={setActiveId}
            onMapTrack={onMapTrack}
          />
          <div className="imm-tmap-fallback-copy">
            <span>{category.kicker}</span>
            <strong>{category.title}</strong>
            <p>{category.description}</p>
            <div className="imm-tmap-fallback-pins">
              {category.attractions.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  className={cn(item.id === activeId && "is-active")}
                  onClick={() => setActiveId(item.id)}
                >
                  {item.name}
                </button>
              ))}
            </div>
          </div>
        </div>
        <span className="imm-atlas-caption">{category.caption}</span>
        <div className="imm-atlas-hint">
          <Crosshair size={13} /> 矢量地图 · 拖拽平移 / 滚轮缩放 · 点击地标查看详情
        </div>
        <div className="imm-atlas-switcher" role="tablist" aria-label="切换地图视角">
          {categories.map((item, index) => (
            <button
              key={item.id}
              type="button"
              role="tab"
              aria-selected={index === categoryIndex}
              className={cn("imm-atlas-switch", index === categoryIndex && "is-active")}
              onClick={() => switchCategory(index)}
            >
              {item.tab}
            </button>
          ))}
        </div>
        <div className="imm-atlas-pager" aria-label="地图翻页">
          <button type="button" onClick={() => switchCategory(categoryIndex - 1)} aria-label="上一张地图">
            <span aria-hidden="true">‹</span>
          </button>
          <span>{String(categoryIndex + 1).padStart(2, "0")} / {String(categories.length).padStart(2, "0")}</span>
          <button type="button" onClick={() => switchCategory(categoryIndex + 1)} aria-label="下一张地图">
            <span aria-hidden="true">›</span>
          </button>
        </div>
      </div>

      <div className="imm-atlas-card" aria-live="polite">
        <span {...clickableProps(() => destination && onOpenDestination(destination), `查看${active.name}专题`, "imm-atlas-kicker")}>{category.kicker}</span>
        <h3 {...clickableProps(() => destination && onOpenDestination(destination), `查看${active.name}详情`)}>{active.name}</h3>
        <p {...clickableProps(() => destination && onOpenDestination(destination), `阅读${active.name}介绍`)}>{destination?.description ?? active.tagline}</p>
        <div className="imm-atlas-actions">
          <button type="button" onClick={() => zoomBy(1)} aria-label="放大"><Plus size={15} /></button>
          <button type="button" onClick={() => zoomBy(-1)} aria-label="缩小"><Minus size={15} /></button>
          <button type="button" onClick={focusActive} aria-label="聚焦当前地标"><Crosshair size={15} /></button>
          <button type="button" onClick={resetView} aria-label="重置视角"><RotateCcw size={15} /></button>
        </div>
        <div className="imm-atlas-scale">
          <span>地图来源</span>
          <strong>腾讯地图 · 矢量示意</strong>
        </div>
        <button
          type="button"
          className="imm-atlas-link"
          onClick={() => destination && onOpenDestination(destination)}
          disabled={!destination}
        >
          查看地标详情 <ArrowUpRight size={15} />
        </button>
      </div>
    </div>
  );
}
