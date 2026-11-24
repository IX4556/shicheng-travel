import {
  addDays,
  addMonths,
  eachDayOfInterval,
  endOfMonth,
  endOfWeek,
  format,
  isBefore,
  isSameDay,
  isSameMonth,
  isWithinInterval,
  startOfDay,
  startOfMonth,
  startOfWeek,
} from "date-fns";
import { CalendarDays, Minus, Plus, X } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { cn, tap } from "@/lib/cn";

const weekDays = ["一", "二", "三", "四", "五", "六", "日"];

type DateRangeSheetProps = {
  open: boolean;
  onClose: () => void;
  checkIn: string;
  checkOut: string;
  rooms: number;
  adults: number;
  children: number;
  title?: string;
  eyebrow?: string;
  confirmLabel?: string;
  notice?: string;
  showGuests?: boolean;
  onConfirm: (range: {
    checkIn: string;
    checkOut: string;
    rooms: number;
    adults: number;
    children: number;
  }) => void;
};

function dayLabel(date: Date) {
  return `周${"日一二三四五六"[date.getDay()]}`;
}

function MonthCalendar({
  month,
  start,
  end,
  onSelect,
}: {
  month: Date;
  start: Date | null;
  end: Date | null;
  onSelect: (date: Date) => void;
}) {
  const today = startOfDay(new Date());
  const days = useMemo(() => {
    const first = startOfWeek(startOfMonth(month), { weekStartsOn: 1 });
    const last = endOfWeek(endOfMonth(month), { weekStartsOn: 1 });
    return eachDayOfInterval({ start: first, end: last });
  }, [month]);

  return (
    <section aria-label={`${month.getFullYear()}年${month.getMonth() + 1}月`}>
      <h3 className="font-serif text-base">
        {month.getFullYear()}年 {month.getMonth() + 1}月
      </h3>
      <div className="mt-3 grid grid-cols-7 text-center text-xs text-mute">
        {weekDays.map((day) => (
          <span key={day} className="py-1">
            {day}
          </span>
        ))}
      </div>
      <div className="grid grid-cols-7 gap-y-1">
        {days.map((day) => {
          const disabled = isBefore(day, today);
          const selectedStart = start ? isSameDay(day, start) : false;
          const selectedEnd = end ? isSameDay(day, end) : false;
          const inRange =
            start && end
              ? isWithinInterval(day, { start, end })
              : false;
          const currentMonth = isSameMonth(day, month);

          return (
            <button
              key={day.toISOString()}
              type="button"
              disabled={disabled}
              aria-label={`${format(day, "yyyy-MM-dd")} ${dayLabel(day)}`}
              aria-pressed={selectedStart || selectedEnd}
              onClick={() => onSelect(day)}
              className={cn(
                "relative mx-auto flex size-9 items-center justify-center rounded-full text-xs tabular-nums transition-[background-color,color] duration-150",
                !currentMonth && "text-mute/40",
                disabled && "cursor-not-allowed text-mute/30",
                inRange && "bg-brand-soft text-ink",
                (selectedStart || selectedEnd) && "bg-cinnabar text-cream",
              )}
            >
              {day.getDate()}
            </button>
          );
        })}
      </div>
    </section>
  );
}

function Stepper({
  label,
  description,
  value,
  min,
  max,
  onChange,
}: {
  label: string;
  description: string;
  value: number;
  min: number;
  max: number;
  onChange: (next: number) => void;
}) {
  return (
    <div className="flex items-center justify-between py-3">
      <div>
        <p className="text-sm font-medium">{label}</p>
        <p className="mt-0.5 text-xs text-mute">{description}</p>
      </div>
      <div className="flex items-center gap-3">
        <button
          type="button"
          aria-label={`减少${label}`}
          disabled={value <= min}
          onClick={() => onChange(Math.max(min, value - 1))}
          className={cn(
            "flex size-11 items-center justify-center rounded-full ring-1 ring-line",
            value <= min && "text-mute/40",
            tap,
          )}
        >
          <Minus className="size-4" />
        </button>
        <span className="w-5 text-center text-sm tabular-nums">{value}</span>
        <button
          type="button"
          aria-label={`增加${label}`}
          disabled={value >= max}
          onClick={() => onChange(Math.min(max, value + 1))}
          className={cn(
            "flex size-11 items-center justify-center rounded-full ring-1 ring-line",
            value >= max && "text-mute/40",
            tap,
          )}
        >
          <Plus className="size-4" />
        </button>
      </div>
    </div>
  );
}

