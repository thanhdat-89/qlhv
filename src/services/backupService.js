import { supabase } from '../lib/supabase';

const TABLES = ['classes', 'students', 'fees', 'extra_attendance', 'holidays'];

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
        const deleteOrder = ['extra_attendance', 'fees', 'holidays', 'students', 'classes'];
        for (const table of deleteOrder) {
            const { error } = await supabase
                .from(table)
                .delete()
                .neq('id', 'placeholder'); // Delete all records where id is not 'placeholder' (effectively all)

            if (error) {
                console.error(`Error clearing table ${table}:`, error);
                throw new Error(`Lỗi khi xóa dữ liệu cũ bảng ${table}: ${error.message}`);
            }
        }

        // 3. Restore data in correct dependency order (parents first)
        const insertOrder = ['classes', 'students', 'fees', 'extra_attendance', 'holidays'];
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
    }
};
