import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

// Implementação das funções de aprovação de lojas
async function getStoresForApproval(status: string, page: number, limit: number, sortBy: string, sortOrder: 'asc' | 'desc') {
  const offset = (page - 1) * limit;
  
  const { data: stores, error, count } = await supabase
    .from('stores')
    .select('*', { count: 'exact' })
    .eq('status', status)
    .order(sortBy, { ascending: sortOrder === 'asc' })
    .range(offset, offset + limit - 1);

  if (error) throw error;

  return {
    stores: stores || [],
    total: count || 0,
    page,
    limit,
    totalPages: Math.ceil((count || 0) / limit)
  };
}

async function getApprovalStats() {
  const { data: pending } = await supabase
    .from('stores')
    .select('id', { count: 'exact' })
    .eq('status', 'pending');

  const { data: approved } = await supabase
    .from('stores')
    .select('id', { count: 'exact' })
    .eq('status', 'approved');

  const { data: rejected } = await supabase
    .from('stores')
    .select('id', { count: 'exact' })
    .eq('status', 'rejected');

  return {
    pending: pending?.length || 0,
    approved: approved?.length || 0,
    rejected: rejected?.length || 0
  };
}

async function moderateStore(storeId: string, action: string, adminId: string, reason?: string, notes?: string) {
  const { data: store, error } = await supabase
    .from('stores')
    .update({
      status: action === 'approve' ? 'approved' : action === 'reject' ? 'rejected' : 'suspended',
      moderated_at: new Date().toISOString(),
      moderated_by: adminId,
      moderation_reason: reason,
      moderation_notes: notes
    })
    .eq('id', storeId)
    .select()
    .single();

  if (error) throw error;
  return store;
}

async function bulkModerateStores(storeIds: string[], action: string, adminId: string, reason?: string) {
  const { data: stores, error } = await supabase
    .from('stores')
    .update({
      status: action === 'approve' ? 'approved' : action === 'reject' ? 'rejected' : 'suspended',
      moderated_at: new Date().toISOString(),
      moderated_by: adminId,
      moderation_reason: reason
    })
    .in('id', storeIds)
    .select();

  if (error) throw error;
  return { stores: stores || [], count: stores?.length || 0 };
}

async function getStoreApprovalHistory(storeId: string) {
  const { data: history, error } = await supabase
    .from('store_approval_history')
    .select('*')
    .eq('store_id', storeId)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return history || [];
}

async function getRequiredDocuments() {
  return [
    { id: 'cnpj', name: 'CNPJ', required: true },
    { id: 'license', name: 'Licença Comercial', required: true },
    { id: 'identity', name: 'Documento de Identidade', required: true }
  ];
}

async function checkDocumentCompleteness(storeId: string) {
  const { data: store, error } = await supabase
    .from('stores')
    .select('documents')
    .eq('id', storeId)
    .single();

  if (error) throw error;

  const requiredDocs = await getRequiredDocuments();
  const storeDocuments = store?.documents || {};
  
  const missing = requiredDocs.filter(doc => !storeDocuments[doc.id]);
  
  return {
    complete: missing.length === 0,
    missing: missing.map(doc => doc.id),
    total: requiredDocs.length,
    uploaded: requiredDocs.length - missing.length
  };
}

async function updateStoreDocuments(storeId: string, documents: any) {
  const { data: store, error } = await supabase
    .from('stores')
    .update({ documents })
    .eq('id', storeId)
    .select()
    .single();

  if (error) throw error;
  return store;
}

async function getStoreStatusNotifications(params: any) {
  let query = supabase
    .from('store_notifications')
    .select('*', { count: 'exact' })
    .order('created_at', { ascending: false });

  if (params.userId) {
    query = query.eq('user_id', params.userId);
  }

  if (params.storeId) {
    query = query.eq('store_id', params.storeId);
  }

  if (params.unreadOnly) {
    query = query.eq('read', false);
  }

  if (params.limit) {
    query = query.limit(params.limit);
  }

  const { data: notifications, error, count } = await query;

  if (error) throw error;

  const { count: unreadCount } = await supabase
    .from('store_notifications')
    .select('id', { count: 'exact' })
    .eq('read', false);

  return {
    notifications: notifications || [],
    unread_count: unreadCount || 0
  };
}

