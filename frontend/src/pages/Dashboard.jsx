import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Activity, AlertTriangle, ShieldCheck, BarChart3, Stethoscope } from "lucide-react";
import api from "../services/api";
import AppShell from "../components/AppShell";
import { Button } from "../components/ui/button";

const ACCENTS = {
  sky: "bg-sky-50 text-sky-700",
  orange: "bg-orange-50 text-orange-700",
  lime: "bg-lime-50 text-lime-700",
  amber: "bg-amber-50 text-amber-700",
};
const StatCard = ({ label, value, icon: Icon, accent = "sky", testid }) => (
  <div className="bg-white border border-stone-200 rounded-lg p-6 shadow-sm" data-testid={testid}>
    <div className="flex items-start justify-between">
      <div>
        <div className="text-xs font-semibold tracking-[0.05em] uppercase text-stone-500">{label}</div>
        <div className="font-display text-4xl font-extrabold tracking-tight text-stone-900 mt-3">{value}</div>
      </div>
      <div className={`w-10 h-10 rounded-md flex items-center justify-center ${ACCENTS[accent]}`}>
        <Icon size={20} />
      </div>
    </div>
  </div>
);

export default function Dashboard() {
  const [stats, setStats] = useState(null);

  useEffect(() => {
    api.get("/stats").then((r) => setStats(r.data)).catch(() => {});
  }, []);

  if (!stats) {
    return <AppShell><div className="text-stone-500">Loading dashboard…</div></AppShell>;
  }

  const metricsRow = stats.model_metrics?.find((m) => m.model === stats.best_model);

  return (
    <AppShell>
      <div className="flex items-end justify-between mb-8">
        <div>
          <h1 className="font-display text-3xl sm:text-4xl font-extrabold tracking-tight text-stone-900" data-testid="dashboard-title">Dashboard</h1>
          <p className="text-stone-500 mt-2">Overview of your diabetes-risk screenings.</p>
        </div>
        <Link to="/predict">
          <Button className="bg-sky-700 hover:bg-sky-800 text-white" data-testid="cta-new-prediction">
            <Stethoscope size={16} className="mr-2" /> New prediction
          </Button>
        </Link>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
        <StatCard label="Total screenings" value={stats.total} icon={Activity} accent="sky" testid="stat-total" />
        <StatCard label="High risk" value={stats.high_risk} icon={AlertTriangle} accent="orange" testid="stat-high" />
        <StatCard label="Low risk" value={stats.low_risk} icon={ShieldCheck} accent="lime" testid="stat-low" />
        <StatCard label="Avg probability"
          value={`${(stats.avg_probability * 100).toFixed(0)}%`}
          icon={BarChart3} accent="amber" testid="stat-avg"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Model card */}
        <div className="bg-white border border-stone-200 rounded-lg p-6 shadow-sm lg:col-span-1">
          <div className="text-xs font-semibold tracking-[0.05em] uppercase text-stone-500">Active model</div>
          <div className="mt-3 font-display text-2xl font-bold text-stone-900">
            {stats.best_model === "rf" ? "Random Forest" : "Logistic Regression"}
          </div>
          <p className="text-sm text-stone-500 mt-1">Trained on Pima Indians dataset</p>
          {metricsRow && (
            <dl className="mt-5 grid grid-cols-2 gap-3">
              {[
                ["Accuracy", metricsRow.accuracy],
                ["Precision", metricsRow.precision],
                ["Recall", metricsRow.recall],
                ["F1 score", metricsRow.f1],
              ].map(([k, v]) => (
                <div key={k} className="border border-stone-200 rounded-md px-3 py-2">
                  <dt className="text-[10px] uppercase tracking-wider text-stone-500">{k}</dt>
                  <dd className="font-display font-bold text-lg text-stone-900">{(v * 100).toFixed(1)}%</dd>
                </div>
              ))}
            </dl>
          )}
        </div>

        {/* Recent */}
        <div className="bg-white border border-stone-200 rounded-lg p-6 shadow-sm lg:col-span-2">
          <div className="flex items-center justify-between mb-4">
            <div className="text-xs font-semibold tracking-[0.05em] uppercase text-stone-500">Recent activity</div>
            <Link to="/history" className="text-xs text-sky-700 hover:text-sky-800">View all</Link>
          </div>
          {stats.recent.length === 0 ? (
            <div className="text-stone-400 text-sm py-12 text-center">
              No predictions yet. Run your first one →
            </div>
          ) : (
            <div className="divide-y divide-stone-100">
              {stats.recent.map((p) => (
                <div key={p.id} className="flex items-center justify-between py-3" data-testid={`recent-${p.id}`}>
                  <div>
                    <div className="text-sm font-medium text-stone-900">{p.label}</div>
                    <div className="text-xs text-stone-500">
                      {new Date(p.created_at).toLocaleString()}
                    </div>
                  </div>
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                    p.prediction === 1 ? "bg-orange-100 text-orange-800" : "bg-lime-100 text-lime-800"
                  }`}>
                    {(p.probability * 100).toFixed(0)}%
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </AppShell>
  );
}
