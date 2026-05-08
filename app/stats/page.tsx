import { DailyLogApp } from "@/components/DailyLogApp";
import { getStatsData } from "@/lib/queries/stats-data";

export default async function StatsPage() {
  const stats = await getStatsData();

  return <DailyLogApp view="stats" initialStats={stats} />;
}
