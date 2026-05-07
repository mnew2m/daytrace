"use client";

import { useMemo, useState, useTransition } from "react";
import { AppShell } from "./AppShell";
import { Badge, Button, Card, CategoryIcon, TextInput } from "./ui";
import { MiniDayBar } from "./charts/MiniDayBar";
import { Heatmap, WeeklyStacked } from "./charts/StatsCharts";
import { DayView } from "./timeline/DayView";
import { categories, categoryById, fmtDuration, fmtDurationShort, fmtTime, goals as defaultGoals, nowMinutes, todayBlocks, totalsBy } from "@/lib/data";
import type { AddTimeBlockInput, CategorySlug, Goal, TimeBlock } from "@/lib/types";

export function DailyLogApp({
  view = "today",
  date = "2026-05-06",
  initialBlocks = todayBlocks,
  initialGoals = defaultGoals,
  isPreview = true,
  saveBlock
}: {
  view?: "today" | "stats" | "categories" | "settings";
  date?: string;
  initialBlocks?: TimeBlock[];
  initialGoals?: Goal[];
  isPreview?: boolean;
  saveBlock?: (input: AddTimeBlockInput) => Promise<void>;
}) {
  const [blocks, setBlocks] = useState<TimeBlock[]>(initialBlocks);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [draft, setDraft] = useState<{ start: number; end: number } | null>(null);
  const [draftCat, setDraftCat] = useState<CategorySlug>("work");
  const [draftNote, setDraftNote] = useState("");
  const [message, setMessage] = useState<string | null>(isPreview ? "Preview mode: 로그인 전에는 시안 데이터로 동작합니다." : null);
  const [isPending, startTransition] = useTransition();
  const totals = useMemo(() => totalsBy(blocks), [blocks]);

  function addDraft() {
    if (!draft) return;
    const nextBlock = { id: `b${Date.now()}`, cat: draftCat, start: draft.start, end: draft.end, note: draftNote };
    setBlocks((current) => [...current, nextBlock]);
    setDraft(null);
    setDraftNote("");

    if (!saveBlock || isPreview) {
      setMessage("Preview mode에서는 화면에만 추가됩니다. OAuth 로그인 연결 후 DB에 저장됩니다.");
      return;
    }

    startTransition(async () => {
      try {
        await saveBlock({ date, cat: nextBlock.cat, start: nextBlock.start, end: nextBlock.end, note: nextBlock.note });
        setMessage("저장했습니다.");
      } catch (error) {
        setMessage(error instanceof Error ? error.message : "저장에 실패했습니다.");
      }
    });
  }

  return (
    <AppShell>
      {view === "today" ? (
        <TodayView
          blocks={blocks}
          goals={initialGoals}
          totals={totals}
          selectedId={selectedId}
          setSelectedId={setSelectedId}
          draft={draft}
          setDraft={setDraft}
          draftCat={draftCat}
          setDraftCat={setDraftCat}
          draftNote={draftNote}
          setDraftNote={setDraftNote}
          addDraft={addDraft}
          isPending={isPending}
          message={message}
        />
      ) : null}
      {view === "stats" ? <StatsView /> : null}
      {view === "categories" ? <CategoriesView /> : null}
      {view === "settings" ? <SettingsView /> : null}
    </AppShell>
  );
}

