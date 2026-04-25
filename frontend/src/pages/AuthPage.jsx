import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Activity, LogIn, UserPlus } from "lucide-react";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { Button } from "../components/ui/button";
import { toast } from "sonner";
import { useAuth } from "../hooks/useAuth";

export default function AuthPage() {
  const { login, register } = useAuth();
  const nav = useNavigate();
  const [mode, setMode] = useState("login");
  const [form, setForm] = useState({ name: "", email: "", password: "" });
  const [submitting, setSubmitting] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      if (mode === "login") await login(form.email, form.password);
      else await register(form.name, form.email, form.password);
      toast.success(mode === "login" ? "Welcome back" : "Account created");
      nav("/");
    } catch (err) {
      toast.error(err.response?.data?.detail || "Authentication failed");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen grid lg:grid-cols-2">
      {/* Left visual panel */}
      <div className="hidden lg:flex flex-col justify-between p-10 bg-stone-900 text-white relative overflow-hidden">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-sky-700 flex items-center justify-center">
            <Activity size={22} />
          </div>
          <span className="font-display font-bold text-xl">MedAI</span>
        </div>
        <div className="space-y-6 max-w-md">
          <h1 className="font-display text-4xl font-extrabold tracking-tight leading-tight">
            Explainable diabetes-risk screening for clinicians.
          </h1>
        </div>
        <div />
      </div>

      {/* Right form panel */}
      <div className="flex items-center justify-center p-6 sm:p-10 bg-white">
        <div className="w-full max-w-sm">
          <div className="mb-8">
            <h2 className="font-display text-3xl font-bold text-stone-900">
              {mode === "login" ? "Sign in" : "Create your account"}
            </h2>
            <p className="text-sm text-stone-500 mt-2">
              {mode === "login"
                ? "Welcome back. Enter your credentials to continue."
                : "Get started in under a minute."}
            </p>
          </div>

          <form onSubmit={submit} className="space-y-4">
            {mode === "register" && (
              <div>
                <Label htmlFor="name">Full name</Label>
                <Input
                  id="name"
                  data-testid="auth-name"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  required
                  className="mt-1.5"
                />
              </div>
            )}
            <div>
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                data-testid="auth-email"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                required
                className="mt-1.5"
              />
            </div>
            <div>
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                data-testid="auth-password"
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
                required
                minLength={6}
                className="mt-1.5"
              />
            </div>

            <Button
              type="submit"
              disabled={submitting}
              data-testid="auth-submit"
              className="w-full bg-sky-700 hover:bg-sky-800 text-white"
            >
              {mode === "login" ? <LogIn size={16} className="mr-2" /> : <UserPlus size={16} className="mr-2" />}
              {submitting ? "Please wait…" : mode === "login" ? "Sign in" : "Create account"}
            </Button>
          </form>

          <div className="mt-6 text-center text-sm text-stone-500">
            {mode === "login" ? "New here? " : "Already have an account? "}
            <button
              type="button"
              data-testid="auth-toggle"
              className="text-sky-700 hover:text-sky-800 font-medium"
              onClick={() => setMode(mode === "login" ? "register" : "login")}
            >
              {mode === "login" ? "Create account" : "Sign in"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
