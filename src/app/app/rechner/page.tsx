"use client";

import { useMemo, useState } from "react";
import { AppHeader } from "@/components/app-header";
import { Heartbeat } from "@/components/heartbeat";

function parseNumber(value: string): number | null {
  const normalized = value.replace(",", ".").trim();
  if (!normalized) {
    return null;
  }

  const number = Number(normalized);
  return Number.isFinite(number) ? number : null;
}

export default function RechnerPage() {
  const [percentW, setPercentW] = useState("");
  const [percentG, setPercentG] = useState("");
  const [rateW, setRateW] = useState("");
  const [rateG, setRateG] = useState("");
  const [baseW, setBaseW] = useState("");
  const [baseP, setBaseP] = useState("");

  const [gradesInput, setGradesInput] = useState("1,7; 2,3; 2,0");

  const [ruleA, setRuleA] = useState("");
  const [ruleB, setRuleB] = useState("");
  const [ruleC, setRuleC] = useState("");

  const percentValue = useMemo(() => {
    const p = parseNumber(percentW);
    const g = parseNumber(percentG);
    if (p === null || g === null) {
      return null;
    }
    return (p / 100) * g;
  }, [percentW, percentG]);

  const percentageRate = useMemo(() => {
    const w = parseNumber(rateW);
    const g = parseNumber(rateG);
    if (w === null || g === null || g === 0) {
      return null;
    }
    return (w / g) * 100;
  }, [rateW, rateG]);

  const baseValue = useMemo(() => {
    const w = parseNumber(baseW);
    const p = parseNumber(baseP);
    if (w === null || p === null || p === 0) {
      return null;
    }
    return w / (p / 100);
  }, [baseW, baseP]);

  const gradeValues = useMemo(
    () =>
      gradesInput
        .split(/[;\n\s]+/)
        .map((entry) => parseNumber(entry))
        .filter((entry): entry is number => entry !== null),
    [gradesInput]
  );

  const gradesAverage = useMemo(() => {
    if (gradeValues.length === 0) {
      return null;
    }

    const sum = gradeValues.reduce((total, value) => total + value, 0);
    return sum / gradeValues.length;
  }, [gradeValues]);

  const ruleOfThreeResult = useMemo(() => {
    const a = parseNumber(ruleA);
    const b = parseNumber(ruleB);
    const c = parseNumber(ruleC);
    if (a === null || b === null || c === null || a === 0) {
      return null;
    }
    return (b * c) / a;
  }, [ruleA, ruleB, ruleC]);

  const percentValueText =
    percentValue !== null
      ? percentValue.toLocaleString("de-DE", { maximumFractionDigits: 2 })
      : percentW.trim() === "" || percentG.trim() === ""
        ? "Bitte beide Werte eingeben."
        : "Bitte gültige Zahlen eingeben.";

  const percentageRateText =
    percentageRate !== null
      ? `${percentageRate.toLocaleString("de-DE", { maximumFractionDigits: 2 })} %`
      : rateW.trim() === "" || rateG.trim() === ""
        ? "Bitte beide Werte eingeben."
        : parseNumber(rateG) === 0
          ? "Grundwert darf nicht 0 sein."
          : "Bitte gültige Zahlen eingeben.";

  const baseValueText =
    baseValue !== null
      ? baseValue.toLocaleString("de-DE", { maximumFractionDigits: 2 })
      : baseW.trim() === "" || baseP.trim() === ""
        ? "Bitte beide Werte eingeben."
        : parseNumber(baseP) === 0
          ? "Prozentsatz darf nicht 0 sein."
          : "Bitte gültige Zahlen eingeben.";

  const gradesText =
    gradesAverage !== null
      ? gradesAverage.toLocaleString("de-DE", { maximumFractionDigits: 2 })
      : "Bitte mindestens eine gültige Note eingeben.";

  const ruleOfThreeText =
    ruleOfThreeResult !== null
      ? ruleOfThreeResult.toLocaleString("de-DE", { maximumFractionDigits: 2 })
      : ruleA.trim() === "" || ruleB.trim() === "" || ruleC.trim() === ""
        ? "Bitte alle drei Werte eingeben."
        : parseNumber(ruleA) === 0
          ? "A darf nicht 0 sein."
          : "Bitte gültige Zahlen eingeben.";

  return (
    <main className="min-h-screen px-6 py-10">
      <Heartbeat />
      <div className="mx-auto max-w-5xl space-y-6">
        <AppHeader title="Mathe-Rechner" />

        <section className="grid gap-6 lg:grid-cols-2">
          <article className="rounded-xl border border-slate-700 bg-card p-6">
            <h2 className="text-xl font-semibold">Prozentrechner</h2>
            <p className="mt-1 text-sm text-slate-300">Berechne Prozentwert, Prozentsatz oder Grundwert.</p>

            <div className="mt-4 space-y-4">
              <div className="rounded-lg border border-slate-700 p-4">
                <p className="mb-2 text-sm font-medium">1) Prozentwert (W): p % von Grundwert (G)</p>
                <div className="grid gap-3 sm:grid-cols-2">
                  <input value={percentW} onChange={(event) => setPercentW(event.target.value)} placeholder="p in % (Prozentsatz)" className="rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-white outline-none focus:ring-2 focus:ring-accent" />
                  <input value={percentG} onChange={(event) => setPercentG(event.target.value)} placeholder="G (Grundwert)" className="rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-white outline-none focus:ring-2 focus:ring-accent" />
                </div>
                <p className="mt-2 text-sm text-slate-300">Ergebnis: <span className="font-semibold text-white">{percentValueText}</span></p>
              </div>

              <div className="rounded-lg border border-slate-700 p-4">
                <p className="mb-2 text-sm font-medium">2) Prozentsatz (p): Prozentwert (W) von Grundwert (G)</p>
                <div className="grid gap-3 sm:grid-cols-2">
                  <input value={rateW} onChange={(event) => setRateW(event.target.value)} placeholder="W (Prozentwert)" className="rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-white outline-none focus:ring-2 focus:ring-accent" />
                  <input value={rateG} onChange={(event) => setRateG(event.target.value)} placeholder="G (Grundwert)" className="rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-white outline-none focus:ring-2 focus:ring-accent" />
                </div>
                <p className="mt-2 text-sm text-slate-300">Ergebnis: <span className="font-semibold text-white">{percentageRateText}</span></p>
              </div>

              <div className="rounded-lg border border-slate-700 p-4">
                <p className="mb-2 text-sm font-medium">3) Grundwert (G): Prozentwert (W) sind p % von G</p>
                <div className="grid gap-3 sm:grid-cols-2">
                  <input value={baseW} onChange={(event) => setBaseW(event.target.value)} placeholder="W (Prozentwert)" className="rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-white outline-none focus:ring-2 focus:ring-accent" />
                  <input value={baseP} onChange={(event) => setBaseP(event.target.value)} placeholder="p in %" className="rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-white outline-none focus:ring-2 focus:ring-accent" />
                </div>
                <p className="mt-2 text-sm text-slate-300">Ergebnis: <span className="font-semibold text-white">{baseValueText}</span></p>
              </div>
            </div>

            <p className="mt-4 text-xs text-slate-400">Tipp: Du kannst Komma oder Punkt für Dezimalzahlen verwenden.</p>
          </article>

          <article className="rounded-xl border border-slate-700 bg-card p-6">
            <h2 className="text-xl font-semibold">Notenrechner</h2>
            <p className="mt-1 text-sm text-slate-300">Gib mehrere Noten ein, der Durchschnitt wird automatisch berechnet.</p>

            <div className="mt-4 space-y-3">
              <label className="text-sm text-slate-300">Noten (getrennt mit Semikolon, Leerzeichen oder Zeilenumbruch)</label>
              <textarea
                value={gradesInput}
                onChange={(event) => setGradesInput(event.target.value)}
                rows={6}
                className="w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-white outline-none focus:ring-2 focus:ring-accent"
                placeholder="z. B. 1,7; 2,3; 2,0 oder je Zeile eine Note"
              />
              <p className="text-sm text-slate-300">
                Durchschnitt: <span className="font-semibold text-white">{gradesText}</span>
              </p>
            </div>

            <p className="mt-4 text-xs text-slate-400">Hinweis: Für Dezimalzahlen nutze ein Komma (z. B. 1,7).</p>
          </article>
        </section>

        <section className="rounded-xl border border-slate-700 bg-card p-6">
          <h2 className="text-xl font-semibold">Dreisatz-Rechner</h2>
          <p className="mt-1 text-sm text-slate-300">Nutze die Form: Wenn A zu B gehört, wie viel gehört dann zu C?</p>

          <div className="mt-4 grid gap-3 sm:grid-cols-3">
            <input value={ruleA} onChange={(event) => setRuleA(event.target.value)} placeholder="A" className="rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-white outline-none focus:ring-2 focus:ring-accent" />
            <input value={ruleB} onChange={(event) => setRuleB(event.target.value)} placeholder="B" className="rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-white outline-none focus:ring-2 focus:ring-accent" />
            <input value={ruleC} onChange={(event) => setRuleC(event.target.value)} placeholder="C" className="rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-white outline-none focus:ring-2 focus:ring-accent" />
          </div>

          <p className="mt-3 text-sm text-slate-300">Ergebnis X: <span className="font-semibold text-white">{ruleOfThreeText}</span></p>
          <p className="mt-2 text-xs text-slate-400">Formel: X = (B × C) / A. A darf nicht 0 sein.</p>
        </section>
      </div>
    </main>
  );
}
