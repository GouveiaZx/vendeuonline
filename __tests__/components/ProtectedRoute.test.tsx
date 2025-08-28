/**
 * TESTES DOS COMPONENTES DE PROTEÇÃO DE ROTAS
 * 
 * Testa os componentes de proteção baseados em roles:
 * - ProtectedRoute genérico
 * - AdminOnly, SellerOnly, BuyerOnly
 * - AuthenticatedOnly
 * - RoleBasedRedirect
 */

import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import { describe, it, expect, beforeEach, afterEach } from '@jest/globals';
import '@testing-library/jest-dom';
import ProtectedRoute, { AdminOnly, SellerOnly, BuyerOnly, AuthenticatedOnly } from '../../src/components/auth/ProtectedRoute';
import RoleBasedRedirect from '../../src/components/auth/RoleBasedRedirect';
import { useAuthStore } from '../../src/store/authStore';
import { UserType } from '../../src/types';

// Mock do useRouter
const mockPush = jest.fn();
const mockReplace = jest.fn();
const mockBack = jest.fn();

jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: mockPush,
    replace: mockReplace,
    back: mockBack,
  }),
  usePathname: () => '/test-path',
}));

// Mock do authStore
jest.mock('../../src/store/authStore', () => ({
  useAuthStore: jest.fn(),
}));

const mockUseAuthStore = useAuthStore as jest.MockedFunction<typeof useAuthStore>;

// Componente de teste
const TestComponent = () => <div data-testid="protected-content">Conteúdo Protegido</div>;

