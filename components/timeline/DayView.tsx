"use client";

import { useRef, useState } from "react";
import { categoryById as defaultCategoryById, fmtDurationShort, fmtTime } from "@/lib/data";
import type { Category, CategorySlug, TimeBlock } from "@/lib/types";

const hourPx = 34;

export function DayView({
  blocks,
  sleepBlock,
  nowMinutes,
  startHour,
  endHour,
  categoryById = defaultCategoryById,
  selectedId,
  onSelect,
  onDraft,
  onChangeBlockTime
}: {
  blocks: TimeBlock[];
  sleepBlock?: TimeBlock | null;
  nowMinutes: number;
  startHour: number;
  endHour: number;
  categoryById?: Record<CategorySlug, Category>;
  selectedId?: string | null;
  onSelect?: (id: string) => void;
  onDraft?: (draft: { start: number; end: number }) => void;
  onChangeBlockTime?: (id: string, start: number, end: number) => void;
}) {
  const trackRef = useRef<HTMLDivElement>(null);
  const suppressClickRef = useRef<string | null>(null);
  const [draftDrag, setDraftDrag] = useState<{ y1: number; y2: number } | null>(null);
  const [blockDrag, setBlockDrag] = useState<{
    id: string;
    originY: number;
    currentY: number;
    start: number;
    end: number;
    moved: boolean;
  } | null>(null);
  const [hoverY, setHoverY] = useState<number | null>(null);
  const totalHeight = (endHour - startHour) * hourPx;

  function yToMinutes(y: number) {
    return Math.round(((y / hourPx) * 60) / 15) * 15 + startHour * 60;
  }

  function eventY(event: React.MouseEvent) {
    const rect = trackRef.current?.getBoundingClientRect();
    return rect ? Math.max(0, Math.min(totalHeight, event.clientY - rect.top)) : 0;
  }

  function draggedTime(block: TimeBlock) {
    if (!blockDrag || blockDrag.id !== block.id) return { start: block.start, end: block.end };

    const duration = blockDrag.end - blockDrag.start;
    const deltaMinutes = Math.round((((blockDrag.currentY - blockDrag.originY) / hourPx) * 60) / 15) * 15;
    const minStart = startHour * 60;
    const maxStart = endHour * 60 - duration;
    const start = Math.max(minStart, Math.min(maxStart, blockDrag.start + deltaMinutes));

    return { start, end: start + duration };
  }

  const visible = blocks
    .map((block) => ({ ...block, visibleStart: Math.max(block.start, startHour * 60), visibleEnd: Math.min(block.end, endHour * 60) }))
    .filter((block) => block.visibleEnd > block.visibleStart);
  const visibleSleep = sleepBlock
    ? {
        ...sleepBlock,
        visibleStart: Math.max(sleepBlock.start, startHour * 60),
        visibleEnd: Math.min(sleepBlock.end, endHour * 60)
      }
    : null;
  const isNowVisible = nowMinutes >= startHour * 60 && nowMinutes <= endHour * 60;

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
          setDraftDrag({ y1: y, y2: y });
        }}
        onMouseMove={(event) => {
          const y = eventY(event);
          setHoverY(y);
          setBlockDrag((current) => (current ? { ...current, currentY: y, moved: current.moved || Math.abs(y - current.originY) > 4 } : null));
          setDraftDrag((current) => (current ? { ...current, y2: y } : null));
        }}
        onMouseLeave={() => {
          setHoverY(null);
          setDraftDrag(null);
          setBlockDrag(null);
        }}
        onMouseUp={() => {
          if (blockDrag) {
            const block = blocks.find((item) => item.id === blockDrag.id);
            if (block && blockDrag.moved) {
              const next = draggedTime(block);
              suppressClickRef.current = block.id;
              onChangeBlockTime?.(block.id, next.start, next.end);
            }
            setBlockDrag(null);
            return;
          }

          if (draftDrag && Math.abs(draftDrag.y2 - draftDrag.y1) > 8) {
            const start = yToMinutes(Math.min(draftDrag.y1, draftDrag.y2));
            const end = yToMinutes(Math.max(draftDrag.y1, draftDrag.y2));
            onDraft?.({ start, end });
          }
          setDraftDrag(null);
        }}
      >
        {Array.from({ length: endHour - startHour }, (_, index) => (
          <div className="hour-line" key={index} style={{ top: index * hourPx }}>
            <i />
          </div>
        ))}
        {hoverY !== null && !draftDrag && !blockDrag ? (
          <div className="hover-line" style={{ top: hoverY }}>
            <span>{fmtTime(yToMinutes(hoverY))}</span>
          </div>
        ) : null}
        {draftDrag ? (
          <div
            className="draft-range"
            style={{
              top: Math.min(draftDrag.y1, draftDrag.y2),
              height: Math.abs(draftDrag.y2 - draftDrag.y1)
            }}
          >
            + 새 블록 {fmtTime(yToMinutes(Math.min(draftDrag.y1, draftDrag.y2)))}-{fmtTime(yToMinutes(Math.max(draftDrag.y1, draftDrag.y2)))}
          </div>
        ) : null}
        {visibleSleep && visibleSleep.visibleEnd > visibleSleep.visibleStart ? (
          <div
            className="sleep-band"
            style={{
              top: ((visibleSleep.visibleStart - startHour * 60) / 60) * hourPx,
              height: Math.max(((visibleSleep.visibleEnd - visibleSleep.visibleStart) / 60) * hourPx, 24),
              background: categoryById.sleep.tint,
              borderLeftColor: categoryById.sleep.color
            }}
          >
            <span>
              <strong style={{ color: categoryById.sleep.stroke }}>{categoryById.sleep.emoji} {categoryById.sleep.label}</strong>
              <em>
                {sleepLabel(visibleSleep.start)}-{sleepLabel(visibleSleep.end)} · {fmtDurationShort(visibleSleep.end - visibleSleep.start)}
              </em>
            </span>
            <small>{visibleSleep.note}</small>
          </div>
        ) : null}
        {visible.map((block) => {
          const category = categoryById[block.cat];
          const nextTime = draggedTime(block);
          const visibleStart = Math.max(nextTime.start, startHour * 60);
          const visibleEnd = Math.min(nextTime.end, endHour * 60);
          const top = ((visibleStart - startHour * 60) / 60) * hourPx;
          const height = Math.max(((visibleEnd - visibleStart) / 60) * hourPx, 24);

          return (
            <button
              type="button"
              data-block
              className={`time-block ${selectedId === block.id ? "selected" : ""}`}
              key={block.id}
              onMouseDown={(event) => {
                event.stopPropagation();
                const y = eventY(event);
                setBlockDrag({
                  id: block.id,
                  originY: y,
                  currentY: y,
                  start: block.start,
                  end: block.end,
                  moved: false
                });
              }}
              onClick={(event) => {
                event.stopPropagation();
                if (suppressClickRef.current === block.id) {
                  suppressClickRef.current = null;
                  return;
                }
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
                <strong style={{ color: category.stroke }}>{category.emoji} {block.title || category.label}</strong>
                <em>
                  {fmtTime(nextTime.start)}-{fmtTime(nextTime.end)} · {fmtDurationShort(nextTime.end - nextTime.start)}
                </em>
              </span>
              {height > 36 ? <small>{block.note}</small> : null}
            </button>
          );
        })}
        {isNowVisible ? (
          <div className="now-line" style={{ top: ((nowMinutes - startHour * 60) / 60) * hourPx }}>
            <span>지금 {fmtTime(nowMinutes)}</span>
          </div>
        ) : null}
      </div>
    </div>
  );
}

function sleepLabel(minutes: number) {
  const day = minutes < 0 ? "어제 " : "오늘 ";
  const normalized = ((minutes % 1440) + 1440) % 1440;
  return `${day}${fmtTime(normalized)}`;
}
