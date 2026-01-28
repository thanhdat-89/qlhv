import { supabase } from '../lib/supabase';

export const promotionService = {
    getAll: async () => {
        if (!supabase) return [];
        const { data, error } = await supabase
            .from('promotions')
            .select('*');
        if (error) throw error;

        return (data || []).map(p => ({
            id: p.id,
            classId: p.class_id,
            month: p.month, // Format: YYYY-MM
            discountRate: parseFloat(p.discount_rate),
            description: p.description
        }));
    },

    create: async (promotion) => {
        if (!supabase) throw new Error('Cấu hình database chưa hoàn thiện.');
        const dbPromotion = {
            class_id: promotion.classId,
            month: promotion.month,
            discount_rate: promotion.discountRate,
            description: promotion.description
        };
        const { data, error } = await supabase
            .from('promotions')
            .insert(dbPromotion)
            .select()
            .single();
        if (error) throw error;
        return {
            id: data.id,
            ...promotion
        };
    },

    update: async (id, promotion) => {
        const dbPromotion = {
            class_id: promotion.classId,
            month: promotion.month,
            discount_rate: promotion.discountRate,
            description: promotion.description
        };
        const { error } = await supabase
            .from('promotions')
            .update(dbPromotion)
            .eq('id', id);
        if (error) throw error;
        return promotion;
    },

    delete: async (id) => {
        const { error } = await supabase
            .from('promotions')
            .delete()
            .eq('id', id);
        if (error) throw error;
        return id;
    }
};
