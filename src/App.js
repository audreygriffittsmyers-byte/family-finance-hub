
import { useState, useEffect } from "react";
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";

// ─── Design Tokens ─────────────────────────────────────────────────────────
// Forest & Earth — LIGHT theme, warm cream base
const T = {
  bg:          "#f5f0e8",   // warm cream page
  bgCard:      "#fdfaf4",   // soft white card
  bgInput:     "#f0ebe0",   // light parchment input
  bgHover:     "#e8e0d0",   // hovered item
  border:      "#d8cfc0",   // warm tan border
  borderLight: "#e4ddd0",   // subtle border
  text:        "#2a2318",   // deep walnut text
  textMid:     "#6b5e4a",   // medium warm brown
  textDim:     "#9c8c78",   // muted warm gray
  accent:      "#b85c30",   // deep terracotta
  accentHov:   "#a04e26",
  accentText:  "#ffffff",
  green:       "#3d7a35",   // forest green
  greenDim:    "#5a9e50",
  gold:        "#a07820",   // deep autumn gold
  goldDim:     "#c49a30",
  red:         "#a03828",   // dark rust
  sage:        "#527a48",   // sage green
  sand:        "#9a7840",   // sandy brown
  teal:        "#2e7060",   // deep forest teal
};

const CHART_COLORS = [T.accent, T.green, T.gold, T.teal, T.sage, T.sand, "#7a6ec8", "#c86a6a", "#6aaec8", "#c8a45a", "#5ab86a"];

// ─── Helpers ───────────────────────────────────────────────────────────────
const fmt = (n) => new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", minimumFractionDigits: 2 }).format(n || 0);
const fmtShort = (n) => n >= 1000 ? `$${(n / 1000).toFixed(1)}k` : fmt(n);
const today = () => new Date().toISOString().split("T")[0];
const uid = () => Math.random().toString(36).slice(2, 9);
const daysUntil = (dateStr) => {
  const diff = new Date(dateStr) - new Date(today());
  return Math.ceil(diff / (1000 * 60 * 60 * 24));
};

const BILL_CATEGORIES = ["Housing","Utilities","Insurance","Subscriptions","Debt","Food","Transport","Health","Kids","Pets","Other"];
const BUDGET_CATEGORIES = ["Housing","Groceries","Dining Out","Transport","Entertainment","Health","Clothing","Personal Care","Kids","Savings","Misc"];

const SEED = {
  incomes: [
    { id: uid(), person: "Partner 1", label: "Primary Job", amount: 4200, frequency: "monthly", next: today() },
    { id: uid(), person: "Partner 2", label: "Primary Job", amount: 3100, frequency: "monthly", next: today() },
  ],
  bills: [
    { id: uid(), label: "Mortgage / Rent", category: "Housing", amount: 1850, dueDay: 1, autopay: true, paid: false },
    { id: uid(), label: "Electric", category: "Utilities", amount: 130, dueDay: 15, autopay: false, paid: false },
    { id: uid(), label: "Internet", category: "Utilities", amount: 75, dueDay: 10, autopay: true, paid: false },
    { id: uid(), label: "Car Insurance", category: "Insurance", amount: 185, dueDay: 20, autopay: true, paid: false },
    { id: uid(), label: "Netflix + Spotify", category: "Subscriptions", amount: 35, dueDay: 5, autopay: true, paid: false },
    { id: uid(), label: "Car Payment", category: "Debt", amount: 420, dueDay: 8, autopay: false, paid: false },
  ],
  budgets: [
    { id: uid(), category: "Groceries", budgeted: 600, spent: 0 },
    { id: uid(), category: "Dining Out", budgeted: 200, spent: 0 },
    { id: uid(), category: "Transport", budgeted: 150, spent: 0 },
    { id: uid(), category: "Entertainment", budgeted: 100, spent: 0 },
    { id: uid(), category: "Health", budgeted: 100, spent: 0 },
  ],
  savings: [
    { id: uid(), label: "Emergency Fund", target: 15000, saved: 4200, color: T.gold, deadline: "" },
    { id: uid(), label: "Vacation", target: 3000, saved: 800, color: T.teal, deadline: "2026-07-01" },
  ],
  projects: [
    {
      id: uid(), label: "Kitchen Remodel", store: "Home Depot", saved: 0, deadline: "",
      items: [
        { id: uid(), name: "Cabinets", qty: 1, price: 1800 },
        { id: uid(), name: "Countertop", qty: 1, price: 950 },
        { id: uid(), name: "Sink + Faucet", qty: 1, price: 280 },
      ]
    }
  ],
  transactions: []
};

// ─── Storage ───────────────────────────────────────────────────────────────
const load = () => { try { return JSON.parse(localStorage.getItem("ffh_v3")) || SEED; } catch { return SEED; } };
const save = (data) => localStorage.setItem("ffh_v3", JSON.stringify(data));

// ─── Shared Styles ─────────────────────────────────────────────────────────
const inp = {
  background: T.bgInput, border: `1px solid ${T.border}`, borderRadius: "8px",
  color: T.text, padding: "0.6rem 0.9rem", fontSize: "0.9rem",
  width: "100%", boxSizing: "border-box", outline: "none",
  fontFamily: "'Lora', serif",
};
const sel = { ...inp };
const lbl = {
  display: "block", color: T.textMid, fontSize: "0.75rem",
  marginBottom: "0.3rem", textTransform: "uppercase", letterSpacing: "0.07em",
  fontFamily: "'DM Sans', sans-serif",
};
const row = { display: "grid", gap: "0.8rem", marginBottom: "0.9rem" };

const btn = (variant = "primary") => ({
  padding: "0.65rem 1.4rem", borderRadius: "8px", border: "none",
  cursor: "pointer", fontFamily: "'DM Sans', sans-serif", fontWeight: 600, fontSize: "0.88rem",
  transition: "all 0.15s ease",
  ...(variant === "primary"
    ? { background: T.accent, color: T.accentText }
    : variant === "danger"
    ? { background: T.red, color: "#fff" }
    : { background: T.bgHover, color: T.text, border: `1px solid ${T.border}` }),
});

// ─── Progress Bar ──────────────────────────────────────────────────────────
function ProgressBar({ value, max, color = T.accent, height = 8 }) {
  const pct = Math.min(100, (value / max) * 100) || 0;
  return (
    <div style={{ background: T.bgInput, borderRadius: 99, height, overflow: "hidden" }}>
      <div style={{ width: `${pct}%`, height: "100%", background: color, borderRadius: 99, transition: "width 0.6s cubic-bezier(0.4,0,0.2,1)" }} />
    </div>
  );
}

// ─── Stat Card ─────────────────────────────────────────────────────────────
function StatCard({ label: lbl2, value, sub, color = T.accent, icon }) {
  return (
    <div style={{ background: T.bgCard, border: `1px solid ${T.border}`, borderRadius: "14px", padding: "1.25rem 1.4rem", position: "relative", overflow: "hidden" }}>
      <div style={{ position: "absolute", top: -20, right: -20, width: 80, height: 80, background: color, opacity: 0.07, borderRadius: "50%" }} />
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
        <div>
          <div style={{ color: T.textDim, fontSize: "0.73rem", textTransform: "uppercase", letterSpacing: "0.09em", marginBottom: "0.45rem", fontFamily: "'DM Sans', sans-serif" }}>{lbl2}</div>
          <div style={{ color, fontSize: "1.6rem", fontFamily: "'Lora', serif", fontWeight: 700 }}>{value}</div>
          {sub && <div style={{ color: T.textMid, fontSize: "0.78rem", marginTop: "0.25rem", fontFamily: "'DM Sans', sans-serif" }}>{sub}</div>}
        </div>
        {icon && <div style={{ fontSize: "1.5rem", opacity: 0.5 }}>{icon}</div>}
      </div>
    </div>
  );
}

