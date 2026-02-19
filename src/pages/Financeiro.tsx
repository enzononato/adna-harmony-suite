import AppLayout from "@/components/AppLayout";
import { TrendingUp, TrendingDown, DollarSign, CreditCard, CheckCircle, Clock, XCircle } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, PieChart, Pie, Cell } from "recharts";

const monthlyData = [
  { mes: "Jan", entradas: 18400, saidas: 6200 },
  { mes: "Fev", entradas: 22100, saidas: 7100 },
  { mes: "Mar", entradas: 19800, saidas: 5800 },
  { mes: "Abr", entradas: 25600, saidas: 8300 },
  { mes: "Mai", entradas: 28200, saidas: 9100 },
  { mes: "Jun", entradas: 31500, saidas: 10200 },
];

const pieData = [
  { name: "Toxina Botulínica", value: 38 },
  { name: "Preenchimentos", value: 28 },
  { name: "Bioestimuladores", value: 20 },
  { name: "Outros", value: 14 },
];
const PIE_COLORS = ["hsl(43,72%,47%)", "hsl(12,72%,72%)", "hsl(36,20%,70%)", "hsl(20,15%,60%)"];

const payments = [
  { patient: "Ana Paula Souza", procedure: "Toxina Botulínica", value: 1200, status: "pago" },
  { patient: "Carla Mendes", procedure: "Preenchimento Labial", value: 1800, status: "pago" },
  { patient: "Fernanda Lima", procedure: "Bioestimulador", value: 3200, status: "pendente" },
  { patient: "Juliana Costa", procedure: "Skinbooster", value: 950, status: "pago" },
  { patient: "Mariana Rocha", procedure: "Fios de PDO", value: 2800, status: "cancelado" },
];

const statusConfig = {
  pago: { label: "Pago", icon: CheckCircle, color: "#22c55e", bg: "hsl(142 70% 45% / 0.1)" },
  pendente: { label: "Pendente", icon: Clock, color: "hsl(43,72%,47%)", bg: "hsl(43 72% 47% / 0.1)" },
  cancelado: { label: "Cancelado", icon: XCircle, color: "hsl(0,72%,58%)", bg: "hsl(0 72% 58% / 0.1)" },
};

const fmt = (v: number) => `R$ ${v.toLocaleString("pt-BR")}`;

const StatCard = ({ icon: Icon, label, value, sub, accent }: { icon: typeof DollarSign; label: string; value: string; sub: string; accent: string }) => (
  <div className="bg-card rounded-2xl border border-border shadow-card p-5 flex flex-col gap-3">
    <div className="flex items-center justify-between">
      <p className="text-xs uppercase tracking-widest text-muted-foreground font-body">{label}</p>
      <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: accent + "20" }}>
        <Icon size={17} style={{ color: accent }} />
      </div>
    </div>
    <div>
      <p className="text-2xl font-display font-medium">{value}</p>
      <p className="text-xs text-muted-foreground font-body mt-0.5">{sub}</p>
    </div>
  </div>
);

