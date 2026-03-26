import { supabase } from './supabaseClient';
import { AppData } from '../types';

const TABLE_NAME = 'rental_tracker_data';

export const fetchAppData = async (): Promise<AppData | null> => {
    if (!supabase) return null;

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return null;

    const { data, error } = await supabase
        .from(TABLE_NAME)
        .select('content')
        .eq('user_id', user.id)
        .single();

    if (error) {
        if (error.code === 'PGRST116') {
            // No record found, not an error
            return null;
        }
        console.error('Supabase fetch error:', error);
        return null;
    }

    return data.content as AppData;
};

export const saveAppData = async (data: AppData): Promise<boolean> => {
    if (!supabase) return false;

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return false;

    const { error } = await supabase
        .from(TABLE_NAME)
        .upsert({ user_id: user.id, content: data, updated_at: new Date().toISOString() });

    if (error) {
        console.error('Supabase save error:', error);
        return false;
    }

    return true;
};
