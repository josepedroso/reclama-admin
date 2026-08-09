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
  velocidade para um time de 1-2 pessoas.
- **Roteamento:** React Router (`BrowserRouter`), mesma biblioteca do mobile
  (React Navigation é o equivalente nativo). Rotas protegidas por `RotaProtegida`
  (`src/components/RotaProtegida.tsx`), que exige `ROLE_MODERADOR`.
- **Estado:** **Zustand** — mesma escolha do mobile (ADR-001), por consistência entre os
  dois frontends. `authStore` (sessão) e `pendenciasStore` (contadores de fila no menu).
- **Tokens:** o backend devolve os tokens no corpo JSON (sem cookie httpOnly — não há
  BFF). Guardados em `sessionStorage` + cópia em memória (`src/services/tokenStore.ts`),
  não em `localStorage`: sobrevive a reload da aba mas some ao fechar o navegador,
  reduzindo a janela de exposição do refresh token em XSS. O login não devolve o perfil
  do usuário — `ROLE_MODERADOR` é lido da claim `roles` do JWT no cliente
  (`src/services/jwt.ts`); sem essa claim, acesso negado (`Result status="403"`).
  Interceptor de refresh em `src/services/api.ts`, mesmo padrão do mobile (`api.ts` +
  `tokenStore.ts`): refresh único deduplicado em 401, logout automático se falhar.
- **Testes de componente:** MSW (`msw/node`) mocka a API nos testes das filas
  (`src/mocks/server.ts`, registrado globalmente em `vitest.setup.ts`).
- **TypeScript estrito** (`strict: true`). Ver skill `convencoes`.

## Regra de acesso

Todo endpoint consumido pelo painel exige o perfil **`ROLE_MODERADOR`**. O painel não
expõe a identidade do autor além do estritamente necessário para moderar, e esse acesso
é restrito e auditado (ver skill `seguranca-lgpd` e ADR-009).
