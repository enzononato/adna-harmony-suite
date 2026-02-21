import { useState, useEffect } from "react";
import AppLayout from "@/components/AppLayout";
import { ChevronLeft, ChevronRight, Plus, Clock, User, Trash2, Pencil, Save, X } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

const DAYS = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];
const MONTHS = ["Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho", "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"];

type Agendamento = {
  id: string;
  paciente_nome: string;
  procedimento_id: string;
  data: string;
  horario: string;
  observacoes: string | null;
  procedimentos?: { nome: string } | null;
};

type ViewMode = "mensal" | "semanal" | "diario";

const Agenda = () => {
  const today = new Date();
  const [year, setYear] = useState(today.getFullYear());
  const [month, setMonth] = useState(today.getMonth());
  const [selectedDay, setSelectedDay] = useState<number | null>(today.getDate());
  const [view, setView] = useState<ViewMode>("mensal");
  const [showNewModal, setShowNewModal] = useState(false);
  const [procedimentos, setProcedimentos] = useState<{ id: string; nome: string }[]>([]);
  const [agendamentos, setAgendamentos] = useState<Agendamento[]>([]);
  const [pacientes, setPacientes] = useState<{ id: string; nome: string }[]>([]);

  // Form state (new)
  const [newPaciente, setNewPaciente] = useState("");
  const [newPacienteSearch, setNewPacienteSearch] = useState("");
  const [showPacienteDropdown, setShowPacienteDropdown] = useState(false);
  const [newProcedimentoId, setNewProcedimentoId] = useState("");
  const [newData, setNewData] = useState(new Date().toISOString().slice(0, 10));
  const [newHorario, setNewHorario] = useState("");
  const [newObs, setNewObs] = useState("");

  // Edit state
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editPaciente, setEditPaciente] = useState("");
  const [editPacienteSearch, setEditPacienteSearch] = useState("");
  const [showEditPacienteDropdown, setShowEditPacienteDropdown] = useState(false);
  const [editProcedimentoId, setEditProcedimentoId] = useState("");
  const [editData, setEditData] = useState("");
  const [editHorario, setEditHorario] = useState("");
  const [editObs, setEditObs] = useState("");

  const fetchData = async () => {
    const [pRes, aRes, pacRes] = await Promise.all([
      supabase.from("procedimentos").select("id, nome").order("nome"),
      supabase.from("agendamentos").select("*, procedimentos(nome)").order("horario"),
      supabase.from("pacientes").select("id, nome").order("nome"),
    ]);
    if (pRes.data) setProcedimentos(pRes.data);
    if (aRes.data) setAgendamentos(aRes.data as Agendamento[]);
    if (pacRes.data) setPacientes(pacRes.data);
  };

  // Copy past appointments to patient history (tratamentos)
  const syncPastToHistory = async () => {
    const todayStr = new Date().toISOString().slice(0, 10);
    const { data: pastAppts } = await supabase
      .from("agendamentos")
      .select("*, procedimentos(nome)")
      .lt("data", todayStr);

    if (!pastAppts || pastAppts.length === 0) return;

    const { data: allPacientes } = await supabase.from("pacientes").select("id, nome");
    if (!allPacientes) return;
    const nameToId = new Map(allPacientes.map(p => [p.nome, p.id]));

    // Get existing tratamentos to avoid duplicates
    const { data: existingTrats } = await supabase.from("tratamentos").select("paciente_id, procedimento, data");
    const existingSet = new Set(
      (existingTrats || []).map(t => `${t.paciente_id}|${t.procedimento}|${t.data}`)
    );

    for (const appt of pastAppts) {
      const pacienteId = nameToId.get(appt.paciente_nome);
      if (!pacienteId) continue;
      const procedimentoNome = (appt as Agendamento).procedimentos?.nome || "Procedimento";
      const key = `${pacienteId}|${procedimentoNome}|${appt.data}`;
      if (existingSet.has(key)) continue;

      await supabase.from("tratamentos").insert({
        paciente_id: pacienteId,
        procedimento: procedimentoNome,
        data: appt.data,
        notas: appt.observacoes || null,
      });
    }
  };

  useEffect(() => { fetchData(); }, []);
  useEffect(() => { syncPastToHistory(); }, []);

  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  const prevMonth = () => { if (month === 0) { setMonth(11); setYear(y => y - 1); } else setMonth(m => m - 1); };
  const nextMonth = () => { if (month === 11) { setMonth(0); setYear(y => y + 1); } else setMonth(m => m + 1); };

  const selectedDateStr = selectedDay
    ? `${year}-${String(month + 1).padStart(2, "0")}-${String(selectedDay).padStart(2, "0")}`
    : null;

  const dayAppointments = agendamentos.filter(a => a.data === selectedDateStr);

  const daysWithAppts = new Set(
    agendamentos
      .filter(a => {
        const d = new Date(a.data + "T00:00:00");
        return d.getFullYear() === year && d.getMonth() === month;
      })
      .map(a => new Date(a.data + "T00:00:00").getDate())
  );

  const handleSave = async () => {
    if (!newPaciente) { toast.error("Selecione um paciente cadastrado."); return; }
    if (!newProcedimentoId) { toast.error("Selecione um procedimento."); return; }
    if (!newHorario) { toast.error("Informe o horário."); return; }
    
    const paciente = pacientes.find(p => p.nome === newPaciente);
    if (!paciente) { toast.error("Paciente não cadastrado. Cadastre primeiro na aba Pacientes."); return; }

    const { error } = await supabase.from("agendamentos").insert({
      paciente_nome: newPaciente.trim(),
      procedimento_id: newProcedimentoId,
      data: newData,
      horario: newHorario,
      observacoes: newObs.trim() || null,
    });
    if (error) { toast.error("Erro ao salvar agendamento."); return; }
    toast.success("Agendamento salvo!");
    setShowNewModal(false);
    resetForm();
    fetchData();
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Excluir este agendamento?")) return;
    const { error } = await supabase.from("agendamentos").delete().eq("id", id);
    if (error) { toast.error("Erro ao excluir."); return; }
    toast.success("Agendamento excluído.");
    fetchData();
  };

  const startEdit = (a: Agendamento) => {
    setEditingId(a.id);
    setEditPaciente(a.paciente_nome);
    setEditPacienteSearch(a.paciente_nome);
    setEditProcedimentoId(a.procedimento_id);
    setEditData(a.data);
    setEditHorario(a.horario);
    setEditObs(a.observacoes || "");
    setShowEditPacienteDropdown(false);
  };

  const handleUpdate = async () => {
    if (!editingId || !editPaciente || !editProcedimentoId || !editHorario) {
      toast.error("Preencha todos os campos obrigatórios.");
      return;
    }
    const { error } = await supabase.from("agendamentos").update({
      paciente_nome: editPaciente.trim(),
      procedimento_id: editProcedimentoId,
      data: editData,
      horario: editHorario,
      observacoes: editObs.trim() || null,
    }).eq("id", editingId);
    if (error) { toast.error("Erro ao atualizar."); return; }
    toast.success("Agendamento atualizado!");
    setEditingId(null);
    fetchData();
  };

  const resetForm = () => {
    setNewPaciente(""); setNewPacienteSearch(""); setNewProcedimentoId(""); setNewData(new Date().toISOString().slice(0, 10)); setNewHorario(""); setNewObs("");
  };

  const openNewModal = () => {
    resetForm();
    if (selectedDateStr) setNewData(selectedDateStr);
    setShowNewModal(true);
  };

  const inputCls = "px-3 py-2 rounded-lg bg-muted border border-border text-sm font-body focus:outline-none focus:ring-2 focus:ring-primary/30";

  return (
    <AppLayout>
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
          <div>
            <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground font-body mb-1">Gerenciamento</p>
            <h1 className="text-3xl font-display text-foreground">Agenda</h1>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex rounded-lg overflow-hidden border border-border bg-muted p-0.5 gap-0.5">
              {(["mensal", "semanal", "diario"] as ViewMode[]).map(v => (
                <button key={v} onClick={() => setView(v)}
                  className="px-3 py-1.5 text-xs font-body capitalize rounded-md transition-all"
                  style={view === v ? { background: "hsl(var(--card))", color: "hsl(var(--primary))", fontWeight: 600, boxShadow: "var(--shadow-soft)" } : { color: "hsl(var(--muted-foreground))" }}>
                  {v.charAt(0).toUpperCase() + v.slice(1)}
                </button>
              ))}
            </div>
            <button
              onClick={openNewModal}
              className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-body font-medium transition-all hover:opacity-90"
              style={{ background: "var(--gradient-gold)", color: "hsl(var(--primary-foreground))", boxShadow: "var(--shadow-gold)" }}>
              <Plus size={15} />
              Novo agendamento
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-[1fr_300px] gap-6">
          {/* Calendar */}
          <div className="bg-card rounded-2xl border border-border shadow-card p-6">
            <div className="flex items-center justify-between mb-6">
              <button onClick={prevMonth} className="p-1.5 rounded-lg hover:bg-muted transition-colors"><ChevronLeft size={18} /></button>
              <h2 className="font-display text-xl text-primary">{MONTHS[month]} {year}</h2>
              <button onClick={nextMonth} className="p-1.5 rounded-lg hover:bg-muted transition-colors"><ChevronRight size={18} /></button>
            </div>

            <div className="grid grid-cols-7 mb-2">
              {DAYS.map(d => (
                <div key={d} className="text-center text-[10px] uppercase tracking-widest text-muted-foreground font-body py-1">{d}</div>
              ))}
            </div>

            <div className="grid grid-cols-7 gap-1">
              {Array.from({ length: firstDay }).map((_, i) => <div key={`e-${i}`} />)}
              {Array.from({ length: daysInMonth }).map((_, i) => {
                const day = i + 1;
                const isToday = day === today.getDate() && month === today.getMonth() && year === today.getFullYear();
                const isSelected = day === selectedDay;
                const hasAppts = daysWithAppts.has(day);
                return (
                  <button
                    key={day}
                    onClick={() => setSelectedDay(day)}
                    className="relative aspect-square flex flex-col items-center justify-center rounded-xl text-sm font-body transition-all hover:bg-accent"
                    style={isSelected ? { background: "var(--gradient-gold)", color: "hsl(var(--primary-foreground))", fontWeight: 600 }
                      : isToday ? { border: "1.5px solid hsl(var(--primary))", color: "hsl(var(--primary))", fontWeight: 600 } : {}}>
                    {day}
                    {hasAppts && !isSelected && (
                      <span className="absolute bottom-1 flex gap-0.5">
                        <span className="w-1.5 h-1.5 rounded-full bg-primary" />
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Day appointments */}
          <div className="bg-card rounded-2xl border border-border shadow-card p-5">
            <div className="mb-4">
              <p className="text-xs uppercase tracking-widest text-muted-foreground font-body">
                {selectedDay ? `${selectedDay} de ${MONTHS[month]}` : "Selecione um dia"}
              </p>
              <h3 className="font-display text-xl mt-0.5">Cronograma</h3>
            </div>

            {dayAppointments.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <div className="w-12 h-12 rounded-full flex items-center justify-center mb-3 bg-accent">
                  <CalendarIcon />
                </div>
                <p className="text-sm text-muted-foreground font-body">Nenhuma consulta neste dia</p>
              </div>
            ) : (
              <div className="flex flex-col gap-3">
                {dayAppointments.map(a => (
                  <div key={a.id} className="flex gap-3 p-3 rounded-xl bg-accent/40 group">
                    <div className="flex flex-col items-center gap-1 min-w-[36px]">
                      <Clock size={12} className="text-primary" />
                      <span className="text-xs font-body font-medium text-primary">{a.horario.slice(0, 5)}</span>
                    </div>
                    <div className="h-full w-px bg-primary/30" />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5 mb-0.5">
                        <User size={11} className="text-muted-foreground flex-shrink-0" />
                        <p className="text-xs font-body font-medium truncate">{a.paciente_nome}</p>
                      </div>
                      <p className="text-[11px] text-muted-foreground font-body">{a.procedimentos?.nome || "—"}</p>
                    </div>
                    <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-all self-start">
                      <button onClick={() => startEdit(a)} className="text-muted-foreground hover:text-primary p-1" title="Editar">
                        <Pencil size={13} />
                      </button>
                      <button onClick={() => handleDelete(a.id)} className="text-muted-foreground hover:text-destructive p-1" title="Excluir">
                        <Trash2 size={13} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Edit appointment modal */}
      {editingId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-foreground/30 backdrop-blur-sm" onClick={() => setEditingId(null)} />
          <div className="relative z-10 bg-card rounded-2xl border border-border shadow-card w-full max-w-md p-6">
            <div className="h-0.5 w-full rounded-full mb-6" style={{ background: "var(--gradient-gold)" }} />
            <h3 className="font-display text-2xl mb-5">Editar Agendamento</h3>
            <div className="flex flex-col gap-4">
              <div className="flex flex-col gap-1 relative">
                <label className="text-xs uppercase tracking-widest text-muted-foreground font-body">Paciente *</label>
                <input type="text" value={editPacienteSearch}
                  onChange={e => { setEditPacienteSearch(e.target.value); setEditPaciente(""); setShowEditPacienteDropdown(true); }}
                  onFocus={() => setShowEditPacienteDropdown(true)}
                  placeholder="Buscar paciente..."
                  className={`${inputCls} ${editPaciente ? "bg-accent border-primary/40" : ""}`} />
                {editPaciente && <p className="text-[11px] text-primary font-body mt-0.5">✓ {editPaciente}</p>}
                {showEditPacienteDropdown && !editPaciente && (
                  <div className="absolute top-full left-0 right-0 z-20 mt-1 bg-card border border-border rounded-xl shadow-card max-h-40 overflow-y-auto">
                    {pacientes.filter(p => p.nome.toLowerCase().includes(editPacienteSearch.toLowerCase())).length === 0 ? (
                      <p className="px-3 py-2 text-xs text-muted-foreground font-body">Nenhum paciente encontrado.</p>
                    ) : (
                      pacientes.filter(p => p.nome.toLowerCase().includes(editPacienteSearch.toLowerCase())).map(p => (
                        <button key={p.id} type="button"
                          onClick={() => { setEditPaciente(p.nome); setEditPacienteSearch(p.nome); setShowEditPacienteDropdown(false); }}
                          className="w-full text-left px-3 py-2 text-sm font-body hover:bg-accent transition-colors flex items-center gap-2">
                          <User size={12} className="text-muted-foreground" />{p.nome}
                        </button>
                      ))
                    )}
                  </div>
                )}
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-xs uppercase tracking-widest text-muted-foreground font-body">Procedimento *</label>
                <select value={editProcedimentoId} onChange={e => setEditProcedimentoId(e.target.value)} className={inputCls}>
                  <option value="">Selecione</option>
                  {procedimentos.map(p => <option key={p.id} value={p.id}>{p.nome}</option>)}
                </select>
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-xs uppercase tracking-widest text-muted-foreground font-body">Data *</label>
                <input type="date" value={editData} onChange={e => setEditData(e.target.value)} className={inputCls} />
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-xs uppercase tracking-widest text-muted-foreground font-body">Horário *</label>
                <input type="time" value={editHorario} onChange={e => setEditHorario(e.target.value)} className={inputCls} />
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-xs uppercase tracking-widest text-muted-foreground font-body">Observações</label>
                <textarea rows={2} value={editObs} onChange={e => setEditObs(e.target.value)} className={inputCls + " resize-none"} />
              </div>
            </div>
            <div className="flex gap-3 mt-6">
              <button onClick={() => setEditingId(null)} className="flex-1 py-2.5 rounded-lg border border-border text-sm font-body hover:bg-muted transition-colors">Cancelar</button>
              <button onClick={handleUpdate} className="flex-1 py-2.5 rounded-lg text-sm font-body font-medium transition-all hover:opacity-90" style={{ background: "var(--gradient-gold)", color: "hsl(var(--primary-foreground))" }}>
                Salvar alterações
              </button>
            </div>
          </div>
        </div>
      )}

      {/* New appointment modal */}
      {showNewModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-foreground/30 backdrop-blur-sm" onClick={() => setShowNewModal(false)} />
          <div className="relative z-10 bg-card rounded-2xl border border-border shadow-card w-full max-w-md p-6">
            <div className="h-0.5 w-full rounded-full mb-6" style={{ background: "var(--gradient-gold)" }} />
            <h3 className="font-display text-2xl mb-5">Novo Agendamento</h3>
            <div className="flex flex-col gap-4">
              <div className="flex flex-col gap-1 relative">
                <label className="text-xs uppercase tracking-widest text-muted-foreground font-body">Paciente *</label>
                <input type="text" value={newPacienteSearch} 
                  onChange={e => { setNewPacienteSearch(e.target.value); setNewPaciente(""); setShowPacienteDropdown(true); }}
                  onFocus={() => setShowPacienteDropdown(true)}
                  placeholder="Buscar paciente cadastrado..."
                  className={`${inputCls} ${newPaciente ? "bg-accent border-primary/40" : ""}`} />
                {newPaciente && (
                  <p className="text-[11px] text-primary font-body mt-0.5">✓ {newPaciente}</p>
                )}
                {showPacienteDropdown && !newPaciente && (
                  <div className="absolute top-full left-0 right-0 z-20 mt-1 bg-card border border-border rounded-xl shadow-card max-h-40 overflow-y-auto">
                    {pacientes.filter(p => p.nome.toLowerCase().includes(newPacienteSearch.toLowerCase())).length === 0 ? (
                      <p className="px-3 py-2 text-xs text-muted-foreground font-body">Nenhum paciente encontrado. Cadastre primeiro.</p>
                    ) : (
                      pacientes.filter(p => p.nome.toLowerCase().includes(newPacienteSearch.toLowerCase())).map(p => (
                        <button key={p.id} type="button"
                          onClick={() => { setNewPaciente(p.nome); setNewPacienteSearch(p.nome); setShowPacienteDropdown(false); }}
                          className="w-full text-left px-3 py-2 text-sm font-body hover:bg-accent transition-colors flex items-center gap-2">
                          <User size={12} className="text-muted-foreground" />
                          {p.nome}
                        </button>
                      ))
                    )}
                  </div>
                )}
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-xs uppercase tracking-widest text-muted-foreground font-body">Procedimento *</label>
                <select value={newProcedimentoId} onChange={e => setNewProcedimentoId(e.target.value)} className={inputCls}>
                  <option value="">Selecione um procedimento</option>
                  {procedimentos.map(p => (
                    <option key={p.id} value={p.id}>{p.nome}</option>
                  ))}
                </select>
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-xs uppercase tracking-widest text-muted-foreground font-body">Data *</label>
                <input type="date" value={newData} onChange={e => setNewData(e.target.value)} className={inputCls} />
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-xs uppercase tracking-widest text-muted-foreground font-body">Horário *</label>
                <input type="time" value={newHorario} onChange={e => setNewHorario(e.target.value)} className={inputCls} />
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-xs uppercase tracking-widest text-muted-foreground font-body">Observações</label>
                <textarea rows={2} value={newObs} onChange={e => setNewObs(e.target.value)} className={inputCls + " resize-none"} />
              </div>
            </div>
            <div className="flex gap-3 mt-6">
              <button onClick={() => setShowNewModal(false)} className="flex-1 py-2.5 rounded-lg border border-border text-sm font-body hover:bg-muted transition-colors">Cancelar</button>
              <button onClick={handleSave} className="flex-1 py-2.5 rounded-lg text-sm font-body font-medium transition-all hover:opacity-90" style={{ background: "var(--gradient-gold)", color: "hsl(var(--primary-foreground))" }}>
                Salvar
              </button>
            </div>
          </div>
        </div>
      )}
    </AppLayout>
  );
};

const CalendarIcon = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="hsl(var(--primary))" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="4" width="18" height="18" rx="2" />
    <line x1="16" y1="2" x2="16" y2="6" />
    <line x1="8" y1="2" x2="8" y2="6" />
    <line x1="3" y1="10" x2="21" y2="10" />
  </svg>
);

export default Agenda;