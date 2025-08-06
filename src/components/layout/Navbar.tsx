'use client';

import { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { 
  Menu, 
  X, 
  User, 
  ShoppingCart, 
  Store, 
  Settings, 
  LogOut,
  Search,
  Bell,
  Heart,
  Package,
  BarChart3,
  Users,
  Shield
} from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useNotificationStore } from '@/store/notificationStore';
import Logo from '@/components/ui/Logo';
import NotificationCenter from '@/components/notifications/NotificationCenter';

const Navbar = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isNotificationOpen, setIsNotificationOpen] = useState(false);
  const { user, isAuthenticated, logout } = useAuth();
  const { unreadCount, fetchNotifications } = useNotificationStore();
  const location = useLocation();
  const pathname = location.pathname;

  // Links de navegação baseados no tipo de usuário
  const getNavigationLinks = () => {
    if (!isAuthenticated || !user) {
      return [
        { to: '/', label: 'Início', icon: null },
        { to: '/products', label: 'Produtos', icon: null },
        { to: '/stores', label: 'Lojas', icon: null },
        { to: '/pricing', label: 'Planos', icon: null },
        { to: '/about', label: 'Sobre', icon: null }
      ];
    }

    switch (user.userType) {
      case 'admin':
        return [
          { to: '/admin', label: 'Dashboard', icon: BarChart3 },
          { to: '/admin/users', label: 'Usuários', icon: Users },
          { to: '/admin/stores', label: 'Lojas', icon: Store },
          { to: '/admin/products', label: 'Produtos', icon: Package },
          { to: '/admin/settings', label: 'Configurações', icon: Settings }
        ];
      
      case 'seller':
        return [
          { to: '/seller', label: 'Dashboard', icon: BarChart3 },
          { to: '/seller/products', label: 'Produtos', icon: Package },
          { to: '/seller/orders', label: 'Pedidos', icon: ShoppingCart },
          { to: '/seller/store', label: 'Minha Loja', icon: Store },
          { to: '/seller/analytics', label: 'Analytics', icon: BarChart3 }
        ];
      
      case 'buyer':
      default:
        return [
          { to: '/', label: 'Início', icon: null },
          { to: '/products', label: 'Produtos', icon: null },
          { to: '/stores', label: 'Lojas', icon: null },
          { to: '/pricing', label: 'Planos', icon: null },
          { to: '/favorites', label: 'Favoritos', icon: Heart },
          { to: '/orders', label: 'Pedidos', icon: Package }
        ];
    }
  };

  const navigationLinks = getNavigationLinks();

  const getUserTypeIcon = () => {
    switch (user?.userType) {
      case 'admin':
        return Shield;
      case 'seller':
        return Store;
      case 'buyer':
      default:
        return User;
    }
  };

  const getUserTypeLabel = () => {
    switch (user?.userType) {
      case 'admin':
        return 'Administrador';
      case 'seller':
        return 'Vendedor';
      case 'buyer':
        return 'Comprador';
      default:
        return 'Usuário';
    }
  };

  useEffect(() => {
    if (isAuthenticated) {
      fetchNotifications();
    }
  }, [isAuthenticated, fetchNotifications]);

  const handleLogout = () => {
    logout();
    setIsProfileOpen(false);
    setIsMenuOpen(false);
    setIsNotificationOpen(false);
  };

  return (
    <nav className="bg-white border-b border-gray-200 sticky top-0 z-50 shadow-sm">
      <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <div className="flex items-center flex-shrink-0">
            <Link to="/" className="flex items-center space-x-2 group">
              <Logo size="sm" showText={true} className="group-hover:scale-105 transition-transform duration-200" />
            </Link>
          </div>

          {/* Desktop Navigation */}
          <div className="hidden xl:flex items-center space-x-1">
            {navigationLinks.map((link) => {
              const Icon = link.icon;
              const isActive = pathname === link.to;
              
              return (
                <Link
                  key={link.to}
                  to={link.to}
                  className={`flex items-center space-x-1 px-2 py-1.5 rounded-md text-sm font-medium transition-colors ${
                    isActive
                      ? 'text-blue-600 bg-blue-50'
                      : 'text-gray-700 hover:text-blue-600 hover:bg-gray-50'
                  }`}
                >
                  {Icon && <Icon className="h-4 w-4" />}
                  <span>{link.label}</span>
                </Link>
              );
            })}
          </div>

          {/* Central Search Bar */}
          <div className="hidden lg:flex flex-1 max-w-md mx-3">
            {(!isAuthenticated || user?.userType === 'buyer') && (
              <div className="relative group w-full">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4 group-focus-within:text-blue-500 transition-colors duration-200" />
                <input
                  type="text"
                  placeholder="Buscar produtos..."
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:ring-1 focus:ring-blue-500 focus:border-blue-500 text-sm text-gray-900 placeholder-gray-500 bg-white transition-all duration-200"
                />
              </div>
            )}
          </div>

          {/* Right side */}
          <div className="flex items-center space-x-2">
            {/* Notifications (apenas para usuários autenticados) */}
            {isAuthenticated && (
              <div className="relative">
                <button 
                  onClick={() => setIsNotificationOpen(!isNotificationOpen)}
                  className="relative p-2 text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all duration-200 group"
                >
                  <Bell className="h-5 w-5" />
                  {unreadCount > 0 && (
                    <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-4 w-4 flex items-center justify-center font-medium">
                      {unreadCount > 99 ? '99+' : unreadCount}
                    </span>
                  )}
                </button>
                
                <NotificationCenter 
                  isOpen={isNotificationOpen}
                  onClose={() => setIsNotificationOpen(false)}
                />
              </div>
            )}

            {/* Cart (apenas para compradores) */}
            {(!isAuthenticated || user?.userType === 'buyer') && (
              <Link
                to="/cart"
                className="relative p-2 text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all duration-200 group"
              >
                <ShoppingCart className="h-5 w-5" />
                <span className="absolute -top-1 -right-1 bg-blue-600 text-white text-xs rounded-full h-4 w-4 flex items-center justify-center font-medium">
                  0
                </span>
              </Link>
            )}

            {/* User Menu */}
            {isAuthenticated && user ? (
              <div className="relative">
                <button
                  onClick={() => setIsProfileOpen(!isProfileOpen)}
                  className="flex items-center space-x-2 p-2 rounded-lg hover:bg-gray-100 transition-all duration-200 group"
                >
                  <div className="h-7 w-7 bg-gradient-to-br from-blue-600 to-blue-700 rounded-full flex items-center justify-center">
                    <User className="h-4 w-4 text-white" />
                  </div>
                  <span className="hidden lg:block text-sm font-medium text-gray-700 group-hover:text-blue-600 transition-colors duration-200 max-w-24 truncate">
                    {user.name}
                  </span>
                </button>

                {/* Dropdown Menu */}
                {isProfileOpen && (
                  <div className="absolute right-0 mt-3 w-64 bg-white rounded-xl shadow-xl border border-gray-200 py-2 z-50 backdrop-blur-sm">
                    <div className="px-4 py-3 border-b border-gray-100">
                      <p className="text-sm font-semibold text-gray-900">{user.name}</p>
                      <p className="text-xs text-gray-500 mt-1">{user.email}</p>
                      <p className="text-xs text-blue-600 font-medium mt-1">{getUserTypeLabel()}</p>
                    </div>
                    
                    <Link
                      to={user.userType === 'admin' ? '/admin/profile' : user.userType === 'seller' ? '/seller/profile' : '/profile'}
                      className="flex items-center space-x-3 px-4 py-3 text-sm text-gray-700 hover:bg-blue-50 hover:text-blue-600 transition-all duration-200 font-medium"
                      onClick={() => setIsProfileOpen(false)}
                    >
                      <User className="h-4 w-4" />
                      <span>Meu Perfil</span>
                    </Link>
                    
                    <Link
                      to={user.userType === 'admin' ? '/admin/settings' : user.userType === 'seller' ? '/seller/settings' : '/settings'}
                      className="flex items-center space-x-3 px-4 py-3 text-sm text-gray-700 hover:bg-blue-50 hover:text-blue-600 transition-all duration-200 font-medium"
                      onClick={() => setIsProfileOpen(false)}
                    >
                      <Settings className="h-4 w-4" />
                      <span>Configurações</span>
                    </Link>
                    
                    <hr className="my-2 border-gray-100" />
                    <button
                      onClick={handleLogout}
                      className="flex items-center space-x-3 px-4 py-3 text-sm text-red-600 hover:bg-red-50 w-full text-left transition-all duration-200 font-medium"
                    >
                      <LogOut className="h-4 w-4" />
                      <span>Sair</span>
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <div className="hidden md:flex items-center space-x-2">
                <Link
                  to="/auth/login"
                  className="text-gray-700 hover:text-blue-600 px-3 py-2 rounded-lg text-sm font-medium transition-colors duration-200"
                >
                  Entrar
                </Link>
                <Link
                  to="/auth/register"
                  className="bg-blue-600 text-white hover:bg-blue-700 px-4 py-2 rounded-lg text-sm font-medium transition-colors duration-200"
                >
                  Cadastrar
                </Link>
              </div>
            )}

            {/* Mobile menu button */}
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="xl:hidden p-2 rounded-md text-gray-600 hover:text-gray-900 hover:bg-gray-100 transition-colors duration-200"
            >
              {isMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Search Bar */}
      <div className="lg:hidden px-4 py-3 bg-gray-50 border-t border-gray-200">
        {(!isAuthenticated || user?.userType === 'buyer') && (
          <div className="relative group">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4 group-focus-within:text-blue-500 transition-colors duration-200" />
            <input
              type="text"
              placeholder="Buscar produtos..."
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:ring-1 focus:ring-blue-500 focus:border-blue-500 text-sm text-gray-900 placeholder-gray-500 bg-white transition-all duration-200"
            />
          </div>
        )}
      </div>

      {/* Mobile menu */}
      {isMenuOpen && (
        <div className="xl:hidden border-t border-gray-200 bg-white">
          <div className="px-4 pt-2 pb-3 space-y-1">
            {navigationLinks.map((link) => {
              const Icon = link.icon;
              const isActive = pathname === link.to;
              
              return (
                <Link
                  key={link.to}
                  to={link.to}
                  className={`flex items-center space-x-3 px-3 py-3 rounded-lg text-sm font-medium transition-colors duration-200 ${
                    isActive
                      ? 'text-blue-600 bg-blue-50'
                      : 'text-gray-700 hover:text-blue-600 hover:bg-gray-50'
                  }`}
                  onClick={() => setIsMenuOpen(false)}
                >
                  {Icon && <Icon className="h-5 w-5" />}
                  <span>{link.label}</span>
                </Link>
              );
            })}
            
            {!isAuthenticated && (
              <div className="pt-4 border-t border-gray-200 space-y-2">
                <Link
                  to="/auth/login"
                  className="block px-3 py-2 rounded-md text-base font-medium text-gray-700 hover:text-blue-600 hover:bg-gray-50"
                  onClick={() => setIsMenuOpen(false)}
                >
                  Entrar
                </Link>
                <Link
                  to="/auth/register"
                  className="block px-3 py-2 rounded-md text-base font-medium bg-blue-600 text-white hover:bg-blue-700 text-center"
                  onClick={() => setIsMenuOpen(false)}
                >
                  Cadastrar
                </Link>
              </div>
            )}
          </div>
        </div>
      )}
    </nav>
  );
};

export default Navbar;