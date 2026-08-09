import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Alert, Empty, Spin, Table, Tag, Typography } from 'antd';
import { listarContestacoes } from '../../services/moderacaoService';
import { ApiError } from '../../services/api';
import type { ContestacaoFilaResponse } from '../../types/moderacao';

const TAMANHO_PAGINA = 20;

export function FilaContestacoesPage() {
  const navigate = useNavigate();
  const [pagina, setPagina] = useState(0);
  const [dados, setDados] = useState<ContestacaoFilaResponse[]>([]);
  const [total, setTotal] = useState(0);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState<string | null>(null);

  useEffect(() => {
    let cancelado = false;
    setCarregando(true);
    setErro(null);
    listarContestacoes(pagina, TAMANHO_PAGINA)
      .then((resp) => {
        if (cancelado) return;
        setDados(resp.conteudo);
        setTotal(resp.totalElementos);
      })
      .catch((e: unknown) => {
        if (cancelado) return;
        setErro(e instanceof ApiError ? e.message : 'Falha ao carregar a fila de contestações.');
      })
      .finally(() => {
        if (!cancelado) setCarregando(false);
      });
    return () => {
      cancelado = true;
    };
  }, [pagina]);

  return (
    <div>
      <Typography.Title level={3}>Fila de contestações</Typography.Title>
      {erro && <Alert type="error" message={erro} showIcon style={{ marginBottom: '1rem' }} />}
      {carregando ? (
        <div style={{ display: 'flex', justifyContent: 'center', padding: '3rem' }}>
          <Spin size="large" />
        </div>
      ) : dados.length === 0 && !erro ? (
        <Empty description="Nenhuma contestação pendente." />
      ) : (
        <Table<ContestacaoFilaResponse>
          rowKey="id"
          dataSource={dados}
          onRow={(registro) => ({
            onClick: () => navigate(`/contestacoes/${registro.id}`),
            style: { cursor: 'pointer' },
          })}
          pagination={{
            current: pagina + 1,
            pageSize: TAMANHO_PAGINA,
            total,
            onChange: (p) => setPagina(p - 1),
          }}
          columns={[
            {
              title: 'Reclamação contestada',
              dataIndex: 'reclamacaoTitulo',
            },
            {
              title: 'Consolidada atual',
              dataIndex: 'consolidadaTitulo',
              render: (v: string | null) => v ?? '—',
            },
            {
              title: 'Similaridade',
              dataIndex: 'similaridade',
              width: 130,
              render: (v: number | null) => (v != null ? <Tag>{(v * 100).toFixed(1)}%</Tag> : '—'),
            },
            {
              title: 'Aberta em',
              dataIndex: 'criadoEm',
              width: 180,
              render: (v: string) => new Date(v).toLocaleString('pt-BR'),
            },
          ]}
        />
      )}
    </div>
  );
}
