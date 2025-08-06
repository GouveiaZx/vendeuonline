'use client';

import { useState, useEffect } from 'react';
import { Bell, X, Check, CheckCheck, Trash2, ExternalLink, Clock, AlertCircle, CheckCircle, Info, AlertTriangle } from 'lucide-react';
import { useNotificationStore, Notification } from '@/store/notificationStore';
import { Link } from 'react-router-dom';

interface NotificationCenterProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function NotificationCenter({ isOpen, onClose }: NotificationCenterProps) {
  const {
    notifications,
    unreadCount,
    isLoading,
    markAsRead,
    markAllAsRead,
    removeNotification,
    clearAll,
    fetchNotifications,
  } = useNotificationStore();

  useEffect(() => {
    if (isOpen && notifications.length === 0) {
      fetchNotifications();
    }
  }, [isOpen, notifications.length, fetchNotifications]);

  const getNotificationIcon = (type: Notification['type']) => {
    switch (type) {
      case 'success':
        return <CheckCircle className="h-5 w-5 text-green-500" />;
      case 'error':
        return <AlertCircle className="h-5 w-5 text-red-500" />;
      case 'warning':
        return <AlertTriangle className="h-5 w-5 text-yellow-500" />;
      case 'info':
      default:
        return <Info className="h-5 w-5 text-blue-500" />;
    }
  };

  const formatTimestamp = (timestamp: Date) => {
    const now = new Date();
    const diff = now.getTime() - timestamp.getTime();
    const minutes = Math.floor(diff / (1000 * 60));
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));

    if (minutes < 1) return 'Agora';
    if (minutes < 60) return `${minutes}m atrás`;
    if (hours < 24) return `${hours}h atrás`;
    if (days < 7) return `${days}d atrás`;
    return timestamp.toLocaleDateString('pt-BR');
  };

  const handleNotificationClick = (notification: Notification) => {
    if (!notification.read) {
      markAsRead(notification.id);
    }
    if (notification.actionUrl) {
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <>
      {/* Overlay */}
      <div 
        className="fixed inset-0 bg-black bg-opacity-25 z-40"
        onClick={onClose}
      />
      
      {/* Notification Panel */}
      <div className="fixed top-16 right-4 w-96 bg-white rounded-xl shadow-2xl border border-gray-200 z-50 max-h-[80vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200">
          <div className="flex items-center space-x-2">
            <Bell className="h-5 w-5 text-gray-600" />
            <h3 className="font-semibold text-gray-900">Notificações</h3>
            {unreadCount > 0 && (
              <span className="bg-red-500 text-white text-xs rounded-full px-2 py-1 font-medium">
                {unreadCount}
              </span>
            )}
          </div>
          
          <div className="flex items-center space-x-2">
            {unreadCount > 0 && (
              <button
                onClick={markAllAsRead}
                className="text-blue-600 hover:text-blue-700 text-sm font-medium flex items-center space-x-1"
                title="Marcar todas como lidas"
              >
                <CheckCheck className="h-4 w-4" />
                <span>Marcar todas</span>
              </button>
            )}
            
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 p-1"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto">
          {isLoading ? (
            <div className="flex items-center justify-center p-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
          ) : notifications.length === 0 ? (
            <div className="flex flex-col items-center justify-center p-8 text-center">
              <Bell className="h-12 w-12 text-gray-300 mb-4" />
              <h4 className="font-medium text-gray-900 mb-2">Nenhuma notificação</h4>
              <p className="text-gray-500 text-sm">Você está em dia! Não há notificações pendentes.</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-100">
              {notifications.map((notification) => (
                <div
                  key={notification.id}
                  className={`p-4 hover:bg-gray-50 transition-colors ${
                    !notification.read ? 'bg-blue-50 border-l-4 border-l-blue-500' : ''
                  }`}
                >
                  <div className="flex items-start space-x-3">
                    <div className="flex-shrink-0 mt-1">
                      {getNotificationIcon(notification.type)}
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <h4 className={`text-sm font-medium ${
                            !notification.read ? 'text-gray-900' : 'text-gray-700'
                          }`}>
                            {notification.title}
                          </h4>
                          <p className="text-sm text-gray-600 mt-1 line-clamp-2">
                            {notification.message}
                          </p>
                          
                          <div className="flex items-center justify-between mt-2">
                            <div className="flex items-center space-x-1 text-xs text-gray-500">
                              <Clock className="h-3 w-3" />
                              <span>{formatTimestamp(notification.timestamp)}</span>
                            </div>
                            
                            {notification.actionUrl && (
                              <Link
                                to={notification.actionUrl}
                                onClick={() => handleNotificationClick(notification)}
                                className="text-blue-600 hover:text-blue-700 text-xs font-medium flex items-center space-x-1"
                              >
                                <span>{notification.actionText || 'Ver mais'}</span>
                                <ExternalLink className="h-3 w-3" />
                              </Link>
                            )}
                          </div>
                        </div>
                        
                        <div className="flex items-center space-x-1 ml-2">
                          {!notification.read && (
                            <button
                              onClick={() => markAsRead(notification.id)}
                              className="text-blue-600 hover:text-blue-700 p-1"
                              title="Marcar como lida"
                            >
                              <Check className="h-3 w-3" />
                            </button>
                          )}
                          
                          <button
                            onClick={() => removeNotification(notification.id)}
                            className="text-gray-400 hover:text-red-500 p-1"
                            title="Remover notificação"
                          >
                            <Trash2 className="h-3 w-3" />
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        {notifications.length > 0 && (
          <div className="border-t border-gray-200 p-3">
            <button
              onClick={clearAll}
              className="w-full text-center text-sm text-gray-600 hover:text-red-600 font-medium"
            >
              Limpar todas as notificações
            </button>
          </div>
        )}
      </div>
    </>
  );
}