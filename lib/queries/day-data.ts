import { redirect } from "next/navigation";
import { categories, goals } from "@/lib/data";
import { createClient } from "@/lib/supabase/server";
import { defaultTimelineSettings } from "@/lib/settings";
import type { Category, CategorySlug, Goal, TimeBlock, TimelineSettings } from "@/lib/types";

type DayData = {
  blocks: TimeBlock[];
  goals: Goal[];
  categories: Category[];
  timelineSettings: TimelineSettings;
  categoryPaletteId: string;
  userId: string | null;
};

type TimeBlockRow = {
  id: string;
  title: string | null;
  starts_at: string;
  ends_at: string;
  note: string | null;
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

type SettingsRow = {
  timeline_start_hour: number;
  timeline_end_hour: number;
  category_palette_id: string;
};

export async function getDayData(date: string): Promise<DayData> {
  const supabase = createClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const [startIso, endIso] = dateRangeToIso(date);
  await ensureUserSettings(user.id);
  await ensureUserCategories(user.id);

  const [{ data, error }, { data: categoryData, error: categoryError }, { data: settingsData, error: settingsError }] = await Promise.all([
    supabase
    .from("time_blocks")
    .select("id, title, starts_at, ends_at, note, categories!inner(slug)")
    .lt("starts_at", endIso)
    .gt("ends_at", startIso)
      .order("starts_at", { ascending: true }),
    supabase
      .from("categories")
      .select("slug, label, icon, emoji, color, tint, stroke, sort_order")
      .eq("user_id", user.id)
      .order("sort_order", { ascending: true }),
    supabase
      .from("user_settings")
      .select("timeline_start_hour, timeline_end_hour, category_palette_id")
      .eq("user_id", user.id)
      .single()
  ]);

  if (error) {
    throw new Error(error.message);
  }
  if (categoryError) {
    throw new Error(categoryError.message);
  }
  if (settingsError) {
    throw new Error(settingsError.message);
  }

  const blocks = ((data ?? []) as TimeBlockRow[]).map((row) => {
    const joinedCategory = Array.isArray(row.categories) ? row.categories[0] : row.categories;
    return {
      id: row.id,
      cat: joinedCategory?.slug ?? "other",
      title: row.title ?? "",
      start: isoToDayMinute(date, row.starts_at),
      end: isoToDayMinute(date, row.ends_at),
      note: row.note ?? ""
    };
  });

  return {
    blocks,
    goals,
    categories: mapCategories((categoryData ?? []) as CategoryRow[]),
    timelineSettings: mapSettings(settingsData as SettingsRow | null),
    categoryPaletteId: (settingsData as SettingsRow | null)?.category_palette_id ?? "default",
    userId: user.id
  };
}

async function ensureUserSettings(userId: string) {
  const supabase = createClient();
  const { error } = await supabase.from("user_settings").upsert({ user_id: userId }, { onConflict: "user_id" });

  if (error) {
    throw new Error(error.message);
  }
}

function mapCategories(rows: CategoryRow[]): Category[] {
  if (rows.length === 0) {
    throw new Error("카테고리 초기 데이터가 없습니다.");
  }

  return rows.map((row) => ({
    id: row.slug,
    slug: row.slug,
    label: row.label,
    icon: row.icon ?? "Circle",
    emoji: row.emoji ?? categories.find((category) => category.id === row.slug)?.emoji ?? "📌",
    color: row.color,
    tint: row.tint,
    stroke: row.stroke,
    sortOrder: row.sort_order ?? 0
  }));
}

async function ensureUserCategories(userId: string) {
  const supabase = createClient();
  const { error } = await supabase.rpc("seed_default_categories_for_user", { target_user: userId });

  if (error) {
    throw new Error(error.message);
  }
}

function mapSettings(row: SettingsRow | null): TimelineSettings {
  if (!row) return defaultTimelineSettings;

  return {
    startHour: row.timeline_start_hour,
    endHour: row.timeline_end_hour
  };
}

export function minuteToIso(date: string, minutes: number) {
  const start = Date.parse(`${date}T00:00:00+09:00`);
  return new Date(start + minutes * 60_000).toISOString();
}

function dateRangeToIso(date: string) {
  const start = Date.parse(`${date}T00:00:00+09:00`);
  return [new Date(start).toISOString(), new Date(start + 24 * 60 * 60_000).toISOString()] as const;
}

function isoToDayMinute(date: string, iso: string) {
  const start = Date.parse(`${date}T00:00:00+09:00`);
  return Math.round((Date.parse(iso) - start) / 60_000);
}
