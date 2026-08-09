import { useEffect, useState } from 'react';
import { Alert, DatePicker, Empty, Select, Space, Spin, Table, Typography } from 'antd';
import type { Dayjs } from 'dayjs';
import { listarHistorico } from '../../services/moderacaoService';
import { ApiError } from '../../services/api';
import type { AcaoModeradorResponse, TipoAcaoModerador } from '../../types/moderacao';

const TAMANHO_PAGINA = 20;

const TIPOS: Array<{ valor: TipoAcaoModerador; rotulo: string }> = [
  { valor: 'ACESSO_FILA_CONTESTACOES', rotulo: 'Acesso à fila de contestações' },
  { valor: 'CONTESTACAO_MANTIDA', rotulo: 'Contestação mantida' },
  { valor: 'CONTESTACAO_SEPARADA', rotulo: 'Contestação separada' },
  { valor: 'CONTESTACAO_REJEITADA', rotulo: 'Contestação rejeitada' },
  { valor: 'SINALIZADO_APROVADO', rotulo: 'Sinalizado aprovado' },
  { valor: 'SINALIZADO_MANTIDO_BLOQUEIO', rotulo: 'Sinalizado mantido bloqueado' },
];

export function HistoricoPage() {
  const [pagina, setPagina] = useState(0);
  const [tipo, setTipo] = useState<TipoAcaoModerador | undefined>(undefined);
  const [periodo, setPeriodo] = useState<[Dayjs, Dayjs] | null>(null);
  const [dados, setDados] = useState<AcaoModeradorResponse[]>([]);
  const [total, setTotal] = useState(0);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState<string | null>(null);

  useEffect(() => {
    let cancelado = false;
    setCarregando(true);
    setErro(null);
    listarHistorico(pagina, TAMANHO_PAGINA, {
      tipo,
      de: periodo?.[0]?.startOf('day').toISOString(),
      ate: periodo?.[1]?.endOf('day').toISOString(),
    })
      .then((resp) => {
        if (cancelado) return;
        setDados(resp.conteudo);
        setTotal(resp.totalElementos);
      })
      .catch((e: unknown) => {
        if (cancelado) return;
        setErro(e instanceof ApiError ? e.message : 'Falha ao carregar o histórico.');
      })
      .finally(() => {
        if (!cancelado) setCarregando(false);
      });
    return () => {
      cancelado = true;
    };
  }, [pagina, tipo, periodo]);

  return (
    <div>
      <Typography.Title level={3}>Histórico de ações</Typography.Title>
      <Space style={{ marginBottom: '1rem' }} wrap>
        <Select<TipoAcaoModerador | undefined>
          allowClear
          placeholder="Filtrar por tipo"
          style={{ width: 280 }}
          value={tipo}
          onChange={(v) => {
            setTipo(v);
            setPagina(0);
          }}
          options={TIPOS.map((t) => ({ value: t.valor, label: t.rotulo }))}
        />
        <DatePicker.RangePicker
          value={periodo}
          onChange={(valores) => {
            setPeriodo(valores as [Dayjs, Dayjs] | null);
            setPagina(0);
          }}
          format="DD/MM/YYYY"
        />
      </Space>
      {erro && <Alert type="error" message={erro} showIcon style={{ marginBottom: '1rem' }} />}
      {carregando ? (
        <div style={{ display: 'flex', justifyContent: 'center', padding: '3rem' }}>
          <Spin size="large" />
        </div>
      ) : dados.length === 0 && !erro ? (
        <Empty description="Nenhuma ação encontrada para os filtros selecionados." />
      ) : (
        <Table<AcaoModeradorResponse>
          rowKey="id"
          dataSource={dados}
          pagination={{
            current: pagina + 1,
            pageSize: TAMANHO_PAGINA,
            total,
            onChange: (p) => setPagina(p - 1),
          }}
          columns={[
            {
              title: 'Tipo',
              dataIndex: 'tipo',
              render: (v: TipoAcaoModerador) => TIPOS.find((t) => t.valor === v)?.rotulo ?? v,
            },
            { title: 'Alvo', dataIndex: 'alvoId', render: (v: string | null) => v ?? '—' },
            { title: 'Detalhe', dataIndex: 'detalhe', render: (v: string | null) => v ?? '—' },
            {
              title: 'Data',
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

// Reexportado apenas para uso em teste (evita duplicar a lista de tipos).
export { TIPOS as TIPOS_ACAO_MODERADOR };
