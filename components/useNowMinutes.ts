"use client";

import { useEffect, useState } from "react";
import { nowMinutes as initialNowMinutes } from "@/lib/data";

function currentMinutes() {
  const now = new Date();
  return now.getHours() * 60 + now.getMinutes();
}

export function useNowMinutes() {
  const [minutes, setMinutes] = useState(initialNowMinutes);

  useEffect(() => {
    const refresh = () => setMinutes(currentMinutes());
    refresh();

    const msUntilNextMinute = (60 - new Date().getSeconds()) * 1000;
    let intervalId: number | undefined;
    const timeoutId = window.setTimeout(() => {
      refresh();
      intervalId = window.setInterval(refresh, 60_000);
    }, msUntilNextMinute);

    return () => {
      window.clearTimeout(timeoutId);
      if (intervalId) window.clearInterval(intervalId);
    };
  }, []);

  return minutes;
}
