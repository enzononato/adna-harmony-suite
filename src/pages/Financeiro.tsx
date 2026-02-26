import { useState, useEffect } from "react";
import AppLayout from "@/components/AppLayout";
import { TrendingUp, TrendingDown, DollarSign, CreditCard, CheckCircle, Clock, XCircle, Plus, X, ArrowUpCircle, ArrowDownCircle, Tag, Pencil, Save, Search, Filter } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line } from "recharts";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import ProcedimentoMultiSelect from "@/components/ProcedimentoMultiSelect";

// Types
type Procedimento = { id: string; nome: string; preco: number | null; duracao_minutos: number | null; dias_retorno: number | null };
type Paciente = { id: string; nome: string };
type EntradaProcedimento = { entrada_id: string; procedimento_id: string };
type Entrada = { id: string; paciente_nome: string; procedimento_id: string; valor: number; forma_pagamento: string; observacoes: string | null; data: string; created_at: string };
type Saida = { id: string; descricao: string; categoria: string; valor: number; observacoes: string | null; data: string; created_at: string };

const CATEGORIAS_SAIDA = ["Aluguel", "Produtos", "Equipamentos", "Marketing", "Funcionários", "Manutenção", "Impostos", "Outros"];
const FORMAS_PAGAMENTO = ["Dinheiro", "PIX", "Cartão de Crédito", "Cartão de Débito", "Transferência"];

const fmt = (v: number) => `R$ ${v.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`;
const fmtDate = (d: string) => new Date(d + "T00:00:00").toLocaleDateString("pt-BR");

