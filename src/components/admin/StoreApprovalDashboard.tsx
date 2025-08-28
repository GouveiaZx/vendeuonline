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
import { 
  Store, 
  CheckCircle, 
  XCircle, 
  Clock, 
  AlertTriangle, 
  Eye, 
  FileText, 
  User, 
  Calendar,
  ChevronLeft,
  ChevronRight,
  Filter,
  Download,
  Upload,
  Trash2
} from 'lucide-react';
import { toast } from 'sonner';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface StoreData {
  id: string;
  name: string;
  description: string;
  category: string;
  sellerId: string;
  approval_status: 'pending' | 'approved' | 'rejected' | 'suspended';
  documents: Record<string, any>;
  verification_notes?: string;
  rejection_reason?: string;
  createdAt: string;
  last_status_change: string;
  owner_id?: string;
  seller?: {
    name: string;
    email: string;
  };
  logo?: string;
  address: string;
  city: string;
  state: string;
  phone: string;
  email: string;
}

interface ApprovalStats {
  pending: number;
  approved: number;
  rejected: number;
  suspended: number;
  total: number;
}

interface RequiredDocument {
  id: string;
  document_type: string;
  display_name: string;
  description: string;
  is_required: boolean;
  file_types: string[];
  max_file_size: number;
}

interface DocumentCheck {
  document_type: string;
  display_name: string;
  is_provided: boolean;
  is_required: boolean;
}