describe('Componentes de Proteção de Rotas', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('ProtectedRoute', () => {
    it('deve mostrar loading enquanto carrega', async () => {
      mockUseAuthStore.mockReturnValue({
        useRouteAccess: () => ({
          hasAccess: false,
          isAuthenticated: false,
          userType: null,
          isLoading: true,
        }),
      } as any);

      render(
        <ProtectedRoute requiredRole="ADMIN">
          <TestComponent />
        </ProtectedRoute>
      );

      expect(screen.getByText('Verificando permissões...')).toBeTruthy();
    });

    it('deve redirecionar para login se não autenticado', async () => {
      mockUseAuthStore.mockReturnValue({
        useRouteAccess: () => ({
          hasAccess: false,
          isAuthenticated: false,
          userType: null,
          isLoading: false,
        }),
      } as any);

      render(
        <ProtectedRoute requiredRole="ADMIN">
          <TestComponent />
        </ProtectedRoute>
      );

      await waitFor(async () => {
        expect(mockReplace).toHaveBeenCalledWith('/auth/login');
      });
    });

    it('deve redirecionar para fallbackPath se acesso negado', async () => {
      mockUseAuthStore.mockReturnValue({
        useRouteAccess: () => ({
          hasAccess: false,
          isAuthenticated: true,
          userType: 'BUYER' as UserType,
          isLoading: false,
        }),
      } as any);

      render(
        <ProtectedRoute requiredRole="ADMIN" fallbackPath="/buyer">
          <TestComponent />
        </ProtectedRoute>
      );

      await waitFor(async () => {
        expect(mockReplace).toHaveBeenCalledWith('/buyer');
      });
    });

    it('deve mostrar página de acesso negado se showAccessDenied=true', async () => {
      mockUseAuthStore.mockReturnValue({
        useRouteAccess: () => ({
          hasAccess: false,
          isAuthenticated: true,
          userType: 'BUYER' as UserType,
          isLoading: false,
        }),
      } as any);

      render(
        <ProtectedRoute requiredRole="ADMIN" showAccessDenied={true}>
          <TestComponent />
        </ProtectedRoute>
      );

      expect(screen.getByText('Acesso Negado')).toBeTruthy();
      expect(screen.getByText(/Esta página é restrita para usuários do tipo/)).toBeTruthy();
      expect(screen.getByText('Administrador')).toBeTruthy();
    });

    it('deve mostrar conteúdo se acesso permitido', async () => {
      mockUseAuthStore.mockReturnValue({
        useRouteAccess: () => ({
          hasAccess: true,
          isAuthenticated: true,
          userType: 'ADMIN' as UserType,
          isLoading: false,
        }),
      } as any);

      render(
        <ProtectedRoute requiredRole="ADMIN">
          <TestComponent />
        </ProtectedRoute>
      );

      expect(screen.getByTestId('protected-content')).toBeTruthy();
    });

    it('deve aceitar múltiplos roles', async () => {
      mockUseAuthStore.mockReturnValue({
        useRouteAccess: () => ({
          hasAccess: true,
          isAuthenticated: true,
          userType: 'SELLER' as UserType,
          isLoading: false,
        }),
      } as any);

      render(
        <ProtectedRoute requiredRole={['ADMIN', 'SELLER']}>
          <TestComponent />
        </ProtectedRoute>
      );

      expect(screen.getByTestId('protected-content')).toBeTruthy();
    });

    it('deve mostrar permissões necessárias quando definidas', async () => {
      mockUseAuthStore.mockReturnValue({
        useRouteAccess: () => ({
          hasAccess: false,
          isAuthenticated: true,
          userType: 'BUYER' as UserType,
          isLoading: false,
        }),
      } as any);

      render(
        <ProtectedRoute 
          requiredRole="ADMIN" 
          requiredPermissions={['MANAGE_USERS', 'VIEW_ANALYTICS']}
          showAccessDenied={true}
        >
          <TestComponent />
        </ProtectedRoute>
      );

      expect(screen.getByText('Permissões Necessárias:')).toBeTruthy();
      expect(screen.getByText('• MANAGE_USERS')).toBeTruthy();
      expect(screen.getByText('• VIEW_ANALYTICS')).toBeTruthy();
    });
  });

  describe('AdminOnly', () => {
    it('deve permitir acesso apenas para ADMIN', async () => {
      mockUseAuthStore.mockReturnValue({
        useRouteAccess: () => ({
          hasAccess: true,
          isAuthenticated: true,
          userType: 'ADMIN' as UserType,
          isLoading: false,
        }),
      } as any);

      render(
        <AdminOnly>
          <TestComponent />
        </AdminOnly>
      );

      expect(screen.getByTestId('protected-content')).toBeTruthy();
    });

    it('deve negar acesso para não-admin', async () => {
      mockUseAuthStore.mockReturnValue({
        useRouteAccess: () => ({
          hasAccess: false,
          isAuthenticated: true,
          userType: 'SELLER' as UserType,
          isLoading: false,
        }),
      } as any);

      render(
        <AdminOnly fallbackPath="/seller">
          <TestComponent />
        </AdminOnly>
      );

      await waitFor(async () => {
        expect(mockReplace).toHaveBeenCalledWith('/seller');
      });
    });
  });

  describe('SellerOnly', () => {
    it('deve permitir acesso apenas para SELLER', async () => {
      mockUseAuthStore.mockReturnValue({
        useRouteAccess: () => ({
          hasAccess: true,
          isAuthenticated: true,
          userType: 'SELLER' as UserType,
          isLoading: false,
        }),
      } as any);

      render(
        <SellerOnly>
          <TestComponent />
        </SellerOnly>
      );

      expect(screen.getByTestId('protected-content')).toBeTruthy();
    });

    it('deve negar acesso para não-seller', async () => {
      mockUseAuthStore.mockReturnValue({
        useRouteAccess: () => ({
          hasAccess: false,
          isAuthenticated: true,
          userType: 'BUYER' as UserType,
          isLoading: false,
        }),
      } as any);

      render(
        <SellerOnly fallbackPath="/buyer">
          <TestComponent />
        </SellerOnly>
      );

      await waitFor(async () => {
        expect(mockReplace).toHaveBeenCalledWith('/buyer');
      });
    });
  });

  describe('BuyerOnly', () => {
    it('deve permitir acesso apenas para BUYER', async () => {
      mockUseAuthStore.mockReturnValue({
        useRouteAccess: () => ({
          hasAccess: true,
          isAuthenticated: true,
          userType: 'BUYER' as UserType,
          isLoading: false,
        }),
      } as any);

      render(
        <BuyerOnly>
          <TestComponent />
        </BuyerOnly>
      );

      expect(screen.getByTestId('protected-content')).toBeTruthy();
    });

    it('deve negar acesso para não-buyer', async () => {
      mockUseAuthStore.mockReturnValue({
        useRouteAccess: () => ({
          hasAccess: false,
          isAuthenticated: true,
          userType: 'ADMIN' as UserType,
          isLoading: false,
        }),
      } as any);

      render(
        <BuyerOnly fallbackPath="/admin">
          <TestComponent />
        </BuyerOnly>
      );

      await waitFor(async () => {
        expect(mockReplace).toHaveBeenCalledWith('/admin');
      });
    });
  });

  describe('AuthenticatedOnly', () => {
    it('deve permitir acesso para qualquer usuário autenticado', async () => {
      mockUseAuthStore.mockReturnValue({
        useRouteAccess: () => ({
          hasAccess: true,
          isAuthenticated: true,
          userType: 'BUYER' as UserType,
          isLoading: false,
        }),
      } as any);

      render(
        <AuthenticatedOnly>
          <TestComponent />
        </AuthenticatedOnly>
      );

      expect(screen.getByTestId('protected-content')).toBeTruthy();
    });

    it('deve negar acesso para usuários não autenticados', async () => {
      mockUseAuthStore.mockReturnValue({
        useRouteAccess: () => ({
          hasAccess: false,
          isAuthenticated: false,
          userType: null,
          isLoading: false,
        }),
      } as any);

      render(
        <AuthenticatedOnly>
          <TestComponent />
        </AuthenticatedOnly>
      );

      await waitFor(async () => {
        expect(mockReplace).toHaveBeenCalledWith('/auth/login');
      });
    });
  });

  describe('RoleBasedRedirect', () => {
    it('deve mostrar loading durante inicialização', async () => {
      mockUseAuthStore.mockReturnValue({
        useAuthInit: () => ({
          isAuthenticated: false,
          isInitialized: false,
        }),
        useRoleBasedRedirect: () => ({
          shouldRedirect: jest.fn(),
          getDefaultPath: jest.fn(),
          userType: null,
        }),
      } as any);

      render(
        <RoleBasedRedirect>
          <TestComponent />
        </RoleBasedRedirect>
      );

      expect(screen.getByText('Carregando...')).toBeTruthy();
    });

    it('deve redirecionar usuário não autenticado tentando acessar rota protegida', async () => {
      mockUseAuthStore.mockReturnValue({
        useAuthInit: () => ({
          isAuthenticated: false,
          isInitialized: true,
        }),
        useRoleBasedRedirect: () => ({
          shouldRedirect: jest.fn(),
          getDefaultPath: jest.fn(),
          userType: null,
        }),
      } as any);

      // Mock usePathname para retornar rota protegida
      const mockUsePathname = require('next/navigation').usePathname;
      mockUsePathname.mockReturnValue('/admin/users');

      render(
        <RoleBasedRedirect>
          <TestComponent />
        </RoleBasedRedirect>
      );

      await waitFor(async () => {
        expect(mockReplace).toHaveBeenCalledWith('/auth/login');
      });
    });

    it('deve redirecionar usuário autenticado para rota incorreta', async () => {
      const mockShouldRedirect = jest.fn().mockReturnValue('/seller');

      mockUseAuthStore.mockReturnValue({
        useAuthInit: () => ({
          isAuthenticated: true,
          isInitialized: true,
        }),
        useRoleBasedRedirect: () => ({
          shouldRedirect: mockShouldRedirect,
          getDefaultPath: jest.fn(),
          userType: 'SELLER',
        }),
      } as any);

      // Mock usePathname para retornar rota de admin
      const mockUsePathname = require('next/navigation').usePathname;
      mockUsePathname.mockReturnValue('/admin/users');

      render(
        <RoleBasedRedirect>
          <TestComponent />
        </RoleBasedRedirect>
      );

      await waitFor(async () => {
        expect(mockShouldRedirect).toHaveBeenCalledWith('/admin/users');
        expect(mockReplace).toHaveBeenCalledWith('/seller');
      });
    });

    it('deve mostrar conteúdo se rota estiver correta', async () => {
      mockUseAuthStore.mockReturnValue({
        useAuthInit: () => ({
          isAuthenticated: true,
          isInitialized: true,
        }),
        useRoleBasedRedirect: () => ({
          shouldRedirect: jest.fn().mockReturnValue(null),
          getDefaultPath: jest.fn(),
          userType: 'ADMIN',
        }),
      } as any);

      render(
        <RoleBasedRedirect>
          <TestComponent />
        </RoleBasedRedirect>
      );

      expect(screen.getByTestId('protected-content')).toBeTruthy();
    });
  });

  describe('Interações com botões de acesso negado', () => {
    it('deve navegar para trás ao clicar em "Voltar"', async () => {
      mockUseAuthStore.mockReturnValue({
        useRouteAccess: () => ({
          hasAccess: false,
          isAuthenticated: true,
          userType: 'BUYER' as UserType,
          isLoading: false,
        }),
      } as any);

      render(
        <ProtectedRoute requiredRole="ADMIN" showAccessDenied={true}>
          <TestComponent />
        </ProtectedRoute>
      );

      const voltarButton = screen.getByText('Voltar');
      voltarButton.click();

      await waitFor(async () => {
        expect(mockBack).toHaveBeenCalled();
      });
    });

    it('deve navegar para início ao clicar em "Ir para Início"', async () => {
      mockUseAuthStore.mockReturnValue({
        useRouteAccess: () => ({
          hasAccess: false,
          isAuthenticated: true,
          userType: 'BUYER' as UserType,
          isLoading: false,
        }),
      } as any);

      render(
        <ProtectedRoute requiredRole="ADMIN" showAccessDenied={true}>
          <TestComponent />
        </ProtectedRoute>
      );

      const inicioButton = screen.getByText('Ir para Início');
      inicioButton.click();

      await waitFor(async () => {
        expect(mockPush).toHaveBeenCalledWith('/');
      });
    });

    it('deve navegar para login na página de acesso restrito', async () => {
      mockUseAuthStore.mockReturnValue({
        useRouteAccess: () => ({
          hasAccess: false,
          isAuthenticated: false,
          userType: null,
          isLoading: false,
        }),
      } as any);

      render(
        <ProtectedRoute requiredRole="ADMIN">
          <TestComponent />
        </ProtectedRoute>
      );

      const loginButton = screen.getByText('Fazer Login');
      loginButton.click();

      await waitFor(async () => {
        expect(mockPush).toHaveBeenCalledWith('/auth/login');
      });
    });
  });

  describe('Cenários de borda', () => {
    it('deve lidar com userType undefined', async () => {
      mockUseAuthStore.mockReturnValue({
        useRouteAccess: () => ({
          hasAccess: false,
          isAuthenticated: true,
          userType: undefined,
          isLoading: false,
        }),
      } as any);

      render(
        <ProtectedRoute requiredRole="ADMIN" showAccessDenied={true}>
          <TestComponent />
        </ProtectedRoute>
      );

      expect(screen.getByText('Acesso Negado')).toBeTruthy();
      expect(screen.getByText('Indefinido')).toBeTruthy();
    });

    it('deve mostrar múltiplos roles na mensagem de erro', async () => {
      mockUseAuthStore.mockReturnValue({
        useRouteAccess: () => ({
          hasAccess: false,
          isAuthenticated: true,
          userType: 'BUYER' as UserType,
          isLoading: false,
        }),
      } as any);

      render(
        <ProtectedRoute requiredRole={['ADMIN', 'SELLER']} showAccessDenied={true}>
          <TestComponent />
        </ProtectedRoute>
      );

      expect(screen.getByText('Administrador ou Vendedor')).toBeTruthy();
    });
  });
});