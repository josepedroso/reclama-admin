import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import {
  Alert,
  Button,
  Card,
  Col,
  Empty,
  Input,
  Modal,
  Row,
  Space,
  Spin,
  Tag,
  Typography,
  message,
} from 'antd';
import { CheckOutlined, CloseOutlined, SwapOutlined } from '@ant-design/icons';
import { listarContestacoes, resolverContestacao } from '../../services/moderacaoService';
import { ApiError } from '../../services/api';
import { usePendenciasStore } from '../../stores/pendenciasStore';
import type { AcaoContestacao, ContestacaoFilaResponse } from '../../types/moderacao';

const TAMANHO_FILA = 50;

const ACOES: Array<{
  acao: AcaoContestacao;
  rotulo: string;
  icone: React.ReactNode;
  descricao: string;
  perigo?: boolean;
}> = [
  {
    acao: 'MANTER',
    rotulo: 'Manter agregação',
    icone: <CheckOutlined />,
    descricao: 'A contestação é rejeitada e a reclamação continua agregada à consolidada.',
  },
  {
    acao: 'SEPARAR',
    rotulo: 'Separar',
    icone: <SwapOutlined />,
    descricao: 'A reclamação é desagregada e publicada de forma independente.',
  },
  {
    acao: 'REJEITAR',
    rotulo: 'Rejeitar contestação',
    icone: <CloseOutlined />,
    descricao: 'A contestação é encerrada sem alterar a agregação atual.',
    perigo: true,
  },
];

export function AnaliseContestacaoPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { atualizar } = usePendenciasStore();
  const [fila, setFila] = useState<ContestacaoFilaResponse[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState<string | null>(null);
  const [acaoEmConfirmacao, setAcaoEmConfirmacao] = useState<AcaoContestacao | null>(null);
  const [observacao, setObservacao] = useState('');
  const [resolvendo, setResolvendo] = useState(false);

  function carregarFila() {
    setCarregando(true);
    setErro(null);
    return listarContestacoes(0, TAMANHO_FILA)
      .then((resp) => setFila(resp.conteudo))
      .catch((e: unknown) => {
        setErro(e instanceof ApiError ? e.message : 'Falha ao carregar a contestação.');
      })
      .finally(() => setCarregando(false));
  }

  useEffect(() => {
    carregarFila();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const registro = fila.find((c) => c.id === id);

  async function confirmarResolucao() {
    if (!acaoEmConfirmacao || !registro) return;
    setResolvendo(true);
    try {
      await resolverContestacao(registro.id, {
        acao: acaoEmConfirmacao,
        observacao: observacao.trim() || undefined,
      });
      message.success('Contestação resolvida.');
      await atualizar();
      setAcaoEmConfirmacao(null);
      setObservacao('');
      const proxima = fila.find((c) => c.id !== registro.id);
      if (proxima) {
        navigate(`/contestacoes/${proxima.id}`, { replace: true });
      } else {
        navigate('/contestacoes', { replace: true });
      }
    } catch (e) {
      message.error(e instanceof ApiError ? e.message : 'Falha ao resolver a contestação.');
    } finally {
      setResolvendo(false);
    }
  }

  if (carregando) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', padding: '3rem' }}>
        <Spin size="large" />
      </div>
    );
  }

  if (erro) {
    return <Alert type="error" message={erro} showIcon />;
  }

  if (!registro) {
    return (
      <Empty description="Contestação não encontrada na fila atual.">
        <Link to="/contestacoes">Voltar para a fila</Link>
      </Empty>
    );
  }

  const acaoSelecionada = ACOES.find((a) => a.acao === acaoEmConfirmacao);

  return (
    <div>
      <Typography.Title level={3}>Análise de contestação</Typography.Title>
      <Space direction="vertical" style={{ marginBottom: '1rem' }}>
        <Typography.Text type="secondary">
          Justificativa do contestante: <Typography.Text>{registro.justificativa}</Typography.Text>
        </Typography.Text>
        {registro.similaridade != null && (
          <Typography.Text type="secondary">
            Similaridade registrada: <Tag>{(registro.similaridade * 100).toFixed(1)}%</Tag>
            {registro.thresholdUsado != null && (
              <> (threshold usado: {(registro.thresholdUsado * 100).toFixed(1)}%)</>
            )}
          </Typography.Text>
        )}
      </Space>
      <Row gutter={16}>
        <Col span={12}>
          <Card title="Texto original do autor" style={{ height: '100%' }}>
            <Typography.Title level={5}>{registro.reclamacaoTitulo}</Typography.Title>
            <Typography.Paragraph>{registro.reclamacaoDescricao}</Typography.Paragraph>
          </Card>
        </Col>
        <Col span={12}>
          <Card title="Consolidada atual" style={{ height: '100%' }}>
            {registro.consolidadaTitulo ? (
              <>
                <Typography.Title level={5}>{registro.consolidadaTitulo}</Typography.Title>
                <Typography.Paragraph>{registro.consolidadaDescricao}</Typography.Paragraph>
              </>
            ) : (
              <Empty description="Sem consolidada associada." />
            )}
          </Card>
        </Col>
      </Row>
      <Space style={{ marginTop: '1.5rem' }}>
        {ACOES.map((a) => (
          <Button
            key={a.acao}
            icon={a.icone}
            danger={a.perigo}
            type={a.acao === 'MANTER' ? 'primary' : 'default'}
            onClick={() => setAcaoEmConfirmacao(a.acao)}
          >
            {a.rotulo}
          </Button>
        ))}
      </Space>

      <Modal
        title={acaoSelecionada?.rotulo}
        open={acaoEmConfirmacao !== null}
        onOk={confirmarResolucao}
        onCancel={() => {
          setAcaoEmConfirmacao(null);
          setObservacao('');
        }}
        confirmLoading={resolvendo}
        okText="Confirmar"
        cancelText="Cancelar"
      >
        <Typography.Paragraph>{acaoSelecionada?.descricao}</Typography.Paragraph>
        <Input.TextArea
          placeholder="Observação (opcional)"
          maxLength={500}
          showCount
          rows={3}
          value={observacao}
          onChange={(e) => setObservacao(e.target.value)}
        />
      </Modal>
    </div>
  );
}
