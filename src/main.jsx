import React, { useEffect, useMemo, useState } from "react";
import { createRoot } from "react-dom/client";
import { createClient } from "@supabase/supabase-js";
import { CalendarDays, Check, Loader2, RotateCcw } from "lucide-react";
import "./styles.css";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
const supabase = supabaseUrl && supabaseAnonKey
  ? createClient(supabaseUrl, supabaseAnonKey)
  : null;

const START = "2026-07-14";
const END = "2027-12-31";
const today = formatDate(new Date());

function App() {
  const [tab, setTab] = useState("home");
  const [checks, setChecks] = useState({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const dates = useMemo(() => rangeDates(START, END), []);
  const todayDone = !!checks[today];
  const doneCount = dates.filter((d) => checks[d]).length;
  const percent = Math.round((doneCount / 365) * 1000) / 10;
  const streak = calcStreak(checks);

  useEffect(() => {
    loadChecks();
  }, []);

  async function loadChecks() {
    if (!supabase) {
      setError("缺少 Supabase 连接配置");
      setLoading(false);
      return;
    }
    setLoading(true);
    const { data, error: loadError } = await supabase
      .from("sunscreen_checks")
      .select("check_date, done")
      .gte("check_date", START)
      .lte("check_date", END);
    if (loadError) {
      setError(loadError.message);
    } else {
      setChecks(Object.fromEntries((data || []).map((row) => [row.check_date, row.done])));
      setError("");
    }
    setLoading(false);
  }

  async function toggleDate(date) {
    if (!supabase || saving) return;
    const next = !checks[date];
    setSaving(true);
    setChecks((old) => ({ ...old, [date]: next }));
    const { error: saveError } = await supabase
      .from("sunscreen_checks")
      .upsert({ check_date: date, done: next, updated_at: new Date().toISOString() });
    if (saveError) {
      setChecks((old) => ({ ...old, [date]: !next }));
      setError(saveError.message);
    } else {
      setError("");
    }
    setSaving(false);
  }

  return (
    <main className="app">
      <div className="tabs">
        <button className={tab === "home" ? "active" : ""} onClick={() => setTab("home")}>主页</button>
        <button className={tab === "months" ? "active" : ""} onClick={() => setTab("months")}>月视图</button>
      </div>

      {tab === "home" && (
        <section className="home">
          <div className="hero">
            <div>
              <h1>防晒 365</h1>
              <p>今天：{today}</p>
            </div>
            <button className={`checkButton ${todayDone ? "done" : ""}`} onClick={() => toggleDate(today)}>
              {saving ? <Loader2 size={22} className="spin" /> : todayDone ? <Check size={24} /> : <CalendarDays size={24} />}
              {todayDone ? "今天已防晒" : "今天防晒合格"}
            </button>
          </div>

          <div className="stats">
            <Stat label="完成进度" value={`${percent}%`} bar={percent} />
            <Stat label="已打卡" value={doneCount} sub="/ 365 天" />
            <Stat label="连续防晒" value={streak} sub="天" />
            <Stat label="剩余" value={Math.max(365 - doneCount, 0)} sub="天" />
          </div>

          <button className="refresh" onClick={loadChecks}>
            <RotateCcw size={16} />
            刷新
          </button>

          {loading && <div className="notice">正在读取记录</div>}
          {error && <div className="notice error">{error}</div>}
        </section>
      )}

      {tab === "months" && (
        <section className="months">
          {monthStarts(START, END).map((date) => (
            <Month key={date} start={date} checks={checks} onToggle={toggleDate} />
          ))}
        </section>
      )}
    </main>
  );
}

function Stat({ label, value, sub, bar }) {
  return (
    <div className="stat">
      <div className="label">{label}</div>
      <div className="value">{value}</div>
      {sub && <div className="sub">{sub}</div>}
      {bar !== undefined && <div className="bar"><span style={{ width: `${Math.min(bar, 100)}%` }} /></div>}
    </div>
  );
}

function Month({ start, checks, onToggle }) {
  const d = parseDate(start);
  const year = d.getFullYear();
  const month = d.getMonth();
  const blanks = Array.from({ length: new Date(year, month, 1).getDay() });
  const days = Array.from({ length: new Date(year, month + 1, 0).getDate() }, (_, i) => i + 1);
  return (
    <div className="month">
      <h2>{month + 1}月 {year}</h2>
      <div className="grid">
        {["日", "一", "二", "三", "四", "五", "六"].map((d) => <b key={d}>{d}</b>)}
        {blanks.map((_, i) => <span key={`b${i}`} className="blank" />)}
        {days.map((day) => {
          const date = `${year}-${pad(month + 1)}-${pad(day)}`;
          const done = !!checks[date];
          return (
            <button key={date} className={`day ${done ? "done" : ""} ${date === today ? "today" : ""}`} onClick={() => onToggle(date)}>
              {day}
            </button>
          );
        })}
      </div>
    </div>
  );
}

function calcStreak(checks) {
  let count = 0;
  let cursor = parseDate(today);
  while (checks[formatDate(cursor)]) {
    count += 1;
    cursor.setDate(cursor.getDate() - 1);
  }
  return count;
}

function rangeDates(start, end) {
  const out = [];
  const d = parseDate(start);
  const last = parseDate(end);
  while (d <= last) {
    out.push(formatDate(d));
    d.setDate(d.getDate() + 1);
  }
  return out;
}

function monthStarts(start, end) {
  const out = [];
  const d = parseDate(start);
  d.setDate(1);
  const last = parseDate(end);
  while (d <= last) {
    out.push(formatDate(d));
    d.setMonth(d.getMonth() + 1);
  }
  return out;
}

function parseDate(value) {
  const [y, m, d] = value.split("-").map(Number);
  return new Date(y, m - 1, d);
}

function formatDate(date) {
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

function pad(n) {
  return String(n).padStart(2, "0");
}

createRoot(document.getElementById("root")).render(<App />);
