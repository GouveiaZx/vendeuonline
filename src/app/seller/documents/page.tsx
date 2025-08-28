'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Store, AlertTriangle, CheckCircle } from 'lucide-react';
import DocumentUpload from '@/components/stores/DocumentUpload';
import { useAuthStore } from '@/store/authStore';
import { toast } from 'sonner';

interface StoreData {
  id: string;
  name: string;
  approval_status: 'pending' | 'approved' | 'rejected' | 'suspended';
  documents: Record<string, any>;
  rejection_reason?: string;
  verification_notes?: string;
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

interface UploadedDocument {
  document_type: string;
  file_name: string;
  file_url: string;
  uploaded_at: string;
  file_size: number;
}

export default function SellerDocumentsPage() {
  const router = useRouter();
  const { user, isAuthenticated } = useAuthStore();
  const [store, setStore] = useState<StoreData | null>(null);
  const [requiredDocuments, setRequiredDocuments] = useState<RequiredDocument[]>([]);
  const [uploadedDocuments, setUploadedDocuments] = useState<UploadedDocument[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAuthorized, setIsAuthorized] = useState(false);

  useEffect(() => {
    const checkAuthAndLoadData = async () => {
      if (!isAuthenticated) {
        toast.error('Você precisa estar logado para acessar esta página');
        router.push('/login');
        return;
      }

      if (!user?.seller) {
        toast.error('Acesso negado. Apenas vendedores podem acessar esta página.');
        router.push('/');
        return;
      }

      setIsAuthorized(true);
      await loadData();
    };

    checkAuthAndLoadData();
  }, [isAuthenticated, user, router]);

  const loadData = async () => {
    try {
      setLoading(true);

      // Carregar dados da loja do vendedor
      const storeResponse = await fetch('/api/stores/my-store');
      if (storeResponse.ok) {
        const { store: storeData } = await storeResponse.json();
        setStore(storeData);
        
        // Converter documentos para formato esperado
        const docs: UploadedDocument[] = [];
        if (storeData.documents) {
          Object.entries(storeData.documents).forEach(([type, info]: [string, any]) => {
            docs.push({
              document_type: type,
              file_name: info.file_name,
              file_url: info.file_url,
              uploaded_at: info.uploaded_at,
              file_size: info.file_size
            });
          });
        }
        setUploadedDocuments(docs);
      } else {
        toast.error('Erro ao carregar dados da loja');
        router.push('/seller');
        return;
      }

      // Carregar documentos obrigatórios
      const docsResponse = await fetch('/api/stores/approval?action=required-documents');
      if (docsResponse.ok) {
        const { documents } = await docsResponse.json();
        setRequiredDocuments(documents);
      }

    } catch (error) {
      console.error('Erro ao carregar dados:', error);
      toast.error('Erro ao carregar dados');
    } finally {
      setLoading(false);
    }
  };

  const handleDocumentUploaded = (document: UploadedDocument) => {
    setUploadedDocuments(prev => {
      const filtered = prev.filter(doc => doc.document_type !== document.document_type);
      return [...filtered, document];
    });
    
    // Atualizar status da loja se necessário
    if (store) {
      setStore(prev => prev ? {
        ...prev,
        documents: {
          ...prev.documents,
          [document.document_type]: {
            file_name: document.file_name,
            file_url: document.file_url,
            uploaded_at: document.uploaded_at,
            file_size: document.file_size
          }
        }
      } : null);
    }
  };

  const handleDocumentDeleted = (documentType: string) => {
    setUploadedDocuments(prev => prev.filter(doc => doc.document_type !== documentType));
    
    // Atualizar status da loja
    if (store) {
      const newDocuments = { ...store.documents };
      delete newDocuments[documentType];
      setStore(prev => prev ? {
        ...prev,
        documents: newDocuments
      } : null);
    }
  };

  const getStatusBadge = (status: string) => {
    const variants = {
      pending: { variant: 'secondary' as const, label: 'Pendente', icon: AlertTriangle },
      approved: { variant: 'default' as const, label: 'Aprovada', icon: CheckCircle },
      rejected: { variant: 'destructive' as const, label: 'Rejeitada', icon: AlertTriangle },
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

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Carregando documentos...</p>
        </div>
      </div>
    );
  }

  if (!isAuthorized || !store) {
    return null;
  }

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center space-x-4">
          <Button
            variant="outline"
            size="sm"
            onClick={() => router.push('/seller')}
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Voltar ao Painel
          </Button>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Documentos da Loja</h1>
            <p className="text-gray-600 mt-1">
              Gerencie os documentos necessários para aprovação da sua loja
            </p>
          </div>
        </div>
      </div>

      {/* Status da Loja */}
      <Card className="mb-8">
        <CardHeader>
          <CardTitle className="flex items-center gap-3">
            <Store className="w-6 h-6" />
            {store.name}
            {getStatusBadge(store.approval_status)}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {store.approval_status === 'rejected' && store.rejection_reason && (
              <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                <h4 className="font-medium text-red-800 mb-2">Motivo da Rejeição:</h4>
                <p className="text-red-700">{store.rejection_reason}</p>
              </div>
            )}
            
            {store.verification_notes && (
              <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <h4 className="font-medium text-blue-800 mb-2">Observações da Verificação:</h4>
                <p className="text-blue-700">{store.verification_notes}</p>
              </div>
            )}
            
            {store.approval_status === 'pending' && (
              <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                <h4 className="font-medium text-yellow-800 mb-2">Status: Aguardando Aprovação</h4>
                <p className="text-yellow-700">
                  Sua loja está sendo analisada. Complete o envio de todos os documentos obrigatórios 
                  para acelerar o processo de aprovação.
                </p>
              </div>
            )}
            
            {store.approval_status === 'approved' && (
              <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                <h4 className="font-medium text-green-800 mb-2">Loja Aprovada!</h4>
                <p className="text-green-700">
                  Parabéns! Sua loja foi aprovada e está ativa na plataforma.
                </p>
              </div>
            )}
            
            {store.approval_status === 'suspended' && (
              <div className="p-4 bg-orange-50 border border-orange-200 rounded-lg">
                <h4 className="font-medium text-orange-800 mb-2">Loja Suspensa</h4>
                <p className="text-orange-700">
                  Sua loja foi suspensa. Entre em contato com o suporte para mais informações.
                </p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Upload de Documentos */}
      <DocumentUpload
        storeId={store.id}
        requiredDocuments={requiredDocuments}
        uploadedDocuments={uploadedDocuments}
        onDocumentUploaded={handleDocumentUploaded}
        onDocumentDeleted={handleDocumentDeleted}
        readonly={store.approval_status === 'approved'}
      />
    </div>
  );
}