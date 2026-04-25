import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { ArrowRight } from "lucide-react";
import api from "../services/api";
import AppShell from "../components/AppShell";

export default function History() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get("/predictions")
      .then((r) => setItems(r.data.items))
      .finally(() => setLoading(false));
  }, []);

  return (
    <AppShell>
      <div className="mb-8">
        <h1 className="font-display text-3xl sm:text-4xl font-extrabold tracking-tight text-stone-900" data-testid="history-title">History</h1>
        <p className="text-stone-500 mt-2">All your past prediction runs.</p>
      </div>

      <div className="bg-white border border-stone-200 rounded-lg shadow-sm overflow-hidden">
        <table className="w-full">
          <thead className="bg-stone-50 border-b border-stone-200">
            <tr>
              {["Date", "Result", "Probability", "Glucose", "BMI", "Age", ""].map((h, i) => (
                <th key={i} className="text-left text-xs font-semibold text-stone-500 uppercase tracking-wider px-6 py-3">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading && (
              <tr><td colSpan={7} className="px-6 py-8 text-stone-400 text-sm text-center">Loading…</td></tr>
            )}
            {!loading && items.length === 0 && (
              <tr><td colSpan={7} className="px-6 py-12 text-stone-400 text-sm text-center">No predictions yet. <Link to="/predict" className="text-sky-700">Run one →</Link></td></tr>
            )}
            {items.map((p) => (
              <tr key={p.id} className="border-b border-stone-100 hover:bg-stone-50 transition-colors" data-testid={`history-row-${p.id}`}>
                <td className="px-6 py-4 text-sm text-stone-900 whitespace-nowrap">{new Date(p.created_at).toLocaleString()}</td>
                <td className="px-6 py-4 text-sm whitespace-nowrap">
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                    p.prediction === 1 ? "bg-orange-100 text-orange-800" : "bg-lime-100 text-lime-800"
                  }`}>
                    {p.label}
                  </span>
                </td>
                <td className="px-6 py-4 text-sm text-stone-900 font-medium">{(p.probability * 100).toFixed(1)}%</td>
                <td className="px-6 py-4 text-sm text-stone-700">{p.inputs.Glucose}</td>
                <td className="px-6 py-4 text-sm text-stone-700">{p.inputs.BMI}</td>
                <td className="px-6 py-4 text-sm text-stone-700">{p.inputs.Age}</td>
                <td className="px-6 py-4 text-sm text-right">
                  <Link to={`/result/${p.id}`} className="inline-flex items-center text-sky-700 hover:text-sky-800 text-sm">
                    View <ArrowRight size={14} className="ml-1" />
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </AppShell>
  );
}
