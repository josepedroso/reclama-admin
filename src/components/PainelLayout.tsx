import { useEffect } from 'react';
import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import { Badge, Button, Layout, Menu, Space, Typography } from 'antd';
import {
  AuditOutlined,
  FlagOutlined,
  LogoutOutlined,
  PictureOutlined,
  SettingOutlined,
  SolutionOutlined,
} from '@ant-design/icons';
import { useAuthStore } from '../stores/authStore';
import { usePendenciasStore } from '../stores/pendenciasStore';

const { Header, Sider, Content } = Layout;

const ITENS = [
  { chave: '/contestacoes', rotulo: 'Contestações', icone: <SolutionOutlined /> },
  { chave: '/sinalizados', rotulo: 'Sinalizados', icone: <FlagOutlined /> },
  { chave: '/imagens', rotulo: 'Imagens', icone: <PictureOutlined /> },
  { chave: '/historico', rotulo: 'Histórico', icone: <AuditOutlined /> },
  { chave: '/configuracoes', rotulo: 'Configurações', icone: <SettingOutlined /> },
];

export function PainelLayout() {
  const navigate = useNavigate();
  const location = useLocation();
  const moderadorId = useAuthStore((s) => s.moderadorId);
  const logout = useAuthStore((s) => s.logout);
  const { contestacoes, sinalizados, imagens, atualizar } = usePendenciasStore();

  useEffect(() => {
    atualizar();
  }, [atualizar, location.pathname]);

  const rotaAtiva = ITENS.find((item) => location.pathname.startsWith(item.chave))?.chave;

  const contadores: Record<string, number> = {
    '/contestacoes': contestacoes,
    '/sinalizados': sinalizados,
    '/imagens': imagens,
  };

  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Sider breakpoint="md" collapsedWidth={64} width={220}>
        <div style={{ color: '#fff', padding: '1rem', fontWeight: 600 }}>ReclamaApp</div>
        <Menu
          theme="dark"
          mode="inline"
          selectedKeys={rotaAtiva ? [rotaAtiva] : []}
          onClick={({ key }) => navigate(key)}
          items={ITENS.map((item) => ({
            key: item.chave,
            icon: item.icone,
            label:
              contadores[item.chave] > 0 ? (
                <Space>
                  {item.rotulo}
                  <Badge count={contadores[item.chave]} size="small" />
                </Space>
              ) : (
                item.rotulo
              ),
          }))}
        />
      </Sider>
      <Layout>
        <Header
          style={{
            background: '#fff',
            display: 'flex',
            justifyContent: 'flex-end',
            alignItems: 'center',
            gap: '1rem',
            paddingInline: '1.5rem',
          }}
        >
          <Typography.Text type="secondary">Moderador: {moderadorId?.slice(0, 8)}</Typography.Text>
          <Button icon={<LogoutOutlined />} onClick={() => logout()}>
            Sair
          </Button>
        </Header>
        <Content style={{ padding: '1.5rem' }}>
          <Outlet />
        </Content>
      </Layout>
    </Layout>
  );
}
