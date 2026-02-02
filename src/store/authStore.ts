import { create } from 'zustand';
import axios from 'axios';

axios.defaults.withCredentials = true;
// Set base URL relative to current host for consistency
axios.defaults.baseURL = window.location.origin;

interface User {
    id: number;
    google_id: string;
    email: string;
    name: string;
    avatar_url: string;
}

interface AuthState {
    user: User | null;
    isLoading: boolean;
    checkAuth: () => Promise<void>;
    login: (credentials: any) => Promise<{ success: boolean; error?: string }>;
    register: (userData: any) => Promise<{ success: boolean; error?: string }>;
    logout: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set) => ({
    user: null,
    isLoading: true,
    checkAuth: async () => {
        try {
            const res = await axios.get('/auth/me');
            // Ensure we got a valid user object, not a proxy error string/HTML
            if (res.data && typeof res.data === 'object' && res.data.id) {
                set({ user: res.data, isLoading: false });
            } else {
                set({ user: null, isLoading: false });
            }
        } catch (err) {
            set({ user: null, isLoading: false });
        }
    },
    login: async (credentials) => {
        try {
            const res = await axios.post('/auth/login', credentials);
            set({ user: res.data });
            return { success: true };
        } catch (err: any) {
            return { success: false, error: err.response?.data?.error || 'Login failed' };
        }
    },
    register: async (userData) => {
        try {
            const res = await axios.post('/auth/register', userData);
            set({ user: res.data });
            return { success: true };
        } catch (err: any) {
            return { success: false, error: err.response?.data?.error || 'Registration failed' };
        }
    },
    logout: async () => {
        try {
            await axios.post('/auth/logout');
        } catch (err) {
            console.error('Logout failed', err);
        } finally {
            // Always clear local state to avoid being "stuck"
            set({ user: null });
        }
    }
}));
