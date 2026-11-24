import { forwardRef, useEffect, useImperativeHandle, useRef, useState } from "react";
import { Compass, Layers, Minus, Plus } from "lucide-react";
import { cn } from "@/lib/cn";

/**
 * 北京中心区矢量示意图：用 SVG 绘制道路、水系、绿地、街区与地标 POI，
 * 视觉语言参考国内主流地图（浅色底 + 白色路网 + 彩色 POI）。
 * 仅作旅行示意，不代表精确测绘结果；真实地图由 TencentMap 在代理可用时加载。
 */

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
  title: string;
  attractions: Attraction[];
};

type View = { x: number; y: number; w: number; h: number };

const MAP_W = 1200;
const MAP_H = 900;

/** 经纬度 → 示意地图平面坐标。 */
function project(lat: number, lng: number) {
  return {
    x: ((lng - 116.24) / 0.2) * MAP_W,
    y: ((40.03 - lat) / 0.17) * MAP_H,
  };
}

/** 每个分类的初始视野，围绕该分类的地标展开。 */
const FOCUS: Record<string, View> = {
  popular: { x: 820, y: 545, w: 250, h: 185 },
  axis: { x: 830, y: 215, w: 290, h: 645 },
  gardens: { x: 120, y: 40, w: 350, h: 265 },
  lanes: { x: 790, y: 405, w: 285, h: 185 },
};

const blocks = Array.from({ length: 96 }, (_, i) => {
  const col = i % 12;
  const row = Math.floor(i / 12);
  return {
    x: 110 + col * 90 + (row % 2) * 16,
    y: 120 + row * 82,
    w: 42 + (i % 3) * 14,
    h: 30 + (i % 4) * 9,
    opacity: 0.42 + (i % 5) * 0.09,
  };
});

const mainRoads = [
  "M 500 300 L 1120 300 Q 1150 300 1150 330 L 1150 770 Q 1150 800 1120 800 L 500 800 Q 470 800 470 770 L 470 330 Q 470 300 500 300 Z",
  "M 460 665 L 1170 665",
  "M 960 245 L 960 870",
  "M 470 470 L 1150 470",
  "M 760 300 L 760 800",
  "M 340 190 L 1190 190",
  "M 340 860 L 1190 860",
  "M 250 110 L 250 880",
];

const sideRoads = Array.from({ length: 14 }, (_, i) => `M ${520 + i * 44} 472 L ${520 + i * 44} 800`);
sideRoads.push(...Array.from({ length: 10 }, (_, i) => `M ${770 + i * 40} 305 L ${770 + i * 40} 800`));

const parks = [
  "M 905 545 L 970 545 L 970 592 L 905 592 Z",
  "M 855 700 L 915 700 L 915 755 L 855 755 Z",
  "M 975 780 C 1045 770 1075 810 1045 855 C 1015 890 950 875 940 835 C 932 805 945 785 975 780 Z",
  "M 975 405 L 1050 405 L 1050 465 L 975 465 Z",
  "M 150 105 C 235 85 320 105 330 165 C 338 230 260 265 185 245 C 120 228 100 155 150 105 Z",
  "M 310 55 C 385 40 445 70 435 130 C 425 190 350 200 315 160 C 280 120 275 70 310 55 Z",
  "M 900 620 L 945 620 L 945 660 L 900 660 Z",
];

const water = [
  "M 800 435 C 835 420 880 440 890 470 C 900 498 860 512 828 498 C 798 485 780 455 800 435 Z",
  "M 895 495 C 925 488 950 505 945 535 C 940 565 905 572 885 550 C 868 530 872 502 895 495 Z",
  "M 175 185 C 225 165 295 175 305 215 C 315 255 250 275 195 258 C 150 243 140 203 175 185 Z",
];

export type VectorMapHandle = {
  zoomBy: (factor: number) => void;
  reset: () => void;
  focus: () => void;
};

export const BeijingVectorMap = forwardRef<
  VectorMapHandle,
  {
    category: MapCategory;
    activeId: string;
    onSelect: (id: string) => void;
    onMapTrack?: (view: string) => void;
  }
