"use client";

import { useEffect, useMemo, useState, useTransition } from "react";
import { AppShell } from "./AppShell";
import { AccountSettings } from "./AccountSettings";
import { Badge, Button, Card, CategoryIcon, TextInput } from "./ui";
import { MiniDayBar } from "./charts/MiniDayBar";
import { Heatmap, WeeklyStacked } from "./charts/StatsCharts";
import { DayView } from "./timeline/DayView";
import { useNowMinutes } from "./useNowMinutes";
import { defaultTimelineSettings, useTimelineSettings } from "./useTimelineSettings";
import { categories, categoryById, fmtDuration, fmtDurationShort, fmtTime, goals as defaultGoals, todayBlocks, totalsBy } from "@/lib/data";
import type { AddTimeBlockInput, DeleteTimeBlockInput, UpdateTimeBlockInput, CategorySlug, Goal, TimeBlock } from "@/lib/types";

export function DailyLogApp({
  view = "today",
  date = "2026-05-06",
  initialBlocks = todayBlocks,
  initialGoals = defaultGoals,
  isPreview = true,
  saveBlock,
  updateBlock,
  deleteBlock
}: {
  view?: "today" | "stats" | "categories" | "settings";
  date?: string;
  initialBlocks?: TimeBlock[];
  initialGoals?: Goal[];
  isPreview?: boolean;
  saveBlock?: (input: AddTimeBlockInput) => Promise<void>;
  updateBlock?: (input: UpdateTimeBlockInput) => Promise<void>;
  deleteBlock?: (input: DeleteTimeBlockInput) => Promise<void>;
}) {
  const [blocks, setBlocks] = useState<TimeBlock[]>(initialBlocks);
  const nowMinutes = useNowMinutes();
  const [timelineSettings, setTimelineSettings] = useTimelineSettings();
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [draft, setDraft] = useState<{ start: number; end: number } | null>(null);
  const [draftCat, setDraftCat] = useState<CategorySlug>("work");
  const [draftNote, setDraftNote] = useState("");
  const [message, setMessage] = useState<string | null>(isPreview ? "Preview mode: 로그인 전에는 시안 데이터로 동작합니다." : null);
  const [isPending, startTransition] = useTransition();
  const totals = useMemo(() => totalsBy(blocks), [blocks]);

  useEffect(() => {
    setBlocks(initialBlocks);
    setSelectedId(null);
    setDraft(null);
    setDraftNote("");
  }, [date, initialBlocks]);

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

  function saveSleep(start: number, end: number) {
    const existingSleep = blocks.find((block) => block.cat === "sleep");
    if (existingSleep) {
      editBlock({ ...existingSleep, start, end });
      return;
    }

    const previousBlocks = blocks;
    const nextBlock: TimeBlock = { id: `b${Date.now()}`, cat: "sleep", start, end, note: "" };
    setBlocks((current) => [nextBlock, ...current]);

    if (!saveBlock || isPreview) {
      setMessage("Preview mode에서는 화면에서만 수면 기록이 추가됩니다. OAuth 로그인 연결 후 DB에 저장됩니다.");
      return;
    }

    startTransition(async () => {
      try {
        await saveBlock({ date, cat: nextBlock.cat, start: nextBlock.start, end: nextBlock.end, note: nextBlock.note });
        setMessage("수면 기록을 저장했습니다.");
      } catch (error) {
        setBlocks(previousBlocks);
        setMessage(error instanceof Error ? error.message : "수면 기록 저장에 실패했습니다.");
      }
    });
  }

  function editBlock(nextBlock: TimeBlock) {
    const previousBlocks = blocks;
    setBlocks((current) => current.map((block) => (block.id === nextBlock.id ? nextBlock : block)));

    if (!updateBlock || isPreview) {
      setMessage("Preview mode에서는 화면에서만 수정됩니다. OAuth 로그인 연결 후 DB에 저장됩니다.");
      return;
    }

    startTransition(async () => {
      try {
        await updateBlock({ date, id: nextBlock.id, cat: nextBlock.cat, start: nextBlock.start, end: nextBlock.end, note: nextBlock.note });
        setMessage("수정했습니다.");
      } catch (error) {
        setBlocks(previousBlocks);
        setMessage(error instanceof Error ? error.message : "수정에 실패했습니다.");
      }
    });
  }

  function removeBlock(id: string) {
    const previousBlocks = blocks;
    setBlocks((current) => current.filter((block) => block.id !== id));
    setSelectedId(null);

    if (!deleteBlock || isPreview) {
      setMessage("Preview mode에서는 화면에서만 삭제됩니다. OAuth 로그인 연결 후 DB에 저장됩니다.");
      return;
    }

    startTransition(async () => {
      try {
        await deleteBlock({ date, id });
        setMessage("삭제했습니다.");
      } catch (error) {
        setBlocks(previousBlocks);
        setMessage(error instanceof Error ? error.message : "삭제에 실패했습니다.");
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
          nowMinutes={nowMinutes}
          onEditBlock={editBlock}
          onDeleteBlock={removeBlock}
          onSaveSleep={saveSleep}
          timelineSettings={timelineSettings}
        />
      ) : null}
      {view === "stats" ? <StatsView /> : null}
      {view === "categories" ? <CategoriesView /> : null}
      {view === "settings" ? <SettingsView timelineSettings={timelineSettings} setTimelineSettings={setTimelineSettings} /> : null}
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
  nowMinutes: number;
  onEditBlock: (block: TimeBlock) => void;
  onDeleteBlock: (id: string) => void;
  onSaveSleep: (start: number, end: number) => void;
  timelineSettings: { startHour: number; endHour: number };
}) {
  const totalLogged = Object.values(props.totals).reduce((sum, value) => sum + value, 0);
  const activityBlocks = props.blocks.filter((block) => block.cat !== "sleep");
  const sleepBlock = props.blocks.find((block) => block.cat === "sleep") ?? null;
  const activeBlock = activityBlocks.find((block) => block.start <= props.nowMinutes && block.end >= props.nowMinutes);
  const selected = activityBlocks.find((block) => block.id === props.selectedId);
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
              <small>{fmtTime(props.nowMinutes)} 기준</small>
            </div>
            <MiniDayBar blocks={props.blocks} nowMinutes={props.nowMinutes} />
          </Card>
          <Kpi title="기록한 시간" value={fmtDurationShort(totalLogged)} sub={`${props.blocks.length}개 블록`} />
          <Kpi title="가장 많이" value={categoryById[topCategory[0]].label} sub={fmtDurationShort(topCategory[1])} />
          <Kpi title="현재 진행 중" value={activeBlock ? categoryById[activeBlock.cat].label : "-"} sub={activeBlock ? `${fmtTime(activeBlock.start)} 시작` : "없음"} />
        </div>

        <SleepEditor block={sleepBlock} isPending={props.isPending} onSave={props.onSaveSleep} />

        <Card className="timeline-card">
          <div className="timeline-head">
            <div>
              <strong>타임라인</strong>
              <Badge>{fmtDuration(totalLogged)} 기록됨</Badge>
            </div>
            <div className="legend">
              {categories.filter((category) => category.id !== "sleep").slice(0, 6).map((category) => (
                <span key={category.id}>
                  <i style={{ background: category.color }} />
                  {category.label}
                </span>
              ))}
            </div>
          </div>
          <div className="timeline-scroll">
            <DayView
              blocks={activityBlocks}
              sleepBlock={sleepBlock}
              nowMinutes={props.nowMinutes}
              startHour={props.timelineSettings.startHour}
              endHour={props.timelineSettings.endHour}
              selectedId={props.selectedId}
              onSelect={(id) => props.setSelectedId(id === props.selectedId ? null : id)}
              onDraft={props.setDraft}
              onChangeBlockTime={(id, start, end) => {
                const block = activityBlocks.find((item) => item.id === id);
                if (block) props.onEditBlock({ ...block, start, end });
              }}
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
            {categories.filter((category) => category.id !== "sleep").slice(0, 6).map((category) => (
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
            <TimeField label="시작" value={props.draft ? fmtTime(props.draft.start) : fmtTime(props.nowMinutes)} />
            <TimeField label="종료" value={props.draft ? fmtTime(props.draft.end) : "지금"} />
          </div>
          <TextInput placeholder="메모 (선택)" value={props.draftNote} onChange={(event) => props.setDraftNote(event.target.value)} />
          <Button appearance="primary" onClick={props.addDraft} disabled={props.isPending}>{props.draft ? "저장" : "지금부터 시작"}</Button>
          {props.message ? <p className="panel-message">{props.message}</p> : null}
        </section>

        {selected ? (
          <SelectedBlockPanel block={selected} isPending={props.isPending} onSave={props.onEditBlock} onDelete={props.onDeleteBlock} />
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

function SleepEditor({
  block,
  isPending,
  onSave
}: {
  block: TimeBlock | null;
  isPending: boolean;
  onSave: (start: number, end: number) => void;
}) {
  const [startDay, setStartDay] = useState<"yesterday" | "today">(block && block.start < 0 ? "yesterday" : "today");
  const [start, setStart] = useState(block ? fmtTime(normalizeDayMinute(block.start)) : "");
  const [end, setEnd] = useState(block ? fmtTime(normalizeDayMinute(block.end)) : "");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setStartDay(block && block.start < 0 ? "yesterday" : "today");
    setStart(block ? fmtTime(normalizeDayMinute(block.start)) : "");
    setEnd(block ? fmtTime(normalizeDayMinute(block.end)) : "");
    setError(null);
  }, [block]);

  const rawStartMinutes = parseTimeInput(start);
  const endMinutes = parseTimeInput(end);
  const startMinutes = rawStartMinutes === null ? null : startDay === "yesterday" ? rawStartMinutes - 1440 : rawStartMinutes;
  const duration = startMinutes !== null && endMinutes !== null ? endMinutes - startMinutes : null;
  const durationLabel = duration !== null && duration > 0 ? `${startDay === "yesterday" ? "어제 " : "오늘 "}${start} - 오늘 ${end} · ${fmtDuration(duration)}` : "";

  function submit() {
    if (startMinutes === null || endMinutes === null) {
      setError("수면 시간을 입력하세요.");
      return;
    }

    if (endMinutes <= startMinutes) {
      setError("종료 시간은 시작 시간보다 늦어야 합니다.");
      return;
    }

    setError(null);
    onSave(startMinutes, endMinutes);
  }

  return (
    <section className="sleep-editor">
      <div className="sleep-summary">
        <strong>수면 기록</strong>
        <span>{durationLabel}</span>
      </div>
      <div className="sleep-time-field">
        <select className="sleep-day-select" value={startDay} onChange={(event) => setStartDay(event.target.value as "yesterday" | "today")}>
          <option value="yesterday">어제</option>
          <option value="today">오늘</option>
        </select>
        <CompactTimeInput value={start} onChange={setStart} ariaLabel="수면 시작 시간" />
      </div>
      <span className="sleep-time-separator">~</span>
      <div className="sleep-time-field">
        <CompactTimeInput value={end} onChange={setEnd} ariaLabel="수면 종료 시간" />
      </div>
      <Button appearance="primary" onClick={submit} disabled={isPending}>적용</Button>
      {error ? <p className="panel-message">{error}</p> : null}
    </section>
  );
}

function CompactTimeInput({ value, onChange, ariaLabel }: { value: string; onChange: (value: string) => void; ariaLabel: string }) {
  const parsed = parseTimeInput(value);
  const hour = parsed === null ? "" : String(Math.floor(parsed / 60)).padStart(2, "0");
  const minute = parsed === null ? "" : String(parsed % 60).padStart(2, "0");

  function update(nextHour: string, nextMinute: string) {
    if (!nextHour || !nextMinute) {
      onChange("");
      return;
    }

    onChange(`${nextHour}:${nextMinute}`);
  }

  return (
    <div className="compact-time-input" aria-label={ariaLabel}>
      <select value={hour} onChange={(event) => update(event.target.value, minute)}>
        <option value="">--</option>
        {Array.from({ length: 24 }, (_, index) => String(index).padStart(2, "0")).map((option) => (
          <option key={option} value={option}>
            {option}
          </option>
        ))}
      </select>
      <span>:</span>
      <select value={minute} onChange={(event) => update(hour, event.target.value)}>
        <option value="">--</option>
        {["00", "05", "10", "15", "20", "25", "30", "35", "40", "45", "50", "55"].map((option) => (
          <option key={option} value={option}>
            {option}
          </option>
        ))}
      </select>
    </div>
  );
}

function normalizeDayMinute(minutes: number) {
  return ((minutes % 1440) + 1440) % 1440;
}

function SelectedBlockPanel({
  block,
  isPending,
  onSave,
  onDelete
}: {
  block: TimeBlock;
  isPending: boolean;
  onSave: (block: TimeBlock) => void;
  onDelete: (id: string) => void;
}) {
  const [cat, setCat] = useState<CategorySlug>(block.cat);
  const [start, setStart] = useState(fmtTime(block.start));
  const [end, setEnd] = useState(fmtTime(block.end));
  const [note, setNote] = useState(block.note);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setCat(block.cat);
    setStart(fmtTime(block.start));
    setEnd(fmtTime(block.end));
    setNote(block.note);
    setError(null);
  }, [block]);

  function submit() {
    const startMinutes = parseTimeInput(start);
    const endMinutes = parseTimeInput(end);

    if (startMinutes === null || endMinutes === null) {
      setError("시간은 HH:MM 형식으로 입력하세요.");
      return;
    }

    if (endMinutes <= startMinutes) {
      setError("종료 시간은 시작 시간보다 늦어야 합니다.");
      return;
    }

    setError(null);
    onSave({ ...block, cat, start: startMinutes, end: endMinutes, note });
  }

  const category = categoryById[cat];
  const parsedStart = parseTimeInput(start) ?? block.start;
  const parsedEnd = parseTimeInput(end) ?? block.end;

  return (
    <section className="selected-panel" style={{ background: category.tint, borderColor: category.color }}>
      <div className="selected-panel-head">
        <small>선택됨</small>
        <strong>{category.label}</strong>
      </div>
      <div className="selected-category-picker">
        {categories.filter((categoryItem) => categoryItem.id !== "sleep").map((categoryItem) => (
          <button
            key={categoryItem.id}
            type="button"
            className={cat === categoryItem.id ? "active" : ""}
            onClick={() => setCat(categoryItem.id)}
            style={{ "--cat": categoryItem.color, "--cat-tint": categoryItem.tint } as React.CSSProperties}
          >
            <CategoryIcon name={categoryItem.icon} size={14} />
            {categoryItem.label}
          </button>
        ))}
      </div>
      <div className="edit-time-grid">
        <TextInput aria-label="시작 시간" type="time" value={start} onChange={(event) => setStart(event.target.value)} />
        <TextInput aria-label="종료 시간" type="time" value={end} onChange={(event) => setEnd(event.target.value)} />
      </div>
      <TextInput aria-label="메모" placeholder="메모" value={note} onChange={(event) => setNote(event.target.value)} />
      <span className="selected-duration">{fmtDuration(Math.max(0, parsedEnd - parsedStart))}</span>
      {error ? <p className="panel-message">{error}</p> : null}
      <div className="selected-actions">
        <Button appearance="primary" onClick={submit} disabled={isPending}>저장</Button>
        <Button appearance="danger" onClick={() => onDelete(block.id)} disabled={isPending}>삭제</Button>
      </div>
    </section>
  );
}

function parseTimeInput(value: string) {
  const match = /^(\d{2}):(\d{2})$/.exec(value);
  if (!match) return null;
  const hours = Number(match[1]);
  const minutes = Number(match[2]);
  if (hours > 23 || minutes > 59) return null;
  return hours * 60 + minutes;
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

function SettingsView({
  timelineSettings,
  setTimelineSettings
}: {
  timelineSettings: { startHour: number; endHour: number };
  setTimelineSettings: (settings: { startHour: number; endHour: number }) => void;
}) {
  return (
    <div className="page-pad narrow">
      <div className="page-title">
        <div>
          <h1>환경설정</h1>
          <p>계정 상태와 로그아웃, 데이터 내보내기를 관리합니다.</p>
        </div>
      </div>
      <TimelineSettingsPanel settings={timelineSettings} setSettings={setTimelineSettings} />
      <AccountSettings />
    </div>
  );
}

function TimelineSettingsPanel({
  settings,
  setSettings
}: {
  settings: { startHour: number; endHour: number };
  setSettings: (settings: { startHour: number; endHour: number }) => void;
}) {
  const [startHour, setStartHour] = useState(String(settings.startHour));
  const [endHour, setEndHour] = useState(String(settings.endHour));
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    setStartHour(String(settings.startHour));
    setEndHour(String(settings.endHour));
  }, [settings]);

  function save() {
    const nextStart = Number(startHour);
    const nextEnd = Number(endHour);

    if (!Number.isInteger(nextStart) || !Number.isInteger(nextEnd) || nextStart < 0 || nextStart > 23 || nextEnd < 1 || nextEnd > 24 || nextEnd <= nextStart) {
      setMessage("시작 시간은 0-23, 끝 시간은 1-24 범위에서 시작보다 늦게 지정하세요.");
      return;
    }

    setSettings({ startHour: nextStart, endHour: nextEnd });
    setMessage("캘린더 표시 시간이 저장되었습니다.");
  }

  function reset() {
    setSettings(defaultTimelineSettings);
    setMessage("기본값으로 되돌렸습니다.");
  }

  return (
    <Card className="settings-card timeline-settings-card">
      <div className="setting-row">
        <div>
          <strong>캘린더 표시 시간</strong>
          <span>오늘 타임라인에 표시할 시작/끝 시간을 지정합니다.</span>
        </div>
        <div className="timeline-settings-controls">
          <TextInput aria-label="캘린더 시작 시간" type="number" min={0} max={23} step={1} value={startHour} onChange={(event) => setStartHour(event.target.value)} />
          <span>~</span>
          <TextInput aria-label="캘린더 끝 시간" type="number" min={1} max={24} step={1} value={endHour} onChange={(event) => setEndHour(event.target.value)} />
          <Button appearance="primary" onClick={save}>저장</Button>
          <Button appearance="subtle" onClick={reset}>초기화</Button>
        </div>
      </div>
      {message ? <p className="panel-message">{message}</p> : null}
    </Card>
  );
}
