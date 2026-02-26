import { useState, useEffect, useRef } from "react";
import { useSearchParams } from "react-router-dom";
import AppLayout from "@/components/AppLayout";
import { Search, Plus, ChevronRight, X, MessageCircle, FileText, Calendar, ClipboardList, ArrowLeft, Trash2, Save, Upload, File, Image, Download, Pencil, Target } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Progress } from "@/components/ui/progress";

type Paciente = { id: string; nome: string; telefone: string; data_nascimento: string | null; email: string | null; anamnese: string | null; created_at: string };
type Tratamento = { id: string; paciente_id: string; procedimento: string; notas: string | null; data: string; created_at: string };
type Arquivo = { id: string; paciente_id: string; nome_arquivo: string; storage_path: string; tipo: string; created_at: string };
type Procedimento = { id: string; nome: string };
type Planejamento = { id: string; paciente_id: string; procedimento_id: string; sessoes_planejadas: number; observacoes: string | null; created_at: string };
type PlanejamentoSessao = { id: string; planejamento_id: string; data: string; notas: string | null; created_at: string };
type Tab = "historico" | "anamnese" | "arquivos" | "planejamento";

const fmtDate = (d: string | null) => d ? new Date(d + "T00:00:00").toLocaleDateString("pt-BR") : "—";
const getInitials = (name: string) => name.split(" ").filter(Boolean).slice(0, 2).map(n => n[0]).join("").toUpperCase();
const calcAge = (dob: string | null) => { if (!dob) return null; const d = new Date(dob + "T00:00:00"); const diff = Date.now() - d.getTime(); return Math.floor(diff / 31557600000); };

const inputCls = "w-full px-3 py-2.5 rounded-xl border border-border bg-background text-sm font-body focus:outline-none focus:ring-2 focus:ring-primary/30 transition-all";
const labelCls = "text-xs uppercase tracking-widest text-muted-foreground font-body mb-1 block";

const getFileIcon = (tipo: string) => {
  if (tipo.startsWith("image/")) return <Image size={18} className="text-primary" />;
  return <File size={18} className="text-primary" />;
};

