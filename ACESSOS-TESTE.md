# 🔐 Acessos de Teste - Vendeu Online

Este documento contém as credenciais de teste para acessar o sistema com diferentes tipos de usuário.

## 📍 URLs de Acesso

- **Site Principal**: http://localhost:3000
- **Login Comprador**: http://localhost:3000/login
- **Login Vendedor**: http://localhost:3000/login/seller  
- **Login Admin**: http://localhost:3000/login/admin
- **Registro**: http://localhost:3000/register

---

## 👤 COMPRADOR (BUYER)

### Credenciais:
- **Email**: `maria@comprador.com`
- **Senha**: `password123`

### Funcionalidades Disponíveis:
- ✅ Navegar e pesquisar produtos
- ✅ Adicionar produtos ao carrinho
- ✅ Realizar pedidos e pagamentos
- ✅ Visualizar histórico de pedidos
- ✅ Gerenciar lista de desejos
- ✅ Avaliar produtos e lojas
- ✅ Receber notificações de pedidos
- ✅ Gerenciar endereços de entrega

### Dashboard:
- Acesse: `/buyer/dashboard`
- Visualize pedidos, wishlist, histórico

---

## 🏪 VENDEDOR (SELLER)

### Credenciais:
- **Email**: `joao@vendedor.com`
- **Senha**: `password123`

### Dados da Loja:
- **Nome da Loja**: Loja do João
- **Slug**: loja-do-joao
- **Categoria**: Eletrônicos
- **Plano**: GRATUITO

### Funcionalidades Disponíveis:
- ✅ Gerenciar produtos (criar, editar, excluir)
- ✅ Controlar estoque
- ✅ Visualizar e processar pedidos
- ✅ Configurar loja (descrição, imagens, etc.)
- ✅ Analytics de vendas
- ✅ Gerenciar comissões e pagamentos
- ✅ Fazer upload de documentos
- ✅ Receber notificações de pedidos
- ✅ Configurar métodos de pagamento

### Dashboard:
- Acesse: `/seller/dashboard`
- Gerencie produtos, pedidos, analytics

---

## ⚡ ADMINISTRADOR (ADMIN)

### Credenciais:
- **Email**: `admin@vendeuonline.com`
- **Senha**: `password123`
- **Código Admin**: `ADMIN2024`

### Códigos Administrativos Válidos:
- `ADMIN2024`
- `MASTER_ACCESS_2024`
- Código definido na variável `ADMIN_ACCESS_CODE`

### Funcionalidades Disponíveis:
- ✅ Gerenciar todos os usuários
- ✅ Aprovar/rejeitar lojas
- ✅ Moderar produtos e conteúdo
- ✅ Configurar comissões e planos
- ✅ Analytics globais do sistema
- ✅ Gerenciar banners e cupons
- ✅ Configurações do sistema
- ✅ Logs de segurança
- ✅ Relatórios financeiros
- ✅ Gerenciar categorias

### Permissões Padrão:
- `MANAGE_USERS`
- `MANAGE_PRODUCTS` 
- `MANAGE_STORES`
- `VIEW_ANALYTICS`
- `MANAGE_SYSTEM`
- `MANAGE_SECURITY`

### Dashboard:
- Acesse: `/admin/dashboard`
- Controle total do sistema

---

## 🚀 Como Testar

### 1. Iniciar a Aplicação:
```bash
npm run dev
```

### 2. Acessar Login:
- Vá para `http://localhost:3000`
- Clique no tipo de login desejado
- Use as credenciais acima

### 3. Explorar Funcionalidades:
- Navegue pelos dashboards específicos
- Teste criação de produtos (seller)
- Teste compras (buyer)  
- Teste moderação (admin)

---

## 🔧 Funcionalidades Especiais para Teste

### Pagamentos (Simulação):
- Use cartões de teste do Asaas
- PIX é simulado automaticamente
- Boletos são gerados como teste

### Upload de Arquivos:
- Imagens são redimensionadas automaticamente
- Documentos aceitos: PDF, JPG, PNG
- Limite: 10MB por arquivo

### Notificações:
- Sistema em tempo real
- Tipos: pedidos, pagamentos, sistema
- Configuráveis por usuário

---

## ⚠️ Notas Importantes

1. **Dados de Teste**: Todos os dados são fictícios e resetáveis
2. **Códigos Admin**: Necessários para segurança adicional
3. **Emails**: Não são enviados emails reais em desenvolvimento
4. **Pagamentos**: Apenas simulados, nenhum valor real é processado
5. **Sessões**: Tokens JWT válidos por 7 dias

---

## 🆘 Problemas Comuns

### "Token inválido":
- Faça logout e login novamente
- Limpe o localStorage do navegador

### "Acesso negado":
- Verifique se está usando o tipo de usuário correto
- Admins precisam do código administrativo

### "Logo não aparece":
- Verifique se `LogoVO.png` está em `/public/`
- Recarregue a página

### "Erro de hidration":
- Foi corrigido, mas se aparecer, recarregue a página

---

## 📞 Suporte

Para dúvidas ou problemas:
1. Verifique os logs do console
2. Consulte a documentação em `/docs/`
3. Verifique as APIs em `/docs/api-reference.md`

---

**Última atualização**: Janeiro 2025
**Status**: ✅ Totalmente Funcional