import { supabase } from '../lib/supabase';

const TABLES = ['classes', 'students', 'fees', 'extra_attendance', 'holidays', 'promotions'];

export const backupService = {
    exportData: async () => {
        if (!supabase) throw new Error('Cấu hình database chưa hoàn thiện.');

        const backup = {};

        for (const table of TABLES) {
            const { data, error } = await supabase
                .from(table)
                .select('*');

            if (error) {
                console.error(`Error exporting table ${table}:`, error);
                throw new Error(`Lỗi khi xuất dữ liệu bảng ${table}: ${error.message}`);
            }

            backup[table] = data || [];
        }

        return backup;
    },

    importData: async (backup) => {
        if (!supabase) throw new Error('Cấu hình database chưa hoàn thiện.');

        // 1. Validate backup structure
        for (const table of TABLES) {
            if (!Array.isArray(backup[table])) {
                throw new Error(`Dữ liệu sao lưu không hợp lệ: Thiếu bảng ${table}`);
            }
        }

        // 2. Clear existing data in correct dependency order (children first)
        const deleteOrder = ['extra_attendance', 'fees', 'holidays', 'promotions', 'students', 'classes'];
        for (const table of deleteOrder) {
            const { error } = await supabase
                .from(table)
                .delete()
                .gte('id', 0); // Delete all records where id >= 0 (effectively all records)

            if (error) {
                console.error(`Error clearing table ${table}:`, error);
                throw new Error(`Lỗi khi xóa dữ liệu cũ bảng ${table}: ${error.message}`);
            }
        }

        // 3. Restore data in correct dependency order (parents first)
        const insertOrder = ['classes', 'students', 'fees', 'extra_attendance', 'holidays', 'promotions'];
        for (const table of insertOrder) {
            const data = backup[table];
            if (data.length === 0) continue;

            const { error } = await supabase
                .from(table)
                .insert(data);

            if (error) {
                console.error(`Error restoring table ${table}:`, error);
                throw new Error(`Lỗi khi khôi phục dữ liệu bảng ${table}: ${error.message}`);
            }
        }

        return true;
    },

    getBackups: async () => {
        const { data, error } = await supabase
            .from('backups')
            .select('id, created_at, filename')
            .order('created_at', { ascending: false });

        if (error) {
            console.error('Error fetching backups:', error);
            return [];
        }
        return data;
    },

    downloadBackup: async (id) => {
        const { data, error } = await supabase
            .from('backups')
            .select('data, filename')
            .eq('id', id)
            .single();

        if (error) throw error;
        return data;
    },

    createAutomatedBackup: async () => {
        const data = await backupService.exportData();
        const now = new Date();
        const filename = `auto_backup_${now.getFullYear()}_${now.getMonth() + 1}_${now.getDate()}.json`;

        const { error } = await supabase
            .from('backups')
            .insert({
                data,
                filename,
                created_at: now.toISOString()
            });

        if (error) throw error;

        // Cleanup: Delete backups older than 28 days
        const twentyEightDaysAgo = new Date(now.getTime() - (28 * 24 * 60 * 60 * 1000)).toISOString();
        await supabase
            .from('backups')
            .delete()
            .lt('created_at', twentyEightDaysAgo);

        return true;
    }
};
