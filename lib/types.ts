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
  color: string;
  tint: string;
  stroke: string;
  sortOrder: number;
};

export type TimeBlock = {
  id: string;
  cat: CategorySlug;
  start: number;
  end: number;
  note: string;
};

export type AddTimeBlockInput = {
  date: string;
  cat: CategorySlug;
  start: number;
  end: number;
  note?: string;
};

export type Goal = {
  categoryId: CategorySlug;
  dailyMinutes: number;
};

export type WeeklyTotal = {
  date: string;
  label: string;
} & Record<CategorySlug, number>;
