import React, { useState, useRef, useEffect } from 'react';
import { Search, X, Clock, TrendingUp, MapPin, Filter } from 'lucide-react';
import {
  useSearchActions,
  useSearchQuery,
  useSearchSuggestions,
  useSearchHistory,
  useSearchLoading,
  useSearchShowFilters
} from '@/hooks/useSSRSafeSearch';
import { useDebouncedSuggestions } from '@/hooks/useDebounced';
import { useIsClient } from '@/hooks/useSSRSafeStore';
import { SearchSuggestions as SuggestionsType } from '@/types';

interface SearchBarProps {
  placeholder?: string;
  showFilters?: boolean;
  onFocus?: () => void;
  onBlur?: () => void;
  className?: string;
}

export const SearchBar: React.FC<SearchBarProps> = ({
  placeholder = "Buscar produtos, lojas...",
  showFilters = true,
  onFocus,
  onBlur,
  className = ""
}) => {
  const [inputValue, setInputValue] = useState('');
  const [showDropdown, setShowDropdown] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const inputRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const isClient = useIsClient();
  const query = useSearchQuery();
  const suggestions = useSearchSuggestions();
  const history = useSearchHistory();
  const loading = useSearchLoading();
  const filtersVisible = useSearchShowFilters();

  const {
    setQuery,
    search,
    getHistory,
    deleteSearch,
    toggleFilters,
    clearResults
  } = useSearchActions();

  const debouncedGetSuggestions = useDebouncedSuggestions(300);

  // Sincronizar input com query do store
  useEffect(() => {
    if (query !== inputValue) {
      setInputValue(query || '');
    }
  }, [query]);

  // Carregar histórico ao montar - apenas no cliente
  useEffect(() => {
    if (isClient && getHistory) {
      getHistory();
    }
  }, [getHistory, isClient]);

  // Buscar sugestões quando input muda - apenas no cliente
  useEffect(() => {
    if (isClient && inputValue.trim() && inputValue.length >= 2) {
      debouncedGetSuggestions(inputValue);
    }
  }, [inputValue, debouncedGetSuggestions, isClient]);

  // Fechar dropdown ao clicar fora
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node) &&
        !inputRef.current?.contains(event.target as Node)
      ) {
        setShowDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Obter todas as sugestões para navegação por teclado
  const allSuggestions = React.useMemo(() => {
    const items: Array<{
      type: 'suggestion' | 'history' | 'trending';
      text: string;
      category?: string;
      count?: number;
    }> = [];

    // Adicionar sugestões principais
    if (suggestions?.products) {
      suggestions.products.forEach(product => {
        items.push({ type: 'suggestion', text: product.name, category: 'Produto' });
      });
    }

    if (suggestions?.stores) {
      suggestions.stores.forEach(store => {
        items.push({ type: 'suggestion', text: store.name, category: 'Loja' });
      });
    }

    if (suggestions?.categories) {
      suggestions.categories.forEach(category => {
        items.push({ type: 'suggestion', text: category.name, category: 'Categoria' });
      });
    }

    if (suggestions?.keywords) {
      suggestions.keywords.forEach(keyword => {
        items.push({ type: 'suggestion', text: keyword });
      });
    }

    // Adicionar histórico recente (apenas se não há input)
    if (!inputValue.trim() && history?.recent) {
      history.recent.forEach(item => {
        items.push({ type: 'history', text: item.query, count: item.resultsCount });
      });
    }

    // Adicionar trending (apenas se não há input)
    if (!inputValue.trim() && history?.trending) {
       history.trending.forEach(item => {
         if (typeof item === 'string') {
           items.push({ type: 'trending', text: item, count: 0 });
         } else {
           items.push({ type: 'trending', text: item.query, count: item.resultsCount });
         }
       });
     }

    return items;
  }, [suggestions, history, inputValue]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setInputValue(value);
    setSelectedIndex(-1);
    
    if (value.trim()) {
      setShowDropdown(true);
    } else {
      setShowDropdown(false);
      clearResults();
    }
  };

  const handleInputFocus = () => {
    setShowDropdown(true);
    onFocus?.();
  };

  const handleInputBlur = () => {
    // Delay para permitir cliques no dropdown
    setTimeout(() => {
      onBlur?.();
    }, 150);
  };

  const handleSearch = (searchQuery?: string) => {
    const finalQuery = searchQuery || inputValue.trim();
    if (finalQuery) {
      setQuery(finalQuery);
      search(finalQuery);
      setShowDropdown(false);
      inputRef.current?.blur();
    }
  };

  const handleSuggestionClick = (suggestion: string) => {
    setInputValue(suggestion);
    handleSearch(suggestion);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!showDropdown || allSuggestions.length === 0) {
      if (e.key === 'Enter') {
        handleSearch();
      }
      return;
    }

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setSelectedIndex(prev => 
          prev < allSuggestions.length - 1 ? prev + 1 : 0
        );
        break;
      case 'ArrowUp':
        e.preventDefault();
        setSelectedIndex(prev => 
          prev > 0 ? prev - 1 : allSuggestions.length - 1
        );
        break;
      case 'Enter':
        e.preventDefault();
        if (selectedIndex >= 0 && selectedIndex < allSuggestions.length) {
          handleSuggestionClick(allSuggestions[selectedIndex].text);
        } else {
          handleSearch();
        }
        break;
      case 'Escape':
        setShowDropdown(false);
        setSelectedIndex(-1);
        inputRef.current?.blur();
        break;
    }
  };

  const handleClearInput = () => {
    setInputValue('');
    setQuery('');
    clearResults();
    inputRef.current?.focus();
  };

  const handleDeleteHistory = (query: string, e: React.MouseEvent) => {
    e.stopPropagation();
    deleteSearch(query);
  };

  const getSuggestionIcon = (type: string) => {
    switch (type) {
      case 'history':
        return <Clock className="w-4 h-4 text-gray-400" />;
      case 'trending':
        return <TrendingUp className="w-4 h-4 text-orange-500" />;
      default:
        return <Search className="w-4 h-4 text-gray-400" />;
    }
  };

  return (
    <div className={`relative w-full max-w-2xl ${className}`}>
      {/* Input Principal */}
      <div className="relative">
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
          <Search className="h-5 w-5 text-gray-400" />
        </div>
        
        <input
          ref={inputRef}
          type="text"
          value={inputValue}
          onChange={handleInputChange}
          onFocus={handleInputFocus}
          onBlur={handleInputBlur}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          className="block w-full pl-10 pr-20 py-3 border border-gray-300 rounded-lg leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-blue-500 focus:border-blue-500 text-sm"
        />
        
        <div className="absolute inset-y-0 right-0 flex items-center">
          {/* Botão Limpar */}
          {inputValue && (
            <button
              onClick={handleClearInput}
              className="p-1 mr-1 text-gray-400 hover:text-gray-600 focus:outline-none"
            >
              <X className="h-4 w-4" />
            </button>
          )}
          
          {/* Botão Filtros */}
          {showFilters && (
            <button
              onClick={toggleFilters}
              className={`p-2 mr-1 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                filtersVisible
                  ? 'text-blue-600 bg-blue-50'
                  : 'text-gray-400 hover:text-gray-600'
              }`}
            >
              <Filter className="h-4 w-4" />
            </button>
          )}
          
          {/* Botão Buscar */}
          <button
            onClick={() => handleSearch()}
            disabled={loading || false}
            className="px-4 py-2 mr-1 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed text-sm font-medium"
          >
            {loading ? 'Buscando...' : 'Buscar'}
          </button>
        </div>
      </div>

      {/* Dropdown de Sugestões */}
      {showDropdown && (
        <div
          ref={dropdownRef}
          className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-96 overflow-y-auto"
        >
          {allSuggestions.length > 0 ? (
            <div className="py-1">
              {/* Seção de Sugestões */}
              {inputValue.trim() && suggestions && (
                <>
                  {(suggestions.products?.length > 0 || suggestions.stores?.length > 0 || 
                    suggestions.categories?.length > 0 || suggestions.keywords?.length > 0) && (
                    <div className="px-3 py-2 text-xs font-semibold text-gray-500 uppercase tracking-wide border-b border-gray-100">
                      Sugestões
                    </div>
                  )}
                  
                  {allSuggestions
                    .filter(item => item.type === 'suggestion')
                    .map((item, index) => {
                      const globalIndex = allSuggestions.findIndex(s => s.text === item.text);
                      return (
                        <button
                          key={`suggestion-${item.text}-${item.category || 'general'}`}
                          onClick={() => handleSuggestionClick(item.text)}
                          className={`w-full px-3 py-2 text-left hover:bg-gray-50 focus:outline-none focus:bg-gray-50 flex items-center space-x-3 ${
                            selectedIndex === globalIndex ? 'bg-blue-50' : ''
                          }`}
                        >
                          {getSuggestionIcon('suggestion')}
                          <div className="flex-1 min-w-0">
                            <div className="text-sm text-gray-900 truncate">{item.text}</div>
                            {item.category && (
                              <div className="text-xs text-gray-500">{item.category}</div>
                            )}
                          </div>
                        </button>
                      );
                    })
                  }
                </>
              )}
              
              {/* Seção de Histórico */}
              {!inputValue.trim() && history?.recent && history.recent.length > 0 && (
                <>
                  <div className="px-3 py-2 text-xs font-semibold text-gray-500 uppercase tracking-wide border-b border-gray-100">
                    Buscas Recentes
                  </div>
                  {allSuggestions
                    .filter(item => item.type === 'history')
                    .slice(0, 5)
                    .map((item, index) => {
                      const globalIndex = allSuggestions.findIndex(s => s.text === item.text);
                      return (
                        <div
                          key={`history-${item.text}`}
                          className={`flex items-center space-x-3 px-3 py-2 hover:bg-gray-50 ${
                            selectedIndex === globalIndex ? 'bg-blue-50' : ''
                          }`}
                        >
                          <button
                            onClick={() => handleSuggestionClick(item.text)}
                            className="flex-1 flex items-center space-x-3 text-left focus:outline-none"
                          >
                            {getSuggestionIcon('history')}
                            <div className="flex-1 min-w-0">
                              <div className="text-sm text-gray-900 truncate">{item.text}</div>
                              {item.count !== undefined && (
                                <div className="text-xs text-gray-500">
                                  {item.count} resultado{item.count !== 1 ? 's' : ''}
                                </div>
                              )}
                            </div>
                          </button>
                          <button
                            onClick={(e) => handleDeleteHistory(item.text, e)}
                            className="p-1 text-gray-400 hover:text-gray-600 focus:outline-none"
                          >
                            <X className="h-3 w-3" />
                          </button>
                        </div>
                      );
                    })
                  }
                </>
              )}
              
              {/* Seção de Trending */}
              {!inputValue.trim() && history?.trending && history.trending.length > 0 && (
                <>
                  <div className="px-3 py-2 text-xs font-semibold text-gray-500 uppercase tracking-wide border-b border-gray-100">
                    Em Alta
                  </div>
                  {allSuggestions
                    .filter(item => item.type === 'trending')
                    .slice(0, 3)
                    .map((item, index) => {
                      const globalIndex = allSuggestions.findIndex(s => s.text === item.text);
                      return (
                        <button
                          key={`trending-${item.text}`}
                          onClick={() => handleSuggestionClick(item.text)}
                          className={`w-full px-3 py-2 text-left hover:bg-gray-50 focus:outline-none focus:bg-gray-50 flex items-center space-x-3 ${
                            selectedIndex === globalIndex ? 'bg-blue-50' : ''
                          }`}
                        >
                          {getSuggestionIcon('trending')}
                          <div className="flex-1 min-w-0">
                            <div className="text-sm text-gray-900 truncate">{item.text}</div>
                            {item.count !== undefined && (
                              <div className="text-xs text-gray-500">
                                {item.count} resultado{item.count !== 1 ? 's' : ''}
                              </div>
                            )}
                          </div>
                        </button>
                      );
                    })
                  }
                </>
              )}
            </div>
          ) : (
            <div className="px-3 py-4 text-sm text-gray-500 text-center">
              {inputValue.trim() ? 'Nenhuma sugestão encontrada' : 'Digite para buscar'}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default SearchBar;