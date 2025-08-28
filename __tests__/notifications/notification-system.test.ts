/**
 * TESTES DO SISTEMA DE NOTIFICAÇÕES POR TIPO DE USUÁRIO
 * 
 * Testa funcionalidades do sistema de notificações:
 * - Notificações específicas por tipo de usuário
 * - Filtragem por categoria e prioridade
 * - Hooks específicos por role
 * - Preferências de notificação
 * - Criação de notificações com templates
 */

import { describe, it, expect, beforeEach, afterEach } from '@jest/globals';
import { renderHook, act } from '@testing-library/react';
import {
  useNotificationStore,
  useAdminNotifications,
  useSellerNotifications,
  useBuyerNotifications,
  createNotification,
  NotificationCategory,
} from '../../src/store/notificationStore';
import { UserType } from '../../src/types';

// Mock do toast
jest.mock('sonner', () => ({
  toast: {
    success: jest.fn(),
    error: jest.fn(),
    warning: jest.fn(),
    info: jest.fn(),
  },
}));

describe('Sistema de Notificações por Tipo de Usuário', () => {
  beforeEach(() => {
    // Reset do store
    useNotificationStore.getState().clearAll();
    jest.clearAllMocks();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('Filtragem por Tipo de Usuário', () => {
    it('deve filtrar notificações para ADMIN', () => {
      const { result } = renderHook(() => useNotificationStore());

      act(() => {
        result.current.addNotification({
          type: 'error',
          title: 'Alerta de Segurança',
          message: 'Tentativa de acesso não autorizado',
          category: 'security',
          priority: 'urgent',
          targetUserTypes: ['ADMIN'],
        });

        result.current.addNotification({
          type: 'info',
          title: 'Nova Promoção',
          message: 'Confira os produtos em oferta',
          category: 'promotion',
          priority: 'low',
          targetUserTypes: ['BUYER'],
        });
      });

      const adminNotifications = result.current.getNotificationsForUser('ADMIN');
      const buyerNotifications = result.current.getNotificationsForUser('BUYER');

      expect(adminNotifications).toHaveLength(1);
      expect(adminNotifications[0].title).toBe('Alerta de Segurança');
      expect(buyerNotifications).toHaveLength(1);
      expect(buyerNotifications[0].title).toBe('Nova Promoção');
    });

    it('deve mostrar notificações gerais para todos os usuários', () => {
      const { result } = renderHook(() => useNotificationStore());

      act(() => {
        result.current.addNotification({
          type: 'info',
          title: 'Manutenção Programada',
          message: 'Sistema ficará fora do ar',
          category: 'system',
          priority: 'medium',
          targetUserTypes: ['ADMIN', 'SELLER', 'BUYER'],
        });
      });

      const adminNotifications = result.current.getNotificationsForUser('ADMIN');
      const sellerNotifications = result.current.getNotificationsForUser('SELLER');
      const buyerNotifications = result.current.getNotificationsForUser('BUYER');

      expect(adminNotifications).toHaveLength(1);
      expect(sellerNotifications).toHaveLength(1);
      expect(buyerNotifications).toHaveLength(1);
    });
  });

  describe('Hooks Específicos por Role', () => {
    it('useAdminNotifications deve retornar apenas notificações de admin', () => {
      const { result: storeResult } = renderHook(() => useNotificationStore());
      const { result: adminResult } = renderHook(() => useAdminNotifications());

      act(() => {
        storeResult.current.addNotification({
          type: 'error',
          title: 'Falha de Segurança',
          message: 'Acesso negado detectado',
          category: 'security',
          priority: 'urgent',
          targetUserTypes: ['ADMIN'],
        });

        storeResult.current.addNotification({
          type: 'success',
          title: 'Nova Venda',
          message: 'Produto vendido',
          category: 'order',
          priority: 'medium',
          targetUserTypes: ['SELLER'],
        });
      });

      expect(adminResult.current.notifications).toHaveLength(1);
      expect(adminResult.current.notifications[0].title).toBe('Falha de Segurança');
      expect(adminResult.current.unreadCount).toBe(1);
      expect(adminResult.current.securityNotifications).toHaveLength(1);
    });

    it('useSellerNotifications deve retornar apenas notificações de seller', () => {
      const { result: storeResult } = renderHook(() => useNotificationStore());
      const { result: sellerResult } = renderHook(() => useSellerNotifications());

      act(() => {
        storeResult.current.addNotification({
          type: 'warning',
          title: 'Estoque Baixo',
          message: 'Produto com estoque baixo',
          category: 'inventory',
          priority: 'high',
          targetUserTypes: ['SELLER'],
        });

        storeResult.current.addNotification({
          type: 'success',
          title: 'Pagamento Aprovado',
          message: 'Pagamento recebido',
          category: 'payment',
          priority: 'medium',
          targetUserTypes: ['SELLER'],
        });
      });

      expect(sellerResult.current.notifications).toHaveLength(2);
      expect(sellerResult.current.unreadCount).toBe(2);
      expect(sellerResult.current.inventoryNotifications).toHaveLength(1);
      expect(sellerResult.current.paymentNotifications).toHaveLength(1);
    });

    it('useBuyerNotifications deve retornar apenas notificações de buyer', () => {
      const { result: storeResult } = renderHook(() => useNotificationStore());
      const { result: buyerResult } = renderHook(() => useBuyerNotifications());

      act(() => {
        storeResult.current.addNotification({
          type: 'success',
          title: 'Pedido Confirmado',
          message: 'Seu pedido foi confirmado',
          category: 'order',
          priority: 'medium',
          targetUserTypes: ['BUYER'],
        });

        storeResult.current.addNotification({
          type: 'info',
          title: 'Nova Promoção',
          message: 'Produtos em oferta',
          category: 'promotion',
          priority: 'low',
          targetUserTypes: ['BUYER'],
        });
      });

      expect(buyerResult.current.notifications).toHaveLength(2);
      expect(buyerResult.current.unreadCount).toBe(2);
      expect(buyerResult.current.orderNotifications).toHaveLength(1);
      expect(buyerResult.current.promotionNotifications).toHaveLength(1);
    });
  });

  describe('Filtragem por Categoria', () => {
    it('deve filtrar notificações por categoria', () => {
      const { result } = renderHook(() => useNotificationStore());

      act(() => {
        result.current.addNotification({
          type: 'error',
          title: 'Alerta de Segurança',
          message: 'Falha detectada',
          category: 'security',
          priority: 'urgent',
          targetUserTypes: ['ADMIN'],
        });

        result.current.addNotification({
          type: 'info',
          title: 'Novo Usuário',
          message: 'Usuário registrado',
          category: 'user',
          priority: 'low',
          targetUserTypes: ['ADMIN'],
        });
      });

      const securityNotifications = result.current.getNotificationsByCategory('security', 'ADMIN');
      const userNotifications = result.current.getNotificationsByCategory('user', 'ADMIN');

      expect(securityNotifications).toHaveLength(1);
      expect(userNotifications).toHaveLength(1);
      expect(securityNotifications[0].category).toBe('security');
      expect(userNotifications[0].category).toBe('user');
    });
  });

  describe('Filtragem por Prioridade', () => {
    it('deve filtrar notificações de alta prioridade', () => {
      const { result } = renderHook(() => useNotificationStore());

      act(() => {
        result.current.addNotification({
          type: 'error',
          title: 'Erro Crítico',
          message: 'Sistema com falha',
          category: 'system',
          priority: 'urgent',
          targetUserTypes: ['ADMIN'],
        });

        result.current.addNotification({
          type: 'warning',
          title: 'Aviso Importante',
          message: 'Atenção necessária',
          category: 'system',
          priority: 'high',
          targetUserTypes: ['ADMIN'],
        });

        result.current.addNotification({
          type: 'info',
          title: 'Informação',
          message: 'Update disponível',
          category: 'system',
          priority: 'low',
          targetUserTypes: ['ADMIN'],
        });
      });

      const highPriorityNotifications = result.current.getHighPriorityNotifications('ADMIN');

      expect(highPriorityNotifications).toHaveLength(2);
      expect(highPriorityNotifications.every(n => n.priority === 'urgent' || n.priority === 'high')).toBe(true);
    });
  });

  describe('Templates de Notificação', () => {
    it('deve criar notificação de pedido confirmado para buyer', () => {
      const notification = createNotification.orderConfirmed('12345');

      expect(notification).toEqual({
        type: 'success',
        title: 'Pedido Confirmado',
        message: 'Seu pedido #12345 foi confirmado e está sendo preparado.',
        category: 'order',
        priority: 'medium',
        targetUserTypes: ['BUYER'],
        actionUrl: '/buyer/orders',
        actionText: 'Ver Pedido',
      });
    });

    it('deve criar notificação de estoque baixo para seller', () => {
      const notification = createNotification.lowStock('iPhone 14', 2);

      expect(notification).toEqual({
        type: 'warning',
        title: 'Estoque Baixo',
        message: 'O produto "iPhone 14" está com apenas 2 unidades em estoque.',
        category: 'inventory',
        priority: 'high',
        targetUserTypes: ['SELLER'],
        actionUrl: '/seller/products',
        actionText: 'Gerenciar Estoque',
      });
    });

    it('deve criar notificação de estoque zerado com prioridade urgente', () => {
      const notification = createNotification.lowStock('iPhone 14', 0);

      expect(notification).toEqual({
        type: 'warning',
        title: 'Estoque Baixo',
        message: 'O produto "iPhone 14" está com apenas 0 unidades em estoque.',
        category: 'inventory',
        priority: 'urgent',
        targetUserTypes: ['SELLER'],
        actionUrl: '/seller/products',
        actionText: 'Gerenciar Estoque',
      });
    });

    it('deve criar notificação de alerta de segurança para admin', () => {
      const notification = createNotification.securityAlert('Múltiplas tentativas de login falharam', 'urgent');

      expect(notification).toEqual({
        type: 'error',
        title: 'Alerta de Segurança',
        message: 'Múltiplas tentativas de login falharam',
        category: 'security',
        priority: 'urgent',
        targetUserTypes: ['ADMIN'],
        actionUrl: '/admin/security',
        actionText: 'Investigar',
      });
    });

    it('deve criar notificação de nova venda para seller', () => {
      const notification = createNotification.newSale('iPhone 14', 2999.99, 'order-123');

      expect(notification).toEqual({
        type: 'success',
        title: 'Nova Venda Realizada',
        message: 'Você vendeu "iPhone 14" por R$ 2999.99.',
        category: 'order',
        priority: 'medium',
        targetUserTypes: ['SELLER'],
        actionUrl: '/seller/orders/order-123',
        actionText: 'Ver Pedido',
      });
    });

    it('deve criar notificação de promoção com expiração', () => {
      const notification = createNotification.promotion(
        'Black Friday',
        'Descontos de até 70% em eletrônicos',
        'electronics'
      );

      expect(notification.type).toBe('info');
      expect(notification.title).toBe('Black Friday');
      expect(notification.message).toBe('Descontos de até 70% em eletrônicos');
      expect(notification.category).toBe('promotion');
      expect(notification.priority).toBe('low');
      expect(notification.targetUserTypes).toEqual(['BUYER']);
      expect(notification.actionUrl).toBe('/products?category=electronics');
      expect(notification.expiresAt).toBeDefined();
    });
  });

  describe('Gerenciamento de Leitura', () => {
    it('deve marcar todas as notificações de um tipo de usuário como lidas', () => {
      const { result } = renderHook(() => useNotificationStore());

      act(() => {
        result.current.addNotification({
          type: 'info',
          title: 'Notificação 1',
          message: 'Mensagem 1',
          category: 'system',
          priority: 'low',
          targetUserTypes: ['ADMIN'],
        });

        result.current.addNotification({
          type: 'info',
          title: 'Notificação 2',
          message: 'Mensagem 2',
          category: 'system',
          priority: 'low',
          targetUserTypes: ['SELLER'],
        });
      });

      expect(result.current.getUnreadCountForUser('ADMIN')).toBe(1);
      expect(result.current.getUnreadCountForUser('SELLER')).toBe(1);

      act(() => {
        result.current.markAllAsRead('ADMIN');
      });

      expect(result.current.getUnreadCountForUser('ADMIN')).toBe(0);
      expect(result.current.getUnreadCountForUser('SELLER')).toBe(1);
    });

    it('deve limpar todas as notificações de um tipo de usuário', () => {
      const { result } = renderHook(() => useNotificationStore());

      act(() => {
        result.current.addNotification({
          type: 'info',
          title: 'Notificação Admin',
          message: 'Mensagem Admin',
          category: 'system',
          priority: 'low',
          targetUserTypes: ['ADMIN'],
        });

        result.current.addNotification({
          type: 'info',
          title: 'Notificação Seller',
          message: 'Mensagem Seller',
          category: 'system',
          priority: 'low',
          targetUserTypes: ['SELLER'],
        });
      });

      expect(result.current.getNotificationsForUser('ADMIN')).toHaveLength(1);
      expect(result.current.getNotificationsForUser('SELLER')).toHaveLength(1);

      act(() => {
        result.current.clearAll('ADMIN');
      });

      expect(result.current.getNotificationsForUser('ADMIN')).toHaveLength(0);
      expect(result.current.getNotificationsForUser('SELLER')).toHaveLength(1);
    });
  });

  describe('Preferências de Notificação', () => {
    it('deve ter preferências padrão diferentes por tipo de usuário', () => {
      const { result } = renderHook(() => useNotificationStore());

      const adminPrefs = result.current.preferences.ADMIN;
      const sellerPrefs = result.current.preferences.SELLER;
      const buyerPrefs = result.current.preferences.BUYER;

      expect(adminPrefs.enabledCategories).toContain('security');
      expect(adminPrefs.enabledCategories).toContain('system');
      expect(adminPrefs.enabledCategories).toContain('user');

      expect(sellerPrefs.enabledCategories).toContain('order');
      expect(sellerPrefs.enabledCategories).toContain('inventory');
      expect(sellerPrefs.enabledCategories).toContain('payment');
      expect(sellerPrefs.quietHours).toBeDefined();

      expect(buyerPrefs.enabledCategories).toContain('order');
      expect(buyerPrefs.enabledCategories).toContain('promotion');
      expect(buyerPrefs.enableEmail).toBe(false);
    });

    it('deve atualizar preferências de usuário', () => {
      const { result } = renderHook(() => useNotificationStore());

      act(() => {
        result.current.updatePreferences('BUYER', {
          enableToasts: false,
          enableEmail: true,
        });
      });

      const buyerPrefs = result.current.preferences.BUYER;
      expect(buyerPrefs.enableToasts).toBe(false);
      expect(buyerPrefs.enableEmail).toBe(true);
    });
  });

  describe('Expiração de Notificações', () => {
    it('não deve adicionar notificações expiradas', () => {
      const { result } = renderHook(() => useNotificationStore());

      const expiredDate = new Date(Date.now() - 1000); // 1 segundo atrás

      act(() => {
        result.current.addNotification({
          type: 'info',
          title: 'Notificação Expirada',
          message: 'Esta notificação já expirou',
          category: 'system',
          priority: 'low',
          targetUserTypes: ['BUYER'],
          expiresAt: expiredDate,
        });
      });

      expect(result.current.getNotificationsForUser('BUYER')).toHaveLength(0);
    });
  });

  describe('Integração com Toast', () => {
    it('deve mostrar toast baseado na prioridade', () => {
      const { toast } = require('sonner');
      const { result } = renderHook(() => useNotificationStore());

      // Notificação urgente
      act(() => {
        result.current.showToast({
          type: 'error',
          title: 'Erro Crítico',
          message: 'Sistema com falha',
          category: 'system',
          priority: 'urgent',
          targetUserTypes: ['ADMIN'],
        });
      });

      expect(toast.error).toHaveBeenCalledWith('Erro Crítico', {
        description: 'Sistema com falha',
        duration: 10000, // 8000 + 2000 para erro
      });

      // Notificação de baixa prioridade
      act(() => {
        result.current.showToast({
          type: 'info',
          title: 'Informação',
          message: 'Update disponível',
          category: 'system',
          priority: 'low',
          targetUserTypes: ['BUYER'],
        });
      });

      expect(toast.info).toHaveBeenCalledWith('Informação', {
        description: 'Update disponível',
        duration: 3000,
      });
    });
  });
});