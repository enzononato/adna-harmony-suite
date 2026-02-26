import { Check } from "lucide-react";
import { cn } from "@/lib/utils";

type Procedimento = {
  id: string;
  nome: string;
  preco?: number | null;
};

interface ProcedimentoMultiSelectProps {
  procedimentos: Procedimento[];
  selectedIds: string[];
  onChange: (ids: string[]) => void;
  showPreco?: boolean;
  label?: string;
  maxHeight?: string;
}

const fmt = (v: number) =>
  `R$ ${v.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`;

const ProcedimentoMultiSelect = ({
  procedimentos,
  selectedIds,
  onChange,
  showPreco = false,
  label = "Procedimentos *",
  maxHeight = "10rem",
}: ProcedimentoMultiSelectProps) => {
  const toggle = (id: string) => {
    onChange(
      selectedIds.includes(id)
        ? selectedIds.filter((i) => i !== id)
        : [...selectedIds, id]
    );
  };

  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-xs uppercase tracking-widest text-muted-foreground font-body">
        {label}
      </label>
      <div
        className="overflow-y-auto rounded-xl border border-border bg-card p-1 flex flex-col gap-0.5"
        style={{ maxHeight }}
      >
        {procedimentos.map((p) => {
          const isSelected = selectedIds.includes(p.id);
          return (
            <button
              key={p.id}
              type="button"
              onClick={() => toggle(p.id)}
              className={cn(
                "flex items-center gap-2.5 w-full text-left text-sm font-body px-3 py-2 rounded-lg transition-all duration-150",
                isSelected
                  ? "bg-primary/10 text-foreground"
                  : "hover:bg-muted/60 text-muted-foreground"
              )}
            >
              <span
                className={cn(
                  "flex items-center justify-center w-4.5 h-4.5 rounded-md border transition-all duration-150 shrink-0",
                  isSelected
                    ? "bg-primary border-primary text-primary-foreground"
                    : "border-border bg-background"
                )}
                style={{ width: 18, height: 18 }}
              >
                {isSelected && <Check size={12} strokeWidth={3} />}
              </span>
              <span className={cn("flex-1", isSelected && "font-medium text-foreground")}>
                {p.nome}
              </span>
              {showPreco && p.preco != null && (
                <span className="text-[11px] text-muted-foreground tabular-nums">
                  {fmt(Number(p.preco))}
                </span>
              )}
            </button>
          );
        })}
      </div>
      {selectedIds.length > 0 && (
        <div className="flex items-center gap-1.5 mt-0.5">
          <span className="inline-flex items-center justify-center w-4 h-4 rounded-full bg-primary/15 text-primary">
            <Check size={10} strokeWidth={3} />
          </span>
          <span className="text-[11px] text-primary font-body font-medium">
            {selectedIds.length} selecionado{selectedIds.length > 1 ? "s" : ""}
          </span>
        </div>
      )}
    </div>
  );
};

export default ProcedimentoMultiSelect;
