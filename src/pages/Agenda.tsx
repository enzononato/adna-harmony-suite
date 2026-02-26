import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import AppLayout from "@/components/AppLayout";
import { ChevronLeft, ChevronRight, Plus, Clock, User, Trash2, Pencil, Save, X, Bell, AlertTriangle, Check, RotateCcw, Tag } from "lucide-react";
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
  duracao_minutos: number | null;
  procedimentos?: { nome: string; duracao_minutos?: number | null } | null;
};

type Aviso = { id: string; texto: string; data: string; concluido: boolean; created_at: string };

type ViewMode = "mensal" | "semanal" | "diario";

const Agenda = () => {
  const navigate = useNavigate();
  const today = new Date();
  const [year, setYear] = useState(today.getFullYear());
  const [month, setMonth] = useState(today.getMonth());
  const [selectedDay, setSelectedDay] = useState<number | null>(today.getDate());
  const [view, setView] = useState<ViewMode>("mensal");
  const [showNewModal, setShowNewModal] = useState(false);
  const [procedimentos, setProcedimentos] = useState<{ id: string; nome: string; duracao_minutos?: number | null; dias_retorno?: number | null }[]>([]);
  const [agendamentos, setAgendamentos] = useState<Agendamento[]>([]);
  const [pacientes, setPacientes] = useState<{ id: string; nome: string }[]>([]);
  const [avisos, setAvisos] = useState<Aviso[]>([]);
  const [showAvisoModal, setShowAvisoModal] = useState(false);
  const [avisoTexto, setAvisoTexto] = useState("");
  const [cronogramaFilter, setCronogramaFilter] = useState<"todos" | "normal" | "retorno" | "confirmado">("todos");
  const [avisoData, setAvisoData] = useState(new Date().toISOString().slice(0, 10));
  const [showCadastrarModal, setShowCadastrarModal] = useState(false);
  const [nomePendenteCadastro, setNomePendenteCadastro] = useState("");
  const [detailAppt, setDetailAppt] = useState<Agendamento | null>(null);

  // Form state (new)
  const [newPaciente, setNewPaciente] = useState("");
  const [newPacienteSearch, setNewPacienteSearch] = useState("");
  const [showPacienteDropdown, setShowPacienteDropdown] = useState(false);
  const [newProcedimentoId, setNewProcedimentoId] = useState("");
  const [newData, setNewData] = useState(new Date().toISOString().slice(0, 10));
  const [newHorario, setNewHorario] = useState("");
  const [newObs, setNewObs] = useState("");
  const [newDuracao, setNewDuracao] = useState("");

  // Edit state
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editPaciente, setEditPaciente] = useState("");
  const [editPacienteSearch, setEditPacienteSearch] = useState("");
  const [showEditPacienteDropdown, setShowEditPacienteDropdown] = useState(false);
  const [editProcedimentoId, setEditProcedimentoId] = useState("");
  const [editData, setEditData] = useState("");
  const [editHorario, setEditHorario] = useState("");
  const [editObs, setEditObs] = useState("");
  const [editDuracao, setEditDuracao] = useState("");

  const fetchData = async () => {
    const [pRes, aRes, pacRes, avRes] = await Promise.all([
      supabase.from("procedimentos").select("id, nome, duracao_minutos, dias_retorno").order("nome"),
      supabase.from("agendamentos").select("*, procedimentos(nome)").order("horario"),
      supabase.from("pacientes").select("id, nome").order("nome"),
      supabase.from("avisos").select("*").order("data"),
    ]);
    if (pRes.data) setProcedimentos(pRes.data);
    if (aRes.data) setAgendamentos(aRes.data as Agendamento[]);
    if (pacRes.data) setPacientes(pacRes.data);
    if (avRes.data) setAvisos(avRes.data as Aviso[]);
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
  const dayAvisos = avisos.filter(a => a.data === selectedDateStr);

  const daysWithAppts = new Set(
    agendamentos
      .filter(a => {
        const d = new Date(a.data + "T00:00:00");
        return d.getFullYear() === year && d.getMonth() === month;
      })
      .map(a => new Date(a.data + "T00:00:00").getDate())
  );

  const daysWithAvisos = new Set(
    avisos
      .filter(a => {
        const d = new Date(a.data + "T00:00:00");
        return d.getFullYear() === year && d.getMonth() === month && !a.concluido;
      })
      .map(a => new Date(a.data + "T00:00:00").getDate())
  );

  const checkOverlap = (data: string, horario: string, duracao: number | null, excludeId?: string): boolean => {
    const newStart = toMinutes(horario);
    const newEnd = newStart + (duracao || 0);
    const sameDayAppts = agendamentos.filter(a => a.data === data && a.id !== excludeId);
    for (const a of sameDayAppts) {
      const aStart = toMinutes(a.horario);
      const aEnd = aStart + (a.duracao_minutos || 0);
      // Se ambos têm duração, checar sobreposição de intervalos
      // Se algum não tem duração, checar apenas horário exato igual
      if (duracao && a.duracao_minutos) {
        if (newStart < aEnd && newEnd > aStart) return true;
      } else {
        if (newStart === aStart) return true;
      }
    }
    return false;
  };

  const toMinutes = (time: string) => {
    const [h, m] = time.split(":").map(Number);
    return h * 60 + m;
  };

  const handleSave = async () => {
    if (!newPaciente.trim()) { toast.error("Informe o nome do paciente."); return; }
    if (!newProcedimentoId) { toast.error("Selecione um procedimento."); return; }
    if (!newHorario) { toast.error("Informe o horário."); return; }

    const dur = newDuracao ? parseInt(newDuracao) : null;
    if (checkOverlap(newData, newHorario, dur)) {
      toast.error("Já existe um agendamento nesse horário. Escolha outro horário.");
      return;
    }

    const { error } = await supabase.from("agendamentos").insert({
      paciente_nome: newPaciente.trim(),
      procedimento_id: newProcedimentoId,
      data: newData,
      horario: newHorario,
      observacoes: newObs.trim() || null,
      duracao_minutos: dur,
    } as any);
    if (error) { toast.error("Erro ao salvar agendamento."); return; }
    toast.success("Agendamento salvo!");

    // Retorno automático
    const proc = procedimentos.find(p => p.id === newProcedimentoId);
    if (proc?.dias_retorno) {
      const retornoDate = new Date(newData + "T00:00:00");
      retornoDate.setDate(retornoDate.getDate() + proc.dias_retorno);
      if (retornoDate.getDay() === 0) retornoDate.setDate(retornoDate.getDate() + 1);
      const retornoDateStr = retornoDate.toISOString().slice(0, 10);
      
      const { error: retErr } = await supabase.from("agendamentos").insert({
        paciente_nome: newPaciente.trim(),
        procedimento_id: newProcedimentoId,
        data: retornoDateStr,
        horario: newHorario,
        observacoes: "Retorno automático",
        duracao_minutos: dur,
      } as any);
      
      const retornoFormatted = retornoDate.toLocaleDateString("pt-BR");
      if (retErr) {
        toast.error(`Erro ao criar retorno automático para ${retornoFormatted}.`);
      } else {
        // Check for conflicts
        const hasConflict = checkOverlap(retornoDateStr, newHorario, dur);
        if (hasConflict) {
          toast.warning(`Retorno agendado para ${retornoFormatted}, mas há conflito de horário. Ajuste manualmente.`);
        } else {
          toast.success(`Retorno agendado automaticamente para ${retornoFormatted}.`);
        }
      }
    }

    // Check if patient is not registered and offer to register
    const isRegistered = pacientes.some(p => p.nome.toLowerCase() === newPaciente.trim().toLowerCase());
    const savedName = newPaciente.trim();

    setShowNewModal(false);
    resetForm();
    fetchData();

    if (!isRegistered) {
      setNomePendenteCadastro(savedName);
      setShowCadastrarModal(true);
    }
  };

  const isRetornoAuto = (a: Agendamento) => a.observacoes === "Retorno automático";
  const isRetornoConfirmado = (a: Agendamento) => a.observacoes === "Retorno confirmado";

  const handleConfirmRetorno = async (a: Agendamento) => {
    // Mark this return as confirmed (remove the "Retorno automático" tag)
    const { error } = await supabase.from("agendamentos").update({
      observacoes: "Retorno confirmado",
    } as any).eq("id", a.id);
    if (error) { toast.error("Erro ao confirmar retorno."); return; }
    toast.success("Retorno confirmado!");

    // Schedule next automatic return based on procedure's dias_retorno
    const proc = procedimentos.find(p => p.id === a.procedimento_id);
    if (proc?.dias_retorno) {
      const retornoDate = new Date(a.data + "T00:00:00");
      retornoDate.setDate(retornoDate.getDate() + proc.dias_retorno);
      if (retornoDate.getDay() === 0) retornoDate.setDate(retornoDate.getDate() + 1);
      const retornoDateStr = retornoDate.toISOString().slice(0, 10);

      const { error: retErr } = await supabase.from("agendamentos").insert({
        paciente_nome: a.paciente_nome,
        procedimento_id: a.procedimento_id,
        data: retornoDateStr,
        horario: a.horario,
        observacoes: "Retorno automático",
        duracao_minutos: a.duracao_minutos,
      } as any);

      const retornoFormatted = retornoDate.toLocaleDateString("pt-BR");
      if (retErr) {
        toast.error(`Erro ao criar próximo retorno para ${retornoFormatted}.`);
      } else {
        const hasConflict = checkOverlap(retornoDateStr, a.horario, a.duracao_minutos);
        if (hasConflict) {
          toast.warning(`Próximo retorno agendado para ${retornoFormatted}, mas há conflito de horário.`);
        } else {
          toast.success(`Próximo retorno agendado para ${retornoFormatted}.`);
        }
      }
    }
    fetchData();
  };

  const handleRejectRetorno = async (id: string) => {
    if (!confirm("Cancelar este retorno automático?")) return;
    const { error } = await supabase.from("agendamentos").delete().eq("id", id);
    if (error) { toast.error("Erro ao cancelar retorno."); return; }
    toast.success("Retorno cancelado.");
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
    setEditDuracao(a.duracao_minutos != null ? String(a.duracao_minutos) : "");
    setShowEditPacienteDropdown(false);
  };

  const handleUpdate = async () => {
    if (!editingId || !editPaciente || !editProcedimentoId || !editHorario) {
      toast.error("Preencha todos os campos obrigatórios.");
      return;
    }
    const dur = editDuracao ? parseInt(editDuracao) : null;
    if (checkOverlap(editData, editHorario, dur, editingId)) {
      toast.error("Já existe um agendamento nesse horário. Escolha outro horário.");
      return;
    }

    // Get the original appointment to detect changes
    const original = agendamentos.find(a => a.id === editingId);

    const { error } = await supabase.from("agendamentos").update({
      paciente_nome: editPaciente.trim(),
      procedimento_id: editProcedimentoId,
      data: editData,
      horario: editHorario,
      observacoes: editObs.trim() || null,
      duracao_minutos: editDuracao ? parseInt(editDuracao) : null,
    } as any).eq("id", editingId);
    if (error) { toast.error("Erro ao atualizar."); return; }
    toast.success("Agendamento atualizado!");

    // Propagate changes to linked auto-return appointments
    if (original) {
      const linkedReturns = agendamentos.filter(a =>
        a.id !== editingId &&
        a.observacoes === "Retorno automático" &&
        a.paciente_nome === original.paciente_nome &&
        a.procedimento_id === original.procedimento_id &&
        a.data > original.data
      );

      for (const ret of linkedReturns) {
        const updatePayload: any = {};
        if (editPaciente.trim() !== original.paciente_nome) updatePayload.paciente_nome = editPaciente.trim();
        if (editProcedimentoId !== original.procedimento_id) updatePayload.procedimento_id = editProcedimentoId;
        if (editHorario !== original.horario) updatePayload.horario = editHorario;
        if (dur !== original.duracao_minutos) updatePayload.duracao_minutos = dur;

        // If date changed, recalculate return date
        if (editData !== original.data) {
          const proc = procedimentos.find(p => p.id === editProcedimentoId);
          if (proc?.dias_retorno) {
            const retornoDate = new Date(editData + "T00:00:00");
            retornoDate.setDate(retornoDate.getDate() + proc.dias_retorno);
            if (retornoDate.getDay() === 0) retornoDate.setDate(retornoDate.getDate() + 1);
            updatePayload.data = retornoDate.toISOString().slice(0, 10);
          }
        }

        if (Object.keys(updatePayload).length > 0) {
          await supabase.from("agendamentos").update(updatePayload).eq("id", ret.id);
        }
      }

      if (linkedReturns.length > 0) {
        toast.info("Retorno(s) automático(s) atualizado(s) também.");
      }
    }

    setEditingId(null);
    fetchData();
  };

  const handleAddAviso = async () => {
    if (!avisoTexto.trim()) { toast.error("Digite o texto do aviso."); return; }
    const { error } = await supabase.from("avisos").insert({ texto: avisoTexto.trim(), data: avisoData } as any);
    if (error) { toast.error("Erro ao salvar aviso."); return; }
    toast.success("Aviso criado!");
    setShowAvisoModal(false);
    setAvisoTexto("");
    fetchData();
  };

  const handleDeleteAviso = async (id: string) => {
    const { error } = await supabase.from("avisos").delete().eq("id", id);
    if (error) { toast.error("Erro ao excluir aviso."); return; }
    fetchData();
  };

  const handleToggleAviso = async (id: string, concluido: boolean) => {
    await supabase.from("avisos").update({ concluido: !concluido } as any).eq("id", id);
    fetchData();
  };


  const handleCadastrarPaciente = async () => {
    if (!nomePendenteCadastro.trim()) return;
    const { data, error } = await supabase.from("pacientes").insert({ nome: nomePendenteCadastro.trim() } as any).select("id").single();
    if (error) { toast.error("Erro ao cadastrar paciente."); return; }
    toast.success(`${nomePendenteCadastro} cadastrado(a) como paciente!`);
    setShowCadastrarModal(false);
    setNomePendenteCadastro("");
    fetchData();
    if (data?.id) {
      navigate(`/pacientes?abrir=${data.id}`);
    }
  };

  const openAvisoModal = () => {
    setAvisoTexto("");
    setAvisoData(selectedDateStr || new Date().toISOString().slice(0, 10));
    setShowAvisoModal(true);
  };

  const resetForm = () => {
    setNewPaciente(""); setNewPacienteSearch(""); setNewProcedimentoId(""); setNewData(new Date().toISOString().slice(0, 10)); setNewHorario(""); setNewObs(""); setNewDuracao("");
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
            <button
              onClick={openAvisoModal}
              className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-body font-medium transition-all hover:opacity-90 bg-destructive text-destructive-foreground">
              <Bell size={15} />
              Novo aviso
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
                const hasAvisos = daysWithAvisos.has(day);
                return (
                  <button
                    key={day}
                    onClick={() => setSelectedDay(day)}
                    className="relative aspect-square flex flex-col items-center justify-center rounded-xl text-sm font-body transition-all hover:bg-accent"
                    style={isSelected ? { background: "var(--gradient-gold)", color: "hsl(var(--primary-foreground))", fontWeight: 600 }
                      : isToday ? { border: "1.5px solid hsl(var(--primary))", color: "hsl(var(--primary))", fontWeight: 600 } : {}}>
                    {day}
                    {(hasAppts || hasAvisos) && !isSelected && (
                      <span className="absolute bottom-1 flex gap-0.5">
                        {hasAppts && <span className="w-1.5 h-1.5 rounded-full bg-primary" />}
                        {hasAvisos && <span className="w-1.5 h-1.5 rounded-full bg-destructive" />}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Day appointments */}
          <div className="bg-card rounded-2xl border border-border shadow-card p-5">
            <div className="mb-3">
              <p className="text-xs uppercase tracking-widest text-muted-foreground font-body">
                {selectedDay ? `${selectedDay} de ${MONTHS[month]}` : "Selecione um dia"}
              </p>
              <h3 className="font-display text-xl mt-0.5">Cronograma</h3>
            </div>

            {/* Legenda */}
            <div className="flex flex-wrap gap-3 mb-3">
              {[
                { key: "todos", label: "Todos", color: "bg-muted-foreground" },
                { key: "normal", label: "Normal", color: "bg-primary" },
                { key: "retorno", label: "Retorno", color: "bg-blue-500" },
                { key: "confirmado", label: "Confirmado", color: "bg-green-500" },
              ].map(f => (
                <button key={f.key} onClick={() => setCronogramaFilter(f.key as any)}
                  className={`flex items-center gap-1.5 text-[10px] font-body font-medium px-2 py-1 rounded-full border transition-all ${cronogramaFilter === f.key ? "border-foreground/30 bg-accent" : "border-transparent opacity-60 hover:opacity-100"}`}>
                  <span className={`w-2 h-2 rounded-full ${f.color}`} />
                  {f.label}
                </button>
              ))}
            </div>

            {dayAppointments.length === 0 && dayAvisos.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <div className="w-12 h-12 rounded-full flex items-center justify-center mb-3 bg-accent">
                  <CalendarIcon />
                </div>
                <p className="text-sm text-muted-foreground font-body">Nenhuma consulta ou aviso neste dia</p>
              </div>
            ) : (
              <div className="flex flex-col gap-3">
                {/* Avisos */}
                {dayAvisos.map(av => (
                  <div key={av.id} className={`flex gap-3 p-3 rounded-xl border border-destructive/30 group ${av.concluido ? "bg-muted/40 opacity-60" : "bg-destructive/10"}`}>
                    <div className="flex flex-col items-center gap-1 min-w-[36px]">
                      <Bell size={12} className="text-destructive" />
                      <span className="text-[10px] font-body font-medium text-destructive">Aviso</span>
                    </div>
                    <div className="h-full w-px bg-destructive/30" />
                    <div className="flex-1 min-w-0">
                      <p className={`text-xs font-body font-medium ${av.concluido ? "line-through text-muted-foreground" : "text-destructive"}`}>{av.texto}</p>
                    </div>
                    <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-all self-start">
                      <button onClick={() => handleToggleAviso(av.id, av.concluido)}
                        className="text-muted-foreground hover:text-primary p-1" title={av.concluido ? "Reabrir" : "Concluir"}>
                        {av.concluido ? <AlertTriangle size={13} /> : <Save size={13} />}
                      </button>
                      <button onClick={() => handleDeleteAviso(av.id)} className="text-muted-foreground hover:text-destructive p-1" title="Excluir">
                        <Trash2 size={13} />
                      </button>
                    </div>
                  </div>
                ))}
                {/* Agendamentos */}
                {dayAppointments
                  .filter(a => {
                    if (cronogramaFilter === "todos") return true;
                    if (cronogramaFilter === "retorno") return isRetornoAuto(a);
                    if (cronogramaFilter === "confirmado") return isRetornoConfirmado(a);
                    return !isRetornoAuto(a) && !isRetornoConfirmado(a);
                  })
                  .map(a => {
                  const isRetorno = isRetornoAuto(a);
                  const isConfirmado = isRetornoConfirmado(a);
                  const cardClass = isRetorno
                    ? "bg-blue-500/10 border border-blue-500/30"
                    : isConfirmado
                      ? "bg-green-500/10 border border-green-500/30"
                      : "bg-accent/40";
                  const accentColor = isRetorno ? "text-blue-500" : isConfirmado ? "text-green-600" : "text-primary";
                  const dividerColor = isRetorno ? "bg-blue-500/30" : isConfirmado ? "bg-green-500/30" : "bg-primary/30";

                  return (
                    <div key={a.id} className={`flex flex-col gap-2 p-3 rounded-xl group cursor-pointer ${cardClass}`} onClick={() => setDetailAppt(a)}>
                      <div className="flex gap-3">
                        <div className="flex flex-col items-center gap-1 min-w-[36px]">
                          {isRetorno ? <RotateCcw size={12} className="text-blue-500" />
                            : isConfirmado ? <Check size={12} className="text-green-600" />
                            : <Clock size={12} className="text-primary" />}
                          <span className={`text-xs font-body font-medium ${accentColor}`}>
                            {a.horario.slice(0, 5)}
                            {a.duracao_minutos ? (() => {
                              const [h, m] = a.horario.split(":").map(Number);
                              const end = new Date(2000, 0, 1, h, m + a.duracao_minutos);
                              return ` - ${String(end.getHours()).padStart(2, "0")}:${String(end.getMinutes()).padStart(2, "0")}`;
                            })() : ""}
                          </span>
                        </div>
                        <div className={`h-auto w-px ${dividerColor}`} />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-1.5 mb-0.5">
                            <User size={11} className="text-muted-foreground flex-shrink-0" />
                            <p className="text-xs font-body font-medium truncate">{a.paciente_nome}</p>
                          </div>
                          <p className="text-[11px] text-muted-foreground font-body">{a.procedimentos?.nome || "—"}</p>
                          {isRetorno && (
                            <span className="inline-flex items-center gap-1 mt-1 px-1.5 py-0.5 rounded text-[10px] font-body font-medium bg-blue-500/20 text-blue-600">
                              <RotateCcw size={9} /> Retorno automático
                            </span>
                          )}
                          {isConfirmado && (
                            <span className="inline-flex items-center gap-1 mt-1 px-1.5 py-0.5 rounded text-[10px] font-body font-medium bg-green-500/20 text-green-700">
                              <Check size={9} /> Retorno confirmado
                            </span>
                          )}
                        </div>
                        <div className={`flex gap-1 self-start ${!isRetorno && !isConfirmado ? "opacity-0 group-hover:opacity-100" : ""} transition-all`}>
                          <button onClick={(e) => { e.stopPropagation(); startEdit(a); }} className="text-muted-foreground hover:text-primary p-1" title="Editar">
                            <Pencil size={13} />
                          </button>
                          <button onClick={(e) => { e.stopPropagation(); handleDelete(a.id); }} className="text-muted-foreground hover:text-destructive p-1" title="Excluir">
                            <Trash2 size={13} />
                          </button>
                        </div>
                      </div>
                      {isRetorno && (
                        <div className="flex gap-1.5 ml-[45px]">
                          <button onClick={(e) => { e.stopPropagation(); handleConfirmRetorno(a); }} className="flex items-center gap-1 text-xs font-body text-green-600 hover:text-green-700 hover:bg-green-100 px-2 py-1 rounded transition-colors" title="Confirmar retorno">
                            <Check size={13} strokeWidth={2.5} /> Confirmar
                          </button>
                          <button onClick={(e) => { e.stopPropagation(); handleRejectRetorno(a.id); }} className="flex items-center gap-1 text-xs font-body text-destructive hover:bg-destructive/10 px-2 py-1 rounded transition-colors" title="Cancelar retorno">
                            <X size={13} strokeWidth={2.5} /> Cancelar
                          </button>
                        </div>
                      )}
                    </div>
                  );
                })}
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
                <select value={editProcedimentoId} onChange={e => {
                  const procId = e.target.value;
                  setEditProcedimentoId(procId);
                  const proc = procedimentos.find(p => p.id === procId);
                  if (proc?.duracao_minutos != null) setEditDuracao(String(proc.duracao_minutos));
                }} className={inputCls}>
                  <option value="">Selecione</option>
                  {procedimentos.map(p => <option key={p.id} value={p.id}>{p.nome}</option>)}
                </select>
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-xs uppercase tracking-widest text-muted-foreground font-body">Data *</label>
                <input type="date" value={editData} onChange={e => setEditData(e.target.value)} className={inputCls} />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="flex flex-col gap-1">
                  <label className="text-xs uppercase tracking-widest text-muted-foreground font-body">Horário *</label>
                  <input type="time" value={editHorario} onChange={e => setEditHorario(e.target.value)} className={inputCls} />
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-xs uppercase tracking-widest text-muted-foreground font-body">Duração (min)</label>
                  <input type="number" value={editDuracao} onChange={e => setEditDuracao(e.target.value)} className={inputCls} placeholder="Ex: 60" />
                </div>
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
                  onChange={e => { setNewPacienteSearch(e.target.value); setNewPaciente(e.target.value); setShowPacienteDropdown(true); }}
                  onFocus={() => setShowPacienteDropdown(true)}
                  onBlur={() => setTimeout(() => setShowPacienteDropdown(false), 150)}
                  placeholder="Digite o nome do paciente..."
                  className={`${inputCls} ${newPaciente ? "bg-accent border-primary/40" : ""}`} />
                {showPacienteDropdown && newPacienteSearch && (
                  <div className="absolute top-full left-0 right-0 z-20 mt-1 bg-card border border-border rounded-xl shadow-card max-h-40 overflow-y-auto">
                    {pacientes.filter(p => p.nome.toLowerCase().includes(newPacienteSearch.toLowerCase())).map(p => (
                      <button key={p.id} type="button"
                        onClick={() => { setNewPaciente(p.nome); setNewPacienteSearch(p.nome); setShowPacienteDropdown(false); }}
                        className="w-full text-left px-3 py-2 text-sm font-body hover:bg-accent transition-colors flex items-center gap-2">
                        <User size={12} className="text-muted-foreground" />
                        {p.nome}
                      </button>
                    ))}
                  </div>
                )}
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-xs uppercase tracking-widest text-muted-foreground font-body">Procedimento *</label>
                <select value={newProcedimentoId} onChange={e => {
                  const procId = e.target.value;
                  setNewProcedimentoId(procId);
                  const proc = procedimentos.find(p => p.id === procId);
                  if (proc?.duracao_minutos != null) setNewDuracao(String(proc.duracao_minutos));
                }} className={inputCls}>
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
              <div className="grid grid-cols-2 gap-3">
                <div className="flex flex-col gap-1">
                  <label className="text-xs uppercase tracking-widest text-muted-foreground font-body">Horário *</label>
                  <input type="time" value={newHorario} onChange={e => setNewHorario(e.target.value)} className={inputCls} />
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-xs uppercase tracking-widest text-muted-foreground font-body">Duração (min)</label>
                  <input type="number" value={newDuracao} onChange={e => setNewDuracao(e.target.value)} className={inputCls} placeholder="Ex: 60" />
                </div>
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

      {/* Modal: Novo Aviso */}
      {showAvisoModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-foreground/30 backdrop-blur-sm" onClick={() => setShowAvisoModal(false)} />
          <div className="relative z-10 bg-card rounded-2xl border border-border shadow-card w-full max-w-sm p-6">
            <div className="h-0.5 w-full rounded-full mb-6 bg-destructive" />
            <h3 className="font-display text-2xl mb-5">Novo Aviso</h3>
            <div className="flex flex-col gap-4">
              <div className="flex flex-col gap-1">
                <label className="text-xs uppercase tracking-widest text-muted-foreground font-body">Data</label>
                <input type="date" value={avisoData} onChange={e => setAvisoData(e.target.value)} className={inputCls} />
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-xs uppercase tracking-widest text-muted-foreground font-body">Aviso *</label>
                <textarea rows={3} value={avisoTexto} onChange={e => setAvisoTexto(e.target.value)}
                  className={inputCls + " resize-none"} placeholder="Ex: Lembrar paciente sobre retorno..." autoFocus />
              </div>
            </div>
            <div className="flex gap-3 mt-6">
              <button onClick={() => setShowAvisoModal(false)} className="flex-1 py-2.5 rounded-lg border border-border text-sm font-body hover:bg-muted transition-colors">Cancelar</button>
              <button onClick={handleAddAviso} className="flex-1 py-2.5 rounded-lg text-sm font-body font-medium bg-destructive text-destructive-foreground hover:opacity-90 transition-all">
                Salvar aviso
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal: Cadastrar paciente */}
      {showCadastrarModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-foreground/30 backdrop-blur-sm" onClick={() => { setShowCadastrarModal(false); setNomePendenteCadastro(""); }} />
          <div className="relative z-10 bg-card rounded-2xl border border-border shadow-card w-full max-w-sm p-6">
            <div className="h-0.5 w-full rounded-full mb-6" style={{ background: "var(--gradient-gold)" }} />
            <h3 className="font-display text-xl mb-3">Cadastrar como paciente?</h3>
            <p className="text-sm text-muted-foreground font-body mb-5">
              <strong className="text-foreground">{nomePendenteCadastro}</strong> não está cadastrado(a) como paciente. Deseja cadastrar agora?
            </p>
            <div className="flex gap-3">
              <button onClick={() => { setShowCadastrarModal(false); setNomePendenteCadastro(""); }} className="flex-1 py-2.5 rounded-lg border border-border text-sm font-body hover:bg-muted transition-colors">Não</button>
              <button onClick={handleCadastrarPaciente} className="flex-1 py-2.5 rounded-lg text-sm font-body font-medium transition-all hover:opacity-90" style={{ background: "var(--gradient-gold)", color: "hsl(var(--primary-foreground))" }}>
                Sim, cadastrar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Detail popup for appointment */}
      {detailAppt && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-foreground/30 backdrop-blur-sm" onClick={() => setDetailAppt(null)} />
          <div className="relative z-10 bg-card rounded-2xl border border-border shadow-card w-full max-w-md p-6">
            <div className="h-0.5 w-full rounded-full mb-5" style={{ background: isRetornoAuto(detailAppt) ? "hsl(217 91% 60%)" : isRetornoConfirmado(detailAppt) ? "hsl(142 71% 45%)" : "var(--gradient-gold)" }} />
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-display text-xl">Detalhes do Agendamento</h3>
              <button onClick={() => setDetailAppt(null)} className="text-muted-foreground hover:text-foreground p-1"><X size={18} /></button>
            </div>
            <div className="flex flex-col gap-3">
              <div className="flex items-center gap-3 p-3 rounded-xl bg-accent/50">
                <User size={16} className="text-primary flex-shrink-0" />
                <div>
                  <p className="text-[10px] uppercase tracking-widest text-muted-foreground font-body">Paciente</p>
                  <p className="text-sm font-body font-medium">{detailAppt.paciente_nome}</p>
                </div>
              </div>
              <div className="flex items-center gap-3 p-3 rounded-xl bg-accent/50">
                <Tag size={16} className="text-primary flex-shrink-0" />
                <div>
                  <p className="text-[10px] uppercase tracking-widest text-muted-foreground font-body">Procedimento</p>
                  <p className="text-sm font-body font-medium">{detailAppt.procedimentos?.nome || "—"}</p>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="flex items-center gap-3 p-3 rounded-xl bg-accent/50">
                  <CalendarIcon />
                  <div>
                    <p className="text-[10px] uppercase tracking-widest text-muted-foreground font-body">Data</p>
                    <p className="text-sm font-body font-medium">{new Date(detailAppt.data + "T00:00:00").toLocaleDateString("pt-BR")}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 p-3 rounded-xl bg-accent/50">
                  <Clock size={16} className="text-primary flex-shrink-0" />
                  <div>
                    <p className="text-[10px] uppercase tracking-widest text-muted-foreground font-body">Horário</p>
                    <p className="text-sm font-body font-medium">
                      {detailAppt.horario.slice(0, 5)}
                      {detailAppt.duracao_minutos ? (() => {
                        const [h, m] = detailAppt.horario.split(":").map(Number);
                        const end = new Date(2000, 0, 1, h, m + detailAppt.duracao_minutos);
                        return ` — ${String(end.getHours()).padStart(2, "0")}:${String(end.getMinutes()).padStart(2, "0")}`;
                      })() : ""}
                    </p>
                  </div>
                </div>
              </div>
              {detailAppt.duracao_minutos && (
                <div className="flex items-center gap-3 p-3 rounded-xl bg-accent/50">
                  <Clock size={16} className="text-muted-foreground flex-shrink-0" />
                  <div>
                    <p className="text-[10px] uppercase tracking-widest text-muted-foreground font-body">Duração</p>
                    <p className="text-sm font-body font-medium">{detailAppt.duracao_minutos} minutos</p>
                  </div>
                </div>
              )}
              {detailAppt.observacoes && (
                <div className="p-3 rounded-xl bg-accent/50">
                  <p className="text-[10px] uppercase tracking-widest text-muted-foreground font-body mb-1">Observações</p>
                  <p className="text-sm font-body">{detailAppt.observacoes}</p>
                </div>
              )}
              {isRetornoAuto(detailAppt) && (
                <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-body font-medium bg-blue-500/15 text-blue-600 w-fit">
                  <RotateCcw size={12} /> Retorno automático
                </span>
              )}
              {isRetornoConfirmado(detailAppt) && (
                <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-body font-medium bg-green-500/15 text-green-700 w-fit">
                  <Check size={12} /> Retorno confirmado
                </span>
              )}
            </div>
            <div className="flex gap-3 mt-5">
              <button onClick={() => setDetailAppt(null)} className="flex-1 py-2.5 rounded-lg border border-border text-sm font-body hover:bg-muted transition-colors">Fechar</button>
              <button onClick={() => { startEdit(detailAppt); setDetailAppt(null); }} className="flex-1 py-2.5 rounded-lg text-sm font-body font-medium transition-all hover:opacity-90" style={{ background: "var(--gradient-gold)", color: "hsl(var(--primary-foreground))" }}>
                Editar
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