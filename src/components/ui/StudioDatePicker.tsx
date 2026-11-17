"use client";

import React, { useMemo, useState } from "react";
import { Calendar as CalendarIcon, ChevronLeft, ChevronRight } from "lucide-react";

const MONTHS_FR = [
  "Janvier",
  "Février",
  "Mars",
  "Avril",
  "Mai",
  "Juin",
  "Juillet",
  "Août",
  "Septembre",
  "Octobre",
  "Novembre",
  "Décembre",
];

const WEEKDAYS_FR = ["Lun", "Mar", "Mer", "Jeu", "Ven", "Sam", "Dim"];

function toIsoDate(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

export function formatDateFr(isoDate?: string): string {
  if (!isoDate || !/^\d{4}-\d{2}-\d{2}$/.test(isoDate)) return "";
  const [y, m, d] = isoDate.split("-").map(Number);
  const dt = new Date(y, m - 1, d);
  return dt.toLocaleDateString("fr-FR", {
    weekday: "short",
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

interface StudioDatePickerProps {
  value: string;
  onChange: (isoDate: string) => void;
  minDate?: string;
}

export function StudioDatePicker({ value, onChange, minDate }: StudioDatePickerProps) {
  const today = useMemo(() => {
    const now = new Date();
    now.setHours(0, 0, 0, 0);
    return now;
  }, []);

  const minIso = minDate || toIsoDate(today);

  const initialMonth = useMemo(() => {
    if (value && /^\d{4}-\d{2}-\d{2}$/.test(value)) {
      const [y, m] = value.split("-").map(Number);
      return new Date(y, m - 1, 1);
    }
    return new Date(today.getFullYear(), today.getMonth(), 1);
  }, [value, today]);

  const [viewMonth, setViewMonth] = useState<Date>(initialMonth);
  const [isOpen, setIsOpen] = useState(false);

  const quickDates = useMemo(() => {
    const tmr = new Date(today);
    tmr.setDate(today.getDate() + 1);
    const nextSat = new Date(today);
    const day = nextSat.getDay();
    const diffToSat = (6 - day + 7) % 7 || 7;
    nextSat.setDate(today.getDate() + diffToSat);
    return [
      { label: "Aujourd'hui", iso: toIsoDate(today) },
      { label: "Demain", iso: toIsoDate(tmr) },
      { label: "Samedi prochain", iso: toIsoDate(nextSat) },
    ];
  }, [today]);

  const calendarDays = useMemo(() => {
    const year = viewMonth.getFullYear();
    const month = viewMonth.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    // Convert Sunday=0..Saturday=6 to Monday=0..Sunday=6
    const startOffset = (firstDay.getDay() + 6) % 7;
    const cells: Array<{ iso: string; day: number; inMonth: boolean; disabled: boolean }> = [];

    for (let i = 0; i < startOffset; i++) {
      cells.push({ iso: `empty-start-${i}`, day: 0, inMonth: false, disabled: true });
    }
    for (let d = 1; d <= lastDay.getDate(); d++) {
      const dt = new Date(year, month, d);
      const iso = toIsoDate(dt);
      cells.push({
        iso,
        day: d,
        inMonth: true,
        disabled: iso < minIso,
      });
    }
    return cells;
  }, [viewMonth, minIso]);

  const canGoPrevMonth = useMemo(() => {
    const prevLast = new Date(viewMonth.getFullYear(), viewMonth.getMonth(), 0);
    return toIsoDate(prevLast) >= minIso;
  }, [viewMonth, minIso]);

  return (
    <div className="space-y-2">
      {/* Trigger button */}
      <button
        type="button"
        onClick={() => setIsOpen((o) => !o)}
        className={`w-full bg-[#181818] border rounded-xl px-3.5 py-2.5 text-left text-xs flex items-center justify-between transition-colors ${
          isOpen || value
            ? "border-[#FFBF00]/70 text-white"
            : "border-[#2E2E2E] text-[#8E8E8E] hover:border-[#444]"
        }`}
      >
        <span className="flex items-center gap-2 truncate">
          <CalendarIcon className="w-4 h-4 text-[#FFBF00] shrink-0" />
          <span className={value ? "text-white font-semibold capitalize" : "text-[#777]"}>
            {value ? formatDateFr(value) : "Choisir une date sur le calendrier"}
          </span>
        </span>
        <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-[#222222] text-[#FFBF00] shrink-0">
          {isOpen ? "Fermer" : "Calendrier"}
        </span>
      </button>

      {/* Quick chips */}
      <div className="flex flex-wrap gap-1.5">
        {quickDates.map((q) => {
          const active = value === q.iso;
          return (
            <button
              key={q.iso}
              type="button"
              onClick={() => {
                onChange(q.iso);
                setIsOpen(false);
              }}
              className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold transition-colors border ${
                active
                  ? "bg-[#FFBF00] text-black border-[#FFBF00]"
                  : "bg-[#161616] text-[#A0A0A0] border-[#262626] hover:border-[#444] hover:text-white"
              }`}
            >
              {q.label}
            </button>
          );
        })}
      </div>

      {/* Inline Calendar Grid */}
      {isOpen && (
        <div className="p-3.5 rounded-2xl bg-[#161616] border border-[#2C2C2C] space-y-3 shadow-xl">
          <div className="flex items-center justify-between">
            <button
              type="button"
              disabled={!canGoPrevMonth}
              onClick={() =>
                setViewMonth((m) => new Date(m.getFullYear(), m.getMonth() - 1, 1))
              }
              className="p-1.5 rounded-lg bg-[#202020] text-[#CCC] hover:text-white disabled:opacity-30"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="text-xs font-bold text-white">
              {MONTHS_FR[viewMonth.getMonth()]} {viewMonth.getFullYear()}
            </span>
            <button
              type="button"
              onClick={() =>
                setViewMonth((m) => new Date(m.getFullYear(), m.getMonth() + 1, 1))
              }
              className="p-1.5 rounded-lg bg-[#202020] text-[#CCC] hover:text-white"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          <div className="grid grid-cols-7 gap-1 text-center">
            {WEEKDAYS_FR.map((wd) => (
              <div key={wd} className="text-[10px] font-bold text-[#666] py-1">
                {wd}
              </div>
            ))}
            {calendarDays.map((cell) => {
              if (!cell.inMonth) {
                return <div key={cell.iso} className="h-8" />;
              }
              const isSelected = value === cell.iso;
              const isToday = cell.iso === toIsoDate(today);
              return (
                <button
                  key={cell.iso}
                  type="button"
                  disabled={cell.disabled}
                  onClick={() => {
                    onChange(cell.iso);
                    setIsOpen(false);
                  }}
                  className={`h-8 rounded-lg text-xs font-semibold transition-colors flex items-center justify-center ${
                    cell.disabled
                      ? "text-[#404040] cursor-not-allowed"
                      : isSelected
                      ? "bg-[#FFBF00] text-black font-black"
                      : isToday
                      ? "bg-[#222222] text-[#FFBF00] border border-[#FFBF00]/40 hover:bg-[#2C2C2C]"
                      : "text-[#D4D4D4] hover:bg-[#242424] hover:text-white"
                  }`}
                >
                  {cell.day}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