function TodayView(props: {
  blocks: TimeBlock[];
  goals: Goal[];
  totals: Record<CategorySlug, number>;
  selectedId: string | null;
  setSelectedId: (id: string | null) => void;
  draft: { start: number; end: number } | null;
  setDraft: (draft: { start: number; end: number } | null) => void;
  draftCat: CategorySlug;
  setDraftCat: (cat: CategorySlug) => void;
  draftNote: string;
  setDraftNote: (note: string) => void;
  addDraft: () => void;
  isPending: boolean;
  message: string | null;
}) {
  const totalLogged = Object.values(props.totals).reduce((sum, value) => sum + value, 0);
  const activeBlock = props.blocks.find((block) => block.start <= nowMinutes && block.end >= nowMinutes);
  const selected = props.blocks.find((block) => block.id === props.selectedId);
  const topCategory = Object.entries(props.totals)
    .filter(([cat]) => cat !== "sleep")
    .sort((a, b) => b[1] - a[1])[0] as [CategorySlug, number];

  return (
    <div className="today-layout">
      <div className="today-main">
        <div className="kpi-grid">
          <Card className="mini-card">
            <div className="card-head">
              <span>오늘 한눈에 보기</span>
              <small>{fmtTime(nowMinutes)} 기준</small>
            </div>
            <MiniDayBar blocks={props.blocks} />
          </Card>
          <Kpi title="기록한 시간" value={fmtDurationShort(totalLogged)} sub={`${props.blocks.length}개 블록`} />
          <Kpi title="가장 많이" value={categoryById[topCategory[0]].label} sub={fmtDurationShort(topCategory[1])} />
          <Kpi title="현재 진행 중" value={activeBlock ? categoryById[activeBlock.cat].label : "-"} sub={activeBlock ? `${fmtTime(activeBlock.start)} 시작` : "없음"} />
        </div>

        <Card className="timeline-card">
          <div className="timeline-head">
            <div>
              <strong>타임라인</strong>
              <Badge>{fmtDuration(totalLogged)} 기록됨</Badge>
            </div>
            <div className="legend">
              {categories.slice(0, 6).map((category) => (
                <span key={category.id}>
                  <i style={{ background: category.color }} />
                  {category.label}
                </span>
              ))}
            </div>
          </div>
          <div className="timeline-scroll">
            <DayView
              blocks={props.blocks}
              selectedId={props.selectedId}
              onSelect={(id) => props.setSelectedId(id === props.selectedId ? null : id)}
              onDraft={props.setDraft}
            />
          </div>
        </Card>
      </div>

      <aside className="right-rail">
        <section className="panel">
          <div className="panel-title">
            <strong>{props.draft ? "새 블록 추가" : "빠른 추가"}</strong>
            {props.draft ? <button onClick={() => props.setDraft(null)}>취소</button> : null}
          </div>
          <div className="category-picker">
            {categories.slice(0, 6).map((category) => (
              <button
                key={category.id}
                className={props.draftCat === category.id ? "active" : ""}
                onClick={() => props.setDraftCat(category.id)}
                style={{ "--cat": category.color, "--cat-tint": category.tint } as React.CSSProperties}
              >
                <CategoryIcon name={category.icon} size={14} />
                {category.label}
              </button>
            ))}
          </div>
          <div className="time-fields">
            <TimeField label="시작" value={props.draft ? fmtTime(props.draft.start) : fmtTime(nowMinutes)} />
            <TimeField label="종료" value={props.draft ? fmtTime(props.draft.end) : "지금"} />
          </div>
          <TextInput placeholder="메모 (선택)" value={props.draftNote} onChange={(event) => props.setDraftNote(event.target.value)} />
          <Button appearance="primary" onClick={props.addDraft} disabled={props.isPending}>{props.draft ? "저장" : "지금부터 시작"}</Button>
          {props.message ? <p className="panel-message">{props.message}</p> : null}
        </section>

        {selected ? (
          <section className="selected-panel" style={{ background: categoryById[selected.cat].tint, borderColor: categoryById[selected.cat].color }}>
            <small>선택됨</small>
            <strong>{categoryById[selected.cat].label}</strong>
            <span>
              {fmtTime(selected.start)}-{fmtTime(selected.end)} · {fmtDuration(selected.end - selected.start)}
            </span>
            <p>{selected.note}</p>
            <div>
              <Button>편집</Button>
              <Button appearance="subtle">삭제</Button>
            </div>
          </section>
        ) : null}

        <section className="rail-section">
          <div className="panel-title">
            <strong>오늘 목표</strong>
            <button>편집</button>
          </div>
          {props.goals.map((goal) => {
            const category = categoryById[goal.categoryId];
            const value = props.totals[goal.categoryId];
            const done = value >= goal.dailyMinutes;
            return (
              <div className="goal-row" key={goal.categoryId}>
                <div>
                  <span>
                    <i style={{ background: category.color }} />
                    {category.label}
                  </span>
                  <strong>{fmtDurationShort(value)} / {fmtDurationShort(goal.dailyMinutes)}</strong>
                </div>
                <em>
                  <i style={{ width: `${Math.min(100, (value / goal.dailyMinutes) * 100)}%`, background: done ? "var(--color-success)" : category.color }} />
                </em>
              </div>
            );
          })}
        </section>

        <section className="rail-section">
          <strong>카테고리 합계</strong>
          {categories.filter((category) => props.totals[category.id] > 0).map((category) => (
            <div className="total-row" key={category.id}>
              <i style={{ background: category.color }} />
              <span>{category.label}</span>
              <strong>{fmtDurationShort(props.totals[category.id])}</strong>
            </div>
          ))}
        </section>
      </aside>
    </div>
  );
}

