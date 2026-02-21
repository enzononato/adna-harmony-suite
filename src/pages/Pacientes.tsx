import { useState, useEffect } from "react";
import AppLayout from "@/components/AppLayout";
import { Search, Plus, ChevronRight, X, MessageCircle, FileText, Calendar, ClipboardList, ArrowLeft, Trash2, Save } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

type Paciente = { id: string; nome: string; telefone: string; data_nascimento: string | null; email: string | null; anamnese: string | null; created_at: string };
type Tratamento = { id: string; paciente_id: string; procedimento: string; notas: string | null; data: string; created_at: string };
type Tab = "historico" | "anamnese";

const fmtDate = (d: string | null) => d ? new Date(d + "T00:00:00").toLocaleDateString("pt-BR") : "—";
const getInitials = (name: string) => name.split(" ").filter(Boolean).slice(0, 2).map(n => n[0]).join("").toUpperCase();
const calcAge = (dob: string | null) => { if (!dob) return null; const d = new Date(dob + "T00:00:00"); const diff = Date.now() - d.getTime(); return Math.floor(diff / 31557600000); };

const inputCls = "w-full px-3 py-2.5 rounded-xl border border-border bg-background text-sm font-body focus:outline-none focus:ring-2 focus:ring-primary/30 transition-all";
const labelCls = "text-xs uppercase tracking-widest text-muted-foreground font-body mb-1 block";

