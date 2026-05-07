import { categories, categoryById, fmtDuration, fmtDurationShort, nowMinutes, weeklyTotals } from "@/lib/data";
import type { CategorySlug } from "@/lib/types";

export function Heatmap() {
  const rows = ["월", "화", "수", "목", "금", "토", "오늘"].map((label, dayIndex) => {
    const isToday = dayIndex === 6;
    const isWeekend = dayIndex === 5;
    const hours = Array.from({ length: 24 }, (_, hour): CategorySlug | null => {
      if (isToday && hour * 60 > nowMinutes) return null;
      if (hour < 7) return "sleep";
      if (hour === 7 || hour === 12 || hour === 20) return "meal";
      if (hour === 8 || hour === 18) return isWeekend ? "leisure" : "move";
      if ((hour >= 9 && hour < 12) || (hour >= 13 && hour < 18)) return isWeekend ? "leisure" : "work";
      if (hour === 19) return dayIndex % 2 === 1 ? "exercise" : "meal";
      if (hour >= 21 && hour < 23) return "leisure";
      return "sleep";
    });
    return { label, hours, isToday };
  });

  return (
    <div className="heatmap">
      <div className="heatmap-row heatmap-head">
        <span />
        {Array.from({ length: 24 }, (_, h) => (
          <span key={h}>{h % 3 === 0 ? h : ""}</span>
        ))}
      </div>
      {rows.map((row) => (
        <div className="heatmap-row" key={row.label}>
          <strong className={row.isToday ? "today" : ""}>{row.label}</strong>
          {row.hours.map((cat, hour) => (
            <span
              key={hour}
              className={cat ? "" : "future"}
              title={cat ? `${row.label} ${hour}시 · ${categoryById[cat].label}` : "미래 시간"}
              style={cat ? { background: categoryById[cat].color } : undefined}
            />
          ))}
        </div>
      ))}
    </div>
  );
}

export function WeeklyStacked() {
  return (
    <div className="weekly-bars">
      {weeklyTotals.map((day, index) => {
        const total = categories.reduce((sum, category) => sum + day[category.id], 0);
        const isToday = index === weeklyTotals.length - 1;
        return (
          <div className="weekly-day" key={day.date}>
            <span className="bar-total">{fmtDurationShort(total)}</span>
            <div className={`stacked-bar ${isToday ? "today" : ""}`} style={{ height: `${(total / 1440) * 100}%` }}>
              {categories.map((category) => {
                const value = day[category.id];
                if (!value) return null;
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
