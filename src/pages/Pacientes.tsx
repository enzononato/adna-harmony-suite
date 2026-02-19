import { useState } from "react";
import AppLayout from "@/components/AppLayout";
import { Search, Plus, ChevronRight, X, MessageCircle, FileText, Calendar, ClipboardList, ArrowLeft } from "lucide-react";

interface Treatment {
  date: string;
  procedure: string;
  notes: string;
}

interface Patient {
  id: number;
  name: string;
  phone: string;
  age: number;
  lastVisit: string;
  nextVisit: string;
  avatar: string;
  treatments: Treatment[];
  anamnesis: string;
}

const mockPatients: Patient[] = [
  {
    id: 1, name: "Ana Paula Souza", phone: "5511999990001", age: 34, lastVisit: "10/06/2025", nextVisit: "15/07/2025", avatar: "AP",
    treatments: [
      { date: "10/06/2025", procedure: "Toxina Botulínica — Glabela e Testa", notes: "20U Dysport. Resultado excelente. Paciente satisfeita." },
      { date: "12/03/2025", procedure: "Bioestimulador de Colágeno", notes: "Sculptra 1 vial. Retorno em 3 meses." },
    ],
    anamnesis: "Alérgica a dipirona. Não faz uso de anticoagulantes. HAS controlada com losartana. Nega tabagismo.",
  },
  {
    id: 2, name: "Carla Mendes", phone: "5511999990002", age: 28, lastVisit: "05/06/2025", nextVisit: "20/07/2025", avatar: "CM",
    treatments: [
      { date: "05/06/2025", procedure: "Preenchimento Labial", notes: "0.5ml Juvederm. Lábio superior e inferior. Sem intercorrências." },
    ],
    anamnesis: "Sem alergias conhecidas. Não faz uso de medicamentos. Nega tabagismo e etilismo.",
  },
  {
    id: 3, name: "Fernanda Lima", phone: "5511999990003", age: 42, lastVisit: "01/06/2025", nextVisit: "01/08/2025", avatar: "FL",
    treatments: [
      { date: "01/06/2025", procedure: "Bioestimulador de Colágeno", notes: "Radiesse. Área malar e têmporas." },
      { date: "15/01/2025", procedure: "Toxina Botulínica", notes: "Área periocular. 30U Botox." },
      { date: "10/10/2024", procedure: "Preenchimento Malar", notes: "2ml Juvederm Voluma. Excelente resultado." },
    ],
    anamnesis: "Hipotireoidismo controlado. Alérgica a penicilina. Não fuma.",
  },
  {
    id: 4, name: "Juliana Costa", phone: "5511999990004", age: 31, lastVisit: "28/05/2025", nextVisit: "10/07/2025", avatar: "JC",
    treatments: [
      { date: "28/05/2025", procedure: "Skinbooster", notes: "Restylane Vital. Hidratação facial intensa." },
    ],
    anamnesis: "Sem comorbidades. Faz uso de anticoncepcional oral.",
  },
  {
    id: 5, name: "Mariana Rocha", phone: "5511999990005", age: 38, lastVisit: "20/05/2025", nextVisit: "25/07/2025", avatar: "MR",
    treatments: [
      { date: "20/05/2025", procedure: "Fios de PDO", notes: "12 fios. Lifting facial leve. Boa ancoragem." },
    ],
    anamnesis: "DM2 compensada. Sem alergias. Não anticoagulada.",
  },
];

type Tab = "historico" | "anamnese";

