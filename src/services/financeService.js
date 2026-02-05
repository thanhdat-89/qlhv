import { supabase } from '../lib/supabase';

// Helper: Generate dates from recurring pattern
const generateRecurringDates = (pattern) => {
    if (!pattern) return [];

    const dates = [];
    const { frequency, startDate, endDate } = pattern;

    if (frequency === 'weekly') {
        const { daysOfWeek } = pattern; // Array of day numbers: 0=CN, 1=T2, ..., 6=T7
        const start = new Date(startDate);
        const end = new Date(endDate);

        let current = new Date(start);
        while (current <= end) {
            if (daysOfWeek.includes(current.getDay())) {
                const dateStr = current.toISOString().split('T')[0];
                dates.push(dateStr);
            }
            current.setDate(current.getDate() + 1);
        }
    } else if (frequency === 'monthly') {
        const { dayOfMonth } = pattern; // Day of month (1-31)
        const start = new Date(startDate);
        const end = new Date(endDate);

        let current = new Date(start.getFullYear(), start.getMonth(), dayOfMonth);
        if (current < start) {
            current.setMonth(current.getMonth() + 1);
        }

        while (current <= end) {
            const dateStr = current.toISOString().split('T')[0];
            dates.push(dateStr);
            current.setMonth(current.getMonth() + 1);
        }
    }

    return dates;
};

// Helper: Create change history entry
const createChangeEntry = (action, user, details) => {
    return {
        timestamp: new Date().toISOString(),
        action, // 'created', 'updated', 'deleted'
        user: user || 'admin',
        details: details || {}
    };
};