export default function StoreApprovalDashboard() {
  const [stats, setStats] = useState<ApprovalStats | null>(null);
  const [stores, setStores] = useState<StoreData[]>([]);
  const [requiredDocuments, setRequiredDocuments] = useState<RequiredDocument[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedStores, setSelectedStores] = useState<string[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [filterStatus, setFilterStatus] = useState<string>('pending');
  const [sortBy, setSortBy] = useState('createdAt');
  const [sortOrder, setSortOrder] = useState('desc');
  const [showModerationDialog, setShowModerationDialog] = useState(false);
  const [moderationData, setModerationData] = useState<{
    storeId?: string;
    storeIds?: string[];
    action: 'approve' | 'reject' | 'suspend';
    reason?: string;
    notes?: string;
  } | null>(null);
  const [showDocumentsDialog, setShowDocumentsDialog] = useState(false);
  const [selectedStoreForDocs, setSelectedStoreForDocs] = useState<string | null>(null);
  const [documentChecks, setDocumentChecks] = useState<DocumentCheck[]>([]);
  const [completenessScore, setCompletenessScore] = useState<number>(0);

  const loadApprovalData = async () => {
    try {
      setLoading(true);
      
      // Carregar estatísticas
      const statsResponse = await fetch('/api/stores/approval?action=stats');
      if (statsResponse.ok) {
        const { stats } = await statsResponse.json();
        setStats(stats);
      }

      // Carregar lojas
      const storesResponse = await fetch(
        `/api/stores/approval?status=${filterStatus}&page=${currentPage}&sortBy=${sortBy}&sortOrder=${sortOrder}`
      );
      if (storesResponse.ok) {
        const { stores: storesData, pagination } = await storesResponse.json();
        setStores(storesData);
        setTotalPages(pagination.totalPages);
      }

      // Carregar documentos obrigatórios
      const docsResponse = await fetch('/api/stores/approval?action=required-documents');
      if (docsResponse.ok) {
        const { documents } = await docsResponse.json();
        setRequiredDocuments(documents);
      }

    } catch (error) {
      console.error('Erro ao carregar dados de aprovação:', error);
      toast.error('Erro ao carregar dados de aprovação');
    } finally {
      setLoading(false);
    }
  };

  const handleModerationAction = (storeId: string, action: 'approve' | 'reject' | 'suspend') => {
    setModerationData({ storeId, action });
    setShowModerationDialog(true);
  };

  const handleBulkModeration = (action: 'approve' | 'reject' | 'suspend') => {
    if (selectedStores.length === 0) {
      toast.error('Selecione pelo menos uma loja');
      return;
    }
    setModerationData({ storeIds: selectedStores, action });
    setShowModerationDialog(true);
  };

  const confirmModeration = async () => {
    if (!moderationData) return;

    try {
      const body = {
        action: moderationData.storeIds ? 'bulk-moderate' : 'moderate',
        storeId: moderationData.storeId,
        storeIds: moderationData.storeIds,
        moderationAction: moderationData.action,
        reason: moderationData.reason,
        notes: moderationData.notes
      };

      const response = await fetch('/api/stores/approval', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      });

      if (response.ok) {
        const { message } = await response.json();
        toast.success(message);
        setShowModerationDialog(false);
        setModerationData(null);
        setSelectedStores([]);
        loadApprovalData();
      } else {
        const { error } = await response.json();
        toast.error(error || 'Erro ao processar moderação');
      }
    } catch (error) {
      console.error('Erro na moderação:', error);
      toast.error('Erro ao processar moderação');
    }
  };

  const checkDocuments = async (storeId: string) => {
    try {
      const response = await fetch(`/api/stores/approval?action=check-documents&storeId=${storeId}`);
      if (response.ok) {
        const { documents, completeness_score } = await response.json();
        setDocumentChecks(documents);
        setCompletenessScore(completeness_score);
        setSelectedStoreForDocs(storeId);
        setShowDocumentsDialog(true);
      }
    } catch (error) {
      console.error('Erro ao verificar documentos:', error);
      toast.error('Erro ao verificar documentos');
    }
  };

  const getStatusBadge = (status: string) => {
    const variants = {
      pending: { variant: 'secondary' as const, label: 'Pendente', icon: Clock },
      approved: { variant: 'default' as const, label: 'Aprovada', icon: CheckCircle },
      rejected: { variant: 'destructive' as const, label: 'Rejeitada', icon: XCircle },
      suspended: { variant: 'outline' as const, label: 'Suspensa', icon: AlertTriangle }
    };
    
    const config = variants[status as keyof typeof variants] || variants.pending;
    const Icon = config.icon;
    
    return (
      <Badge variant={config.variant} className="flex items-center gap-1">
        <Icon className="w-3 h-3" />
        {config.label}
      </Badge>
    );
  };

  const toggleStoreSelection = (storeId: string) => {
    setSelectedStores(prev => 
      prev.includes(storeId) 
        ? prev.filter(id => id !== storeId)
        : [...prev, storeId]
    );
  };

  const selectAllStores = () => {
    if (selectedStores.length === stores.length) {
      setSelectedStores([]);
    } else {
      setSelectedStores(stores.map(store => store.id));
    }
  };

  useEffect(() => {
    loadApprovalData();
  }, [currentPage, filterStatus, sortBy, sortOrder]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Carregando dados de aprovação...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Estatísticas */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Pendentes</p>
                  <p className="text-2xl font-bold text-yellow-600">{stats.pending}</p>
                </div>
                <Clock className="w-8 h-8 text-yellow-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Aprovadas</p>
                  <p className="text-2xl font-bold text-green-600">{stats.approved}</p>
                </div>
                <CheckCircle className="w-8 h-8 text-green-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Rejeitadas</p>
                  <p className="text-2xl font-bold text-red-600">{stats.rejected}</p>
                </div>
                <XCircle className="w-8 h-8 text-red-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Suspensas</p>
                  <p className="text-2xl font-bold text-orange-600">{stats.suspended}</p>
                </div>
                <AlertTriangle className="w-8 h-8 text-orange-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Total</p>
                  <p className="text-2xl font-bold text-blue-600">{stats.total}</p>
                </div>
                <Store className="w-8 h-8 text-blue-600" />
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Filtros e Ações */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Aprovação de Lojas</span>
            <div className="flex gap-2">
              {selectedStores.length > 0 && (
                <>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleBulkModeration('approve')}
                  >
                    <CheckCircle className="w-4 h-4 mr-1" />
                    Aprovar ({selectedStores.length})
                  </Button>
                  <Button
                    size="sm"
                    variant="destructive"
                    onClick={() => handleBulkModeration('reject')}
                  >
                    <XCircle className="w-4 h-4 mr-1" />
                    Rejeitar ({selectedStores.length})
                  </Button>
                </>
              )}
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col md:flex-row gap-4 mb-6">
            <Select value={filterStatus} onValueChange={setFilterStatus}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Filtrar por status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas</SelectItem>
                <SelectItem value="pending">Pendentes</SelectItem>
                <SelectItem value="approved">Aprovadas</SelectItem>
                <SelectItem value="rejected">Rejeitadas</SelectItem>
                <SelectItem value="suspended">Suspensas</SelectItem>
              </SelectContent>
            </Select>

            <Select value={sortBy} onValueChange={setSortBy}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Ordenar por" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="createdAt">Data de Criação</SelectItem>
                <SelectItem value="last_status_change">Última Alteração</SelectItem>
                <SelectItem value="name">Nome</SelectItem>
              </SelectContent>
            </Select>

            <Select value={sortOrder} onValueChange={setSortOrder}>
              <SelectTrigger className="w-32">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="desc">Desc</SelectItem>
                <SelectItem value="asc">Asc</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Lista de Lojas */}
          <div className="space-y-4">
            {/* Header da tabela */}
            <div className="flex items-center p-4 bg-gray-50 rounded-lg font-medium text-sm">
              <div className="w-8">
                <Checkbox
                  checked={selectedStores.length === stores.length && stores.length > 0}
                  onCheckedChange={selectAllStores}
                />
              </div>
              <div className="flex-1 ml-4">Loja</div>
              <div className="w-32">Status</div>
              <div className="w-40">Criada em</div>
              <div className="w-48">Ações</div>
            </div>

            {stores.map((store) => (
              <div key={store.id} className="flex items-center p-4 border rounded-lg hover:bg-gray-50">
                <div className="w-8">
                  <Checkbox
                    checked={selectedStores.includes(store.id)}
                    onCheckedChange={() => toggleStoreSelection(store.id)}
                  />
                </div>
                
                <div className="flex-1 ml-4">
                  <div className="flex items-start space-x-3">
                    {store.logo && (
                      <img 
                        src={store.logo} 
                        alt={store.name}
                        className="w-12 h-12 rounded-lg object-cover"
                      />
                    )}
                    <div>
                      <h3 className="font-medium text-gray-900">{store.name}</h3>
                      <p className="text-sm text-gray-600">{store.category}</p>
                      {store.seller && (
                        <p className="text-xs text-gray-500">
                          <User className="w-3 h-3 inline mr-1" />
                          {store.seller.name} ({store.seller.email})
                        </p>
                      )}
                      <p className="text-xs text-gray-500">
                        {store.city}, {store.state}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="w-32">
                  {getStatusBadge(store.approval_status)}
                </div>

                <div className="w-40 text-sm text-gray-600">
                  <Calendar className="w-4 h-4 inline mr-1" />
                  {formatDistanceToNow(new Date(store.createdAt), { addSuffix: true, locale: ptBR })}
                </div>

                <div className="w-48 flex gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => checkDocuments(store.id)}
                  >
                    <FileText className="w-4 h-4" />
                  </Button>
                  
                  {store.approval_status === 'pending' && (
                    <>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleModerationAction(store.id, 'approve')}
                      >
                        <CheckCircle className="w-4 h-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => handleModerationAction(store.id, 'reject')}
                      >
                        <XCircle className="w-4 h-4" />
                      </Button>
                    </>
                  )}
                  
                  {store.approval_status === 'approved' && (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleModerationAction(store.id, 'suspend')}
                    >
                      <AlertTriangle className="w-4 h-4" />
                    </Button>
                  )}
                </div>
              </div>
            ))}

            {stores.length === 0 && (
              <div className="text-center py-8">
                <p className="text-gray-600">Nenhuma loja encontrada.</p>
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

      {/* Dialog de Moderação */}
      <Dialog open={showModerationDialog} onOpenChange={setShowModerationDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {moderationData?.action === 'approve' ? 'Aprovar' : 
               moderationData?.action === 'reject' ? 'Rejeitar' : 'Suspender'} 
              {moderationData?.storeIds ? ` ${moderationData.storeIds.length} lojas` : ' loja'}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            {(moderationData?.action === 'reject' || moderationData?.action === 'suspend') && (
              <div>
                <label className="block text-sm font-medium mb-2">Motivo *</label>
                <Textarea
                  placeholder="Descreva o motivo da rejeição/suspensão..."
                  value={moderationData?.reason || ''}
                  onChange={(e) => setModerationData(prev => prev ? { ...prev, reason: e.target.value } : null)}
                />
              </div>
            )}
            
            <div>
              <label className="block text-sm font-medium mb-2">Observações</label>
              <Textarea
                placeholder="Observações adicionais (opcional)..."
                value={moderationData?.notes || ''}
                onChange={(e) => setModerationData(prev => prev ? { ...prev, notes: e.target.value } : null)}
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

      {/* Dialog de Documentos */}
      <Dialog open={showDocumentsDialog} onOpenChange={setShowDocumentsDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Verificação de Documentos</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 bg-blue-50 rounded-lg">
              <span className="font-medium">Score de Completude</span>
              <Badge variant={completenessScore >= 100 ? 'default' : completenessScore >= 80 ? 'secondary' : 'destructive'}>
                {completenessScore}%
              </Badge>
            </div>

            <div className="space-y-3">
              {documentChecks.map((doc, index) => (
                <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                  <div>
                    <p className="font-medium">{doc.display_name}</p>
                    <p className="text-sm text-gray-600">
                      {doc.is_required ? 'Obrigatório' : 'Opcional'}
                    </p>
                  </div>
                  <Badge variant={doc.is_provided ? 'default' : 'destructive'}>
                    {doc.is_provided ? 'Fornecido' : 'Pendente'}
                  </Badge>
                </div>
              ))}
            </div>

            <div className="flex justify-end">
              <Button onClick={() => setShowDocumentsDialog(false)}>
                Fechar
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}