async function markNotificationAsRead(notificationId: string) {
  const { data: notification, error } = await supabase
    .from('store_notifications')
    .update({ read: true, read_at: new Date().toISOString() })
    .eq('id', notificationId)
    .select()
    .single();

  if (error) throw error;
  return notification;
}

async function markNotificationsAsRead(notificationIds: string[]) {
  const { data: notifications, error } = await supabase
    .from('store_notifications')
    .update({ read: true, read_at: new Date().toISOString() })
    .in('id', notificationIds)
    .select();

  if (error) throw error;
  return { notifications: notifications || [], count: notifications?.length || 0 };
}

async function deleteNotification(notificationId: string) {
  const { data: notification, error } = await supabase
    .from('store_notifications')
    .delete()
    .eq('id', notificationId)
    .select()
    .single();

  if (error) throw error;
  return notification;
}

async function deleteNotifications(notificationIds: string[]) {
  const { data: notifications, error } = await supabase
    .from('store_notifications')
    .delete()
    .in('id', notificationIds)
    .select();

  if (error) throw error;
  return { notifications: notifications || [], count: notifications?.length || 0 };
}

// Verificar se o usuário é admin
async function verifyAdmin(request: NextRequest) {
  const authHeader = request.headers.get('authorization');
  if (!authHeader) {
    return null;
  }

  const token = authHeader.replace('Bearer ', '');
  const { data: { user }, error } = await supabase.auth.getUser(token);
  
  if (error || !user) {
    return null;
  }

  // Verificar se é admin (campo correto é 'type', não 'role')
  const { data: profile } = await supabase
    .from('users')
    .select('type')
    .eq('id', user.id)
    .single();

  if (profile?.type !== 'ADMIN') {
    return null;
  }

  return user;
}

