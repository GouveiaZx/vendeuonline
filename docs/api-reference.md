# Documentação das APIs - Vendeu Online

## Índice
1. [Autenticação](#autenticação)
2. [Usuários](#usuários)
3. [Administradores](#administradores)
4. [Vendedores](#vendedores)
5. [Compradores](#compradores)
6. [Segurança](#segurança)
7. [Códigos de Status](#códigos-de-status)
8. [Estruturas de Dados](#estruturas-de-dados)

## Autenticação

### Login - Comprador
**POST** `/api/auth/login`

Autentica um usuário do tipo comprador.

**Headers:**
```
Content-Type: application/json
```

**Body:**
```json
{
  "email": "maria@comprador.com",
  "password": "password123"
}
```

**Resposta de Sucesso (200):**
```json
{
  "user": {
    "id": "uuid",
    "name": "Maria Compradora",
    "email": "maria@comprador.com",
    "type": "BUYER",
    "phone": "11777777777",
    "city": "Belo Horizonte",
    "state": "MG",
    "avatar": null,
    "is_verified": true,
    "created_at": "2024-01-01T00:00:00.000Z"
  },
  "token": "jwt_token_here",
  "expiresIn": "7d"
}
```

### Login - Vendedor
**POST** `/api/auth/login`

Autentica um usuário do tipo vendedor.

**Body:**
```json
{
  "email": "joao@vendedor.com",
  "password": "password123"
}
```

**Resposta de Sucesso (200):**
```json
{
  "user": {
    "id": "uuid",
    "name": "João Vendedor",
    "email": "joao@vendedor.com",
    "type": "SELLER",
    "seller": {
      "store_name": "Loja do João",
      "store_slug": "loja-do-joao",
      "category": "Eletrônicos",
      "plan": "GRATUITO",
      "rating": 5.0,
      "total_sales": 0
    }
  },
  "token": "jwt_token_here",
  "expiresIn": "7d"
}
```

### Login - Administrador
**POST** `/api/auth/login/admin`

Autentica um usuário administrador com código de segurança.

**Body:**
```json
{
  "email": "admin@vendeuonline.com",
  "password": "password123",
  "adminCode": "ADMIN2024"
}
```

**Resposta de Sucesso (200):**
```json
{
  "user": {
    "id": "uuid",
    "name": "Admin Sistema",
    "email": "admin@vendeuonline.com",
    "type": "ADMIN",
    "admin": {
      "permissions": ["MANAGE_USERS", "MANAGE_PRODUCTS", "MANAGE_STORES"],
      "last_login_at": "2024-01-01T00:00:00.000Z",
      "is_active": true
    }
  },
  "token": "jwt_token_here",
  "expiresIn": "7d"
}
```

### Registro - Comprador
**POST** `/api/auth/register`

Registra um novo comprador.

**Body:**
```json
{
  "name": "Novo Comprador",
  "email": "novo@comprador.com",
  "password": "password123",
  "phone": "11999999999",
  "city": "São Paulo",
  "state": "SP",
  "type": "BUYER"
}
```

**Resposta de Sucesso (201):**
```json
{
  "success": true,
  "message": "Usuário registrado com sucesso",
  "user": {
    "id": "uuid",
    "name": "Novo Comprador",
    "email": "novo@comprador.com",
    "type": "BUYER"
  }
}
```

### Registro - Vendedor
**POST** `/api/auth/register`

Registra um novo vendedor com loja.

**Body:**
```json
{
  "name": "Novo Vendedor",
  "email": "novo@vendedor.com",
  "password": "password123",
  "phone": "11888888888",
  "city": "Rio de Janeiro",
  "state": "RJ",
  "type": "SELLER",
  "storeName": "Nova Loja",
  "storeDescription": "Descrição da nova loja",
  "storeSlug": "nova-loja",
  "category": "Moda"
}
```

### Registro - Administrador
**POST** `/api/auth/register/admin`

Registra um novo administrador (requer códigos especiais).

**Body:**
```json
{
  "inviteCode": "INVITE_CODE_2024",
  "adminCode": "ADMIN_ACCESS_2024",
  "name": "Novo Admin",
  "email": "novo@admin.com",
  "password": "password123",
  "securityQuestion": "Qual sua comida favorita?",
  "securityAnswer": "Pizza",
  "permissions": ["MANAGE_USERS", "VIEW_ANALYTICS"]
}
```

### Recuperar Senha
**POST** `/api/auth/forgot-password`

Envia email para recuperação de senha.

**Body:**
```json
{
  "email": "usuario@email.com"
}
```

**Resposta de Sucesso (200):**
```json
{
  "success": true,
  "message": "Email de recuperação enviado com sucesso"
}
```

### Resetar Senha
**POST** `/api/auth/reset-password`

Redefine senha usando token de recuperação.

**Body:**
```json
{
  "token": "reset_token_from_email",
  "newPassword": "nova_senha_123"
}
```

### Perfil Atual
**GET** `/api/auth/me`

Retorna dados do usuário autenticado.

**Headers:**
```
Authorization: Bearer jwt_token_here
```

**Resposta de Sucesso (200):**
```json
{
  "user": {
    "id": "uuid",
    "name": "Nome do Usuário",
    "email": "email@exemplo.com",
    "type": "BUYER|SELLER|ADMIN",
    // dados específicos do tipo de usuário
  },
  "session": {
    "isValid": true,
    "expiresAt": "2024-01-08T00:00:00.000Z",
    "type": "BUYER"
  }
}
```

## Usuários

### Listar Usuários (Admin)
**GET** `/api/admin/users`

**Headers:**
```
Authorization: Bearer admin_jwt_token
```

**Query Parameters:**
- `page`: número da página (padrão: 1)
- `limit`: itens por página (padrão: 10)
- `type`: filtrar por tipo (BUYER, SELLER, ADMIN)
- `search`: buscar por email ou nome
- `status`: filtrar por status (active, inactive)

**Resposta de Sucesso (200):**
```json
{
  "users": [
    {
      "id": "uuid",
      "name": "Nome do Usuário",
      "email": "email@exemplo.com",
      "type": "BUYER",
      "is_verified": true,
      "created_at": "2024-01-01T00:00:00.000Z"
    }
  ],
  "pagination": {
    "current_page": 1,
    "total_pages": 5,
    "total_items": 50,
    "items_per_page": 10
  }
}
```

### Atualizar Usuário (Admin)
**PUT** `/api/admin/users/:id`

**Headers:**
```
Authorization: Bearer admin_jwt_token
```

**Body:**
```json
{
  "name": "Novo Nome",
  "email": "novo@email.com",
  "is_verified": true,
  "type": "BUYER"
}
```

### Desativar Usuário (Admin)
**DELETE** `/api/admin/users/:id`

**Headers:**
```
Authorization: Bearer admin_jwt_token
```

## Vendedores

### Listar Vendedores (Admin)
**GET** `/api/admin/sellers`

**Resposta de Sucesso (200):**
```json
{
  "sellers": [
    {
      "id": "uuid",
      "user": {
        "name": "João Vendedor",
        "email": "joao@vendedor.com"
      },
      "store_name": "Loja do João",
      "store_slug": "loja-do-joao",
      "category": "Eletrônicos",
      "plan": "GRATUITO",
      "is_active": true,
      "rating": 4.8,
      "total_sales": 150
    }
  ]
}
```

### Atualizar Plano do Vendedor (Admin)
**PUT** `/api/admin/sellers/:id/plan`

**Body:**
```json
{
  "plan": "PEQUENA_EMPRESA",
  "commission": 8.0
}
```

## Compradores

### Estatísticas de Compradores (Admin)
**GET** `/api/admin/buyers/stats`

**Resposta de Sucesso (200):**
```json
{
  "total_buyers": 1250,
  "active_buyers": 890,
  "new_this_month": 45,
  "top_cities": [
    { "city": "São Paulo", "count": 320 },
    { "city": "Rio de Janeiro", "count": 180 }
  ]
}
```

## Segurança

### Eventos de Segurança (Admin)
**GET** `/api/admin/security/events`

**Query Parameters:**
- `page`: número da página
- `limit`: itens por página
- `type`: tipo de evento
- `user_id`: filtrar por usuário
- `start_date`: data início
- `end_date`: data fim

**Resposta de Sucesso (200):**
```json
{
  "events": [
    {
      "id": "uuid",
      "event_type": "ADMIN_LOGIN",
      "user_id": "uuid",
      "ip_address": "192.168.1.1",
      "user_agent": "Mozilla/5.0...",
      "metadata": {
        "success": true,
        "admin_code_used": true
      },
      "created_at": "2024-01-01T10:30:00.000Z"
    }
  ]
}
```

### Limpar Tokens Expirados
**POST** `/api/admin/security/cleanup`

**Resposta de Sucesso (200):**
```json
{
  "success": true,
  "message": "Limpeza executada com sucesso",
  "removed": {
    "password_tokens": 5,
    "expired_sessions": 12
  }
}
```

## Códigos de Status

### Sucessos
- `200 OK`: Requisição bem-sucedida
- `201 Created`: Recurso criado com sucesso
- `204 No Content`: Operação bem-sucedida sem conteúdo

### Erros do Cliente
- `400 Bad Request`: Dados inválidos ou malformados
- `401 Unauthorized`: Token inválido ou ausente
- `403 Forbidden`: Sem permissão para acessar o recurso
- `404 Not Found`: Recurso não encontrado
- `409 Conflict`: Conflito (ex: email já existe)
- `422 Unprocessable Entity`: Erro de validação

### Erros do Servidor
- `500 Internal Server Error`: Erro interno do servidor
- `503 Service Unavailable`: Serviço temporariamente indisponível

## Estruturas de Dados

### User
```typescript
interface User {
  id: string;
  name: string;
  email: string;
  password?: string; // nunca retornado nas responses
  phone?: string;
  type: 'ADMIN' | 'SELLER' | 'BUYER';
  city?: string;
  state?: string;
  avatar?: string;
  is_verified: boolean;
  password_changed_at?: string;
  created_at: string;
  updated_at: string;
}
```

### Admin
```typescript
interface Admin {
  id: string;
  user_id: string;
  security_question?: string;
  security_answer?: string; // nunca retornado
  permissions: string[];
  last_login_at?: string;
  login_attempts: number;
  is_active: boolean;
  metadata: Record<string, any>;
  created_at: string;
  updated_at: string;
}
```

### Seller
```typescript
interface Seller {
  id: string;
  user_id: string;
  store_name: string;
  store_description?: string;
  store_slug: string;
  address?: string;
  zip_code?: string;
  category: string;
  plan: string;
  is_active: boolean;
  rating: number;
  total_sales: number;
  commission: number;
  created_at: string;
  updated_at: string;
}
```

### SecurityEvent
```typescript
interface SecurityEvent {
  id: string;
  event_type: 'ADMIN_LOGIN' | 'ADMIN_REGISTER' | 'PASSWORD_RESET_REQUEST' | 
              'PASSWORD_RESET_SUCCESS' | 'PROFILE_UPDATE' | 'FAILED_LOGIN_ATTEMPT' | 
              'ACCOUNT_LOCKED' | 'SUSPICIOUS_ACTIVITY';
  user_id?: string;
  ip_address?: string;
  user_agent?: string;
  metadata: Record<string, any>;
  created_at: string;
}
```

## Middleware de Autenticação

Todas as rotas protegidas requerem o header:
```
Authorization: Bearer <jwt_token>
```

O token JWT contém:
```json
{
  "sub": "user_id",
  "email": "user@example.com",
  "type": "BUYER|SELLER|ADMIN",
  "iat": 1640995200,
  "exp": 1641600000
}
```

## Tratamento de Erros

Todos os erros seguem o formato:
```json
{
  "error": "Mensagem de erro legível",
  "code": "ERROR_CODE",
  "details": {
    // informações adicionais quando aplicável
  }
}
```

## Rate Limiting

- Login: 5 tentativas por minuto por IP
- Registro: 3 tentativas por minuto por IP
- APIs Admin: 100 requisições por minuto por token
- APIs gerais: 60 requisições por minuto por token

## Exemplos de Uso

### Fluxo completo de autenticação:

```javascript
// 1. Login
const loginResponse = await fetch('/api/auth/login', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    email: 'user@example.com',
    password: 'password123'
  })
});

const { token } = await loginResponse.json();

// 2. Usar token nas próximas requisições
const profileResponse = await fetch('/api/auth/me', {
  headers: {
    'Authorization': `Bearer ${token}`
  }
});
```

### Tratamento de erros:

```javascript
try {
  const response = await fetch('/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password })
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Erro na requisição');
  }

  const data = await response.json();
  // Sucesso
} catch (error) {
  console.error('Erro:', error.message);
}
```