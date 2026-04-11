// Import Supabase from CDN
import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm';

const SUPABASE_URL = 'YOUR_SUPABASE_URL_HERE'; // You will replace this in the UI or env
const SUPABASE_ANON_KEY = 'YOUR_SUPABASE_ANON_KEY_HERE'; // You will replace this in the UI

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

export const Auth = {
    async signIn(email, password) {
        const { data, error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        return data.user;
    },
    async signOut() {
        await supabase.auth.signOut();
    },
    async getSession() {
        const { data } = await supabase.auth.getSession();
        return data.session;
    }
};

export const ShopAPI = {
    async getAll() {
        const { data, error } = await supabase.from('shops').select('*').order('confidence_score', { ascending: false });
        if (error) throw error;
        return data;
    },
    async create(shop) {
        const { data, error } = await supabase.from('shops').insert([shop]).select();
        if (error) throw error;
        return data[0];
    },
    async update(id, updates) {
        const { data, error } = await supabase.from('shops').update(updates).eq('id', id).select();
        if (error) throw error;
        return data[0];
    },
    async delete(id) {
        const { error } = await supabase.from('shops').delete().eq('id', id);
        if (error) throw error;
    },
    async triggerSync() {
        // Call GitHub Action to update the static file
        await fetch(`https://api.github.com/repos/${window.location.hostname.split('.')[0]}/Gold-Prices/dispatches`, {
            method: 'POST',
            headers: {
                'Accept': 'application/vnd.github.v3+json',
                'Authorization': `token ${getGitHubToken()}` // Requires a PAT stored securely or handled via backend hook
            },
            body: JSON.stringify({ event_type: 'sync-shops' })
        }).catch(e => console.warn('Auto-sync trigger failed, manual commit might be needed', e));
    }
};

// Helper to get GitHub Token (In a real prod env, this calls a serverless function, not client side)
// For this static setup, we will rely on the DB being the source of truth and the site fetching from DB directly instead of JSON file for dynamic parts
function getGitHubToken() { return localStorage.getItem('gh_pat') || ''; }
