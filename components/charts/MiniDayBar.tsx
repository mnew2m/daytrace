import { categoryById as defaultCategoryById, fmtTime } from "@/lib/data";
import type { Category, CategorySlug, TimeBlock } from "@/lib/types";

export function MiniDayBar({
  blocks,
  nowMinutes,
  categoryById = defaultCategoryById
}: {
  blocks: TimeBlock[];
  nowMinutes: number;
  categoryById?: Record<CategorySlug, Category>;
}) {
  return (
    <div className="mini-day">
      <div className="mini-track">
        {blocks.map((block) => {
          const category = categoryById[block.cat];
          return (
            <span
              key={block.id}
              title={`${category.emoji} ${block.title || category.label} ${fmtTime(block.start)}-${fmtTime(block.end)}`}
              style={{ width: `${((block.end - block.start) / 1440) * 100}%`, background: category.color }}
            />
          );
        })}
        <i className="mini-now" style={{ left: `${(nowMinutes / 1440) * 100}%` }} />
      </div>
      <div className="mini-axis">
        {[0, 3, 6, 9, 12, 15, 18, 21, 24].map((h) => (
          <span key={h} style={{ left: `${(h / 24) * 100}%` }}>
            {String(h).padStart(2, "0")}
          </span>
        ))}
      </div>
    </div>
  );
}
