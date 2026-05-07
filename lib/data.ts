import type { Category, CategorySlug, Goal, TimeBlock, WeeklyTotal } from "./types";

export const categories: Category[] = [
  { id: "sleep", slug: "sleep", label: "수면", icon: "Moon", color: "#5b6ea8", tint: "#e8ebf5", stroke: "#3f5191", sortOrder: 10 },
  { id: "meal", slug: "meal", label: "식사", icon: "Utensils", color: "#c4823f", tint: "#f7ecdc", stroke: "#9c6829", sortOrder: 20 },
  { id: "move", slug: "move", label: "이동", icon: "Train", color: "#6c8f5d", tint: "#e6eee0", stroke: "#4f6f43", sortOrder: 30 },
  { id: "work", slug: "work", label: "업무", icon: "Laptop", color: "#0f6cbd", tint: "#ebf3fc", stroke: "#0c3b5e", sortOrder: 40 },
  { id: "exercise", slug: "exercise", label: "운동", icon: "Dumbbell", color: "#a85a5a", tint: "#f4e2e2", stroke: "#7a3e3e", sortOrder: 50 },
  { id: "leisure", slug: "leisure", label: "여가", icon: "Gamepad2", color: "#8156a4", tint: "#efe6f5", stroke: "#5e3a7a", sortOrder: 60 },
  { id: "other", slug: "other", label: "기타", icon: "Circle", color: "#707070", tint: "#f0f0f0", stroke: "#525252", sortOrder: 70 }
];

export const categoryById = Object.fromEntries(categories.map((c) => [c.id, c])) as Record<CategorySlug, Category>;

export const todayBlocks: TimeBlock[] = [
  { id: "t1", cat: "sleep", start: 0, end: 420, note: "수면 7h" },
  { id: "t2", cat: "meal", start: 420, end: 450, note: "아침: 토스트 + 커피" },
  { id: "t3", cat: "move", start: 450, end: 510, note: "지하철 출근" },
  { id: "t4", cat: "work", start: 510, end: 720, note: "디자인 리뷰 / Sprint 3 킥오프" },
  { id: "t5", cat: "meal", start: 720, end: 780, note: "점심: 김치찌개 + 동료들과" },
  { id: "t6", cat: "work", start: 780, end: 1080, note: "오후 업무 · 미팅 2건" },
  { id: "t7", cat: "move", start: 1080, end: 1140, note: "퇴근" },
  { id: "t8", cat: "exercise", start: 1140, end: 1200, note: "러닝 5km · 한강" },
  { id: "t9", cat: "meal", start: 1200, end: 1260, note: "저녁: 비빔밥" },
  { id: "t10", cat: "leisure", start: 1260, end: 1380, note: "책 + 넷플릭스" }
];

export const nowMinutes = 14 * 60 + 25;

export const goals: Goal[] = [
  { categoryId: "sleep", dailyMinutes: 480 },
  { categoryId: "work", dailyMinutes: 480 },
  { categoryId: "exercise", dailyMinutes: 30 },
  { categoryId: "leisure", dailyMinutes: 120 }
];

export const weeklyTotals: WeeklyTotal[] = [
  { date: "4/30", label: "월", sleep: 420, meal: 130, move: 120, work: 540, exercise: 0, leisure: 90, other: 30 },
  { date: "5/1", label: "화", sleep: 450, meal: 145, move: 110, work: 510, exercise: 60, leisure: 90, other: 20 },
  { date: "5/2", label: "수", sleep: 390, meal: 140, move: 130, work: 580, exercise: 0, leisure: 60, other: 35 },
  { date: "5/3", label: "목", sleep: 440, meal: 150, move: 120, work: 530, exercise: 60, leisure: 100, other: 25 },
  { date: "5/4", label: "금", sleep: 410, meal: 160, move: 110, work: 460, exercise: 0, leisure: 180, other: 40 },
  { date: "5/5", label: "토", sleep: 540, meal: 180, move: 60, work: 0, exercise: 90, leisure: 480, other: 60 },
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
