import { supabase } from '../lib/supabase';

export const messageService = {
    getAll: async () => {
        const { data, error } = await supabase
            .from('messages')
            .select('*')
            .order('created_at', { ascending: false });

        if (error) throw error;
        return data || [];
    },

    add: async (message) => {
        const { data, error } = await supabase
            .from('messages')
            .insert([{
                author: message.author || 'Admin',
                content: message.content,
                created_at: new Date().toISOString()
            }])
            .select()
            .single();

        if (error) throw error;
        return data;
    },

    delete: async (id) => {
        const { error } = await supabase
            .from('messages')
            .delete()
            .eq('id', id);

        if (error) throw error;
        return true;
    }
};
