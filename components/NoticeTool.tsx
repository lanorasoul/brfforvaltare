"use client";

import { useState } from "react";
import { NoticeCalendar, type NoticeState } from "./NoticeCalendar";
import { useToday } from "./useToday";

/** Uppsägningskalendern som fristående verktyg på sidan Byta förvaltare. */
export function NoticeTool({ today: serverToday, defaultEnd }: { today: string; defaultEnd: string }) {
  const [state, setState] = useState<NoticeState>({ mode: "year", end: defaultEnd, months: 3 });
  const today = useToday(serverToday);
  return <NoticeCalendar state={state} onChange={setState} today={today} />;
}
