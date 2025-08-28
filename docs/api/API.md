# API Documentation - Vendeu Online

## Visão Geral

A API do Vendeu Online é uma API REST que oferece endpoints para gerenciamento completo de uma plataforma de marketplace multivendedor.

**Base URL:** `https://your-domain.com/api`
**Versão:** `v1`
**Autenticação:** JWT Bearer Token

## Autenticação

### Headers Necessários
```http
Authorization: Bearer <jwt_token>
Content-Type: application/json
```

### Obter Token
```http
POST /api/auth/login
Content-Type: application/json

{
  "email": "usuario@exemplo.com",
  "password": "senha123"
}
```

**Resposta:**
```json
{
  "user": {
    "id": "user_id",
    "name": "Nome do Usuário",
    "email": "usuario@exemplo.com",
    "type": "BUYER|SELLER|ADMIN"
  },
  "token": "jwt_token_aqui",
  "expiresIn": "7d"
}
```

## Produtos

### Listar Produtos
```http
GET /api/products?page=1&limit=12&search=termo&category=categoria
```

**Query Parameters:**
- `page` (number): Página atual (padrão: 1)
- `limit` (number): Itens por página (padrão: 12, max: 100)
- `search` (string): Termo de busca
- `category` (string): Slug da categoria
- `minPrice` (number): Preço mínimo
- `maxPrice` (number): Preço máximo
- `sortBy` (string): Ordenação (`name`, `price`, `createdAt`, `rating`, `sales`)
- `sortOrder` (string): Direção (`asc`, `desc`)

**Resposta:**
```json
{
  "products": [
    {
      "id": "product_id",
      "name": "Nome do Produto",
      "description": "Descrição do produto",
      "price": 99.90,
      "comparePrice": 149.90,
      "images": [
        {
          "id": "img_id",
          "url": "https://cdn.exemplo.com/image.jpg",
          "alt": "Descrição da imagem",
          "order": 0
        }
      ],
      "stock": 10,
      "rating": 4.5,
      "reviewCount": 25,
      "store": {
        "id": "store_id",
        "name": "Nome da Loja",
        "slug": "loja-exemplo"
      },
      "category": {
        "id": "cat_id",
        "name": "Categoria",
        "slug": "categoria-exemplo"
      }
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 12,
    "total": 150,
    "totalPages": 13,
    "hasNext": true,
    "hasPrev": false
  }
}
```

### Obter Produto
```http
GET /api/products/{id}
```

### Criar Produto (Vendedor)
```http
POST /api/products
Authorization: Bearer <seller_token>

{
  "name": "Novo Produto",
  "description": "Descrição detalhada",
  "price": 99.90,
  "comparePrice": 149.90,
  "categoryId": "category_id",
  "stock": 50,
  "images": [
    {
      "url": "https://cdn.exemplo.com/image.jpg",
      "alt": "Produto principal"
    }
  ],
  "specifications": [
    {
      "name": "Cor",
      "value": "Azul"
    }
  ]
}
```

### Atualizar Produto (Vendedor)
```http
PUT /api/products/{id}
Authorization: Bearer <seller_token>
```

### Deletar Produto (Vendedor)
```http
DELETE /api/products/{id}
Authorization: Bearer <seller_token>
```

## Pedidos

### Listar Pedidos do Usuário
```http
GET /api/orders?status=PENDING&page=1&limit=10
Authorization: Bearer <user_token>
```

**Filtros:**
- `status`: `PENDING`, `CONFIRMED`, `PROCESSING`, `SHIPPED`, `DELIVERED`, `CANCELLED`
- `startDate`: Data inicial (ISO 8601)
- `endDate`: Data final (ISO 8601)

### Criar Pedido
```http
POST /api/orders
Authorization: Bearer <buyer_token>

{
  "items": [
    {
      "productId": "product_id",
      "quantity": 2,
      "price": 99.90
    }
  ],
  "shippingAddress": {
    "name": "Casa",
    "street": "Rua das Flores",
    "number": "123",
    "neighborhood": "Centro",
    "city": "São Paulo",
    "state": "SP",
    "zipCode": "01234-567",
    "phone": "(11) 99999-9999"
  },
  "paymentMethod": "PIX",
  "notes": "Entregar no portão"
}
```

### Atualizar Status do Pedido (Vendedor)
```http
PATCH /api/orders/{id}/status
Authorization: Bearer <seller_token>

{
  "status": "SHIPPED",
  "trackingCode": "BR123456789"
}
```

## Pagamentos

### Criar Pagamento
```http
POST /api/payments/create
Authorization: Bearer <buyer_token>

{
  "orderId": "order_id",
  "paymentMethod": "CREDIT_CARD",
  "paymentData": {
    "cardToken": "card_token",
    "installments": 3
  }
}
```

### Verificar Status do Pagamento
```http
GET /api/payments/status?orderId=order_id
Authorization: Bearer <user_token>
```

## Lojas

### Listar Lojas
```http
GET /api/stores?page=1&limit=12&search=termo&category=categoria
```

### Obter Loja
```http
GET /api/stores/{id}
```

### Criar/Atualizar Loja (Vendedor)
```http
POST /api/stores
Authorization: Bearer <seller_token>

{
  "name": "Minha Loja",
  "description": "Descrição da loja",
  "category": "eletrônicos",
  "address": "Endereço completo",
  "phone": "(11) 99999-9999",
  "email": "contato@loja.com"
}
```

## Avaliações

### Listar Avaliações do Produto
```http
GET /api/reviews?productId=product_id&page=1&limit=10
```

### Criar Avaliação
```http
POST /api/reviews
Authorization: Bearer <buyer_token>

{
  "productId": "product_id",
  "rating": 5,
  "title": "Excelente produto!",
  "comment": "Muito satisfeito com a compra",
  "images": ["url_da_foto1.jpg"]
}
```

