"use client";

import { useEffect, useState } from "react";
import { defaultTimelineSettings } from "@/lib/settings";
import type { TimelineSettings, UpdateTimelineSettingsInput } from "@/lib/types";

const storageKey = "daytrace.timelineSettings";

function readSettings(): TimelineSettings {
  if (typeof window === "undefined") return defaultTimelineSettings;

  try {
    const raw = window.localStorage.getItem(storageKey);
    if (!raw) return defaultTimelineSettings;

    const parsed = JSON.parse(raw) as Partial<TimelineSettings>;
    const startHour = Number(parsed.startHour);
    const endHour = Number(parsed.endHour);

    if (!Number.isInteger(startHour) || !Number.isInteger(endHour)) return defaultTimelineSettings;
    if (startHour < 0 || startHour > 23 || endHour < 1 || endHour > 24 || endHour <= startHour) return defaultTimelineSettings;

    return { startHour, endHour };
  } catch {
    return defaultTimelineSettings;
  }
}

export function useTimelineSettings(initialSettings = defaultTimelineSettings, saveSettings?: (input: UpdateTimelineSettingsInput) => Promise<void>) {
  const [settings, setSettingsState] = useState<TimelineSettings>(initialSettings);

  useEffect(() => {
    setSettingsState(initialSettings);
  }, [initialSettings]);

  function setSettings(next: TimelineSettings) {
    setSettingsState(next);
    if (saveSettings) {
      void saveSettings(next);
      return;
    }

    window.localStorage.setItem(storageKey, JSON.stringify(next));
  }

  return [settings, setSettings] as const;
}
