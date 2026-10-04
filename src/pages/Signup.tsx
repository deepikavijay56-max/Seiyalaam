import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Eye, EyeOff, Leaf, AlertCircle, CheckCircle } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';

export default function Signup() {
  const { signUp, user, loading, error, clearError } = useAuth();
  const { t } = useLanguage();
  const navigate = useNavigate();

  const [form, setForm] = useState({ displayName: '', email: '', password: '', confirmPassword: '' });
  const [showPass, setShowPass] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    if (user) navigate('/suggestions', { replace: true });
  }, [user, navigate]);

  useEffect(() => {
    return () => clearError();
  }, []);

  function validate() {
    const errs: Record<string, string> = {};
    if (!form.displayName.trim()) errs.displayName = 'Display name is required';
    else if (form.displayName.trim().length < 2) errs.displayName = 'Name must be at least 2 characters';
    if (!form.email.trim()) errs.email = 'Email is required';
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) errs.email = 'Enter a valid email address';
    if (!form.password) errs.password = 'Password is required';
    else if (form.password.length < 8) errs.password = 'Password must be at least 8 characters';
    if (form.password !== form.confirmPassword) errs.confirmPassword = 'Passwords do not match';
    setFieldErrors(errs);
    return Object.keys(errs).length === 0;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!validate()) return;
    await signUp(form.email, form.password, form.displayName);
    if (!error) setSuccess(true);
  }

  const field = (name: keyof typeof form) => ({
    value: form[name],
    onChange: (e: React.ChangeEvent<HTMLInputElement>) => {
      setForm(f => ({ ...f, [name]: e.target.value }));
      clearError();
    },
  });

  if (success && !error) {
    return (
      <div style={{ minHeight: 'calc(100vh - 64px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
        <div style={{
          maxWidth: 400, width: '100%',
          background: 'var(--surface-card)',
          border: '1px solid var(--surface-border)',
          borderRadius: 'var(--radius-lg)',
          padding: '40px 32px',
          textAlign: 'center',
        }}>
          <CheckCircle size={48} color="var(--color-green-500)" style={{ marginBottom: 16 }} />
          <h2 style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 20, marginBottom: 8 }}>Check your email</h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: 14, marginBottom: 24 }}>
            We sent a confirmation link to <strong>{form.email}</strong>. Click the link to activate your account.
          </p>
          <Link to="/login" style={{ color: 'var(--color-green-500)', fontSize: 14, fontWeight: 600 }}>Back to login</Link>
        </div>
      </div>
    );
  }

  return (
    <div style={{ minHeight: 'calc(100vh - 64px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '32px 16px', background: 'var(--surface-bg)' }}>
      <div style={{ width: '100%', maxWidth: 400, background: 'var(--surface-card)', border: '1px solid var(--surface-border)', borderRadius: 'var(--radius-lg)', padding: '40px 32px', boxShadow: 'var(--shadow-lg)' }}>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginBottom: 32 }}>
          <div style={{ width: 48, height: 48, borderRadius: 12, background: 'linear-gradient(135deg, var(--color-green-500), var(--color-teal-500))', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 12 }}>
            <Leaf size={24} color="white" />
          </div>
          <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 22, fontWeight: 700, margin: 0 }}>
            {t('auth.signup')}
          </h1>
          <p style={{ fontSize: 14, color: 'var(--text-muted)', margin: '4px 0 0' }}>Join Seiyalaam for free</p>
        </div>

        {error && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '12px 16px', background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 'var(--radius-md)', marginBottom: 20, color: 'var(--color-red-500)', fontSize: 14 }}>
            <AlertCircle size={16} />
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} noValidate>
          {[
            { id: 'signup-name',  name: 'displayName' as const, label: t('auth.displayName'), type: 'text',  autocomplete: 'name',     placeholder: 'Your name' },
            { id: 'signup-email', name: 'email' as const,        label: t('auth.email'),       type: 'email', autocomplete: 'email',    placeholder: 'you@example.com' },
          ].map(f => (
            <div key={f.id} style={{ marginBottom: 16 }}>
              <label htmlFor={f.id} style={{ display: 'block', fontSize: 13, fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 6 }}>
                {f.label}
              </label>
              <input
                id={f.id}
                type={f.type}
                autoComplete={f.autocomplete}
                placeholder={f.placeholder}
                {...field(f.name)}
                style={{
                  width: '100%', padding: '10px 14px', borderRadius: 'var(--radius-md)',
                  border: `1px solid ${fieldErrors[f.name] ? 'var(--color-red-500)' : 'var(--surface-border)'}`,
                  background: 'var(--surface-bg)', color: 'var(--text-primary)', fontSize: 14, outline: 'none', boxSizing: 'border-box',
                }}
                aria-invalid={!!fieldErrors[f.name]}
              />
              {fieldErrors[f.name] && <p style={{ fontSize: 12, color: 'var(--color-red-500)', margin: '4px 0 0' }}>{fieldErrors[f.name]}</p>}
            </div>
          ))}

          {/* Password */}
          <div style={{ marginBottom: 16 }}>
            <label htmlFor="signup-password" style={{ display: 'block', fontSize: 13, fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 6 }}>
              {t('auth.password')}
            </label>
            <div style={{ position: 'relative' }}>
              <input
                id="signup-password"
                type={showPass ? 'text' : 'password'}
                autoComplete="new-password"
                placeholder="Min. 8 characters"
                {...field('password')}
                style={{ width: '100%', padding: '10px 40px 10px 14px', borderRadius: 'var(--radius-md)', border: `1px solid ${fieldErrors.password ? 'var(--color-red-500)' : 'var(--surface-border)'}`, background: 'var(--surface-bg)', color: 'var(--text-primary)', fontSize: 14, outline: 'none', boxSizing: 'border-box' }}
                aria-invalid={!!fieldErrors.password}
              />
              <button type="button" onClick={() => setShowPass(v => !v)}
                style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', padding: 4 }}
                aria-label={showPass ? 'Hide password' : 'Show password'}>
                {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
            {fieldErrors.password && <p style={{ fontSize: 12, color: 'var(--color-red-500)', margin: '4px 0 0' }}>{fieldErrors.password}</p>}
          </div>

          <div style={{ marginBottom: 24 }}>
            <label htmlFor="signup-confirm" style={{ display: 'block', fontSize: 13, fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 6 }}>
              Confirm password
            </label>
            <input
              id="signup-confirm"
              type={showPass ? 'text' : 'password'}
              autoComplete="new-password"
              placeholder="Repeat your password"
              {...field('confirmPassword')}
              style={{ width: '100%', padding: '10px 14px', borderRadius: 'var(--radius-md)', border: `1px solid ${fieldErrors.confirmPassword ? 'var(--color-red-500)' : 'var(--surface-border)'}`, background: 'var(--surface-bg)', color: 'var(--text-primary)', fontSize: 14, outline: 'none', boxSizing: 'border-box' }}
              aria-invalid={!!fieldErrors.confirmPassword}
            />
            {fieldErrors.confirmPassword && <p style={{ fontSize: 12, color: 'var(--color-red-500)', margin: '4px 0 0' }}>{fieldErrors.confirmPassword}</p>}
          </div>

          <button type="submit" disabled={loading}
            style={{ width: '100%', padding: 12, borderRadius: 'var(--radius-md)', background: 'var(--color-green-500)', color: 'white', border: 'none', fontWeight: 700, fontSize: 15, cursor: loading ? 'not-allowed' : 'pointer', opacity: loading ? 0.7 : 1, minHeight: 44 }}>
            {loading ? 'Creating account…' : t('auth.signup')}
          </button>
        </form>

        <p style={{ textAlign: 'center', marginTop: 24, fontSize: 14, color: 'var(--text-secondary)' }}>
          {t('auth.hasAccount')}{' '}
          <Link to="/login" style={{ color: 'var(--color-green-500)', fontWeight: 600, textDecoration: 'none' }}>{t('auth.login')}</Link>
        </p>
      </div>
    </div>
  );
}
