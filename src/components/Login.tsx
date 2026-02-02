import { useState, useEffect } from 'react';
import { Network, ShieldCheck, Mail, Lock, User, AlertCircle, ArrowRight } from 'lucide-react';
import { useAuthStore } from '../store/authStore';

export default function Login() {
    const [mode, setMode] = useState<'login' | 'register'>('login');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [name, setName] = useState('');
    const [captchaToken, setCaptchaToken] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const login = useAuthStore((state) => state.login);
    const register = useAuthStore((state) => state.register);

    useEffect(() => {
        // @ts-ignore
        window.onTurnstileSuccess = (token: string) => {
            setCaptchaToken(token);
        };

        const script = document.createElement('script');
        script.src = "https://challenges.cloudflare.com/turnstile/v0/api.js";
        script.async = true;
        script.defer = true;
        document.body.appendChild(script);

        return () => {
            const existingScript = document.querySelector('script[src*="turnstile"]');
            if (existingScript) document.body.removeChild(existingScript);
            // @ts-ignore
            delete window.onTurnstileSuccess;
        };
    }, []);

    const handleGoogleLogin = () => {
        window.location.href = '/auth/google';
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);

        if (!captchaToken) {
            setError('Please complete the security check.');
            return;
        }

        setIsSubmitting(true);
        try {
            if (mode === 'login') {
                const res = await login({ email, password });
                if (!res.success) setError(res.error || 'Login failed');
            } else {
                const res = await register({ email, password, name, token: captchaToken });
                if (!res.success) setError(res.error || 'Registration failed');
            }
        } catch (err) {
            setError('An unexpected error occurred.');
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="login-container">
            <div className="login-card">
                <div className="brand-section">
                    <div className="brand-icon-large">
                        <Network size={40} color="#fff" />
                    </div>
                    <h1>Network Designer</h1>
                    <p>Building secure infrastructures, together.</p>
                </div>

                <div className="login-content">
                    <h2>{mode === 'login' ? 'Welcome Back' : 'Create Account'}</h2>
                    <p className="subtitle">
                        {mode === 'login' ? 'Please login to access your projects' : 'Start your journey with us today'}
                    </p>

                    {error && (
                        <div className="auth-error">
                            <AlertCircle size={14} />
                            <span>{error}</span>
                        </div>
                    )}

                    <form className="auth-form" onSubmit={handleSubmit}>
                        {mode === 'register' && (
                            <div className="form-group">
                                <label><User size={12} /> Full Name</label>
                                <input
                                    type="text"
                                    placeholder="John Doe"
                                    value={name}
                                    onChange={(e) => setName(e.target.value)}
                                    required
                                />
                            </div>
                        )}
                        <div className="form-group">
                            <label><Mail size={12} /> Email Address</label>
                            <input
                                type="email"
                                placeholder="name@company.com"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                required
                            />
                        </div>
                        <div className="form-group">
                            <label><Lock size={12} /> Password</label>
                            <input
                                type="password"
                                placeholder="••••••••"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                required
                            />
                        </div>

                        <div className="captcha-wrapper">
                            <div
                                className="cf-turnstile"
                                data-sitekey="1x00000000000000000000AA"
                                data-callback="onTurnstileSuccess"
                                data-theme="light"
                            ></div>
                        </div>

                        <button className="btn-auth-submit" type="submit" disabled={isSubmitting}>
                            {isSubmitting ? 'Processing...' : mode === 'login' ? 'Sign In' : 'Create Account'}
                            {!isSubmitting && <ArrowRight size={16} />}
                        </button>
                    </form>

                    <div className="divider">
                        <span>or continue with</span>
                    </div>

                    <button className="google-login-btn" onClick={handleGoogleLogin}>
                        <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" alt="Google" />
                        Google Account
                    </button>

                    <div className="auth-toggle">
                        {mode === 'login' ? (
                            <p>Need an account? <button type="button" onClick={() => setMode('register')}>Register now</button></p>
                        ) : (
                            <p>Already have an account? <button type="button" onClick={() => setMode('login')}>Sign in</button></p>
                        )}
                    </div>
                </div>

                <div className="login-footer">
                    <div className="security-note">
                        <ShieldCheck size={14} />
                        <span>Protected by Cloudflare Turnstile</span>
                    </div>
                </div>
            </div>
        </div>
    );
}
