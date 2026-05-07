"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Bell, CalendarDays, LayoutList, Search, Settings, User } from "lucide-react";

function navState(pathname: string, href: string) {
  if (href === "/today") return pathname === "/today" || pathname.startsWith("/today/");
  return pathname.startsWith(href);
}

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  return (
    <div className="shell">
      <header className="topbar">
        <Link href="/today" className="brand">
          <span className="brand-mark">D</span>
          <span>Daytrace</span>
        </Link>
        <div className="date-switcher">
          <Link aria-label="이전 날짜" href="/today/2026-05-05" className="icon-button">
            <CalendarDays size={15} />
          </Link>
          <div className="date-label">
            <strong>2026년 5월 6일 수요일</strong>
            <span>오늘</span>
          </div>
          <Link aria-label="다음 날짜" href="/today/2026-05-07" className="icon-button">
            <CalendarDays size={15} />
          </Link>
        </div>
        <div className="topbar-actions">
          <button className="icon-button" aria-label="검색">
            <Search size={18} />
          </button>
          <button className="icon-button" aria-label="알림">
            <Bell size={18} />
          </button>
          <span className="avatar" aria-label="사용자">
            <User size={17} />
          </span>
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