const Pacientes = () => {
  const [pacientes, setPacientes] = useState<Paciente[]>([]);
  const [tratamentos, setTratamentos] = useState<Tratamento[]>([]);
  const [search, setSearch] = useState("");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [tab, setTab] = useState<Tab>("historico");
  const [loading, setLoading] = useState(true);

  // New patient form
  const [showNew, setShowNew] = useState(false);
  const [newNome, setNewNome] = useState("");
  const [newTel, setNewTel] = useState("");
  const [newDob, setNewDob] = useState("");
  const [newEmail, setNewEmail] = useState("");
  const [newAnam, setNewAnam] = useState("");

  // New treatment form
  const [showNewTrat, setShowNewTrat] = useState(false);
  const [tratProc, setTratProc] = useState("");
  const [tratNotas, setTratNotas] = useState("");
  const [tratData, setTratData] = useState(new Date().toISOString().slice(0, 10));

  // Edit anamnesis
  const [editingAnam, setEditingAnam] = useState(false);
  const [anamText, setAnamText] = useState("");

  const fetchData = async () => {
    setLoading(true);
    const [pRes, tRes] = await Promise.all([
      supabase.from("pacientes").select("*").order("nome"),
      supabase.from("tratamentos").select("*").order("data", { ascending: false }),
    ]);
    if (pRes.data) setPacientes(pRes.data as Paciente[]);
    if (tRes.data) setTratamentos(tRes.data as Tratamento[]);
    setLoading(false);
  };

  useEffect(() => { fetchData(); }, []);

  const selected = pacientes.find(p => p.id === selectedId) || null;
  const selectedTrats = tratamentos.filter(t => t.paciente_id === selectedId).sort((a, b) => new Date(b.data).getTime() - new Date(a.data).getTime());
  const filtered = pacientes.filter(p => p.nome.toLowerCase().includes(search.toLowerCase()));

  const handleNewPatient = async () => {
    if (!newNome.trim()) { toast.error("Informe o nome."); return; }
    const { error } = await supabase.from("pacientes").insert({
      nome: newNome.trim(), telefone: newTel.trim(),
      data_nascimento: newDob || null, email: newEmail.trim() || null, anamnese: newAnam.trim() || null,
    });
    if (error) { toast.error("Erro ao salvar."); return; }
    toast.success("Paciente cadastrada!");
    setShowNew(false); setNewNome(""); setNewTel(""); setNewDob(""); setNewEmail(""); setNewAnam("");
    fetchData();
  };

  const handleDeletePatient = async (id: string) => {
    if (!confirm("Excluir esta paciente e todos os tratamentos?")) return;
    const { error } = await supabase.from("pacientes").delete().eq("id", id);
    if (error) { toast.error("Erro ao excluir."); return; }
    toast.success("Paciente excluída.");
    setSelectedId(null);
    fetchData();
  };

  const handleNewTreatment = async () => {
    if (!tratProc.trim() || !selectedId) { toast.error("Informe o procedimento."); return; }
    const { error } = await supabase.from("tratamentos").insert({
      paciente_id: selectedId, procedimento: tratProc.trim(), notas: tratNotas.trim() || null, data: tratData,
    });
    if (error) { toast.error("Erro ao salvar."); return; }
    toast.success("Tratamento registrado!");
    setShowNewTrat(false); setTratProc(""); setTratNotas("");
    fetchData();
  };

  const handleDeleteTreatment = async (id: string) => {
    const { error } = await supabase.from("tratamentos").delete().eq("id", id);
    if (error) { toast.error("Erro ao excluir."); return; }
    toast.success("Tratamento excluído.");
    fetchData();
  };

  const handleSaveAnamnese = async () => {
    if (!selectedId) return;
    const { error } = await supabase.from("pacientes").update({ anamnese: anamText.trim() || null }).eq("id", selectedId);
    if (error) { toast.error("Erro ao salvar."); return; }
    toast.success("Anamnese atualizada!");
    setEditingAnam(false);
    fetchData();
  };

  const whatsappLink = (phone: string) => `https://wa.me/${phone.replace(/\D/g, "")}`;

  return (
    <AppLayout>
      <div className="max-w-5xl mx-auto">
        {selected ? (
          <div>
            <button onClick={() => { setSelectedId(null); setEditingAnam(false); }} className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors mb-6 font-body">
              <ArrowLeft size={15} /> Voltar para Pacientes
            </button>

            {/* Patient header */}
            <div className="bg-card rounded-2xl border border-border shadow-card p-6 mb-5">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                  <div className="w-16 h-16 rounded-2xl flex items-center justify-center text-xl font-display font-medium" style={{ background: "hsl(var(--gold-light))", color: "hsl(var(--primary))" }}>
                    {getInitials(selected.nome)}
                  </div>
                  <div>
                    <h2 className="text-2xl font-display">{selected.nome}</h2>
                    <div className="flex flex-wrap gap-4 mt-1">
                      {calcAge(selected.data_nascimento) !== null && <span className="text-sm text-muted-foreground font-body">{calcAge(selected.data_nascimento)} anos</span>}
                      {selected.email && <span className="text-sm text-muted-foreground font-body">{selected.email}</span>}
                      <span className="text-sm text-muted-foreground font-body">{selectedTrats.length} tratamento(s)</span>
                    </div>
                  </div>
                </div>
                <div className="flex gap-2 self-start sm:self-auto">
                  {selected.telefone && (
                    <a href={whatsappLink(selected.telefone)} target="_blank" rel="noopener noreferrer"
                      className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-body font-medium transition-all hover:opacity-90" style={{ background: "#25D366", color: "#fff" }}>
                      <MessageCircle size={16} /> WhatsApp
                    </a>
                  )}
                  <button onClick={() => handleDeletePatient(selected.id)} className="p-2.5 rounded-xl border border-border text-muted-foreground hover:text-destructive hover:border-destructive/40 transition-colors" title="Excluir paciente">
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            </div>

            {/* Tabs */}
            <div className="flex gap-1 mb-5 bg-muted p-1 rounded-xl w-fit">
              {([["historico", "Histórico de Tratamentos", FileText], ["anamnese", "Ficha de Anamnese", ClipboardList]] as [Tab, string, typeof FileText][]).map(([t, label, Icon]) => (
                <button key={t} onClick={() => setTab(t)} className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-body transition-all"
                  style={tab === t ? { background: "hsl(var(--card))", color: "hsl(var(--primary))", fontWeight: 600, boxShadow: "var(--shadow-soft)" } : { color: "hsl(var(--muted-foreground))" }}>
                  <Icon size={14} />{label}
                </button>
              ))}
            </div>

            {tab === "historico" ? (
              <div className="flex flex-col gap-4">
                {selectedTrats.map((t, i) => (
                  <div key={t.id} className="bg-card rounded-2xl border border-border shadow-card p-5 group">
                    <div className="flex items-start justify-between gap-3 mb-3">
                      <div>
                        <p className="font-body font-medium text-sm">{t.procedimento}</p>
                        <p className="text-xs text-muted-foreground font-body mt-0.5 flex items-center gap-1"><Calendar size={11} />{fmtDate(t.data)}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-body px-2.5 py-1 rounded-full" style={{ background: "hsl(var(--gold-light))", color: "hsl(var(--primary))" }}>
                          Relatório #{selectedTrats.length - i}
                        </span>
                        <button onClick={() => handleDeleteTreatment(t.id)} className="opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-destructive transition-all p-1" title="Excluir">
                          <X size={14} />
                        </button>
                      </div>
                    </div>
                    {t.notas && (
                      <>
                        <div className="h-px bg-border mb-3" />
                        <p className="text-sm text-muted-foreground font-body leading-relaxed">{t.notas}</p>
                      </>
                    )}
                  </div>
                ))}
                <button onClick={() => { setShowNewTrat(true); setTratData(new Date().toISOString().slice(0, 10)); }}
                  className="flex items-center justify-center gap-2 p-4 rounded-2xl border-2 border-dashed border-border hover:border-primary/40 text-muted-foreground hover:text-primary transition-all font-body text-sm">
                  <Plus size={15} /> Adicionar relatório
                </button>
              </div>
            ) : (
              <div className="bg-card rounded-2xl border border-border shadow-card p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <ClipboardList size={16} style={{ color: "hsl(var(--primary))" }} />
                    <h3 className="font-display text-xl">Ficha de Anamnese</h3>
                  </div>
                  {!editingAnam && (
                    <button onClick={() => { setEditingAnam(true); setAnamText(selected.anamnese || ""); }}
                      className="flex items-center gap-2 text-sm font-body text-primary hover:underline">
                      <FileText size={13} /> Editar
                    </button>
                  )}
                </div>
                {editingAnam ? (
                  <div>
                    <textarea value={anamText} onChange={e => setAnamText(e.target.value)}
                      className={inputCls + " resize-none h-40"} placeholder="Alergias, medicamentos em uso, comorbidades..." />
                    <div className="flex gap-2 mt-3">
                      <button onClick={() => setEditingAnam(false)} className="px-4 py-2 rounded-xl border border-border text-sm font-body hover:bg-muted transition-colors">Cancelar</button>
                      <button onClick={handleSaveAnamnese} className="flex items-center gap-2 px-4 py-2 rounded-xl bg-primary text-primary-foreground text-sm font-body font-medium hover:opacity-90 transition-opacity">
                        <Save size={14} /> Salvar
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="bg-muted rounded-xl p-4">
                    <p className="text-sm font-body leading-relaxed text-foreground">
                      {selected.anamnese || "Nenhuma informação registrada. Clique em 'Editar' para preencher."}
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>
        ) : (
          <div>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
              <div>
                <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground font-body mb-1">Gerenciamento</p>
                <h1 className="text-3xl font-display">Pacientes</h1>
              </div>
              <button onClick={() => setShowNew(true)} className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-body font-medium hover:opacity-90 transition-all self-start sm:self-auto" style={{ background: "var(--gradient-gold)", color: "hsl(var(--primary-foreground))", boxShadow: "var(--shadow-gold)" }}>
                <Plus size={15} /> Nova paciente
              </button>
            </div>

            <div className="relative mb-6">
              <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Buscar paciente..."
                className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-card border border-border text-sm font-body focus:outline-none focus:ring-2 focus:ring-primary/30 shadow-soft" />
            </div>

            {loading ? (
              <p className="text-center text-sm text-muted-foreground font-body py-10">Carregando...</p>
            ) : filtered.length === 0 ? (
              <p className="text-center text-sm text-muted-foreground font-body py-10">
                {search ? "Nenhum resultado encontrado." : "Nenhuma paciente cadastrada ainda."}
              </p>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {filtered.map(p => {
                  const pts = tratamentos.filter(t => t.paciente_id === p.id);
                  const lastVisit = pts.length > 0 ? fmtDate(pts[0].data) : "—";
                  return (
                    <button key={p.id} onClick={() => { setSelectedId(p.id); setTab("historico"); setEditingAnam(false); }}
                      className="bg-card rounded-2xl border border-border shadow-card p-5 text-left hover:border-primary/40 hover:shadow-gold transition-all group">
                      <div className="flex items-center gap-3 mb-4">
                        <div className="w-11 h-11 rounded-xl flex items-center justify-center text-sm font-display font-medium flex-shrink-0" style={{ background: "hsl(var(--gold-light))", color: "hsl(var(--primary))" }}>
                          {getInitials(p.nome)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-body font-medium text-sm truncate">{p.nome}</p>
                          {calcAge(p.data_nascimento) !== null && <p className="text-xs text-muted-foreground font-body">{calcAge(p.data_nascimento)} anos</p>}
                        </div>
                        <ChevronRight size={15} className="text-muted-foreground group-hover:text-primary transition-colors flex-shrink-0" />
                      </div>
                      <div className="h-px bg-border mb-3" />
                      <div className="flex flex-col gap-1.5">
                        <div className="flex items-center justify-between">
                          <span className="text-[11px] text-muted-foreground font-body">Última visita</span>
                          <span className="text-[11px] font-body">{lastVisit}</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-[11px] text-muted-foreground font-body">Tratamentos</span>
                          <span className="text-[11px] font-body px-2 py-0.5 rounded-full" style={{ background: "hsl(var(--gold-light))", color: "hsl(var(--primary))" }}>
                            {pts.length}
                          </span>
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Modal: Nova Paciente */}
      {showNew && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-foreground/30 backdrop-blur-sm" onClick={() => setShowNew(false)} />
          <div className="relative z-10 bg-card rounded-2xl border border-border shadow-card w-full max-w-md p-6">
            <button onClick={() => setShowNew(false)} className="absolute top-4 right-4 text-muted-foreground hover:text-foreground"><X size={16} /></button>
            <div className="h-0.5 w-full rounded-full mb-6" style={{ background: "var(--gradient-gold)" }} />
            <h3 className="font-display text-2xl mb-5">Nova Paciente</h3>
            <div className="flex flex-col gap-3">
              <div><label className={labelCls}>Nome completo *</label><input value={newNome} onChange={e => setNewNome(e.target.value)} className={inputCls} /></div>
              <div><label className={labelCls}>Telefone (WhatsApp)</label><input value={newTel} onChange={e => setNewTel(e.target.value)} className={inputCls} placeholder="5511999990000" /></div>
              <div><label className={labelCls}>Data de nascimento</label><input type="date" value={newDob} onChange={e => setNewDob(e.target.value)} className={inputCls} /></div>
              <div><label className={labelCls}>E-mail</label><input type="email" value={newEmail} onChange={e => setNewEmail(e.target.value)} className={inputCls} /></div>
              <div><label className={labelCls}>Anamnese</label><textarea value={newAnam} onChange={e => setNewAnam(e.target.value)} rows={3} className={inputCls + " resize-none"} placeholder="Alergias, medicamentos, comorbidades..." /></div>
            </div>
            <div className="flex gap-3 mt-5">
              <button onClick={() => setShowNew(false)} className="flex-1 py-2.5 rounded-lg border border-border text-sm font-body hover:bg-muted transition-colors">Cancelar</button>
              <button onClick={handleNewPatient} className="flex-1 py-2.5 rounded-lg text-sm font-body font-medium hover:opacity-90 transition-all" style={{ background: "var(--gradient-gold)", color: "hsl(var(--primary-foreground))" }}>Salvar</button>
            </div>
          </div>
        </div>
      )}

      {/* Modal: Novo Tratamento */}
      {showNewTrat && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={() => setShowNewTrat(false)}>
          <div className="bg-card rounded-2xl border border-border shadow-2xl w-full max-w-md p-6" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-5">
              <div>
                <h2 className="font-display text-xl">Novo Tratamento</h2>
                <p className="text-xs text-muted-foreground font-body">Relatório de evolução</p>
              </div>
              <button onClick={() => setShowNewTrat(false)} className="text-muted-foreground hover:text-foreground"><X size={20} /></button>
            </div>
            <div className="space-y-4">
              <div><label className={labelCls}>Procedimento *</label><input value={tratProc} onChange={e => setTratProc(e.target.value)} className={inputCls} placeholder="Ex: Limpeza de pele" /></div>
              <div><label className={labelCls}>Data</label><input type="date" value={tratData} onChange={e => setTratData(e.target.value)} className={inputCls} /></div>
              <div><label className={labelCls}>Notas / Observações</label><textarea value={tratNotas} onChange={e => setTratNotas(e.target.value)} className={inputCls + " resize-none h-24"} placeholder="Detalhes do tratamento, evolução, observações..." /></div>
              <button onClick={handleNewTreatment} className="w-full bg-primary text-primary-foreground py-2.5 rounded-xl font-body font-medium text-sm hover:opacity-90 transition-opacity">
                Registrar Tratamento
              </button>
            </div>
          </div>
        </div>
      )}
    </AppLayout>
  );
};

export default Pacientes;
