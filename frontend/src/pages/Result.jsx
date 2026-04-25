import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import {
  ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Cell, Tooltip, ReferenceLine,
} from "recharts";
import { AlertTriangle, ShieldCheck, ArrowLeft, Sparkles, Loader2 } from "lucide-react";
import api from "../services/api";
import AppShell from "../components/AppShell";
import { Button } from "../components/ui/button";

const RISK_COLOR = "#EA580C";
const SAFE_COLOR = "#65A30D";

function CustomTooltip({ active, payload }) {
  if (!active || !payload?.length) return null;
  const p = payload[0].payload;
  return (
    <div className="bg-white border border-stone-200 rounded-md shadow-md px-3 py-2 text-xs">
      <div className="font-semibold text-stone-900">{p.feature}</div>
      <div className="text-stone-500">value: {p.value.toFixed(2)}</div>
      <div className="text-stone-500">SHAP: {p.shap_value.toFixed(3)}</div>
    </div>
  );
}

export default function Result() {
  const { id } = useParams();
  const [data, setData] = useState(null);
  const [report, setReport] = useState(null);
  const [reportLoading, setReportLoading] = useState(false);

  useEffect(() => {
    api.get(`/explain/${id}`).then((r) => setData(r.data));
  }, [id]);

  useEffect(() => {
    if (!data) return;
    setReportLoading(true);
    api.get(`/report/${id}`)
      .then((r) => setReport(r.data))
      .finally(() => setReportLoading(false));
  }, [data, id]);

  if (!data) return <AppShell><div className="text-stone-500">Loading…</div></AppShell>;

  const isHigh = data.probability >= 0.5;
  const pct = Math.round(data.probability * 100);
  const chartData = [...data.contributions].reverse(); // smallest at top of horizontal bars

  return (
    <AppShell>
      <div className="flex items-center justify-between mb-8">
        <div>
          <Link to="/predict" className="inline-flex items-center text-sm text-stone-500 hover:text-stone-900 mb-3">
            <ArrowLeft size={14} className="mr-1.5" /> Back
          </Link>
          <h1 className="font-display text-3xl sm:text-4xl font-extrabold tracking-tight text-stone-900" data-testid="result-title">
            Prediction result
          </h1>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
        {/* Probability gauge */}
        <div className="bg-white border border-stone-200 rounded-lg shadow-sm p-8 flex flex-col items-center justify-center text-center" data-testid="probability-card">
          <div className="text-xs font-semibold tracking-[0.05em] uppercase text-stone-500 mb-4">Probability</div>
          <div className="relative w-44 h-44 flex items-center justify-center">
            <svg className="absolute inset-0 -rotate-90" viewBox="0 0 120 120">
              <circle cx="60" cy="60" r="52" fill="none" stroke="#e7e5e4" strokeWidth="10" />
              <circle
                cx="60" cy="60" r="52" fill="none"
                stroke={isHigh ? RISK_COLOR : SAFE_COLOR}
                strokeWidth="10" strokeLinecap="round"
                strokeDasharray={`${(pct / 100) * 326.7} 326.7`}
                style={{ transition: "stroke-dasharray 800ms ease-out" }}
              />
            </svg>
            <div>
              <div className="font-display text-5xl font-extrabold tracking-tighter text-stone-900" data-testid="probability-value">{pct}%</div>
            </div>
          </div>
          <div className={`mt-6 inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${
            isHigh ? "bg-orange-100 text-orange-800" : "bg-lime-100 text-lime-800"
          }`} data-testid="prediction-label">
            {isHigh ? <AlertTriangle size={12} className="mr-1.5" /> : <ShieldCheck size={12} className="mr-1.5" />}
            {data.label}
          </div>
        </div>

        {/* SHAP chart */}
        <div className="bg-white border border-stone-200 rounded-lg shadow-sm p-6 lg:col-span-2" data-testid="shap-card">
          <div className="flex items-center justify-between mb-1">
            <h3 className="font-display text-lg font-semibold tracking-tight text-stone-900">Feature contributions (SHAP)</h3>
          </div>
          <p className="text-xs text-stone-500 mb-4">
            <span className="inline-block w-2 h-2 rounded-full bg-orange-500 mr-1" /> pushes toward diabetes &nbsp;
            <span className="inline-block w-2 h-2 rounded-full bg-lime-600 mr-1" /> pushes away
          </p>
          <ResponsiveContainer width="100%" height={320}>
            <BarChart data={chartData} layout="vertical" margin={{ left: 30, right: 20 }}>
              <XAxis type="number" stroke="#78716c" fontSize={11} />
              <YAxis type="category" dataKey="feature" stroke="#78716c" fontSize={11} width={140} />
              <Tooltip content={<CustomTooltip />} cursor={{ fill: "#fafaf9" }} />
              <ReferenceLine x={0} stroke="#1c1917" strokeWidth={1.5} />
              <Bar dataKey="shap_value" radius={[3, 3, 3, 3]}>
                {chartData.map((c, i) => (
                  <Cell key={i} fill={c.shap_value >= 0 ? RISK_COLOR : SAFE_COLOR} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* AI explanation */}
      <div className="bg-white border border-stone-200 rounded-lg shadow-sm p-6 md:p-8" data-testid="explanation-card">
        <div className="flex items-center gap-2 mb-3">
          <Sparkles size={18} className="text-sky-700" />
          <h3 className="font-display text-lg font-semibold tracking-tight text-stone-900">AI explanation</h3>
        </div>

        <div className="bg-amber-50 border border-amber-200 text-amber-900 text-xs px-4 py-2.5 rounded-md mb-5" data-testid="disclaimer">
          {report?.disclaimer || "This is an AI-generated explanation. This is not medical advice. Always consult a qualified healthcare professional."}
        </div>

        {reportLoading && !report ? (
          <div className="flex items-center text-stone-500 text-sm">
            <Loader2 size={14} className="mr-2 animate-spin" /> Generating explanation…
          </div>
        ) : (
          <p className="text-stone-800 leading-relaxed whitespace-pre-wrap" data-testid="explanation-text">
            {report?.explanation}
          </p>
        )}
      </div>
    </AppShell>
  );
}
