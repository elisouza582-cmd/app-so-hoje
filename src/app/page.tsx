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

const buildInputsFromEntry = (entry: DailyEntry) => {
  const values = entry.priorities.map((priority) => priority.text);
  return [...values, ...emptyInputs].slice(0, 3);
};

const buildPrioritiesFromInputs = (
  inputs: string[],
  existing: Priority[]
): Priority[] => {
  return inputs
    .map((text, index) => {
      const trimmed = text.trim();
      if (!trimmed) return null;
      const previous = existing[index];
      return {
        id: previous?.id ?? crypto.randomUUID(),
        text: trimmed,
        done: previous?.done ?? false,
        doneAt: previous?.done ? previous.doneAt : undefined
      };
    })
    .filter((item): item is Priority => item !== null)
    .slice(0, 3);
};

export default function Home() {
  const [entry, setEntry] = useState<DailyEntry | null>(null);
  const [editing, setEditing] = useState(true);
  const [inputs, setInputs] = useState<string[]>(emptyInputs);

  useEffect(() => {
    const todayEntry = getTodayEntry();
    setEntry(todayEntry);
    if (todayEntry.priorities.length > 0) {
      setEditing(false);
      setInputs(buildInputsFromEntry(todayEntry));
    }
  }, []);

  const summary = useMemo(() => {
    if (!entry) return { done: 0, total: 0 };
    const total = entry.priorities.length;
    const done = entry.priorities.filter((item) => item.done).length;
    return { done, total };
  }, [entry]);

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
      </header>

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
