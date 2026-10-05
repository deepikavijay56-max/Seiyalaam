import { useState } from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import { Menu, X, Leaf, User, LogOut, LayoutDashboard, Package, Lightbulb, Wrench } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useLanguage } from '../../context/LanguageContext';

export default function Navbar() {
  const { user, profile, signOut } = useAuth();
  const { language, setLanguage, t } = useLanguage();
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);
  const [avatarOpen, setAvatarOpen] = useState(false);

  const navLinks = user
    ? [
        { to: '/inventory',   icon: <Package size={16} />,   label: t('nav.inventory') },
        { to: '/suggestions', icon: <Lightbulb size={16} />, label: t('nav.suggestions') },
        { to: '/teardown',    icon: <Wrench size={16} />,    label: t('nav.teardown') },
        { to: '/dashboard',   icon: <LayoutDashboard size={16} />, label: t('nav.dashboard') },
      ]
    : [];

  async function handleSignOut() {
    setAvatarOpen(false);
    await signOut();
    navigate('/');
  }

  const activeStyle = {
    color: 'var(--color-green-500)',
    fontWeight: 600,
  };
  const linkStyle = {
    display: 'flex',
    alignItems: 'center',
    gap: 6,
    padding: '6px 10px',
    borderRadius: 'var(--radius-md)',
    fontSize: 14,
    color: 'var(--text-secondary)',
    textDecoration: 'none',
    transition: 'color 0.2s, background 0.2s',
  };

  return (
    <nav style={{
      position: 'sticky',
      top: 0,
      zIndex: 100,
      background: 'var(--surface-card)',
      borderBottom: '1px solid var(--surface-border)',
      backdropFilter: 'blur(12px)',
    }}>
      <div className="page-container" style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        height: 64,
      }}>
        {/* Logo */}
        <Link to="/" style={{ display: 'flex', alignItems: 'center', gap: 8, textDecoration: 'none' }}>
          <div style={{
            width: 32,
            height: 32,
            borderRadius: 8,
            background: 'linear-gradient(135deg, var(--color-green-500), var(--color-teal-500))',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}>
            <Leaf size={18} color="white" />
          </div>
          <span style={{
            fontFamily: 'var(--font-display)',
            fontWeight: 700,
            fontSize: 18,
            color: 'var(--text-primary)',
            letterSpacing: '-0.02em',
          }}>
            Seiyalaam
          </span>
        </Link>

        {/* Desktop nav links */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 4 }} className="desktop-nav">
          {navLinks.map(link => (
            <NavLink
              key={link.to}
              to={link.to}
              style={({ isActive }) => ({
                ...linkStyle,
                ...(isActive ? activeStyle : {}),
              })}
            >
              {link.icon}
              {link.label}
            </NavLink>
          ))}
        </div>

        {/* Right controls */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          {/* Language toggle */}
          <button
            onClick={() => setLanguage(language === 'en' ? 'ta' : 'en')}
            style={{
              padding: '4px 10px',
              borderRadius: 'var(--radius-full)',
              border: '1px solid var(--surface-border)',
              background: 'var(--surface-tint)',
              fontSize: 13,
              fontWeight: 600,
              cursor: 'pointer',
              color: 'var(--text-primary)',
              transition: 'background 0.2s',
            }}
            aria-label="Toggle language"
            title={language === 'en' ? 'Switch to Tamil' : 'Switch to English'}
          >
            {language === 'en' ? 'தமிழ்' : 'EN'}
          </button>

          {user ? (
            <div style={{ position: 'relative' }}>
              <button
                onClick={() => setAvatarOpen(v => !v)}
                style={{
                  width: 36,
                  height: 36,
                  borderRadius: '50%',
                  background: 'linear-gradient(135deg, var(--color-green-400), var(--color-teal-500))',
                  border: 'none',
                  cursor: 'pointer',
                  color: 'white',
                  fontSize: 14,
                  fontWeight: 600,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
                aria-label="User menu"
                aria-expanded={avatarOpen}
              >
                {profile?.display_name?.[0]?.toUpperCase() ?? <User size={16} />}
              </button>

              {avatarOpen && (
                <div style={{
                  position: 'absolute',
                  right: 0,
                  top: 44,
                  background: 'var(--surface-card)',
                  border: '1px solid var(--surface-border)',
                  borderRadius: 'var(--radius-lg)',
                  boxShadow: 'var(--shadow-lg)',
                  minWidth: 180,
                  overflow: 'hidden',
                  zIndex: 200,
                }}>
                  <div style={{ padding: '12px 16px', borderBottom: '1px solid var(--surface-border)' }}>
                    <p style={{ margin: 0, fontWeight: 600, fontSize: 14, color: 'var(--text-primary)' }}>
                      {profile?.display_name}
                    </p>
                    <p style={{ margin: '2px 0 0', fontSize: 12, color: 'var(--text-muted)' }}>
                      {user.email}
                    </p>
                  </div>
                  <Link
                    to="/profile"
                    onClick={() => setAvatarOpen(false)}
                    style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 16px', textDecoration: 'none', color: 'var(--text-secondary)', fontSize: 14 }}
                  >
                    <User size={14} /> {t('nav.profile')}
                  </Link>
                  <button
                    onClick={handleSignOut}
                    style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 16px', width: '100%', border: 'none', background: 'none', cursor: 'pointer', color: 'var(--color-red-500)', fontSize: 14 }}
                  >
                    <LogOut size={14} /> {t('nav.logout')}
                  </button>
                </div>
              )}
            </div>
          ) : (
            <div style={{ display: 'flex', gap: 8 }}>
              <Link to="/login" style={{
                padding: '8px 16px',
                borderRadius: 'var(--radius-md)',
                border: '1px solid var(--surface-border)',
                background: 'transparent',
                color: 'var(--text-primary)',
                textDecoration: 'none',
                fontSize: 14,
                fontWeight: 500,
              }}>
                {t('nav.login')}
              </Link>
              <Link to="/signup" style={{
                padding: '8px 16px',
                borderRadius: 'var(--radius-md)',
                background: 'var(--color-green-500)',
                color: 'white',
                textDecoration: 'none',
                fontSize: 14,
                fontWeight: 600,
              }}>
                {t('nav.signup')}
              </Link>
            </div>
          )}

          {/* Mobile menu toggle */}
          <button
            className="mobile-menu-btn"
            onClick={() => setMenuOpen(v => !v)}
            style={{
              display: 'none',
              padding: 8,
              border: 'none',
              background: 'none',
              cursor: 'pointer',
              color: 'var(--text-primary)',
              borderRadius: 8,
            }}
            aria-label="Toggle menu"
            aria-expanded={menuOpen}
          >
            {menuOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>
      </div>

      {/* Mobile nav */}
      {menuOpen && (
        <div style={{
          padding: '12px 16px 16px',
          borderTop: '1px solid var(--surface-border)',
          display: 'flex',
          flexDirection: 'column',
          gap: 4,
        }}>
          {navLinks.map(link => (
            <NavLink
              key={link.to}
              to={link.to}
              onClick={() => setMenuOpen(false)}
              style={({ isActive }) => ({
                ...linkStyle,
                padding: '10px 12px',
                ...(isActive ? { ...activeStyle, background: 'var(--surface-tint)' } : {}),
              })}
            >
              {link.icon}
              {link.label}
            </NavLink>
          ))}
        </div>
      )}

      <style>{`
        @media (max-width: 768px) {
          .desktop-nav { display: none !important; }
          .mobile-menu-btn { display: flex !important; }
        }
      `}</style>
    </nav>
  );
}
