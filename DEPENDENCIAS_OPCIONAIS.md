# 📦 Dependências Opcionais

Este arquivo documenta as dependências opcionais que precisam ser instaladas dependendo das funcionalidades que você deseja usar.

## 🎯 Para Funcionalidades de Demonstração

### Virtualização e Performance Demos
Para usar `/demo/virtualization` e componentes avançados de virtualização:

```bash
npm install react-window @types/react-window
npm install @mui/material @emotion/react @emotion/styled
npm install @mui/icons-material
```

### Componentes de UI Avançados
```bash
npm install framer-motion  # Para animações avançadas
npm install recharts       # Para gráficos e charts
npm install react-hook-form @hookform/resolvers  # Para formulários complexos
```

## ⚙️ Para Build de Produção Completo

### Monitoramento e Analytics
```bash
npm install @sentry/nextjs    # Para error tracking
npm install @vercel/analytics  # Para analytics
```

### PWA e Service Workers
```bash
npm install workbox-webpack-plugin workbox-window
```

## 🚀 Como Instalar

### Instalação Básica (Essencial)
```bash
npm install
```

### Instalação Completa (Todas as funcionalidades)
```bash
npm install
npm install react-window @types/react-window
npm install @mui/material @emotion/react @emotion/styled
npm install @mui/icons-material
npm install framer-motion recharts
npm install @sentry/nextjs @vercel/analytics
```

## 📝 Notas

- **Funcionamento Básico**: O projeto funciona sem essas dependências opcionais
- **Demos**: Páginas de demonstração podem não funcionar sem as dependências específicas
- **Produção**: Para deploy completo, instale todas as dependências

## 🔧 Troubleshooting

Se alguma página não funcionar:
1. Verifique se as dependências necessárias estão instaladas
2. Instale apenas as dependências que você precisa
3. Para desenvolvimento básico, ignore os erros de demos