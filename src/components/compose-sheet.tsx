import { useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { cn, tap } from "@/lib/cn";
import { useTrip } from "@/store/use-trip";

export function ComposeSheet({ covers }: { covers: string[] }) {
  const open = useTrip((state) => state.composeOpen);
  const setCompose = useTrip((state) => state.setCompose);
  const publish = useTrip((state) => state.publish);
  const navigate = useNavigate();
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [cover, setCover] = useState(covers[0]);

  function close() {
    setCompose(false);
  }

  function submit() {
    if (title.trim().length < 2) {
      toast("先写下一个标题");
      return;
    }
    publish({ title: title.trim(), body: body.trim(), image: cover });
    setTitle("");
    setBody("");
    toast("游记已放进最新一栏");
    void navigate({ to: "/home" });
  }

  return (
    <div
      className={cn(
        "fixed inset-0 z-50 flex items-end justify-center bg-ink/40 transition-opacity duration-200",
        open ? "opacity-100" : "pointer-events-none opacity-0",
      )}
      onClick={close}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="compose-title"
        onClick={(event) => event.stopPropagation()}
        className={cn(
          "safe-bottom w-full max-w-md rounded-t-3xl bg-cream px-5 pt-5 shadow-lift transition-transform duration-200 ease-out",
          open ? "translate-y-0" : "translate-y-8",
        )}
      >
        <div className="mx-auto mb-4 h-1 w-10 rounded-full bg-line" />
        <h2 id="compose-title" className="font-serif text-xl">
          写下一程
        </h2>
        <p className="mt-1 text-sm text-mute">短一点也没关系，先把路记下。</p>
        <label className="mt-4 block">
          <span className="sr-only">标题</span>
          <input
            value={title}
            onChange={(event) => setTitle(event.target.value)}
            placeholder="标题"
            className="w-full border-b border-line bg-transparent py-3 font-serif text-lg outline-none placeholder:text-mute"
          />
        </label>
        <label className="mt-2 block">
          <span className="sr-only">正文</span>
          <textarea
            value={body}
            onChange={(event) => setBody(event.target.value)}
            placeholder="今天走到了哪里"
            rows={3}
            className="w-full resize-none bg-transparent py-2 text-sm outline-none placeholder:text-mute"
          />
        </label>
        <p className="mt-2 text-xs text-mute">选一张封面</p>
        <div className="mt-2 flex gap-2 overflow-x-auto no-scrollbar">
          {covers.map((src) => (
            <button
              key={src}
              type="button"
              aria-label="选择封面"
              onClick={() => setCover(src)}
              className={cn(
                "h-16 w-14 shrink-0 overflow-hidden rounded-xl ring-2 ring-offset-2 ring-offset-cream",
                cover === src ? "ring-cinnabar" : "ring-transparent",
                tap,
              )}
            >
              <img src={src} alt="" className="h-full w-full object-cover" />
            </button>
          ))}
        </div>
        <button
          type="button"
          onClick={submit}
          className={cn(
            "mt-5 mb-3 h-12 w-full rounded-full bg-cinnabar text-sm text-cream",
            tap,
          )}
        >
          发布
        </button>
      </div>
    </div>
  );
}
