import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/components/AuthProvider";
import AppLayout from "@/components/AppLayout";
import { UserPlus, Trash2, Shield, User } from "lucide-react";
import { toast } from "sonner";

interface ManagedUser {
  id: string;
  email: string;
  role: string;
  created_at: string;
  email_confirmed_at: string | null;
}

const Usuarios = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [newEmail, setNewEmail] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [showForm, setShowForm] = useState(false);

  const { data: users = [], isLoading } = useQuery<ManagedUser[]>({
    queryKey: ["managed-users"],
    queryFn: async () => {
      const { data, error } = await supabase.functions.invoke("manage-users", {
        body: { action: "list" },
      });
      if (error) throw error;
      return data;
    },
  });

  const createUser = useMutation({
    mutationFn: async ({ email, password }: { email: string; password: string }) => {
      const { data, error } = await supabase.functions.invoke("manage-users", {
        body: { action: "create", email, password },
      });
      if (error) throw error;
      if (data.error) throw new Error(data.error);
      return data;
    },
    onSuccess: () => {
      toast.success("Recepcionista criada com sucesso!");
      queryClient.invalidateQueries({ queryKey: ["managed-users"] });
      setNewEmail("");
      setNewPassword("");
      setShowForm(false);
    },
    onError: (err: Error) => {
      toast.error(err.message || "Erro ao criar usuário");
    },
  });

  const deleteUser = useMutation({
    mutationFn: async (userId: string) => {
      const { data, error } = await supabase.functions.invoke("manage-users", {
        body: { action: "delete", user_id: userId },
      });
      if (error) throw error;
      if (data.error) throw new Error(data.error);
      return data;
    },
    onSuccess: () => {
      toast.success("Usuário removido");
      queryClient.invalidateQueries({ queryKey: ["managed-users"] });
    },
    onError: (err: Error) => {
      toast.error(err.message || "Erro ao remover usuário");
    },
  });

  return (
    <AppLayout>
      <div className="max-w-2xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-display" style={{ color: "hsl(var(--primary))" }}>Usuários</h1>
            <p className="text-sm text-muted-foreground font-body">Gerencie recepcionistas e acessos</p>
          </div>
          <button
            onClick={() => setShowForm(s => !s)}
            className="flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-body font-medium transition-all hover:opacity-90 active:scale-[0.98]"
            style={{ background: "var(--gradient-gold)", color: "hsl(var(--primary-foreground))", boxShadow: "var(--shadow-gold)" }}
          >
            <UserPlus size={16} />
            Nova recepcionista
          </button>
        </div>

        {/* Create form */}
        {showForm && (
          <div className="bg-card rounded-xl border border-border p-5 mb-6 shadow-card">
            <h3 className="text-sm font-body font-medium mb-4 text-foreground">Adicionar recepcionista</h3>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                createUser.mutate({ email: newEmail, password: newPassword });
              }}
              className="flex flex-col sm:flex-row gap-3"
            >
              <input
                type="email"
                value={newEmail}
                onChange={e => setNewEmail(e.target.value)}
                placeholder="E-mail"
                required
                className="flex-1 px-4 py-2.5 rounded-lg bg-muted border border-border text-sm font-body focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all"
              />
              <input
                type="password"
                value={newPassword}
                onChange={e => setNewPassword(e.target.value)}
                placeholder="Senha (min. 6 caracteres)"
                required
                minLength={6}
                className="flex-1 px-4 py-2.5 rounded-lg bg-muted border border-border text-sm font-body focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all"
              />
              <button
                type="submit"
                disabled={createUser.isPending}
                className="px-5 py-2.5 rounded-lg text-sm font-body font-medium transition-all hover:opacity-90 disabled:opacity-60"
                style={{ background: "var(--gradient-gold)", color: "hsl(var(--primary-foreground))" }}
              >
                {createUser.isPending ? "Criando..." : "Criar"}
              </button>
            </form>
          </div>
        )}

        {/* Users list */}
        <div className="bg-card rounded-xl border border-border shadow-card overflow-hidden">
          {isLoading ? (
            <div className="p-8 text-center text-muted-foreground font-body">Carregando...</div>
          ) : users.length === 0 ? (
            <div className="p-8 text-center text-muted-foreground font-body">Nenhum usuário encontrado</div>
          ) : (
            <div className="divide-y divide-border">
              {users.map((u) => (
                <div key={u.id} className="flex items-center justify-between px-5 py-4">
                  <div className="flex items-center gap-3">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center ${u.role === "admin" ? "bg-accent" : "bg-muted"}`}>
                      {u.role === "admin" ? <Shield size={14} className="text-accent-foreground" /> : <User size={14} className="text-muted-foreground" />}
                    </div>
                    <div>
                      <p className="text-sm font-body font-medium text-foreground">{u.email}</p>
                      <p className="text-xs font-body text-muted-foreground capitalize">{u.role === "admin" ? "Administrador" : "Recepcionista"}</p>
                    </div>
                  </div>
                  {u.id !== user?.id && u.role !== "admin" && (
                    <button
                      onClick={() => {
                        if (confirm(`Remover ${u.email}?`)) {
                          deleteUser.mutate(u.id);
                        }
                      }}
                      className="p-2 rounded-lg text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-all"
                    >
                      <Trash2 size={15} />
                    </button>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </AppLayout>
  );
};

export default Usuarios;
