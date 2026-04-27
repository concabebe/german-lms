"use client";

interface SaveIndicatorProps {
  status: "idle" | "saving" | "saved" | "error";
  lastSavedAt: Date | null;
  onRetry?: () => void;
}

export function SaveIndicator({
  status,
  lastSavedAt,
  onRetry,
}: SaveIndicatorProps) {
  const formatTime = (date: Date) => {
    return date.toLocaleTimeString("vi-VN", {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <div className="flex items-center gap-2 text-[11px] font-mono">
      {status === "saving" && (
        <>
          <span className="inline-block w-2 h-2 rounded-full bg-[var(--amber)] animate-pulse" />
          <span className="text-[var(--amber)]">Đang lưu…</span>
        </>
      )}
      {status === "saved" && lastSavedAt && (
        <>
          <span className="inline-block w-2 h-2 rounded-full bg-[var(--teal)]" />
          <span className="text-[var(--muted)]">
            Saved {formatTime(lastSavedAt)}
          </span>
        </>
      )}
      {status === "error" && (
        <>
          <span className="inline-block w-2 h-2 rounded-full bg-[var(--coral)]" />
          <span className="text-[var(--coral)]">Lỗi</span>
          {onRetry && (
            <button
              onClick={onRetry}
              className="text-[var(--coral)] underline hover:no-underline"
            >
              — thử lại
            </button>
          )}
        </>
      )}
    </div>
  );
}
