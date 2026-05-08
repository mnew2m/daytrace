import { fmtDuration, fmtDurationShort } from "@/lib/data";
import type { Category, CategorySlug, StatsHeatmapRow, WeeklyTotal } from "@/lib/types";

export function Heatmap({ rows, categoryById }: { rows: StatsHeatmapRow[]; categoryById: Record<CategorySlug, Category> }) {
  return (
    <div className="heatmap">
      <div className="heatmap-row heatmap-head">
        <span />
        {Array.from({ length: 24 }, (_, h) => (
          <span key={h}>{h % 3 === 0 ? h : ""}</span>
        ))}
      </div>
      {rows.map((row) => (
        <div className="heatmap-row" key={row.date}>
          <strong className={row.isToday ? "today" : ""}>{row.label}</strong>
          {row.hours.map((cell, hour) => (
            <span
              key={hour}
              className={cell.future ? "future" : cell.cat ? "" : "empty"}
              title={cell.cat ? `${row.label} ${hour}시 · ${categoryById[cell.cat].label}` : cell.future ? "미래 시간" : "기록 없음"}
              style={cell.cat ? { background: categoryById[cell.cat].color } : undefined}
            />
          ))}
        </div>
      ))}
    </div>
  );
}

export function WeeklyStacked({ categories, weeklyTotals }: { categories: Category[]; weeklyTotals: WeeklyTotal[] }) {
  return (
    <div className="weekly-bars">
      {weeklyTotals.map((day, index) => {
        const total = categories.reduce((sum, category) => sum + day[category.id], 0);
        const isToday = index === weeklyTotals.length - 1;
        return (
          <div className="weekly-day" key={day.date}>
            <span className="bar-total">{fmtDurationShort(total)}</span>
            <div className={`stacked-bar ${isToday ? "today" : ""}`} style={{ height: `${total > 0 ? (total / 1440) * 100 : 8}%` }}>
              {categories.map((category) => {
                const value = day[category.id];
                if (!value || total === 0) return null;
                return (
                  <i
                    key={category.id}
                    title={`${category.label} ${fmtDuration(value)}`}
                    style={{ height: `${(value / total) * 100}%`, background: category.color }}
                  />
                );
              })}
            </div>
            <strong className={isToday ? "today-label" : ""}>{day.label}</strong>
            <span>{day.date}</span>
          </div>
        );
      })}
    </div>
  );
}
