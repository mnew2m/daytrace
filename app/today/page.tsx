import { DailyLogApp } from "@/components/DailyLogApp";
import { getDayData } from "@/lib/queries/day-data";
import { addTimeBlock } from "./actions";

export default async function TodayPage() {
  const date = "2026-05-06";
  const data = await getDayData(date);

  return (
    <DailyLogApp
      view="today"
      date={date}
      initialBlocks={data.blocks}
      initialGoals={data.goals}
      isPreview={data.isPreview}
      saveBlock={data.isPreview ? undefined : addTimeBlock}
    />
  );
}