export function DateRangeSheet({
  open,
  onClose,
  checkIn,
  checkOut,
  rooms: initialRooms,
  adults: initialAdults,
  children: initialChildren,
  title = "选择日期与住客",
  eyebrow = "入住条件",
  confirmLabel = "确认入住条件",
  notice,
  showGuests = true,
  onConfirm,
}: DateRangeSheetProps) {
  const anchor = useMemo(() => startOfDay(new Date(`${checkIn}T00:00:00`)), [checkIn]);
  const initialStart = useMemo(() => new Date(`${checkIn}T00:00:00`), [checkIn]);
  const initialEnd = useMemo(() => new Date(`${checkOut}T00:00:00`), [checkOut]);
  const [start, setStart] = useState<Date | null>(initialStart);
  const [end, setEnd] = useState<Date | null>(initialEnd);
  const [rooms, setRooms] = useState(initialRooms);
  const [adults, setAdults] = useState(initialAdults);
  const [children, setChildren] = useState(initialChildren);

  useEffect(() => {
    if (!open) return;
    setStart(initialStart);
    setEnd(initialEnd);
    setRooms(initialRooms);
    setAdults(initialAdults);
    setChildren(initialChildren);
  }, [open, initialStart, initialEnd, initialRooms, initialAdults, initialChildren]);

  useEffect(() => {
    if (!open) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [open, onClose]);

  const nights = start && end ? Math.max(1, Math.round((end.getTime() - start.getTime()) / 86400000)) : 1;

  function selectDate(date: Date) {
    if (!start || (start && end) || isBefore(date, start)) {
      setStart(date);
      setEnd(null);
      return;
    }
    if (isSameDay(date, start)) {
      setEnd(addDays(date, 1));
      return;
    }
    setEnd(date);
  }

  function confirm() {
    if (!start || !end) return;
    onConfirm({
      checkIn: format(start, "yyyy-MM-dd"),
      checkOut: format(end, "yyyy-MM-dd"),
      rooms,
      adults,
      children,
    });
    onClose();
  }

  return (
    <div
      className={cn(
        "fixed inset-0 z-50 flex items-end justify-center bg-ink/45 transition-opacity duration-200",
        open ? "opacity-100" : "pointer-events-none opacity-0",
      )}
      aria-hidden={!open}
      onClick={onClose}
    >
      <section
        role="dialog"
        aria-modal="true"
        aria-labelledby="date-sheet-title"
        onClick={(event) => event.stopPropagation()}
        className={cn(
          "safe-bottom max-h-[88dvh] w-full max-w-xl overflow-y-auto rounded-t-3xl bg-cream px-5 pt-3 shadow-lift transition-transform duration-200 ease-out",
          open ? "translate-y-0" : "translate-y-10",
        )}
      >
        <div className="mx-auto h-1 w-10 rounded-full bg-line" />
        <header className="mt-4 flex items-start justify-between gap-4">
          <div>
            <p className="text-xs tracking-widest text-cinnabar">{eyebrow}</p>
            <h2 id="date-sheet-title" className="mt-1 font-serif text-2xl">
              {title}
            </h2>
            <p className="mt-1 text-sm text-mute">
              {start ? `${format(start, "MM.dd")} ${dayLabel(start)}` : "选择入住日期"}
              <span className="px-2">—</span>
              {end ? `${format(end, "MM.dd")} ${dayLabel(end)}` : "选择离店日期"}
              <span className="ml-2 text-cinnabar">共 {nights} 晚</span>
            </p>
          </div>
          <button
            type="button"
            aria-label="关闭日期选择"
            onClick={onClose}
            className={cn("flex size-11 shrink-0 items-center justify-center rounded-full bg-paper", tap)}
          >
            <X className="size-5" />
          </button>
        </header>

        <div className="mt-6 grid gap-7 sm:grid-cols-2">
          <MonthCalendar month={anchor} start={start} end={end} onSelect={selectDate} />
          <MonthCalendar month={addMonths(anchor, 1)} start={start} end={end} onSelect={selectDate} />
        </div>

        {showGuests ? (
          <div className="mt-5 divide-y divide-line rounded-2xl bg-card px-4 ring-1 ring-line">
            <Stepper
              label="房间"
              description="最多 3 间"
              value={rooms}
              min={1}
              max={3}
              onChange={setRooms}
            />
            <Stepper
              label="成人"
              description="18 岁及以上"
              value={adults}
              min={1}
              max={6}
              onChange={setAdults}
            />
            <Stepper
              label="儿童"
              description="0—17 岁"
              value={children}
              min={0}
              max={4}
              onChange={setChildren}
            />
          </div>
        ) : null}
        <p className="mt-3 flex items-start gap-2 text-xs leading-relaxed text-mute">
          <CalendarDays className="mt-0.5 size-4 shrink-0 text-gold" />
          {notice ??
            (showGuests
              ? "部分日期受库存影响不可选，确认房型后价格可能变化。"
              : "部分日期不可选。生成后仍可在行程页调整每天安排。")}
        </p>
        <button
          type="button"
          disabled={!start || !end}
          onClick={confirm}
          className={cn(
            "mt-4 mb-3 h-12 w-full rounded-full bg-cinnabar text-sm font-medium text-cream disabled:bg-line disabled:text-mute",
            tap,
          )}
        >
          {confirmLabel}
        </button>
      </section>
    </div>
  );
}
