"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { minuteToIso } from "@/lib/queries/day-data";
import type { AddTimeBlockInput } from "@/lib/types";

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
    starts_at: minuteToIso(input.date, input.start),
    ends_at: minuteToIso(input.date, input.end),
    note: input.note ?? null
  });

  if (error) {
    throw new Error(error.message);
  }

  revalidatePath("/today");
  revalidatePath(`/today/${input.date}`);
}
