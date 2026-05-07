"use client";

import { useEffect, useState } from "react";

const storageKey = "daytrace.timelineSettings";

export type TimelineSettings = {
  startHour: number;
  endHour: number;
};

export const defaultTimelineSettings: TimelineSettings = {
  startHour: 5,
  endHour: 24
};

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

export function useTimelineSettings() {
  const [settings, setSettingsState] = useState<TimelineSettings>(defaultTimelineSettings);

  useEffect(() => {
    setSettingsState(readSettings());
  }, []);

  function setSettings(next: TimelineSettings) {
    setSettingsState(next);
    window.localStorage.setItem(storageKey, JSON.stringify(next));
  }

  return [settings, setSettings] as const;
}
