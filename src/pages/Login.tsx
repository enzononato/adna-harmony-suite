import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Eye, EyeOff, Lock, Mail } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/components/AuthProvider";
import { useEffect } from "react";
import logoPlaceholder from "@/assets/logo-placeholder.png";

const Login = () => {
  const navigate = useNavigate();
  const { session } = useAuth();
  const [showPassword, setShowPassword] = useState(false);
  const [form, setForm] = useState({ email: "", password: "" });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (session) navigate("/agenda", { replace: true });
  }, [session, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    const { error } = await supabase.auth.signInWithPassword({
      email: form.email,
      password: form.password,
    });
    if (error) {
      setError("E-mail ou senha incorretos.");
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center relative overflow-hidden" style={{ background: "linear-gradient(135deg, hsl(36 30% 95%), hsl(43 40% 92%))" }}>
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none select-none opacity-[0.04]">
        <img src={logoPlaceholder} alt="" className="w-[70vw] max-w-2xl" />
      </div>
      <div className="absolute top-[-80px] right-[-80px] w-72 h-72 rounded-full" style={{ background: "radial-gradient(circle, hsl(43 72% 47% / 0.12), transparent 70%)" }} />
      <div className="absolute bottom-[-60px] left-[-60px] w-56 h-56 rounded-full" style={{ background: "radial-gradient(circle, hsl(12 72% 72% / 0.12), transparent 70%)" }} />

      <div className="relative z-10 w-full max-w-sm mx-4 bg-card rounded-2xl shadow-card border border-border/60 overflow-hidden">
        <div className="h-1 w-full" style={{ background: "var(--gradient-gold)" }} />
        <div className="px-8 pt-10 pb-10 flex flex-col items-center gap-6">
          <div className="flex flex-col items-center gap-3">
            <img src={logoPlaceholder} alt="Instituto Adna Thuane" className="w-24 h-24 object-contain" />
            <div className="text-center">
              <p className="text-xs uppercase tracking-[0.25em] text-muted-foreground font-body">Instituto</p>
              <h1 className="text-2xl font-display leading-tight tracking-wide" style={{ color: "hsl(var(--primary))" }}>
                Adna Thuane
              </h1>
              <p className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground mt-0.5 font-body">Biomedicina Estética</p>
            </div>
          </div>

          <div className="w-12 h-px" style={{ background: "hsl(var(--gold))" }} />

          <form onSubmit={handleSubmit} className="w-full flex flex-col gap-4">
            <div className="flex flex-col gap-1.5">
              <label className="text-xs uppercase tracking-widest text-muted-foreground font-body">E-mail</label>
              <div className="relative">
                <Mail size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
                <input
                  type="email"
                  value={form.email}
                  onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
                  className="w-full pl-10 pr-4 py-2.5 rounded-lg bg-muted border border-border text-sm font-body focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all"
                  placeholder="seu@email.com"
                  required
                />
              </div>
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-xs uppercase tracking-widest text-muted-foreground font-body">Senha</label>
              <div className="relative">
                <Lock size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
                <input
                  type={showPassword ? "text" : "password"}
                  value={form.password}
                  onChange={e => setForm(f => ({ ...f, password: e.target.value }))}
                  className="w-full pl-10 pr-10 py-2.5 rounded-lg bg-muted border border-border text-sm font-body focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all"
                  placeholder="••••••••"
                  required
                />
                <button type="button" onClick={() => setShowPassword(p => !p)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors">
                  {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
              </div>
            </div>

            {error && <p className="text-xs text-destructive text-center font-body">{error}</p>}

            <button
              type="submit"
              disabled={loading}
              className="mt-1 w-full py-3 rounded-lg text-sm font-body font-medium tracking-widest uppercase transition-all hover:opacity-90 active:scale-[0.98] disabled:opacity-60"
              style={{ background: "var(--gradient-gold)", color: "hsl(var(--primary-foreground))", boxShadow: "var(--shadow-gold)" }}
            >
              {loading ? "Entrando..." : "Entrar"}
            </button>
          </form>

          <p className="text-[10px] text-muted-foreground font-body text-center tracking-wide">
            Sistema exclusivo · Instituto Adna Thuane
          </p>
        </div>
      </div>
    </div>
  );
};

export default Login;