const Financeiro = () => {
  const totalEntradas = monthlyData[monthlyData.length - 1].entradas;
  const totalSaidas = monthlyData[monthlyData.length - 1].saidas;
  const lucro = totalEntradas - totalSaidas;

  return (
    <AppLayout>
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground font-body mb-1">Gerenciamento</p>
          <h1 className="text-3xl font-display">Financeiro</h1>
          <p className="text-sm text-muted-foreground font-body mt-1">Junho 2025 · Resumo do mês</p>
        </div>

        {/* KPI Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <StatCard icon={TrendingUp} label="Faturamento" value={fmt(totalEntradas)} sub="+11.7% vs maio" accent="hsl(43,72%,47%)" />
          <StatCard icon={TrendingDown} label="Saídas" value={fmt(totalSaidas)} sub="+12.1% vs maio" accent="hsl(12,72%,72%)" />
          <StatCard icon={DollarSign} label="Lucro Líquido" value={fmt(lucro)} sub="Margem 67.6%" accent="#22c55e" />
          <StatCard icon={CreditCard} label="A Receber" value="R$ 5.750" sub="3 pagamentos pendentes" accent="hsl(20,25%,50%)" />
        </div>

        {/* Charts row */}
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_280px] gap-5 mb-5">
          {/* Bar chart */}
          <div className="bg-card rounded-2xl border border-border shadow-card p-5">
            <h3 className="font-display text-lg mb-1">Entradas vs Saídas</h3>
            <p className="text-xs text-muted-foreground font-body mb-5">Últimos 6 meses</p>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={monthlyData} barGap={4}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(36 20% 88%)" vertical={false} />
                <XAxis dataKey="mes" tick={{ fontSize: 11, fontFamily: "Jost", fill: "hsl(20 15% 50%)" }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 10, fontFamily: "Jost", fill: "hsl(20 15% 50%)" }} axisLine={false} tickLine={false} tickFormatter={v => `${v / 1000}k`} />
                <Tooltip formatter={(v: number) => fmt(v)} contentStyle={{ fontFamily: "Jost", fontSize: 12, borderRadius: 10, border: "1px solid hsl(36 20% 88%)" }} />
                <Bar dataKey="entradas" name="Entradas" fill="hsl(43,72%,47%)" radius={[4, 4, 0, 0]} />
                <Bar dataKey="saidas" name="Saídas" fill="hsl(12,72%,72%)" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Pie chart */}
          <div className="bg-card rounded-2xl border border-border shadow-card p-5">
            <h3 className="font-display text-lg mb-1">Por Procedimento</h3>
            <p className="text-xs text-muted-foreground font-body mb-3">Faturamento por categoria</p>
            <div className="flex justify-center">
              <PieChart width={180} height={160}>
                <Pie data={pieData} cx={90} cy={75} innerRadius={48} outerRadius={72} paddingAngle={3} dataKey="value">
                  {pieData.map((_, i) => <Cell key={i} fill={PIE_COLORS[i]} />)}
                </Pie>
                <Tooltip formatter={(v: number) => `${v}%`} contentStyle={{ fontFamily: "Jost", fontSize: 11, borderRadius: 8 }} />
              </PieChart>
            </div>
            <div className="flex flex-col gap-2 mt-1">
              {pieData.map((d, i) => (
                <div key={d.name} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: PIE_COLORS[i] }} />
                    <span className="text-[11px] font-body text-muted-foreground">{d.name}</span>
                  </div>
                  <span className="text-[11px] font-body font-medium">{d.value}%</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Line chart */}
        <div className="bg-card rounded-2xl border border-border shadow-card p-5 mb-5">
          <h3 className="font-display text-lg mb-1">Evolução do Faturamento</h3>
          <p className="text-xs text-muted-foreground font-body mb-5">Tendência mensal</p>
          <ResponsiveContainer width="100%" height={160}>
            <LineChart data={monthlyData}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(36 20% 88%)" vertical={false} />
              <XAxis dataKey="mes" tick={{ fontSize: 11, fontFamily: "Jost", fill: "hsl(20 15% 50%)" }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 10, fontFamily: "Jost", fill: "hsl(20 15% 50%)" }} axisLine={false} tickLine={false} tickFormatter={v => `${v / 1000}k`} />
              <Tooltip formatter={(v: number) => fmt(v)} contentStyle={{ fontFamily: "Jost", fontSize: 12, borderRadius: 10, border: "1px solid hsl(36 20% 88%)" }} />
              <Line type="monotone" dataKey="entradas" name="Faturamento" stroke="hsl(43,72%,47%)" strokeWidth={2.5} dot={{ fill: "hsl(43,72%,47%)", r: 4 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Payments table */}
        <div className="bg-card rounded-2xl border border-border shadow-card overflow-hidden">
          <div className="px-5 py-4 border-b border-border">
            <h3 className="font-display text-lg">Controle de Pagamentos</h3>
            <p className="text-xs text-muted-foreground font-body mt-0.5">Junho 2025</p>
          </div>
          <div className="divide-y divide-border">
            {payments.map((p, i) => {
              const s = statusConfig[p.status as keyof typeof statusConfig];
              const Icon = s.icon;
              return (
                <div key={i} className="flex items-center justify-between px-5 py-3.5 hover:bg-muted/40 transition-colors">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-body font-medium truncate">{p.patient}</p>
                    <p className="text-xs text-muted-foreground font-body">{p.procedure}</p>
                  </div>
                  <div className="flex items-center gap-4 ml-4">
                    <p className="text-sm font-body font-medium whitespace-nowrap">{fmt(p.value)}</p>
                    <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-body font-medium whitespace-nowrap" style={{ background: s.bg, color: s.color }}>
                      <Icon size={11} />
                      {s.label}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </AppLayout>
  );
};

export default Financeiro;
