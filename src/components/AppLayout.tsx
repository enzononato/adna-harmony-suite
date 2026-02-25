import { useState } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import { CalendarDays, Users, BarChart3, LogOut, Menu, X } from "lucide-react";
import { useAuth } from "@/components/AuthProvider";
import logoPlaceholder from "@/assets/logo-placeholder.png";

const navItems = [
  { to: "/agenda", icon: CalendarDays, label: "Agenda" },
  { to: "/pacientes", icon: Users, label: "Pacientes" },
  { to: "/financeiro", icon: BarChart3, label: "Financeiro" },
];

const AppLayout = ({ children }: { children: React.ReactNode }) => {
  const navigate = useNavigate();
  const { signOut } = useAuth();
  const [open, setOpen] = useState(false);

  return (
    <div className="min-h-screen flex" style={{ background: "hsl(var(--background))" }}>
      {/* Sidebar desktop */}
      <aside className="hidden md:flex flex-col w-60 h-screen sticky top-0 flex-shrink-0" style={{ background: "var(--gradient-sidebar)" }}>
        <SidebarContent onSignOut={async () => { await signOut(); navigate("/"); }} />
      </aside>

      {/* Mobile sidebar overlay */}
      {open && (
        <div className="fixed inset-0 z-50 flex md:hidden">
          <div className="absolute inset-0 bg-foreground/40 backdrop-blur-sm" onClick={() => setOpen(false)} />
          <aside className="relative z-10 flex flex-col w-60 min-h-screen" style={{ background: "var(--gradient-sidebar)" }}>
            <button onClick={() => setOpen(false)} className="absolute top-4 right-4 text-sidebar-foreground/60 hover:text-sidebar-foreground">
              <X size={20} />
            </button>
            <SidebarContent onSignOut={async () => { await signOut(); navigate("/"); }} onNav={() => setOpen(false)} />
          </aside>
        </div>
      )}

      {/* Main */}
      <div className="flex-1 flex flex-col min-h-screen overflow-hidden">
        {/* Mobile top bar */}
        <header className="md:hidden flex items-center gap-3 px-4 py-3 border-b border-border bg-card shadow-soft">
          <button onClick={() => setOpen(true)} className="text-foreground">
            <Menu size={22} />
          </button>
          <div className="flex items-center gap-2">
            <img src={logoPlaceholder} alt="Instituto Adna Thuane" className="w-7 h-7 object-contain" />
            <span className="font-display text-lg" style={{ color: "hsl(var(--primary))" }}>Instituto Adna Thuane</span>
          </div>
        </header>

        <main className="flex-1 overflow-auto p-4 md:p-8">
          {children}
        </main>
      </div>
    </div>
  );
};

const SidebarContent = ({ onSignOut, onNav }: { onSignOut: () => void; onNav?: () => void }) => (
  <div className="flex flex-col h-full">
    {/* Brand */}
    <div className="px-6 pt-8 pb-6 flex flex-col items-center gap-2 border-b border-sidebar-border">
      <img src={logoPlaceholder} alt="logo" className="w-14 h-14 object-contain opacity-90" />
      <div className="text-center">
        <p className="text-[9px] uppercase tracking-[0.25em] text-sidebar-foreground/50 font-body">Instituto</p>
        <h2 className="text-base font-display leading-tight" style={{ color: "hsl(var(--sidebar-primary))" }}>Adna Thuane</h2>
        <p className="text-[9px] uppercase tracking-[0.18em] text-sidebar-foreground/40 font-body mt-0.5">Biomedicina Estética</p>
      </div>
    </div>

    {/* Nav */}
    <nav className="flex-1 px-3 py-6 flex flex-col gap-1">
      {navItems.map(({ to, icon: Icon, label }) => (
        <NavLink
          key={to}
          to={to}
          onClick={onNav}
          className={({ isActive }) =>
            `flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-body font-medium transition-all ${
              isActive
                ? "text-sidebar-primary-foreground"
                : "text-sidebar-foreground/60 hover:text-sidebar-foreground hover:bg-sidebar-accent"
            }`
          }
          style={({ isActive }) =>
            isActive ? { background: "hsl(var(--sidebar-primary))", color: "hsl(var(--sidebar-primary-foreground))" } : {}
          }
        >
          <Icon size={17} />
          <span>{label}</span>
        </NavLink>
      ))}
    </nav>

    {/* Footer */}
    <div className="px-3 pb-6">
      <div className="h-px bg-sidebar-border mb-4" />
      <button
        onClick={onSignOut}
        className="w-full flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm font-body text-sidebar-foreground/50 hover:text-sidebar-foreground hover:bg-sidebar-accent transition-all"
      >
        <LogOut size={15} />
        <span>Sair</span>
      </button>
    </div>
  </div>
);

export default AppLayout;
