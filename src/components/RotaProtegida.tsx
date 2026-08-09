import { useEffect } from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { Result, Spin } from 'antd';
import { useAuthStore } from '../stores/authStore';

/** Guarda de rota: exige sessao com ROLE_MODERADOR (CARD-16). */
export function RotaProtegida() {
  const status = useAuthStore((s) => s.status);
  const restaurarSessao = useAuthStore((s) => s.restaurarSessao);

  useEffect(() => {
    if (status === 'carregando') restaurarSessao();
  }, [status, restaurarSessao]);

  if (status === 'carregando') {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', padding: '4rem' }}>
        <Spin size="large" />
      </div>
    );
  }

  if (status === 'anonimo') {
    return <Navigate to="/login" replace />;
  }

  if (status === 'acessoNegado') {
    return (
      <Result
        status="403"
        title="Acesso negado"
        subTitle="Sua conta nao tem o perfil de moderador necessario para acessar este painel."
      />
    );
  }

  return <Outlet />;
}
