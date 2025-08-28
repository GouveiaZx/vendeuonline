import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Checkbox } from '@/components/ui/checkbox';
import { AlertTriangle, CheckCircle, XCircle, Eye, EyeOff, Flag, Trash2, Plus, Filter, ChevronLeft, ChevronRight } from 'lucide-react';
import { toast } from 'sonner';
import { StarRating } from '@/components/reviews/StarRating';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { useGet, usePost, useApiMultiple } from '@/hooks/useApi';

interface Review {
  id: string;
  rating: number;
  comment: string;
  status: 'active' | 'hidden' | 'pending_moderation' | 'rejected' | 'approved';
  isSpam: boolean;
  isInappropriate: boolean;
  reportCount: number;
  createdAt: string;
  moderatedAt?: string;
  moderatedBy?: string;
  moderationReason?: string;
  user: {
    name: string;
    email: string;
  };
  product?: {
    name: string;
  };
  store?: {
    name: string;
  };
  reports: { count: number }[];
}

interface ModerationStats {
  totalReviews: number;
  pendingReviews: number;
  approvedReviews: number;
  rejectedReviews: number;
  hiddenReviews: number;
  spamReviews: number;
  inappropriateReviews: number;
  reportedReviews: number;
}

interface ModerationFilter {
  id: string;
  filterType: 'spam' | 'inappropriate' | 'profanity';
  pattern: string;
  isActive: boolean;
  createdAt: string;
}

