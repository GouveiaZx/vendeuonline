import React, { useState, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Upload, 
  FileText, 
  CheckCircle, 
  XCircle, 
  AlertTriangle, 
  Download,
  Trash2,
  Eye
} from 'lucide-react';
import { toast } from 'sonner';

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

interface DocumentUploadProps {
  storeId: string;
  requiredDocuments: RequiredDocument[];
  uploadedDocuments: UploadedDocument[];
  onDocumentUploaded: (document: UploadedDocument) => void;
  onDocumentDeleted: (documentType: string) => void;
  readonly?: boolean;
}

export default function DocumentUpload({
  storeId,
  requiredDocuments,
  uploadedDocuments,
  onDocumentUploaded,
  onDocumentDeleted,
  readonly = false
}: DocumentUploadProps) {
  const [uploading, setUploading] = useState<string | null>(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const fileInputRefs = useRef<{ [key: string]: HTMLInputElement | null }>({});

  const handleFileSelect = async (documentType: string, file: File) => {
    const requiredDoc = requiredDocuments.find(doc => doc.document_type === documentType);
    if (!requiredDoc) return;

    // Validar tipo de arquivo
    const fileExtension = '.' + file.name.split('.').pop()?.toLowerCase();
    if (!requiredDoc.file_types.includes(fileExtension)) {
      toast.error(`Tipo de arquivo não permitido. Tipos aceitos: ${requiredDoc.file_types.join(', ')}`);
      return;
    }

    // Validar tamanho do arquivo
    if (file.size > requiredDoc.max_file_size) {
      const maxSizeMB = requiredDoc.max_file_size / (1024 * 1024);
      toast.error(`Arquivo muito grande. Tamanho máximo: ${maxSizeMB}MB`);
      return;
    }

    try {
      setUploading(documentType);
      setUploadProgress(0);

      const formData = new FormData();
      formData.append('file', file);
      formData.append('storeId', storeId);
      formData.append('documentType', documentType);

      const response = await fetch('/api/stores/documents/upload', {
        method: 'POST',
        body: formData
      });
      
      // Simular progresso de upload
      setUploadProgress(100);

      if (response.ok) {
        const { document } = await response.json();
        onDocumentUploaded(document);
        toast.success('Documento enviado com sucesso!');
      } else {
        const { error } = await response.json();
        toast.error(error || 'Erro ao enviar documento');
      }
    } catch (error) {
      console.error('Erro no upload:', error);
      toast.error('Erro ao enviar documento');
    } finally {
      setUploading(null);
      setUploadProgress(0);
      // Limpar input
      if (fileInputRefs.current[documentType]) {
        fileInputRefs.current[documentType]!.value = '';
      }
    }
  };

  const handleDeleteDocument = async (documentType: string) => {
    try {
      const response = await fetch('/api/stores/documents/delete', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ storeId, documentType })
      });

      if (response.ok) {
        onDocumentDeleted(documentType);
        toast.success('Documento removido com sucesso!');
      } else {
        const { error } = await response.json();
        toast.error(error || 'Erro ao remover documento');
      }
    } catch (error) {
      console.error('Erro ao deletar documento:', error);
      toast.error('Erro ao remover documento');
    }
  };

  const getDocumentStatus = (documentType: string) => {
    const uploaded = uploadedDocuments.find(doc => doc.document_type === documentType);
    const required = requiredDocuments.find(doc => doc.document_type === documentType);
    
    if (uploaded) {
      return { status: 'uploaded', label: 'Enviado', variant: 'default' as const, icon: CheckCircle };
    } else if (required?.is_required) {
      return { status: 'required', label: 'Obrigatório', variant: 'destructive' as const, icon: XCircle };
    } else {
      return { status: 'optional', label: 'Opcional', variant: 'secondary' as const, icon: AlertTriangle };
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const calculateCompleteness = () => {
    const requiredDocs = requiredDocuments.filter(doc => doc.is_required);
    const uploadedRequiredDocs = requiredDocs.filter(doc => 
      uploadedDocuments.some(uploaded => uploaded.document_type === doc.document_type)
    );
    
    if (requiredDocs.length === 0) return 100;
    return Math.round((uploadedRequiredDocs.length / requiredDocs.length) * 100);
  };

  const completeness = calculateCompleteness();

  return (
    <div className="space-y-6">
      {/* Header com Score de Completude */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Documentos da Loja</span>
            <Badge variant={completeness >= 100 ? 'default' : completeness >= 80 ? 'secondary' : 'destructive'}>
              {completeness}% Completo
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <div className="flex justify-between text-sm mb-2">
                <span>Progresso dos Documentos</span>
                <span>{completeness}%</span>
              </div>
              <Progress value={completeness} className="h-2" />
            </div>
            
            {completeness < 100 && (
              <Alert>
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>
                  Alguns documentos obrigatórios ainda não foram enviados. 
                  Complete o envio para que sua loja possa ser aprovada.
                </AlertDescription>
              </Alert>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Lista de Documentos */}
      <div className="grid gap-4">
        {requiredDocuments.map((doc) => {
          const uploaded = uploadedDocuments.find(uploaded => uploaded.document_type === doc.document_type);
          const status = getDocumentStatus(doc.document_type);
          const isUploading = uploading === doc.document_type;
          const StatusIcon = status.icon;

          return (
            <Card key={doc.id}>
              <CardContent className="p-6">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <FileText className="w-5 h-5 text-gray-600" />
                      <h3 className="font-medium">{doc.display_name}</h3>
                      <Badge variant={status.variant} className="flex items-center gap-1">
                        <StatusIcon className="w-3 h-3" />
                        {status.label}
                      </Badge>
                    </div>
                    
                    <p className="text-sm text-gray-600 mb-3">{doc.description}</p>
                    
                    <div className="text-xs text-gray-500 space-y-1">
                      <p>Tipos aceitos: {doc.file_types.join(', ')}</p>
                      <p>Tamanho máximo: {formatFileSize(doc.max_file_size)}</p>
                    </div>

                    {uploaded && (
                      <div className="mt-3 p-3 bg-green-50 rounded-lg">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-sm font-medium text-green-800">{uploaded.file_name}</p>
                            <p className="text-xs text-green-600">
                              Enviado em {new Date(uploaded.uploaded_at).toLocaleDateString('pt-BR')} • 
                              {formatFileSize(uploaded.file_size)}
                            </p>
                          </div>
                          <div className="flex gap-2">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => window.open(uploaded.file_url, '_blank')}
                            >
                              <Eye className="w-4 h-4" />
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => {
                                const link = document.createElement('a');
                                link.href = uploaded.file_url;
                                link.download = uploaded.file_name;
                                link.click();
                              }}
                            >
                              <Download className="w-4 h-4" />
                            </Button>
                            {!readonly && (
                              <Button
                                size="sm"
                                variant="destructive"
                                onClick={() => handleDeleteDocument(doc.document_type)}
                              >
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            )}
                          </div>
                        </div>
                      </div>
                    )}

                    {isUploading && (
                      <div className="mt-3">
                        <div className="flex justify-between text-sm mb-2">
                          <span>Enviando...</span>
                          <span>{uploadProgress}%</span>
                        </div>
                        <Progress value={uploadProgress} className="h-2" />
                      </div>
                    )}
                  </div>

                  {!readonly && !uploaded && !isUploading && (
                    <div className="ml-4">
                      <input
                        type="file"
                        ref={(el) => {
                          if (el) fileInputRefs.current[doc.document_type] = el;
                        }}
                        accept={doc.file_types.join(',')}
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) {
                            handleFileSelect(doc.document_type, file);
                          }
                        }}
                        className="hidden"
                      />
                      <Button
                        onClick={() => fileInputRefs.current[doc.document_type]?.click()}
                        variant={doc.is_required ? 'default' : 'outline'}
                      >
                        <Upload className="w-4 h-4 mr-2" />
                        Enviar
                      </Button>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {requiredDocuments.length === 0 && (
        <Card>
          <CardContent className="p-8 text-center">
            <FileText className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600">Nenhum documento obrigatório configurado.</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}