export const financeService = {
    getFees: async () => {
        if (!supabase) return [];
        const { data, error } = await supabase
            .from('fees')
            .select('*');
        if (error) throw error;

        return (data || []).map(f => ({
            id: f.id,
            studentId: f.student_id,
            amount: f.amount,
            date: f.date,
            method: f.method,
            note: f.note
        }));
    },

    addFee: async (fee) => {
        if (!supabase) throw new Error('Cấu hình database chưa hoàn thiện.');
        const dbFee = {
            id: fee.id,
            student_id: fee.studentId,
            amount: fee.amount,
            date: fee.date,
            method: fee.method,
            note: fee.note
        };
        const { error } = await supabase
            .from('fees')
            .insert(dbFee);
        if (error) throw error;
        return fee;
    },

    deleteFee: async (id) => {
        if (!supabase) throw new Error('Cấu hình database chưa hoàn thiện.');
        const { error } = await supabase
            .from('fees')
            .delete()
            .eq('id', id);
        if (error) throw error;
        return id;
    },

    getAttendance: async () => {
        if (!supabase) return [];
        const { data, error } = await supabase
            .from('extra_attendance')
            .select('*');
        if (error) throw error;

        return (data || []).map(a => ({
            id: a.id,
            studentId: a.student_id,
            date: a.date,
            fee: a.fee,
            notes: a.notes || '',
            // New fields
            isRecurring: a.is_recurring || false,
            recurringPattern: a.recurring_pattern || null,
            createdBy: a.created_by || 'legacy',
            createdAt: a.created_at || new Date().toISOString(),
            updatedBy: a.updated_by || null,
            updatedAt: a.updated_at || null,
            changeHistory: a.change_history || [],
            // Legacy fields (keep for backward compatibility but don't use)
            status: a.status,
            isExcused: a.is_excused
        }));
    },

    addAttendance: async (record) => {
        if (!supabase) throw new Error('Cấu hình database chưa hoàn thiện.');

        const now = new Date().toISOString();
        const user = record.createdBy || 'admin';
        const changeHistory = [createChangeEntry('created', user, { fee: record.fee, notes: record.notes })];

        const dbRecord = {
            id: record.id,
            student_id: record.studentId,
            date: record.date,
            fee: record.fee,
            notes: record.notes || '',
            is_recurring: record.isRecurring || false,
            recurring_pattern: record.recurringPattern || null,
            created_by: user,
            created_at: now,
            change_history: changeHistory
        };

        const { data, error } = await supabase
            .from('extra_attendance')
            .insert(dbRecord)
            .select()
            .single();

        if (error) {
            console.error('Supabase Error (addAttendance):', error);
            throw error;
        }

        return {
            id: data.id,
            studentId: data.student_id,
            date: data.date,
            fee: data.fee,
            notes: data.notes || '',
            isRecurring: data.is_recurring || false,
            recurringPattern: data.recurring_pattern || null,
            createdBy: data.created_by,
            createdAt: data.created_at,
            updatedBy: data.updated_by,
            updatedAt: data.updated_at,
            changeHistory: data.change_history || []
        };
    },

    bulkAddAttendance: async (records) => {
        if (!supabase) throw new Error('Cấu hình database chưa hoàn thiện.');

        const now = new Date().toISOString();
        const user = records[0]?.createdBy || 'admin';

        const dbRecords = records.map(r => {
            const changeHistory = [createChangeEntry('created', user, { fee: r.fee, notes: r.notes })];
            return {
                id: r.id,
                student_id: r.studentId,
                date: r.date,
                fee: r.fee,
                notes: r.notes || '',
                is_recurring: r.isRecurring || false,
                recurring_pattern: r.recurringPattern || null,
                created_by: user,
                created_at: now,
                change_history: changeHistory
            };
        });

        const { data, error } = await supabase
            .from('extra_attendance')
            .insert(dbRecords)
            .select();

        if (error) {
            console.error('Supabase Error (bulkAddAttendance):', error);
            throw error;
        }

        return data.map(d => ({
            id: d.id,
            studentId: d.student_id,
            date: d.date,
            fee: d.fee,
            notes: d.notes || '',
            isRecurring: d.is_recurring || false,
            recurringPattern: d.recurring_pattern || null,
            createdBy: d.created_by,
            createdAt: d.created_at,
            updatedBy: d.updated_by,
            updatedAt: d.updated_at,
            changeHistory: d.change_history || []
        }));
    },

    updateAttendance: async (id, data, user = 'admin') => {
        if (!supabase) throw new Error('Cấu hình database chưa hoàn thiện.');

        // Get current record to build change history
        const { data: current, error: fetchError } = await supabase
            .from('extra_attendance')
            .select('*')
            .eq('id', id)
            .single();

        if (fetchError) throw fetchError;

        const now = new Date().toISOString();
        const changes = {};

        // Track what changed
        if (data.date !== undefined && data.date !== current.date) changes.date = { from: current.date, to: data.date };
        if (data.fee !== undefined && data.fee !== current.fee) changes.fee = { from: current.fee, to: data.fee };
        if (data.notes !== undefined && data.notes !== current.notes) changes.notes = { from: current.notes, to: data.notes };

        const newHistoryEntry = createChangeEntry('updated', user, changes);
        const updatedHistory = [...(current.change_history || []), newHistoryEntry];

        const dbData = {
            updated_by: user,
            updated_at: now,
            change_history: updatedHistory
        };

        if (data.date !== undefined) dbData.date = data.date;
        if (data.fee !== undefined) dbData.fee = data.fee;
        if (data.notes !== undefined) dbData.notes = data.notes;
        if (data.recurringPattern !== undefined) dbData.recurring_pattern = data.recurringPattern;

        const { error } = await supabase
            .from('extra_attendance')
            .update(dbData)
            .eq('id', id);

        if (error) throw error;
        return { ...data, updatedBy: user, updatedAt: now, changeHistory: updatedHistory };
    },

    deleteAttendance: async (id) => {
        if (!supabase) throw new Error('Cấu hình database chưa hoàn thiện.');
        const { error } = await supabase
            .from('extra_attendance')
            .delete()
            .eq('id', id);
        if (error) throw error;
        return id;
    },

    bulkDeleteAttendance: async (ids) => {
        if (!supabase) throw new Error('Cấu hình database chưa hoàn thiện.');
        if (!ids || ids.length === 0) return [];

        const { error } = await supabase
            .from('extra_attendance')
            .delete()
            .in('id', ids);
        if (error) throw error;
        return ids;
    },

    deleteByStudent: async (studentId) => {
        if (!supabase) throw new Error('Cấu hình database chưa hoàn thiện.');

        // Delete all fees for this student
        const { error: feeError } = await supabase
            .from('fees')
            .delete()
            .eq('student_id', studentId);
        if (feeError) throw feeError;

        // Delete all attendance for this student
        const { error: attError } = await supabase
            .from('extra_attendance')
            .delete()
            .eq('student_id', studentId);
        if (attError) throw attError;

        return studentId;
    },

    // Export helper for use in other modules
    generateRecurringDates
};
