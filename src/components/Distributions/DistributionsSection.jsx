// sections/Distributions.jsx — drop-in component (no App/main)
// Props: { dark?: boolean }
import React, { useEffect, useMemo, useState } from "react";
import {
  Download,
  FileText,
  CheckCircle2,
  Clock3,
  Filter,
  CircleDollarSign,
  PieChart as PieIcon,
  CalendarDays,
  CalendarPlus,
  Search,
  ChevronLeft,
  ChevronRight,
  Undo2,
  Redo2,
  History,
} from "lucide-react";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
  PieChart,
  Pie,
  Cell,
  Legend,
} from "recharts";
import { formatDate } from "../../utils/format.jsx"; // adjust path if needed

const now = new Date();
const thisYear = now.getFullYear();
const seed = [
  { id: 1, date: `${thisYear}-01-31`, amount: 820.25, type: "Cash", status: "Paid" },
  { id: 2, date: `${thisYear}-02-28`, amount: 805.1, type: "Cash", status: "Paid" },
  { id: 3, date: `${thisYear}-03-31`, amount: 840.0, type: "Reinvested", status: "Paid" },
  { id: 4, date: `${thisYear}-04-30`, amount: 860.75, type: "Cash", status: "Paid" },
  { id: 5, date: `${thisYear}-05-31`, amount: 910.4, type: "Cash", status: "Paid" },
  { id: 6, date: `${thisYear}-06-30`, amount: 935.1, type: "Reinvested", status: "Paid" },
  { id: 7, date: `${thisYear}-07-31`, amount: 950.0, type: "Cash", status: "Paid" },
  { id: 8, date: `${thisYear}-08-31`, amount: 975.5, type: "Cash", status: "Paid" },
  { id: 9, date: `${thisYear}-09-30`, amount: 990.25, type: "Reinvested", status: "Scheduled" },
  { id: 10, date: `${thisYear}-10-31`, amount: 1010.0, type: "Cash", status: "Scheduled" },
  { id: 11, date: `${thisYear}-11-30`, amount: 1025.75, type: "Cash", status: "Scheduled" },
  { id: 12, date: `${thisYear}-12-31`, amount: 1040.5, type: "Cash", status: "Scheduled" },
];

const COLORS = { Cash: "#22c55e", Reinvested: "#3b82f6" };

