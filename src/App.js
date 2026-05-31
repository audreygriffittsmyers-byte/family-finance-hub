
import { useState, useEffect, useCallback } from "react";
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, LineChart, Line } from "recharts";

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
const COLORS = ["#e8c547","#5ccfb0","#f07060","#6eb5ff","#c47af5","#ff9f43","#48dbfb","#ff6b9d","#a8e063","#fd9644","#778ca3"];

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
    { id: uid(), label: "Emergency Fund", target: 15000, saved: 4200, color: "#e8c547", deadline: "" },
    { id: uid(), label: "Vacation", target: 3000, saved: 800, color: "#5ccfb0", deadline: "2026-07-01" },
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
const load = () => { try { return JSON.parse(localStorage.getItem("ffh_v2")) || SEED; } catch { return SEED; } };
const save = (data) => localStorage.setItem("ffh_v2", JSON.stringify(data));

// ─── Modal ─────────────────────────────────────────────────────────────────
function Modal({ title, onClose, children }) {
  return (
    <div style={{ position:"fixed",inset:0,background:"rgba(10,12,18,0.82)",zIndex:1000,display:"flex",alignItems:"center",justifyContent:"center",padding:"1rem" }}
      onClick={e => e.target === e.currentTarget && onClose()}>
      <div style={{ background:"#151820",border:"1px solid #2a2f3d",borderRadius:"16px",padding:"2rem",width:"100%",maxWidth:"520px",maxHeight:"90vh",overflowY:"auto",boxShadow:"0 24px 80px rgba(0,0,0,0.6)" }}>
        <div style={{ display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:"1.5rem" }}>
          <h3 style={{ margin:0,color:"#f0f2f7",fontFamily:"'Playfair Display',serif",fontSize:"1.25rem" }}>{title}</h3>
          <button onClick={onClose} style={{ background:"none",border:"none",color:"#6b7494",cursor:"pointer",fontSize:"1.4rem",lineHeight:1 }}>×</button>
        </div>
        {children}
      </div>
    </div>
  );
}

// ─── Input helpers ─────────────────────────────────────────────────────────
const inp = { background:"#1e2230",border:"1px solid #2a2f3d",borderRadius:"8px",color:"#f0f2f7",padding:"0.6rem 0.9rem",fontSize:"0.9rem",width:"100%",boxSizing:"border-box",outline:"none",fontFamily:"'DM Sans',sans-serif" };
const sel = { ...inp };
const label = { display:"block",color:"#8b93b0",fontSize:"0.78rem",marginBottom:"0.3rem",textTransform:"uppercase",letterSpacing:"0.06em" };
const row = { display:"grid",gap:"0.8rem",marginBottom:"0.9rem" };
const btn = (variant="primary") => ({
  padding:"0.65rem 1.4rem",borderRadius:"8px",border:"none",cursor:"pointer",fontFamily:"'DM Sans',sans-serif",fontWeight:600,fontSize:"0.88rem",
  ...(variant==="primary" ? { background:"#e8c547",color:"#0d0f16" } : variant==="danger" ? { background:"#f07060",color:"#fff" } : { background:"#2a2f3d",color:"#c0c8e8" })
});

// ─── Progress Bar ──────────────────────────────────────────────────────────
function ProgressBar({ value, max, color = "#e8c547", height = 8 }) {
  const pct = Math.min(100, (value / max) * 100) || 0;
  return (
    <div style={{ background:"#1e2230",borderRadius:99,height,overflow:"hidden" }}>
      <div style={{ width:`${pct}%`,height:"100%",background:color,borderRadius:99,transition:"width 0.5s ease" }} />
    </div>
  );
}

