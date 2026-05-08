"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { CalendarDays, ChevronLeft, ChevronRight, LayoutList, Settings } from "lucide-react";
import { AccountMenu } from "./AccountMenu";

function navState(pathname: string, href: string) {
  if (href === "/timeline") return pathname === "/timeline" || pathname.startsWith("/timeline/");
  return pathname.startsWith(href);
}

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const currentDate = dateFromPathname(pathname);
  const previousDate = addDays(currentDate, -1);
  const nextDate = addDays(currentDate, 1);
  const currentDatePath = formatDatePath(currentDate);
  const showDateSwitcher = pathname === "/timeline" || pathname.startsWith("/timeline/");
  const [datePickerOpen, setDatePickerOpen] = useState(false);
  const [pickerMonth, setPickerMonth] = useState(() => new Date(currentDate.getFullYear(), currentDate.getMonth(), 1));

  useEffect(() => {
    const nextDate = parseDatePath(currentDatePath);
    setPickerMonth(new Date(nextDate.getFullYear(), nextDate.getMonth(), 1));
    setDatePickerOpen(false);
  }, [currentDatePath, pathname]);

  return (
    <div className="shell">
      <header className="topbar">
        <Link href="/timeline" className="brand">
          <span className="brand-mark">D</span>
          <span>Daytrace</span>
        </Link>
        <div className="topbar-center">
          {showDateSwitcher ? (
            <div className="date-switcher">
              <Link aria-label="이전 날짜" href={`/timeline/${formatDatePath(previousDate)}`} className="icon-button">
                <ChevronLeft size={32} />
              </Link>
              <div className="date-picker-wrap">
                <button type="button" aria-expanded={datePickerOpen} aria-label="날짜 선택" className="date-label" onClick={() => setDatePickerOpen((open) => !open)}>
                  <CalendarDays size={16} />
                  <strong>{formatDateLabel(currentDate)}</strong>
                </button>
                {datePickerOpen ? (
                  <div className="date-popover">
                    <MiniCalendar
                      month={pickerMonth}
                      selectedDate={currentDate}
                      setMonth={setPickerMonth}
                      onSelect={(date) => router.push(`/timeline/${formatDatePath(date)}`)}
                    />
                  </div>
                ) : null}
              </div>
              <Link aria-label="다음 날짜" href={`/timeline/${formatDatePath(nextDate)}`} className="icon-button">
                <ChevronRight size={32} />
              </Link>
            </div>
          ) : null}
        </div>
        <div className="topbar-actions">
          <AccountMenu />
        </div>
      </header>
      <div className="shell-body">
        <aside className="sidebar">
          <div className="nav-section">기록</div>
          <NavItem href="/timeline" icon={<CalendarDays size={19} />} label="타임라인" active={navState(pathname, "/timeline")} />
          <NavItem href="/stats" icon={<LayoutList size={19} />} label="통계" active={navState(pathname, "/stats")} />
          <NavItem href="/categories" icon={<LayoutList size={19} />} label="카테고리" active={navState(pathname, "/categories")} />
          <div className="nav-section nav-section-settings">설정</div>
          <NavItem href="/settings" icon={<Settings size={19} />} label="환경설정" active={navState(pathname, "/settings")} />
          <div className="sidebar-tip">
            <strong>팁</strong>
            <span>타임라인의 빈 시간을 드래그하면 새 블록 초안을 만들 수 있습니다.</span>
          </div>
        </aside>
        <main className="content">{children}</main>
      </div>
    </div>
  );
}

function NavItem({ href, icon, label, active }: { href: string; icon: React.ReactNode; label: string; active: boolean }) {
  return (
    <Link className={`nav-item ${active ? "active" : ""}`} href={href}>
      {icon}
      <span>{label}</span>
    </Link>
  );
}

function MiniCalendar({
  month,
  selectedDate,
  setMonth,
  onSelect
}: {
  month: Date;
  selectedDate: Date;
  setMonth: (date: Date) => void;
  onSelect: (date: Date) => void;
}) {
  const firstDay = new Date(month.getFullYear(), month.getMonth(), 1);
  const startWeekday = firstDay.getDay();
  const daysInMonth = new Date(month.getFullYear(), month.getMonth() + 1, 0).getDate();
  const cells = [
    ...Array.from({ length: startWeekday }, () => null),
    ...Array.from({ length: daysInMonth }, (_, index) => new Date(month.getFullYear(), month.getMonth(), index + 1))
  ];

  return (
    <div className="mini-calendar">
      <div className="mini-calendar-head">
        <button type="button" aria-label="이전 달" onClick={() => setMonth(addDays(firstDay, -1))}>
          <ChevronLeft size={16} />
        </button>
        <strong>{month.getFullYear()}.{String(month.getMonth() + 1).padStart(2, "0")}</strong>
        <button type="button" aria-label="다음 달" onClick={() => setMonth(new Date(month.getFullYear(), month.getMonth() + 1, 1))}>
          <ChevronRight size={16} />
        </button>
      </div>
      <div className="mini-calendar-weekdays">
        {["일", "월", "화", "수", "목", "금", "토"].map((day) => (
          <span key={day}>{day}</span>
        ))}
      </div>
      <div className="mini-calendar-grid">
        {cells.map((date, index) =>
          date ? (
            <button
              key={formatDatePath(date)}
              type="button"
              className={formatDatePath(date) === formatDatePath(selectedDate) ? "selected" : ""}
              onClick={() => onSelect(date)}
            >
              {date.getDate()}
            </button>
          ) : (
            <span key={`blank-${index}`} />
          )
        )}
      </div>
    </div>
  );
}

function dateFromPathname(pathname: string) {
  const match = /^\/(?:today|timeline)\/(\d{4}-\d{2}-\d{2})/.exec(pathname);
  if (match) return parseDatePath(match[1]);
  return todayInKorea();
}

function parseDatePath(value: string) {
  const [year, month, day] = value.split("-").map(Number);
  return new Date(year, month - 1, day);
}

function todayInKorea() {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Seoul",
    year: "numeric",
    month: "2-digit",
    day: "2-digit"
  }).formatToParts(new Date());
  const year = Number(parts.find((part) => part.type === "year")?.value);
  const month = Number(parts.find((part) => part.type === "month")?.value);
  const day = Number(parts.find((part) => part.type === "day")?.value);
  return new Date(year, month - 1, day);
}

function addDays(date: Date, days: number) {
  const next = new Date(date);
  next.setDate(next.getDate() + days);
  return next;
}

function formatDatePath(date: Date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}

function formatDateLabel(date: Date) {
  return new Intl.DateTimeFormat("ko-KR", {
    year: "numeric",
    month: "long",
    day: "numeric",
    weekday: "short"
  }).format(date);
}
