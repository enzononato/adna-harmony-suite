

## Atualização da Paleta de Cores

### Cores da imagem convertidas para HSL:
- **#DE9A8D** → `7 52% 71%` — rosa/salmon principal (será o **primary**)
- **#EBC9C3** → `9 44% 84%` — rosa claro (será o **accent/secondary**)
- **#C7837E** → `4 34% 64%` — rosa escuro (será a cor de destaque/hover)

### Mudanças em `src/index.css`:

1. **Primary**: trocar do gold (`38 72% 52%`) para `#DE9A8D` (`7 52% 71%`)
2. **Secondary**: trocar para `#EBC9C3` (`9 44% 84%`)
3. **Accent**: usar `#EBC9C3` como base do accent
4. **Ring/focus**: acompanhar o novo primary
5. **Sidebar primary**: atualizar para o novo primary
6. **Custom tokens**: atualizar `--salmon`, `--gold*` para as novas cores
7. **Gradients**: refazer `--gradient-hero` e `--gradient-gold` usando as 3 novas cores
8. **Shadows**: `--shadow-gold` → usar a nova cor principal

### Arquivos afetados:
- `src/index.css` — variáveis CSS centrais (única alteração necessária, o resto do sistema já consome via variáveis)