// ─── Modal ─────────────────────────────────────────────────────────────────
function Modal({ title, onClose, children }) {
  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(5,8,4,0.88)", zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center", padding: "1rem" }}
      onClick={e => e.target === e.currentTarget && onClose()}>
      <div style={{ background: T.bgCard, border: `1px solid ${T.borderLight}`, borderRadius: "18px", padding: "2rem", width: "100%", maxWidth: "520px", maxHeight: "90vh", overflowY: "auto", boxShadow: `0 32px 80px rgba(0,0,0,0.7), 0 0 0 1px ${T.border}` }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.5rem" }}>
          <h3 style={{ margin: 0, color: T.text, fontFamily: "'Lora', serif", fontSize: "1.2rem", fontWeight: 600 }}>{title}</h3>
          <button onClick={onClose} style={{ background: "none", border: "none", color: T.textDim, cursor: "pointer", fontSize: "1.5rem", lineHeight: 1, padding: "0.2rem 0.4rem", borderRadius: 6 }}>×</button>
        </div>
        {children}
      </div>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════════════
// DASHBOARD
// ══════════════════════════════════════════════════════════════════════════
function Dashboard({ data }) {
  const totalIncome = data.incomes.reduce((s, i) => s + (i.frequency === "biweekly" ? i.amount * 2.17 : i.frequency === "weekly" ? i.amount * 4.33 : i.amount), 0);
  const totalBills = data.bills.reduce((s, b) => s + b.amount, 0);
  const totalBudget = data.budgets.reduce((s, b) => s + b.budgeted, 0);
  const totalSpent = data.budgets.reduce((s, b) => s + b.spent, 0);
  const net = totalIncome - totalBills - totalBudget;

  const upcomingBills = [...data.bills]
    .map(b => ({ ...b, days: daysUntil(`${new Date().getFullYear()}-${String(new Date().getMonth()+1).padStart(2,"0")}-${String(b.dueDay).padStart(2,"0")}`) }))
    .filter(b => b.days >= 0 && b.days <= 14)
    .sort((a, b) => a.days - b.days);

  const billsByCategory = ["Housing","Utilities","Insurance","Subscriptions","Debt","Food","Transport","Health","Kids","Pets","Other"].map(c => ({
    name: c, value: data.bills.filter(b => b.category === c).reduce((s, b) => s + b.amount, 0)
  })).filter(d => d.value > 0);

  const cashflowData = ["Jan","Feb","Mar","Apr","May","Jun"].map(m => ({
    month: m, income: totalIncome, expenses: totalBills + totalBudget, net,
  }));

  return (
    <div>
      <div style={{ marginBottom: "1.75rem" }}>
        <h2 style={{ fontFamily: "'Lora', serif", color: T.text, margin: 0, fontSize: "1.75rem", fontWeight: 700 }}>Family Overview</h2>
        <p style={{ color: T.textDim, margin: "0.3rem 0 0", fontSize: "0.88rem", fontFamily: "'DM Sans', sans-serif" }}>Monthly snapshot for both partners</p>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(190px,1fr))", gap: "0.9rem", marginBottom: "1.5rem" }}>
        <StatCard label="Monthly Income" value={fmt(totalIncome)} icon="🌿" color={T.green} sub={`${data.incomes.length} sources`} />
        <StatCard label="Bills" value={fmt(totalBills)} icon="🍂" color={T.red} sub={`${data.bills.length} recurring`} />
        <StatCard label="Budgeted Spending" value={fmt(totalBudget)} icon="🌾" color={T.gold} sub={`${fmt(totalSpent)} spent so far`} />
        <StatCard label="Net Cash Flow" value={fmt(net)} icon="🌲" color={net >= 0 ? T.green : T.red} sub={net >= 0 ? "Looking good!" : "Over budget"} />
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem", marginBottom: "1rem" }}>
        <div style={{ background: T.bgCard, border: `1px solid ${T.border}`, borderRadius: "14px", padding: "1.25rem" }}>
          <h3 style={{ margin: "0 0 1rem", color: T.text, fontSize: "0.9rem", fontWeight: 600, fontFamily: "'DM Sans', sans-serif", letterSpacing: "0.03em" }}>Bills by Category</h3>
          <ResponsiveContainer width="100%" height={170}>
            <PieChart>
              <Pie data={billsByCategory} cx="50%" cy="50%" innerRadius={42} outerRadius={70} dataKey="value" paddingAngle={3}>
                {billsByCategory.map((_, i) => <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />)}
              </Pie>
              <Tooltip formatter={(v) => fmt(v)} contentStyle={{ background: T.bgHover, border: `1px solid ${T.border}`, borderRadius: 8, fontSize: "0.82rem", color: T.text }} />
            </PieChart>
          </ResponsiveContainer>
          <div style={{ display: "flex", flexWrap: "wrap", gap: "0.4rem" }}>
            {billsByCategory.map((d, i) => (
              <span key={d.name} style={{ fontSize: "0.7rem", color: T.textMid, display: "flex", alignItems: "center", gap: "0.3rem", fontFamily: "'DM Sans', sans-serif" }}>
                <span style={{ width: 7, height: 7, borderRadius: "50%", background: CHART_COLORS[i % CHART_COLORS.length], display: "inline-block" }} />{d.name}
              </span>
            ))}
          </div>
        </div>

        <div style={{ background: T.bgCard, border: `1px solid ${T.border}`, borderRadius: "14px", padding: "1.25rem" }}>
          <h3 style={{ margin: "0 0 1rem", color: T.text, fontSize: "0.9rem", fontWeight: 600, fontFamily: "'DM Sans', sans-serif" }}>6-Month Cash Flow</h3>
          <ResponsiveContainer width="100%" height={170}>
            <BarChart data={cashflowData} barSize={12}>
              <XAxis dataKey="month" tick={{ fill: T.textDim, fontSize: 11, fontFamily: "'DM Sans', sans-serif" }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: T.textDim, fontSize: 10 }} axisLine={false} tickLine={false} tickFormatter={fmtShort} />
              <Tooltip formatter={(v) => fmt(v)} contentStyle={{ background: T.bgHover, border: `1px solid ${T.border}`, borderRadius: 8, fontSize: "0.82rem", color: T.text }} />
              <Bar dataKey="income" fill={T.greenDim} radius={[4,4,0,0]} name="Income" />
              <Bar dataKey="expenses" fill={T.red} radius={[4,4,0,0]} name="Expenses" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
        <div style={{ background: T.bgCard, border: `1px solid ${T.border}`, borderRadius: "14px", padding: "1.25rem" }}>
          <h3 style={{ margin: "0 0 1rem", color: T.text, fontSize: "0.9rem", fontWeight: 600, fontFamily: "'DM Sans', sans-serif" }}>Bills Due Soon</h3>
          {upcomingBills.length === 0
            ? <p style={{ color: T.textDim, fontSize: "0.85rem", fontFamily: "'DM Sans', sans-serif" }}>No bills due in the next 14 days.</p>
            : upcomingBills.map(b => (
              <div key={b.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "0.55rem 0", borderBottom: `1px solid ${T.bgInput}` }}>
                <div>
                  <div style={{ color: T.text, fontSize: "0.88rem", fontFamily: "'DM Sans', sans-serif" }}>{b.label}</div>
                  <div style={{ color: b.days <= 3 ? T.red : T.textDim, fontSize: "0.75rem", fontFamily: "'DM Sans', sans-serif" }}>
                    {b.days === 0 ? "Due today!" : b.days === 1 ? "Tomorrow" : `In ${b.days} days`}
                  </div>
                </div>
                <span style={{ color: T.gold, fontWeight: 700, fontSize: "0.95rem", fontFamily: "'Lora', serif" }}>{fmt(b.amount)}</span>
              </div>
            ))
          }
        </div>

        <div style={{ background: T.bgCard, border: `1px solid ${T.border}`, borderRadius: "14px", padding: "1.25rem" }}>
          <h3 style={{ margin: "0 0 1rem", color: T.text, fontSize: "0.9rem", fontWeight: 600, fontFamily: "'DM Sans', sans-serif" }}>Savings Goals</h3>
          {data.savings.map(g => (
            <div key={g.id} style={{ marginBottom: "1rem" }}>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.85rem", marginBottom: "0.35rem", fontFamily: "'DM Sans', sans-serif" }}>
                <span style={{ color: T.text }}>{g.label}</span>
                <span style={{ color: T.textMid }}>{fmt(g.saved)} / {fmt(g.target)}</span>
              </div>
              <ProgressBar value={g.saved} max={g.target} color={g.color} />
              <div style={{ color: T.textDim, fontSize: "0.72rem", marginTop: "0.25rem", textAlign: "right", fontFamily: "'DM Sans', sans-serif" }}>
                {Math.round((g.saved / g.target) * 100)}% saved
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════════════
// INCOME
// ══════════════════════════════════════════════════════════════════════════
function IncomeTab({ data, setData }) {
  const [modal, setModal] = useState(false);
  const [form, setForm] = useState({ person: "Partner 1", label: "", amount: "", frequency: "monthly", next: today() });
  const f = (k) => (e) => setForm(p => ({ ...p, [k]: e.target.value }));

  const add = () => {
    if (!form.label || !form.amount) return;
    setData(d => { const n = { ...d, incomes: [...d.incomes, { ...form, id: uid(), amount: parseFloat(form.amount) }] }; save(n); return n; });
    setModal(false); setForm({ person: "Partner 1", label: "", amount: "", frequency: "monthly", next: today() });
  };
  const del = (id) => setData(d => { const n = { ...d, incomes: d.incomes.filter(i => i.id !== id) }; save(n); return n; });

  const monthly = (inc) => inc.frequency === "biweekly" ? inc.amount * 2.17 : inc.frequency === "weekly" ? inc.amount * 4.33 : inc.amount;
  const p1 = data.incomes.filter(i => i.person === "Partner 1");
  const p2 = data.incomes.filter(i => i.person === "Partner 2");
  const total = data.incomes.reduce((s, i) => s + monthly(i), 0);

  const PersonSection = ({ person, incomes }) => (
    <div style={{ marginBottom: "1.75rem" }}>
      <div style={{ display: "flex", alignItems: "center", gap: "0.6rem", marginBottom: "0.75rem" }}>
        <div style={{ width: 3, height: 18, background: T.accent, borderRadius: 2 }} />
        <h3 style={{ color: T.textMid, fontSize: "0.8rem", textTransform: "uppercase", letterSpacing: "0.1em", margin: 0, fontFamily: "'DM Sans', sans-serif" }}>{person}</h3>
      </div>
      {incomes.length === 0 && <p style={{ color: T.textDim, fontSize: "0.85rem", fontFamily: "'DM Sans', sans-serif" }}>No income added yet.</p>}
      {incomes.map(inc => (
        <div key={inc.id} style={{ background: T.bgInput, border: `1px solid ${T.border}`, borderRadius: "12px", padding: "1rem 1.2rem", marginBottom: "0.6rem", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div>
            <div style={{ color: T.text, fontWeight: 600, fontSize: "0.95rem", fontFamily: "'DM Sans', sans-serif" }}>{inc.label}</div>
            <div style={{ color: T.textDim, fontSize: "0.78rem", fontFamily: "'DM Sans', sans-serif" }}>{inc.frequency} · next: {inc.next}</div>
          </div>
          <div style={{ textAlign: "right" }}>
            <div style={{ color: T.green, fontWeight: 700, fontSize: "1.05rem", fontFamily: "'Lora', serif" }}>{fmt(inc.amount)}</div>
            <div style={{ color: T.textDim, fontSize: "0.72rem", fontFamily: "'DM Sans', sans-serif" }}>{fmt(monthly(inc))}/mo</div>
            <button onClick={() => del(inc.id)} style={{ ...btn("danger"), padding: "0.2rem 0.6rem", fontSize: "0.72rem", marginTop: "0.3rem" }}>Remove</button>
          </div>
        </div>
      ))}
    </div>
  );

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.5rem" }}>
        <div>
          <h2 style={{ fontFamily: "'Lora', serif", color: T.text, margin: 0, fontSize: "1.75rem" }}>Income</h2>
          <p style={{ color: T.textDim, margin: "0.3rem 0 0", fontSize: "0.88rem", fontFamily: "'DM Sans', sans-serif" }}>Total monthly: <strong style={{ color: T.green }}>{fmt(total)}</strong></p>
        </div>
        <button style={btn()} onClick={() => setModal(true)}>+ Add Income</button>
      </div>
      <PersonSection person="Partner 1" incomes={p1} />
      <PersonSection person="Partner 2" incomes={p2} />

      {modal && (
        <Modal title="Add Income Source" onClose={() => setModal(false)}>
          <div style={row}><div><label style={lbl}>Person</label>
            <select style={sel} value={form.person} onChange={f("person")}><option>Partner 1</option><option>Partner 2</option></select>
          </div></div>
          <div style={row}><div><label style={lbl}>Label</label><input style={inp} placeholder="e.g. Salary, Freelance" value={form.label} onChange={f("label")} /></div></div>
          <div style={{ ...row, gridTemplateColumns: "1fr 1fr" }}>
            <div><label style={lbl}>Amount ($)</label><input style={inp} type="number" placeholder="0.00" value={form.amount} onChange={f("amount")} /></div>
            <div><label style={lbl}>Frequency</label>
              <select style={sel} value={form.frequency} onChange={f("frequency")}>
                <option value="weekly">Weekly</option><option value="biweekly">Bi-weekly</option>
                <option value="monthly">Monthly</option><option value="yearly">Yearly</option>
              </select>
            </div>
          </div>
          <div style={row}><div><label style={lbl}>Next Pay Date</label><input style={inp} type="date" value={form.next} onChange={f("next")} /></div></div>
          <div style={{ display: "flex", gap: "0.75rem", justifyContent: "flex-end" }}>
            <button style={btn("ghost")} onClick={() => setModal(false)}>Cancel</button>
            <button style={btn()} onClick={add}>Add Income</button>
          </div>
        </Modal>
      )}
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════════════
// BILLS
// ══════════════════════════════════════════════════════════════════════════
function BillsTab({ data, setData }) {
  const [modal, setModal] = useState(false);
  const [form, setForm] = useState({ label: "", category: "Housing", amount: "", dueDay: "1", autopay: false, paid: false });
  const f = (k) => (e) => setForm(p => ({ ...p, [k]: e.target.type === "checkbox" ? e.target.checked : e.target.value }));

  const add = () => {
    if (!form.label || !form.amount) return;
    setData(d => { const n = { ...d, bills: [...d.bills, { ...form, id: uid(), amount: parseFloat(form.amount), dueDay: parseInt(form.dueDay) }] }; save(n); return n; });
    setModal(false); setForm({ label: "", category: "Housing", amount: "", dueDay: "1", autopay: false, paid: false });
  };
  const del = (id) => setData(d => { const n = { ...d, bills: d.bills.filter(b => b.id !== id) }; save(n); return n; });
  const togglePaid = (id) => setData(d => { const n = { ...d, bills: d.bills.map(b => b.id === id ? { ...b, paid: !b.paid } : b) }; save(n); return n; });

  const total = data.bills.reduce((s, b) => s + b.amount, 0);
  const byCategory = BILL_CATEGORIES.map(c => ({ c, bills: data.bills.filter(b => b.category === c) })).filter(x => x.bills.length > 0);

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.5rem" }}>
        <div>
          <h2 style={{ fontFamily: "'Lora', serif", color: T.text, margin: 0, fontSize: "1.75rem" }}>Bills Tracker</h2>
          <p style={{ color: T.textDim, margin: "0.3rem 0 0", fontSize: "0.88rem", fontFamily: "'DM Sans', sans-serif" }}>Monthly total: <strong style={{ color: T.red }}>{fmt(total)}</strong></p>
        </div>
        <button style={btn()} onClick={() => setModal(true)}>+ Add Bill</button>
      </div>

      {byCategory.map(({ c, bills }) => (
        <div key={c} style={{ marginBottom: "1.5rem" }}>
          <div style={{ color: T.textDim, fontSize: "0.75rem", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: "0.6rem", display: "flex", justifyContent: "space-between", fontFamily: "'DM Sans', sans-serif", borderBottom: `1px solid ${T.border}`, paddingBottom: "0.4rem" }}>
            <span>{c}</span><span style={{ color: T.textMid }}>{fmt(bills.reduce((s, b) => s + b.amount, 0))}</span>
          </div>
          {bills.map(b => {
            const days = daysUntil(`${new Date().getFullYear()}-${String(new Date().getMonth()+1).padStart(2,"0")}-${String(b.dueDay).padStart(2,"0")}`);
            const urgent = days >= 0 && days <= 5;
            return (
              <div key={b.id} style={{ background: b.paid ? T.bg : T.bgInput, border: `1px solid ${urgent && !b.paid ? T.red : T.border}`, borderRadius: "10px", padding: "0.85rem 1.1rem", marginBottom: "0.5rem", display: "flex", justifyContent: "space-between", alignItems: "center", opacity: b.paid ? 0.55 : 1 }}>
                <div style={{ display: "flex", alignItems: "center", gap: "0.8rem" }}>
                  <input type="checkbox" checked={b.paid} onChange={() => togglePaid(b.id)} style={{ accentColor: T.green, width: 16, height: 16, cursor: "pointer" }} />
                  <div>
                    <div style={{ color: b.paid ? T.textDim : T.text, fontWeight: 600, fontSize: "0.92rem", textDecoration: b.paid ? "line-through" : "none", fontFamily: "'DM Sans', sans-serif" }}>{b.label}</div>
                    <div style={{ color: T.textDim, fontSize: "0.75rem", fontFamily: "'DM Sans', sans-serif" }}>
                      Day {b.dueDay} {b.autopay ? "· autopay" : "· manual"}
                      {!b.paid && days >= 0 && days <= 14 && <span style={{ color: urgent ? T.red : T.gold, marginLeft: "0.4rem" }}>({days === 0 ? "today!" : `${days}d`})</span>}
                    </div>
                  </div>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: "0.8rem" }}>
                  <span style={{ color: T.red, fontWeight: 700, fontSize: "1rem", fontFamily: "'Lora', serif" }}>{fmt(b.amount)}</span>
                  <button onClick={() => del(b.id)} style={{ background: "none", border: "none", color: T.textDim, cursor: "pointer", fontSize: "1.1rem" }}>🗑</button>
                </div>
              </div>
            );
          })}
        </div>
      ))}

      {modal && (
        <Modal title="Add Bill" onClose={() => setModal(false)}>
          <div style={row}><div><label style={lbl}>Bill Name</label><input style={inp} placeholder="e.g. Electric, Car Payment" value={form.label} onChange={f("label")} /></div></div>
          <div style={{ ...row, gridTemplateColumns: "1fr 1fr" }}>
            <div><label style={lbl}>Category</label>
              <select style={sel} value={form.category} onChange={f("category")}>{BILL_CATEGORIES.map(c => <option key={c}>{c}</option>)}</select>
            </div>
            <div><label style={lbl}>Amount ($)</label><input style={inp} type="number" placeholder="0.00" value={form.amount} onChange={f("amount")} /></div>
          </div>
          <div style={{ ...row, gridTemplateColumns: "1fr 1fr" }}>
            <div><label style={lbl}>Due Day of Month</label><input style={inp} type="number" min={1} max={31} value={form.dueDay} onChange={f("dueDay")} /></div>
            <div style={{ display: "flex", flexDirection: "column", justifyContent: "flex-end" }}>
              <label style={{ display: "flex", alignItems: "center", gap: "0.5rem", cursor: "pointer", color: T.textMid, fontSize: "0.85rem", fontFamily: "'DM Sans', sans-serif" }}>
                <input type="checkbox" checked={form.autopay} onChange={f("autopay")} style={{ accentColor: T.green, width: 16, height: 16 }} />Autopay
              </label>
            </div>
          </div>
          <div style={{ display: "flex", gap: "0.75rem", justifyContent: "flex-end" }}>
            <button style={btn("ghost")} onClick={() => setModal(false)}>Cancel</button>
            <button style={btn()} onClick={add}>Add Bill</button>
          </div>
        </Modal>
      )}
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════════════
// BUDGET
// ══════════════════════════════════════════════════════════════════════════
function BudgetTab({ data, setData }) {
  const [modal, setModal] = useState(false);
  const [spendModal, setSpendModal] = useState(null);
  const [form, setForm] = useState({ category: "Groceries", budgeted: "" });
  const [spendAmt, setSpendAmt] = useState("");
  const f = (k) => (e) => setForm(p => ({ ...p, [k]: e.target.value }));

  const add = () => {
    if (!form.budgeted) return;
    const exists = data.budgets.find(b => b.category === form.category);
    if (exists) {
      setData(d => { const n = { ...d, budgets: d.budgets.map(b => b.category === form.category ? { ...b, budgeted: parseFloat(form.budgeted) } : b) }; save(n); return n; });
    } else {
      setData(d => { const n = { ...d, budgets: [...d.budgets, { id: uid(), category: form.category, budgeted: parseFloat(form.budgeted), spent: 0 }] }; save(n); return n; });
    }
    setModal(false);
  };
  const addSpend = (id) => {
    if (!spendAmt) return;
    setData(d => { const n = { ...d, budgets: d.budgets.map(b => b.id === id ? { ...b, spent: b.spent + parseFloat(spendAmt) } : b) }; save(n); return n; });
    setSpendModal(null); setSpendAmt("");
  };
  const del = (id) => setData(d => { const n = { ...d, budgets: d.budgets.filter(b => b.id !== id) }; save(n); return n; });
  const reset = () => setData(d => { const n = { ...d, budgets: d.budgets.map(b => ({ ...b, spent: 0 })) }; save(n); return n; });

  const totalBudgeted = data.budgets.reduce((s, b) => s + b.budgeted, 0);
  const totalSpent = data.budgets.reduce((s, b) => s + b.spent, 0);
  const barData = data.budgets.map(b => ({ name: b.category.slice(0, 8), budgeted: b.budgeted, spent: b.spent }));

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem" }}>
        <div>
          <h2 style={{ fontFamily: "'Lora', serif", color: T.text, margin: 0, fontSize: "1.75rem" }}>Budget Planner</h2>
          <p style={{ color: T.textDim, margin: "0.3rem 0 0", fontSize: "0.88rem", fontFamily: "'DM Sans', sans-serif" }}>Spent {fmt(totalSpent)} of {fmt(totalBudgeted)} budgeted</p>
        </div>
        <div style={{ display: "flex", gap: "0.6rem" }}>
          <button style={btn("ghost")} onClick={reset}>Reset Month</button>
          <button style={btn()} onClick={() => setModal(true)}>+ Category</button>
        </div>
      </div>

      <div style={{ background: T.bgCard, border: `1px solid ${T.border}`, borderRadius: "14px", padding: "1.25rem", marginBottom: "1.25rem" }}>
        <ResponsiveContainer width="100%" height={170}>
          <BarChart data={barData} barSize={14}>
            <XAxis dataKey="name" tick={{ fill: T.textDim, fontSize: 11, fontFamily: "'DM Sans', sans-serif" }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fill: T.textDim, fontSize: 10 }} axisLine={false} tickLine={false} tickFormatter={fmtShort} />
            <Tooltip formatter={(v) => fmt(v)} contentStyle={{ background: T.bgHover, border: `1px solid ${T.border}`, borderRadius: 8, fontSize: "0.82rem", color: T.text }} />
            <Bar dataKey="budgeted" fill={T.bgHover} radius={[4,4,0,0]} name="Budgeted" />
            <Bar dataKey="spent" fill={T.accent} radius={[4,4,0,0]} name="Spent" />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {data.budgets.map(b => {
        const pct = Math.min(100, (b.spent / b.budgeted) * 100) || 0;
        const over = b.spent > b.budgeted;
        return (
          <div key={b.id} style={{ background: T.bgInput, border: `1px solid ${over ? T.red : T.border}`, borderRadius: "12px", padding: "1rem 1.2rem", marginBottom: "0.75rem" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.5rem" }}>
              <span style={{ color: T.text, fontWeight: 600, fontSize: "0.95rem", fontFamily: "'DM Sans', sans-serif" }}>{b.category}</span>
              <div style={{ display: "flex", gap: "0.6rem", alignItems: "center" }}>
                <span style={{ color: over ? T.red : T.textMid, fontSize: "0.82rem", fontFamily: "'DM Sans', sans-serif" }}>{fmt(b.spent)} / {fmt(b.budgeted)}</span>
                <button onClick={() => { setSpendModal(b.id); setSpendAmt(""); }} style={{ ...btn(), padding: "0.2rem 0.6rem", fontSize: "0.75rem" }}>+ Spend</button>
                <button onClick={() => del(b.id)} style={{ background: "none", border: "none", color: T.textDim, cursor: "pointer" }}>🗑</button>
              </div>
            </div>
            <ProgressBar value={b.spent} max={b.budgeted} color={over ? T.red : pct > 80 ? T.gold : T.accent} />
            <div style={{ color: over ? T.red : T.textDim, fontSize: "0.72rem", marginTop: "0.25rem", textAlign: "right", fontFamily: "'DM Sans', sans-serif" }}>
              {over ? `${fmt(b.spent - b.budgeted)} over budget` : `${fmt(b.budgeted - b.spent)} remaining`}
            </div>
          </div>
        );
      })}

      {spendModal && (
        <Modal title="Log Spending" onClose={() => setSpendModal(null)}>
          <div style={row}><div><label style={lbl}>Amount Spent ($)</label><input style={inp} type="number" placeholder="0.00" value={spendAmt} onChange={e => setSpendAmt(e.target.value)} autoFocus /></div></div>
          <div style={{ display: "flex", gap: "0.75rem", justifyContent: "flex-end" }}>
            <button style={btn("ghost")} onClick={() => setSpendModal(null)}>Cancel</button>
            <button style={btn()} onClick={() => addSpend(spendModal)}>Log</button>
          </div>
        </Modal>
      )}
      {modal && (
        <Modal title="Add Budget Category" onClose={() => setModal(false)}>
          <div style={row}><div><label style={lbl}>Category</label>
            <select style={sel} value={form.category} onChange={f("category")}>{BUDGET_CATEGORIES.map(c => <option key={c}>{c}</option>)}</select>
          </div></div>
          <div style={row}><div><label style={lbl}>Monthly Budget ($)</label><input style={inp} type="number" placeholder="0.00" value={form.budgeted} onChange={f("budgeted")} /></div></div>
          <div style={{ display: "flex", gap: "0.75rem", justifyContent: "flex-end" }}>
            <button style={btn("ghost")} onClick={() => setModal(false)}>Cancel</button>
            <button style={btn()} onClick={add}>Save</button>
          </div>
        </Modal>
      )}
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════════════
// SAVINGS
// ══════════════════════════════════════════════════════════════════════════
function SavingsTab({ data, setData }) {
  const [modal, setModal] = useState(false);
  const [depositModal, setDepositModal] = useState(null);
  const [form, setForm] = useState({ label: "", target: "", saved: "0", color: T.accent, deadline: "" });
  const [depositAmt, setDepositAmt] = useState("");
  const f = (k) => (e) => setForm(p => ({ ...p, [k]: e.target.value }));

  const add = () => {
    if (!form.label || !form.target) return;
    setData(d => { const n = { ...d, savings: [...d.savings, { ...form, id: uid(), target: parseFloat(form.target), saved: parseFloat(form.saved) || 0 }] }; save(n); return n; });
    setModal(false);
  };
  const deposit = (id) => {
    if (!depositAmt) return;
    setData(d => { const n = { ...d, savings: d.savings.map(g => g.id === id ? { ...g, saved: Math.min(g.target, g.saved + parseFloat(depositAmt)) } : g) }; save(n); return n; });
    setDepositModal(null); setDepositAmt("");
  };
  const del = (id) => setData(d => { const n = { ...d, savings: d.savings.filter(g => g.id !== id) }; save(n); return n; });

  const GOAL_COLORS = [T.accent, T.green, T.gold, T.teal, T.sage, T.sand, T.red];
  const totalTarget = data.savings.reduce((s, g) => s + g.target, 0);
  const totalSaved = data.savings.reduce((s, g) => s + g.saved, 0);

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.5rem" }}>
        <div>
          <h2 style={{ fontFamily: "'Lora', serif", color: T.text, margin: 0, fontSize: "1.75rem" }}>Savings Goals</h2>
          <p style={{ color: T.textDim, margin: "0.3rem 0 0", fontSize: "0.88rem", fontFamily: "'DM Sans', sans-serif" }}>{fmt(totalSaved)} saved of {fmt(totalTarget)} total</p>
        </div>
        <button style={btn()} onClick={() => setModal(true)}>+ New Goal</button>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(260px,1fr))", gap: "1rem" }}>
        {data.savings.map(g => {
          const pct = Math.round((g.saved / g.target) * 100) || 0;
          const remaining = g.target - g.saved;
          const daysLeft = g.deadline ? daysUntil(g.deadline) : null;
          const monthsLeft = daysLeft ? Math.ceil(daysLeft / 30) : null;
          const monthlyNeeded = monthsLeft && monthsLeft > 0 ? remaining / monthsLeft : null;
          return (
            <div key={g.id} style={{ background: T.bgCard, border: `1px solid ${T.border}`, borderLeft: `3px solid ${g.color}`, borderRadius: "14px", padding: "1.4rem", position: "relative", overflow: "hidden" }}>
              <div style={{ position: "absolute", bottom: -15, right: -15, width: 70, height: 70, background: g.color, opacity: 0.08, borderRadius: "50%" }} />
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "1rem" }}>
                <div>
                  <div style={{ color: T.text, fontWeight: 700, fontSize: "1rem", fontFamily: "'DM Sans', sans-serif" }}>{g.label}</div>
                  {g.deadline && <div style={{ color: T.textDim, fontSize: "0.75rem", marginTop: "0.2rem", fontFamily: "'DM Sans', sans-serif" }}>Due: {g.deadline}</div>}
                </div>
                <button onClick={() => del(g.id)} style={{ background: "none", border: "none", color: T.textDim, cursor: "pointer", fontSize: "1.1rem" }}>🗑</button>
              </div>
              <div style={{ marginBottom: "0.8rem" }}>
                <ProgressBar value={g.saved} max={g.target} color={g.color} height={10} />
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "0.9rem" }}>
                <div>
                  <div style={{ color: g.color, fontFamily: "'Lora', serif", fontSize: "1.3rem", fontWeight: 700 }}>{fmt(g.saved)}</div>
                  <div style={{ color: T.textDim, fontSize: "0.75rem", fontFamily: "'DM Sans', sans-serif" }}>of {fmt(g.target)}</div>
                </div>
                <div style={{ textAlign: "right" }}>
                  <div style={{ color: T.text, fontSize: "1.1rem", fontWeight: 700, fontFamily: "'Lora', serif" }}>{pct}%</div>
                  {monthlyNeeded && <div style={{ color: T.textDim, fontSize: "0.72rem", fontFamily: "'DM Sans', sans-serif" }}>{fmt(monthlyNeeded)}/mo needed</div>}
                </div>
              </div>
              {pct < 100
                ? <button onClick={() => { setDepositModal(g.id); setDepositAmt(""); }} style={{ ...btn(), width: "100%", textAlign: "center" }}>Add Funds</button>
                : <div style={{ textAlign: "center", color: T.green, fontWeight: 700, padding: "0.65rem", fontFamily: "'DM Sans', sans-serif" }}>🌿 Goal Reached!</div>
              }
            </div>
          );
        })}
      </div>

      {depositModal && (
        <Modal title="Add Funds" onClose={() => setDepositModal(null)}>
          <div style={row}><div><label style={lbl}>Amount ($)</label><input style={inp} type="number" placeholder="0.00" value={depositAmt} onChange={e => setDepositAmt(e.target.value)} autoFocus /></div></div>
          <div style={{ display: "flex", gap: "0.75rem", justifyContent: "flex-end" }}>
            <button style={btn("ghost")} onClick={() => setDepositModal(null)}>Cancel</button>
            <button style={btn()} onClick={() => deposit(depositModal)}>Add</button>
          </div>
        </Modal>
      )}
      {modal && (
        <Modal title="New Savings Goal" onClose={() => setModal(false)}>
          <div style={row}><div><label style={lbl}>Goal Name</label><input style={inp} placeholder="e.g. Vacation, Emergency Fund" value={form.label} onChange={f("label")} /></div></div>
          <div style={{ ...row, gridTemplateColumns: "1fr 1fr" }}>
            <div><label style={lbl}>Target ($)</label><input style={inp} type="number" placeholder="0.00" value={form.target} onChange={f("target")} /></div>
            <div><label style={lbl}>Already Saved ($)</label><input style={inp} type="number" placeholder="0.00" value={form.saved} onChange={f("saved")} /></div>
          </div>
          <div style={{ ...row, gridTemplateColumns: "1fr 1fr" }}>
            <div><label style={lbl}>Deadline (optional)</label><input style={inp} type="date" value={form.deadline} onChange={f("deadline")} /></div>
            <div><label style={lbl}>Color</label>
              <div style={{ display: "flex", gap: "0.45rem", flexWrap: "wrap", marginTop: "0.3rem" }}>
                {GOAL_COLORS.map(c => (
                  <div key={c} onClick={() => setForm(p => ({ ...p, color: c }))} style={{ width: 22, height: 22, borderRadius: "50%", background: c, cursor: "pointer", border: form.color === c ? `3px solid ${T.text}` : "3px solid transparent", transition: "border 0.15s" }} />
                ))}
              </div>
            </div>
          </div>
          <div style={{ display: "flex", gap: "0.75rem", justifyContent: "flex-end" }}>
            <button style={btn("ghost")} onClick={() => setModal(false)}>Cancel</button>
            <button style={btn()} onClick={add}>Create Goal</button>
          </div>
        </Modal>
      )}
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════════════
// PROJECTS
// ══════════════════════════════════════════════════════════════════════════
function ProjectsTab({ data, setData }) {
  const [newProj, setNewProj] = useState(false);
  const [projForm, setProjForm] = useState({ label: "", store: "Home Depot", saved: "0", deadline: "" });
  const [activeProj, setActiveProj] = useState(null);
  const [itemForm, setItemForm] = useState({ name: "", qty: "1", price: "" });
  const pf = (k) => (e) => setProjForm(p => ({ ...p, [k]: e.target.value }));
  const itf = (k) => (e) => setItemForm(p => ({ ...p, [k]: e.target.value }));

  const addProject = () => {
    if (!projForm.label) return;
    const id = uid();
    setData(d => { const n = { ...d, projects: [...d.projects, { ...projForm, id, saved: parseFloat(projForm.saved) || 0, items: [] }] }; save(n); return n; });
    setNewProj(false); setProjForm({ label: "", store: "Home Depot", saved: "0", deadline: "" });
  };
  const delProject = (id) => setData(d => { const n = { ...d, projects: d.projects.filter(p => p.id !== id) }; save(n); return n; });
  const addItem = (projId) => {
    if (!itemForm.name || !itemForm.price) return;
    setData(d => {
      const n = { ...d, projects: d.projects.map(p => p.id === projId ? { ...p, items: [...p.items, { ...itemForm, id: uid(), qty: parseFloat(itemForm.qty), price: parseFloat(itemForm.price) }] } : p) };
      save(n); return n;
    });
    setItemForm({ name: "", qty: "1", price: "" });
  };
  const delItem = (projId, itemId) => setData(d => {
    const n = { ...d, projects: d.projects.map(p => p.id === projId ? { ...p, items: p.items.filter(i => i.id !== itemId) } : p) };
    save(n); return n;
  });
  const addFunds = (projId, amt) => setData(d => {
    const proj = d.projects.find(p => p.id === projId);
    const total = proj.items.reduce((s, i) => s + i.qty * i.price, 0);
    const n = { ...d, projects: d.projects.map(p => p.id === projId ? { ...p, saved: Math.min(total, p.saved + parseFloat(amt)) } : p) };
    save(n); return n;
  });

  const STORES = ["Home Depot", "Walmart", "Lowes", "IKEA", "Target", "Amazon", "Other"];

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.5rem" }}>
        <div>
          <h2 style={{ fontFamily: "'Lora', serif", color: T.text, margin: 0, fontSize: "1.75rem" }}>Project Estimator</h2>
          <p style={{ color: T.textDim, margin: "0.3rem 0 0", fontSize: "0.88rem", fontFamily: "'DM Sans', sans-serif" }}>Plan, estimate, and save for home projects</p>
        </div>
        <button style={btn()} onClick={() => setNewProj(true)}>+ New Project</button>
      </div>

      {data.projects.map(proj => {
        const total = proj.items.reduce((s, i) => s + i.qty * i.price, 0);
        const pct = total > 0 ? Math.min(100, (proj.saved / total) * 100) : 0;
        const remaining = total - proj.saved;
        const isOpen = activeProj === proj.id;
        return (
          <div key={proj.id} style={{ background: T.bgCard, border: `1px solid ${T.border}`, borderRadius: "16px", marginBottom: "1rem", overflow: "hidden" }}>
            <div style={{ padding: "1.25rem 1.4rem", cursor: "pointer", display: "flex", justifyContent: "space-between", alignItems: "center" }} onClick={() => setActiveProj(isOpen ? null : proj.id)}>
              <div>
                <div style={{ color: T.text, fontWeight: 700, fontSize: "1rem", fontFamily: "'DM Sans', sans-serif" }}>{proj.label}</div>
                <div style={{ color: T.textDim, fontSize: "0.78rem", fontFamily: "'DM Sans', sans-serif" }}>{proj.store} · {proj.items.length} items · {fmt(total)} estimated</div>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: "0.8rem" }}>
                <div style={{ textAlign: "right" }}>
                  <div style={{ color: T.gold, fontWeight: 700, fontFamily: "'Lora', serif" }}>{fmt(proj.saved)} / {fmt(total)}</div>
                  <div style={{ color: T.textDim, fontSize: "0.72rem", fontFamily: "'DM Sans', sans-serif" }}>{Math.round(pct)}% funded</div>
                </div>
                <span style={{ color: T.textDim, fontSize: "1.1rem" }}>{isOpen ? "▲" : "▼"}</span>
              </div>
            </div>

            {total > 0 && <div style={{ padding: "0 1.4rem 0.5rem" }}><ProgressBar value={proj.saved} max={total} color={T.gold} /></div>}

            {isOpen && (
              <div style={{ padding: "0 1.4rem 1.4rem", borderTop: `1px solid ${T.border}` }}>
                <div style={{ paddingTop: "1rem", marginBottom: "1rem" }}>
                  {proj.items.map(item => (
                    <div key={item.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "0.5rem 0", borderBottom: `1px solid ${T.bgInput}` }}>
                      <div style={{ color: T.text, fontSize: "0.9rem", fontFamily: "'DM Sans', sans-serif" }}>{item.name}</div>
                      <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
                        <span style={{ color: T.textDim, fontSize: "0.82rem", fontFamily: "'DM Sans', sans-serif" }}>x{item.qty}</span>
                        <span style={{ color: T.gold, fontWeight: 600, fontFamily: "'Lora', serif" }}>{fmt(item.qty * item.price)}</span>
                        <button onClick={() => delItem(proj.id, item.id)} style={{ background: "none", border: "none", color: T.textDim, cursor: "pointer" }}>×</button>
                      </div>
                    </div>
                  ))}
                </div>
                <div style={{ background: T.bgInput, borderRadius: "10px", padding: "1rem", marginBottom: "1rem" }}>
                  <div style={{ fontSize: "0.75rem", color: T.textDim, textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: "0.75rem", fontFamily: "'DM Sans', sans-serif" }}>Add Item</div>
                  <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr 1fr auto", gap: "0.5rem", alignItems: "end" }}>
                    <div><label style={lbl}>Item Name</label><input style={inp} placeholder="e.g. Paint, Lumber" value={itemForm.name} onChange={itf("name")} /></div>
                    <div><label style={lbl}>Qty</label><input style={inp} type="number" min="1" value={itemForm.qty} onChange={itf("qty")} /></div>
                    <div><label style={lbl}>Unit Price ($)</label><input style={inp} type="number" placeholder="0.00" value={itemForm.price} onChange={itf("price")} /></div>
                    <button style={{ ...btn(), alignSelf: "flex-end", whiteSpace: "nowrap" }} onClick={() => addItem(proj.id)}>Add</button>
                  </div>
                </div>
                <div style={{ display: "flex", gap: "0.75rem", alignItems: "center", flexWrap: "wrap" }}>
                  <div style={{ flex: 1, minWidth: 160 }}>
                    <div style={{ color: T.textDim, fontSize: "0.78rem", fontFamily: "'DM Sans', sans-serif" }}>Remaining: <strong style={{ color: T.text }}>{fmt(remaining)}</strong></div>
                    {proj.deadline && <div style={{ color: T.textDim, fontSize: "0.75rem", fontFamily: "'DM Sans', sans-serif" }}>Deadline: {proj.deadline}</div>}
                  </div>
                  <FundInput projId={proj.id} onAdd={addFunds} />
                  <button onClick={() => delProject(proj.id)} style={btn("danger")}>Delete</button>
                </div>
              </div>
            )}
          </div>
        );
      })}

      {newProj && (
        <Modal title="New Project" onClose={() => setNewProj(false)}>
          <div style={row}><div><label style={lbl}>Project Name</label><input style={inp} placeholder="e.g. Kitchen Remodel" value={projForm.label} onChange={pf("label")} /></div></div>
          <div style={{ ...row, gridTemplateColumns: "1fr 1fr" }}>
            <div><label style={lbl}>Store</label>
              <select style={sel} value={projForm.store} onChange={pf("store")}>{STORES.map(s => <option key={s}>{s}</option>)}</select>
            </div>
            <div><label style={lbl}>Already Saved ($)</label><input style={inp} type="number" placeholder="0.00" value={projForm.saved} onChange={pf("saved")} /></div>
          </div>
          <div style={row}><div><label style={lbl}>Target Date (optional)</label><input style={inp} type="date" value={projForm.deadline} onChange={pf("deadline")} /></div></div>
          <div style={{ display: "flex", gap: "0.75rem", justifyContent: "flex-end" }}>
            <button style={btn("ghost")} onClick={() => setNewProj(false)}>Cancel</button>
            <button style={btn()} onClick={addProject}>Create</button>
          </div>
        </Modal>
      )}
    </div>
  );
}

