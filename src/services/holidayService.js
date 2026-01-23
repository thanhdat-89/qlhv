import { supabase } from '../lib/supabase';

export const holidayService = {
    getAll: async () => {
        if (!supabase) return [];
        const { data, error } = await supabase
            .from('holidays')
            .select('*')
            .order('date', { ascending: true });
        if (error) throw error;

        return (data || []).map(h => ({
            id: h.id,
            date: h.date,
            endDate: h.end_date || h.date,
            description: h.description,
            type: h.type,
            classId: h.class_id,
            createdAt: h.created_at
        }));
    },

    create: async (holiday) => {
        if (!supabase) throw new Error('Cấu hình database chưa hoàn thiện.');
        const dbHoliday = {
            id: holiday.id,
            date: holiday.date,
            end_date: holiday.endDate || holiday.date,
            description: holiday.description,
            type: holiday.type,
            class_id: holiday.classId || null // Ensure empty string becomes null
        };
        const { data, error } = await supabase
            .from('holidays')
            .insert(dbHoliday)
            .select()
            .single();
        if (error) {
            console.error('Supabase Error (create holiday):', error);
            throw error;
        }
        return {
            ...holiday,
            createdAt: data.created_at
        };
    },

    update: async (id, holiday) => {
        if (!supabase) throw new Error('Cấu hình database chưa hoàn thiện.');
        const dbHoliday = {};
        if (holiday.date !== undefined) dbHoliday.date = holiday.date;
        if (holiday.endDate !== undefined) dbHoliday.end_date = holiday.endDate;
        if (holiday.description !== undefined) dbHoliday.description = holiday.description;
        if (holiday.type !== undefined) dbHoliday.type = holiday.type;
        if (holiday.classId !== undefined) dbHoliday.class_id = holiday.classId || null;

        const { data, error } = await supabase
            .from('holidays')
            .update(dbHoliday)
            .eq('id', id)
            .select()
            .single();
        if (error) {
            console.error('Supabase Error (update holiday):', error);
            throw error;
        }
        return {
            ...holiday,
            createdAt: data.created_at
        };
    },

    delete: async (id) => {
        if (!supabase) throw new Error('Cấu hình database chưa hoàn thiện.');
        const { error } = await supabase
            .from('holidays')
            .delete()
            .eq('id', id);
        if (error) {
            console.error('Supabase Error (delete holiday):', error);
            throw error;
        }
        return id;
    }
};
