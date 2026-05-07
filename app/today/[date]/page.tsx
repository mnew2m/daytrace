import { DailyLogApp } from "@/components/DailyLogApp";
import { getDayData } from "@/lib/queries/day-data";
import { addTimeBlock, deleteTimeBlock, updateTimeBlock } from "../actions";

export default async function DatePage({ params }: { params: { date: string } }) {
  const data = await getDayData(params.date);

  return (
    <DailyLogApp
      view="today"
      date={params.date}
      initialBlocks={data.blocks}
      initialGoals={data.goals}
      isPreview={data.isPreview}
      saveBlock={data.isPreview ? undefined : addTimeBlock}
      updateBlock={data.isPreview ? undefined : updateTimeBlock}
      deleteBlock={data.isPreview ? undefined : deleteTimeBlock}
    />
  );
}
