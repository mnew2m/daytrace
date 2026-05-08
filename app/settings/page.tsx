import { DailyLogApp } from "@/components/DailyLogApp";
import { todayInKoreaPath } from "@/lib/date";
import { getDayData } from "@/lib/queries/day-data";
import { updateCategory, updateCategoryPalette, updateTimelineSettings } from "@/app/timeline/actions";

export default async function SettingsPage() {
  const data = await getDayData(todayInKoreaPath());

  return (
    <DailyLogApp
      view="settings"
      initialCategories={data.categories}
      initialTimelineSettings={data.timelineSettings}
      initialCategoryPaletteId={data.categoryPaletteId}
      updateTimelineSettings={updateTimelineSettings}
      updateCategory={updateCategory}
      updateCategoryPalette={updateCategoryPalette}
    />
  );
}
