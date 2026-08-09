import { useEffect, useState } from 'react';
import { Alert, Button, Empty, Modal, Space, Spin, Table, Typography, message } from 'antd';
import { CheckOutlined, StopOutlined } from '@ant-design/icons';
import { listarSinalizados, resolverSinalizado } from '../../services/moderacaoService';
import { ApiError } from '../../services/api';
import { usePendenciasStore } from '../../stores/pendenciasStore';
import type { AcaoSinalizado, SinalizadoResponse } from '../../types/moderacao';

const TAMANHO_PAGINA = 20;

export function FilaSinalizadosPage() {
  const { atualizar } = usePendenciasStore();
  const [pagina, setPagina] = useState(0);
  const [dados, setDados] = useState<SinalizadoResponse[]>([]);
  const [total, setTotal] = useState(0);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState<string | null>(null);
  const [confirmacao, setConfirmacao] = useState<{
    item: SinalizadoResponse;
    acao: AcaoSinalizado;
  } | null>(null);
  const [resolvendo, setResolvendo] = useState(false);

  function carregar() {
    setCarregando(true);
    setErro(null);
    listarSinalizados(pagina, TAMANHO_PAGINA)
      .then((resp) => {
        setDados(resp.conteudo);
        setTotal(resp.totalElementos);
      })
      .catch((e: unknown) => {
        setErro(e instanceof ApiError ? e.message : 'Falha ao carregar a fila de sinalizados.');
      })
      .finally(() => setCarregando(false));
  }

  useEffect(() => {
    carregar();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pagina]);

  async function confirmar() {
    if (!confirmacao) return;
    setResolvendo(true);
    try {
      await resolverSinalizado(confirmacao.item.id, { acao: confirmacao.acao });
      message.success('Conteúdo sinalizado resolvido.');
      setConfirmacao(null);
      await Promise.all([atualizar(), carregar()]);
    } catch (e) {
      message.error(e instanceof ApiError ? e.message : 'Falha ao resolver o sinalizado.');
    } finally {
      setResolvendo(false);
    }
  }

  return (
    <div>
      <Typography.Title level={3}>Fila de sinalizados</Typography.Title>
      {erro && <Alert type="error" message={erro} showIcon style={{ marginBottom: '1rem' }} />}
      {carregando ? (
        <div style={{ display: 'flex', justifyContent: 'center', padding: '3rem' }}>
          <Spin size="large" />
        </div>
      ) : dados.length === 0 && !erro ? (
        <Empty description="Nenhum conteúdo sinalizado pendente." />
      ) : (
        <Table<SinalizadoResponse>
          rowKey="id"
          dataSource={dados}
          pagination={{
            current: pagina + 1,
            pageSize: TAMANHO_PAGINA,
            total,
            onChange: (p) => setPagina(p - 1),
          }}
          columns={[
            { title: 'Reclamação', dataIndex: 'reclamacaoId' },
            { title: 'Motivo do bloqueio', dataIndex: 'motivo' },
            {
              title: 'Sinalizado em',
              dataIndex: 'criadoEm',
              width: 180,
              render: (v: string) => new Date(v).toLocaleString('pt-BR'),
            },
            {
              title: 'Ações',
              width: 260,
              render: (_: unknown, item: SinalizadoResponse) => (
                <Space>
                  <Button
                    size="small"
                    icon={<CheckOutlined />}
                    onClick={() => setConfirmacao({ item, acao: 'APROVAR' })}
                  >
                    Aprovar
                  </Button>
                  <Button
                    size="small"
                    danger
                    icon={<StopOutlined />}
                    onClick={() => setConfirmacao({ item, acao: 'MANTER_BLOQUEIO' })}
                  >
                    Manter bloqueio
                  </Button>
                </Space>
              ),
            },
          ]}
        />
      )}

      <Modal
        title={confirmacao?.acao === 'APROVAR' ? 'Aprovar conteúdo' : 'Manter bloqueio'}
        open={confirmacao !== null}
        onOk={confirmar}
        onCancel={() => setConfirmacao(null)}
        confirmLoading={resolvendo}
        okText="Confirmar"
        cancelText="Cancelar"
      >
        <Typography.Paragraph>
          {confirmacao?.acao === 'APROVAR'
            ? 'O conteúdo volta ao pipeline de agregação e é publicado normalmente.'
            : 'O conteúdo permanece bloqueado e não é publicado.'}
        </Typography.Paragraph>
      </Modal>
    </div>
  );
}
