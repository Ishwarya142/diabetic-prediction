import { NavLink, useNavigate } from "react-router-dom";
import { Activity, LayoutDashboard, Stethoscope, History, LogOut } from "lucide-react";
import { useAuth } from "../hooks/useAuth";

const NAV = [
  { to: "/", icon: LayoutDashboard, label: "Dashboard", testid: "nav-dashboard" },
  { to: "/predict", icon: Stethoscope, label: "New Prediction", testid: "nav-predict" },
  { to: "/history", icon: History, label: "History", testid: "nav-history" },
];

export default function Sidebar() {
  const { user, logout } = useAuth();
  const nav = useNavigate();

  return (
    <aside className="w-64 bg-stone-900 text-stone-300 flex-shrink-0 min-h-screen flex flex-col" data-testid="sidebar">
      <div className="px-6 py-7 border-b border-stone-800">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-sky-700 flex items-center justify-center">
            <Activity size={20} className="text-white" />
          </div>
          <div>
            <div className="font-display text-white font-bold tracking-tight">MedAI</div>
            <div className="text-[10px] uppercase tracking-[0.15em] text-stone-500">Diabetes risk</div>
          </div>
        </div>
      </div>

      <nav className="px-3 py-4 flex-1">
        {NAV.map(({ to, icon: Icon, label, testid }) => (
          <NavLink
            key={to}
            to={to}
            end={to === "/"}
            data-testid={testid}
            className={({ isActive }) =>
              `flex items-center gap-3 px-4 py-2.5 rounded-md transition-colors mb-1 text-sm ${
                isActive
                  ? "bg-stone-800 text-white font-medium"
                  : "hover:bg-stone-800 hover:text-white text-stone-400"
              }`
            }
          >
            <Icon size={18} />
            <span>{label}</span>
          </NavLink>
        ))}
      </nav>

      <div className="p-4 border-t border-stone-800">
        <div className="px-2 py-3 rounded-md bg-stone-800/40">
          <div className="text-sm font-medium text-white truncate" data-testid="user-name">{user?.name}</div>
          <div className="text-xs text-stone-400 truncate">{user?.email}</div>
        </div>
        <button
          data-testid="logout-button"
          onClick={() => { logout(); nav("/auth"); }}
          className="mt-3 w-full flex items-center gap-2 px-3 py-2 rounded-md text-sm text-stone-300 hover:bg-stone-800 hover:text-white transition-colors"
        >
          <LogOut size={16} /> Sign out
        </button>
      </div>
    </aside>
  );
}
