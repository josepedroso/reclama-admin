import { useEffect, useState } from 'react';
import {
  Alert,
  Button,
  Card,
  Empty,
  Image,
  Input,
  Modal,
  Pagination,
  Space,
  Spin,
  Typography,
  message,
} from 'antd';
import { CheckOutlined, StopOutlined } from '@ant-design/icons';
import { listarImagensPendentes, resolverImagens } from '../../services/moderacaoService';
import { ApiError } from '../../services/api';
import { usePendenciasStore } from '../../stores/pendenciasStore';
import type { AcaoImagem, ImagensPendentesResponse } from '../../types/moderacao';

const TAMANHO_PAGINA = 5;

export function FilaImagensPage() {
  const { atualizar } = usePendenciasStore();
  const [pagina, setPagina] = useState(0);
  const [dados, setDados] = useState<ImagensPendentesResponse[]>([]);
  const [total, setTotal] = useState(0);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState<string | null>(null);
  const [confirmacao, setConfirmacao] = useState<{
    item: ImagensPendentesResponse;
    acao: AcaoImagem;
  } | null>(null);
  const [motivo, setMotivo] = useState('');
  const [resolvendo, setResolvendo] = useState(false);

  async function carregar() {
    setCarregando(true);
    setErro(null);
    try {
      const resp = await listarImagensPendentes(pagina, TAMANHO_PAGINA);
      setDados(resp.conteudo);
      setTotal(resp.totalElementos);
    } catch (e: unknown) {
      setErro(e instanceof ApiError ? e.message : 'Falha ao carregar a fila de imagens.');
    } finally {
      setCarregando(false);
    }
  }

  useEffect(() => {
    void carregar();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pagina]);

  function abrir(item: ImagensPendentesResponse, acao: AcaoImagem) {
    setMotivo('');
    setConfirmacao({ item, acao });
  }

  const reprovando = confirmacao?.acao === 'REPROVAR';
  const motivoInvalido = reprovando && motivo.trim() === '';

  async function confirmar() {
    if (!confirmacao || motivoInvalido) return;
    setResolvendo(true);
    try {
      await resolverImagens(confirmacao.item.reclamacaoId, {
        acao: confirmacao.acao,
        motivo: reprovando ? motivo.trim() : undefined,
      });
      message.success(reprovando ? 'Imagens reprovadas.' : 'Imagens aprovadas.');
      setConfirmacao(null);
      // Avança para a próxima; se era o último item da página, volta uma página.
      if (dados.length === 1 && pagina > 0) {
        setPagina(pagina - 1);
      } else {
        await carregar();
      }
      await atualizar();
    } catch (e) {
      message.error(e instanceof ApiError ? e.message : 'Falha ao resolver as imagens.');
    } finally {
      setResolvendo(false);
    }
  }

  return (
    <div>
      <Typography.Title level={3}>Fila de imagens</Typography.Title>
      {erro && <Alert type="error" message={erro} showIcon style={{ marginBottom: '1rem' }} />}
      {carregando ? (
        <div style={{ display: 'flex', justifyContent: 'center', padding: '3rem' }}>
          <Spin size="large" />
        </div>
      ) : dados.length === 0 && !erro ? (
        <Empty description="Nenhuma imagem pendente de aprovação." />
      ) : (
        <Space direction="vertical" size="middle" style={{ width: '100%' }}>
          {dados.map((item) => (
            <Card
              key={item.reclamacaoId}
              title={item.titulo}
              actions={[
                <Button
                  key="aprovar"
                  type="primary"
                  icon={<CheckOutlined />}
                  onClick={() => abrir(item, 'APROVAR')}
                >
                  Aprovar
                </Button>,
                <Button
                  key="reprovar"
                  danger
                  icon={<StopOutlined />}
                  onClick={() => abrir(item, 'REPROVAR')}
                >
                  Reprovar
                </Button>,
              ]}
            >
              <Typography.Paragraph>{item.descricao}</Typography.Paragraph>
              <Image.PreviewGroup>
                <Space wrap>
                  {item.imagens.map((img, i) => (
                    <Image
                      key={img.id}
                      src={img.urlMiniatura}
                      alt={`Imagem ${i + 1} de ${item.titulo}`}
                      width={120}
                      height={120}
                      style={{ objectFit: 'cover' }}
                      preview={{ src: img.urlGrande }}
                    />
                  ))}
                </Space>
              </Image.PreviewGroup>
            </Card>
          ))}
          <Pagination
            current={pagina + 1}
            pageSize={TAMANHO_PAGINA}
            total={total}
            showSizeChanger={false}
            onChange={(p) => setPagina(p - 1)}
          />
        </Space>
      )}

      <Modal
        title={reprovando ? 'Reprovar imagens' : 'Aprovar imagens'}
        open={confirmacao !== null}
        onOk={confirmar}
        onCancel={() => setConfirmacao(null)}
        confirmLoading={resolvendo}
        okText="Confirmar"
        cancelText="Cancelar"
        okButtonProps={{ disabled: motivoInvalido }}
      >
        {reprovando ? (
          <>
            <Typography.Paragraph>
              A reclamação será bloqueada e o autor será notificado com o motivo abaixo.
            </Typography.Paragraph>
            <Input.TextArea
              aria-label="Motivo da reprovação"
              placeholder="Motivo da reprovação (obrigatório)"
              value={motivo}
              maxLength={500}
              rows={3}
              onChange={(e) => setMotivo(e.target.value)}
            />
          </>
        ) : (
          <Typography.Paragraph>
            A reclamação segue para a agregação por IA e é publicada normalmente.
          </Typography.Paragraph>
        )}
      </Modal>
    </div>
  );
}
