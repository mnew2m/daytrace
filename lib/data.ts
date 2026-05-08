import type { Category, CategorySlug, Goal, TimeBlock, WeeklyTotal } from "./types";

export const categories: Category[] = [
  { id: "sleep", slug: "sleep", label: "수면", icon: "Moon", emoji: "😴", color: "#657895", tint: "#e9edf3", stroke: "#40536f", sortOrder: 10 },
  { id: "meal", slug: "meal", label: "식사", icon: "Utensils", emoji: "🍽️", color: "#bc7a52", tint: "#f7ecdf", stroke: "#8f5739", sortOrder: 20 },
  { id: "move", slug: "move", label: "이동", icon: "Train", emoji: "🚇", color: "#72906a", tint: "#edf3e9", stroke: "#536f4a", sortOrder: 30 },
  { id: "work", slug: "work", label: "업무", icon: "Laptop", emoji: "👩‍💻", color: "#4f7b68", tint: "#e5eee8", stroke: "#2f4f40", sortOrder: 40 },
  { id: "exercise", slug: "exercise", label: "운동", icon: "Dumbbell", emoji: "🏃", color: "#b76661", tint: "#f4e4e1", stroke: "#884844", sortOrder: 50 },
  { id: "leisure", slug: "leisure", label: "여가", icon: "Gamepad2", emoji: "🎮", color: "#806c9f", tint: "#eee8f5", stroke: "#5b4a78", sortOrder: 60 },
  { id: "other", slug: "other", label: "기타", icon: "Circle", emoji: "📌", color: "#7a776f", tint: "#efebe2", stroke: "#5c584f", sortOrder: 70 }
];

export const categoryById = Object.fromEntries(categories.map((c) => [c.id, c])) as Record<CategorySlug, Category>;

export const todayBlocks: TimeBlock[] = [
  { id: "t1", cat: "sleep", title: "", start: 0, end: 420, note: "" },
  { id: "t2", cat: "meal", title: "아침", start: 420, end: 450, note: "토스트 + 커피" },
  { id: "t3", cat: "move", title: "출근", start: 450, end: 510, note: "지하철" },
  { id: "t4", cat: "work", title: "디자인 리뷰", start: 510, end: 720, note: "Sprint 3 킥오프" },
  { id: "t5", cat: "meal", title: "점심", start: 720, end: 780, note: "김치찌개 + 동료들과" },
  { id: "t6", cat: "work", title: "오후 업무", start: 780, end: 1080, note: "미팅 2건" },
  { id: "t7", cat: "move", title: "퇴근", start: 1080, end: 1140, note: "" },
  { id: "t8", cat: "exercise", title: "러닝", start: 1140, end: 1200, note: "5km · 한강" },
  { id: "t9", cat: "meal", title: "저녁", start: 1200, end: 1260, note: "비빔밥" },
  { id: "t10", cat: "leisure", title: "휴식", start: 1260, end: 1380, note: "책 + 넷플릭스" }
];

export const nowMinutes = 14 * 60 + 25;

export const goals: Goal[] = [
  { categoryId: "sleep", dailyMinutes: 480 },
  { categoryId: "work", dailyMinutes: 480 },
  { categoryId: "exercise", dailyMinutes: 30 },
  { categoryId: "leisure", dailyMinutes: 120 }
];

export const weeklyTotals: WeeklyTotal[] = [
  { date: "4/30", label: "목", sleep: 420, meal: 130, move: 120, work: 540, exercise: 0, leisure: 90, other: 30 },
  { date: "5/1", label: "금", sleep: 450, meal: 145, move: 110, work: 510, exercise: 60, leisure: 90, other: 20 },
  { date: "5/2", label: "토", sleep: 390, meal: 140, move: 130, work: 580, exercise: 0, leisure: 60, other: 35 },
  { date: "5/3", label: "일", sleep: 440, meal: 150, move: 120, work: 530, exercise: 60, leisure: 100, other: 25 },
  { date: "5/4", label: "월", sleep: 410, meal: 160, move: 110, work: 460, exercise: 0, leisure: 180, other: 40 },
  { date: "5/5", label: "화", sleep: 540, meal: 180, move: 60, work: 0, exercise: 90, leisure: 480, other: 60 },
  { date: "5/6", label: "오늘", sleep: 420, meal: 150, move: 120, work: 510, exercise: 60, leisure: 120, other: 0 }
];

export function fmtTime(min: number) {
  const h = Math.floor(min / 60) % 24;
  const m = min % 60;
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
}

export function fmtDuration(mins: number) {
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  if (h === 0) return `${m}분`;
  if (m === 0) return `${h}시간`;
  return `${h}시간 ${m}분`;
}

export function fmtDurationShort(mins: number) {
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  if (h === 0) return `${m}m`;
  if (m === 0) return `${h}h`;
  return `${h}h ${m}m`;
}

export function totalsBy(blocks: TimeBlock[]) {
  const totals = Object.fromEntries(categories.map((c) => [c.id, 0])) as Record<CategorySlug, number>;
  blocks.forEach((block) => {
    totals[block.cat] += block.end - block.start;
  });
  return totals;
}
