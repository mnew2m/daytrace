"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Bell, CalendarDays, ChevronLeft, ChevronRight, LayoutList, Search, Settings } from "lucide-react";
import { AccountMenu } from "./AccountMenu";

function navState(pathname: string, href: string) {
  if (href === "/today") return pathname === "/today" || pathname.startsWith("/today/");
  return pathname.startsWith(href);
}

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const currentDate = dateFromPathname(pathname);
  const previousDate = addDays(currentDate, -1);
  const nextDate = addDays(currentDate, 1);

  return (
    <div className="shell">
      <header className="topbar">
        <Link href="/today" className="brand">
          <span className="brand-mark">D</span>
          <span>Daytrace</span>
        </Link>
        <div className="date-switcher">
          <Link aria-label="이전 날짜" href={`/today/${formatDatePath(previousDate)}`} className="icon-button">
            <ChevronLeft size={16} />
          </Link>
          <div className="date-label">
            <strong>{formatDateLabel(currentDate)}</strong>
            <span>{isToday(currentDate) ? "오늘" : formatDatePath(currentDate)}</span>
          </div>
          <Link aria-label="다음 날짜" href={`/today/${formatDatePath(nextDate)}`} className="icon-button">
            <ChevronRight size={16} />
          </Link>
        </div>
        <div className="topbar-actions">
          <button className="icon-button" aria-label="검색">
            <Search size={18} />
          </button>
          <button className="icon-button" aria-label="알림">
            <Bell size={18} />
          </button>
          <AccountMenu />
        </div>
      </header>
      <div className="shell-body">
        <aside className="sidebar">
          <div className="nav-section">기록</div>
          <NavItem href="/today" icon={<CalendarDays size={19} />} label="오늘" active={navState(pathname, "/today")} />
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

function dateFromPathname(pathname: string) {
  const match = /^\/today\/(\d{4}-\d{2}-\d{2})/.exec(pathname);
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

function isToday(date: Date) {
  return formatDatePath(date) === formatDatePath(todayInKorea());
}
