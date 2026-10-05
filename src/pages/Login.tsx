import { useState, useEffect } from 'react';
import type { FormEvent } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Eye, EyeOff, Leaf, AlertCircle } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { useLanguage } from '../hooks/useLanguage';

export default function Login() {
  const { signIn, user, loading, error, clearError } = useAuth();
  const { t } = useLanguage();
  const navigate = useNavigate();
  const location = useLocation();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  const fromPath = (location.state as { from?: { pathname?: string } })?.from?.pathname || '/dashboard';

  useEffect(() => {
    if (user) {
      navigate(fromPath, { replace: true });
    }
  }, [user, navigate, fromPath]);

  useEffect(() => {
    return () => {
      clearError();
    };
  }, [clearError]);

  function validate() {
    const errs: Record<string, string> = {};
    if (!email.trim()) errs.email = 'Email is required';
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) errs.email = 'Enter a valid email';
    if (!password) errs.password = 'Password is required';
    else if (password.length < 6) errs.password = 'Password must be at least 6 characters';
    setFieldErrors(errs);
    return Object.keys(errs).length === 0;
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!validate()) return;
    await signIn(email, password);
  }

  return (
    <div style={{
      minHeight: 'calc(100vh - 64px)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '32px 16px',
      background: 'var(--surface-bg)',
    }}>
      <div style={{
        width: '100%',
        maxWidth: 400,
        background: 'var(--surface-card)',
        border: '1px solid var(--surface-border)',
        borderRadius: 'var(--radius-lg)',
        padding: '40px 32px',
        boxShadow: 'var(--shadow-lg)',
      }}>
        {/* Logo */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginBottom: 32 }}>
          <div style={{
            width: 48, height: 48, borderRadius: 12,
            background: 'linear-gradient(135deg, var(--color-green-500), var(--color-teal-500))',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            marginBottom: 12,
          }}>
            <Leaf size={24} color="white" />
          </div>
          <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 22, fontWeight: 700, margin: 0, color: 'var(--text-primary)' }}>
            {t('auth.login')}
          </h1>
          <p style={{ fontSize: 14, color: 'var(--text-muted)', margin: '4px 0 0' }}>
            Welcome back to Seiyalaam
          </p>
        </div>

        {/* Auth error */}
        {error && (
          <div style={{
            display: 'flex', alignItems: 'center', gap: 8,
            padding: '12px 16px',
            background: '#fef2f2',
            border: '1px solid #fecaca',
            borderRadius: 'var(--radius-md)',
            marginBottom: 20,
            color: 'var(--color-red-500)',
            fontSize: 14,
          }}>
            <AlertCircle size={16} />
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} noValidate>
          {/* Email */}
          <div style={{ marginBottom: 16 }}>
            <label htmlFor="login-email" style={{ display: 'block', fontSize: 13, fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 6 }}>
              {t('auth.email')}
            </label>
            <input
              id="login-email"
              type="email"
              value={email}
              onChange={e => { setEmail(e.target.value); clearError(); }}
              autoComplete="email"
              placeholder="you@example.com"
              style={{
                width: '100%',
                padding: '10px 14px',
                borderRadius: 'var(--radius-md)',
                border: `1px solid ${fieldErrors.email ? 'var(--color-red-500)' : 'var(--surface-border)'}`,
                background: 'var(--surface-bg)',
                color: 'var(--text-primary)',
                fontSize: 14,
                outline: 'none',
                boxSizing: 'border-box',
                transition: 'border-color 0.2s',
              }}
              aria-describedby={fieldErrors.email ? 'email-error' : undefined}
              aria-invalid={!!fieldErrors.email}
            />
            {fieldErrors.email && (
              <p id="email-error" style={{ fontSize: 12, color: 'var(--color-red-500)', margin: '4px 0 0' }}>
                {fieldErrors.email}
              </p>
            )}
          </div>

          {/* Password */}
          <div style={{ marginBottom: 8 }}>
            <label htmlFor="login-password" style={{ display: 'block', fontSize: 13, fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 6 }}>
              {t('auth.password')}
            </label>
            <div style={{ position: 'relative' }}>
              <input
                id="login-password"
                type={showPass ? 'text' : 'password'}
                value={password}
                onChange={e => { setPassword(e.target.value); clearError(); }}
                autoComplete="current-password"
                placeholder="••••••••"
                style={{
                  width: '100%',
                  padding: '10px 40px 10px 14px',
                  borderRadius: 'var(--radius-md)',
                  border: `1px solid ${fieldErrors.password ? 'var(--color-red-500)' : 'var(--surface-border)'}`,
                  background: 'var(--surface-bg)',
                  color: 'var(--text-primary)',
                  fontSize: 14,
                  outline: 'none',
                  boxSizing: 'border-box',
                }}
                aria-describedby={fieldErrors.password ? 'password-error' : undefined}
                aria-invalid={!!fieldErrors.password}
              />
              <button
                type="button"
                onClick={() => setShowPass(v => !v)}
                style={{
                  position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)',
                  background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)',
                  padding: 4,
                }}
                aria-label={showPass ? 'Hide password' : 'Show password'}
              >
                {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
            {fieldErrors.password && (
              <p id="password-error" style={{ fontSize: 12, color: 'var(--color-red-500)', margin: '4px 0 0' }}>
                {fieldErrors.password}
              </p>
            )}
          </div>

          <div style={{ textAlign: 'right', marginBottom: 24 }}>
            <Link to="/reset-password" style={{ fontSize: 12, color: 'var(--color-green-500)', textDecoration: 'none' }}>
              {t('auth.forgot')}
            </Link>
          </div>

          <button
            type="submit"
            disabled={loading}
            style={{
              width: '100%',
              padding: '12px',
              borderRadius: 'var(--radius-md)',
              background: 'var(--color-green-500)',
              color: 'white',
              border: 'none',
              fontWeight: 700,
              fontSize: 15,
              cursor: loading ? 'not-allowed' : 'pointer',
              opacity: loading ? 0.7 : 1,
              transition: 'opacity 0.2s',
              minHeight: 44,
            }}
          >
            {loading ? 'Signing in…' : t('auth.login')}
          </button>
        </form>

        <p style={{ textAlign: 'center', marginTop: 24, fontSize: 14, color: 'var(--text-secondary)' }}>
          {t('auth.noAccount')}{' '}
          <Link to="/signup" style={{ color: 'var(--color-green-500)', fontWeight: 600, textDecoration: 'none' }}>
            {t('auth.signup')}
          </Link>
        </p>
      </div>
    </div>
  );
}
