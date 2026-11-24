import { useState } from "react";
import { ImageOff } from "lucide-react";
import { cn } from "@/lib/cn";

export function Photo({
  src,
  alt,
  className,
  imageClassName,
  fallback = "城市影像",
  loading = "lazy",
}: {
  src: string;
  alt: string;
  className?: string;
  imageClassName?: string;
  fallback?: string;
  loading?: "lazy" | "eager";
}) {
  const [failed, setFailed] = useState(false);

  return (
    <div className={cn("relative overflow-hidden rounded-[10px] bg-brand-soft", className)}>
      {failed ? (
        <div className="flex h-full min-h-24 w-full flex-col items-center justify-center gap-2 px-3 text-center text-xs text-mute">
          <ImageOff className="size-5 text-cinnabar" strokeWidth={1.5} />
          <span>{fallback}</span>
        </div>
      ) : (
        <img
          src={src}
          alt={alt}
          loading={loading}
          onError={() => setFailed(true)}
          className={cn("h-full w-full object-cover", imageClassName)}
        />
      )}
    </div>
  );
}
