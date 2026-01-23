import { supabase } from '../lib/supabase';

export const studentService = {
    getAll: async () => {
        if (!supabase) return [];
        const { data, error } = await supabase
            .from('students')
            .select('*');
        if (error) throw error;

        // Map snake_case database fields to camelCase used in the app
        return (data || []).map(s => ({
            id: s.id,
            name: s.name,
            birthYear: s.birth_year,
            phone: s.phone,
            enrollDate: s.enroll_date,
            leaveDate: s.leave_date,
            classId: s.class_id,
            status: s.status,
            discountRate: parseFloat(s.discount_rate)
        }));
    },

    create: async (student) => {
        if (!supabase) throw new Error('Cấu hình database chưa hoàn thiện.');
        const dbStudent = {
            id: student.id,
            name: student.name,
            birth_year: student.birthYear,
            phone: student.phone,
            enroll_date: student.enrollDate,
            leave_date: student.leaveDate,
            class_id: student.classId,
            status: student.status,
            discount_rate: student.discountRate
        };
        const { data, error } = await supabase
            .from('students')
            .insert(dbStudent)
            .select()
            .single();
        if (error) throw error;
        return student;
    },

    update: async (id, data) => {
        const dbData = {};
        if (data.name !== undefined) dbData.name = data.name;
        if (data.birthYear !== undefined) dbData.birth_year = data.birthYear;
        if (data.phone !== undefined) dbData.phone = data.phone;
        if (data.enrollDate !== undefined) dbData.enroll_date = data.enrollDate;
        if (data.leaveDate !== undefined) dbData.leave_date = data.leaveDate;
        if (data.classId !== undefined) dbData.class_id = data.classId;
        if (data.status !== undefined) dbData.status = data.status;
        if (data.discountRate !== undefined) dbData.discount_rate = data.discountRate;

        const { error } = await supabase
            .from('students')
            .update(dbData)
            .eq('id', id);
        if (error) throw error;
        return data;
    },

    delete: async (id) => {
        const { error } = await supabase
            .from('students')
            .delete()
            .eq('id', id);
        if (error) throw error;
        return id;
    },

    bulkCreate: async (newStudents) => {
        const dbStudents = newStudents.map(s => ({
            id: s.id,
            name: s.name,
            birth_year: s.birthYear,
            phone: s.phone,
            enroll_date: s.enrollDate,
            leave_date: s.leaveDate,
            class_id: s.classId,
            status: s.status,
            discount_rate: s.discountRate
        }));
        const { data, error } = await supabase
            .from('students')
            .insert(dbStudents);
        if (error) throw error;
        return newStudents;
    }
};
