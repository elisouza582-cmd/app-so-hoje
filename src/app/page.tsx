"use client";

import { useEffect, useMemo, useState } from "react";
import {
  clearToday,
  DailyEntry,
  getTodayEntry,
  Priority,
  saveTodayEntry
} from "@/lib/storage";

const emptyInputs = ["", "", ""];
const DISMISSED_KEY = "sohoje:dismissed";
const ONBOARDED_KEY = "sohoje:onboarded";

const buildInputsFromEntry = (entry: DailyEntry) => {
  const values = entry.priorities.map((priority) => priority.text);
  return [...values, ...emptyInputs].slice(0, 3);
};

const buildPrioritiesFromInputs = (
  inputs: string[],
  _existing: Priority[]
): Priority[] => {
  const [p1, p2, p3] = inputs;
  return [p1, p2, p3].flatMap((text, idx) => {
    const trimmed = text.trim();
    if (!trimmed) return [];
    return [
      {
        id: `p${idx + 1}`,
        text: trimmed,
        done: false,
        doneAt: undefined
      }
    ];
  });
};

export default function Home() {
  const [entry, setEntry] = useState<DailyEntry | null>(null);
  const [editing, setEditing] = useState(true);
  const [inputs, setInputs] = useState<string[]>(emptyInputs);
  const [dismissedForToday, setDismissedForToday] = useState(false);
  const [showOnboarding, setShowOnboarding] = useState(false);
  const getTodayString = () => {
    const today = new Date();
    return `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(
      2,
      "0"
    )}-${String(today.getDate()).padStart(2, "0")}`;
  };

  useEffect(() => {
    const todayEntry = getTodayEntry();
    setEntry(todayEntry);
    if (todayEntry.priorities.length > 0) {
      setEditing(false);
      setInputs(buildInputsFromEntry(todayEntry));
    }

    if (typeof window !== "undefined") {
      const date = getTodayString();
      const dismissed = window.localStorage.getItem(DISMISSED_KEY);
      setDismissedForToday(dismissed === date);
      setShowOnboarding(!window.localStorage.getItem(ONBOARDED_KEY));
    }
  }, []);

  useEffect(() => {
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker.register("/sw.js");
    }
  }, []);

  const summary = useMemo(() => {
    if (!entry) return { done: 0, total: 0 };
    const total = entry.priorities.length;
    const done = entry.priorities.filter((item) => item.done).length;
    return { done, total };
  }, [entry]);

  const reminder = useMemo(() => {
    if (!entry || dismissedForToday) return null;
    const totalCount = entry.priorities.filter((item) =>
      item.text.trim()
    ).length;
    const doneCount = entry.priorities.filter((item) => item.done).length;
    if (totalCount === 0) {
      return "Defina suas 3 prioridades para começar bem o dia.";
    }
    if (doneCount === totalCount) {
      return null;
    }
    const hour = new Date().getHours();
    if (hour >= 18 && doneCount < totalCount) {
      return "Fim do dia chegando. Feche pelo menos 1 prioridade hoje.";
    }
    if (doneCount === 0) {
      return "Escolha 1 prioridade e finalize agora em 10 minutos.";
    }
    return "Bom ritmo. Falta pouco para fechar o dia.";
  }, [entry, dismissedForToday]);

  const handleInputChange = (index: number, value: string) => {
    setInputs((prev) => {
      const next = [...prev];
      next[index] = value;
      return next;
    });
  };

  const handleSave = () => {
    if (!entry) return;
    const priorities = buildPrioritiesFromInputs(inputs, entry.priorities);
    const now = Date.now();
    const updated: DailyEntry = {
      ...entry,
      priorities,
      createdAt: entry.createdAt ?? now,
      updatedAt: now
    };
    saveTodayEntry(updated);
    setEntry(updated);
    setEditing(false);
    if (typeof window !== "undefined") {
      window.localStorage.setItem(ONBOARDED_KEY, "1");
      setShowOnboarding(false);
    }
  };

  const handleToggle = (id: string) => {
    if (!entry) return;
    const updatedPriorities = entry.priorities.map((priority) => {
      if (priority.id !== id) return priority;
      const done = !priority.done;
      return {
        ...priority,
        done,
        doneAt: done ? Date.now() : undefined
      };
    });
    const updated = { ...entry, priorities: updatedPriorities };
    saveTodayEntry(updated);
    setEntry(updated);
  };

  const handleEdit = () => {
    if (!entry) return;
    setInputs(buildInputsFromEntry(entry));
    setEditing(true);
  };

  const handleReset = () => {
    if (typeof window !== "undefined") {
      const confirmed = window.confirm("Tem certeza que deseja reiniciar o dia?");
      if (!confirmed) return;
    }
    clearToday();
    const fresh = getTodayEntry();
    setEntry(fresh);
    setInputs(emptyInputs);
    setEditing(true);
  };

  const handleDismissReminder = () => {
    if (typeof window === "undefined") return;
    const date = getTodayString();
    window.localStorage.setItem(DISMISSED_KEY, date);
    setDismissedForToday(true);
  };

  if (!entry) {
    return null;
  }

  return (
    <main className="mx-auto flex min-h-screen max-w-xl flex-col gap-6 px-6 py-10">
      <header className="space-y-2">
        <p className="text-sm font-semibold uppercase tracking-[0.2em] text-blue-500">
          Prioridades do dia
        </p>
        <h1 className="text-4xl font-bold text-slate-900">Só Hoje</h1>
        <p className="text-base text-slate-600">
          O que realmente precisa ser feito hoje?
        </p>
        {showOnboarding ? (
          <p className="text-sm text-slate-500">
            Escolha 3 prioridades. O resto é bônus.
          </p>
        ) : null}
      </header>

      {reminder ? (
        <section className="flex flex-col gap-3 rounded-2xl border border-blue-100 bg-blue-50 p-4 text-slate-700">
          <p className="text-sm font-medium">{reminder}</p>
          <button
            type="button"
            onClick={handleDismissReminder}
            className="self-start text-sm font-semibold text-blue-700 hover:text-blue-800"
          >
            Dispensar
          </button>
        </section>
      ) : null}

      {editing ? (
        <section className="space-y-4 rounded-2xl bg-white p-5 shadow-sm">
          <div className="space-y-3">
            {inputs.map((value, index) => (
              <label key={`priority-input-${index}`} className="block">
                <span className="text-sm font-medium text-slate-700">
                  Prioridade {index + 1}
                </span>
                <input
                  value={value}
                  onChange={(event) =>
                    handleInputChange(index, event.target.value)
                  }
                  placeholder={`Prioridade ${index + 1}`}
                  className="mt-2 w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-base text-slate-900 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
                />
              </label>
            ))}
          </div>
          <button
            type="button"
            onClick={handleSave}
            className="w-full rounded-xl bg-blue-600 px-4 py-3 text-base font-semibold text-white transition hover:bg-blue-700"
          >
            Salvar meu dia
          </button>
        </section>
      ) : (
        <section className="space-y-4 rounded-2xl bg-white p-5 shadow-sm">
          <div className="space-y-3">
            {entry.priorities.length === 0 ? (
              <p className="text-sm text-slate-500">
                Nenhuma prioridade salva ainda.
              </p>
            ) : (
              entry.priorities.map((priority) => (
                <label
                  key={priority.id}
                  className="flex items-center gap-3 rounded-xl border border-slate-100 bg-slate-50 px-4 py-3"
                >
                  <input
                    type="checkbox"
                    checked={priority.done}
                    onChange={() => handleToggle(priority.id)}
                    className="h-5 w-5 rounded border-slate-300 text-blue-600"
                  />
                  <span
                    className={`text-base ${
                      priority.done
                        ? "text-slate-400 line-through"
                        : "text-slate-900"
                    }`}
                  >
                    {priority.text}
                  </span>
                </label>
              ))
            )}
          </div>
          <div className="flex flex-col gap-3 sm:flex-row">
            <button
              type="button"
              onClick={handleEdit}
              className="flex-1 rounded-xl border border-slate-200 px-4 py-3 text-base font-semibold text-slate-700 transition hover:bg-slate-100"
            >
              Editar
            </button>
            <button
              type="button"
              onClick={handleReset}
              className="flex-1 rounded-xl border border-red-200 px-4 py-3 text-base font-semibold text-red-600 transition hover:bg-red-50"
            >
              Reiniciar hoje
            </button>
          </div>
        </section>
      )}

      <section className="rounded-2xl bg-slate-900 p-5 text-white">
        <p className="text-sm uppercase tracking-[0.2em] text-slate-300">
          Resumo
        </p>
        <p className="mt-2 text-lg font-semibold">
          Você concluiu {summary.done} de {summary.total} prioridades hoje.
        </p>
      </section>
    </main>
  );
}
