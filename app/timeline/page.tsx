import { DailyLogApp } from "@/components/DailyLogApp";
import { todayInKoreaPath } from "@/lib/date";
import { getDayData } from "@/lib/queries/day-data";
import { addTimeBlock, deleteTimeBlock, updateCategory, updateCategoryPalette, updateTimeBlock, updateTimelineSettings } from "./actions";

export default async function TimelinePage() {
  const date = todayInKoreaPath();
  const data = await getDayData(date);

  return (
    <DailyLogApp
      view="today"
      date={date}
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