export default function Distributions({ dark = false }) {
  const [data, setData] = useState(seed);
  const [timeframe, setTimeframe] = useState("YTD"); // YTD | 12M | All
  const [type, setType] = useState("All"); // All | Cash | Reinvested
  const [status, setStatus] = useState("All"); // All | Paid | Scheduled
  const [selected, setSelected] = useState(null);
  const [q, setQ] = useState("");
  const [page, setPage] = useState(1);
  const pageSize = 8;
  const [selectedIds, setSelectedIds] = useState(new Set());
  const [historyPast, setHistoryPast] = useState([]);
  const [historyFuture, setHistoryFuture] = useState([]);
  const [downloads, setDownloads] = useState([]); // {name,url,type,createdAt}
  const [toast, setToast] = useState(null); // {message, timer}
  const [showEditor, setShowEditor] = useState(false);
  const [recFreq, setRecFreq] = useState("Monthly");
  const [recDay, setRecDay] = useState(31);
  const [recType, setRecType] = useState("Cash");
  const [recAmount, setRecAmount] = useState(1000);

  // --- derived ---
  const filtered = useMemo(() => {
    const start = timeframe === "YTD"
      ? new Date(thisYear, 0, 1)
      : timeframe === "12M"
      ? new Date(now.getFullYear() - 1, now.getMonth() + 1, 1)
      : new Date(thisYear - 50, 0, 1);
    const end = new Date(thisYear + 1, 0, 1);
    const base = data
      .filter((d) => {
        const dt = new Date(d.date);
        if (dt < start || dt >= end) return false;
        if (type !== "All" && d.type !== type) return false;
        if (status !== "All" && d.status !== status) return false;
        return true;
      })
      .sort((a, b) => new Date(a.date) - new Date(b.date));
    if (!q.trim()) return base;
    const query = q.trim().toLowerCase();
    return base.filter(
      (r) =>
        r.type.toLowerCase().includes(query) ||
        r.status.toLowerCase().includes(query) ||
        r.date.includes(query) ||
        String(r.amount).includes(query)
    );
  }, [data, timeframe, type, status, q]);

  const pageCount = Math.max(1, Math.ceil(filtered.length / pageSize));
  useEffect(() => { if (page > pageCount) setPage(pageCount); }, [page, pageCount]);
  useEffect(() => { setPage(1); }, [q, timeframe, type, status]);

  const visible = useMemo(() => filtered.slice((page - 1) * pageSize, page * pageSize), [filtered, page]);

  const totals = useMemo(() => ({
    ytd: data.filter((d) => new Date(d.date).getFullYear() === thisYear).reduce((s, d) => s + d.amount, 0),
    paid: filtered.filter((d) => d.status === "Paid").reduce((s, d) => s + d.amount, 0),
    scheduled: filtered.filter((d) => d.status === "Scheduled").reduce((s, d) => s + d.amount, 0),
  }), [filtered, data]);

  const monthly = useMemo(() => {
    const m = new Map();
    filtered.forEach((d) => {
      const key = new Date(d.date).toLocaleDateString(undefined, { month: "short" });
      m.set(key, (m.get(key) || 0) + d.amount);
    });
    return Array.from(m.entries()).map(([month, value]) => ({ month, value }));
  }, [filtered]);

  const breakdown = useMemo(() => {
    const by = { Cash: 0, Reinvested: 0 };
    filtered.forEach((d) => { by[d.type] += d.amount; });
    return [ { name: "Cash", value: by.Cash }, { name: "Reinvested", value: by.Reinvested } ];
  }, [filtered]);

  // --- helpers ---
  const snapshot = () => JSON.parse(JSON.stringify({ data, selectedId: selected?.id ?? null }));
  const applySnapshot = (s) => {
    setData(s.data);
    setSelected(s.selectedId ? s.data.find((r) => r.id === s.selectedId) : null);
    setSelectedIds(new Set());
  };
  const showToast = (message) => {
    if (toast?.timer) clearTimeout(toast.timer);
    const timer = setTimeout(() => setToast(null), 3000);
    setToast({ message, timer });
  };
  const commit = (label, fn) => {
    setHistoryPast((p) => [...p, snapshot()]);
    setHistoryFuture([]);
    fn();
    showToast(label + " • Undo available");
  };
  const undo = () => {
    if (!historyPast.length) return;
    const curr = snapshot();
    const prev = historyPast[historyPast.length - 1];
    setHistoryPast((p) => p.slice(0, -1));
    setHistoryFuture((f) => [...f, curr]);
    applySnapshot(prev);
  };
  const redo = () => {
    if (!historyFuture.length) return;
    const curr = snapshot();
    const next = historyFuture[historyFuture.length - 1];
    setHistoryFuture((f) => f.slice(0, -1));
    setHistoryPast((p) => [...p, curr]);
    applySnapshot(next);
  };
  useEffect(() => {
    const onKey = (e) => {
      if (e.metaKey || e.ctrlKey) {
        if (e.key.toLowerCase() === "z") {
          e.preventDefault();
          if (e.shiftKey) redo(); else undo();
        }
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [historyPast, historyFuture, data, selected]);

  const allVisibleIds = visible.map((r) => r.id);
  const allSelected = allVisibleIds.length > 0 && allVisibleIds.every((id) => selectedIds.has(id));
  const toggleId = (id, checked) => setSelectedIds((prev) => { const n = new Set(prev); if (checked) n.add(id); else n.delete(id); return n; });
  const onSelectAll = (checked) => { if (checked) setSelectedIds(new Set(allVisibleIds)); else setSelectedIds(new Set()); };

  const markPaid = (row) => commit("Marked paid", () => setData((prev) => prev.map((r) => (r.id === row.id ? { ...r, status: "Paid" } : r))));
  const bulkMarkPaid = () => { if (!selectedIds.size) return; commit(`Marked paid (${selectedIds.size})`, () => setData((prev) => prev.map((r) => (selectedIds.has(r.id) ? { ...r, status: "Paid" } : r)))); setSelectedIds(new Set()); };

  // downloads / exports
  const pushDownload = (name, blob, mime = "application/octet-stream") => {
    const url = URL.createObjectURL(blob);
    setDownloads((prev) => [{ name, url, type: mime, createdAt: new Date().toISOString() }, ...prev].slice(0, 12));
    // attempt auto download
    const a = document.createElement("a"); a.href = url; a.download = name; document.body.appendChild(a); a.click(); document.body.removeChild(a);
  };
  const clearDownloads = () => { downloads.forEach((d) => URL.revokeObjectURL(d.url)); setDownloads([]); };

  const downloadStatement = (row) => {
    const payload = { ...row, statement: "Demo statement. Replace with real PDF." };
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" });
    pushDownload(`${row.date} - distribution.json`, blob, "application/json");
  };
  const exportCSV = (rows) => {
    const head = ["Date", "Amount", "Type", "Status"];
    const body = (rows || filtered).map((d) => [d.date, d.amount, d.type, d.status]);
    const csv = [head, ...body].map((r) => r.join(",")).join("");
    const blob = new Blob([csv], { type: "text/csv" });
    pushDownload("distributions.csv", blob, "text/csv");
  };
  const exportICS = (rows) => {
    const sel = rows && rows.length ? rows : filtered.filter((r) => r.status === "Scheduled");
    const ev = (r) => { const dt = new Date(r.date); const y = dt.getUTCFullYear(); const m = String(dt.getUTCMonth()+1).padStart(2,"0"); const d = String(dt.getUTCDate()).padStart(2,"0"); return ["BEGIN:VEVENT", `UID:${r.id}@waystar.demo`, `DTSTAMP:${y}${m}${d}T000000Z`, `DTSTART;VALUE=DATE:${y}${m}${d}`, `SUMMARY:Distribution ${r.type} $${r.amount.toFixed(2)}`, "END:VEVENT"].join("") };
    const ics = ["BEGIN:VCALENDAR", "VERSION:2.0", ...sel.map(ev), "END:VCALENDAR"].join("");
    const blob = new Blob([ics], { type: "text/calendar" });
    pushDownload("distributions.ics", blob, "text/calendar");
  };
  const bulkExportCSV = () => exportCSV(visible.filter((r) => selectedIds.has(r.id)));
  const bulkDownloadStatements = () => visible.filter((r) => selectedIds.has(r.id)).forEach(downloadStatement);

  // recurring generator
  const generateNext = () => {
    const months = recFreq === "Monthly" ? 12 : 12; // 12 months window
    const step = recFreq === "Monthly" ? 1 : 3;
    const start = new Date(thisYear, now.getMonth(), 1);
    const rows = [];
    let idSeed = Date.now();
    for (let i = 0; i < months; i += step) {
      const dt = new Date(start); dt.setMonth(dt.getMonth() + i);
      const year = dt.getFullYear(); const month = dt.getMonth();
      const last = new Date(year, month + 1, 0).getDate(); const day = Math.min(recDay, last);
      rows.push({ id: ++idSeed, date: `${year}-${String(month+1).padStart(2,"0")}-${String(day).padStart(2,"0")}`, amount: Number(recAmount), type: recType, status: "Scheduled" });
    }
    commit(`Scheduled ${rows.length} ${recFreq.toLowerCase()} payouts`, () => setData((p) => [...p, ...rows]));
  };

  const tooltip = dark
    ? { backgroundColor: "#111827", border: "1px solid #374151", color: "#f9fafb" }
    : { backgroundColor: "#ffffff", border: "1px solid #e5e7eb", color: "#111827" };

  return (
    <div className="space-y-6">
      {/* Controls */}
      <div className={dark ? "bg-gray-800 rounded-lg p-4 shadow" : "bg-white rounded-lg p-4 shadow"}>
        <div className="flex flex-wrap items-center gap-2">
          <div className="inline-flex items-center gap-2 text-sm"><Filter className="w-4 h-4"/>Filters</div>
          <select value={timeframe} onChange={(e)=>setTimeframe(e.target.value)} className={dark?"px-2 py-1 rounded-md bg-gray-900 border border-gray-700":"px-2 py-1 rounded-md bg-white border border-gray-200"}>
            <option>YTD</option><option>12M</option><option>All</option>
          </select>
          <select value={type} onChange={(e)=>setType(e.target.value)} className={dark?"px-2 py-1 rounded-md bg-gray-900 border border-gray-700":"px-2 py-1 rounded-md bg-white border border-gray-200"}>
            <option>All</option><option>Cash</option><option>Reinvested</option>
          </select>
          <select value={status} onChange={(e)=>setStatus(e.target.value)} className={dark?"px-2 py-1 rounded-md bg-gray-900 border border-gray-700":"px-2 py-1 rounded-md bg-white border border-gray-200"}>
            <option>All</option><option>Paid</option><option>Scheduled</option>
          </select>

          <div className={dark?"hidden sm:flex items-center gap-2 px-2 py-1 rounded-md bg-gray-800 border border-gray-700":"hidden sm:flex items-center gap-2 px-2 py-1 rounded-md bg-white border border-gray-200"}>
            <Search className="w-4 h-4"/>
            <input value={q} onChange={(e)=>setQ(e.target.value)} placeholder="Search date, type, status, amount..." className="bg-transparent text-sm focus:outline-none"/>
          </div>

          <div className="ml-auto flex flex-wrap items-center gap-2">
            <button onClick={()=>exportCSV()} className="inline-flex items-center gap-2 px-3 py-2 rounded-md border"><Download className="w-4 h-4"/>CSV</button>
            <button onClick={()=>exportICS()} className="inline-flex items-center gap-2 px-3 py-2 rounded-md border"><CalendarDays className="w-4 h-4"/>ICS</button>
            <button onClick={()=>setShowEditor(s=>!s)} className="inline-flex items-center gap-2 px-3 py-2 rounded-md border"><CalendarPlus className="w-4 h-4"/>Recurring</button>
            <div className="hidden md:flex items-center gap-1 border rounded-md overflow-hidden">
              <button onClick={undo} disabled={!historyPast.length} className={`px-2 py-2 ${historyPast.length ? (dark?"hover:bg-gray-700":"hover:bg-gray-100") : "opacity-40 cursor-not-allowed"}`} title="Undo (Ctrl/Cmd+Z)"><Undo2 className="w-4 h-4"/></button>
              <button onClick={redo} disabled={!historyFuture.length} className={`px-2 py-2 ${historyFuture.length ? (dark?"hover:bg-gray-700":"hover:bg-gray-100") : "opacity-40 cursor-not-allowed"}`} title="Redo (Ctrl/Cmd+Shift+Z)"><Redo2 className="w-4 h-4"/></button>
            </div>
          </div>
        </div>

        {showEditor && (
          <div className="mt-4 grid grid-cols-2 sm:grid-cols-5 gap-2 text-sm">
            <label className="flex items-center gap-2">Freq
              <select value={recFreq} onChange={(e)=>setRecFreq(e.target.value)} className={dark?"px-2 py-1 rounded-md bg-gray-900 border border-gray-700":"px-2 py-1 rounded-md bg-white border border-gray-200"}>
                <option>Monthly</option><option>Quarterly</option>
              </select>
            </label>
            <label className="flex items-center gap-2">Day
              <input type="number" min={1} max={31} value={recDay} onChange={(e)=>setRecDay(parseInt(e.target.value||"1",10))} className={dark?"w-20 px-2 py-1 rounded-md bg-gray-900 border border-gray-700":"w-20 px-2 py-1 rounded-md bg-white border border-gray-200"}/>
            </label>
            <label className="flex items-center gap-2">Type
              <select value={recType} onChange={(e)=>setRecType(e.target.value)} className={dark?"px-2 py-1 rounded-md bg-gray-900 border border-gray-700":"px-2 py-1 rounded-md bg-white border border-gray-200"}>
                <option>Cash</option><option>Reinvested</option>
              </select>
            </label>
            <label className="flex items-center gap-2">Amount
              <input type="number" min={0} step={0.01} value={recAmount} onChange={(e)=>setRecAmount(e.target.value)} className={dark?"w-28 px-2 py-1 rounded-md bg-gray-900 border border-gray-700":"w-28 px-2 py-1 rounded-md bg-white border border-gray-200"}/>
            </label>
            <div className="flex items-center justify-end">
              <button onClick={generateNext} className="px-3 py-2 rounded-md bg-green-600 text-white">Generate 12 mo</button>
            </div>
          </div>
        )}
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card dark={dark} icon={<CircleDollarSign className="w-4 h-4"/>} label="YTD Distributions" value={`$${totals.ytd.toLocaleString()}`} />
        <Card dark={dark} icon={<CheckCircle2 className="w-4 h-4"/>} label="Paid (filtered)" value={`$${totals.paid.toLocaleString()}`} />
        <Card dark={dark} icon={<Clock3 className="w-4 h-4"/>} label="Scheduled (filtered)" value={`$${totals.scheduled.toLocaleString()}`} />
      </div>

      {/* Chart */}
      <div className={dark?"bg-gray-800 rounded-lg p-4 shadow":"bg-white rounded-lg p-4 shadow"}>
        <h2 className="text-sm font-semibold mb-2 flex items-center gap-2"><PieIcon className="w-4 h-4"/>Payout History</h2>
        <ResponsiveContainer height={220}>
          <AreaChart data={monthly}>
            <defs>
              <linearGradient id="g1" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#22c55e" stopOpacity={0.8} />
                <stop offset="95%" stopColor="#22c55e" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke={dark?"#374151":"#e5e7eb"}/>
            <XAxis dataKey="month" stroke={dark?"#9ca3af":"#374151"}/>
            <YAxis stroke={dark?"#9ca3af":"#374151"}/>
            <Tooltip contentStyle={tooltip}/>
            <Area type="monotone" dataKey="value" stroke="#22c55e" fill="url(#g1)"/>
          </AreaChart>
        </ResponsiveContainer>
      </div>

      {/* Bulk actions */}
      {selectedIds.size>0 && (
        <div className={dark?"bg-gray-800 border border-gray-700 rounded-lg p-3 sticky top-2 z-10":"bg-white border border-gray-200 rounded-lg p-3 sticky top-2 z-10"}>
          <div className="flex items-center justify-between text-sm">
            <span>{selectedIds.size} selected</span>
            <div className="flex items-center gap-2">
              <button onClick={bulkExportCSV} className="px-2 py-1 rounded border inline-flex items-center gap-1"><Download className="w-4 h-4"/>CSV</button>
              <button onClick={()=>exportICS(visible.filter(r=>selectedIds.has(r.id)))} className="px-2 py-1 rounded border inline-flex items-center gap-1"><CalendarDays className="w-4 h-4"/>ICS</button>
              <button onClick={bulkDownloadStatements} className="px-2 py-1 rounded border inline-flex items-center gap-1"><FileText className="w-4 h-4"/>Statements</button>
              <button onClick={bulkMarkPaid} className="px-2 py-1 rounded border inline-flex items-center gap-1"><CheckCircle2 className="w-4 h-4"/>Mark Paid</button>
            </div>
          </div>
        </div>
      )}

      {/* Table */}
      <div className={dark?"bg-gray-800 rounded-lg p-4 shadow overflow-auto":"bg-white rounded-lg p-4 shadow overflow-auto"}>
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-gray-500">
              <th className="py-2 w-8"><input type="checkbox" checked={allSelected} onChange={(e)=>onSelectAll(e.target.checked)}/></th>
              <th className="py-2">Date</th>
              <th className="py-2">Amount</th>
              <th className="py-2">Type</th>
              <th className="py-2">Status</th>
              <th className="py-2 text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {visible.map(r => (
              <tr key={r.id} className={dark?"border-t border-gray-700 hover:bg-gray-700/40":"border-t border-gray-200 hover:bg-gray-50"} onClick={()=>setSelected(r)}>
                <td className="py-3 w-8" onClick={(e)=>e.stopPropagation()}>
                  <input type="checkbox" checked={selectedIds.has(r.id)} onChange={(e)=>toggleId(r.id, e.target.checked)} />
                </td>
                <td className="py-3">{formatDate(r.date)}</td>
                <td className="py-3 font-medium">${r.amount.toLocaleString()}</td>
                <td className="py-3"><Badge dark={dark} color={COLORS[r.type]}>{r.type}</Badge></td>
                <td className="py-3">{r.status === "Paid" ? (<span className="text-green-500 inline-flex items-center gap-1"><CheckCircle2 className="w-4 h-4"/>Paid</span>) : (<span className="text-amber-500 inline-flex items-center gap-1"><Clock3 className="w-4 h-4"/>Scheduled</span>)}</td>
                <td className="py-3 text-right" onClick={(e)=>e.stopPropagation()}>
                  <div className="inline-flex items-center gap-2">
                    <button className="px-2 py-1 rounded border inline-flex items-center gap-1" onClick={()=>downloadStatement(r)}><FileText className="w-4 h-4"/>Statement</button>
                    {r.status !== "Paid" && (<button className="px-2 py-1 rounded border inline-flex items-center gap-1" onClick={()=>markPaid(r)}>Mark Paid</button>)}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        <div className="mt-3 flex items-center justify-between text-sm">
          <span>Page {page} / {pageCount} • {filtered.length} results</span>
          <div className="inline-flex items-center gap-1">
            <button className="px-2 py-1 rounded border" onClick={()=>setPage(p=>Math.max(1,p-1))} disabled={page===1}><ChevronLeft className="w-4 h-4"/></button>
            <button className="px-2 py-1 rounded border" onClick={()=>setPage(p=>Math.min(pageCount,p+1))} disabled={page===pageCount}><ChevronRight className="w-4 h-4"/></button>
          </div>
        </div>
      </div>

      {/* Right column widgets to embed elsewhere if you want */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className={dark?"bg-gray-800 rounded-lg p-4 shadow":"bg-white rounded-lg p-4 shadow"}>
          <h3 className="font-semibold mb-2">Breakdown (filtered)</h3>
          <ResponsiveContainer height={220}>
            <PieChart>
              <Pie data={breakdown} dataKey="value" outerRadius={80} label={(props)=>{ const { name, percent, cx, cy, midAngle, innerRadius, outerRadius: oR } = props; const RAD=Math.PI/180; const r=innerRadius+(oR-innerRadius)*0.5; const x=cx+r*Math.cos(-midAngle*RAD); const y=cy+r*Math.sin(-midAngle*RAD); return (<text x={x} y={y} fill={dark?"#f9fafb":"#111827"} textAnchor={x>cx?"start":"end"} dominantBaseline="central">{`${name} ${(percent*100).toFixed(0)}%`}</text>); }} labelLine={false}>
                {breakdown.map((e,i)=>(<Cell key={i} fill={COLORS[e.name]} />))}
              </Pie>
              <Legend formatter={(v)=>(<span style={{ color: dark?"#f9fafb":"#111827" }}>{v}</span>)} />
              <Tooltip contentStyle={tooltip} itemStyle={{ color: dark?"#f9fafb":"#111827" }} labelStyle={{ color: dark?"#f9fafb":"#111827" }} />
            </PieChart>
          </ResponsiveContainer>
        </div>

        <div className={dark?"bg-gray-800 rounded-lg p-4 shadow text-sm":"bg-white rounded-lg p-4 shadow text-sm"}>
          <h3 className="font-semibold mb-2">Bank Instructions</h3>
          <div className="space-y-1">
            <div className="flex items-center justify-between"><span className="text-gray-500">Bank</span><span>First Federal</span></div>
            <div className="flex items-center justify-between"><span className="text-gray-500">Account</span><span>•••• 4821</span></div>
            <div className="flex items-center justify-between"><span className="text-gray-500">Routing</span><span>*****123</span></div>
          </div>
          <div className="pt-3 flex items-center gap-2">
            <button className="px-2 py-1 rounded border">Request change</button>
            <button className="px-2 py-1 rounded border" onClick={()=>{ const txt=`Bank: First Federal
Account: •••• 4821
Routing: *****123
Generated: ${new Date().toLocaleString()}`; const blob=new Blob([txt],{type:"text/plain"}); const url=URL.createObjectURL(blob); const a=document.createElement("a"); a.href=url; a.download="bank-instructions.txt"; document.body.appendChild(a); a.click(); document.body.removeChild(a); }}>Download</button>
          </div>
        </div>

        <div className={dark?"bg-gray-800 rounded-lg p-4 shadow text-sm":"bg-white rounded-lg p-4 shadow text-sm"}>
          <div className="flex items-center justify-between"><h3 className="font-semibold">Download Center</h3><button className="px-2 py-1 rounded border" onClick={()=>{ downloads.forEach(d=>URL.revokeObjectURL(d.url)); setDownloads([]); }} disabled={!downloads.length}>Clear</button></div>
          {!downloads.length ? (<p className="text-gray-500 mt-2">No files yet. Use CSV/ICS/Statement.</p>) : (
            <ul className="mt-2 space-y-2">{downloads.map((d,i)=>(<li key={i} className="flex items-center justify-between"><a href={d.url} download={d.name} className="underline">{d.name}</a><span className="text-gray-500">{new Date(d.createdAt).toLocaleTimeString()}</span></li>))}</ul>
          )}
        </div>
      </div>

      {toast && (
        <div className={dark?"fixed bottom-4 right-4 bg-gray-800 text-gray-100 border border-gray-700 shadow rounded-lg px-4 py-3 text-sm":"fixed bottom-4 right-4 bg-white text-gray-900 border border-gray-200 shadow rounded-lg px-4 py-3 text-sm"}>
          <div className="flex items-center gap-3"><span>{toast.message}</span><button onClick={undo} className="px-2 py-1 rounded border">Undo</button></div>
        </div>
      )}
    </div>
  );
}

function Card({ dark, icon, label, value }) {
  return (
    <div className={dark?"bg-gray-800 rounded-lg p-4 shadow":"bg-white rounded-lg p-4 shadow"}>
      <div className="text-xs text-gray-500 mb-1">{label}</div>
      <div className="flex items-center gap-2 text-xl font-semibold">{icon}{value}</div>
    </div>
  );
}

function Badge({ dark, color, children }) {
  return (
    <span className="px-2 py-0.5 text-xs rounded border" style={{ backgroundColor: `${color}20`, borderColor: dark?"#374151":"#e5e7eb", color }}>
      {children}
    </span>
  );
}
