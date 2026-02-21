import { useState, useEffect } from "react";
import AppLayout from "@/components/AppLayout";
import { ChevronLeft, ChevronRight, Plus, Clock, User } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

const DAYS = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];
const MONTHS = ["Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho", "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"];

const mockAppointments: Record<string, { time: string; patient: string; procedure: string }[]> = {
  "15": [
    { time: "09:00", patient: "Ana Paula Souza", procedure: "Tratamento de manchas" },
    { time: "11:00", patient: "Carla Mendes", procedure: "Limpeza de pele" },
  ],
  "16": [
    { time: "10:30", patient: "Fernanda Lima", procedure: "Consulta" },
  ],
  "18": [
    { time: "14:00", patient: "Juliana Costa", procedure: "Flacidez facial" },
    { time: "15:30", patient: "Mariana Rocha", procedure: "Gordura localizada" },
    { time: "17:00", patient: "Renata Alves", procedure: "Celulite" },
  ],
  "20": [
    { time: "09:00", patient: "Tatiana Cruz", procedure: "Consulta" },
  ],
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
  const [newProcedimentoId, setNewProcedimentoId] = useState("");

  useEffect(() => {
    const fetchProcedimentos = async () => {
      const { data } = await supabase.from("procedimentos").select("id, nome").order("nome");
      if (data) setProcedimentos(data);
    };
    fetchProcedimentos();
  }, []);

  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  const prevMonth = () => { if (month === 0) { setMonth(11); setYear(y => y - 1); } else setMonth(m => m - 1); };
  const nextMonth = () => { if (month === 11) { setMonth(0); setYear(y => y + 1); } else setMonth(m => m + 1); };

  const appointments = selectedDay ? (mockAppointments[String(selectedDay)] ?? []) : [];

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
              onClick={() => { setNewProcedimentoId(""); setShowNewModal(true); }}
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
                const hasAppts = !!mockAppointments[String(day)];
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
                        {(mockAppointments[String(day)] ?? []).slice(0, 3).map((_, idx) => (
                          <span key={idx} className="w-1 h-1 rounded-full bg-primary" />
                        ))}
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
              <h3 className="font-display text-xl mt-0.5">Consultas</h3>
            </div>

            {appointments.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <div className="w-12 h-12 rounded-full flex items-center justify-center mb-3 bg-accent">
                  <CalendarIcon />
                </div>
                <p className="text-sm text-muted-foreground font-body">Nenhuma consulta neste dia</p>
              </div>
            ) : (
              <div className="flex flex-col gap-3">
                {appointments.map((a, i) => (
                  <div key={i} className="flex gap-3 p-3 rounded-xl bg-accent/40">
                    <div className="flex flex-col items-center gap-1 min-w-[36px]">
                      <Clock size={12} className="text-primary" />
                      <span className="text-xs font-body font-medium text-primary">{a.time}</span>
                    </div>
                    <div className="h-full w-px bg-primary/30" />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5 mb-0.5">
                        <User size={11} className="text-muted-foreground flex-shrink-0" />
                        <p className="text-xs font-body font-medium truncate">{a.patient}</p>
                      </div>
                      <p className="text-[11px] text-muted-foreground font-body">{a.procedure}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* New appointment modal */}
      {showNewModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-foreground/30 backdrop-blur-sm" onClick={() => setShowNewModal(false)} />
          <div className="relative z-10 bg-card rounded-2xl border border-border shadow-card w-full max-w-md p-6">
            <div className="h-0.5 w-full rounded-full mb-6" style={{ background: "var(--gradient-gold)" }} />
            <h3 className="font-display text-2xl mb-5">Novo Agendamento</h3>
            <div className="flex flex-col gap-4">
              <div className="flex flex-col gap-1">
                <label className="text-xs uppercase tracking-widest text-muted-foreground font-body">Paciente</label>
                <input type="text" className="px-3 py-2 rounded-lg bg-muted border border-border text-sm font-body focus:outline-none focus:ring-2 focus:ring-primary/30" />
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-xs uppercase tracking-widest text-muted-foreground font-body">Procedimento</label>
                <select
                  value={newProcedimentoId}
                  onChange={(e) => setNewProcedimentoId(e.target.value)}
                  className="px-3 py-2 rounded-lg bg-muted border border-border text-sm font-body focus:outline-none focus:ring-2 focus:ring-primary/30">
                  <option value="">Selecione um procedimento</option>
                  {procedimentos.map(p => (
                    <option key={p.id} value={p.id}>{p.nome}</option>
                  ))}
                </select>
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-xs uppercase tracking-widest text-muted-foreground font-body">Data</label>
                <input type="date" className="px-3 py-2 rounded-lg bg-muted border border-border text-sm font-body focus:outline-none focus:ring-2 focus:ring-primary/30" />
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-xs uppercase tracking-widest text-muted-foreground font-body">Horário</label>
                <input type="time" className="px-3 py-2 rounded-lg bg-muted border border-border text-sm font-body focus:outline-none focus:ring-2 focus:ring-primary/30" />
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-xs uppercase tracking-widest text-muted-foreground font-body">Observações</label>
                <textarea rows={2} className="px-3 py-2 rounded-lg bg-muted border border-border text-sm font-body focus:outline-none focus:ring-2 focus:ring-primary/30 resize-none" />
              </div>
            </div>
            <div className="flex gap-3 mt-6">
              <button onClick={() => setShowNewModal(false)} className="flex-1 py-2.5 rounded-lg border border-border text-sm font-body hover:bg-muted transition-colors">Cancelar</button>
              <button onClick={() => setShowNewModal(false)} className="flex-1 py-2.5 rounded-lg text-sm font-body font-medium transition-all hover:opacity-90" style={{ background: "var(--gradient-gold)", color: "hsl(var(--primary-foreground))" }}>
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
