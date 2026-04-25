import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowRight, Loader2 } from "lucide-react";
import { toast } from "sonner";
import api from "../services/api";
import AppShell from "../components/AppShell";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { Button } from "../components/ui/button";

const GROUPS = [
  {
    title: "Demographics",
    subtitle: "Patient profile",
    fields: [
      { name: "Age", label: "Age (years)", min: 1, max: 120, step: 1, default: 35 },
      { name: "Pregnancies", label: "Pregnancies", min: 0, max: 20, step: 1, default: 0 },
    ],
  },
  {
    title: "Vitals",
    subtitle: "Bedside measurements",
    fields: [
      { name: "BloodPressure", label: "Diastolic BP (mm Hg)", min: 0, max: 200, step: 1, default: 70 },
      { name: "SkinThickness", label: "Skin thickness (mm)", min: 0, max: 120, step: 1, default: 20 },
      { name: "BMI", label: "BMI (kg/m²)", min: 0, max: 80, step: 0.1, default: 25 },
    ],
  },
  {
    title: "Lab results",
    subtitle: "Glycemic & genetic markers",
    fields: [
      { name: "Glucose", label: "Glucose (mg/dL)", min: 0, max: 300, step: 1, default: 110 },
      { name: "Insulin", label: "Insulin (μU/mL)", min: 0, max: 900, step: 1, default: 80 },
      { name: "DiabetesPedigreeFunction", label: "Pedigree function", min: 0, max: 3, step: 0.001, default: 0.5 },
    ],
  },
];

const initialState = () => {
  const obj = {};
  GROUPS.forEach((g) => g.fields.forEach((f) => { obj[f.name] = f.default; }));
  return obj;
};

export default function NewPrediction() {
  const [form, setForm] = useState(initialState());
  const [busy, setBusy] = useState(false);
  const nav = useNavigate();

  const setVal = (name, raw) => {
    setForm((f) => ({ ...f, [name]: raw === "" ? "" : Number(raw) }));
  };

  const submit = async (e) => {
    e.preventDefault();
    // Final validation
    for (const g of GROUPS) {
      for (const f of g.fields) {
        const v = form[f.name];
        if (v === "" || isNaN(v)) {
          toast.error(`Please fill ${f.label}`);
          return;
        }
      }
    }
    setBusy(true);
    try {
      const { data } = await api.post("/predict", form);
      toast.success("Prediction completed");
      nav(`/result/${data.id}`);
    } catch (err) {
      toast.error(err.response?.data?.detail || "Prediction failed");
    } finally {
      setBusy(false);
    }
  };

  return (
    <AppShell>
      <div className="mb-8">
        <h1 className="font-display text-3xl sm:text-4xl font-extrabold tracking-tight text-stone-900" data-testid="predict-title">
          New Prediction
        </h1>
        <p className="text-stone-500 mt-2">Enter patient parameters across the three groups below.</p>
      </div>

      <form onSubmit={submit} className="space-y-6" data-testid="predict-form">
        {GROUPS.map((g) => (
          <section key={g.title} className="bg-white border border-stone-200 rounded-lg shadow-sm p-6 md:p-8">
            <div className="mb-5">
              <h3 className="font-display text-lg sm:text-xl font-semibold tracking-tight text-stone-900">{g.title}</h3>
              <p className="text-sm text-stone-500">{g.subtitle}</p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {g.fields.map((f) => (
                <div key={f.name}>
                  <Label htmlFor={f.name} className="text-xs font-semibold tracking-[0.05em] uppercase text-stone-500">
                    {f.label}
                  </Label>
                  <Input
                    id={f.name}
                    type="number"
                    step={f.step}
                    min={f.min}
                    max={f.max}
                    value={form[f.name]}
                    onChange={(e) => setVal(f.name, e.target.value)}
                    data-testid={`input-${f.name}`}
                    className="mt-1.5 bg-white border-stone-300"
                    required
                  />
                  <div className="text-[10px] text-stone-400 mt-1">Range {f.min}–{f.max}</div>
                </div>
              ))}
            </div>
          </section>
        ))}

        <div className="flex justify-end gap-3 pt-2">
          <Button
            type="button"
            variant="outline"
            data-testid="reset-button"
            onClick={() => setForm(initialState())}
            className="border-stone-300"
          >
            Reset
          </Button>
          <Button
            type="submit"
            disabled={busy}
            data-testid="submit-prediction"
            className="bg-sky-700 hover:bg-sky-800 text-white"
          >
            {busy ? <Loader2 size={16} className="mr-2 animate-spin" /> : <ArrowRight size={16} className="mr-2" />}
            {busy ? "Analyzing…" : "Run prediction"}
          </Button>
        </div>
      </form>
    </AppShell>
  );
}
