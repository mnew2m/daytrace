export type CategorySlug =
  | "sleep"
  | "meal"
  | "move"
  | "work"
  | "exercise"
  | "leisure"
  | "other";

export type Category = {
  id: CategorySlug;
  slug: CategorySlug;
  label: string;
  icon: string;
  emoji: string;
  color: string;
  tint: string;
  stroke: string;
  sortOrder: number;
};

export type TimeBlock = {
  id: string;
  cat: CategorySlug;
  title: string;
  start: number;
  end: number;
  note: string;
};

export type AddTimeBlockInput = {
  date: string;
  cat: CategorySlug;
  title?: string;
  start: number;
  end: number;
  note?: string;
};

export type UpdateTimeBlockInput = AddTimeBlockInput & {
  id: string;
};

export type DeleteTimeBlockInput = {
  id: string;
  date: string;
};

export type TimelineSettings = {
  startHour: number;
  endHour: number;
};

export type UpdateTimelineSettingsInput = TimelineSettings;

export type UpdateCategoryInput = {
  id: CategorySlug;
  label?: string;
  emoji?: string;
  color?: string;
  tint?: string;
  stroke?: string;
};

export type Goal = {
  categoryId: CategorySlug;
  dailyMinutes: number;
};

export type WeeklyTotal = {
  date: string;
  label: string;
} & Record<CategorySlug, number>;

export type StatsHeatmapCell = {
  cat: CategorySlug | null;
  future?: boolean;
};

export type StatsHeatmapRow = {
  date: string;
  label: string;
  isToday: boolean;
  hours: StatsHeatmapCell[];
};

export type StatsKpi = {
  title: string;
  value: string;
  sub: string;
};

export type StatsInsight = {
  tone: "warning" | "success" | "info";
  title: string;
  body: string;
};
