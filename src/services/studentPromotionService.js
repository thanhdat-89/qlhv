import { supabase } from '../lib/supabase';

export const studentPromotionService = {
    getAll: async () => {
        if (!supabase) return [];
        const { data, error } = await supabase
            .from('student_promotions')
            .select('*')
            .order('month', { ascending: false });
        if (error) throw error;

        return (data || []).map(p => ({
            id: p.id,
            studentId: p.student_id,
            month: p.month,
            discountRate: parseFloat(p.discount_rate) || 0,
            discountAmount: parseFloat(p.discount_amount) || 0,
            discountType: p.discount_type || 'percent',
            description: p.description
        }));
    },

    create: async (promotion) => {
        if (!supabase) throw new Error('Cấu hình database chưa hoàn thiện.');
        const { data, error } = await supabase
            .from('student_promotions')
            .insert({
                student_id: promotion.studentId,
                month: promotion.month,
                discount_rate: promotion.discountType === 'percent' ? promotion.discountRate : 0,
                discount_amount: promotion.discountType === 'amount' ? promotion.discountAmount : 0,
                discount_type: promotion.discountType || 'percent',
                description: promotion.description
            })
            .select()
            .single();
        if (error) throw error;
        return { id: data.id, ...promotion };
    },

    update: async (id, promotion) => {
        if (!supabase) throw new Error('Cấu hình database chưa hoàn thiện.');
        const { error } = await supabase
            .from('student_promotions')
            .update({
                student_id: promotion.studentId,
                month: promotion.month,
                discount_rate: promotion.discountType === 'percent' ? promotion.discountRate : 0,
                discount_amount: promotion.discountType === 'amount' ? promotion.discountAmount : 0,
                discount_type: promotion.discountType || 'percent',
                description: promotion.description
            })
            .eq('id', id);
        if (error) throw error;
        return promotion;
    },

    delete: async (id) => {
        if (!supabase) throw new Error('Cấu hình database chưa hoàn thiện.');
        const { error } = await supabase
            .from('student_promotions')
            .delete()
            .eq('id', id);
        if (error) throw error;
        return id;
    }
};