>(function BeijingVectorMap({ category, activeId, onSelect, onMapTrack }, ref) {
  const [layer, setLayer] = useState<"standard" | "night">("standard");
  const [view, setView] = useState<View>(FOCUS[category.id] ?? FOCUS.popular);
  const svgRef = useRef<SVGSVGElement>(null);
  const drag = useRef<{ x: number; y: number; view: View; poiId?: string } | null>(null);

  useEffect(() => {
    setView(FOCUS[category.id] ?? FOCUS.popular);
  }, [category.id]);

  const points = category.attractions.map((item) => ({ item, ...project(item.lat, item.lng) }));
  const route = points.map(({ x, y }) => `${x},${y}`).join(" ");

  function zoomBy(factor: number) {
    setView((v) => {
      const w = Math.min(MAP_W, Math.max(90, v.w * factor));
      const h = w * (v.h / v.w);
      return {
        x: Math.max(0, Math.min(MAP_W - w, v.x + (v.w - w) / 2)),
        y: Math.max(0, Math.min(MAP_H - h, v.y + (v.h - h) / 2)),
        w,
        h,
      };
    });
    onMapTrack?.(`zoom-${factor < 1 ? "in" : "out"}`);
  }

  function resetView() {
    setView(FOCUS[category.id] ?? FOCUS.popular);
    onMapTrack?.("reset");
  }

  function onPointerDown(event: React.PointerEvent<SVGSVGElement>) {
    // 从 POI 上按下也允许拖拽地图；抬起时若几乎未移动则视为选中该 POI。
    const poi = (event.target as Element).closest(".imm-vmap-poi");
    drag.current = {
      x: event.clientX,
      y: event.clientY,
      view,
      poiId: poi?.getAttribute("data-poi-id") ?? undefined,
    };
    event.currentTarget.setPointerCapture(event.pointerId);
  }

  function onPointerMove(event: React.PointerEvent<SVGSVGElement>) {
    if (!drag.current || !svgRef.current) return;
    if (drag.current.poiId && Math.hypot(event.clientX - drag.current.x, event.clientY - drag.current.y) < 4) return;
    const rect = svgRef.current.getBoundingClientRect();
    const dx = ((event.clientX - drag.current.x) / rect.width) * drag.current.view.w;
    const dy = ((event.clientY - drag.current.y) / rect.height) * drag.current.view.h;
    const start = drag.current.view;
    setView({
      ...start,
      x: Math.max(0, Math.min(MAP_W - start.w, start.x - dx)),
      y: Math.max(0, Math.min(MAP_H - start.h, start.y - dy)),
    });
  }

  function onPointerUp(event: React.PointerEvent<SVGSVGElement>) {
    const gesture = drag.current;
    drag.current = null;
    if (gesture?.poiId && Math.hypot(event.clientX - gesture.x, event.clientY - gesture.y) < 4) {
      onSelect(gesture.poiId);
    }
  }

  function onWheel(event: React.WheelEvent<SVGSVGElement>) {
    event.preventDefault();
    zoomBy(event.deltaY < 0 ? 0.88 : 1.14);
  }

  function focusActive() {
    const point = points.find(({ item }) => item.id === activeId);
    if (!point) return;
    setView((v) => ({
      ...v,
      x: Math.max(0, Math.min(MAP_W - v.w, point.x - v.w / 2)),
      y: Math.max(0, Math.min(MAP_H - v.h, point.y - v.h / 2)),
    }));
    onMapTrack?.("focus");
  }

  useImperativeHandle(ref, () => ({ zoomBy, reset: resetView, focus: focusActive }));

  return (
    <div className={cn("imm-vmap", layer === "night" && "is-night")}>
      <svg
        ref={svgRef}
        className="imm-vmap-stage"
        data-category={category.id}
        viewBox={`${view.x} ${view.y} ${view.w} ${view.h}`}
        preserveAspectRatio="xMidYMid slice"
        role="img"
        aria-label={`${category.title}矢量示意图`}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerUp}
        onWheel={onWheel}
      >
        <rect x="0" y="0" width={MAP_W} height={MAP_H} className="vmap-ground" />

        <g className="vmap-blocks">
          {blocks.map((block, i) => (
            <rect key={i} x={block.x} y={block.y} width={block.w} height={block.h} rx="3" opacity={block.opacity} />
          ))}
        </g>

        <g className="vmap-parks">
          {parks.map((path, i) => <path key={i} d={path} />)}
        </g>
        <g className="vmap-water">
          {water.map((path, i) => <path key={i} d={path} />)}
        </g>

        <g className="vmap-road-edge" fill="none">
          {mainRoads.map((path, i) => <path key={i} d={path} strokeWidth={i === 1 || i === 2 ? 17 : 13} />)}
        </g>
        <g className="vmap-road" fill="none">
          {mainRoads.map((path, i) => <path key={i} d={path} strokeWidth={i === 1 || i === 2 ? 12 : 9} />)}
        </g>
        <g className="vmap-side-road" fill="none">
          {sideRoads.map((path, i) => <path key={i} d={path} strokeWidth={4} />)}
        </g>
        <path className="vmap-axis" d="M 960 245 L 960 870" fill="none" strokeWidth={5} strokeLinecap="round" />

        <g className="vmap-building">
          <rect x="888" y="575" width="112" height="82" rx="4" className="vmap-palace" />
          <rect x="912" y="650" width="74" height="14" rx="2" />
          <rect x="878" y="672" width="62" height="26" rx="3" />
          <rect x="968" y="672" width="62" height="26" rx="3" />
          <ellipse cx="992" cy="832" rx="52" ry="38" />
          <rect x="155" y="120" width="92" height="56" rx="6" className="vmap-palace" />
        </g>

        {points.length > 1 ? (
          <polyline className="vmap-route" points={route} fill="none" />
        ) : null}

        {points.map(({ item, x, y }, index) => {
          // 标注尺寸随视野缩放，保持屏幕像素恒定；密集地标左右 / 上下避让。
          const scale = view.w / 250;
          const labelRight = index % 2 === 0;
          const labelGap = 15 * scale;
          const labelOffsetY = (index < 2 ? 4 : 14) * scale;
          return (
            <g
              key={item.id}
              data-poi-id={item.id}
              className={cn("imm-vmap-poi", item.id === activeId && "is-active")}
              role="button"
              tabIndex={0}
              aria-label={`聚焦${item.name}`}
              onKeyDown={(event) => {
                if (event.key === "Enter" || event.key === " ") {
                  event.preventDefault();
                  onSelect(item.id);
                }
              }}
            >
              <circle cx={x} cy={y} r={13 * scale} className="vmap-poi-halo" />
              <circle cx={x} cy={y} r={6 * scale} className="vmap-poi-dot" />
              <circle cx={x} cy={y} r={2.2 * scale} className="vmap-poi-core" />
              <text
                x={x + (labelRight ? labelGap : -labelGap)}
                y={y + labelOffsetY}
                textAnchor={labelRight ? "start" : "end"}
                className="vmap-poi-label"
                style={{ fontSize: 6.2 * scale, strokeWidth: 1.6 * scale }}
              >
                {item.name}
              </text>
            </g>
          );
        })}

        <text
          x={view.x + 12}
          y={view.y + 20}
          className="vmap-north"
          style={{ fontSize: 7 * (view.w / 250) }}
        >
          N ↑
        </text>
      </svg>

      <div className="imm-vmap-tools" aria-label="地图工具">
        <button type="button" onClick={() => setLayer((v) => (v === "standard" ? "night" : "standard"))} aria-label="切换地图图层" title="切换标准 / 夜间图层">
          <Layers size={16} />
        </button>
        <button type="button" onClick={resetView} aria-label="重置地图视角" title="回到本分类视野">
          <Compass size={16} />
        </button>
        <button type="button" onClick={() => zoomBy(0.8)} aria-label="放大地图" title="放大">
          <Plus size={16} />
        </button>
        <button type="button" onClick={() => zoomBy(1.25)} aria-label="缩小地图" title="缩小">
          <Minus size={16} />
        </button>
      </div>
      <div className="imm-vmap-scale" aria-hidden="true">
        <i /> <span>约 {Math.max(100, Math.round(view.w / 2))} m</span>
      </div>
    </div>
  );
});
