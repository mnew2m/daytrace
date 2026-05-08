import { redirect } from "next/navigation";
import { categories as defaultCategories, goals } from "@/lib/data";
import { todayInKoreaPath } from "@/lib/date";
import { createClient } from "@/lib/supabase/server";
import type { Category, CategorySlug, StatsHeatmapRow, StatsInsight, StatsKpi, WeeklyTotal } from "@/lib/types";

export type StatsData = {
  categories: Category[];
  heatmapRows: StatsHeatmapRow[];
  insights: StatsInsight[];
  kpis: StatsKpi[];
  rangeLabel: string;
  weeklyTotals: WeeklyTotal[];
};

type TimeBlockRow = {
  id: string;
  starts_at: string;
  ends_at: string;
  categories: { slug: CategorySlug } | { slug: CategorySlug }[] | null;
};

type CategoryRow = {
  slug: CategorySlug;
  label: string;
  icon: string | null;
  emoji: string | null;
  color: string;
  tint: string;
  stroke: string;
  sort_order: number | null;
};

const categorySlugs: CategorySlug[] = ["sleep", "meal", "move", "work", "exercise", "leisure", "other"];

export async function getStatsData(): Promise<StatsData> {
  const supabase = createClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  await ensureUserCategories(user.id);

  const today = todayInKoreaPath();
  const dates = lastDays(today, 7);
  const rangeStart = dateToKoreaMs(dates[0]);
  const rangeEnd = dateToKoreaMs(addDaysPath(today, 1));
  const now = new Date();
  const nowMs = now.getTime();

  const [{ data: categoryData, error: categoryError }, { data: blockData, error: blockError }] = await Promise.all([
    supabase
      .from("categories")
      .select("slug, label, icon, emoji, color, tint, stroke, sort_order")
      .eq("user_id", user.id)
      .order("sort_order", { ascending: true }),
    supabase
      .from("time_blocks")
      .select("id, starts_at, ends_at, categories!inner(slug)")
      .eq("user_id", user.id)
      .lt("starts_at", new Date(rangeEnd).toISOString())
      .gt("ends_at", new Date(rangeStart).toISOString())
      .order("starts_at", { ascending: true })
  ]);

  if (categoryError) throw new Error(categoryError.message);
  if (blockError) throw new Error(blockError.message);

  const categories = mapCategories((categoryData ?? []) as CategoryRow[]);
  const blocks = ((blockData ?? []) as TimeBlockRow[]).map((row) => {
    const joinedCategory = Array.isArray(row.categories) ? row.categories[0] : row.categories;
    return {
      cat: joinedCategory?.slug ?? "other",
      startMs: Date.parse(row.starts_at),
      endMs: Date.parse(row.ends_at)
    };
  });

  const weeklyTotals = dates.map((date) => {
    const totals = emptyTotals();
    const dayStart = dateToKoreaMs(date);
    const dayEnd = dayStart + dayMs;

    for (const block of blocks) {
      const overlap = overlapMinutes(block.startMs, block.endMs, dayStart, dayEnd);
      if (overlap > 0) totals[block.cat] += overlap;
    }

    return {
      date: formatShortDate(date),
      label: date === today ? "오늘" : formatWeekday(date),
      ...totals
    };
  });

  const heatmapRows = dates.map((date): StatsHeatmapRow => {
    const dayStart = dateToKoreaMs(date);
    const isToday = date === today;
    return {
      date,
      label: isToday ? "오늘" : formatWeekday(date),
      isToday,
      hours: Array.from({ length: 24 }, (_, hour) => {
        const hourStart = dayStart + hour * hourMs;
        const hourEnd = hourStart + hourMs;
        if (isToday && hourStart > nowMs) return { cat: null, future: true };

        const totals = emptyTotals();
        for (const block of blocks) {
          const overlap = overlapMinutes(block.startMs, block.endMs, hourStart, hourEnd);
          if (overlap > 0) totals[block.cat] += overlap;
        }

        const top = categorySlugs.reduce<CategorySlug | null>((best, slug) => {
          if (totals[slug] === 0) return best;
          if (!best || totals[slug] > totals[best]) return slug;
          return best;
        }, null);

        return { cat: top };
      })
    };
  });

  return {
    categories,
    heatmapRows,
    insights: buildInsights(weeklyTotals),
    kpis: buildKpis(weeklyTotals),
    rangeLabel: `${formatKoreanDate(dates[0])} - ${formatKoreanDate(dates[dates.length - 1])} · 실제 기록 기반`,
    weeklyTotals
  };
}

const dayMs = 24 * 60 * 60_000;
const hourMs = 60 * 60_000;

function emptyTotals() {
  return Object.fromEntries(categorySlugs.map((slug) => [slug, 0])) as Record<CategorySlug, number>;
}