// ─── Stat Card ─────────────────────────────────────────────────────────────
function StatCard({ label: lbl, value, sub, color = "#e8c547", icon }) {
  return (
    <div style={{ background:"#151820",border:"1px solid #2a2f3d",borderRadius:"14px",padding:"1.25rem 1.4rem" }}>
      <div style={{ display:"flex",justifyContent:"space-between",alignItems:"flex-start" }}>
        <div>
          <div style={{ color:"#6b7494",fontSize:"0.75rem",textTransform:"uppercase",letterSpacing:"0.08em",marginBottom:"0.4rem" }}>{lbl}</div>
          <div style={{ color,fontSize:"1.65rem",fontFamily:"'Playfair Display',serif",fontWeight:700 }}>{value}</div>
          {sub && <div style={{ color:"#6b7494",fontSize:"0.78rem",marginTop:"0.25rem" }}>{sub}</div>}
        </div>
        {icon && <div style={{ fontSize:"1.6rem",opacity:0.6 }}>{icon}</div>}
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

  const billsByCategory = BILL_CATEGORIES.map(c => ({
    name: c, value: data.bills.filter(b => b.category === c).reduce((s, b) => s + b.amount, 0)
  })).filter(d => d.value > 0);

  const cashflowData = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"].map((m, i) => ({
    month: m,
    income: totalIncome,
    expenses: totalBills + totalBudget,
    net: net
  }));

  return (
    <div>
      <h2 style={{ fontFamily:"'Playfair Display',serif",color:"#f0f2f7",marginBottom:"0.25rem",fontSize:"1.6rem" }}>Family Overview</h2>
      <p style={{ color:"#6b7494",margin:"0 0 1.5rem",fontSize:"0.88rem" }}>Monthly snapshot for both partners</p>

      <div style={{ display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(200px,1fr))",gap:"1rem",marginBottom:"1.5rem" }}>
        <StatCard label="Monthly Income" value={fmt(totalIncome)} icon="💰" color="#5ccfb0" sub={`${data.incomes.length} sources`} />
        <StatCard label="Bills" value={fmt(totalBills)} icon="📋" color="#f07060" sub={`${data.bills.length} recurring`} />
        <StatCard label="Budget Spending" value={fmt(totalBudget)} icon="🛒" color="#6eb5ff" sub={`${fmt(totalSpent)} spent so far`} />
        <StatCard label="Net Cash Flow" value={fmt(net)} icon="📈" color={net >= 0 ? "#5ccfb0" : "#f07060"} sub={net >= 0 ? "You're in the green!" : "Over budget"} />
      </div>

      <div style={{ display:"grid",gridTemplateColumns:"1fr 1fr",gap:"1rem",marginBottom:"1.5rem" }}>
        <div style={{ background:"#151820",border:"1px solid #2a2f3d",borderRadius:"14px",padding:"1.25rem" }}>
          <h3 style={{ margin:"0 0 1rem",color:"#c0c8e8",fontSize:"0.95rem",fontWeight:600 }}>Bills by Category</h3>
          <ResponsiveContainer width="100%" height={180}>
            <PieChart>
              <Pie data={billsByCategory} cx="50%" cy="50%" innerRadius={45} outerRadius={75} dataKey="value" paddingAngle={3}>
                {billsByCategory.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
              </Pie>
              <Tooltip formatter={(v) => fmt(v)} contentStyle={{ background:"#1e2230",border:"1px solid #2a2f3d",borderRadius:8,fontSize:"0.82rem" }} />
            </PieChart>
          </ResponsiveContainer>
          <div style={{ display:"flex",flexWrap:"wrap",gap:"0.4rem",marginTop:"0.5rem" }}>
            {billsByCategory.map((d, i) => (
              <span key={d.name} style={{ fontSize:"0.72rem",color:"#8b93b0",display:"flex",alignItems:"center",gap:"0.3rem" }}>
                <span style={{ width:8,height:8,borderRadius:"50%",background:COLORS[i%COLORS.length],display:"inline-block" }} />{d.name}
              </span>
            ))}
          </div>
        </div>

        <div style={{ background:"#151820",border:"1px solid #2a2f3d",borderRadius:"14px",padding:"1.25rem" }}>
          <h3 style={{ margin:"0 0 1rem",color:"#c0c8e8",fontSize:"0.95rem",fontWeight:600 }}>Monthly Cash Flow</h3>
          <ResponsiveContainer width="100%" height={180}>
            <BarChart data={cashflowData.slice(0,6)} barSize={14}>
              <XAxis dataKey="month" tick={{ fill:"#6b7494",fontSize:11 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill:"#6b7494",fontSize:10 }} axisLine={false} tickLine={false} tickFormatter={fmtShort} />
              <Tooltip formatter={(v) => fmt(v)} contentStyle={{ background:"#1e2230",border:"1px solid #2a2f3d",borderRadius:8,fontSize:"0.82rem" }} />
              <Bar dataKey="income" fill="#5ccfb0" radius={[4,4,0,0]} name="Income" />
              <Bar dataKey="expenses" fill="#f07060" radius={[4,4,0,0]} name="Expenses" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div style={{ display:"grid",gridTemplateColumns:"1fr 1fr",gap:"1rem" }}>
        <div style={{ background:"#151820",border:"1px solid #2a2f3d",borderRadius:"14px",padding:"1.25rem" }}>
          <h3 style={{ margin:"0 0 1rem",color:"#c0c8e8",fontSize:"0.95rem",fontWeight:600 }}>Bills Due Soon</h3>
          {upcomingBills.length === 0
            ? <p style={{ color:"#6b7494",fontSize:"0.85rem" }}>No bills due in the next 14 days.</p>
            : upcomingBills.map(b => (
              <div key={b.id} style={{ display:"flex",justifyContent:"space-between",alignItems:"center",padding:"0.5rem 0",borderBottom:"1px solid #1e2230" }}>
                <div>
                  <div style={{ color:"#f0f2f7",fontSize:"0.88rem" }}>{b.label}</div>
                  <div style={{ color: b.days <= 3 ? "#f07060" : "#6b7494",fontSize:"0.75rem" }}>
                    {b.days === 0 ? "Due today!" : b.days === 1 ? "Tomorrow" : `In ${b.days} days`}
                  </div>
                </div>
                <span style={{ color:"#e8c547",fontWeight:700,fontSize:"0.95rem" }}>{fmt(b.amount)}</span>
              </div>
            ))
          }
        </div>

        <div style={{ background:"#151820",border:"1px solid #2a2f3d",borderRadius:"14px",padding:"1.25rem" }}>
          <h3 style={{ margin:"0 0 1rem",color:"#c0c8e8",fontSize:"0.95rem",fontWeight:600 }}>Savings Goals</h3>
          {data.savings.map(g => (
            <div key={g.id} style={{ marginBottom:"1rem" }}>
              <div style={{ display:"flex",justifyContent:"space-between",fontSize:"0.85rem",marginBottom:"0.35rem" }}>
                <span style={{ color:"#f0f2f7" }}>{g.label}</span>
                <span style={{ color:"#6b7494" }}>{fmt(g.saved)} / {fmt(g.target)}</span>
              </div>
              <ProgressBar value={g.saved} max={g.target} color={g.color} />
              <div style={{ color:"#6b7494",fontSize:"0.72rem",marginTop:"0.25rem",textAlign:"right" }}>
                {Math.round((g.saved/g.target)*100)}% saved
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
  const [form, setForm] = useState({ person:"Partner 1", label:"", amount:"", frequency:"monthly", next:today() });
  const f = (k) => (e) => setForm(p => ({ ...p, [k]: e.target.value }));

  const add = () => {
    if (!form.label || !form.amount) return;
    setData(d => { const n = { ...d, incomes: [...d.incomes, { ...form, id: uid(), amount: parseFloat(form.amount) }] }; save(n); return n; });
    setModal(false); setForm({ person:"Partner 1", label:"", amount:"", frequency:"monthly", next:today() });
  };
  const del = (id) => setData(d => { const n = { ...d, incomes: d.incomes.filter(i => i.id !== id) }; save(n); return n; });

  const monthly = (inc) => inc.frequency === "biweekly" ? inc.amount * 2.17 : inc.frequency === "weekly" ? inc.amount * 4.33 : inc.amount;
  const p1 = data.incomes.filter(i => i.person === "Partner 1");
  const p2 = data.incomes.filter(i => i.person === "Partner 2");
  const total = data.incomes.reduce((s, i) => s + monthly(i), 0);

  const PersonSection = ({ person, incomes }) => (
    <div style={{ marginBottom:"1.5rem" }}>
      <h3 style={{ color:"#8b93b0",fontSize:"0.8rem",textTransform:"uppercase",letterSpacing:"0.1em",marginBottom:"0.75rem" }}>{person}</h3>
      {incomes.length === 0 && <p style={{ color:"#6b7494",fontSize:"0.85rem" }}>No income added yet.</p>}
      {incomes.map(inc => (
        <div key={inc.id} style={{ background:"#1e2230",border:"1px solid #2a2f3d",borderRadius:"10px",padding:"1rem 1.2rem",marginBottom:"0.6rem",display:"flex",justifyContent:"space-between",alignItems:"center" }}>
          <div>
            <div style={{ color:"#f0f2f7",fontWeight:600,fontSize:"0.95rem" }}>{inc.label}</div>
            <div style={{ color:"#6b7494",fontSize:"0.78rem" }}>{inc.frequency} • next: {inc.next}</div>
          </div>
          <div style={{ textAlign:"right" }}>
            <div style={{ color:"#5ccfb0",fontWeight:700,fontSize:"1.05rem" }}>{fmt(inc.amount)}</div>
            <div style={{ color:"#6b7494",fontSize:"0.72rem" }}>{fmt(monthly(inc))}/mo equiv</div>
            <button onClick={() => del(inc.id)} style={{ ...btn("danger"), padding:"0.25rem 0.6rem",fontSize:"0.72rem",marginTop:"0.3rem" }}>Remove</button>
          </div>
        </div>
      ))}
    </div>
  );

  return (
    <div>
      <div style={{ display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:"1.5rem" }}>
        <div>
          <h2 style={{ fontFamily:"'Playfair Display',serif",color:"#f0f2f7",margin:0,fontSize:"1.6rem" }}>Income</h2>
          <p style={{ color:"#6b7494",margin:"0.25rem 0 0",fontSize:"0.88rem" }}>Total monthly: <strong style={{ color:"#5ccfb0" }}>{fmt(total)}</strong></p>
        </div>
        <button style={btn()} onClick={() => setModal(true)}>+ Add Income</button>
      </div>
      <PersonSection person="Partner 1" incomes={p1} />
      <PersonSection person="Partner 2" incomes={p2} />

      {modal && (
        <Modal title="Add Income Source" onClose={() => setModal(false)}>
          <div style={row}>
            <div><label style={label}>Person</label>
              <select style={sel} value={form.person} onChange={f("person")}>
                <option>Partner 1</option><option>Partner 2</option>
              </select>
            </div>
          </div>
          <div style={row}>
            <div><label style={label}>Label</label><input style={inp} placeholder="e.g. Salary, Freelance" value={form.label} onChange={f("label")} /></div>
          </div>
          <div style={{ ...row, gridTemplateColumns:"1fr 1fr" }}>
            <div><label style={label}>Amount ($)</label><input style={inp} type="number" placeholder="0.00" value={form.amount} onChange={f("amount")} /></div>
            <div><label style={label}>Frequency</label>
              <select style={sel} value={form.frequency} onChange={f("frequency")}>
                <option value="weekly">Weekly</option><option value="biweekly">Bi-weekly</option><option value="monthly">Monthly</option><option value="yearly">Yearly</option>
              </select>
            </div>
          </div>
          <div style={row}><div><label style={label}>Next Pay Date</label><input style={inp} type="date" value={form.next} onChange={f("next")} /></div></div>
          <div style={{ display:"flex",gap:"0.75rem",justifyContent:"flex-end" }}>
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
  const [form, setForm] = useState({ label:"", category:"Housing", amount:"", dueDay:"1", autopay:false, paid:false });
  const f = (k) => (e) => setForm(p => ({ ...p, [k]: e.target.type === "checkbox" ? e.target.checked : e.target.value }));

  const add = () => {
    if (!form.label || !form.amount) return;
    setData(d => { const n = { ...d, bills: [...d.bills, { ...form, id: uid(), amount: parseFloat(form.amount), dueDay: parseInt(form.dueDay) }] }; save(n); return n; });
    setModal(false); setForm({ label:"", category:"Housing", amount:"", dueDay:"1", autopay:false, paid:false });
  };
  const del = (id) => setData(d => { const n = { ...d, bills: d.bills.filter(b => b.id !== id) }; save(n); return n; });
  const togglePaid = (id) => setData(d => { const n = { ...d, bills: d.bills.map(b => b.id === id ? { ...b, paid: !b.paid } : b) }; save(n); return n; });

  const total = data.bills.reduce((s, b) => s + b.amount, 0);
  const byCategory = BILL_CATEGORIES.map(c => ({ c, bills: data.bills.filter(b => b.category === c) })).filter(x => x.bills.length > 0);

  return (
    <div>
      <div style={{ display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:"1.5rem" }}>
        <div>
          <h2 style={{ fontFamily:"'Playfair Display',serif",color:"#f0f2f7",margin:0,fontSize:"1.6rem" }}>Bills Tracker</h2>
          <p style={{ color:"#6b7494",margin:"0.25rem 0 0",fontSize:"0.88rem" }}>Monthly total: <strong style={{ color:"#f07060" }}>{fmt(total)}</strong></p>
        </div>
        <button style={btn()} onClick={() => setModal(true)}>+ Add Bill</button>
      </div>

      {byCategory.map(({ c, bills }) => (
        <div key={c} style={{ marginBottom:"1.5rem" }}>
          <div style={{ color:"#8b93b0",fontSize:"0.78rem",textTransform:"uppercase",letterSpacing:"0.1em",marginBottom:"0.6rem",display:"flex",justifyContent:"space-between" }}>
            <span>{c}</span>
            <span>{fmt(bills.reduce((s,b) => s+b.amount, 0))}</span>
          </div>
          {bills.map(b => {
            const days = daysUntil(`${new Date().getFullYear()}-${String(new Date().getMonth()+1).padStart(2,"0")}-${String(b.dueDay).padStart(2,"0")}`);
            const urgent = days >= 0 && days <= 5;
            return (
              <div key={b.id} style={{ background: b.paid ? "#1a2220" : "#1e2230", border:`1px solid ${urgent && !b.paid ? "#f07060" : "#2a2f3d"}`, borderRadius:"10px", padding:"0.85rem 1.1rem", marginBottom:"0.5rem", display:"flex", justifyContent:"space-between", alignItems:"center", opacity: b.paid ? 0.65 : 1 }}>
                <div style={{ display:"flex",alignItems:"center",gap:"0.8rem" }}>
                  <input type="checkbox" checked={b.paid} onChange={() => togglePaid(b.id)} style={{ accentColor:"#5ccfb0",width:16,height:16,cursor:"pointer" }} />
                  <div>
                    <div style={{ color: b.paid ? "#6b7494" : "#f0f2f7", fontWeight:600, fontSize:"0.92rem", textDecoration: b.paid ? "line-through" : "none" }}>{b.label}</div>
                    <div style={{ color:"#6b7494",fontSize:"0.75rem" }}>
                      Due day {b.dueDay} {b.autopay ? "• autopay" : "• manual"}
                      {!b.paid && days >= 0 && days <= 14 && <span style={{ color: urgent ? "#f07060" : "#e8c547", marginLeft:"0.4rem" }}>({days === 0 ? "today!" : `${days}d`})</span>}
                    </div>
                  </div>
                </div>
                <div style={{ display:"flex",alignItems:"center",gap:"0.8rem" }}>
                  <span style={{ color:"#f07060",fontWeight:700,fontSize:"1rem" }}>{fmt(b.amount)}</span>
                  <button onClick={() => del(b.id)} style={{ background:"none",border:"none",color:"#6b7494",cursor:"pointer",fontSize:"1.1rem" }}>🗑</button>
                </div>
              </div>
            );
          })}
        </div>
      ))}

      {modal && (
        <Modal title="Add Bill" onClose={() => setModal(false)}>
          <div style={row}><div><label style={label}>Bill Name</label><input style={inp} placeholder="e.g. Electric, Car Payment" value={form.label} onChange={f("label")} /></div></div>
          <div style={{ ...row, gridTemplateColumns:"1fr 1fr" }}>
            <div><label style={label}>Category</label>
              <select style={sel} value={form.category} onChange={f("category")}>{BILL_CATEGORIES.map(c => <option key={c}>{c}</option>)}</select>
            </div>
            <div><label style={label}>Amount ($)</label><input style={inp} type="number" placeholder="0.00" value={form.amount} onChange={f("amount")} /></div>
          </div>
          <div style={{ ...row, gridTemplateColumns:"1fr 1fr" }}>
            <div><label style={label}>Due Day of Month</label><input style={inp} type="number" min={1} max={31} value={form.dueDay} onChange={f("dueDay")} /></div>
            <div style={{ display:"flex",flexDirection:"column",justifyContent:"flex-end" }}>
              <label style={{ ...label, display:"flex",alignItems:"center",gap:"0.5rem",cursor:"pointer",textTransform:"none",letterSpacing:"normal",fontSize:"0.85rem" }}>
                <input type="checkbox" checked={form.autopay} onChange={f("autopay")} style={{ accentColor:"#5ccfb0",width:16,height:16 }} />Autopay
              </label>
            </div>
          </div>
          <div style={{ display:"flex",gap:"0.75rem",justifyContent:"flex-end" }}>
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
  const [form, setForm] = useState({ category:"Groceries", budgeted:"" });
  const [spendAmt, setSpendAmt] = useState("");
  const f = (k) => (e) => setForm(p => ({ ...p, [k]: e.target.value }));

  const add = () => {
    if (!form.budgeted) return;
    const exists = data.budgets.find(b => b.category === form.category);
    if (exists) {
      setData(d => { const n = { ...d, budgets: d.budgets.map(b => b.category === form.category ? { ...b, budgeted: parseFloat(form.budgeted) } : b) }; save(n); return n; });
    } else {
      setData(d => { const n = { ...d, budgets: [...d.budgets, { id:uid(), category:form.category, budgeted:parseFloat(form.budgeted), spent:0 }] }; save(n); return n; });
    }
    setModal(false);
  };
  const addSpend = (id) => {
    if (!spendAmt) return;
    setData(d => { const n = { ...d, budgets: d.budgets.map(b => b.id === id ? { ...b, spent: b.spent + parseFloat(spendAmt) } : b) }; save(n); return n; });
    setSpendModal(null); setSpendAmt("");
  };
  const del = (id) => setData(d => { const n = { ...d, budgets: d.budgets.filter(b => b.id !== id) }; save(n); return n; });
  const reset = () => setData(d => { const n = { ...d, budgets: d.budgets.map(b => ({ ...b, spent:0 })) }; save(n); return n; });

  const totalBudgeted = data.budgets.reduce((s, b) => s + b.budgeted, 0);
  const totalSpent = data.budgets.reduce((s, b) => s + b.spent, 0);

  const barData = data.budgets.map(b => ({ name: b.category.slice(0,8), budgeted: b.budgeted, spent: b.spent }));

  return (
    <div>
      <div style={{ display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:"1rem" }}>
        <div>
          <h2 style={{ fontFamily:"'Playfair Display',serif",color:"#f0f2f7",margin:0,fontSize:"1.6rem" }}>Budget Planner</h2>
          <p style={{ color:"#6b7494",margin:"0.25rem 0 0",fontSize:"0.88rem" }}>Spent {fmt(totalSpent)} of {fmt(totalBudgeted)} budgeted</p>
        </div>
        <div style={{ display:"flex",gap:"0.6rem" }}>
          <button style={btn("ghost")} onClick={reset}>Reset Month</button>
          <button style={btn()} onClick={() => setModal(true)}>+ Add Category</button>
        </div>
      </div>

      <div style={{ background:"#151820",border:"1px solid #2a2f3d",borderRadius:"14px",padding:"1.25rem",marginBottom:"1.25rem" }}>
        <ResponsiveContainer width="100%" height={180}>
          <BarChart data={barData} barSize={14}>
            <XAxis dataKey="name" tick={{ fill:"#6b7494",fontSize:11 }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fill:"#6b7494",fontSize:10 }} axisLine={false} tickLine={false} tickFormatter={fmtShort} />
            <Tooltip formatter={(v) => fmt(v)} contentStyle={{ background:"#1e2230",border:"1px solid #2a2f3d",borderRadius:8,fontSize:"0.82rem" }} />
            <Bar dataKey="budgeted" fill="#2a3550" radius={[4,4,0,0]} name="Budgeted" />
            <Bar dataKey="spent" fill="#6eb5ff" radius={[4,4,0,0]} name="Spent" />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {data.budgets.map(b => {
        const pct = Math.min(100, (b.spent / b.budgeted) * 100) || 0;
        const over = b.spent > b.budgeted;
        return (
          <div key={b.id} style={{ background:"#1e2230",border:`1px solid ${over ? "#f07060" : "#2a2f3d"}`,borderRadius:"12px",padding:"1rem 1.2rem",marginBottom:"0.75rem" }}>
            <div style={{ display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:"0.5rem" }}>
              <span style={{ color:"#f0f2f7",fontWeight:600,fontSize:"0.95rem" }}>{b.category}</span>
              <div style={{ display:"flex",gap:"0.6rem",alignItems:"center" }}>
                <span style={{ color: over ? "#f07060" : "#6b7494",fontSize:"0.82rem" }}>{fmt(b.spent)} / {fmt(b.budgeted)}</span>
                <button onClick={() => { setSpendModal(b.id); setSpendAmt(""); }} style={{ ...btn(), padding:"0.2rem 0.6rem",fontSize:"0.75rem" }}>+ Spend</button>
                <button onClick={() => del(b.id)} style={{ background:"none",border:"none",color:"#6b7494",cursor:"pointer" }}>🗑</button>
              </div>
            </div>
            <ProgressBar value={b.spent} max={b.budgeted} color={over ? "#f07060" : pct > 80 ? "#e8c547" : "#6eb5ff"} />
            <div style={{ color: over ? "#f07060" : "#6b7494",fontSize:"0.72rem",marginTop:"0.25rem",textAlign:"right" }}>
              {over ? `${fmt(b.spent - b.budgeted)} over budget` : `${fmt(b.budgeted - b.spent)} remaining`}
            </div>
          </div>
        );
      })}

      {spendModal && (
        <Modal title="Log Spending" onClose={() => setSpendModal(null)}>
          <div style={row}><div><label style={label}>Amount Spent ($)</label><input style={inp} type="number" placeholder="0.00" value={spendAmt} onChange={e => setSpendAmt(e.target.value)} autoFocus /></div></div>
          <div style={{ display:"flex",gap:"0.75rem",justifyContent:"flex-end" }}>
            <button style={btn("ghost")} onClick={() => setSpendModal(null)}>Cancel</button>
            <button style={btn()} onClick={() => addSpend(spendModal)}>Log</button>
          </div>
        </Modal>
      )}

      {modal && (
        <Modal title="Add Budget Category" onClose={() => setModal(false)}>
          <div style={row}><div><label style={label}>Category</label>
            <select style={sel} value={form.category} onChange={f("category")}>{BUDGET_CATEGORIES.map(c => <option key={c}>{c}</option>)}</select>
          </div></div>
          <div style={row}><div><label style={label}>Monthly Budget ($)</label><input style={inp} type="number" placeholder="0.00" value={form.budgeted} onChange={f("budgeted")} /></div></div>
          <div style={{ display:"flex",gap:"0.75rem",justifyContent:"flex-end" }}>
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
  const [form, setForm] = useState({ label:"", target:"", saved:"0", color:COLORS[0], deadline:"" });
  const [depositAmt, setDepositAmt] = useState("");
  const f = (k) => (e) => setForm(p => ({ ...p, [k]: e.target.value }));

  const add = () => {
    if (!form.label || !form.target) return;
    setData(d => { const n = { ...d, savings: [...d.savings, { ...form, id:uid(), target:parseFloat(form.target), saved:parseFloat(form.saved)||0 }] }; save(n); return n; });
    setModal(false);
  };
  const deposit = (id) => {
    if (!depositAmt) return;
    setData(d => { const n = { ...d, savings: d.savings.map(g => g.id === id ? { ...g, saved: Math.min(g.target, g.saved + parseFloat(depositAmt)) } : g) }; save(n); return n; });
    setDepositModal(null); setDepositAmt("");
  };
  const del = (id) => setData(d => { const n = { ...d, savings: d.savings.filter(g => g.id !== id) }; save(n); return n; });

  const totalTarget = data.savings.reduce((s, g) => s + g.target, 0);
  const totalSaved = data.savings.reduce((s, g) => s + g.saved, 0);

  return (
    <div>
      <div style={{ display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:"1.5rem" }}>
        <div>
          <h2 style={{ fontFamily:"'Playfair Display',serif",color:"#f0f2f7",margin:0,fontSize:"1.6rem" }}>Savings Goals</h2>
          <p style={{ color:"#6b7494",margin:"0.25rem 0 0",fontSize:"0.88rem" }}>{fmt(totalSaved)} saved of {fmt(totalTarget)} total goals</p>
        </div>
        <button style={btn()} onClick={() => setModal(true)}>+ New Goal</button>
      </div>

      <div style={{ display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(260px,1fr))",gap:"1rem" }}>
        {data.savings.map(g => {
          const pct = Math.round((g.saved / g.target) * 100) || 0;
          const remaining = g.target - g.saved;
          const daysLeft = g.deadline ? daysUntil(g.deadline) : null;
          const monthsLeft = daysLeft ? Math.ceil(daysLeft / 30) : null;
          const monthlyNeeded = monthsLeft && monthsLeft > 0 ? remaining / monthsLeft : null;
          return (
            <div key={g.id} style={{ background:"#151820",border:`1px solid ${g.color}33`,borderRadius:"16px",padding:"1.4rem",position:"relative",overflow:"hidden" }}>
              <div style={{ position:"absolute",top:0,right:0,width:80,height:80,background:g.color,opacity:0.06,borderRadius:"0 16px 0 80px" }} />
              <div style={{ display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:"1rem" }}>
                <div>
                  <div style={{ color:"#f0f2f7",fontWeight:700,fontSize:"1rem" }}>{g.label}</div>
                  {g.deadline && <div style={{ color:"#6b7494",fontSize:"0.75rem",marginTop:"0.2rem" }}>Deadline: {g.deadline}</div>}
                </div>
                <button onClick={() => del(g.id)} style={{ background:"none",border:"none",color:"#6b7494",cursor:"pointer",fontSize:"1.1rem" }}>🗑</button>
              </div>
              <div style={{ marginBottom:"0.8rem" }}>
                <ProgressBar value={g.saved} max={g.target} color={g.color} height={10} />
              </div>
              <div style={{ display:"flex",justifyContent:"space-between",marginBottom:"0.8rem" }}>
                <div>
                  <div style={{ color:g.color,fontFamily:"'Playfair Display',serif",fontSize:"1.3rem",fontWeight:700 }}>{fmt(g.saved)}</div>
                  <div style={{ color:"#6b7494",fontSize:"0.75rem" }}>of {fmt(g.target)}</div>
                </div>
                <div style={{ textAlign:"right" }}>
                  <div style={{ color:"#f0f2f7",fontSize:"1.1rem",fontWeight:700 }}>{pct}%</div>
                  {monthlyNeeded && <div style={{ color:"#6b7494",fontSize:"0.72rem" }}>{fmt(monthlyNeeded)}/mo needed</div>}
                </div>
              </div>
              {pct < 100
                ? <button onClick={() => { setDepositModal(g.id); setDepositAmt(""); }} style={{ ...btn(), width:"100%",textAlign:"center" }}>Add Funds</button>
                : <div style={{ textAlign:"center",color:"#5ccfb0",fontWeight:700,padding:"0.65rem" }}>Goal Reached!</div>
              }
            </div>
          );
        })}
      </div>

      {depositModal && (
        <Modal title="Add Funds" onClose={() => setDepositModal(null)}>
          <div style={row}><div><label style={label}>Amount ($)</label><input style={inp} type="number" placeholder="0.00" value={depositAmt} onChange={e => setDepositAmt(e.target.value)} autoFocus /></div></div>
          <div style={{ display:"flex",gap:"0.75rem",justifyContent:"flex-end" }}>
            <button style={btn("ghost")} onClick={() => setDepositModal(null)}>Cancel</button>
            <button style={btn()} onClick={() => deposit(depositModal)}>Add</button>
          </div>
        </Modal>
      )}

      {modal && (
        <Modal title="New Savings Goal" onClose={() => setModal(false)}>
          <div style={row}><div><label style={label}>Goal Name</label><input style={inp} placeholder="e.g. Vacation, Emergency Fund" value={form.label} onChange={f("label")} /></div></div>
          <div style={{ ...row, gridTemplateColumns:"1fr 1fr" }}>
            <div><label style={label}>Target ($)</label><input style={inp} type="number" placeholder="0.00" value={form.target} onChange={f("target")} /></div>
            <div><label style={label}>Already Saved ($)</label><input style={inp} type="number" placeholder="0.00" value={form.saved} onChange={f("saved")} /></div>
          </div>
          <div style={{ ...row, gridTemplateColumns:"1fr 1fr" }}>
            <div><label style={label}>Deadline (optional)</label><input style={inp} type="date" value={form.deadline} onChange={f("deadline")} /></div>
            <div><label style={label}>Color</label>
              <div style={{ display:"flex",gap:"0.4rem",flexWrap:"wrap",marginTop:"0.3rem" }}>
                {COLORS.map(c => (
                  <div key={c} onClick={() => setForm(p => ({ ...p, color:c }))} style={{ width:22,height:22,borderRadius:"50%",background:c,cursor:"pointer",border:form.color===c ? "3px solid #f0f2f7" : "3px solid transparent" }} />
                ))}
              </div>
            </div>
          </div>
          <div style={{ display:"flex",gap:"0.75rem",justifyContent:"flex-end" }}>
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
  const [projForm, setProjForm] = useState({ label:"", store:"Home Depot", saved:"0", deadline:"" });
  const [activeProj, setActiveProj] = useState(null);
  const [itemForm, setItemForm] = useState({ name:"", qty:"1", price:"" });
  const pf = (k) => (e) => setProjForm(p => ({ ...p, [k]: e.target.value }));
  const itf = (k) => (e) => setItemForm(p => ({ ...p, [k]: e.target.value }));

  const addProject = () => {
    if (!projForm.label) return;
    const id = uid();
    setData(d => { const n = { ...d, projects: [...d.projects, { ...projForm, id, saved:parseFloat(projForm.saved)||0, items:[] }] }; save(n); return n; });
    setNewProj(false); setProjForm({ label:"", store:"Home Depot", saved:"0", deadline:"" });
  };
  const delProject = (id) => setData(d => { const n = { ...d, projects: d.projects.filter(p => p.id !== id) }; save(n); return n; });
  const addItem = (projId) => {
    if (!itemForm.name || !itemForm.price) return;
    setData(d => {
      const n = { ...d, projects: d.projects.map(p => p.id === projId ? { ...p, items: [...p.items, { ...itemForm, id:uid(), qty:parseFloat(itemForm.qty), price:parseFloat(itemForm.price) }] } : p) };
      save(n); return n;
    });
    setItemForm({ name:"", qty:"1", price:"" });
  };
  const delItem = (projId, itemId) => setData(d => {
    const n = { ...d, projects: d.projects.map(p => p.id === projId ? { ...p, items: p.items.filter(i => i.id !== itemId) } : p) };
    save(n); return n;
  });
  const addFunds = (projId, amt) => setData(d => {
    const proj = d.projects.find(p => p.id === projId);
    const total = proj.items.reduce((s,i) => s + i.qty*i.price, 0);
    const n = { ...d, projects: d.projects.map(p => p.id === projId ? { ...p, saved: Math.min(total, p.saved + parseFloat(amt)) } : p) };
    save(n); return n;
  });

  const STORES = ["Home Depot","Walmart","Lowes","IKEA","Target","Amazon","Other"];

  return (
    <div>
      <div style={{ display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:"1.5rem" }}>
        <div>
          <h2 style={{ fontFamily:"'Playfair Display',serif",color:"#f0f2f7",margin:0,fontSize:"1.6rem" }}>Project Estimator</h2>
          <p style={{ color:"#6b7494",margin:"0.25rem 0 0",fontSize:"0.88rem" }}>Plan, estimate, and save for home projects</p>
        </div>
        <button style={btn()} onClick={() => setNewProj(true)}>+ New Project</button>
      </div>

      {data.projects.map(proj => {
        const total = proj.items.reduce((s, i) => s + i.qty * i.price, 0);
        const pct = total > 0 ? Math.min(100, (proj.saved / total) * 100) : 0;
        const remaining = total - proj.saved;
        const isOpen = activeProj === proj.id;
        return (
          <div key={proj.id} style={{ background:"#151820",border:"1px solid #2a2f3d",borderRadius:"16px",marginBottom:"1rem",overflow:"hidden" }}>
            <div style={{ padding:"1.25rem 1.4rem",cursor:"pointer",display:"flex",justifyContent:"space-between",alignItems:"center" }} onClick={() => setActiveProj(isOpen ? null : proj.id)}>
              <div>
                <div style={{ color:"#f0f2f7",fontWeight:700,fontSize:"1rem" }}>{proj.label}</div>
                <div style={{ color:"#6b7494",fontSize:"0.78rem" }}>{proj.store} • {proj.items.length} items • {fmt(total)} estimated</div>
              </div>
              <div style={{ display:"flex",alignItems:"center",gap:"0.8rem" }}>
                <div style={{ textAlign:"right" }}>
                  <div style={{ color:"#e8c547",fontWeight:700 }}>{fmt(proj.saved)} / {fmt(total)}</div>
                  <div style={{ color:"#6b7494",fontSize:"0.72rem" }}>{Math.round(pct)}% funded</div>
                </div>
                <span style={{ color:"#6b7494",fontSize:"1.2rem" }}>{isOpen ? "▲" : "▼"}</span>
              </div>
            </div>

            {total > 0 && <div style={{ padding:"0 1.4rem 0.5rem" }}><ProgressBar value={proj.saved} max={total} color="#e8c547" /></div>}

            {isOpen && (
              <div style={{ padding:"0 1.4rem 1.4rem",borderTop:"1px solid #2a2f3d" }}>
                <div style={{ paddingTop:"1rem",marginBottom:"1rem" }}>
                  {proj.items.map(item => (
                    <div key={item.id} style={{ display:"flex",justifyContent:"space-between",alignItems:"center",padding:"0.5rem 0",borderBottom:"1px solid #1e2230" }}>
                      <div style={{ color:"#f0f2f7",fontSize:"0.9rem" }}>{item.name}</div>
                      <div style={{ display:"flex",alignItems:"center",gap:"1rem" }}>
                        <span style={{ color:"#8b93b0",fontSize:"0.82rem" }}>x{item.qty}</span>
                        <span style={{ color:"#e8c547",fontWeight:600 }}>{fmt(item.qty * item.price)}</span>
                        <button onClick={() => delItem(proj.id, item.id)} style={{ background:"none",border:"none",color:"#6b7494",cursor:"pointer" }}>×</button>
                      </div>
                    </div>
                  ))}
                </div>

                <div style={{ background:"#1e2230",borderRadius:"10px",padding:"1rem",marginBottom:"1rem" }}>
                  <div style={{ fontSize:"0.78rem",color:"#8b93b0",textTransform:"uppercase",letterSpacing:"0.08em",marginBottom:"0.75rem" }}>Add Item</div>
                  <div style={{ display:"grid",gridTemplateColumns:"2fr 1fr 1fr auto",gap:"0.5rem",alignItems:"end" }}>
                    <div><label style={label}>Item Name</label><input style={inp} placeholder="e.g. Paint, Lumber" value={itemForm.name} onChange={itf("name")} /></div>
                    <div><label style={label}>Qty</label><input style={inp} type="number" min="1" value={itemForm.qty} onChange={itf("qty")} /></div>
                    <div><label style={label}>Unit Price ($)</label><input style={inp} type="number" placeholder="0.00" value={itemForm.price} onChange={itf("price")} /></div>
                    <button style={{ ...btn(), whiteSpace:"nowrap", alignSelf:"flex-end" }} onClick={() => addItem(proj.id)}>Add</button>
                  </div>
                </div>

                <div style={{ display:"flex",gap:"0.75rem",alignItems:"center",flexWrap:"wrap" }}>
                  <div style={{ flex:1,minWidth:160 }}>
                    <div style={{ color:"#6b7494",fontSize:"0.78rem",marginBottom:"0.25rem" }}>Remaining to fund: <strong style={{ color:"#f0f2f7" }}>{fmt(remaining)}</strong></div>
                    {proj.deadline && <div style={{ color:"#6b7494",fontSize:"0.75rem" }}>Deadline: {proj.deadline}</div>}
                  </div>
                  <FundInput projId={proj.id} onAdd={addFunds} />
                  <button onClick={() => delProject(proj.id)} style={btn("danger")}>Delete Project</button>
                </div>
              </div>
            )}
          </div>
        );
      })}

      {newProj && (
        <Modal title="New Project" onClose={() => setNewProj(false)}>
          <div style={row}><div><label style={label}>Project Name</label><input style={inp} placeholder="e.g. Kitchen Remodel" value={projForm.label} onChange={pf("label")} /></div></div>
          <div style={{ ...row, gridTemplateColumns:"1fr 1fr" }}>
            <div><label style={label}>Store</label>
              <select style={sel} value={projForm.store} onChange={pf("store")}>{STORES.map(s => <option key={s}>{s}</option>)}</select>
            </div>
            <div><label style={label}>Already Saved ($)</label><input style={inp} type="number" placeholder="0.00" value={projForm.saved} onChange={pf("saved")} /></div>
          </div>
          <div style={row}><div><label style={label}>Target Date (optional)</label><input style={inp} type="date" value={projForm.deadline} onChange={pf("deadline")} /></div></div>
          <div style={{ display:"flex",gap:"0.75rem",justifyContent:"flex-end" }}>
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
    <div style={{ display:"flex",gap:"0.5rem" }}>
      <input style={{ ...inp, width:100 }} type="number" placeholder="$" value={amt} onChange={e => setAmt(e.target.value)} />
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
      <div style={{ display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:"1.5rem" }}>
        <div>
          <h2 style={{ fontFamily:"'Playfair Display',serif",color:"#f0f2f7",margin:0,fontSize:"1.6rem" }}>Bill Calendar</h2>
          <p style={{ color:"#6b7494",margin:"0.25rem 0 0",fontSize:"0.88rem" }}>{fmt(totalDue)} in bills this month</p>
        </div>
        <div style={{ display:"flex",gap:"0.5rem",alignItems:"center" }}>
          <button style={btn("ghost")} onClick={() => { if (month === 0) { setMonth(11); setYear(y => y-1); } else setMonth(m => m-1); }}>{"<"}</button>
          <span style={{ color:"#f0f2f7",fontWeight:600,minWidth:140,textAlign:"center" }}>{MONTHS[month]} {year}</span>
          <button style={btn("ghost")} onClick={() => { if (month === 11) { setMonth(0); setYear(y => y+1); } else setMonth(m => m+1); }}>{">"}</button>
        </div>
      </div>

      <div style={{ background:"#151820",border:"1px solid #2a2f3d",borderRadius:"14px",padding:"1rem",overflow:"hidden" }}>
        <div style={{ display:"grid",gridTemplateColumns:"repeat(7,1fr)",gap:"2px",marginBottom:"4px" }}>
          {["Sun","Mon","Tue","Wed","Thu","Fri","Sat"].map(d => (
            <div key={d} style={{ textAlign:"center",color:"#6b7494",fontSize:"0.72rem",textTransform:"uppercase",padding:"0.4rem 0" }}>{d}</div>
          ))}
        </div>
        <div style={{ display:"grid",gridTemplateColumns:"repeat(7,1fr)",gap:"3px" }}>
          {cells.map((d, i) => {
            const isToday = d === todayDate && month === todayMonth && year === todayYear;
            const bills = d ? billsOnDay(d) : [];
            return (
              <div key={i} style={{ minHeight:64,background: d ? (isToday ? "#1e2d2a" : "#1e2230") : "transparent",borderRadius:8,padding:"0.35rem",border: isToday ? "1px solid #5ccfb0" : "1px solid transparent",position:"relative" }}>
                {d && <>
                  <div style={{ color: isToday ? "#5ccfb0" : "#8b93b0",fontSize:"0.78rem",fontWeight: isToday ? 700 : 400,marginBottom:"0.2rem" }}>{d}</div>
                  {bills.map(b => (
                    <div key={b.id} title={`${b.label}: ${fmt(b.amount)}`} style={{ background:b.paid?"#1a3028":"#3a1515",color:b.paid?"#5ccfb0":"#f07060",fontSize:"0.65rem",borderRadius:4,padding:"1px 4px",marginBottom:"2px",overflow:"hidden",whiteSpace:"nowrap",textOverflow:"ellipsis" }}>
                      {b.label}
                    </div>
                  ))}
                </>}
              </div>
            );
          })}
        </div>
      </div>

      <div style={{ marginTop:"1.25rem",background:"#151820",border:"1px solid #2a2f3d",borderRadius:"14px",padding:"1.25rem" }}>
        <h3 style={{ color:"#c0c8e8",fontSize:"0.9rem",margin:"0 0 0.75rem" }}>All Bills This Month</h3>
        {[...data.bills].sort((a,b) => a.dueDay - b.dueDay).map(b => (
          <div key={b.id} style={{ display:"flex",justifyContent:"space-between",padding:"0.5rem 0",borderBottom:"1px solid #1e2230",alignItems:"center" }}>
            <div style={{ display:"flex",alignItems:"center",gap:"0.75rem" }}>
              <span style={{ color:"#6b7494",fontSize:"0.78rem",minWidth:50 }}>Day {b.dueDay}</span>
              <span style={{ color: b.paid ? "#6b7494" : "#f0f2f7",textDecoration: b.paid ? "line-through" : "none",fontSize:"0.9rem" }}>{b.label}</span>
              {b.autopay && <span style={{ background:"#1e3040",color:"#6eb5ff",fontSize:"0.68rem",padding:"1px 6px",borderRadius:4 }}>AUTO</span>}
            </div>
            <span style={{ color: b.paid ? "#5ccfb0" : "#f07060",fontWeight:600 }}>{fmt(b.amount)}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════════════
// SETTINGS / EXPORT
// ══════════════════════════════════════════════════════════════════════════
function SettingsTab({ data, setData }) {
  const exportData = () => {
    const blob = new Blob([JSON.stringify(data, null, 2)], { type:"application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a"); a.href = url; a.download = "family-finance-backup.json"; a.click();
    URL.revokeObjectURL(url);
  };

  const importData = (e) => {
    const file = e.target.files[0]; if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => { try { const d = JSON.parse(ev.target.result); setData(d); save(d); alert("Data imported successfully!"); } catch { alert("Invalid file."); } };
    reader.readAsText(file);
  };

  const clearAll = () => {
    if (confirm("This will erase ALL your data. Are you sure?")) {
      setData(SEED); save(SEED);
    }
  };

  const totalIncome = data.incomes.reduce((s, i) => s + (i.frequency === "biweekly" ? i.amount * 2.17 : i.frequency === "weekly" ? i.amount * 4.33 : i.amount), 0);
  const totalBills = data.bills.reduce((s, b) => s + b.amount, 0);
  const totalBudget = data.budgets.reduce((s, b) => s + b.budgeted, 0);
  const totalSaved = data.savings.reduce((s, g) => s + g.saved, 0);

  return (
    <div>
      <h2 style={{ fontFamily:"'Playfair Display',serif",color:"#f0f2f7",margin:"0 0 1.5rem",fontSize:"1.6rem" }}>Settings & Export</h2>

      <div style={{ display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(200px,1fr))",gap:"1rem",marginBottom:"2rem" }}>
        <StatCard label="Income Sources" value={data.incomes.length} color="#5ccfb0" icon="💼" />
        <StatCard label="Recurring Bills" value={data.bills.length} color="#f07060" icon="📋" />
        <StatCard label="Budget Categories" value={data.budgets.length} color="#6eb5ff" icon="📊" />
        <StatCard label="Savings Goals" value={data.savings.length} color="#e8c547" icon="🎯" />
        <StatCard label="Projects" value={data.projects.length} color="#c47af5" icon="🔨" />
        <StatCard label="Total Saved" value={fmt(totalSaved)} color="#5ccfb0" icon="🏦" />
      </div>

      <div style={{ display:"grid",gap:"1rem" }}>
        <div style={{ background:"#151820",border:"1px solid #2a2f3d",borderRadius:"14px",padding:"1.5rem" }}>
          <h3 style={{ color:"#c0c8e8",margin:"0 0 0.75rem",fontSize:"1rem" }}>Data Backup</h3>
          <p style={{ color:"#6b7494",fontSize:"0.85rem",margin:"0 0 1rem" }}>Your data is saved automatically in this browser. Export a JSON backup to restore on another device.</p>
          <div style={{ display:"flex",gap:"0.75rem",flexWrap:"wrap" }}>
            <button style={btn()} onClick={exportData}>Export JSON Backup</button>
            <label style={{ ...btn("ghost"), cursor:"pointer" }}>
              Import JSON <input type="file" accept=".json" style={{ display:"none" }} onChange={importData} />
            </label>
          </div>
        </div>

        <div style={{ background:"#151820",border:"1px solid #2a2f3d",borderRadius:"14px",padding:"1.5rem" }}>
          <h3 style={{ color:"#c0c8e8",margin:"0 0 0.75rem",fontSize:"1rem" }}>GitHub Deployment Guide</h3>
          <div style={{ color:"#8b93b0",fontSize:"0.85rem",lineHeight:1.7 }}>
            <p style={{ margin:"0 0 0.5rem" }}>To host this app free on GitHub Pages:</p>
            <ol style={{ margin:0,paddingLeft:"1.2rem" }}>
              <li>Download the source code from Claude</li>
              <li>Create a new GitHub repo (public or private)</li>
              <li>Run: <code style={{ background:"#1e2230",padding:"1px 6px",borderRadius:4,color:"#e8c547" }}>npx create-react-app family-finance</code></li>
              <li>Replace <code style={{ background:"#1e2230",padding:"1px 6px",borderRadius:4,color:"#e8c547" }}>src/App.js</code> with the provided component</li>
              <li>Run: <code style={{ background:"#1e2230",padding:"1px 6px",borderRadius:4,color:"#e8c547" }}>npm install recharts</code></li>
              <li>Deploy with: <code style={{ background:"#1e2230",padding:"1px 6px",borderRadius:4,color:"#e8c547" }}>npm run build</code> then push to GitHub</li>
              <li>Enable GitHub Pages in repo Settings under Pages</li>
            </ol>
            <p style={{ marginTop:"0.75rem",color:"#6b7494" }}>Or deploy instantly free at <strong style={{ color:"#6eb5ff" }}>vercel.com</strong> by connecting your repo.</p>
          </div>
        </div>

        <div style={{ background:"#151820",border:"1px solid #f0706022",borderRadius:"14px",padding:"1.5rem" }}>
          <h3 style={{ color:"#f07060",margin:"0 0 0.5rem",fontSize:"1rem" }}>Danger Zone</h3>
          <p style={{ color:"#6b7494",fontSize:"0.85rem",margin:"0 0 1rem" }}>This permanently erases all your data and resets to the sample data.</p>
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
  { id:"dashboard", label:"Dashboard", icon:"🏠" },
  { id:"income",    label:"Income",    icon:"💰" },
  { id:"bills",     label:"Bills",     icon:"📋" },
  { id:"budget",    label:"Budget",    icon:"📊" },
  { id:"savings",   label:"Savings",   icon:"🎯" },
  { id:"projects",  label:"Projects",  icon:"🔨" },
  { id:"calendar",  label:"Calendar",  icon:"📅" },
  { id:"settings",  label:"Settings",  icon:"⚙️" },
];

export default function App() {
  const [data, setData] = useState(load);
  const [tab, setTab] = useState("dashboard");
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => { save(data); }, [data]);

  const currentTab = TABS.find(t => t.id === tab);

  return (
    <div style={{ minHeight:"100vh",background:"#0d0f16",color:"#f0f2f7",fontFamily:"'DM Sans',sans-serif",display:"flex" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@600;700&family=DM+Sans:wght@400;500;600&display=swap');
        * { box-sizing: border-box; margin: 0; padding: 0; }
        ::-webkit-scrollbar { width: 6px; } ::-webkit-scrollbar-track { background: #1e2230; } ::-webkit-scrollbar-thumb { background: #2a2f3d; border-radius: 3px; }
        input[type=number]::-webkit-inner-spin-button { opacity: 0.5; }
        @keyframes fadeIn { from { opacity:0; transform:translateY(8px); } to { opacity:1; transform:translateY(0); } }
        .tab-content { animation: fadeIn 0.2s ease; }
      `}</style>

      {/* Sidebar */}
      <aside style={{ width:220,background:"#0d0f16",borderRight:"1px solid #1e2230",padding:"1.5rem 0",flexShrink:0,position:"sticky",top:0,height:"100vh",overflowY:"auto",display:"flex",flexDirection:"column" }}>
        <div style={{ padding:"0 1.25rem 1.5rem",borderBottom:"1px solid #1e2230" }}>
          <div style={{ fontFamily:"'Playfair Display',serif",fontSize:"1.15rem",color:"#e8c547",fontWeight:700 }}>Family Finance</div>
          <div style={{ color:"#4a5168",fontSize:"0.72rem",marginTop:"0.2rem" }}>Home Budget Hub</div>
        </div>
        <nav style={{ flex:1,padding:"1rem 0.75rem" }}>
          {TABS.map(t => (
            <button key={t.id} onClick={() => setTab(t.id)} style={{ display:"flex",alignItems:"center",gap:"0.65rem",width:"100%",padding:"0.65rem 0.75rem",borderRadius:8,border:"none",background: tab===t.id ? "#1e2230" : "transparent",color: tab===t.id ? "#f0f2f7" : "#6b7494",cursor:"pointer",fontSize:"0.88rem",fontFamily:"'DM Sans',sans-serif",fontWeight: tab===t.id ? 600 : 400,marginBottom:"2px",textAlign:"left",transition:"all 0.15s" }}>
              <span>{t.icon}</span><span>{t.label}</span>
              {tab===t.id && <span style={{ marginLeft:"auto",width:4,height:4,background:"#e8c547",borderRadius:"50%" }} />}
            </button>
          ))}
        </nav>
        <div style={{ padding:"1rem 1.25rem",borderTop:"1px solid #1e2230" }}>
          <div style={{ color:"#4a5168",fontSize:"0.72rem" }}>Data stored locally</div>
          <div style={{ color:"#6b7494",fontSize:"0.72rem" }}>Private to this device</div>
        </div>
      </aside>

      {/* Main */}
      <main style={{ flex:1,padding:"2rem",overflowY:"auto",maxWidth:960 }}>
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
