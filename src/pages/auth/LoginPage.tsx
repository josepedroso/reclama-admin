import { useState } from 'react';
import { Navigate } from 'react-router-dom';
import { Alert, Button, Card, Form, Input, Result, Typography } from 'antd';
import { useAuthStore } from '../../stores/authStore';

interface FormValues {
  identificador: string;
  senha: string;
}

export function LoginPage() {
  const status = useAuthStore((s) => s.status);
  const erroLogin = useAuthStore((s) => s.erroLogin);
  const login = useAuthStore((s) => s.login);
  const logout = useAuthStore((s) => s.logout);
  const [enviando, setEnviando] = useState(false);

  if (status === 'autenticado') {
    return <Navigate to="/contestacoes" replace />;
  }
  if (status === 'acessoNegado') {
    return (
      <Result
        status="403"
        title="Acesso negado"
        subTitle="Sua conta nao tem o perfil de moderador necessario para acessar este painel."
        extra={<Button onClick={() => logout()}>Voltar ao login</Button>}
      />
    );
  }

  async function aoEnviar(valores: FormValues) {
    setEnviando(true);
    try {
      await login(valores.identificador, valores.senha);
    } catch {
      // erro ja exposto via erroLogin no store
    } finally {
      setEnviando(false);
    }
  }

  return (
    <div
      style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        minHeight: '100vh',
      }}
    >
      <Card style={{ width: 360 }}>
        <Typography.Title level={3} style={{ textAlign: 'center' }}>
          Painel de Moderação
        </Typography.Title>
        {erroLogin && (
          <Alert type="error" message={erroLogin} style={{ marginBottom: '1rem' }} showIcon />
        )}
        <Form<FormValues> layout="vertical" onFinish={aoEnviar} disabled={enviando}>
          <Form.Item
            name="identificador"
            label="CPF ou e-mail"
            rules={[{ required: true, message: 'Informe o CPF ou e-mail' }]}
          >
            <Input autoFocus autoComplete="username" />
          </Form.Item>
          <Form.Item
            name="senha"
            label="Senha"
            rules={[{ required: true, message: 'Informe a senha' }]}
          >
            <Input.Password autoComplete="current-password" />
          </Form.Item>
          <Form.Item>
            <Button type="primary" htmlType="submit" block loading={enviando}>
              Entrar
            </Button>
          </Form.Item>
        </Form>
      </Card>
    </div>
  );
}
