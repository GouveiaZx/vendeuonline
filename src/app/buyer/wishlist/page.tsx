'use client';

import { useState, useEffect } from 'react';
import { Heart, ShoppingCart, Share2, Grid, List, Star, Filter, Loader2 } from 'lucide-react';
import Link from 'next/link';
import { toast } from 'sonner';
import ProductCard from '@/components/ui/ProductCard';

interface WishlistItem {
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
  addedAt: string;
  inStock: boolean;
  discount?: number;
}

export default function WishlistPage() {
  const [wishlist, setWishlist] = useState<WishlistItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [selectedCategory, setSelectedCategory] = useState('Todas');
  const [showFilters, setShowFilters] = useState(false);

  useEffect(() => {
    fetchWishlist();
  }, []);

  const fetchWishlist = async () => {
    try {
      setLoading(true);
      
      // Tentar buscar da API real primeiro
      const response = await fetch('/api/buyer/wishlist');
      
      if (response.ok) {
        const data = await response.json();
        setWishlist(data.wishlist || []);
      } else {
        // Fallback para dados simulados mÃ­nimos
        setWishlist([
          {
            id: '1',
            productId: 'prod-1',
            name: 'Produto Exemplo',
            image: 'https://trae-api-us.mchost.guru/api/ide/v1/text_to_image?prompt=produto%20exemplo&image_size=square',
            price: 99.90,
            originalPrice: 149.90,
            seller: 'Vendedor Exemplo',
            category: 'EletrÃ´nicos',
            rating: 4.5,
            reviews: 123,
            addedAt: new Date().toISOString(),
            inStock: true,
            discount: 33
          }
        ]);
      }
    } catch (err) {
      console.error('Erro ao buscar lista de desejos:', err);
      setWishlist([]);
    } finally {
      setLoading(false);
    }
  };

  const removeFromWishlist = async (itemId: string) => {
    try {
      const response = await fetch(`/api/buyer/wishlist/${itemId}`, {
        method: 'DELETE'
      });
      
      if (response.ok) {
        setWishlist(prev => prev.filter(item => item.id !== itemId));
        toast.success('Item removido da lista de desejos');
      } else {
        toast.error('Erro ao remover item da lista de desejos');
      }
    } catch (err) {
      toast.error('Erro ao remover item da lista de desejos');
    }
  };

  const addToCart = async (item: WishlistItem) => {
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

  const shareProduct = (item: WishlistItem) => {
    if (navigator.share) {
      navigator.share({
        title: item.name,
        text: `Confira este produto: ${item.name}`,
        url: `/products/${item.productId}`
      });
    } else {
      navigator.clipboard.writeText(`${window.location.origin}/products/${item.productId}`);
      toast.success('Link copiado para a Ã¡rea de transferÃªncia');
    }
  };

  const categories = ['Todas', ...Array.from(new Set(wishlist.map(item => item.category)))];
  
  const filteredWishlist = wishlist.filter(item => 
    selectedCategory === 'Todas' || item.category === selectedCategory
  );

  const getTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));
    
    if (diffInDays === 0) return 'Hoje';
    if (diffInDays === 1) return 'Ontem';
    if (diffInDays < 7) return `${diffInDays} dias atrÃ¡s`;
    
    return date.toLocaleDateString('pt-BR');
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Loading State */}
        {loading && (
          <div className="flex justify-center items-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
            <span className="ml-3 text-gray-600">Carregando lista de desejos...</span>
          </div>
        )}

        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Lista de Desejos</h1>
            <p className="text-gray-600">
              {filteredWishlist.length} {filteredWishlist.length === 1 ? 'produto salvo' : 'produtos salvos'}
            </p>
          </div>
          
          <div className="flex items-center gap-3">
            <button 
              onClick={() => setShowFilters(!showFilters)}
              className="bg-white border border-gray-300 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-50 transition-colors flex items-center gap-2"
            >
              <Filter className="h-4 w-4" />
              Filtros
            </button>
            
            <div className="flex bg-white border border-gray-300 rounded-lg">
              <button
                onClick={() => setViewMode('grid')}
                className={`p-2 ${viewMode === 'grid' ? 'bg-blue-600 text-white' : 'text-gray-600 hover:bg-gray-50'} rounded-l-lg transition-colors`}
              >
                <Grid className="h-4 w-4" />
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={`p-2 ${viewMode === 'list' ? 'bg-blue-600 text-white' : 'text-gray-600 hover:bg-gray-50'} rounded-r-lg transition-colors`}
              >
                <List className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>

        {/* Filters */}
        {!loading && showFilters && (
          <div className="bg-white p-6 rounded-lg shadow-sm border mb-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
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
            </div>
          </div>
        )}

        {/* Wishlist Items */}
        {!loading && (filteredWishlist.length === 0 ? (
          <div className="text-center py-12">
            <Heart className="h-16 w-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-xl font-medium text-gray-900 mb-2">
              {wishlist.length === 0 ? 'Sua lista de desejos estÃ¡ vazia' : 'Nenhum item encontrado'}
            </h3>
            <p className="text-gray-500 mb-6">
              {wishlist.length === 0 
                ? 'Adicione produtos que vocÃª gosta para salvÃ¡-los aqui'
                : 'Tente alterar os filtros para ver mais resultados'
              }
            </p>
            <Link 
              href="/products"
              className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors inline-flex items-center gap-2"
            >
              <Heart className="h-4 w-4" />
              Explorar Produtos
            </Link>
          </div>
        ) : (
          <div className={viewMode === 'grid' 
            ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6' 
            : 'space-y-4'
          }>
            {filteredWishlist.map((item) => (
              viewMode === 'grid' ? (
                <div key={item.id} className="bg-white rounded-lg shadow-sm border overflow-hidden hover:shadow-md transition-shadow">
                  {/* Product Image */}
                  <div className="relative aspect-square bg-gray-100">
                    <img 
                      src={item.image} 
                      alt={item.name}
                      className="w-full h-full object-cover"
                    />
                    {!item.inStock && (
                      <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center">
                        <span className="text-white font-medium">Fora de Estoque</span>
                      </div>
                    )}
                    {item.discount && (
                      <div className="absolute top-2 left-2 bg-red-500 text-white px-2 py-1 rounded text-sm font-medium">
                        -{item.discount}%
                      </div>
                    )}
                    <button
                      onClick={() => removeFromWishlist(item.id)}
                      className="absolute top-2 right-2 p-2 bg-white rounded-full shadow-md hover:bg-red-50 hover:text-red-600 transition-colors"
                      title="Remover da lista de desejos"
                    >
                      <Heart className="h-4 w-4 fill-current text-red-500" />
                    </button>
                  </div>
                  
                  {/* Product Info */}
                  <div className="p-4">
                    <Link 
                      href={`/products/${item.productId}`}
                      className="font-medium text-gray-900 hover:text-blue-600 transition-colors line-clamp-2 mb-1"
                    >
                      {item.name}
                    </Link>
                    <p className="text-sm text-gray-600 mb-2">{item.seller}</p>
                    
                    <div className="flex items-center gap-1 mb-2">
                      <div className="flex items-center">
                        {[...Array(5)].map((_, i) => (
                          <Star 
                            key={i} 
                            className={`h-3 w-3 ${i < Math.floor(item.rating) ? 'text-yellow-400 fill-current' : 'text-gray-300'}`} 
                          />
                        ))}
                      </div>
                      <span className="text-xs text-gray-500">({item.reviews})</span>
                    </div>
                    
                    <div className="flex items-center gap-2 mb-3">
                      <span className="text-lg font-bold text-gray-900">
                        R$ {item.price.toFixed(2).replace('.', ',')}
                      </span>
                      {item.originalPrice && (
                        <span className="text-sm text-gray-500 line-through">
                          R$ {item.originalPrice.toFixed(2).replace('.', ',')}
                        </span>
                      )}
                    </div>
                    
                    <div className="text-xs text-gray-500 mb-3">
                      Adicionado {getTimeAgo(item.addedAt)}
                    </div>
                    
                    <div className="flex gap-2">
                      <button
                        onClick={() => addToCart(item)}
                        disabled={!item.inStock}
                        className="flex-1 bg-blue-600 text-white px-3 py-2 rounded text-sm hover:bg-blue-700 transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed flex items-center justify-center gap-1"
                      >
                        <ShoppingCart className="h-3 w-3" />
                        {item.inStock ? 'Adicionar' : 'IndisponÃ­vel'}
                      </button>
                      
                      <button
                        onClick={() => shareProduct(item)}
                        className="p-2 border border-gray-300 rounded hover:bg-gray-50 transition-colors"
                        title="Compartilhar"
                      >
                        <Share2 className="h-3 w-3" />
                      </button>
                    </div>
                  </div>
                </div>
              ) : (
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
                      {item.discount && (
                        <div className="absolute top-1 left-1 bg-red-500 text-white px-1 py-0.5 rounded text-xs font-medium">
                          -{item.discount}%
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
                            onClick={() => shareProduct(item)}
                            className="p-2 border border-gray-300 rounded hover:bg-gray-50 transition-colors"
                            title="Compartilhar"
                          >
                            <Share2 className="h-4 w-4" />
                          </button>
                          
                          <button
                            onClick={() => addToCart(item)}
                            disabled={!item.inStock}
                            className="bg-blue-600 text-white px-4 py-2 rounded text-sm hover:bg-blue-700 transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed flex items-center gap-1"
                          >
                            <ShoppingCart className="h-3 w-3" />
                            {item.inStock ? 'Adicionar ao Carrinho' : 'IndisponÃ­vel'}
                          </button>
                          
                          <button
                            onClick={() => removeFromWishlist(item.id)}
                            className="p-2 border border-gray-300 rounded hover:bg-red-50 hover:border-red-300 hover:text-red-600 transition-colors"
                            title="Remover da lista de desejos"
                          >
                            <Heart className="h-4 w-4 fill-current text-red-500" />
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
                        <span className="text-xs text-gray-500">({item.reviews} avaliaÃ§Ãµes)</span>
                        <span className="text-xs text-gray-400 mx-2">â€¢</span>
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
                            Adicionado {getTimeAgo(item.addedAt)}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}
