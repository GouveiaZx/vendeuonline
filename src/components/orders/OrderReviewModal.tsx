'use client';

import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Star } from '@/components/ui/star-rating';
import { useToast } from '@/components/ui/use-toast';
import { Order } from '@/types';

interface OrderReviewModalProps {
  order: Order | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onReviewSubmitted?: () => void;
}

interface ReviewData {
  rating: number;
  comment: string;
  items: Array<{
    productId: string;
    rating: number;
    comment: string;
  }>;
}

export function OrderReviewModal({ order, open, onOpenChange, onReviewSubmitted }: OrderReviewModalProps) {
  const [reviewData, setReviewData] = useState<ReviewData>({
    rating: 5,
    comment: '',
    items: []
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();

  React.useEffect(() => {
    if (order) {
      setReviewData({
        rating: 5,
        comment: '',
        items: order.items.map(item => ({
          productId: item.productId,
          rating: 5,
          comment: ''
        }))
      });
    }
  }, [order]);

  const handleSubmit = async () => {
    if (!order) return;

    if (reviewData.rating < 1) {
      toast({
        title: "Avaliação inválida",
        description: "Por favor, selecione uma nota de 1 a 5 estrelas.",
        variant: "destructive"
      });
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await fetch('/api/reviews', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          orderId: order.id,
          rating: reviewData.rating,
          comment: reviewData.comment,
          items: reviewData.items
        })
      });

      if (!response.ok) {
        throw new Error('Erro ao enviar avaliação');
      }

      toast({
        title: "Avaliação enviada!",
        description: "Obrigado por avaliar seu pedido."
      });

      onReviewSubmitted?.();
      onOpenChange(false);
    } catch (error) {
      toast({
        title: "Erro ao enviar avaliação",
        description: "Tente novamente mais tarde.",
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!order) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Avaliar Pedido #{order.id.slice(-8)}</DialogTitle>
          <DialogDescription>
            Compartilhe sua experiência com os produtos e serviço
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Avaliação Geral */}
          <div>
            <Label>Avaliação Geral do Pedido</Label>
            <div className="mt-2">
              <Star
                rating={reviewData.rating}
                onRatingChange={(rating) => setReviewData(prev => ({ ...prev, rating }))}
                size="lg"
              />
            </div>
          </div>

          {/* Comentário Geral */}
          <div>
            <Label htmlFor="general-comment">Comentário Geral</Label>
            <Textarea
              id="general-comment"
              placeholder="Conte-nos sobre sua experiência geral com este pedido..."
              value={reviewData.comment}
              onChange={(e) => setReviewData(prev => ({ ...prev, comment: e.target.value }))}
              className="mt-2"
              rows={3}
            />
          </div>

          <Separator />

          {/* Avaliação por Produto */}
          <div>
            <Label className="text-lg font-semibold">Avaliar Produtos Individualmente</Label>
            <div className="space-y-4 mt-4">
              {order.items.map((item, index) => (
                <div key={item.id} className="p-4 border rounded-lg">
                  <div className="flex items-start gap-4">
                    <div className="w-16 h-16 bg-gray-100 rounded border flex-shrink-0 overflow-hidden">
                      {item.product?.image ? (
                        <img
                          src={item.product.image}
                          alt={item.product.name}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-gray-400">
                          <span className="text-xs">IMG</span>
                        </div>
                      )}
                    </div>
                    
                    <div className="flex-1">
                      <h4 className="font-medium mb-2">{item.product?.name || 'Produto não encontrado'}</h4>
                      
                      <div className="space-y-3">
                        <div>
                          <Label className="text-sm">Nota para este produto</Label>
                          <div className="mt-1">
                            <Star
                              rating={reviewData.items[index]?.rating || 5}
                              onRatingChange={(rating) => {
                                const newItems = [...reviewData.items];
                                newItems[index] = { ...newItems[index], rating };
                                setReviewData(prev => ({ ...prev, items: newItems }));
                              }}
                              size="md"
                            />
                          </div>
                        </div>
                        
                        <div>
                          <Label className="text-sm">Comentário sobre o produto</Label>
                          <Textarea
                            placeholder="O que achou deste produto?"
                            value={reviewData.items[index]?.comment || ''}
                            onChange={(e) => {
                              const newItems = [...reviewData.items];
                              newItems[index] = { ...newItems[index], comment: e.target.value };
                              setReviewData(prev => ({ ...prev, items: newItems }));
                            }}
                            className="mt-1 text-sm"
                            rows={2}
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="flex justify-end gap-3 pt-4">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isSubmitting}
          >
            Cancelar
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={isSubmitting}
          >
            {isSubmitting ? "Enviando..." : "Enviar Avaliação"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}