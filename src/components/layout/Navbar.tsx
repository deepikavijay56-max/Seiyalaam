import { useState } from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import {
  Menu,
  X,
  User,
  LogOut,
  LayoutDashboard,
  Package,
  Lightbulb,
  Wrench,
  PlusCircle,
  Sparkles,
  Users
} from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';

export default function Navbar() {
  const { user, profile, signOut } = useAuth();
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);
  const [avatarOpen, setAvatarOpen] = useState(false);

  // Both public and authenticated links
  const navLinks = [
    { to: '/projects',   icon: <Lightbulb size={16} />, label: 'Projects' },
    { to: '/kandupidi',  icon: <Sparkles size={16} />,  label: 'Kandupidi' },
    { to: '/community',  icon: <Users size={16} />,     label: 'Community' },
    { to: '/teardown',   icon: <Wrench size={16} />,    label: 'Teardown' },
    ...(user
      ? [
          { to: '/inventory',   icon: <Package size={16} />,   label: 'Inventory' },
          { to: '/dashboard',   icon: <LayoutDashboard size={16} />, label: 'Dashboard' },
        ]
      : [
          { to: '/dashboard',   icon: <LayoutDashboard size={16} />, label: 'Impact' },
        ]),
  ];

  async function handleSignOut() {
    setAvatarOpen(false);
    await signOut();
    navigate('/');
  }

  return (
    <nav
      style={{
        position: 'sticky',
        top: 0,
        zIndex: 100,
        background: 'rgba(255, 255, 255, 0.88)',
        backdropFilter: 'blur(16px)',
        WebkitBackdropFilter: 'blur(16px)',
        borderBottom: '1px solid var(--surface-border)',
        boxShadow: '0 4px 20px -2px rgba(0, 0, 0, 0.03)',
      }}
    >
      <div
        className="page-container"
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          height: 68,
          gap: 12,
        }}
      >
        {/* Brand Logo & Subtitle */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexShrink: 0 }}>
          <Link
            to="/"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 10,
              textDecoration: 'none',
              flexShrink: 0,
            }}
          >
            <img
              src="/logo.png"
              alt="Seiyalaam"
              className="navbar-brand-logo"
              style={{
                height: 40,
                width: 'auto',
                objectFit: 'contain',
                flexShrink: 0,
                display: 'block',
              }}
            />

            <div style={{ display: 'flex', flexDirection: 'column' }}>
              <span
                style={{
                  fontFamily: 'var(--font-display)',
                  fontWeight: 800,
                  fontSize: 19,
                  color: 'var(--text-primary)',
                  letterSpacing: '-0.03em',
                  lineHeight: 1.1,
                  whiteSpace: 'nowrap',
                }}
              >
                Seiyalaam
              </span>
              <span
                style={{
                  fontSize: 10,
                  fontFamily: 'var(--font-mono)',
                  color: 'var(--color-green-700)',
                  fontWeight: 600,
                  letterSpacing: '0.04em',
                  whiteSpace: 'nowrap',
                }}
              >
                E-WASTE HARDWARE REBIRTH
              </span>
            </div>
          </Link>

          {/* Live Telemetry Pill (Desktop) */}
          <div
            className="hidden-mobile telemetry-pill"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 6,
              padding: '4px 10px',
              borderRadius: 'var(--radius-full)',
              background: 'var(--surface-tint)',
              border: '1px solid rgba(16, 185, 129, 0.2)',
              fontSize: 11,
              fontFamily: 'var(--font-mono)',
              color: 'var(--color-green-800)',
              marginLeft: 4,
              whiteSpace: 'nowrap',
              flexShrink: 0,
            }}
          >
            <span
              style={{
                width: 6,
                height: 6,
                borderRadius: '50%',
                background: '#10B981',
                boxShadow: '0 0 6px #10B981',
                flexShrink: 0,
              }}
            />
            <span>1.8t Avoided</span>
          </div>
        </div>

        {/* Center Nav Links */}
        <div
          className="desktop-nav"
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 2,
            background: 'var(--surface-bg)',
            padding: '3px 4px',
            borderRadius: 'var(--radius-full)',
            border: '1px solid var(--surface-border)',
            flexShrink: 0,
          }}
        >
          {navLinks.map(link => (
            <NavLink
              key={link.to}
              to={link.to}
              style={({ isActive }) => ({
                display: 'inline-flex',
                alignItems: 'center',
                gap: 5,
                padding: '6px 11px',
                borderRadius: 'var(--radius-full)',
                fontSize: 13,
                fontWeight: isActive ? 700 : 500,
                color: isActive ? 'var(--color-green-700)' : 'var(--text-secondary)',
                background: isActive ? 'var(--surface-card)' : 'transparent',
                boxShadow: isActive ? 'var(--shadow-sm)' : 'none',
                textDecoration: 'none',
                transition: 'all 0.2s ease',
                whiteSpace: 'nowrap',
                flexShrink: 0,
              })}
            >
              {link.icon}
              <span>{link.label}</span>
            </NavLink>
          ))}
        </div>

        {/* Right Controls: CTAs, Profile */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
          {/* Quick Action: Log Scavenged Parts */}
          <Link
            to={user ? '/inventory' : '/login'}
            className="hidden-mobile scavenge-btn"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 6,
              padding: '0 14px',
              height: 36,
              borderRadius: 'var(--radius-full)',
              background: 'linear-gradient(135deg, var(--color-green-500), var(--color-green-600))',
              color: 'white',
              fontSize: 13,
              fontWeight: 700,
              textDecoration: 'none',
              boxShadow: '0 2px 10px rgba(16, 185, 129, 0.25)',
              transition: 'all 0.2s ease',
              whiteSpace: 'nowrap',
              flexShrink: 0,
              boxSizing: 'border-box',
            }}
          >
            <PlusCircle size={15} />
            <span>Scavenge Part</span>
          </Link>

          {/* User Account / Login */}
          {user ? (
            <div style={{ position: 'relative', flexShrink: 0 }}>
              <button
                onClick={() => setAvatarOpen(v => !v)}
                style={{
                  width: 36,
                  height: 36,
                  borderRadius: '50%',
                  background: 'linear-gradient(135deg, var(--color-green-500), var(--color-teal-500))',
                  border: '2px solid white',
                  cursor: 'pointer',
                  color: 'white',
                  fontSize: 14,
                  fontWeight: 700,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  boxShadow: 'var(--shadow-sm)',
                  boxSizing: 'border-box',
                }}
                aria-label="User menu"
                aria-expanded={avatarOpen}
              >
                {profile?.display_name?.[0]?.toUpperCase() ?? <User size={16} />}
              </button>

              {avatarOpen && (
                <div
                  style={{
                    position: 'absolute',
                    right: 0,
                    top: 46,
                    background: 'var(--surface-card)',
                    border: '1px solid var(--surface-border)',
                    borderRadius: 'var(--radius-lg)',
                    boxShadow: 'var(--shadow-xl)',
                    minWidth: 210,
                    overflow: 'hidden',
                    zIndex: 200,
                  }}
                >
                  <div style={{ padding: '14px 18px', borderBottom: '1px solid var(--surface-border)', background: 'var(--surface-bg)' }}>
                    <p style={{ margin: 0, fontWeight: 700, fontSize: 14, color: 'var(--text-primary)' }}>
                      {profile?.display_name ?? 'Maker'}
                    </p>
                    <p style={{ margin: '2px 0 0', fontSize: 12, color: 'var(--text-muted)' }}>
                      {user.email}
                    </p>
                  </div>
                  <Link
                    to="/profile"
                    onClick={() => setAvatarOpen(false)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 8,
                      padding: '12px 18px',
                      textDecoration: 'none',
                      color: 'var(--text-secondary)',
                      fontSize: 14,
                      fontWeight: 500,
                    }}
                  >
                    <User size={15} /> Profile
                  </Link>
                  <button
                    onClick={handleSignOut}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 8,
                      padding: '12px 18px',
                      width: '100%',
                      border: 'none',
                      borderTop: '1px solid var(--surface-border)',
                      background: 'none',
                      cursor: 'pointer',
                      color: 'var(--color-red-500)',
                      fontSize: 14,
                      fontWeight: 600,
                    }}
                  >
                    <LogOut size={15} /> Logout
                  </button>
                </div>
              )}
            </div>
          ) : (
            <div style={{ display: 'flex', gap: 6, alignItems: 'center', flexShrink: 0 }}>
              <Link
                to="/login"
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  height: 36,
                  padding: '0 14px',
                  borderRadius: 'var(--radius-full)',
                  border: '1px solid var(--surface-border)',
                  background: 'transparent',
                  color: 'var(--text-primary)',
                  textDecoration: 'none',
                  fontSize: 13,
                  fontWeight: 600,
                  whiteSpace: 'nowrap',
                  flexShrink: 0,
                  boxSizing: 'border-box',
                }}
              >
                Login
              </Link>
              <Link
                to="/signup"
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  height: 36,
                  padding: '0 14px',
                  borderRadius: 'var(--radius-full)',
                  background: 'var(--color-slate-900)',
                  color: 'white',
                  textDecoration: 'none',
                  fontSize: 13,
                  fontWeight: 600,
                  whiteSpace: 'nowrap',
                  flexShrink: 0,
                  boxSizing: 'border-box',
                }}
              >
                Sign Up
              </Link>
            </div>
          )}

          {/* Mobile hamburger button */}
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
              flexShrink: 0,
            }}
            aria-label="Toggle menu"
          >
            {menuOpen ? <X size={22} /> : <Menu size={22} />}
          </button>
        </div>
      </div>

      {/* Mobile Drawer */}
      {menuOpen && (
        <div
          style={{
            padding: '16px 20px 24px',
            borderTop: '1px solid var(--surface-border)',
            display: 'flex',
            flexDirection: 'column',
            gap: 8,
            background: 'var(--surface-card)',
          }}
        >
          {navLinks.map(link => (
            <NavLink
              key={link.to}
              to={link.to}
              onClick={() => setMenuOpen(false)}
              style={({ isActive }) => ({
                display: 'flex',
                alignItems: 'center',
                gap: 10,
                padding: '10px 14px',
                borderRadius: 'var(--radius-md)',
                fontSize: 14,
                fontWeight: isActive ? 700 : 500,
                color: isActive ? 'var(--color-green-700)' : 'var(--text-secondary)',
                background: isActive ? 'var(--surface-tint)' : 'transparent',
                textDecoration: 'none',
              })}
            >
              {link.icon}
              {link.label}
            </NavLink>
          ))}

          <Link
            to={user ? '/inventory' : '/login'}
            onClick={() => setMenuOpen(false)}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 8,
              marginTop: 8,
              padding: '12px',
              borderRadius: 'var(--radius-md)',
              background: 'var(--color-green-500)',
              color: 'white',
              fontSize: 14,
              fontWeight: 700,
              textDecoration: 'none',
            }}
          >
            <PlusCircle size={16} />
            <span>Add Scavenged Component</span>
          </Link>
        </div>
      )}

      <style>{`
        @media (max-width: 1220px) {
          .telemetry-pill { display: none !important; }
        }
        @media (max-width: 1100px) {
          .scavenge-btn { display: none !important; }
        }
        @media (max-width: 980px) {
          .desktop-nav { display: none !important; }
          .hidden-mobile { display: none !important; }
          .mobile-menu-btn { display: flex !important; }
        }
      `}</style>
    </nav>
  );
}
