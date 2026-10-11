import { Navigate, Route, Routes } from 'react-router-dom';
import { PainelLayout } from './components/PainelLayout';
import { RotaProtegida } from './components/RotaProtegida';
import { LoginPage } from './pages/auth/LoginPage';
import { FilaContestacoesPage } from './pages/contestacoes/FilaContestacoesPage';
import { AnaliseContestacaoPage } from './pages/contestacoes/AnaliseContestacaoPage';
import { FilaSinalizadosPage } from './pages/sinalizados/FilaSinalizadosPage';
import { FilaImagensPage } from './pages/imagens/FilaImagensPage';
import { HistoricoPage } from './pages/historico/HistoricoPage';
import { ConfiguracoesPage } from './pages/configuracoes/ConfiguracoesPage';

function App() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route element={<RotaProtegida />}>
        <Route element={<PainelLayout />}>
          <Route index element={<Navigate to="/contestacoes" replace />} />
          <Route path="contestacoes" element={<FilaContestacoesPage />} />
          <Route path="contestacoes/:id" element={<AnaliseContestacaoPage />} />
          <Route path="sinalizados" element={<FilaSinalizadosPage />} />
          <Route path="imagens" element={<FilaImagensPage />} />
          <Route path="historico" element={<HistoricoPage />} />
          <Route path="configuracoes" element={<ConfiguracoesPage />} />
        </Route>
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default App;