function overlapMinutes(startMs: number, endMs: number, rangeStartMs: number, rangeEndMs: number) {
  return Math.max(0, Math.round((Math.min(endMs, rangeEndMs) - Math.max(startMs, rangeStartMs)) / 60_000));
}

function dateToKoreaMs(date: string) {
  return Date.parse(`${date}T00:00:00+09:00`);
}

function lastDays(today: string, count: number) {
  return Array.from({ length: count }, (_, index) => addDaysPath(today, index - count + 1));
}

function addDaysPath(date: string, days: number) {
  const next = new Date(dateToKoreaMs(date) + days * dayMs);
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Seoul",
    year: "numeric",
    month: "2-digit",
    day: "2-digit"
  }).format(next);
}

function formatShortDate(date: string) {
  const [, month, day] = date.split("-");
  return `${Number(month)}/${Number(day)}`;
}

function formatKoreanDate(date: string) {
  const [, month, day] = date.split("-");
  return `${Number(month)}월 ${Number(day)}일`;
}

function formatWeekday(date: string) {
  return new Intl.DateTimeFormat("ko-KR", { timeZone: "Asia/Seoul", weekday: "short" }).format(new Date(dateToKoreaMs(date)));
}

function mapCategories(rows: CategoryRow[]): Category[] {
  if (rows.length === 0) return defaultCategories;

  return rows.map((row) => ({
    id: row.slug,
    slug: row.slug,
    label: row.label,
    icon: row.icon ?? "Circle",
    emoji: row.emoji ?? defaultCategories.find((category) => category.id === row.slug)?.emoji ?? "",
    color: row.color,
    tint: row.tint,
    stroke: row.stroke,
    sortOrder: row.sort_order ?? 0
  }));
}

async function ensureUserCategories(userId: string) {
  const supabase = createClient();
  const { error } = await supabase.rpc("seed_default_categories_for_user", { target_user: userId });

  if (error) throw new Error(error.message);
}

function buildKpis(days: WeeklyTotal[]): StatsKpi[] {
  const average = (slug: CategorySlug) => Math.round(days.reduce((sum, day) => sum + day[slug], 0) / Math.max(1, days.length));
  const exerciseDays = days.filter((day) => day.exercise > 0).length;
  const sleepAverage = average("sleep");
  const workAverage = average("work");
  const leisureAverage = average("leisure");
  const sleepGoal = goals.find((goal) => goal.categoryId === "sleep")?.dailyMinutes ?? 480;
  const sleepDelta = sleepAverage - sleepGoal;

  return [
    { title: "평균 수면", value: fmtDurationShort(sleepAverage), sub: `목표 8h · ${formatSignedDuration(sleepDelta)}` },
    { title: "평균 업무", value: fmtDurationShort(workAverage), sub: `7일 합계 ${fmtDurationShort(days.reduce((sum, day) => sum + day.work, 0))}` },
    { title: "운동", value: `주 ${exerciseDays}회`, sub: `총 ${fmtDurationShort(days.reduce((sum, day) => sum + day.exercise, 0))}` },
    { title: "평균 여가", value: fmtDurationShort(leisureAverage), sub: `7일 합계 ${fmtDurationShort(days.reduce((sum, day) => sum + day.leisure, 0))}` }
  ];
}

function buildInsights(days: WeeklyTotal[]): StatsInsight[] {
  const lowestSleep = [...days].sort((a, b) => a.sleep - b.sleep)[0];
  const topWork = [...days].sort((a, b) => b.work - a.work)[0];
  const exerciseDays = days.filter((day) => day.exercise > 0).length;

  return [
    {
      tone: lowestSleep && lowestSleep.sleep < 420 ? "warning" : "info",
      title: lowestSleep ? `${lowestSleep.label} 수면 ${fmtDurationShort(lowestSleep.sleep)}` : "수면 기록 없음",
      body: lowestSleep ? "최근 7일 중 수면 시간이 가장 적은 날입니다." : "최근 7일 수면 기록이 아직 없습니다."
    },
    {
      tone: exerciseDays >= 3 ? "success" : "info",
      title: `운동 기록 ${exerciseDays}일`,
      body: exerciseDays >= 3 ? "이번 주 운동 빈도가 안정적입니다." : "운동 기록이 있는 날을 기준으로 집계했습니다."
    },
    {
      tone: "info",
      title: topWork ? `${topWork.label} 업무 집중` : "업무 기록 없음",
      body: topWork ? `업무 시간이 가장 긴 날은 ${fmtDurationShort(topWork.work)}입니다.` : "최근 7일 업무 기록이 아직 없습니다."
    }
  ];
}

function fmtDurationShort(mins: number) {
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  if (h === 0) return `${m}m`;
  if (m === 0) return `${h}h`;
  return `${h}h ${m}m`;
}

function formatSignedDuration(mins: number) {
  const sign = mins >= 0 ? "+" : "-";
  return `${sign}${fmtDurationShort(Math.abs(mins))}`;
}
