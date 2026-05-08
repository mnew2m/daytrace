import { DailyLogApp } from "@/components/DailyLogApp";
import { getDayData } from "@/lib/queries/day-data";
import { addTimeBlock, deleteTimeBlock, updateCategory, updateCategoryPalette, updateTimeBlock, updateTimelineSettings } from "../actions";

export default async function TimelineDatePage({ params }: { params: { date: string } }) {
  const data = await getDayData(params.date);

  return (
    <DailyLogApp
      view="today"
      date={params.date}
      initialBlocks={data.blocks}
      initialGoals={data.goals}
      initialCategories={data.categories}
      initialTimelineSettings={data.timelineSettings}
      initialCategoryPaletteId={data.categoryPaletteId}
      saveBlock={addTimeBlock}
      updateBlock={updateTimeBlock}
      deleteBlock={deleteTimeBlock}
      updateTimelineSettings={updateTimelineSettings}
      updateCategory={updateCategory}
      updateCategoryPalette={updateCategoryPalette}
    />
  );
}
