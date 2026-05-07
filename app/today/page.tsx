import { DailyLogApp } from "@/components/DailyLogApp";
import { todayInKoreaPath } from "@/lib/date";
import { getDayData } from "@/lib/queries/day-data";
import { addTimeBlock, deleteTimeBlock, updateTimeBlock } from "./actions";

export default async function TodayPage() {
  const date = todayInKoreaPath();
  const data = await getDayData(date);

  return (
    <DailyLogApp
      view="today"
      date={date}
      initialBlocks={data.blocks}
      initialGoals={data.goals}
      isPreview={data.isPreview}
      saveBlock={data.isPreview ? undefined : addTimeBlock}
      updateBlock={data.isPreview ? undefined : updateTimeBlock}
      deleteBlock={data.isPreview ? undefined : deleteTimeBlock}
    />
  );
}
