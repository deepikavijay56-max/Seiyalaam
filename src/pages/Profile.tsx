import { User, Mail, Globe, Shield, LogOut } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';

export default function Profile() {
  const { user, profile, signOut } = useAuth();
  const { language, setLanguage, t } = useLanguage();
  const navigate = useNavigate();

  async function handleLogout() {
    await signOut();
    navigate('/');
  }

  return (
    <div style={{ background: 'var(--surface-bg)', minHeight: 'calc(100vh - 64px)', padding: '40px 0 80px' }}>
      <div className="page-container" style={{ maxWidth: 640 }}>
        <div style={{
          background: 'var(--surface-card)',
          border: '1px solid var(--surface-border)',
          borderRadius: 'var(--radius-lg)',
          padding: '32px 28px',
          boxShadow: 'var(--shadow-sm)',
        }}>
          {/* Header */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 28, paddingBottom: 24, borderBottom: '1px solid var(--surface-border)' }}>
            <div style={{
              width: 56,
              height: 56,
              borderRadius: '50%',
              background: 'linear-gradient(135deg, var(--color-green-400), var(--color-teal-500))',
              color: 'white',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 22,
              fontWeight: 700,
            }}>
              {profile?.display_name?.[0]?.toUpperCase() ?? <User size={28} />}
            </div>
            <div>
              <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 22, fontWeight: 700, margin: 0 }}>
                {profile?.display_name || 'Maker Profile'}
              </h2>
              <span style={{ fontSize: 13, color: 'var(--text-muted)' }}>
                Member of Seiyalaam Maker Network
              </span>
            </div>
          </div>

          {/* Details list */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16, marginBottom: 32 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '12px 16px', background: 'var(--surface-bg)', borderRadius: 'var(--radius-md)' }}>
              <Mail size={18} color="var(--text-muted)" />
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>Email address</div>
                <div style={{ fontSize: 14, fontWeight: 600 }}>{user?.email ?? 'Not signed in'}</div>
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '12px 16px', background: 'var(--surface-bg)', borderRadius: 'var(--radius-md)' }}>
              <Globe size={18} color="var(--text-muted)" />
              <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div>
                  <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>Preferred Language</div>
                  <div style={{ fontSize: 14, fontWeight: 600 }}>{language === 'ta' ? 'தமிழ் (Tamil)' : 'English'}</div>
                </div>
                <button
                  type="button"
                  onClick={() => setLanguage(language === 'en' ? 'ta' : 'en')}
                  style={{
                    padding: '6px 12px',
                    borderRadius: 'var(--radius-md)',
                    border: '1px solid var(--surface-border)',
                    background: 'var(--surface-card)',
                    fontSize: 13,
                    fontWeight: 600,
                    cursor: 'pointer',
                  }}
                >
                  Switch to {language === 'en' ? 'தமிழ்' : 'English'}
                </button>
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '12px 16px', background: 'var(--surface-bg)', borderRadius: 'var(--radius-md)' }}>
              <Shield size={18} color="var(--text-muted)" />
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>Role</div>
                <div style={{ fontSize: 14, fontWeight: 600, textTransform: 'capitalize' }}>{profile?.role ?? 'Maker'}</div>
              </div>
            </div>
          </div>

          {/* Logout */}
          <button
            type="button"
            onClick={handleLogout}
            style={{
              width: '100%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 8,
              padding: '12px 16px',
              borderRadius: 'var(--radius-md)',
              border: '1px solid #fee2e2',
              background: '#fef2f2',
              color: 'var(--color-red-500)',
              fontWeight: 600,
              fontSize: 14,
              cursor: 'pointer',
            }}
          >
            <LogOut size={16} />
            {t('nav.logout')}
          </button>
        </div>
      </div>
    </div>
  );
}
