"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { minuteToIso } from "@/lib/queries/day-data";
import type { CategoryPaletteId } from "@/lib/category-palettes";
import type { AddTimeBlockInput, DeleteTimeBlockInput, UpdateCategoryInput, UpdateTimeBlockInput, UpdateTimelineSettingsInput } from "@/lib/types";

export async function addTimeBlock(input: AddTimeBlockInput) {
  const supabase = createClient();
  const {
    data: { user },
    error: userError
  } = await supabase.auth.getUser();

  if (userError || !user) {
    throw new Error("로그인이 필요합니다.");
  }

  const { data: category, error: categoryError } = await supabase
    .from("categories")
    .select("id")
    .eq("user_id", user.id)
    .eq("slug", input.cat)
    .single();

  if (categoryError || !category) {
    throw new Error(categoryError?.message ?? "카테고리를 찾을 수 없습니다.");
  }

  const { error } = await supabase.from("time_blocks").insert({
    user_id: user.id,
    category_id: category.id,
    title: input.title ?? null,
    starts_at: minuteToIso(input.date, input.start),
    ends_at: minuteToIso(input.date, input.end),
    note: input.note ?? null
  });

  if (error) {
    throw new Error(error.message);
  }

  revalidateTimeline(input.date);
}

export async function updateTimeBlock(input: UpdateTimeBlockInput) {
  const supabase = createClient();
  const {
    data: { user },
    error: userError
  } = await supabase.auth.getUser();

  if (userError || !user) {
    throw new Error("로그인이 필요합니다.");
  }

  const { data: category, error: categoryError } = await supabase
    .from("categories")
    .select("id")
    .eq("user_id", user.id)
    .eq("slug", input.cat)
    .single();

  if (categoryError || !category) {
    throw new Error(categoryError?.message ?? "카테고리를 찾을 수 없습니다.");
  }

  const { error } = await supabase
    .from("time_blocks")
    .update({
      category_id: category.id,
      title: input.title ?? null,
      starts_at: minuteToIso(input.date, input.start),
      ends_at: minuteToIso(input.date, input.end),
      note: input.note ?? null
    })
    .eq("id", input.id)
    .eq("user_id", user.id);

  if (error) {
    throw new Error(error.message);
  }

  revalidateTimeline(input.date);
}

export async function deleteTimeBlock(input: DeleteTimeBlockInput) {
  const supabase = createClient();
  const {
    data: { user },
    error: userError
  } = await supabase.auth.getUser();

  if (userError || !user) {
    throw new Error("로그인이 필요합니다.");
  }

  const { error } = await supabase.from("time_blocks").delete().eq("id", input.id).eq("user_id", user.id);

  if (error) {
    throw new Error(error.message);
  }

  revalidateTimeline(input.date);
}

export async function updateTimelineSettings(input: UpdateTimelineSettingsInput) {
  if (!Number.isInteger(input.startHour) || !Number.isInteger(input.endHour) || input.startHour < 0 || input.startHour > 23 || input.endHour < 1 || input.endHour > 24 || input.endHour <= input.startHour) {
    throw new Error("캘린더 표시 시간 범위가 올바르지 않습니다.");
  }

  const user = await requireUser();
  const supabase = createClient();
  const { error } = await supabase.from("user_settings").upsert(
    {
      user_id: user.id,
      timeline_start_hour: input.startHour,
      timeline_end_hour: input.endHour
    },
    { onConflict: "user_id" }
  );

  if (error) {
    throw new Error(error.message);
  }

  revalidatePath("/timeline");
}

export async function updateCategory(input: UpdateCategoryInput) {
  const user = await requireUser();
  const supabase = createClient();
  const update: Record<string, string> = {};

  if (input.id !== "sleep") {
    if (input.label !== undefined) update.label = input.label;
    if (input.emoji !== undefined) update.emoji = input.emoji;
  }
  if (input.color !== undefined) update.color = input.color;
  if (input.tint !== undefined) update.tint = input.tint;
  if (input.stroke !== undefined) update.stroke = input.stroke;

  const { error } = await supabase.from("categories").update(update).eq("user_id", user.id).eq("slug", input.id);

  if (error) {
    throw new Error(error.message);
  }

  revalidatePath("/timeline");
}

export async function updateCategoryPalette(paletteId: CategoryPaletteId, categories: UpdateCategoryInput[]) {
  const user = await requireUser();
  const supabase = createClient();

  const { error: settingsError } = await supabase.from("user_settings").upsert(
    {
      user_id: user.id,
      category_palette_id: paletteId
    },
    { onConflict: "user_id" }
  );

  if (settingsError) {
    throw new Error(settingsError.message);
  }

  await Promise.all(categories.map((category) => updateCategory(category)));
  revalidatePath("/timeline");
}

async function requireUser() {
  const supabase = createClient();
  const {
    data: { user },
    error
  } = await supabase.auth.getUser();

  if (error || !user) {
    throw new Error("로그인이 필요합니다.");
  }

  return user;
}

function revalidateTimeline(date: string) {
  revalidatePath("/timeline");
  revalidatePath(`/timeline/${date}`);
}