const Pacientes = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [pacientes, setPacientes] = useState<Paciente[]>([]);
  const [tratamentos, setTratamentos] = useState<Tratamento[]>([]);
  const [arquivos, setArquivos] = useState<Arquivo[]>([]);
  const [procedimentos, setProcedimentos] = useState<Procedimento[]>([]);
  const [planejamentos, setPlanejamentos] = useState<Planejamento[]>([]);
  const [planejamentoSessoes, setPlanejamentoSessoes] = useState<PlanejamentoSessao[]>([]);
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
  const [newFiles, setNewFiles] = useState<File[]>([]);
  const newFileRef = useRef<HTMLInputElement>(null);

  // New treatment form
  const [showNewTrat, setShowNewTrat] = useState(false);
  const [tratProc, setTratProc] = useState("");
  const [tratNotas, setTratNotas] = useState("");
  const [tratData, setTratData] = useState(new Date().toISOString().slice(0, 10));

  // Edit anamnesis
  const [editingAnam, setEditingAnam] = useState(false);
  const [anamText, setAnamText] = useState("");

  // Edit patient info
  const [editingInfo, setEditingInfo] = useState(false);
  const [editNome, setEditNome] = useState("");
  const [editTel, setEditTel] = useState("");
  const [editDob, setEditDob] = useState("");
  const [editEmail, setEditEmail] = useState("");

  // Upload in detail view
  const detailFileRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);

  // Planejamento modals
  const [showNewPlano, setShowNewPlano] = useState(false);
  const [planoProcId, setPlanoProcId] = useState("");
  const [planoSessoes, setPlanoSessoes] = useState(1);
  const [planoObs, setPlanoObs] = useState("");
  const [showNewSessao, setShowNewSessao] = useState<string | null>(null); // planejamento_id
  const [sessaoData, setSessaoData] = useState(new Date().toISOString().slice(0, 10));
  const [sessaoNotas, setSessaoNotas] = useState("");

  const fetchData = async () => {
    setLoading(true);
    const [pRes, tRes, aRes, procRes, planRes, planSesRes] = await Promise.all([
      supabase.from("pacientes").select("*").order("nome"),
      supabase.from("tratamentos").select("*").order("data", { ascending: false }),
      supabase.from("paciente_arquivos").select("*").order("created_at", { ascending: false }),
      supabase.from("procedimentos").select("id, nome").order("nome"),
      supabase.from("planejamentos").select("*").order("created_at", { ascending: false }),
      supabase.from("planejamento_sessoes").select("*").order("data", { ascending: true }),
    ]);
    if (pRes.data) setPacientes(pRes.data as Paciente[]);
    if (tRes.data) setTratamentos(tRes.data as Tratamento[]);
    if (aRes.data) setArquivos(aRes.data as Arquivo[]);
    if (procRes.data) setProcedimentos(procRes.data as Procedimento[]);
    if (planRes.data) setPlanejamentos(planRes.data as Planejamento[]);
    if (planSesRes.data) setPlanejamentoSessoes(planSesRes.data as PlanejamentoSessao[]);
    setLoading(false);
  };

  useEffect(() => { fetchData(); }, []);

  // Open patient from URL param (e.g. ?abrir=<id>)
  useEffect(() => {
    const abrirId = searchParams.get("abrir");
    if (abrirId && pacientes.length > 0) {
      const found = pacientes.find(p => p.id === abrirId);
      if (found) {
        setSelectedId(abrirId);
        setEditingInfo(true);
        searchParams.delete("abrir");
        setSearchParams(searchParams, { replace: true });
      }
    }
  }, [pacientes, searchParams]);

  const selected = pacientes.find(p => p.id === selectedId) || null;
  const selectedTrats = tratamentos.filter(t => t.paciente_id === selectedId).sort((a, b) => new Date(b.data).getTime() - new Date(a.data).getTime());
  const selectedArquivos = arquivos.filter(a => a.paciente_id === selectedId).sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
  const selectedPlanos = planejamentos.filter(p => p.paciente_id === selectedId);
  const filtered = pacientes.filter(p => p.nome.toLowerCase().includes(search.toLowerCase()));

  const uploadFilesForPatient = async (pacienteId: string, files: File[]) => {
    for (const file of files) {
      const ext = file.name.split(".").pop();
      const path = `${pacienteId}/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
      const { error: uploadErr } = await supabase.storage.from("paciente-arquivos").upload(path, file);
      if (uploadErr) { toast.error(`Erro ao enviar ${file.name}`); continue; }
      await supabase.from("paciente_arquivos").insert({
        paciente_id: pacienteId,
        nome_arquivo: file.name,
        storage_path: path,
        tipo: file.type || "application/octet-stream",
      });
    }
  };

  const handleNewPatient = async () => {
    if (!newNome.trim()) { toast.error("Informe o nome."); return; }
    const { data, error } = await supabase.from("pacientes").insert({
      nome: newNome.trim(), telefone: newTel.trim(),
      data_nascimento: newDob || null, email: newEmail.trim() || null, anamnese: newAnam.trim() || null,
    }).select("id").single();
    if (error || !data) { toast.error("Erro ao salvar."); return; }
    if (newFiles.length > 0) await uploadFilesForPatient(data.id, newFiles);
    toast.success("Paciente cadastrada!");
    setShowNew(false); setNewNome(""); setNewTel(""); setNewDob(""); setNewEmail(""); setNewAnam(""); setNewFiles([]);
    fetchData();
  };

  const handleUploadInDetail = async (files: FileList | null) => {
    if (!files || !selectedId) return;
    setUploading(true);
    await uploadFilesForPatient(selectedId, Array.from(files));
    toast.success("Arquivo(s) enviado(s)!");
    setUploading(false);
    fetchData();
  };

  const handleDeleteArquivo = async (arq: Arquivo) => {
    await supabase.storage.from("paciente-arquivos").remove([arq.storage_path]);
    await supabase.from("paciente_arquivos").delete().eq("id", arq.id);
    toast.success("Arquivo excluído.");
    fetchData();
  };

  const getPublicUrl = (path: string) => {
    const { data } = supabase.storage.from("paciente-arquivos").getPublicUrl(path);
    return data.publicUrl;
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

  const startEditingInfo = () => {
    if (!selected) return;
    setEditNome(selected.nome);
    setEditTel(selected.telefone);
    setEditDob(selected.data_nascimento || "");
    setEditEmail(selected.email || "");
    setEditingInfo(true);
  };

  const handleSaveInfo = async () => {
    if (!selectedId || !editNome.trim()) { toast.error("Nome é obrigatório."); return; }
    const { error } = await supabase.from("pacientes").update({
      nome: editNome.trim(),
      telefone: editTel.trim(),
      data_nascimento: editDob || null,
      email: editEmail.trim() || null,
    }).eq("id", selectedId);
    if (error) { toast.error("Erro ao salvar."); return; }
    toast.success("Dados atualizados!");
    setEditingInfo(false);
    fetchData();
  };

  const whatsappLink = (phone: string) => `https://wa.me/${phone.replace(/\D/g, "")}`;

  // Planejamento handlers
  const handleNewPlano = async () => {
    if (!planoProcId || !selectedId) { toast.error("Selecione um procedimento."); return; }
    if (planoSessoes < 1) { toast.error("Informe a quantidade de sessões."); return; }
    const { error } = await supabase.from("planejamentos").insert({
      paciente_id: selectedId,
      procedimento_id: planoProcId,
      sessoes_planejadas: planoSessoes,
      observacoes: planoObs.trim() || null,
    } as any);
    if (error) { toast.error("Erro ao criar plano."); return; }
    toast.success("Plano criado!");
    setShowNewPlano(false);
    setPlanoProcId("");
    setPlanoSessoes(1);
    setPlanoObs("");
    fetchData();
  };

  const handleNewSessao = async () => {
    if (!showNewSessao) return;
    const { error } = await supabase.from("planejamento_sessoes").insert({
      planejamento_id: showNewSessao,
      data: sessaoData,
      notas: sessaoNotas.trim() || null,
    } as any);
    if (error) { toast.error("Erro ao registrar sessão."); return; }
    toast.success("Sessão registrada!");
    setShowNewSessao(null);
    setSessaoData(new Date().toISOString().slice(0, 10));
    setSessaoNotas("");
    fetchData();
  };

  const handleDeletePlano = async (id: string) => {
    if (!confirm("Excluir este plano e todas as sessões?")) return;
    const { error } = await supabase.from("planejamentos").delete().eq("id", id);
    if (error) { toast.error("Erro ao excluir."); return; }
    toast.success("Plano excluído.");
    fetchData();
  };

  const handleDeleteSessao = async (id: string) => {
    const { error } = await supabase.from("planejamento_sessoes").delete().eq("id", id);
    if (error) { toast.error("Erro ao excluir."); return; }
    toast.success("Sessão excluída.");
    fetchData();
  };

  const getProcNome = (procId: string) => procedimentos.find(p => p.id === procId)?.nome || "Procedimento";

  return (
    <AppLayout>
      <div className="max-w-5xl mx-auto">
        {selected ? (
          <div>
            <button onClick={() => { setSelectedId(null); setEditingAnam(false); setEditingInfo(false); }} className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors mb-6 font-body">
              <ArrowLeft size={15} /> Voltar para Pacientes
            </button>

            {/* Patient header */}
            <div className="bg-card rounded-2xl border border-border shadow-card p-6 mb-5">
              {editingInfo ? (
                <div className="flex flex-col gap-3">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div><label className={labelCls}>Nome completo *</label><input value={editNome} onChange={e => setEditNome(e.target.value)} className={inputCls} /></div>
                    <div><label className={labelCls}>Telefone (WhatsApp)</label><input value={editTel} onChange={e => setEditTel(e.target.value)} className={inputCls} placeholder="5511999990000" /></div>
                    <div><label className={labelCls}>Data de nascimento</label><input type="date" value={editDob} onChange={e => setEditDob(e.target.value)} className={inputCls} /></div>
                    <div><label className={labelCls}>E-mail</label><input type="email" value={editEmail} onChange={e => setEditEmail(e.target.value)} className={inputCls} /></div>
                  </div>
                  <div className="flex gap-2 mt-2">
                    <button onClick={() => setEditingInfo(false)} className="px-4 py-2 rounded-xl border border-border text-sm font-body hover:bg-muted transition-colors">Cancelar</button>
                    <button onClick={handleSaveInfo} className="flex items-center gap-2 px-4 py-2 rounded-xl bg-primary text-primary-foreground text-sm font-body font-medium hover:opacity-90 transition-opacity">
                      <Save size={14} /> Salvar
                    </button>
                  </div>
                </div>
              ) : (
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="flex items-center gap-4">
                    <div className="w-16 h-16 rounded-2xl flex items-center justify-center text-xl font-display font-medium bg-accent text-primary">
                      {getInitials(selected.nome)}
                    </div>
                    <div>
                      <h2 className="text-2xl font-display">{selected.nome}</h2>
                      <div className="flex flex-wrap gap-4 mt-1">
                        {calcAge(selected.data_nascimento) !== null && <span className="text-sm text-muted-foreground font-body">{calcAge(selected.data_nascimento)} anos</span>}
                        {selected.telefone && <span className="text-sm text-muted-foreground font-body">📱 {selected.telefone}</span>}
                        {selected.email && <span className="text-sm text-muted-foreground font-body">{selected.email}</span>}
                        <span className="text-sm text-muted-foreground font-body">{selectedTrats.length} tratamento(s)</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex gap-2 self-start sm:self-auto">
                    <button onClick={startEditingInfo} className="p-2.5 rounded-xl border border-border text-muted-foreground hover:text-primary hover:border-primary/40 transition-colors" title="Editar dados">
                      <Pencil size={16} />
                    </button>
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
              )}
            </div>

            {/* Tabs */}
            <div className="flex gap-1 mb-5 bg-muted p-1 rounded-xl w-fit flex-wrap">
              {([["historico", "Histórico", FileText], ["anamnese", "Anamnese", ClipboardList], ["arquivos", "Arquivos", File], ["planejamento", "Planejamento", Target]] as [Tab, string, typeof FileText][]).map(([t, label, Icon]) => (
                <button key={t} onClick={() => setTab(t)} className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-body transition-all"
                  style={tab === t ? { background: "hsl(var(--card))", color: "hsl(var(--primary))", fontWeight: 600, boxShadow: "var(--shadow-soft)" } : { color: "hsl(var(--muted-foreground))" }}>
                  <Icon size={14} />{label}
                  {t === "arquivos" && <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-primary/10 text-primary">{selectedArquivos.length}</span>}
                  {t === "planejamento" && <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-primary/10 text-primary">{selectedPlanos.length}</span>}
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
                        <span className="text-xs font-body px-2.5 py-1 rounded-full bg-accent text-primary">
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
            ) : tab === "anamnese" ? (
              <div className="bg-card rounded-2xl border border-border shadow-card p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <ClipboardList size={16} className="text-primary" />
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
            ) : tab === "arquivos" ? (
              /* Arquivos tab */
              <div className="flex flex-col gap-4">
                <input ref={detailFileRef} type="file" accept=".pdf,.jpg,.jpeg,.png" multiple className="hidden" onChange={e => handleUploadInDetail(e.target.files)} />
                <button
                  onClick={() => detailFileRef.current?.click()}
                  disabled={uploading}
                  className="flex items-center justify-center gap-3 p-6 rounded-2xl border-2 border-dashed border-primary/30 hover:border-primary/60 bg-primary/5 hover:bg-primary/10 text-primary transition-all font-body text-sm cursor-pointer group">
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-primary/10 group-hover:bg-primary/20 transition-colors">
                    <Upload size={20} />
                  </div>
                  <div className="text-left">
                    <p className="font-medium">{uploading ? "Enviando..." : "Enviar arquivo"}</p>
                    <p className="text-xs text-muted-foreground">PDF, JPG ou PNG</p>
                  </div>
                </button>

                {selectedArquivos.length === 0 ? (
                  <p className="text-center text-sm text-muted-foreground font-body py-8">Nenhum arquivo enviado ainda.</p>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {selectedArquivos.map(arq => (
                      <div key={arq.id} className="bg-card rounded-2xl border border-border shadow-card p-4 flex items-center gap-3 group">
                        {arq.tipo.startsWith("image/") ? (
                          <div className="w-12 h-12 rounded-xl overflow-hidden flex-shrink-0 bg-muted">
                            <img src={getPublicUrl(arq.storage_path)} alt={arq.nome_arquivo} className="w-full h-full object-cover" />
                          </div>
                        ) : (
                          <div className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 bg-accent">
                            {getFileIcon(arq.tipo)}
                          </div>
                        )}
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-body font-medium truncate">{arq.nome_arquivo}</p>
                          <p className="text-[11px] text-muted-foreground font-body">{new Date(arq.created_at).toLocaleDateString("pt-BR")}</p>
                        </div>
                        <div className="flex gap-1">
                          <a href={getPublicUrl(arq.storage_path)} target="_blank" rel="noopener noreferrer"
                            className="p-2 rounded-lg text-muted-foreground hover:text-primary hover:bg-accent transition-all" title="Abrir">
                            <Download size={14} />
                          </a>
                          <button onClick={() => handleDeleteArquivo(arq)} className="p-2 rounded-lg text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-all opacity-0 group-hover:opacity-100" title="Excluir">
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ) : (
              /* Planejamento tab */
              <div className="flex flex-col gap-4">
                {selectedPlanos.length === 0 ? (
                  <p className="text-center text-sm text-muted-foreground font-body py-8">Nenhum plano de tratamento criado ainda.</p>
                ) : (
                  selectedPlanos.map(plano => {
                    const sessoes = planejamentoSessoes.filter(s => s.planejamento_id === plano.id);
                    const feitas = sessoes.length;
                    const total = plano.sessoes_planejadas;
                    const pct = Math.min(Math.round((feitas / total) * 100), 100);
                    const concluido = feitas >= total;

                    return (
                      <div key={plano.id} className="bg-card rounded-2xl border border-border shadow-card p-5 group">
                        <div className="flex items-start justify-between gap-3 mb-3">
                          <div>
                            <p className="font-body font-medium text-sm">{getProcNome(plano.procedimento_id)}</p>
                            {plano.observacoes && <p className="text-xs text-muted-foreground font-body mt-0.5">{plano.observacoes}</p>}
                          </div>
                          <div className="flex items-center gap-2">
                            <span className={`text-xs font-body px-2.5 py-1 rounded-full ${concluido ? "bg-green-100 text-green-700" : "bg-accent text-primary"}`}>
                              {feitas}/{total} sessões
                            </span>
                            <button onClick={() => handleDeletePlano(plano.id)} className="opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-destructive transition-all p-1" title="Excluir plano">
                              <Trash2 size={14} />
                            </button>
                          </div>
                        </div>

                        {/* Progress bar */}
                        <div className="mb-3">
                          <Progress value={pct} className="h-2.5" />
                          <p className="text-[11px] text-muted-foreground font-body mt-1">{pct}% concluído</p>
                        </div>

                        {/* Sessions list */}
                        {sessoes.length > 0 && (
                          <div className="mb-3">
                            <div className="h-px bg-border mb-3" />
                            <div className="flex flex-col gap-2">
                              {sessoes.map((s, i) => (
                                <div key={s.id} className="flex items-center justify-between px-3 py-2 rounded-lg bg-muted text-sm font-body group/sessao">
                                  <div className="flex items-center gap-2">
                                    <span className="text-xs font-medium text-primary w-5">{i + 1}.</span>
                                    <span className="flex items-center gap-1 text-xs text-muted-foreground"><Calendar size={10} />{fmtDate(s.data)}</span>
                                    {s.notas && <span className="text-xs text-muted-foreground ml-1">— {s.notas}</span>}
                                  </div>
                                  <button onClick={() => handleDeleteSessao(s.id)} className="opacity-0 group-hover/sessao:opacity-100 text-muted-foreground hover:text-destructive transition-all p-0.5" title="Excluir sessão">
                                    <X size={12} />
                                  </button>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        {!concluido && (
                          <button
                            onClick={() => { setShowNewSessao(plano.id); setSessaoData(new Date().toISOString().slice(0, 10)); setSessaoNotas(""); }}
                            className="flex items-center gap-2 text-sm font-body text-primary hover:underline mt-1">
                            <Plus size={14} /> Registrar sessão
                          </button>
                        )}
                      </div>
                    );
                  })
                )}

                <button onClick={() => { setShowNewPlano(true); setPlanoProcId(""); setPlanoSessoes(1); setPlanoObs(""); }}
                  className="flex items-center justify-center gap-2 p-4 rounded-2xl border-2 border-dashed border-border hover:border-primary/40 text-muted-foreground hover:text-primary transition-all font-body text-sm">
                  <Plus size={15} /> Novo plano de tratamento
                </button>
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
                  const fileCount = arquivos.filter(a => a.paciente_id === p.id).length;
                  const lastVisit = pts.length > 0 ? fmtDate(pts[0].data) : "—";
                  return (
                    <button key={p.id} onClick={() => { setSelectedId(p.id); setTab("historico"); setEditingAnam(false); }}
                      className="bg-card rounded-2xl border border-border shadow-card p-5 text-left hover:border-primary/40 hover:shadow-gold transition-all group">
                      <div className="flex items-center gap-3 mb-4">
                        <div className="w-11 h-11 rounded-xl flex items-center justify-center text-sm font-display font-medium flex-shrink-0 bg-accent text-primary">
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
                          <span className="text-[11px] font-body px-2 py-0.5 rounded-full bg-accent text-primary">{pts.length}</span>
                        </div>
                        {fileCount > 0 && (
                          <div className="flex items-center justify-between">
                            <span className="text-[11px] text-muted-foreground font-body">Arquivos</span>
                            <span className="text-[11px] font-body px-2 py-0.5 rounded-full bg-accent text-primary">{fileCount}</span>
                          </div>
                        )}
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
          <div className="relative z-10 bg-card rounded-2xl border border-border shadow-card w-full max-w-md p-6 max-h-[90vh] overflow-y-auto">
            <button onClick={() => setShowNew(false)} className="absolute top-4 right-4 text-muted-foreground hover:text-foreground"><X size={16} /></button>
            <div className="h-0.5 w-full rounded-full mb-6" style={{ background: "var(--gradient-gold)" }} />
            <h3 className="font-display text-2xl mb-5">Nova Paciente</h3>
            <div className="flex flex-col gap-3">
              <div><label className={labelCls}>Nome completo *</label><input value={newNome} onChange={e => setNewNome(e.target.value)} className={inputCls} /></div>
              <div><label className={labelCls}>Telefone (WhatsApp)</label><input value={newTel} onChange={e => setNewTel(e.target.value)} className={inputCls} placeholder="5511999990000" /></div>
              <div><label className={labelCls}>Data de nascimento</label><input type="date" value={newDob} onChange={e => setNewDob(e.target.value)} className={inputCls} /></div>
              <div><label className={labelCls}>E-mail</label><input type="email" value={newEmail} onChange={e => setNewEmail(e.target.value)} className={inputCls} /></div>
              <div><label className={labelCls}>Anamnese</label><textarea value={newAnam} onChange={e => setNewAnam(e.target.value)} rows={3} className={inputCls + " resize-none"} placeholder="Alergias, medicamentos, comorbidades..." /></div>

              {/* Arquivos */}
              <div>
                <label className={labelCls}>Arquivos</label>
                <input ref={newFileRef} type="file" accept=".pdf,.jpg,.jpeg,.png" multiple className="hidden" onChange={e => {
                  if (e.target.files) setNewFiles(prev => [...prev, ...Array.from(e.target.files!)]);
                }} />
                <button
                  type="button"
                  onClick={() => newFileRef.current?.click()}
                  className="w-full flex items-center justify-center gap-3 p-4 rounded-xl border-2 border-dashed border-primary/30 hover:border-primary/60 bg-primary/5 hover:bg-primary/10 text-primary transition-all cursor-pointer group">
                  <Upload size={18} />
                  <span className="text-sm font-body font-medium">Anexar PDF, JPG ou PNG</span>
                </button>
                {newFiles.length > 0 && (
                  <div className="flex flex-col gap-2 mt-2">
                    {newFiles.map((f, i) => (
                      <div key={i} className="flex items-center gap-2 px-3 py-2 rounded-lg bg-muted text-sm font-body">
                        {f.type.startsWith("image/") ? <Image size={14} className="text-primary flex-shrink-0" /> : <File size={14} className="text-primary flex-shrink-0" />}
                        <span className="truncate flex-1">{f.name}</span>
                        <button onClick={() => setNewFiles(prev => prev.filter((_, idx) => idx !== i))} className="text-muted-foreground hover:text-destructive flex-shrink-0">
                          <X size={14} />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
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

      {/* Modal: Novo Plano */}
      {showNewPlano && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={() => setShowNewPlano(false)}>
          <div className="bg-card rounded-2xl border border-border shadow-2xl w-full max-w-md p-6" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-5">
              <div>
                <h2 className="font-display text-xl">Novo Plano</h2>
                <p className="text-xs text-muted-foreground font-body">Planejamento de sessões</p>
              </div>
              <button onClick={() => setShowNewPlano(false)} className="text-muted-foreground hover:text-foreground"><X size={20} /></button>
            </div>
            <div className="space-y-4">
              <div>
                <label className={labelCls}>Procedimento *</label>
                <select value={planoProcId} onChange={e => setPlanoProcId(e.target.value)} className={inputCls}>
                  <option value="">Selecione...</option>
                  {procedimentos.map(p => (
                    <option key={p.id} value={p.id}>{p.nome}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className={labelCls}>Quantidade de sessões *</label>
                <input type="number" min={1} value={planoSessoes} onChange={e => setPlanoSessoes(parseInt(e.target.value) || 1)} className={inputCls} />
              </div>
              <div>
                <label className={labelCls}>Observações</label>
                <textarea value={planoObs} onChange={e => setPlanoObs(e.target.value)} className={inputCls + " resize-none h-20"} placeholder="Notas sobre o planejamento..." />
              </div>
              <button onClick={handleNewPlano} className="w-full bg-primary text-primary-foreground py-2.5 rounded-xl font-body font-medium text-sm hover:opacity-90 transition-opacity">
                Criar Plano
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal: Nova Sessão */}
      {showNewSessao && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={() => setShowNewSessao(null)}>
          <div className="bg-card rounded-2xl border border-border shadow-2xl w-full max-w-md p-6" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-5">
              <div>
                <h2 className="font-display text-xl">Registrar Sessão</h2>
                <p className="text-xs text-muted-foreground font-body">Sessão realizada</p>
              </div>
              <button onClick={() => setShowNewSessao(null)} className="text-muted-foreground hover:text-foreground"><X size={20} /></button>
            </div>
            <div className="space-y-4">
              <div><label className={labelCls}>Data</label><input type="date" value={sessaoData} onChange={e => setSessaoData(e.target.value)} className={inputCls} /></div>
              <div><label className={labelCls}>Notas / Observações</label><textarea value={sessaoNotas} onChange={e => setSessaoNotas(e.target.value)} className={inputCls + " resize-none h-20"} placeholder="Observações desta sessão..." /></div>
              <button onClick={handleNewSessao} className="w-full bg-primary text-primary-foreground py-2.5 rounded-xl font-body font-medium text-sm hover:opacity-90 transition-opacity">
                Registrar Sessão
              </button>
            </div>
          </div>
        </div>
      )}
    </AppLayout>
  );
};

export default Pacientes;
