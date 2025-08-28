'use client';

import { useState, useEffect } from 'react';
import { Clock, Eye, Heart, ShoppingCart, Trash2, Star, Calendar, Filter, Loader2 } from 'lucide-react';
import Link from 'next/link';
import { toast } from 'sonner';
import OptimizedImage from '@/components/ui/OptimizedImage';

interface HistoryItem {
  id: string;
  productId: string;
  name: string;
  image: string;
  price: number;
  originalPrice?: number;
  seller: string;
  category: string;
  rating: number;
  reviews: number;
  viewedAt: string;
  viewCount: number;
  lastViewDuration: number;
  inStock: boolean;
}

export default function HistoryPage() {
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState('Todas');
  const [timeFilter, setTimeFilter] = useState('all');
  const [showFilters, setShowFilters] = useState(false);

  useEffect(() => {
    fetchHistory();
  }, []);

  const fetchHistory = async () => {
    try {
      setLoading(true);
      
      // Tentar buscar da API real primeiro
      const response = await fetch('/api/buyer/history');
      
      if (response.ok) {
        const data = await response.json();
        setHistory(data.history || []);
      } else {
        // Fallback para dados simulados mínimos
        setHistory([
          {
            id: '1',
            productId: 'prod-1',
            name: 'Produto Exemplo',
            image: 'https://trae-api-us.mchost.guru/api/ide/v1/text_to_image?prompt=produto%20exemplo&image_size=square',
            price: 99.90,
            originalPrice: 149.90,
            seller: 'Vendedor Exemplo',
            category: 'Eletrônicos',
            rating: 4.5,
            reviews: 123,
            viewedAt: new Date().toISOString(),
            viewCount: 1,
            lastViewDuration: 30000,
            inStock: true
          }
        ]);
      }
    } catch (err) {
      console.error('Erro ao buscar histórico:', err);
      setHistory([]);
    } finally {
      setLoading(false);
    }
  };

  const addToWishlist = async (item: HistoryItem) => {
    try {
      const response = await fetch('/api/buyer/wishlist', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ productId: item.productId })
      });
      
      if (response.ok) {
        toast.success('Produto adicionado à lista de desejos');
      } else {
        toast.error('Erro ao adicionar à lista de desejos');
      }
    } catch (err) {
      toast.error('Erro ao adicionar à lista de desejos');
    }
  };

  const addToCart = async (item: HistoryItem) => {
    try {
      const response = await fetch('/api/buyer/cart', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ productId: item.productId, quantity: 1 })
      });
      
      if (response.ok) {
        toast.success('Produto adicionado ao carrinho');
      } else {
        toast.error('Erro ao adicionar ao carrinho');
      }
    } catch (err) {
      toast.error('Erro ao adicionar ao carrinho');
    }
  };

  const removeFromHistory = async (itemId: string) => {
    try {
      const response = await fetch(`/api/buyer/history/${itemId}`, {
        method: 'DELETE'
      });
      
      if (response.ok) {
        setHistory(prev => prev.filter(item => item.id !== itemId));
        toast.success('Item removido do histórico');
      } else {
        toast.error('Erro ao remover item do histórico');
      }
    } catch (err) {
      toast.error('Erro ao remover item do histórico');
    }
  };

  const categories = ['Todas', ...Array.from(new Set(history.map(item => item.category)))];
  
  const timeFilters = [
    { value: 'all', label: 'Todo período' },
    { value: 'today', label: 'Hoje' },
    { value: 'week', label: 'Esta semana' },
    { value: 'month', label: 'Este mês' }
  ];

  const filteredHistory = history.filter(item => {
    const categoryMatch = selectedCategory === 'Todas' || item.category === selectedCategory;
    
    let timeMatch = true;
    if (timeFilter !== 'all') {
      const viewDate = new Date(item.viewedAt);
      const now = new Date();
      
      switch (timeFilter) {
        case 'today':
          timeMatch = viewDate.toDateString() === now.toDateString();
          break;
        case 'week':
          const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
          timeMatch = viewDate >= weekAgo;
          break;
        case 'month':
          const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
          timeMatch = viewDate >= monthAgo;
          break;
      }
    }
    
    return categoryMatch && timeMatch;
  });

  const getTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60));
    
    if (diffInHours < 1) return 'há poucos minutos';
    if (diffInHours < 24) return `há ${diffInHours} hora${diffInHours > 1 ? 's' : ''}`;
    
    const diffInDays = Math.floor(diffInHours / 24);
    if (diffInDays < 7) return `há ${diffInDays} dia${diffInDays > 1 ? 's' : ''}`;
    
    return date.toLocaleDateString('pt-BR');
  };

  const formatDuration = (milliseconds: number) => {
    const seconds = Math.floor(milliseconds / 1000);
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    
    if (minutes > 0) {
      return `${minutes}m ${remainingSeconds}s`;
    }
    return `${remainingSeconds}s`;
  };

  const totalViews = history.reduce((sum, item) => sum + item.viewCount, 0);
  const avgViewDuration = history.length > 0 
    ? history.reduce((sum, item) => sum + item.lastViewDuration, 0) / history.length 
    : 0;

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Loading State */}
        {loading && (
          <div className="flex justify-center items-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
            <span className="ml-3 text-gray-600">Carregando histórico...</span>
          </div>
        )}

        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Histórico de Visualizações</h1>
            <p className="text-gray-600">Produtos que você visualizou recentemente</p>
          </div>
          <button 
            onClick={() => setShowFilters(!showFilters)}
            className="bg-white border border-gray-300 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-50 transition-colors flex items-center gap-2"
          >
            <Filter className="h-4 w-4" />
            Filtros
          </button>
        </div>

        {/* Stats Cards */}
        {!loading && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
            <div className="bg-white p-6 rounded-lg shadow-sm border">
              <div className="flex items-center">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <Eye className="h-6 w-6 text-blue-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-500">Total de Visualizações</p>
                  <p className="text-2xl font-bold text-gray-900">{totalViews}</p>
                </div>
              </div>
            </div>
            
            <div className="bg-white p-6 rounded-lg shadow-sm border">
              <div className="flex items-center">
                <div className="p-2 bg-purple-100 rounded-lg">
                  <Clock className="h-6 w-6 text-purple-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-500">Tempo Médio</p>
                  <p className="text-2xl font-bold text-gray-900">{formatDuration(avgViewDuration)}</p>
                </div>
              </div>
            </div>
            
            <div className="bg-white p-6 rounded-lg shadow-sm border">
              <div className="flex items-center">
                <div className="p-2 bg-green-100 rounded-lg">
                  <Calendar className="h-6 w-6 text-green-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-500">Produtos Únicos</p>
                  <p className="text-2xl font-bold text-gray-900">{history.length}</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Filters */}
        {!loading && showFilters && (
          <div className="bg-white p-6 rounded-lg shadow-sm border mb-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Categoria
                </label>
                <select
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  {categories.map(category => (
                    <option key={category} value={category}>{category}</option>
                  ))}
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Período
                </label>
                <select
                  value={timeFilter}
                  onChange={(e) => setTimeFilter(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  {timeFilters.map(filter => (
                    <option key={filter.value} value={filter.value}>{filter.label}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>
        )}

        {/* History Items */}
        {!loading && (filteredHistory.length === 0 ? (
          <div className="text-center py-12">
            <Clock className="h-16 w-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-xl font-medium text-gray-900 mb-2">
              {history.length === 0 ? 'Nenhum produto visualizado ainda' : 'Nenhum item encontrado'}
            </h3>
            <p className="text-gray-500 mb-6">
              {history.length === 0 
                ? 'Comece explorando nossos produtos para ver seu histórico aqui'
                : 'Tente alterar os filtros para ver mais resultados'
              }
            </p>
            <Link 
              href="/products"
              className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors inline-flex items-center gap-2"
            >
              <Eye className="h-4 w-4" />
              Explorar Produtos
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredHistory.map((item) => (
              <div key={item.id} className="bg-white rounded-lg shadow-sm border p-6 hover:shadow-md transition-shadow">
                <div className="flex gap-4">
                  {/* Product Image */}
                  <div className="relative w-24 h-24 bg-gray-100 rounded-lg overflow-hidden flex-shrink-0">
                    <img 
                      src={item.image} 
                      alt={item.name}
                      className="w-full h-full object-cover"
                    />
                    {!item.inStock && (
                      <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center">
                        <span className="text-white text-xs font-medium">Fora de Estoque</span>
                      </div>
                    )}
                    {item.originalPrice && (
                      <div className="absolute top-1 left-1 bg-red-500 text-white px-1 py-0.5 rounded text-xs font-medium">
                        -{Math.round(((item.originalPrice - item.price) / item.originalPrice) * 100)}%
                      </div>
                    )}
                  </div>
                  
                  {/* Product Info */}
                  <div className="flex-1">
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <Link 
                          href={`/products/${item.productId}`}
                          className="font-medium text-gray-900 hover:text-blue-600 transition-colors"
                        >
                          {item.name}
                        </Link>
                        <p className="text-sm text-gray-600">{item.seller}</p>
                      </div>
                      
                      <div className="flex gap-2 ml-4">
                        <button
                          onClick={() => addToWishlist(item)}
                          className="p-2 border border-gray-300 rounded hover:bg-gray-50 hover:text-red-500"
                          title="Adicionar à lista de desejos"
                        >
                          <Heart className="h-4 w-4" />
                        </button>
                        
                        <button
                          onClick={() => addToCart(item)}
                          disabled={!item.inStock}
                          className="bg-blue-600 text-white px-4 py-2 rounded text-sm hover:bg-blue-700 transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed flex items-center gap-1"
                        >
                          <ShoppingCart className="h-3 w-3" />
                          {item.inStock ? 'Adicionar ao Carrinho' : 'Indisponível'}
                        </button>
                        
                        <button
                          onClick={() => removeFromHistory(item.id)}
                          disabled={loading}
                          className="p-2 border border-gray-300 rounded hover:bg-red-50 hover:border-red-300 hover:text-red-600 disabled:opacity-50"
                          title="Remover do histórico"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-1 mb-2">
                      <div className="flex items-center">
                        {[...Array(5)].map((_, i) => (
                          <Star 
                            key={i} 
                            className={`h-3 w-3 ${i < Math.floor(item.rating) ? 'text-yellow-400 fill-current' : 'text-gray-300'}`} 
                          />
                        ))}
                      </div>
                      <span className="text-xs text-gray-500">({item.reviews} avaliações)</span>
                      <span className="text-xs text-gray-400 mx-2">•</span>
                      <span className="text-xs text-gray-600">{item.category}</span>
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-xl font-bold text-gray-900">
                            R$ {item.price.toFixed(2).replace('.', ',')}
                          </span>
                          {item.originalPrice && (
                            <span className="text-sm text-gray-500 line-through">
                              R$ {item.originalPrice.toFixed(2).replace('.', ',')}
                            </span>
                          )}
                        </div>
                      </div>
                      
                      <div className="text-right">
                        <div className="text-sm text-gray-600">
                          Visualizado {getTimeAgo(item.viewedAt)}
                        </div>
                        <div className="text-xs text-gray-500">
                          {item.viewCount} {item.viewCount === 1 ? 'visualização' : 'visualizações'} • 
                          Tempo: {formatDuration(item.lastViewDuration)}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}
