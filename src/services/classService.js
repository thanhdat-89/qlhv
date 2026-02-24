import { supabase } from '../lib/supabase';

export const classService = {
    getAll: async () => {
        if (!supabase) return [];
        const { data, error } = await supabase
            .from('classes')
            .select('*');
        if (error) throw error;

        return (data || []).map(c => ({
            id: c.id,
            name: c.name,
            schedule: c.schedule,
            feePerSession: c.fee_per_session
        }));
    },

    create: async (newClass) => {
        const dbClass = {
            id: newClass.id,
            name: newClass.name,
            schedule: newClass.schedule,
            fee_per_session: newClass.feePerSession
        };
        const { error } = await supabase
            .from('classes')
            .insert(dbClass);
        if (error) throw error;
        return newClass;
    },

    update: async (id, data) => {
        const dbData = {};
        if (data.name !== undefined) dbData.name = data.name;
        if (data.schedule !== undefined) dbData.schedule = data.schedule;
        if (data.feePerSession !== undefined) dbData.fee_per_session = data.feePerSession;

        const { error } = await supabase
            .from('classes')
            .update(dbData)
            .eq('id', id);
        if (error) throw error;
        return data;
    },

    delete: async (id) => {
        const { error } = await supabase
            .from('classes')
            .delete()
            .eq('id', id);
        if (error) throw error;
        return id;
    }
};
