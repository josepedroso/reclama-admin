# admin — ReclamaApp

Painel de moderação. React 19 + Vite + TypeScript. Build estático servido pelo Nginx em
`/admin` (ADR-009).

## Comandos

```bash
npm install
npm run dev        # http://localhost:5173
npm run build      # tsc -b && vite build  → dist/
npm run preview    # serve o build de dist/
npm run lint       # oxlint
```

## Configuração

- URL da API: variável de ambiente **`VITE_API_URL`** (ver `src/config/api.ts`), com
  fallback para `http://localhost:8080`. Defina em `.env` local ou no ambiente de build.

## Decisões (registradas aqui, conforme ADR-009)

- **Biblioteca de componentes:** **Ant Design** — escolhida entre as opções do ADR-009
  (Ant Design vs shadcn/ui): o painel é pesado em tabelas/formulários (fila de
  contestações, ações do moderador) e o AntD entrega isso pronto, maximizando a
  velocidade para um time de 1-2 pessoas. Instalar ao construir a 1ª tela real.
- **TypeScript estrito** (`strict: true`). Ver skill `convencoes`.

## Regra de acesso

Todo endpoint consumido pelo painel exige o perfil **`ROLE_MODERADOR`**. O painel não
expõe a identidade do autor além do estritamente necessário para moderar, e esse acesso
é restrito e auditado (ver skill `seguranca-lgpd` e ADR-009).
