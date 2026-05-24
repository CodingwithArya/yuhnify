"use client";

import { useEffect, useLayoutEffect, useRef, useState } from "react";
import type { PlannedRun, TrainingPlan } from "@/types";
import type { Units } from "@/lib/units";
import {
  ensurePaceInUnits,
  formatDistance,
  formatPaceForUnits,
  normalizeFitnessAssessment,
  planPacesUseMiles,
  safeDisplayDistanceKm,
} from "@/lib/units";
import { getZoneExplanation } from "@/lib/coach-utils";
import {
  hasDayPassed,
  truncateSentences,
  truncateWords,
  type DayChange,
} from "@/lib/plan-utils";
import {
  loadDismissedWarnings,
  loadWarningsExpanded,
  saveDismissedWarnings,
  saveWarningsExpanded,
  warningFlagId,
} from "@/lib/warning-flags-store";
import { ApproachModal } from "./ApproachModal";
import { CheckInModal } from "./CheckInModal";

const RUN_TYPE_STYLES: Record<
  PlannedRun["type"],
  { badge: string; label: string }
> = {
  easy: { badge: "bg-green-500/10 text-green-400 border-green-500/30", label: "Easy" },
  tempo: { badge: "bg-[#f97316]/10 text-[#f97316] border-[#f97316]/30", label: "Tempo" },
  intervals: { badge: "bg-red-500/10 text-red-400 border-red-500/30", label: "Intervals" },
  long: { badge: "bg-blue-500/10 text-blue-400 border-blue-500/30", label: "Long" },
  recovery: { badge: "bg-zinc-500/10 text-zinc-400 border-zinc-500/30", label: "Recovery" },
  rest: { badge: "bg-zinc-500/10 text-zinc-500 border-zinc-500/30", label: "Rest" },
};

interface TrainingPlanDisplayProps {
  userId: string;
  plan: TrainingPlan;
  generatedAt: string;
  units: Units;
  planWeek: string;
  dayChanges: DayChange[];
  showChanges: boolean;
  onShowChanges: () => void;
  onRegenerateWithFeedback: (feedback: string) => void;
  onPlanChange: (plan: TrainingPlan) => void;
  onCheckIn: (payload: {
    day: string;
    runType: string;
    distanceKm: number;
    feeling: string;
    completed: string;
    notes?: string;
    painLevel: "none" | "mild" | "moderate" | "severe";
    painLocations?: string[];
    planWeek: string;
  }) => void;
  adjustmentBanner: boolean;
  onDismissBanner: () => void;
  onUndoAdjustment: () => void;
  canUndo: boolean;
}

interface EditState {
  distanceKm: number;
  type: PlannedRun["type"];
  targetPace: string;
  description: string;
  notes: string;
}

function getDayChange(dayChanges: DayChange[], day: string): DayChange | undefined {
  return dayChanges.find((c) => c.day.toLowerCase() === day.toLowerCase());
}

function measureElementOverflow(el: HTMLElement | null): boolean {
  if (!el) return false;
  return (
    el.scrollHeight > el.clientHeight + 1 ||
    el.scrollWidth > el.clientWidth + 1
  );
}

