import type { TimeBlock } from "@/lib/types";
import { todayBlocks } from "@/lib/data";

export async function getTimeBlocksForDate(_date: string): Promise<TimeBlock[]> {
  // Initial scaffold uses mock data. Replace with Supabase queries after auth is enabled.
  return todayBlocks;
}