const PIE_COLORS = ["hsl(43,72%,47%)", "hsl(12,72%,72%)", "hsl(36,20%,70%)", "hsl(20,15%,60%)", "#22c55e", "hsl(200,60%,50%)", "hsl(280,40%,60%)", "hsl(160,50%,45%)", "hsl(30,80%,55%)", "hsl(350,60%,55%)", "hsl(90,40%,50%)", "hsl(220,50%,55%)"];

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
  const [activeTab, setActiveTab] = useState<"financeiro" | "precos">("financeiro");
  const [procedimentos, setProcedimentos] = useState<Procedimento[]>([]);
  const [pacientes, setPacientes] = useState<Paciente[]>([]);
  const [entradas, setEntradas] = useState<Entrada[]>([]);
  const [saidas, setSaidas] = useState<Saida[]>([]);
  const [entradaProcedimentos, setEntradaProcedimentos] = useState<EntradaProcedimento[]>([]);
  const [showEntradaModal, setShowEntradaModal] = useState(false);
  const [showSaidaModal, setShowSaidaModal] = useState(false);
  const [loading, setLoading] = useState(true);
  const [editingPreco, setEditingPreco] = useState<string | null>(null);
  const [precoValue, setPrecoValue] = useState("");
  const [editingDuracao, setEditingDuracao] = useState<string | null>(null);
  const [duracaoValue, setDuracaoValue] = useState("");
  const [editingRetorno, setEditingRetorno] = useState<string | null>(null);
  const [retornoValue, setRetornoValue] = useState("");

  // Entrada form - multi-procedure
  const [ePaciente, setEPaciente] = useState("");
  const [eProcedimentos, setEProcedimentos] = useState<string[]>([]);
  const [eValor, setEValor] = useState("");
  const [ePagamento, setEPagamento] = useState("PIX");
  const [eObs, setEObs] = useState("");
  const [eData, setEData] = useState(new Date().toISOString().slice(0, 10));

  // Saida form
  const [sDescricao, setSDescricao] = useState("");
  const [sCategoria, setSCategoria] = useState("Produtos");
  const [sValor, setSValor] = useState("");
  const [sObs, setSObs] = useState("");
  const [sData, setSData] = useState(new Date().toISOString().slice(0, 10));

  // Filters
  const [filterTipo, setFilterTipo] = useState<"todos" | "entrada" | "saida">("todos");
  const [filterBusca, setFilterBusca] = useState("");
  const [filterDataInicio, setFilterDataInicio] = useState("");
  const [filterDataFim, setFilterDataFim] = useState("");
  const [filterCategoria, setFilterCategoria] = useState("");
  const [filterPagamento, setFilterPagamento] = useState("");
  const [filterProcedimento, setFilterProcedimento] = useState("");
  const [filterPaciente, setFilterPaciente] = useState("");
  const [detailTransaction, setDetailTransaction] = useState<any | null>(null);

  const fetchData = async () => {
    setLoading(true);
    const [procRes, pacRes, entRes, saiRes, epRes] = await Promise.all([
      supabase.from("procedimentos").select("*").order("nome"),
      supabase.from("pacientes").select("id, nome").order("nome"),
      supabase.from("entradas").select("*").order("data", { ascending: false }),
      supabase.from("saidas").select("*").order("data", { ascending: false }),
      supabase.from("entrada_procedimentos").select("entrada_id, procedimento_id"),
    ]);
    if (procRes.data) setProcedimentos(procRes.data);
    if (pacRes.data) setPacientes(pacRes.data);
    if (entRes.data) setEntradas(entRes.data as Entrada[]);
    if (saiRes.data) setSaidas(saiRes.data as Saida[]);
    if (epRes.data) setEntradaProcedimentos(epRes.data as EntradaProcedimento[]);
    setLoading(false);
  };

  useEffect(() => { fetchData(); }, []);

  // Get procedure names for an entrada
  const getEntradaProcNames = (entradaId: string) => {
    const eps = entradaProcedimentos.filter(ep => ep.entrada_id === entradaId);
    if (eps.length > 0) {
      return eps.map(ep => procMap[ep.procedimento_id] || "").filter(Boolean).join(", ");
    }
    const entrada = entradas.find(e => e.id === entradaId);
    return entrada ? (procMap[entrada.procedimento_id] || "Procedimento") : "Procedimento";
  };

  // Get procedure IDs for an entrada
  const getEntradaProcIds = (entradaId: string) => {
    const eps = entradaProcedimentos.filter(ep => ep.entrada_id === entradaId);
    if (eps.length > 0) return eps.map(ep => ep.procedimento_id);
    const entrada = entradas.find(e => e.id === entradaId);
    return entrada?.procedimento_id ? [entrada.procedimento_id] : [];
  };

  const recalcEntradaValor = (procIds: string[]) => {
    const total = procIds.reduce((sum, id) => {
      const p = procedimentos.find(pr => pr.id === id);
      return sum + (p?.preco ? Number(p.preco) : 0);
    }, 0);
    return total > 0 ? String(total) : "";
  };

  const handleAddEntrada = async () => {
    if (!ePaciente || eProcedimentos.length === 0 || !eValor) { toast.error("Preencha paciente, procedimento(s) e valor."); return; }
    const { data: newEntrada, error } = await supabase.from("entradas").insert({
      paciente_nome: ePaciente, procedimento_id: eProcedimentos[0], valor: parseFloat(eValor),
      forma_pagamento: ePagamento, observacoes: eObs || null, data: eData,
    }).select("id").single();
    if (error || !newEntrada) { toast.error("Erro ao salvar entrada."); return; }

    // Insert junction rows
    for (const procId of eProcedimentos) {
      await supabase.from("entrada_procedimentos").insert({
        entrada_id: newEntrada.id,
        procedimento_id: procId,
      } as any);
    }

    toast.success("Entrada registrada!");
    setShowEntradaModal(false);
    setEPaciente(""); setEProcedimentos([]); setEValor(""); setEObs("");
    fetchData();
  };

  const handleAddSaida = async () => {
    if (!sDescricao || !sValor) { toast.error("Preencha descrição e valor."); return; }
    const { error } = await supabase.from("saidas").insert({
      descricao: sDescricao, categoria: sCategoria, valor: parseFloat(sValor),
      observacoes: sObs || null, data: sData,
    });
    if (error) { toast.error("Erro ao salvar saída."); return; }
    toast.success("Saída registrada!");
    setShowSaidaModal(false);
    setSDescricao(""); setSValor(""); setSObs("");
    fetchData();
  };

  const handleDeleteEntrada = async (id: string) => {
    const { error } = await supabase.from("entradas").delete().eq("id", id);
    if (error) { toast.error("Erro ao excluir."); return; }
    toast.success("Entrada excluída.");
    fetchData();
  };

  const handleDeleteSaida = async (id: string) => {
    const { error } = await supabase.from("saidas").delete().eq("id", id);
    if (error) { toast.error("Erro ao excluir."); return; }
    toast.success("Saída excluída.");
    fetchData();
  };

  const handleSavePreco = async (procId: string) => {
    const valor = precoValue ? parseFloat(precoValue) : null;
    const { error } = await supabase.from("procedimentos").update({ preco: valor } as any).eq("id", procId);
    if (error) { toast.error("Erro ao salvar preço."); return; }
    toast.success("Preço atualizado!");
    setEditingPreco(null);
    setPrecoValue("");
    fetchData();
  };

  const handleSaveDuracao = async (procId: string) => {
    const valor = duracaoValue ? parseInt(duracaoValue) : null;
    const { error } = await supabase.from("procedimentos").update({ duracao_minutos: valor } as any).eq("id", procId);
    if (error) { toast.error("Erro ao salvar duração."); return; }
    if (valor != null) {
      await supabase.from("agendamentos").update({ duracao_minutos: valor } as any).eq("procedimento_id", procId).is("duracao_minutos", null);
    }
    toast.success("Duração atualizada!");
    setEditingDuracao(null);
    setDuracaoValue("");
    fetchData();
  };

  const handleSaveRetorno = async (procId: string) => {
    const valor = retornoValue ? parseInt(retornoValue) : null;
    const { error } = await supabase.from("procedimentos").update({ dias_retorno: valor } as any).eq("id", procId);
    if (error) { toast.error("Erro ao salvar retorno."); return; }
    toast.success("Retorno atualizado!");
    setEditingRetorno(null);
    setRetornoValue("");
    fetchData();
  };

  // Computations
  const totalEntradas = entradas.reduce((s, e) => s + Number(e.valor), 0);
  const totalSaidas = saidas.reduce((s, e) => s + Number(e.valor), 0);
  const lucro = totalEntradas - totalSaidas;

  const procMap = Object.fromEntries(procedimentos.map(p => [p.id, p.nome]));

  // Pie data: revenue by procedure (using junction table)
  const pieAgg: Record<string, number> = {};
  entradas.forEach(e => {
    const procIds = getEntradaProcIds(e.id);
    const names = procIds.map(id => procMap[id] || "").filter(Boolean);
    const label = names.length > 0 ? names.join(", ") : "Outro";
    pieAgg[label] = (pieAgg[label] || 0) + Number(e.valor);
  });
  const pieData = Object.entries(pieAgg).map(([name, value]) => ({ name, value })).sort((a, b) => b.value - a.value);

  // Monthly bar chart (last 6 months)
  const monthlyAgg: Record<string, { entradas: number; saidas: number }> = {};
  const months = ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun", "Jul", "Ago", "Set", "Out", "Nov", "Dez"];
  entradas.forEach(e => { const d = new Date(e.data + "T00:00:00"); const key = `${d.getFullYear()}-${d.getMonth()}`; if (!monthlyAgg[key]) monthlyAgg[key] = { entradas: 0, saidas: 0 }; monthlyAgg[key].entradas += Number(e.valor); });
  saidas.forEach(e => { const d = new Date(e.data + "T00:00:00"); const key = `${d.getFullYear()}-${d.getMonth()}`; if (!monthlyAgg[key]) monthlyAgg[key] = { entradas: 0, saidas: 0 }; monthlyAgg[key].saidas += Number(e.valor); });
  const monthlyData = Object.entries(monthlyAgg)
    .map(([key, v]) => { const [y, m] = key.split("-").map(Number); return { mes: `${months[m]}/${y.toString().slice(2)}`, entradas: v.entradas, saidas: v.saidas, sort: y * 12 + m }; })
    .sort((a, b) => a.sort - b.sort).slice(-6);

  // Combined list for display
  const allTransactions = [
    ...entradas.map(e => ({ ...e, tipo: "entrada" as const, descricao: `${e.paciente_nome} — ${getEntradaProcNames(e.id)}`, categoria: e.forma_pagamento })),
    ...saidas.map(s => ({ ...s, tipo: "saida" as const, paciente_nome: "", procedimento_id: "" })),
  ].sort((a, b) => new Date(b.data).getTime() - new Date(a.data).getTime());

  // Filtered transactions
  const filteredTransactions = allTransactions.filter(t => {
    if (filterTipo !== "todos" && t.tipo !== filterTipo) return false;
    if (filterBusca) {
      const q = filterBusca.toLowerCase();
      if (!t.descricao.toLowerCase().includes(q) && !t.categoria.toLowerCase().includes(q)) return false;
    }
    if (filterDataInicio && t.data < filterDataInicio) return false;
    if (filterDataFim && t.data > filterDataFim) return false;
    if (filterCategoria && t.tipo === "saida") {
      const saida = saidas.find(s => s.id === t.id);
      if (!saida || saida.categoria !== filterCategoria) return false;
    }
    if (filterCategoria && t.tipo === "entrada") return false;
    if (filterPagamento && t.tipo === "entrada") {
      if (t.categoria !== filterPagamento) return false;
    }
    if (filterPagamento && t.tipo === "saida") return false;
    if (filterProcedimento) {
      if (t.tipo !== "entrada") return false;
      const procIds = getEntradaProcIds(t.id);
      if (!procIds.includes(filterProcedimento)) return false;
    }
    if (filterPaciente) {
      if (t.tipo !== "entrada" || t.paciente_nome !== filterPaciente) return false;
    }
    return true;
  });

  const hasActiveFilters = filterTipo !== "todos" || filterBusca || filterDataInicio || filterDataFim || filterCategoria || filterPagamento || filterProcedimento || filterPaciente;

  const uniquePacientes = [...new Set(entradas.map(e => e.paciente_nome))].sort();

  const inputCls = "w-full rounded-xl border border-border bg-background px-3 py-2.5 text-sm font-body focus:outline-none focus:ring-2 focus:ring-primary/30 transition-all";
  const labelCls = "text-xs uppercase tracking-widest text-muted-foreground font-body mb-1 block";

  return (
    <AppLayout>
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <div className="mb-6 flex items-end justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground font-body mb-1">Gerenciamento</p>
            <h1 className="text-3xl font-display">Financeiro</h1>
            <p className="text-sm text-muted-foreground font-body mt-1">Controle detalhado de entradas e saídas</p>
          </div>
          {activeTab === "financeiro" && (
            <div className="flex gap-2">
              <button onClick={() => setShowEntradaModal(true)} className="flex items-center gap-2 bg-primary text-primary-foreground px-4 py-2.5 rounded-xl text-sm font-body font-medium hover:opacity-90 transition-opacity">
                <ArrowUpCircle size={16} /> Nova Entrada
              </button>
              <button onClick={() => setShowSaidaModal(true)} className="flex items-center gap-2 bg-muted text-foreground px-4 py-2.5 rounded-xl text-sm font-body font-medium hover:bg-muted/70 transition-colors border border-border">
                <ArrowDownCircle size={16} /> Nova Saída
              </button>
            </div>
          )}
        </div>

        {/* Tabs */}
        <div className="flex gap-1 mb-6 bg-muted rounded-xl p-1 w-fit">
          <button
            onClick={() => setActiveTab("financeiro")}
            className={`px-4 py-2 rounded-lg text-sm font-body font-medium transition-all ${activeTab === "financeiro" ? "bg-card text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"}`}
          >
            <span className="flex items-center gap-2"><DollarSign size={15} /> Movimentações</span>
          </button>
          <button
            onClick={() => setActiveTab("precos")}
            className={`px-4 py-2 rounded-lg text-sm font-body font-medium transition-all ${activeTab === "precos" ? "bg-card text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"}`}
          >
            <span className="flex items-center gap-2"><Tag size={15} /> Preços</span>
          </button>
        </div>

        {activeTab === "financeiro" && (<>
        {/* KPI Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <StatCard icon={TrendingUp} label="Entradas" value={fmt(totalEntradas)} sub={`${entradas.length} procedimentos`} accent="hsl(43,72%,47%)" />
          <StatCard icon={TrendingDown} label="Saídas" value={fmt(totalSaidas)} sub={`${saidas.length} despesas`} accent="hsl(12,72%,72%)" />
          <StatCard icon={DollarSign} label="Lucro Líquido" value={fmt(lucro)} sub={totalEntradas > 0 ? `Margem ${((lucro / totalEntradas) * 100).toFixed(1)}%` : "—"} accent="#22c55e" />
          <StatCard icon={CreditCard} label="Transações" value={`${entradas.length + saidas.length}`} sub="Total registrado" accent="hsl(20,25%,50%)" />
        </div>

        {/* Charts row */}
        {monthlyData.length > 0 && (
          <div className="grid grid-cols-1 lg:grid-cols-[1fr_280px] gap-5 mb-5">
            <div className="bg-card rounded-2xl border border-border shadow-card p-5">
              <h3 className="font-display text-lg mb-1">Entradas vs Saídas</h3>
              <p className="text-xs text-muted-foreground font-body mb-5">Por mês</p>
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={monthlyData} barGap={4}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(36 20% 88%)" vertical={false} />
                  <XAxis dataKey="mes" tick={{ fontSize: 11, fontFamily: "Jost", fill: "hsl(20 15% 50%)" }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 10, fontFamily: "Jost", fill: "hsl(20 15% 50%)" }} axisLine={false} tickLine={false} tickFormatter={v => `${(v / 1000).toFixed(0)}k`} />
                  <Tooltip formatter={(v: number) => fmt(v)} contentStyle={{ fontFamily: "Jost", fontSize: 12, borderRadius: 10, border: "1px solid hsl(36 20% 88%)" }} />
                  <Bar dataKey="entradas" name="Entradas" fill="hsl(43,72%,47%)" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="saidas" name="Saídas" fill="hsl(12,72%,72%)" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>

            {pieData.length > 0 && (
              <div className="bg-card rounded-2xl border border-border shadow-card p-5">
                <h3 className="font-display text-lg mb-1">Por Procedimento</h3>
                <p className="text-xs text-muted-foreground font-body mb-3">Faturamento por categoria</p>
                <div className="flex justify-center">
                  <PieChart width={180} height={160}>
                    <Pie data={pieData} cx={90} cy={75} innerRadius={48} outerRadius={72} paddingAngle={3} dataKey="value">
                      {pieData.map((_, i) => <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />)}
                    </Pie>
                    <Tooltip formatter={(v: number) => fmt(v)} contentStyle={{ fontFamily: "Jost", fontSize: 11, borderRadius: 8 }} />
                  </PieChart>
                </div>
                <div className="flex flex-col gap-2 mt-1 max-h-32 overflow-y-auto">
                  {pieData.map((d, i) => (
                    <div key={d.name} className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: PIE_COLORS[i % PIE_COLORS.length] }} />
                        <span className="text-[11px] font-body text-muted-foreground">{d.name}</span>
                      </div>
                      <span className="text-[11px] font-body font-medium">{fmt(d.value)}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Transactions list */}
        <div className="bg-card rounded-2xl border border-border shadow-card p-5">
          <h3 className="font-display text-lg mb-1">Movimentações</h3>
          <p className="text-xs text-muted-foreground font-body mb-4">Todas as entradas e saídas</p>

          {/* Filters */}
          <div className="flex flex-wrap gap-2 mb-4">
            <div className="flex rounded-lg overflow-hidden border border-border bg-muted p-0.5 gap-0.5">
              {(["todos", "entrada", "saida"] as const).map(f => (
                <button key={f} onClick={() => setFilterTipo(f)}
                  className="px-3 py-1.5 text-xs font-body capitalize rounded-md transition-all"
                  style={filterTipo === f ? { background: "hsl(var(--card))", color: "hsl(var(--primary))", fontWeight: 600, boxShadow: "var(--shadow-soft)" } : { color: "hsl(var(--muted-foreground))" }}>
                  {f === "todos" ? "Todos" : f === "entrada" ? "Entradas" : "Saídas"}
                </button>
              ))}
            </div>
            <div className="relative flex-1 min-w-[180px]">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <input value={filterBusca} onChange={e => setFilterBusca(e.target.value)}
                className="w-full pl-9 pr-3 py-2 rounded-lg border border-border bg-muted text-sm font-body focus:outline-none focus:ring-2 focus:ring-primary/30"
                placeholder="Buscar..." />
            </div>
          </div>
          {/* Advanced filters */}
          <div className="flex flex-wrap gap-2 mb-4">
            <input type="date" value={filterDataInicio} onChange={e => setFilterDataInicio(e.target.value)}
              className="px-3 py-1.5 rounded-lg border border-border bg-muted text-xs font-body focus:outline-none focus:ring-2 focus:ring-primary/30" title="Data início" />
            <input type="date" value={filterDataFim} onChange={e => setFilterDataFim(e.target.value)}
              className="px-3 py-1.5 rounded-lg border border-border bg-muted text-xs font-body focus:outline-none focus:ring-2 focus:ring-primary/30" title="Data fim" />
            <select value={filterCategoria} onChange={e => setFilterCategoria(e.target.value)}
              className="px-3 py-1.5 rounded-lg border border-border bg-muted text-xs font-body focus:outline-none focus:ring-2 focus:ring-primary/30">
              <option value="">Categoria</option>
              {CATEGORIAS_SAIDA.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
            <select value={filterPagamento} onChange={e => setFilterPagamento(e.target.value)}
              className="px-3 py-1.5 rounded-lg border border-border bg-muted text-xs font-body focus:outline-none focus:ring-2 focus:ring-primary/30">
              <option value="">Pagamento</option>
              {FORMAS_PAGAMENTO.map(f => <option key={f} value={f}>{f}</option>)}
            </select>
            <select value={filterProcedimento} onChange={e => setFilterProcedimento(e.target.value)}
              className="px-3 py-1.5 rounded-lg border border-border bg-muted text-xs font-body focus:outline-none focus:ring-2 focus:ring-primary/30">
              <option value="">Procedimento</option>
              {procedimentos.map(p => <option key={p.id} value={p.id}>{p.nome}</option>)}
            </select>
            <select value={filterPaciente} onChange={e => setFilterPaciente(e.target.value)}
              className="px-3 py-1.5 rounded-lg border border-border bg-muted text-xs font-body focus:outline-none focus:ring-2 focus:ring-primary/30">
              <option value="">Paciente</option>
              {uniquePacientes.map(p => <option key={p} value={p}>{p}</option>)}
            </select>
            {hasActiveFilters && (
              <button onClick={() => { setFilterTipo("todos"); setFilterBusca(""); setFilterDataInicio(""); setFilterDataFim(""); setFilterCategoria(""); setFilterPagamento(""); setFilterProcedimento(""); setFilterPaciente(""); }}
                className="px-3 py-1.5 rounded-lg text-xs font-body text-destructive hover:bg-destructive/10 transition-colors flex items-center gap-1">
                <X size={12} /> Limpar filtros
              </button>
            )}
          </div>

          {/* Subtotal bar */}
          {hasActiveFilters && (
            <div className="flex flex-wrap gap-4 mb-4 p-3 rounded-xl bg-accent/50 border border-border">
              <div className="flex items-center gap-2">
                <ArrowUpCircle size={14} className="text-primary" />
                <span className="text-xs font-body text-muted-foreground">Entradas:</span>
                <span className="text-sm font-body font-medium text-primary">
                  {fmt(filteredTransactions.filter(t => t.tipo === "entrada").reduce((s, t) => s + Number(t.valor), 0))}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <ArrowDownCircle size={14} className="text-destructive" />
                <span className="text-xs font-body text-muted-foreground">Saídas:</span>
                <span className="text-sm font-body font-medium text-destructive">
                  {fmt(filteredTransactions.filter(t => t.tipo === "saida").reduce((s, t) => s + Number(t.valor), 0))}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <DollarSign size={14} className="text-foreground" />
                <span className="text-xs font-body text-muted-foreground">Saldo:</span>
                <span className="text-sm font-body font-medium">
                  {fmt(
                    filteredTransactions.filter(t => t.tipo === "entrada").reduce((s, t) => s + Number(t.valor), 0) -
                    filteredTransactions.filter(t => t.tipo === "saida").reduce((s, t) => s + Number(t.valor), 0)
                  )}
                </span>
              </div>
            </div>
          )}

          {/* Transaction rows */}
          <div className="flex flex-col gap-2">
            {filteredTransactions.length === 0 && (
              <p className="text-center text-sm text-muted-foreground font-body py-10">Nenhuma movimentação encontrada.</p>
            )}
            {filteredTransactions.map(t => (
              <div key={t.id + t.tipo} onClick={() => setDetailTransaction(t)}
                className="flex items-center gap-4 px-4 py-3 rounded-xl hover:bg-muted/60 transition-all cursor-pointer group border border-transparent hover:border-border">
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${t.tipo === "entrada" ? "bg-primary/10" : "bg-destructive/10"}`}>
                  {t.tipo === "entrada" ? <ArrowUpCircle size={16} className="text-primary" /> : <ArrowDownCircle size={16} className="text-destructive" />}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-body font-medium truncate">{t.descricao}</p>
                  <p className="text-xs text-muted-foreground font-body">{t.categoria} · {fmtDate(t.data)}</p>
                </div>
                <span className={`text-sm font-body font-semibold flex-shrink-0 ${t.tipo === "entrada" ? "text-primary" : "text-destructive"}`}>
                  {t.tipo === "entrada" ? "+" : "−"} {fmt(Number(t.valor))}
                </span>
                <button onClick={e => { e.stopPropagation(); t.tipo === "entrada" ? handleDeleteEntrada(t.id) : handleDeleteSaida(t.id); }}
                  className="text-muted-foreground hover:text-destructive opacity-0 group-hover:opacity-100 transition-all p-1">
                  <X size={14} />
                </button>
              </div>
            ))}
          </div>
        </div>
        </>)}

        {/* Preços tab */}
        {activeTab === "precos" && (
          <div className="bg-card rounded-2xl border border-border shadow-card p-6">
            <h3 className="font-display text-lg mb-1">Tabela de Preços e Referências</h3>
            <p className="text-xs text-muted-foreground font-body mb-5">Gerencie preços de referência, durações padrão e intervalos de retorno</p>
            {procedimentos.length === 0 ? (
              <p className="text-sm text-muted-foreground font-body text-center py-10">Nenhum procedimento cadastrado.</p>
            ) : (
              <div className="flex flex-col gap-3">
                {procedimentos.map(proc => (
                  <div key={proc.id} className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 p-4 rounded-xl border border-border hover:bg-muted/30 transition-colors">
                    <p className="font-body font-medium text-sm">{proc.nome}</p>
                    <div className="flex items-center gap-3 flex-wrap">
                      {/* Preço */}
                      <div className="flex items-center gap-1">
                        {editingPreco === proc.id ? (
                          <>
                            <input type="number" step="0.01" value={precoValue} onChange={e => setPrecoValue(e.target.value)}
                              className="w-24 rounded-lg border border-border bg-background px-2 py-1.5 text-sm font-body focus:outline-none focus:ring-2 focus:ring-primary/30"
                              placeholder="R$" autoFocus onKeyDown={e => e.key === "Enter" && handleSavePreco(proc.id)} />
                            <button onClick={() => handleSavePreco(proc.id)} className="text-primary hover:text-primary/80 p-1"><Save size={14} /></button>
                            <button onClick={() => { setEditingPreco(null); setPrecoValue(""); }} className="text-muted-foreground hover:text-foreground p-1"><X size={14} /></button>
                          </>
                        ) : (
                          <button onClick={() => { setEditingPreco(proc.id); setPrecoValue(proc.preco != null ? String(proc.preco) : ""); }}
                            className="text-sm font-body text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1" title="Editar preço">
                            {proc.preco != null ? fmt(Number(proc.preco)) : "Sem preço"} <Pencil size={12} />
                          </button>
                        )}
                      </div>
                      <div className="w-px h-5 bg-border" />
                      {/* Duração */}
                      <div className="flex items-center gap-1">
                        {editingDuracao === proc.id ? (
                          <>
                            <input type="number" value={duracaoValue} onChange={e => setDuracaoValue(e.target.value)}
                              className="w-20 rounded-lg border border-border bg-background px-2 py-1.5 text-sm font-body focus:outline-none focus:ring-2 focus:ring-primary/30"
                              placeholder="min" autoFocus onKeyDown={e => e.key === "Enter" && handleSaveDuracao(proc.id)} />
                            <button onClick={() => handleSaveDuracao(proc.id)} className="text-primary hover:text-primary/80 p-1"><Save size={14} /></button>
                            <button onClick={() => { setEditingDuracao(null); setDuracaoValue(""); }} className="text-muted-foreground hover:text-foreground p-1"><X size={14} /></button>
                          </>
                        ) : (
                          <button onClick={() => { setEditingDuracao(proc.id); setDuracaoValue((proc as any).duracao_minutos != null ? String((proc as any).duracao_minutos) : ""); }}
                            className="text-sm font-body text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1" title="Editar duração">
                            <Clock size={12} /> {(proc as any).duracao_minutos != null ? `${(proc as any).duracao_minutos} min` : "Sem duração"} <Pencil size={12} />
                          </button>
                        )}
                      </div>
                      <div className="w-px h-5 bg-border" />
                      {/* Retorno */}
                      <div className="flex items-center gap-1">
                        {editingRetorno === proc.id ? (
                          <>
                            <input type="number" value={retornoValue} onChange={e => setRetornoValue(e.target.value)}
                              className="w-20 rounded-lg border border-border bg-background px-2 py-1.5 text-sm font-body focus:outline-none focus:ring-2 focus:ring-primary/30"
                              placeholder="dias" autoFocus onKeyDown={e => e.key === "Enter" && handleSaveRetorno(proc.id)} />
                            <button onClick={() => handleSaveRetorno(proc.id)} className="text-primary hover:text-primary/80 p-1"><Save size={14} /></button>
                            <button onClick={() => { setEditingRetorno(null); setRetornoValue(""); }} className="text-muted-foreground hover:text-foreground p-1"><X size={14} /></button>
                          </>
                        ) : (
                          <button onClick={() => { setEditingRetorno(proc.id); setRetornoValue(proc.dias_retorno != null ? String(proc.dias_retorno) : ""); }}
                            className="text-sm font-body text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1" title="Editar retorno">
                            🔄 {proc.dias_retorno != null ? `${proc.dias_retorno} dias` : "Sem retorno"} <Pencil size={12} />
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Modal: Nova Entrada */}
      {showEntradaModal && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={() => setShowEntradaModal(false)}>
          <div className="bg-card rounded-2xl border border-border shadow-2xl w-full max-w-md p-6 max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-5">
              <div>
                <h2 className="font-display text-xl">Nova Entrada</h2>
                <p className="text-xs text-muted-foreground font-body">Procedimento realizado em paciente</p>
              </div>
              <button onClick={() => setShowEntradaModal(false)} className="text-muted-foreground hover:text-foreground"><X size={20} /></button>
            </div>
             <div className="space-y-4">
              <div className="relative">
                <label className={labelCls}>Paciente *</label>
                <input
                  type="text"
                  value={ePaciente}
                  onChange={e => setEPaciente(e.target.value)}
                  className={inputCls}
                  placeholder="Digite o nome..."
                  autoComplete="off"
                />
                {ePaciente.length >= 2 && pacientes.filter(p => p.nome.toLowerCase().includes(ePaciente.toLowerCase()) && p.nome !== ePaciente).length > 0 && (
                  <div className="absolute z-10 left-0 right-0 top-full mt-1 bg-card border border-border rounded-xl shadow-lg max-h-40 overflow-y-auto">
                    {pacientes.filter(p => p.nome.toLowerCase().includes(ePaciente.toLowerCase()) && p.nome !== ePaciente).map(p => (
                      <button key={p.id} type="button" onClick={() => setEPaciente(p.nome)}
                        className="w-full text-left px-3 py-2 text-sm font-body hover:bg-muted/60 transition-colors first:rounded-t-xl last:rounded-b-xl">
                        {p.nome}
                      </button>
                    ))}
                  </div>
                )}
              </div>
              <ProcedimentoMultiSelect
                procedimentos={procedimentos}
                selectedIds={eProcedimentos}
                onChange={(ids) => { setEProcedimentos(ids); setEValor(recalcEntradaValor(ids)); }}
                showPreco
              />
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className={labelCls}>Valor (R$) *</label>
                  <input type="number" step="0.01" value={eValor} onChange={e => setEValor(e.target.value)} className={inputCls} placeholder="0,00" />
                </div>
                <div>
                  <label className={labelCls}>Data</label>
                  <input type="date" value={eData} onChange={e => setEData(e.target.value)} className={inputCls} />
                </div>
              </div>
              <div>
                <label className={labelCls}>Forma de Pagamento</label>
                <select value={ePagamento} onChange={e => setEPagamento(e.target.value)} className={inputCls}>
                  {FORMAS_PAGAMENTO.map(f => <option key={f} value={f}>{f}</option>)}
                </select>
              </div>
              <div>
                <label className={labelCls}>Observações</label>
                <textarea value={eObs} onChange={e => setEObs(e.target.value)} className={inputCls + " resize-none h-16"} placeholder="Opcional..." />
              </div>
              <button onClick={handleAddEntrada} className="w-full bg-primary text-primary-foreground py-2.5 rounded-xl font-body font-medium text-sm hover:opacity-90 transition-opacity">
                Registrar Entrada
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal: Nova Saída */}
      {showSaidaModal && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={() => setShowSaidaModal(false)}>
          <div className="bg-card rounded-2xl border border-border shadow-2xl w-full max-w-md p-6" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-5">
              <div>
                <h2 className="font-display text-xl">Nova Saída</h2>
                <p className="text-xs text-muted-foreground font-body">Despesa ou custo operacional</p>
              </div>
              <button onClick={() => setShowSaidaModal(false)} className="text-muted-foreground hover:text-foreground"><X size={20} /></button>
            </div>
            <div className="space-y-4">
              <div>
                <label className={labelCls}>Descrição *</label>
                <input value={sDescricao} onChange={e => setSDescricao(e.target.value)} className={inputCls} placeholder="Ex: Compra de insumos" />
              </div>
              <div>
                <label className={labelCls}>Categoria</label>
                <select value={sCategoria} onChange={e => setSCategoria(e.target.value)} className={inputCls}>
                  {CATEGORIAS_SAIDA.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className={labelCls}>Valor (R$) *</label>
                  <input type="number" step="0.01" value={sValor} onChange={e => setSValor(e.target.value)} className={inputCls} placeholder="0,00" />
                </div>
                <div>
                  <label className={labelCls}>Data</label>
                  <input type="date" value={sData} onChange={e => setSData(e.target.value)} className={inputCls} />
                </div>
              </div>
              <div>
                <label className={labelCls}>Observações</label>
                <textarea value={sObs} onChange={e => setSObs(e.target.value)} className={inputCls + " resize-none h-16"} placeholder="Opcional..." />
              </div>
              <button onClick={handleAddSaida} className="w-full bg-foreground text-background py-2.5 rounded-xl font-body font-medium text-sm hover:opacity-90 transition-opacity">
                Registrar Saída
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Detail popup for transaction */}
      {detailTransaction && (() => {
        const t = detailTransaction;
        const isEntrada = t.tipo === "entrada";
        const entrada = isEntrada ? entradas.find(e => e.id === t.id) : null;
        const saida = !isEntrada ? saidas.find(s => s.id === t.id) : null;
        return (
          <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={() => setDetailTransaction(null)}>
            <div className="bg-card rounded-2xl border border-border shadow-2xl w-full max-w-md p-6" onClick={e => e.stopPropagation()}>
              <div className={`h-0.5 w-full rounded-full mb-5 ${isEntrada ? "bg-primary" : "bg-destructive"}`} />
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-display text-xl">{isEntrada ? "Detalhes da Entrada" : "Detalhes da Saída"}</h3>
                <button onClick={() => setDetailTransaction(null)} className="text-muted-foreground hover:text-foreground p-1"><X size={18} /></button>
              </div>
              <div className="flex flex-col gap-3">
                <div className={`flex items-center gap-3 p-3 rounded-xl ${isEntrada ? "bg-primary/10" : "bg-destructive/10"}`}>
                  {isEntrada ? <ArrowUpCircle size={20} className="text-primary" /> : <ArrowDownCircle size={20} className="text-destructive" />}
                  <div>
                    <p className="text-[10px] uppercase tracking-widest text-muted-foreground font-body">Valor</p>
                    <p className={`text-lg font-display font-medium ${isEntrada ? "text-primary" : "text-destructive"}`}>
                      {isEntrada ? "+" : "−"} {fmt(Number(t.valor))}
                    </p>
                  </div>
                </div>

                {isEntrada && entrada && (
                  <>
                    <div className="flex items-center gap-3 p-3 rounded-xl bg-accent/50">
                      <CreditCard size={16} className="text-muted-foreground flex-shrink-0" />
                      <div>
                        <p className="text-[10px] uppercase tracking-widest text-muted-foreground font-body">Paciente</p>
                        <p className="text-sm font-body font-medium">{entrada.paciente_nome}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 p-3 rounded-xl bg-accent/50">
                      <Tag size={16} className="text-muted-foreground flex-shrink-0" />
                      <div>
                        <p className="text-[10px] uppercase tracking-widest text-muted-foreground font-body">Procedimento(s)</p>
                        <p className="text-sm font-body font-medium">{getEntradaProcNames(entrada.id)}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 p-3 rounded-xl bg-accent/50">
                      <CreditCard size={16} className="text-muted-foreground flex-shrink-0" />
                      <div>
                        <p className="text-[10px] uppercase tracking-widest text-muted-foreground font-body">Forma de Pagamento</p>
                        <p className="text-sm font-body font-medium">{entrada.forma_pagamento}</p>
                      </div>
                    </div>
                  </>
                )}

                {!isEntrada && saida && (
                  <>
                    <div className="flex items-center gap-3 p-3 rounded-xl bg-accent/50">
                      <Tag size={16} className="text-muted-foreground flex-shrink-0" />
                      <div>
                        <p className="text-[10px] uppercase tracking-widest text-muted-foreground font-body">Descrição</p>
                        <p className="text-sm font-body font-medium">{saida.descricao}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 p-3 rounded-xl bg-accent/50">
                      <Filter size={16} className="text-muted-foreground flex-shrink-0" />
                      <div>
                        <p className="text-[10px] uppercase tracking-widest text-muted-foreground font-body">Categoria</p>
                        <p className="text-sm font-body font-medium">{saida.categoria}</p>
                      </div>
                    </div>
                  </>
                )}

                <div className="flex items-center gap-3 p-3 rounded-xl bg-accent/50">
                  <Clock size={16} className="text-muted-foreground flex-shrink-0" />
                  <div>
                    <p className="text-[10px] uppercase tracking-widest text-muted-foreground font-body">Data</p>
                    <p className="text-sm font-body font-medium">{fmtDate(t.data)}</p>
                  </div>
                </div>

                {((isEntrada && entrada?.observacoes) || (!isEntrada && saida?.observacoes)) && (
                  <div className="p-3 rounded-xl bg-accent/50">
                    <p className="text-[10px] uppercase tracking-widest text-muted-foreground font-body mb-1">Observações</p>
                    <p className="text-sm font-body">{isEntrada ? entrada?.observacoes : saida?.observacoes}</p>
                  </div>
                )}
              </div>
              <button onClick={() => setDetailTransaction(null)} className="w-full mt-5 py-2.5 rounded-lg border border-border text-sm font-body hover:bg-muted transition-colors">
                Fechar
              </button>
            </div>
          </div>
        );
      })()}
    </AppLayout>
  );
};

export default Financeiro;
