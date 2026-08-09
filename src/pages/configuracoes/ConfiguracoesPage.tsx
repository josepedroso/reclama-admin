import { useEffect, useState } from 'react';
import {
  Alert,
  Button,
  Card,
  Form,
  Input,
  InputNumber,
  Space,
  Spin,
  Statistic,
  Typography,
  message,
} from 'antd';
import {
  atualizarConfiguracao,
  consultarStatusAgregacao,
  listarConfiguracoes,
} from '../../services/moderacaoService';
import { ApiError } from '../../services/api';
import type { AgregacaoStatusResponse, ConfiguracaoResponse } from '../../types/moderacao';

const CHAVE_THRESHOLD = 'similarity.threshold';

export function ConfiguracoesPage() {
  const [configuracoes, setConfiguracoes] = useState<ConfiguracaoResponse[]>([]);
  const [status, setStatus] = useState<AgregacaoStatusResponse | null>(null);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState<string | null>(null);
  const [salvando, setSalvando] = useState(false);
  const [form] = Form.useForm<{ threshold: number }>();

  function carregar() {
    setCarregando(true);
    setErro(null);
    return Promise.all([listarConfiguracoes(), consultarStatusAgregacao()])
      .then(([configs, statusAgregacao]) => {
        setConfiguracoes(configs);
        setStatus(statusAgregacao);
        const threshold = configs.find((c) => c.chave === CHAVE_THRESHOLD);
        form.setFieldsValue({ threshold: threshold ? Number(threshold.valor) : 0.9 });
      })
      .catch((e: unknown) => {
        setErro(e instanceof ApiError ? e.message : 'Falha ao carregar as configurações.');
      })
      .finally(() => setCarregando(false));
  }

  useEffect(() => {
    carregar();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function salvarThreshold(valores: { threshold: number }) {
    setSalvando(true);
    try {
      await atualizarConfiguracao(CHAVE_THRESHOLD, { valor: String(valores.threshold) });
      message.success('Threshold atualizado. Vale a partir do próximo processamento.');
      await carregar();
    } catch (e) {
      message.error(e instanceof ApiError ? e.message : 'Falha ao salvar o threshold.');
    } finally {
      setSalvando(false);
    }
  }

  const thresholdAtual = configuracoes.find((c) => c.chave === CHAVE_THRESHOLD);

  return (
    <div>
      <Typography.Title level={3}>Configurações</Typography.Title>
      {erro && <Alert type="error" message={erro} showIcon style={{ marginBottom: '1rem' }} />}
      {carregando ? (
        <div style={{ display: 'flex', justifyContent: 'center', padding: '3rem' }}>
          <Spin size="large" />
        </div>
      ) : (
        <Space direction="vertical" size="large" style={{ width: '100%' }}>
          <Card title="Threshold de similaridade">
            <Alert
              type="warning"
              showIcon
              style={{ marginBottom: '1rem' }}
              message="Impacto"
              description="Reduzir o threshold agrega reclamações menos parecidas entre si (mais falsos positivos); aumentar reduz a agregação (mais reclamações publicadas separadamente). A mudança vale para o próximo processamento, sem afetar reclamações já agregadas."
            />
            <Form form={form} layout="inline" onFinish={salvarThreshold}>
              <Form.Item
                name="threshold"
                label="Threshold (0 a 1)"
                rules={[{ required: true, message: 'Informe um valor' }]}
              >
                <InputNumber min={0} max={1} step={0.01} />
              </Form.Item>
              <Form.Item>
                <Button type="primary" htmlType="submit" loading={salvando}>
                  Salvar
                </Button>
              </Form.Item>
            </Form>
            {thresholdAtual && (
              <Typography.Text type="secondary">
                Atualizado em {new Date(thresholdAtual.atualizadoEm).toLocaleString('pt-BR')}
              </Typography.Text>
            )}
          </Card>

          <Card title="Estatísticas de agregação (agregacao_log)">
            <Space size="large" wrap>
              <Statistic
                title="Similaridade média (últimas agregações)"
                value={
                  status?.mediaSimilaridadeRecente != null
                    ? status.mediaSimilaridadeRecente * 100
                    : undefined
                }
                precision={1}
                suffix="%"
                valueRender={(node) =>
                  status?.mediaSimilaridadeRecente != null ? node : <span>—</span>
                }
              />
              <Statistic title="Pendentes no stream" value={status?.pendentes ?? 0} />
              <Statistic title="Processadas" value={status?.processadas ?? 0} />
              <Statistic title="Falhas" value={status?.falhas ?? 0} />
            </Space>
          </Card>

          <Card title="Outras configurações">
            {configuracoes
              .filter((c) => c.chave !== CHAVE_THRESHOLD)
              .map((c) => (
                <Input
                  key={c.chave}
                  addonBefore={c.chave}
                  value={c.valor}
                  readOnly
                  style={{ marginBottom: 8 }}
                />
              ))}
            {configuracoes.length <= 1 && (
              <Typography.Text type="secondary">
                Nenhuma outra configuração registrada.
              </Typography.Text>
            )}
          </Card>
        </Space>
      )}
    </div>
  );
}