function FundInput({ projId, onAdd }) {
  const [amt, setAmt] = useState("");
  return (
    <div style={{ display: "flex", gap: "0.5rem" }}>
      <input style={{ ...inp, width: 100 }} type="number" placeholder="$" value={amt} onChange={e => setAmt(e.target.value)} />
      <button style={btn()} onClick={() => { onAdd(projId, amt); setAmt(""); }}>+ Fund</button>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════════════
// CALENDAR
// ══════════════════════════════════════════════════════════════════════════
function CalendarTab({ data }) {
  const [month, setMonth] = useState(new Date().getMonth());
  const [year, setYear] = useState(new Date().getFullYear());

  const MONTHS = ["January","February","March","April","May","June","July","August","September","October","November","December"];
  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const todayDate = new Date().getDate();
  const todayMonth = new Date().getMonth();
  const todayYear = new Date().getFullYear();

  const billsOnDay = (day) => data.bills.filter(b => b.dueDay === day);
  const cells = [];
  for (let i = 0; i < firstDay; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(d);
  while (cells.length % 7 !== 0) cells.push(null);

  const totalDue = data.bills.filter(b => {
    const d = new Date(year, month, b.dueDay);
    return d.getMonth() === month;
  }).reduce((s, b) => s + b.amount, 0);

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.5rem" }}>
        <div>
          <h2 style={{ fontFamily: "'Lora', serif", color: T.text, margin: 0, fontSize: "1.75rem" }}>Bill Calendar</h2>
          <p style={{ color: T.textDim, margin: "0.3rem 0 0", fontSize: "0.88rem", fontFamily: "'DM Sans', sans-serif" }}>{fmt(totalDue)} in bills this month</p>
        </div>
        <div style={{ display: "flex", gap: "0.5rem", alignItems: "center" }}>
          <button style={btn("ghost")} onClick={() => { if (month === 0) { setMonth(11); setYear(y => y-1); } else setMonth(m => m-1); }}>{"<"}</button>
          <span style={{ color: T.text, fontFamily: "'Lora', serif", fontWeight: 600, minWidth: 150, textAlign: "center" }}>{MONTHS[month]} {year}</span>
          <button style={btn("ghost")} onClick={() => { if (month === 11) { setMonth(0); setYear(y => y+1); } else setMonth(m => m+1); }}>{">"}</button>
        </div>
      </div>

      <div style={{ background: T.bgCard, border: `1px solid ${T.border}`, borderRadius: "14px", padding: "1rem", overflow: "hidden" }}>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(7,1fr)", gap: "2px", marginBottom: "4px" }}>
          {["Sun","Mon","Tue","Wed","Thu","Fri","Sat"].map(d => (
            <div key={d} style={{ textAlign: "center", color: T.textDim, fontSize: "0.7rem", textTransform: "uppercase", padding: "0.4rem 0", fontFamily: "'DM Sans', sans-serif", letterSpacing: "0.06em" }}>{d}</div>
          ))}
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(7,1fr)", gap: "3px" }}>
          {cells.map((d, i) => {
            const isToday = d === todayDate && month === todayMonth && year === todayYear;
            const bills = d ? billsOnDay(d) : [];
            return (
              <div key={i} style={{ minHeight: 64, background: d ? (isToday ? T.bgHover : T.bgInput) : "transparent", borderRadius: 8, padding: "0.35rem", border: isToday ? `1px solid ${T.accent}` : `1px solid transparent` }}>
                {d && <>
                  <div style={{ color: isToday ? T.accent : T.textMid, fontSize: "0.78rem", fontWeight: isToday ? 700 : 400, marginBottom: "0.2rem", fontFamily: "'DM Sans', sans-serif" }}>{d}</div>
                  {bills.map(b => (
                    <div key={b.id} title={`${b.label}: ${fmt(b.amount)}`} style={{ background: b.paid ? T.greenDim : "#4a1f1a", color: b.paid ? T.green : "#e8a090", fontSize: "0.62rem", borderRadius: 4, padding: "1px 4px", marginBottom: "2px", overflow: "hidden", whiteSpace: "nowrap", textOverflow: "ellipsis", fontFamily: "'DM Sans', sans-serif" }}>
                      {b.label}
                    </div>
                  ))}
                </>}
              </div>
            );
          })}
        </div>
      </div>

      <div style={{ marginTop: "1.25rem", background: T.bgCard, border: `1px solid ${T.border}`, borderRadius: "14px", padding: "1.25rem" }}>
        <h3 style={{ color: T.text, fontSize: "0.9rem", margin: "0 0 0.75rem", fontFamily: "'DM Sans', sans-serif" }}>All Bills This Month</h3>
        {[...data.bills].sort((a, b) => a.dueDay - b.dueDay).map(b => (
          <div key={b.id} style={{ display: "flex", justifyContent: "space-between", padding: "0.5rem 0", borderBottom: `1px solid ${T.bgInput}`, alignItems: "center" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
              <span style={{ color: T.textDim, fontSize: "0.78rem", minWidth: 50, fontFamily: "'DM Sans', sans-serif" }}>Day {b.dueDay}</span>
              <span style={{ color: b.paid ? T.textDim : T.text, textDecoration: b.paid ? "line-through" : "none", fontSize: "0.9rem", fontFamily: "'DM Sans', sans-serif" }}>{b.label}</span>
              {b.autopay && <span style={{ background: T.bgHover, color: T.sage, fontSize: "0.68rem", padding: "1px 6px", borderRadius: 4, fontFamily: "'DM Sans', sans-serif" }}>AUTO</span>}
            </div>
            <span style={{ color: b.paid ? T.green : T.red, fontWeight: 600, fontFamily: "'Lora', serif" }}>{fmt(b.amount)}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════════════
// SETTINGS
// ══════════════════════════════════════════════════════════════════════════
function SettingsTab({ data, setData }) {
  const exportData = () => {
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a"); a.href = url; a.download = "family-finance-backup.json"; a.click();
    URL.revokeObjectURL(url);
  };
  const importData = (e) => {
    const file = e.target.files[0]; if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => { try { const d = JSON.parse(ev.target.result); setData(d); save(d); alert("Imported!"); } catch { alert("Invalid file."); } };
    reader.readAsText(file);
  };
  const clearAll = () => {
    if (window.confirm("This will erase ALL your data. Are you sure?")) { setData(SEED); save(SEED); }
  };

  const totalSaved = data.savings.reduce((s, g) => s + g.saved, 0);

  return (
    <div>
      <h2 style={{ fontFamily: "'Lora', serif", color: T.text, margin: "0 0 1.5rem", fontSize: "1.75rem" }}>Settings & Export</h2>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(170px,1fr))", gap: "0.9rem", marginBottom: "2rem" }}>
        <StatCard label="Income Sources" value={data.incomes.length} color={T.green} icon="🌿" />
        <StatCard label="Recurring Bills" value={data.bills.length} color={T.red} icon="🍂" />
        <StatCard label="Budget Categories" value={data.budgets.length} color={T.gold} icon="🌾" />
        <StatCard label="Savings Goals" value={data.savings.length} color={T.teal} icon="🎯" />
        <StatCard label="Projects" value={data.projects.length} color={T.accent} icon="🔨" />
        <StatCard label="Total Saved" value={fmt(totalSaved)} color={T.sage} icon="🏦" />
      </div>

      <div style={{ display: "grid", gap: "1rem" }}>
        <div style={{ background: T.bgCard, border: `1px solid ${T.border}`, borderRadius: "14px", padding: "1.5rem" }}>
          <h3 style={{ color: T.text, margin: "0 0 0.5rem", fontSize: "1rem", fontFamily: "'DM Sans', sans-serif" }}>Data Backup</h3>
          <p style={{ color: T.textDim, fontSize: "0.85rem", margin: "0 0 1rem", fontFamily: "'DM Sans', sans-serif" }}>Data saves automatically to this browser. Export a backup to restore on another device.</p>
          <div style={{ display: "flex", gap: "0.75rem", flexWrap: "wrap" }}>
            <button style={btn()} onClick={exportData}>Export JSON Backup</button>
            <label style={{ ...btn("ghost"), cursor: "pointer" }}>
              Import JSON <input type="file" accept=".json" style={{ display: "none" }} onChange={importData} />
            </label>
          </div>
        </div>

        <div style={{ background: T.bgCard, border: `1px solid ${T.border}`, borderRadius: "14px", padding: "1.5rem" }}>
          <h3 style={{ color: T.text, margin: "0 0 0.75rem", fontSize: "1rem", fontFamily: "'DM Sans', sans-serif" }}>GitHub Repo</h3>
          <p style={{ color: T.textDim, fontSize: "0.85rem", margin: "0 0 0.5rem", fontFamily: "'DM Sans', sans-serif" }}>
            Your app is live at: <a href="https://audreygriffittsmyers-byte.github.io/family-finance-hub" target="_blank" rel="noreferrer" style={{ color: T.accent }}>audreygriffittsmyers-byte.github.io/family-finance-hub</a>
          </p>
          <p style={{ color: T.textDim, fontSize: "0.85rem", margin: 0, fontFamily: "'DM Sans', sans-serif" }}>
            Source: <a href="https://github.com/audreygriffittsmyers-byte/family-finance-hub" target="_blank" rel="noreferrer" style={{ color: T.accent }}>github.com/audreygriffittsmyers-byte/family-finance-hub</a>
          </p>
        </div>

        <div style={{ background: T.bgCard, border: `1px solid ${T.red}33`, borderRadius: "14px", padding: "1.5rem" }}>
          <h3 style={{ color: T.red, margin: "0 0 0.5rem", fontSize: "1rem", fontFamily: "'DM Sans', sans-serif" }}>Danger Zone</h3>
          <p style={{ color: T.textDim, fontSize: "0.85rem", margin: "0 0 1rem", fontFamily: "'DM Sans', sans-serif" }}>Permanently erases all data and resets to sample data.</p>
          <button style={btn("danger")} onClick={clearAll}>Reset All Data</button>
        </div>
      </div>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════════════
// APP SHELL
// ══════════════════════════════════════════════════════════════════════════
const TABS = [
  { id: "dashboard", label: "Dashboard",  icon: "🏡" },
  { id: "income",    label: "Income",     icon: "🌿" },
  { id: "bills",     label: "Bills",      icon: "🍂" },
  { id: "budget",    label: "Budget",     icon: "🌾" },
  { id: "savings",   label: "Savings",    icon: "🎯" },
  { id: "projects",  label: "Projects",   icon: "🪵" },
  { id: "calendar",  label: "Calendar",   icon: "📅" },
  { id: "settings",  label: "Settings",   icon: "⚙️" },
];

export default function App() {
  const [data, setData] = useState(load);
  const [tab, setTab] = useState("dashboard");

  useEffect(() => { save(data); }, [data]);

  return (
    <div style={{ minHeight: "100vh", background: T.bg, color: T.text, fontFamily: "'DM Sans', sans-serif", display: "flex" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Lora:wght@600;700&family=DM+Sans:wght@400;500;600&display=swap');
        * { box-sizing: border-box; margin: 0; padding: 0; }
        ::-webkit-scrollbar { width: 5px; }
        ::-webkit-scrollbar-track { background: ${T.bgInput}; }
        ::-webkit-scrollbar-thumb { background: ${T.border}; border-radius: 3px; }
        input, select { transition: border-color 0.15s; }
        input:focus, select:focus { border-color: ${T.accent} !important; }
        input[type=number]::-webkit-inner-spin-button { opacity: 0.4; }
        @keyframes fadeUp { from { opacity:0; transform:translateY(10px); } to { opacity:1; transform:translateY(0); } }
        .tab-content { animation: fadeUp 0.22s ease; }
        a { text-decoration: none; }
        a:hover { text-decoration: underline; }
      `}</style>

      {/* Sidebar */}
      <aside style={{ width: 215, background: T.bgCard, borderRight: `1px solid ${T.border}`, padding: "1.5rem 0", flexShrink: 0, position: "sticky", top: 0, height: "100vh", overflowY: "auto", display: "flex", flexDirection: "column" }}>
        <div style={{ padding: "0 1.25rem 1.5rem", borderBottom: `1px solid ${T.border}` }}>
          <div style={{ fontFamily: "'Lora', serif", fontSize: "1.1rem", color: T.accent, fontWeight: 700, letterSpacing: "-0.01em" }}>Family Finance</div>
          <div style={{ color: T.textDim, fontSize: "0.7rem", marginTop: "0.2rem", fontFamily: "'DM Sans', sans-serif", letterSpacing: "0.04em" }}>Home Budget Hub</div>
        </div>
        <nav style={{ flex: 1, padding: "1rem 0.7rem" }}>
          {TABS.map(t => (
            <button key={t.id} onClick={() => setTab(t.id)} style={{ display: "flex", alignItems: "center", gap: "0.65rem", width: "100%", padding: "0.6rem 0.75rem", borderRadius: 8, border: "none", background: tab === t.id ? T.bgHover : "transparent", color: tab === t.id ? T.text : T.textDim, cursor: "pointer", fontSize: "0.875rem", fontFamily: "'DM Sans', sans-serif", fontWeight: tab === t.id ? 600 : 400, marginBottom: "2px", textAlign: "left", transition: "all 0.14s", borderLeft: tab === t.id ? `2px solid ${T.accent}` : "2px solid transparent" }}>
              <span style={{ fontSize: "1rem" }}>{t.icon}</span>
              <span>{t.label}</span>
            </button>
          ))}
        </nav>
        <div style={{ padding: "1rem 1.25rem", borderTop: `1px solid ${T.border}` }}>
          <div style={{ color: T.textDim, fontSize: "0.7rem", fontFamily: "'DM Sans', sans-serif", lineHeight: 1.6 }}>
            <div>🔒 Stored locally</div>
            <div>Private to this device</div>
          </div>
        </div>
      </aside>

      {/* Main content */}
      <main style={{ flex: 1, padding: "2rem 2.25rem", overflowY: "auto", maxWidth: 980 }}>
        <div className="tab-content" key={tab}>
          {tab === "dashboard" && <Dashboard data={data} />}
          {tab === "income"    && <IncomeTab data={data} setData={setData} />}
          {tab === "bills"     && <BillsTab data={data} setData={setData} />}
          {tab === "budget"    && <BudgetTab data={data} setData={setData} />}
          {tab === "savings"   && <SavingsTab data={data} setData={setData} />}
          {tab === "projects"  && <ProjectsTab data={data} setData={setData} />}
          {tab === "calendar"  && <CalendarTab data={data} />}
          {tab === "settings"  && <SettingsTab data={data} setData={setData} />}
        </div>
      </main>
    </div>
  );
}