const Pacientes = () => {
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<Patient | null>(null);
  const [tab, setTab] = useState<Tab>("historico");
  const [showNew, setShowNew] = useState(false);

  const filtered = mockPatients.filter(p => p.name.toLowerCase().includes(search.toLowerCase()));

  const whatsappLink = (phone: string) => `https://wa.me/${phone}`;

  return (
    <AppLayout>
      <div className="max-w-5xl mx-auto">
        {selected ? (
          /* Patient detail */
          <div>
            <button onClick={() => setSelected(null)} className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors mb-6 font-body">
              <ArrowLeft size={15} /> Voltar para Pacientes
            </button>

            {/* Patient header card */}
            <div className="bg-card rounded-2xl border border-border shadow-card p-6 mb-5">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                  <div className="w-16 h-16 rounded-2xl flex items-center justify-center text-xl font-display font-medium" style={{ background: "hsl(var(--gold-light))", color: "hsl(var(--primary))" }}>
                    {selected.avatar}
                  </div>
                  <div>
                    <h2 className="text-2xl font-display">{selected.name}</h2>
                    <div className="flex flex-wrap gap-4 mt-1">
                      <span className="text-sm text-muted-foreground font-body">{selected.age} anos</span>
                      <span className="text-sm text-muted-foreground font-body flex items-center gap-1"><Calendar size={12} /> Última: {selected.lastVisit}</span>
                      <span className="text-sm text-muted-foreground font-body flex items-center gap-1"><Calendar size={12} /> Próxima: {selected.nextVisit}</span>
                    </div>
                  </div>
                </div>
                <a
                  href={whatsappLink(selected.phone)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-body font-medium transition-all hover:opacity-90 self-start sm:self-auto"
                  style={{ background: "#25D366", color: "#fff" }}>
                  <MessageCircle size={16} />
                  WhatsApp
                </a>
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
                {selected.treatments.map((t, i) => (
                  <div key={i} className="bg-card rounded-2xl border border-border shadow-card p-5">
                    <div className="flex items-start justify-between gap-3 mb-3">
                      <div>
                        <p className="font-body font-medium text-sm">{t.procedure}</p>
                        <p className="text-xs text-muted-foreground font-body mt-0.5 flex items-center gap-1"><Calendar size={11} />{t.date}</p>
                      </div>
                      <span className="text-xs font-body px-2.5 py-1 rounded-full" style={{ background: "hsl(var(--gold-light))", color: "hsl(var(--primary))" }}>
                        Relatório #{i + 1}
                      </span>
                    </div>
                    <div className="h-px bg-border mb-3" />
                    <p className="text-sm text-muted-foreground font-body leading-relaxed">{t.notes}</p>
                  </div>
                ))}
                <button className="flex items-center justify-center gap-2 p-4 rounded-2xl border-2 border-dashed border-border hover:border-primary/40 text-muted-foreground hover:text-primary transition-all font-body text-sm">
                  <Plus size={15} /> Adicionar relatório
                </button>
              </div>
            ) : (
              <div className="bg-card rounded-2xl border border-border shadow-card p-6">
                <div className="flex items-center gap-2 mb-4">
                  <ClipboardList size={16} style={{ color: "hsl(var(--primary))" }} />
                  <h3 className="font-display text-xl">Ficha de Anamnese</h3>
                </div>
                <div className="bg-muted rounded-xl p-4">
                  <p className="text-sm font-body leading-relaxed text-foreground">{selected.anamnesis}</p>
                </div>
                <button className="mt-4 flex items-center gap-2 text-sm font-body text-primary hover:underline">
                  <FileText size={13} /> Editar anamnese
                </button>
              </div>
            )}
          </div>
        ) : (
          /* Patient list */
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

            {/* Search */}
            <div className="relative mb-6">
              <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <input
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Buscar paciente..."
                className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-card border border-border text-sm font-body focus:outline-none focus:ring-2 focus:ring-primary/30 shadow-soft"
              />
            </div>

            {/* Cards grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {filtered.map(p => (
                <button
                  key={p.id}
                  onClick={() => { setSelected(p); setTab("historico"); }}
                  className="bg-card rounded-2xl border border-border shadow-card p-5 text-left hover:border-primary/40 hover:shadow-gold transition-all group"
                >
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-11 h-11 rounded-xl flex items-center justify-center text-sm font-display font-medium flex-shrink-0" style={{ background: "hsl(var(--gold-light))", color: "hsl(var(--primary))" }}>
                      {p.avatar}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-body font-medium text-sm truncate">{p.name}</p>
                      <p className="text-xs text-muted-foreground font-body">{p.age} anos</p>
                    </div>
                    <ChevronRight size={15} className="text-muted-foreground group-hover:text-primary transition-colors flex-shrink-0" />
                  </div>
                  <div className="h-px bg-border mb-3" />
                  <div className="flex flex-col gap-1.5">
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] text-muted-foreground font-body">Última visita</span>
                      <span className="text-[11px] font-body">{p.lastVisit}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] text-muted-foreground font-body">Próxima consulta</span>
                      <span className="text-[11px] font-body" style={{ color: "hsl(var(--primary))" }}>{p.nextVisit}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] text-muted-foreground font-body">Tratamentos</span>
                      <span className="text-[11px] font-body px-2 py-0.5 rounded-full" style={{ background: "hsl(var(--gold-light))", color: "hsl(var(--primary))" }}>
                        {p.treatments.length}
                      </span>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* New patient modal */}
      {showNew && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-foreground/30 backdrop-blur-sm" onClick={() => setShowNew(false)} />
          <div className="relative z-10 bg-card rounded-2xl border border-border shadow-card w-full max-w-md p-6">
            <button onClick={() => setShowNew(false)} className="absolute top-4 right-4 text-muted-foreground hover:text-foreground"><X size={16} /></button>
            <div className="h-0.5 w-full rounded-full mb-6" style={{ background: "var(--gradient-gold)" }} />
            <h3 className="font-display text-2xl mb-5">Nova Paciente</h3>
            <div className="flex flex-col gap-3">
              {["Nome completo", "Telefone (WhatsApp)", "Data de nascimento", "E-mail"].map(f => (
                <div key={f} className="flex flex-col gap-1">
                  <label className="text-xs uppercase tracking-widest text-muted-foreground font-body">{f}</label>
                  <input type="text" className="px-3 py-2 rounded-lg bg-muted border border-border text-sm font-body focus:outline-none focus:ring-2 focus:ring-primary/30" />
                </div>
              ))}
              <div className="flex flex-col gap-1">
                <label className="text-xs uppercase tracking-widest text-muted-foreground font-body">Anamnese</label>
                <textarea rows={3} className="px-3 py-2 rounded-lg bg-muted border border-border text-sm font-body focus:outline-none focus:ring-2 focus:ring-primary/30 resize-none" />
              </div>
            </div>
            <div className="flex gap-3 mt-5">
              <button onClick={() => setShowNew(false)} className="flex-1 py-2.5 rounded-lg border border-border text-sm font-body hover:bg-muted transition-colors">Cancelar</button>
              <button onClick={() => setShowNew(false)} className="flex-1 py-2.5 rounded-lg text-sm font-body font-medium hover:opacity-90 transition-all" style={{ background: "var(--gradient-gold)", color: "hsl(var(--primary-foreground))" }}>Salvar</button>
            </div>
          </div>
        </div>
      )}
    </AppLayout>
  );
};

export default Pacientes;