## Upload de Arquivos

### Upload de Imagem
```http
POST /api/upload
Authorization: Bearer <user_token>
Content-Type: multipart/form-data

{
  "file": <binary_data>,
  "folder": "products", // ou "stores", "users"
  "maxWidth": 1200,
  "maxHeight": 800
}
```

**Resposta:**
```json
{
  "url": "https://cdn.exemplo.com/products/image.jpg",
  "publicId": "products/image",
  "width": 1200,
  "height": 800,
  "size": 150000
}
```

## Busca e Filtros

### Busca Avançada
```http
POST /api/search/advanced

{
  "query": "smartphone",
  "filters": {
    "categories": ["eletronicos"],
    "priceRange": {
      "min": 100,
      "max": 1000
    },
    "location": {
      "city": "São Paulo",
      "state": "SP",
      "radius": 50
    },
    "attributes": {
      "marca": "Apple",
      "cor": "Azul"
    }
  },
  "sort": {
    "field": "price",
    "direction": "asc"
  },
  "pagination": {
    "page": 1,
    "limit": 20
  }
}
```

### Sugestões de Busca
```http
GET /api/search/suggestions?q=smartph
```

## Administração

### Analytics (Admin)
```http
GET /api/admin/analytics?period=7d&metric=sales
Authorization: Bearer <admin_token>
```

### Gerenciar Usuários (Admin)
```http
GET /api/admin/users?page=1&limit=20&role=SELLER
PATCH /api/admin/users/{id}/status
Authorization: Bearer <admin_token>

{
  "status": "active|suspended|banned",
  "reason": "Violação dos termos"
}
```

## Códigos de Status HTTP

- `200` - Sucesso
- `201` - Criado com sucesso
- `400` - Dados inválidos
- `401` - Não autenticado
- `403` - Não autorizado
- `404` - Não encontrado
- `409` - Conflito (ex: email já existe)
- `422` - Entidade não processável
- `429` - Muitas requisições (rate limit)
- `500` - Erro interno do servidor

## Rate Limiting

A API implementa rate limiting baseado no endpoint:

| Endpoint | Limite | Janela |
|----------|--------|--------|
| `/api/auth/*` | 5 req | 5 min |
| `/api/products` | 100 req | 1 min |
| `/api/orders` | 20 req | 1 min |
| `/api/upload` | 10 req | 5 min |
| Outros | 60 req | 1 min |

Headers de resposta:
- `X-RateLimit-Limit`: Limite total
- `X-RateLimit-Remaining`: Requisições restantes
- `X-RateLimit-Reset`: Timestamp do reset
- `Retry-After`: Segundos para tentar novamente (em caso de 429)

## Webhooks

### Configurar Webhook (Vendedor)
```http
POST /api/webhooks
Authorization: Bearer <seller_token>

{
  "url": "https://sua-api.com/webhook",
  "events": ["order.created", "order.updated", "payment.confirmed"],
  "secret": "webhook_secret"
}
```

### Eventos Disponíveis
- `order.created` - Novo pedido
- `order.updated` - Status do pedido alterado
- `payment.confirmed` - Pagamento confirmado
- `payment.failed` - Falha no pagamento
- `product.low_stock` - Estoque baixo

## Health Check

### Verificar Saúde da API
```http
GET /api/health
```

**Resposta:**
```json
{
  "overall": "healthy",
  "database": {
    "status": "connected",
    "responseTime": 45
  },
  "externalServices": {
    "supabase": {
      "status": "up",
      "responseTime": 120
    }
  },
  "system": {
    "uptime": 86400,
    "memory": {
      "used": 234567890,
      "total": 1073741824,
      "percentage": 21.8
    }
  },
  "timestamp": "2024-01-15T10:30:00Z"
}
```

## Exemplos de Uso

### SDK JavaScript (exemplo básico)
```javascript
class VendeuOnlineAPI {
  constructor(baseURL, token) {
    this.baseURL = baseURL;
    this.token = token;
  }
  
  async request(endpoint, options = {}) {
    const response = await fetch(`${this.baseURL}${endpoint}`, {
      ...options,
      headers: {
        'Authorization': `Bearer ${this.token}`,
        'Content-Type': 'application/json',
        ...options.headers
      }
    });
    
    if (!response.ok) {
      throw new Error(`API Error: ${response.status}`);
    }
    
    return response.json();
  }
  
  // Produtos
  async getProducts(params = {}) {
    const query = new URLSearchParams(params).toString();
    return this.request(`/api/products?${query}`);
  }
  
  async createProduct(productData) {
    return this.request('/api/products', {
      method: 'POST',
      body: JSON.stringify(productData)
    });
  }
  
  // Pedidos
  async getOrders(params = {}) {
    const query = new URLSearchParams(params).toString();
    return this.request(`/api/orders?${query}`);
  }
  
  async createOrder(orderData) {
    return this.request('/api/orders', {
      method: 'POST',
      body: JSON.stringify(orderData)
    });
  }
}

// Uso
const api = new VendeuOnlineAPI('https://sua-api.com', 'seu_token_aqui');

// Buscar produtos
const products = await api.getProducts({
  search: 'smartphone',
  page: 1,
  limit: 20
});

// Criar pedido
const order = await api.createOrder({
  items: [{ productId: 'prod_123', quantity: 1, price: 999.90 }],
  shippingAddress: { /* endereço */ },
  paymentMethod: 'PIX'
});
```

## Suporte

Para dúvidas sobre a API:
- Email: dev@vendeuonline.com  
- Documentação: https://docs.vendeuonline.com
- Status da API: https://status.vendeuonline.com