function Kpi({ title, value, sub }: { title: string; value: string; sub: string }) {
  return (
    <Card className="kpi-card">
      <span>{title}</span>
      <strong>{value}</strong>
      <small>{sub}</small>
    </Card>
  );
}

function TimeField({ label, value }: { label: string; value: string }) {
  return (
    <label className="time-field">
      <span>{label}</span>
      <strong>{value}</strong>
    </label>
  );
}

function StatsView() {
  return (
    <div className="page-pad">
      <div className="page-title">
        <div>
          <h1>지난 7일 통계</h1>
          <p>4월 30일 - 5월 6일 · 패턴과 추이 분석</p>
        </div>
        <div className="segmented">
          <button className="active">이번 주</button>
          <button>지난 4주</button>
          <button>지난 30일</button>
        </div>
      </div>
      <div className="kpi-grid stats-kpis">
        <Kpi title="평균 수면" value="7h 12m" sub="목표 8h · -48m" />
        <Kpi title="평균 업무" value="7h 30m" sub="딥워크 10-12시" />
        <Kpi title="운동" value="주 3회" sub="화·목·토 저녁" />
        <Kpi title="여가" value="2h" sub="저녁 9-11시" />
      </div>
      <Card className="chart-card">
        <div className="card-head">
          <strong>요일 × 시간 패턴</strong>
          <small>각 칸 = 1시간 · 색 = 주 활동</small>
        </div>
        <Heatmap />
      </Card>
      <div className="stats-bottom">
        <Card className="chart-card">
          <strong>일별 합계</strong>
          <WeeklyStacked />
        </Card>
        <Card className="chart-card">
          <strong>인사이트</strong>
          <Insight tone="warning" title="수요일 수면 부족" body="이번 주 수요일은 목표보다 1시간 30분 적습니다." />
          <Insight tone="success" title="운동 패턴 안정적" body="화·목·토 저녁 운동 흐름이 유지되고 있습니다." />
          <Insight tone="info" title="딥워크 시간대" body="오전 10-12시에 업무 시간이 가장 안정적입니다." />
        </Card>
      </div>
    </div>
  );
}

function Insight({ tone, title, body }: { tone: string; title: string; body: string }) {
  return (
    <div className={`insight ${tone}`}>
      <strong>{title}</strong>
      <span>{body}</span>
    </div>
  );
}

function CategoriesView() {
  return (
    <div className="page-pad">
      <div className="page-title">
        <div>
          <h1>카테고리 관리</h1>
          <p>기본 7개 카테고리와 색상 토큰</p>
        </div>
      </div>
      <div className="category-grid">
        {categories.map((category) => (
          <Card className="category-card" key={category.id}>
            <div>
              <span style={{ background: category.tint, color: category.stroke }}>
                <CategoryIcon name={category.icon} />
              </span>
              <div>
                <strong>{category.label}</strong>
                <small>{category.color}</small>
              </div>
            </div>
            <i style={{ background: category.color }} />
          </Card>
        ))}
      </div>
    </div>
  );
}

function SettingsView() {
  return (
    <div className="page-pad narrow">
      <div className="page-title">
        <div>
          <h1>환경설정</h1>
          <p>프로필, 알림, 데이터 내보내기</p>
        </div>
      </div>
      <Card className="settings-list">
        <Button icon="User">프로필</Button>
        <Button icon="Bell">알림</Button>
        <Button icon="Download">CSV / JSON 내보내기</Button>
        <Button icon="LogOut" appearance="danger">로그아웃</Button>
      </Card>
    </div>
  );
}
