"use client";

import { useEffect, useRef, useState } from "react";
import { categoryById, fmtDurationShort, fmtTime, nowMinutes } from "@/lib/data";
import type { TimeBlock } from "@/lib/types";

const hourPx = 56;
const startHour = 5;
const endHour = 24;
const totalHeight = (endHour - startHour) * hourPx;

export function DayView({
  blocks,
  selectedId,
  onSelect,
  onDraft
}: {
  blocks: TimeBlock[];
  selectedId?: string | null;
  onSelect?: (id: string) => void;
  onDraft?: (draft: { start: number; end: number }) => void;
}) {
  const trackRef = useRef<HTMLDivElement>(null);
  const [drag, setDrag] = useState<{ y1: number; y2: number } | null>(null);
  const [hoverY, setHoverY] = useState<number | null>(null);

  useEffect(() => {
    const scrollParent = trackRef.current?.parentElement;
    if (!scrollParent) return;
    const nowY = ((nowMinutes - startHour * 60) / 60) * hourPx;
    scrollParent.scrollTop = Math.max(0, nowY - 220);
  }, []);

  function yToMinutes(y: number) {
    return Math.round(((y / hourPx) * 60) / 15) * 15 + startHour * 60;
  }

  function eventY(event: React.MouseEvent) {
    const rect = trackRef.current?.getBoundingClientRect();
    return rect ? Math.max(0, Math.min(totalHeight, event.clientY - rect.top)) : 0;
  }

  const visible = blocks
    .map((block) => ({ ...block, visibleStart: Math.max(block.start, startHour * 60), visibleEnd: Math.min(block.end, endHour * 60) }))
    .filter((block) => block.visibleEnd > block.visibleStart);

  return (
    <div className="day-view">
      <div className="hour-gutter" style={{ height: totalHeight }}>
        {Array.from({ length: endHour - startHour + 1 }, (_, index) => (
          <span key={index} style={{ top: index * hourPx - 9 }}>
            {String(startHour + index).padStart(2, "0")}:00
          </span>
        ))}
      </div>
      <div
        ref={trackRef}
        className="time-track"
        style={{ height: totalHeight }}
        onMouseDown={(event) => {
          if ((event.target as HTMLElement).closest("[data-block]")) return;
          const y = eventY(event);
          setDrag({ y1: y, y2: y });
        }}
        onMouseMove={(event) => {
          const y = eventY(event);
          setHoverY(y);
          setDrag((current) => (current ? { ...current, y2: y } : null));
        }}
        onMouseLeave={() => {
          setHoverY(null);
          setDrag(null);
        }}
        onMouseUp={() => {
          if (drag && Math.abs(drag.y2 - drag.y1) > 8) {
            const start = yToMinutes(Math.min(drag.y1, drag.y2));
            const end = yToMinutes(Math.max(drag.y1, drag.y2));
            onDraft?.({ start, end });
          }
          setDrag(null);
        }}
      >
        {Array.from({ length: endHour - startHour }, (_, index) => (
          <div className="hour-line" key={index} style={{ top: index * hourPx }}>
            <i />
          </div>
        ))}
        {hoverY !== null && !drag ? (
          <div className="hover-line" style={{ top: hoverY }}>
            <span>{fmtTime(yToMinutes(hoverY))}</span>
          </div>
        ) : null}
        {drag ? (
          <div
            className="draft-range"
            style={{
              top: Math.min(drag.y1, drag.y2),
              height: Math.abs(drag.y2 - drag.y1)
            }}
          >
            + 새 블록 {fmtTime(yToMinutes(Math.min(drag.y1, drag.y2)))}-{fmtTime(yToMinutes(Math.max(drag.y1, drag.y2)))}
          </div>
        ) : null}
        {visible.map((block) => {
          const category = categoryById[block.cat];
          const top = ((block.visibleStart - startHour * 60) / 60) * hourPx;
          const height = Math.max(((block.visibleEnd - block.visibleStart) / 60) * hourPx, 24);
          return (
            <button
              type="button"
              data-block
              className={`time-block ${selectedId === block.id ? "selected" : ""}`}
              key={block.id}
              onClick={(event) => {
                event.stopPropagation();
                onSelect?.(block.id);
              }}
              style={{
                top,
                height,
                background: category.tint,
                borderLeftColor: category.color
              }}
            >
              <span>
                <strong style={{ color: category.stroke }}>{category.label}</strong>
                <em>
                  {fmtTime(block.start)}-{fmtTime(block.end)} · {fmtDurationShort(block.end - block.start)}
                </em>
              </span>
              {height > 36 ? <small>{block.note}</small> : null}
            </button>
          );
        })}
        <div className="now-line" style={{ top: ((nowMinutes - startHour * 60) / 60) * hourPx }}>
          <span>지금 {fmtTime(nowMinutes)}</span>
        </div>
      </div>
    </div>
  );
}
