import { categories, goals, todayBlocks } from "@/lib/data";
import { todayInKoreaPath } from "@/lib/date";
import { createClient } from "@/lib/supabase/server";
import type { CategorySlug, Goal, TimeBlock } from "@/lib/types";

type DayData = {
  blocks: TimeBlock[];
  goals: Goal[];
  isPreview: boolean;
  userId: string | null;
};

type TimeBlockRow = {
  id: string;
  starts_at: string;
  ends_at: string;
  note: string | null;
  categories: { slug: CategorySlug } | { slug: CategorySlug }[] | null;
};

export async function getDayData(date: string): Promise<DayData> {
  const supabase = createClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();

  if (!user) {
    return { blocks: date === todayInKoreaPath() ? todayBlocks : [], goals, isPreview: true, userId: null };
  }

  const [startIso, endIso] = dateRangeToIso(date);
  const { data, error } = await supabase
    .from("time_blocks")
    .select("id, starts_at, ends_at, note, categories!inner(slug)")
    .lt("starts_at", endIso)
    .gt("ends_at", startIso)
    .order("starts_at", { ascending: true });

  if (error) {
    throw new Error(error.message);
  }

  const blocks = ((data ?? []) as TimeBlockRow[]).map((row) => {
    const joinedCategory = Array.isArray(row.categories) ? row.categories[0] : row.categories;
    return {
      id: row.id,
      cat: joinedCategory?.slug ?? "other",
      start: isoToDayMinute(date, row.starts_at),
      end: isoToDayMinute(date, row.ends_at),
      note: row.note ?? ""
    };
  });

  return {
    blocks,
    goals,
    isPreview: false,
    userId: user.id
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