function useOverflowMeasure(
  deps: unknown[],
  expanded = false
): { ref: React.RefObject<HTMLParagraphElement | null>; overflows: boolean } {
  const ref = useRef<HTMLParagraphElement>(null);
  const [overflows, setOverflows] = useState(false);

  useLayoutEffect(() => {
    if (expanded) return;
    setOverflows(measureElementOverflow(ref.current));
  }, [...deps, expanded]);

  useEffect(() => {
    if (expanded) return;
    function handleResize() {
      setOverflows(measureElementOverflow(ref.current));
    }
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, [...deps, expanded]);

  return { ref, overflows };
}

export function TrainingPlanDisplay({
  userId,
  plan,
  generatedAt,
  units,
  planWeek,
  dayChanges,
  showChanges,
  onShowChanges,
  onRegenerateWithFeedback,
  onPlanChange,
  onCheckIn,
  adjustmentBanner,
  onDismissBanner,
  onUndoAdjustment,
  canUndo,
}: TrainingPlanDisplayProps) {
  const [expandedZone, setExpandedZone] = useState<string | null>(null);
  const [editingDay, setEditingDay] = useState<string | null>(null);
  const [editState, setEditState] = useState<EditState | null>(null);
  const [approachOpen, setApproachOpen] = useState(false);
  const [checkInRun, setCheckInRun] = useState<PlannedRun | null>(null);
  const [feedback, setFeedback] = useState("");
  const [regenerating, setRegenerating] = useState(false);
  const [adviceExpanded, setAdviceExpanded] = useState(false);
  const [anyCardExpanded, setAnyCardExpanded] = useState(false);
  const [openDescIndex, setOpenDescIndex] = useState<number | null>(null);
  const descRefs = useRef<(HTMLParagraphElement | null)[]>([]);
  const stableOverflowRef = useRef<Record<number, boolean>>({});
  const [overflowMap, setOverflowMap] = useState<Record<number, boolean>>({});

  useEffect(() => {
    setOpenDescIndex(null);
  }, [generatedAt]);

  useLayoutEffect(() => {
    const map: Record<number, boolean> = { ...stableOverflowRef.current };
    plan.runs.forEach((_, i) => {
      if (openDescIndex === i) return;
      const el = descRefs.current[i];
      if (el) {
        map[i] = measureElementOverflow(el);
      }
    });
    stableOverflowRef.current = map;
    setOverflowMap(map);
  }, [plan.runs, generatedAt, openDescIndex]);

  useEffect(() => {
    function handleResize() {
      const map: Record<number, boolean> = { ...stableOverflowRef.current };
      plan.runs.forEach((_, i) => {
        if (openDescIndex === i) return;
        const el = descRefs.current[i];
        if (el) {
          map[i] = measureElementOverflow(el);
        }
      });
      stableOverflowRef.current = map;
      setOverflowMap(map);
    }
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, [plan.runs, generatedAt, openDescIndex]);

  const planUsesMilePaces = planPacesUseMiles(plan.runs);
  const fitnessAssessment = normalizeFitnessAssessment(
    plan.fitnessAssessment,
    units
  );

  function updateRuns(updatedRuns: PlannedRun[]) {
    onPlanChange({ ...plan, runs: updatedRuns });
  }

  function handleSeeChanges() {
    onShowChanges();
    requestAnimationFrame(() => {
      document.getElementById("daily-schedule")?.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });
    });
  }

  async function handleRegenerateSubmit(event: React.FormEvent) {
    event.preventDefault();
    setRegenerating(true);
    try {
      await onRegenerateWithFeedback(feedback.trim());
      setFeedback("");
    } finally {
      setRegenerating(false);
    }
  }

  const generatedDate = new Date(generatedAt).toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });

  const { ref: adviceRef, overflows: adviceOverflows } = useOverflowMeasure(
    [plan.generalAdvice],
    adviceExpanded
  );

  return (
    <div className="space-y-4">
      <p className="text-xs text-[#71717a]">Generated {generatedDate}</p>

      {adjustmentBanner && (
        <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-xl p-3 space-y-2">
          <p className="text-xs text-yellow-200 line-clamp-2">
            Your plan was updated based on your recent runs
          </p>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={handleSeeChanges}
              className="text-xs text-[#f97316]"
            >
              See what changed
            </button>
            {canUndo && (
              <button
                type="button"
                onClick={onUndoAdjustment}
                className="text-xs text-yellow-200"
              >
                Undo
              </button>
            )}
            <button
              type="button"
              onClick={onDismissBanner}
              className="text-xs text-[#71717a] ml-auto"
            >
              Dismiss
            </button>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <ExpandableSummaryCard
          title="This week's focus"
          value={plan.keyFocus}
          anyCardExpanded={anyCardExpanded}
          onToggleExpanded={() => setAnyCardExpanded((v) => !v)}
        />
        <ExpandableSummaryCard
          title="Fitness assessment"
          value={fitnessAssessment}
          anyCardExpanded={anyCardExpanded}
          onToggleExpanded={() => setAnyCardExpanded((v) => !v)}
        />
        <ExpandableSummaryCard
          title="Projected finish"
          value={plan.realisticGoalTime}
          anyCardExpanded={anyCardExpanded}
          onToggleExpanded={() => setAnyCardExpanded((v) => !v)}
        />
      </div>

      {plan.planApproach && (
        <>
          <button
            type="button"
            onClick={() => setApproachOpen(true)}
            className="text-xs px-3 py-1.5 rounded-full bg-[#27272a] text-[#f97316]"
          >
            {plan.planApproach.name}
          </button>
          <ApproachModal
            approach={plan.planApproach}
            isOpen={approachOpen}
            onClose={() => setApproachOpen(false)}
          />
        </>
      )}

      {plan.warningFlags && plan.warningFlags.length > 0 && (
        <WarningFlagsPanel
          userId={userId}
          planId={generatedAt}
          warnings={plan.warningFlags}
        />
      )}

      <div id="daily-schedule" className="space-y-2 scroll-mt-4">
        <h3 className="text-sm font-medium text-[#71717a]">Daily schedule</h3>
        {plan.runs.map((run, i) => {
          const change = getDayChange(dayChanges, run.day);
          const modified = Boolean(change?.modified);
          return (
            <DayCard
              key={run.day}
              run={run}
              runIndex={i}
              units={units}
              planUsesMilePaces={planUsesMilePaces}
              modified={showChanges && modified}
              diffs={showChanges && modified ? change?.diffs ?? [] : []}
              expandedZone={expandedZone}
              onToggleZone={(zone) => setExpandedZone(expandedZone === zone ? null : zone)}
              editing={editingDay === run.day}
              editState={editingDay === run.day ? editState : null}
              onEditStateChange={setEditState}
              onStartEdit={() => {
                setEditingDay(run.day);
                setEditState({
                  distanceKm: run.distanceKm,
                  type: run.type,
                  targetPace: run.targetPace ?? "",
                  description: run.description,
                  notes: run.notes ?? "",
                });
              }}
              onCancelEdit={() => { setEditingDay(null); setEditState(null); }}
              onSaveEdit={() => {
                if (!editState) return;
                updateRuns(plan.runs.map((r) => r.day === run.day ? {
                  ...r,
                  distanceKm: editState.distanceKm,
                  type: editState.type,
                  targetPace: editState.targetPace || null,
                  description: editState.description,
                  notes: editState.notes || undefined,
                } : r));
                setEditingDay(null);
                setEditState(null);
              }}
              onAddWorkout={() => updateRuns(plan.runs.map((r) => r.day === run.day ? {
                day: r.day, type: "easy" as const, distanceKm: 5,
                description: "Easy run at conversational pace.",
                targetPace: null, heartRateZone: "Zone 2",
              } : r))}
              onLogIt={() => setCheckInRun(run)}
              openDescIndex={openDescIndex}
              onToggleDesc={(index) =>
                setOpenDescIndex((prev) => (prev === index ? null : index))
              }
              descOverflows={overflowMap[i] ?? false}
              setDescRef={(el) => {
                descRefs.current[i] = el;
              }}
            />
          );
        })}
      </div>

      <div className="bg-[#18181b] border border-[#27272a] rounded-xl p-4">
        <h3 className="text-sm font-medium text-white mb-1">Coach advice</h3>
        <p
          ref={adviceRef}
          className={`text-xs text-[#71717a] leading-snug ${
            adviceExpanded || !adviceOverflows ? "" : "line-clamp-2"
          }`}
        >
          {plan.generalAdvice}
        </p>
        {adviceOverflows && (
          <button
            type="button"
            onClick={() => setAdviceExpanded((v) => !v)}
            className="text-xs text-[#f97316] mt-1"
          >
            {adviceExpanded ? "Show less" : "Read more"}
          </button>
        )}
      </div>

      <form onSubmit={handleRegenerateSubmit} className="bg-[#18181b] border border-[#27272a] rounded-xl p-4 space-y-3">
        <p className="text-sm text-[#71717a]">Not quite right?</p>
        <div className="flex flex-col sm:flex-row gap-2">
          <input
            type="text"
            maxLength={200}
            placeholder="e.g. too much volume this week"
            value={feedback}
            onChange={(e) => setFeedback(e.target.value)}
            className="flex-1 bg-[#09090b] border border-[#27272a] rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-[#f97316]"
          />
          <button
            type="submit"
            disabled={regenerating || !feedback.trim()}
            className="shrink-0 px-4 py-2 rounded-lg bg-[#f97316] text-white text-sm font-medium disabled:opacity-50"
          >
            {regenerating ? "..." : "Regenerate"}
          </button>
        </div>
      </form>

      {checkInRun && (
        <CheckInModal
          run={checkInRun}
          planWeek={planWeek}
          planId={generatedAt}
          userId={userId}
          isOpen={Boolean(checkInRun)}
          onClose={() => setCheckInRun(null)}
          onSave={onCheckIn}
        />
      )}
    </div>
  );
}

function ExpandableSummaryCard({
  title,
  value,
  anyCardExpanded,
  onToggleExpanded,
}: {
  title: string;
  value: string;
  anyCardExpanded: boolean;
  onToggleExpanded: () => void;
}) {
  const textRef = useRef<HTMLParagraphElement>(null);
  const [overflows, setOverflows] = useState(false);

  useLayoutEffect(() => {
    const el = textRef.current;
    if (!el || anyCardExpanded) return;
    setOverflows(measureElementOverflow(el));
  }, [value, anyCardExpanded]);

  useEffect(() => {
    function handleResize() {
      const el = textRef.current;
      if (!el || anyCardExpanded) return;
      setOverflows(measureElementOverflow(el));
    }
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, [value, anyCardExpanded]);

  function handleToggle() {
    if (!overflows) return;
    onToggleExpanded();
  }

  const cardClass =
    "relative flex flex-col items-start w-full h-full text-left bg-[#18181b] border border-[#27272a] rounded-xl p-3";

  const body = (
    <>
      <div className="text-xs text-[#71717a] mb-0.5 shrink-0">{title}</div>
      <div
        className={`w-full overflow-hidden transition-[max-height] duration-150 ease-in-out ${
          anyCardExpanded ? "max-h-96" : "max-h-11"
        }`}
      >
        <p
          ref={textRef}
          className={`text-sm text-white leading-snug ${
            anyCardExpanded ? "" : "line-clamp-2"
          } ${overflows ? "pr-5" : ""}`}
        >
          {value}
        </p>
      </div>
      {overflows && (
        <ChevronIcon
          expanded={anyCardExpanded}
          className="absolute bottom-2.5 right-2.5 text-[#71717a] opacity-50 pointer-events-none"
        />
      )}
    </>
  );

  if (!overflows) {
    return <div className={cardClass}>{body}</div>;
  }

  return (
    <button type="button" onClick={handleToggle} className={cardClass}>
      {body}
    </button>
  );
}

interface DayCardProps {
  run: PlannedRun;
  runIndex: number;
  units: Units;
  planUsesMilePaces: boolean;
  modified: boolean;
  diffs: string[];
  expandedZone: string | null;
  onToggleZone: (zone: string) => void;
  editing: boolean;
  editState: EditState | null;
  onEditStateChange: (state: EditState | null) => void;
  onStartEdit: () => void;
  onCancelEdit: () => void;
  onSaveEdit: () => void;
  onAddWorkout: () => void;
  onLogIt: () => void;
  openDescIndex: number | null;
  onToggleDesc: (index: number) => void;
  descOverflows: boolean;
  setDescRef: (el: HTMLParagraphElement | null) => void;
}

function DayCard(props: DayCardProps) {
  const { run, runIndex, units, planUsesMilePaces, modified, diffs, expandedZone, onToggleZone, editing, editState,
    onEditStateChange, onStartEdit, onCancelEdit, onSaveEdit, onAddWorkout, onLogIt,
    openDescIndex, onToggleDesc, descOverflows, setDescRef } = props;

  const styles = RUN_TYPE_STYLES[run.type];
  const zoneKey = `${run.day}-${run.heartRateZone}`;
  const borderClass = modified
    ? "border-[#27272a] border-l-4 border-l-yellow-500 bg-yellow-500/5"
    : "border-[#27272a]";
  const showLogIt = hasDayPassed(run.day) && run.type !== "rest";

  const displayDistanceKm = safeDisplayDistanceKm(
    run.distanceKm,
    units,
    planUsesMilePaces
  );
  const pace = formatPaceForUnits(run.targetPace, units);

  if (run.type === "rest" && !editing) {
    return (
      <div className={`bg-[#18181b] border ${borderClass} rounded-xl p-3 flex items-center justify-between`}>
        <div className="flex items-center gap-3">
          <span className="text-sm font-medium text-white w-10">{run.day.slice(0, 3)}</span>
          <span className="text-sm text-zinc-500">Rest day</span>
          {modified && (
            <span className="text-[10px] px-1.5 py-0.5 rounded bg-yellow-500/20 text-yellow-300">
              Updated
            </span>
          )}
        </div>
        <button type="button" onClick={onAddWorkout} className="w-7 h-7 flex items-center justify-center rounded-lg border border-[#27272a] text-[#71717a]">+</button>
      </div>
    );
  }

  if (editing && editState) {
    const editPace = ensurePaceInUnits(editState.targetPace, units);
    return (
      <div className="bg-[#18181b] border border-[#f97316]/30 rounded-xl p-4 space-y-3">
        <p className="text-sm font-medium text-white">{run.day}</p>
        <div className="grid grid-cols-2 gap-3">
          <input type="number" min={0} step={0.1} value={editState.distanceKm}
            onChange={(e) => onEditStateChange({ ...editState, distanceKm: Number(e.target.value) })}
            className="w-full bg-[#09090b] border border-[#27272a] rounded-lg px-3 py-2 text-white text-sm" />
          <select value={editState.type}
            onChange={(e) => onEditStateChange({ ...editState, type: e.target.value as PlannedRun["type"] })}
            className="w-full bg-[#09090b] border border-[#27272a] rounded-lg px-3 py-2 text-white text-sm">
            <option value="easy">Easy</option><option value="tempo">Tempo</option>
            <option value="intervals">Intervals</option><option value="long">Long</option>
            <option value="recovery">Recovery</option><option value="rest">Rest</option>
          </select>
        </div>
        <input type="text" value={editPace} placeholder={`Target pace (${units === "mi" ? "/mi" : "/km"})`}
          onChange={(e) => onEditStateChange({ ...editState, targetPace: e.target.value })}
          className="w-full bg-[#09090b] border border-[#27272a] rounded-lg px-3 py-2 text-white text-sm" />
        <textarea rows={2} value={editState.description}
          onChange={(e) => onEditStateChange({ ...editState, description: e.target.value })}
          className="w-full bg-[#09090b] border border-[#27272a] rounded-lg px-3 py-2 text-white text-sm resize-none" />
        <div className="flex gap-2">
          <button type="button" onClick={onSaveEdit} className="flex-1 py-2 rounded-lg bg-[#f97316] text-white text-sm">Save</button>
          <button type="button" onClick={onCancelEdit} className="flex-1 py-2 rounded-lg border border-[#27272a] text-[#71717a] text-sm">Cancel</button>
        </div>
      </div>
    );
  }

  return (
    <div className={`bg-[#18181b] border ${borderClass} rounded-xl p-3`}>
      <div className="flex items-start justify-between gap-2 mb-1">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-sm font-medium text-white w-10">{run.day.slice(0, 3)}</span>
          <span className={`text-xs px-2 py-0.5 rounded-full border ${styles.badge}`}>{styles.label}</span>
          {modified && (
            <span className="text-[10px] px-1.5 py-0.5 rounded bg-yellow-500/20 text-yellow-300">
              Updated
            </span>
          )}
          {displayDistanceKm > 0 && (
            <span className="text-xs text-[#71717a]">
              {formatDistance(displayDistanceKm, units)}{pace !== "--" ? ` · ${pace}` : ""}
            </span>
          )}
        </div>
        <div className="flex items-center gap-2 shrink-0">
          {showLogIt && (
            <button type="button" onClick={onLogIt} className="text-xs px-2 py-0.5 rounded-full border border-[#27272a] text-[#71717a]">
              Log it
            </button>
          )}
          <button type="button" onClick={onStartEdit} className="text-[#71717a]" aria-label={`Edit ${run.day}`}>
            <PencilIcon />
          </button>
        </div>
      </div>
      {diffs.length > 0 && (
        <p className="text-xs text-yellow-300 mb-1">{diffs.join(" · ")}</p>
      )}
      {run.description.trim() && (() => {
        const isOpen = openDescIndex === runIndex;
        const descriptionEl = (
          <p
            ref={setDescRef}
            className={`text-sm text-zinc-400 leading-relaxed mt-1 ${
              isOpen ? "" : "line-clamp-1 overflow-hidden"
            }`}
          >
            {run.description}
            {descOverflows && !isOpen && (
              <span className="text-zinc-500 ml-1">tap to read more</span>
            )}
          </p>
        );

        if (!descOverflows) {
          return descriptionEl;
        }

        return (
          <button
            type="button"
            onClick={() => onToggleDesc(runIndex)}
            className="text-left w-full block cursor-pointer"
          >
            {descriptionEl}
          </button>
        );
      })()}
      {run.heartRateZone && (
        <div className="mt-2">
          <button type="button" onClick={() => onToggleZone(zoneKey)}
            className="text-xs px-2 py-0.5 rounded-full bg-[#27272a] text-[#f97316]">
            {run.heartRateZone}
          </button>
          {expandedZone === zoneKey && (
            <p className="text-xs text-[#71717a] mt-1 leading-snug">
              {truncateSentences(getZoneExplanation(run.heartRateZone), 2)}
            </p>
          )}
        </div>
      )}
    </div>
  );
}

function WarningFlagsPanel({
  userId,
  planId,
  warnings,
}: {
  userId: string;
  planId: string;
  warnings: string[];
}) {
  const [listExpanded, setListExpanded] = useState(false);
  const [openWarningId, setOpenWarningId] = useState<string | null>(null);
  const [dismissedIds, setDismissedIds] = useState<string[]>([]);

  useEffect(() => {
    try {
      setDismissedIds(loadDismissedWarnings(userId, planId));
      setListExpanded(loadWarningsExpanded(userId, planId));
      setOpenWarningId(null);
    } catch {
      // ignore
    }
  }, [userId, planId]);

  const visibleWarnings = warnings
    .map((flag, index) => ({
      id: warningFlagId(flag, index),
      flag,
    }))
    .filter((entry) => !dismissedIds.includes(entry.id));

  if (visibleWarnings.length === 0) return null;

  function toggleList() {
    const next = !listExpanded;
    setListExpanded(next);
    if (!next) setOpenWarningId(null);
    try {
      saveWarningsExpanded(userId, planId, next);
    } catch {
      // ignore
    }
  }

  function toggleWarning(id: string) {
    setOpenWarningId((prev) => (prev === id ? null : id));
  }

  function dismissWarning(id: string) {
    const next = [...dismissedIds, id];
    setDismissedIds(next);
    if (openWarningId === id) setOpenWarningId(null);
    try {
      saveDismissedWarnings(userId, planId, next);
    } catch {
      // ignore
    }
  }

  return (
    <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-xl overflow-hidden">
      <button
        type="button"
        onClick={toggleList}
        className="w-full flex items-center justify-between gap-2 px-3 py-2.5 text-left"
      >
        <div className="flex items-center gap-2">
          <span className="text-yellow-400 shrink-0" aria-hidden>
            ⚠
          </span>
          <span className="text-xs text-yellow-200">
            {visibleWarnings.length} coaching note
            {visibleWarnings.length === 1 ? "" : "s"}
          </span>
        </div>
        <ChevronIcon expanded={listExpanded} className="text-yellow-400 shrink-0" />
      </button>

      <div
        className={`overflow-hidden transition-[max-height] duration-150 ease-in-out border-t border-yellow-500/20 ${
          listExpanded ? "max-h-[480px]" : "max-h-0"
        }`}
      >
        {visibleWarnings.map(({ id, flag }) => {
          const isOpen = openWarningId === id;
          return (
            <div
              key={id}
              className="border-b border-yellow-500/10 last:border-b-0"
            >
              {isOpen ? (
                <div className="relative px-3 py-2.5">
                  <button
                    type="button"
                    onClick={() => toggleWarning(id)}
                    className="w-full text-left pr-6"
                  >
                    <p className="text-xs text-yellow-200 leading-snug">{flag}</p>
                  </button>
                  <button
                    type="button"
                    onClick={() => dismissWarning(id)}
                    className="absolute top-2.5 right-3 text-[#71717a] text-sm leading-none px-1"
                    aria-label="Dismiss warning"
                  >
                    ×
                  </button>
                </div>
              ) : (
                <WarningFlagPreview
                  flag={flag}
                  onToggle={() => toggleWarning(id)}
                />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

function WarningFlagPreview({
  flag,
  onToggle,
}: {
  flag: string;
  onToggle: () => void;
}) {
  const { ref, overflows } = useOverflowMeasure([flag]);

  if (!overflows) {
    return (
      <div className="px-3 py-2.5">
        <p ref={ref} className="text-xs text-yellow-200 line-clamp-1">
          {flag}
        </p>
      </div>
    );
  }

  return (
    <button
      type="button"
      onClick={onToggle}
      className="w-full flex items-center gap-2 px-3 py-2.5 text-left"
    >
      <p ref={ref} className="text-xs text-yellow-200 line-clamp-1 flex-1">
        {flag}
      </p>
      <ChevronIcon expanded={false} className="shrink-0 text-yellow-400 opacity-60" />
    </button>
  );
}

function ChevronIcon({
  expanded,
  className = "",
}: {
  expanded: boolean;
  className?: string;
}) {
  return (
    <svg
      width="14"
      height="14"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      className={`transition-transform duration-150 ease-in-out ${expanded ? "rotate-180" : ""} ${className}`}
    >
      <path d="m6 9 6 6 6-6" />
    </svg>
  );
}

function PencilIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z" />
      <path d="m15 5 4 4" />
    </svg>
  );
}