// GET - Buscar lojas para aprovação e estatísticas
export async function GET(request: NextRequest) {
  try {
    const user = await verifyAdmin(request);
    if (!user) {
      return NextResponse.json(
        { error: 'Acesso negado. Apenas administradores podem acessar.' },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(request.url);
    const action = searchParams.get('action');
    const storeId = searchParams.get('storeId');
    const userId = searchParams.get('userId');

    // Estatísticas de aprovação
    if (action === 'stats') {
      const stats = await getApprovalStats();
      return NextResponse.json({ stats });
    }

    // Histórico de aprovação de uma loja específica
    if (action === 'history' && storeId) {
      const history = await getStoreApprovalHistory(storeId);
      return NextResponse.json({ history });
    }

    // Documentos obrigatórios
    if (action === 'required-documents') {
      const documents = await getRequiredDocuments();
      return NextResponse.json({ documents });
    }

    // Verificar completude dos documentos
    if (action === 'check-documents' && storeId) {
      const result = await checkDocumentCompleteness(storeId);
      return NextResponse.json(result);
    }

    // Obter notificações de status
    if (action === 'notifications') {
      const { notifications, unread_count } = await getStoreStatusNotifications({
        userId: searchParams.get('userId') || undefined,
        storeId: searchParams.get('storeId') || undefined,
        unreadOnly: searchParams.get('unreadOnly') === 'true',
        limit: parseInt(searchParams.get('limit') || '10')
      });
      
      return NextResponse.json({ notifications, unread_count });
    }

    // Buscar lojas para aprovação (padrão)
    const status = searchParams.get('status') || 'pending';
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const sortBy = searchParams.get('sortBy') || 'createdAt';
    const sortOrder = (searchParams.get('sortOrder') || 'desc') as 'asc' | 'desc';

    const result = await getStoresForApproval(status, page, limit, sortBy, sortOrder);
    return NextResponse.json(result);

  } catch (error) {
    console.error('Erro na API de aprovação de lojas:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}

// DELETE - Deletar notificações
export async function DELETE(request: NextRequest) {
  try {
    const user = await verifyAdmin(request);
    if (!user) {
      return NextResponse.json(
        { error: 'Acesso negado. Apenas administradores podem acessar.' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { action, notificationId, notificationIds } = body;

    // Deletar notificação individual
    if (action === 'delete-notification' && notificationId) {
      const result = await deleteNotification(notificationId);
      return NextResponse.json({
        message: 'Notificação deletada com sucesso',
        notification: result
      });
    }

    // Deletar múltiplas notificações
    if (action === 'delete-notifications' && notificationIds && Array.isArray(notificationIds)) {
      const result = await deleteNotifications(notificationIds);
      return NextResponse.json({
        message: 'Notificações deletadas com sucesso',
        result
      });
    }

    return NextResponse.json(
      { error: 'Ação não especificada ou parâmetros inválidos' },
      { status: 400 }
    );

  } catch (error) {
    console.error('Erro ao deletar notificações:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}

// POST - Aprovar/rejeitar loja ou moderação em massa
export async function POST(request: NextRequest) {
  try {
    const user = await verifyAdmin(request);
    if (!user) {
      return NextResponse.json(
        { error: 'Acesso negado. Apenas administradores podem acessar.' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { action, storeId, storeIds, moderationAction, reason, notes } = body;

    // Moderação em massa
    if (action === 'bulk-moderate' && storeIds && Array.isArray(storeIds)) {
      const result = await bulkModerateStores(
        storeIds,
        moderationAction,
        user.id,
        reason
      );
      return NextResponse.json({
        message: `${result.count} lojas foram ${moderationAction === 'approve' ? 'aprovadas' : moderationAction === 'reject' ? 'rejeitadas' : 'suspensas'} com sucesso`,
        result
      });
    }

    // Moderação individual
    if (action === 'moderate' && storeId && moderationAction) {
      const result = await moderateStore(
        storeId,
        moderationAction,
        user.id,
        reason,
        notes
      );
      return NextResponse.json({
        message: `Loja ${moderationAction === 'approve' ? 'aprovada' : moderationAction === 'reject' ? 'rejeitada' : 'suspensa'} com sucesso`,
        store: result
      });
    }

    return NextResponse.json(
      { error: 'Ação não especificada ou parâmetros inválidos' },
      { status: 400 }
    );

  } catch (error) {
    console.error('Erro ao processar moderação:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}

// PUT - Atualizar documentos ou marcar notificação como lida
export async function PUT(request: NextRequest) {
  try {
    const user = await verifyAdmin(request);
    if (!user) {
      return NextResponse.json(
        { error: 'Acesso negado. Apenas administradores podem acessar.' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { action, storeId, documents, notificationId } = body;

    // Atualizar documentos
    if (action === 'update-documents' && storeId && documents) {
      const result = await updateStoreDocuments(storeId, documents);
      return NextResponse.json({
        message: 'Documentos atualizados com sucesso',
        store: result
      });
    }

    // Marcar notificação como lida
    if (action === 'mark-notification-read' && notificationId) {
      const result = await markNotificationAsRead(notificationId);
      return NextResponse.json({
        message: 'Notificação marcada como lida',
        notification: result
      });
    }

    // Marcar múltiplas notificações como lidas
    if (action === 'mark-notifications-read') {
      const { notificationIds } = body;
      
      if (!notificationIds || !Array.isArray(notificationIds)) {
        return NextResponse.json(
          { error: 'IDs das notificações são obrigatórios' },
          { status: 400 }
        );
      }
      
      const result = await markNotificationsAsRead(notificationIds);
      return NextResponse.json({
        message: 'Notificações marcadas como lidas',
        result
      });
    }

    return NextResponse.json(
      { error: 'Ação não especificada ou parâmetros inválidos' },
      { status: 400 }
    );

  } catch (error) {
    console.error('Erro ao atualizar:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}