export default function ModerationDashboard() {
  const [selectedReviews, setSelectedReviews] = useState<string[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [filterType, setFilterType] = useState<string>('pending');
  const [sortBy, setSortBy] = useState('createdAt');
  const [sortOrder, setSortOrder] = useState('desc');
  const [newFilter, setNewFilter] = useState({ type: 'spam', pattern: '' });
  const [showAddFilter, setShowAddFilter] = useState(false);
  const [moderationReason, setModerationReason] = useState('');
  const [showModerationDialog, setShowModerationDialog] = useState(false);
  const [selectedAction, setSelectedAction] = useState('');
  const [selectedReviewId, setSelectedReviewId] = useState('');

  // API hooks
  const api = useApiMultiple();
  const moderateAction = usePost();

  useEffect(() => {
    loadModerationData();
  }, [currentPage, filterType, sortBy, sortOrder]);

  const loadModerationData = async () => {
    // Carregar estatísticas
    await api.execute('stats', 'GET', '/api/reviews/moderation?action=stats');
    
    // Carregar reviews pendentes
    await api.execute(
      'reviews',
      'GET', 
      `/api/reviews/moderation?action=pending-reviews&page=${currentPage}&filterType=${filterType}&sortBy=${sortBy}&sortOrder=${sortOrder}`
    );
    
    // Carregar filtros
    await api.execute('filters', 'GET', '/api/reviews/moderation?action=filters');

    // Atualizar totalPages se reviews carregou com sucesso
    const reviewsState = api.getRequest('reviews');
    if (reviewsState.success && reviewsState.data) {
      setTotalPages(reviewsState.data.pagination?.totalPages || 1);
    }
  };

  const moderateReview = async (reviewId: string, action: string, reason?: string) => {
    const response = await moderateAction.execute('/api/reviews/moderation', {
      action: 'moderate-review',
      reviewId,
      moderationAction: action,
      reason
    });

    if (response.success) {
      toast.success('Review moderado com sucesso');
      loadModerationData();
    } else {
      toast.error(response.error || 'Erro ao moderar review');
    }
  };

  const handleModerationAction = (reviewId: string, action: string) => {
    setSelectedReviewId(reviewId);
    setSelectedAction(action);
    setModerationReason('');
    setShowModerationDialog(true);
  };

  const confirmModeration = async () => {
    await moderateReview(selectedReviewId, selectedAction, moderationReason);
    setShowModerationDialog(false);
  };

  const bulkModerate = async (action: string, reason?: string) => {
    if (selectedReviews.length === 0) {
      toast.error('Selecione pelo menos um review');
      return;
    }

    try {
      const response = await fetch('/api/reviews/moderation', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'bulk-moderate',
          reviewIds: selectedReviews,
          moderationAction: action,
          reason
        })
      });

      if (response.ok) {
        toast.success(`${selectedReviews.length} reviews moderados com sucesso`);
        setSelectedReviews([]);
        loadModerationData();
      } else {
        toast.error('Erro ao moderar reviews');
      }
    } catch (error) {
      console.error('Erro ao moderar reviews:', error);
      toast.error('Erro ao moderar reviews');
    }
  };

  const addFilter = async () => {
    if (!newFilter.pattern.trim()) {
      toast.error('Padrão é obrigatório');
      return;
    }

    try {
      const response = await fetch('/api/reviews/moderation', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'add-filter',
          filterType: newFilter.type,
          pattern: newFilter.pattern
        })
      });

      if (response.ok) {
        toast.success('Filtro adicionado com sucesso');
        setNewFilter({ type: 'spam', pattern: '' });
        setShowAddFilter(false);
        loadModerationData();
      } else {
        toast.error('Erro ao adicionar filtro');
      }
    } catch (error) {
      console.error('Erro ao adicionar filtro:', error);
      toast.error('Erro ao adicionar filtro');
    }
  };

  const toggleFilter = async (filterId: string, isActive: boolean) => {
    try {
      const response = await fetch('/api/reviews/moderation', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'toggle-filter',
          filterId,
          isActive
        })
      });

      if (response.ok) {
        toast.success('Filtro atualizado com sucesso');
        loadModerationData();
      } else {
        toast.error('Erro ao atualizar filtro');
      }
    } catch (error) {
      console.error('Erro ao atualizar filtro:', error);
      toast.error('Erro ao atualizar filtro');
    }
  };

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      pending_moderation: { label: 'Pendente', variant: 'secondary' as const, icon: AlertTriangle },
      approved: { label: 'Aprovado', variant: 'default' as const, icon: CheckCircle },
      rejected: { label: 'Rejeitado', variant: 'destructive' as const, icon: XCircle },
      hidden: { label: 'Oculto', variant: 'outline' as const, icon: EyeOff },
      active: { label: 'Ativo', variant: 'default' as const, icon: Eye }
    };

    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.pending_moderation;
    const Icon = config.icon;

    return (
      <Badge variant={config.variant} className="flex items-center gap-1">
        <Icon className="w-3 h-3" />
        {config.label}
      </Badge>
    );
  };

  const handleSelectReview = (reviewId: string, checked: boolean) => {
    if (checked) {
      setSelectedReviews([...selectedReviews, reviewId]);
    } else {
      setSelectedReviews(selectedReviews.filter(id => id !== reviewId));
    }
  };

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedReviews(reviews.map((review: any) => review.id));
    } else {
      setSelectedReviews([]);
    }
  };

  // Derived states from API
  const statsState = api.getRequest('stats');
  const reviewsState = api.getRequest('reviews');
  const filtersState = api.getRequest('filters');
  const isLoading = statsState.loading || reviewsState.loading || filtersState.loading;
  const stats = statsState.data?.moderationStats;
  const reviews = reviewsState.data?.reviews || [];
  const filters = filtersState.data?.filters || [];

  if (isLoading && !statsState.data && !reviewsState.data) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Carregando dados de moderação...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Estatísticas */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Total de Reviews</p>
                  <p className="text-2xl font-bold">{stats.totalReviews}</p>
                </div>
                <Eye className="w-8 h-8 text-blue-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Pendentes</p>
                  <p className="text-2xl font-bold text-orange-600">{stats.pendingReviews}</p>
                </div>
                <AlertTriangle className="w-8 h-8 text-orange-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Reportados</p>
                  <p className="text-2xl font-bold text-red-600">{stats.reportedReviews}</p>
                </div>
                <Flag className="w-8 h-8 text-red-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Spam</p>
                  <p className="text-2xl font-bold text-red-600">{stats.spamReviews}</p>
                </div>
                <Trash2 className="w-8 h-8 text-red-600" />
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      <Tabs defaultValue="reviews" className="space-y-4">
        <TabsList>
          <TabsTrigger value="reviews">Reviews</TabsTrigger>
          <TabsTrigger value="filters">Filtros</TabsTrigger>
        </TabsList>

        <TabsContent value="reviews" className="space-y-4">
          {/* Controles de Filtro e Ações em Massa */}
          <Card>
            <CardContent className="p-4">
              <div className="flex flex-col md:flex-row gap-4 items-start md:items-center justify-between">
                <div className="flex flex-col md:flex-row gap-4">
                  <Select value={filterType} onValueChange={setFilterType}>
                    <SelectTrigger className="w-48">
                      <SelectValue placeholder="Filtrar por status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="pending">Pendentes</SelectItem>
                      <SelectItem value="reported">Reportados</SelectItem>
                      <SelectItem value="spam">Spam</SelectItem>
                      <SelectItem value="inappropriate">Inapropriados</SelectItem>
                      <SelectItem value="all">Todos</SelectItem>
                    </SelectContent>
                  </Select>

                  <Select value={sortBy} onValueChange={setSortBy}>
                    <SelectTrigger className="w-48">
                      <SelectValue placeholder="Ordenar por" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="createdAt">Data de criação</SelectItem>
                      <SelectItem value="reportCount">Número de reports</SelectItem>
                      <SelectItem value="rating">Avaliação</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {selectedReviews.length > 0 && (
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => bulkModerate('approve')}
                    >
                      <CheckCircle className="w-4 h-4 mr-1" />
                      Aprovar ({selectedReviews.length})
                    </Button>
                    <Button
                      size="sm"
                      variant="destructive"
                      onClick={() => bulkModerate('reject')}
                    >
                      <XCircle className="w-4 h-4 mr-1" />
                      Rejeitar ({selectedReviews.length})
                    </Button>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Lista de Reviews */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Reviews para Moderação</CardTitle>
                <div className="flex items-center gap-2">
                  <Checkbox
                    checked={selectedReviews.length === reviews.length && reviews.length > 0}
                    onCheckedChange={handleSelectAll}
                  />
                  <span className="text-sm text-gray-600">Selecionar todos</span>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {reviews.map((review: any) => (
                  <div key={review.id} className="border rounded-lg p-4 space-y-3">
                    <div className="flex items-start justify-between">
                      <div className="flex items-start gap-3">
                        <Checkbox
                          checked={selectedReviews.includes(review.id)}
                          onCheckedChange={(checked) => handleSelectReview(review.id, checked as boolean)}
                        />
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <StarRating rating={review.rating} size="sm" />
                            {getStatusBadge(review.status)}
                            {review.reportCount > 0 && (
                              <Badge variant="destructive">
                                <Flag className="w-3 h-3 mr-1" />
                                {review.reportCount} reports
                              </Badge>
                            )}
                            {review.isSpam && (
                              <Badge variant="destructive">Spam</Badge>
                            )}
                            {review.isInappropriate && (
                              <Badge variant="destructive">Inapropriado</Badge>
                            )}
                          </div>
                          <p className="text-gray-900 mb-2">{review.comment}</p>
                          <div className="text-sm text-gray-600">
                            <p>Por: {review.user.name} ({review.user.email})</p>
                            {review.product && <p>Produto: {review.product.name}</p>}
                            {review.store && <p>Loja: {review.store.name}</p>}
                            <p>Criado: {formatDistanceToNow(new Date(review.createdAt), { addSuffix: true, locale: ptBR })}</p>
                            {review.moderatedAt && (
                              <p>Moderado: {formatDistanceToNow(new Date(review.moderatedAt), { addSuffix: true, locale: ptBR })}</p>
                            )}
                            {review.moderationReason && (
                              <p>Motivo: {review.moderationReason}</p>
                            )}
                          </div>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleModerationAction(review.id, 'approve')}
                        >
                          <CheckCircle className="w-4 h-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() => handleModerationAction(review.id, 'reject')}
                        >
                          <XCircle className="w-4 h-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleModerationAction(review.id, 'hide')}
                        >
                          <EyeOff className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}

                {reviews.length === 0 && (
                  <div className="text-center py-8">
                    <p className="text-gray-600">Nenhum review encontrado para moderação.</p>
                  </div>
                )}
              </div>

              {/* Paginação */}
              {totalPages > 1 && (
                <div className="flex items-center justify-between mt-6">
                  <Button
                    variant="outline"
                    onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                    disabled={currentPage === 1}
                  >
                    <ChevronLeft className="w-4 h-4 mr-1" />
                    Anterior
                  </Button>
                  <span className="text-sm text-gray-600">
                    Página {currentPage} de {totalPages}
                  </span>
                  <Button
                    variant="outline"
                    onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                    disabled={currentPage === totalPages}
                  >
                    Próxima
                    <ChevronRight className="w-4 h-4 ml-1" />
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="filters" className="space-y-4">
          {/* Filtros de Moderação */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Filtros de Moderação</CardTitle>
                <Button onClick={() => setShowAddFilter(true)}>
                  <Plus className="w-4 h-4 mr-1" />
                  Adicionar Filtro
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {filters.map((filter: any) => (
                  <div key={filter.id} className="flex items-center justify-between p-3 border rounded-lg">
                    <div>
                      <div className="flex items-center gap-2">
                        <Badge variant={filter.filterType === 'spam' ? 'destructive' : 'secondary'}>
                          {filter.filterType}
                        </Badge>
                        <span className="font-medium">{filter.pattern}</span>
                      </div>
                      <p className="text-sm text-gray-600 mt-1">
                        Criado: {formatDistanceToNow(new Date(filter.createdAt), { addSuffix: true, locale: ptBR })}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Checkbox
                        checked={filter.isActive}
                        onCheckedChange={(checked) => toggleFilter(filter.id, checked as boolean)}
                      />
                      <span className="text-sm text-gray-600">Ativo</span>
                    </div>
                  </div>
                ))}

                {filters.length === 0 && (
                  <div className="text-center py-8">
                    <p className="text-gray-600">Nenhum filtro configurado.</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Dialog de Moderação */}
      <Dialog open={showModerationDialog} onOpenChange={setShowModerationDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirmar Moderação</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <p>Tem certeza que deseja {selectedAction === 'approve' ? 'aprovar' : selectedAction === 'reject' ? 'rejeitar' : 'ocultar'} este review?</p>
            <div>
              <label className="block text-sm font-medium mb-2">Motivo (opcional):</label>
              <Textarea
                value={moderationReason}
                onChange={(e) => setModerationReason(e.target.value)}
                placeholder="Descreva o motivo da moderação..."
                rows={3}
              />
            </div>
            <div className="flex gap-2 justify-end">
              <Button variant="outline" onClick={() => setShowModerationDialog(false)}>
                Cancelar
              </Button>
              <Button onClick={confirmModeration}>
                Confirmar
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Dialog de Adicionar Filtro */}
      <Dialog open={showAddFilter} onOpenChange={setShowAddFilter}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Adicionar Filtro de Moderação</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">Tipo de Filtro:</label>
              <Select value={newFilter.type} onValueChange={(value) => setNewFilter({ ...newFilter, type: value })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="spam">Spam</SelectItem>
                  <SelectItem value="inappropriate">Inapropriado</SelectItem>
                  <SelectItem value="profanity">Palavrão</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Padrão:</label>
              <Input
                value={newFilter.pattern}
                onChange={(e) => setNewFilter({ ...newFilter, pattern: e.target.value })}
                placeholder="Ex: palavra ou frase a ser filtrada"
              />
            </div>
            <div className="flex gap-2 justify-end">
              <Button variant="outline" onClick={() => setShowAddFilter(false)}>
                Cancelar
              </Button>
              <Button onClick={addFilter}>
                Adicionar
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}