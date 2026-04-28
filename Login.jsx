import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { authAPI } from '../utils/api';
import { setSession } from '../utils/auth';
import Card from '../components/Card';
import Logo from '../components/Logo';

export default function Login() {
  const navigate = useNavigate();
  const [role, setRole] = useState('student');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPwd, setShowPwd] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function doLogin(u, p, r) {
    const uname = u || username;
    const pwd = p || password;
    const rl = r || role;
    if (!uname || !pwd) { 
      setError('Please enter username and password.'); 
      return; 
    }
    setLoading(true);
    try {
      const res = await authAPI.login({ username: uname, password: pwd });
      const user = res.data;
      setSession(user);
      navigate(`/dashboard/${user.role}`);
    } catch (err) {
      setError(err.response?.data?.message || 'Invalid username or password.');
    }
    setLoading(false);
  }



  const loginContainerStyle = {
    minHeight: '100vh',
    background: 'linear-gradient(135deg, #F8FAFC 0%, #F1F5F9 100%)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '2rem',
    position: 'relative',
    overflow: 'hidden'
  };

  const bgOrbStyle = {
    position: 'absolute',
    borderRadius: '50%',
    opacity: 0.1,
    pointerEvents: 'none'
  };

  const cardContainerStyle = {
    width: '100%',
    maxWidth: '420px',
    zIndex: 10,
    animation: 'slideUp 0.5s ease'
  };

  return (
    <>
      <div style={loginContainerStyle}>
        {/* Background Orbs */}
        <div style={{ ...bgOrbStyle, width: '500px', height: '500px', background: 'linear-gradient(135deg, #3B82F6, #8B5CF6)', top: '-200px', left: '-200px' }} />
        <div style={{ ...bgOrbStyle, width: '400px', height: '400px', background: 'linear-gradient(135deg, #06B6D4, #3B82F6)', bottom: '-150px', right: '-150px' }} />

        <Card className="card-glass" style={cardContainerStyle}>
          {/* Header */}
          <div style={{ textAlign: 'center', marginBottom: '2.5rem' }}>
            <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '0.75rem' }}>
              <Logo size="lg" animated={true} variant="light" />
            </div>
            <h1 style={{ fontSize: '1.75rem', fontWeight: 900, color: '#1E293B', marginBottom: '0.25rem' }}>
              CSE Library
            </h1>
            <p style={{ fontSize: '0.95rem', color: '#64748B', fontWeight: 500 }}>
              Library Management System
            </p>
          </div>

          {/* Role Selection */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '0.75rem', marginBottom: '2rem' }}>
            {[
              { r: 'admin', icon: 'fas fa-shield-alt', label: 'Admin' },
              { r: 'librarian', icon: 'fas fa-book-reader', label: 'Librarian' },
              { r: 'student', icon: 'fas fa-user-graduate', label: 'Student' },
              { r: 'faculty', icon: 'fas fa-chalkboard-user', label: 'Faculty' }
            ].map(p => (
              <button
                key={p.r}
                onClick={() => { setRole(p.r); setError(''); }}
                style={{
                  padding: '0.9rem',
                  border: role === p.r ? '2px solid #3B82F6' : '2px solid #E2E8F0',
                  borderRadius: 'var(--radius-md)',
                  background: role === p.r ? 'linear-gradient(135deg, rgba(59, 130, 246, 0.1), rgba(139, 92, 246, 0.1))' : '#FFFFFF',
                  color: role === p.r ? '#3B82F6' : '#64748B',
                  fontWeight: 600,
                  fontSize: '0.85rem',
                  cursor: 'pointer',
                  transition: 'all 0.3s ease',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '0.4rem'
                }}
              >
                <i className={p.icon} style={{ fontSize: '1rem' }} />
                {p.label}
              </button>
            ))}
          </div>

          {/* Error Message */}
          {error && (
            <div
              style={{
                background: 'rgba(239, 68, 68, 0.1)',
                border: '1px solid rgba(239, 68, 68, 0.3)',
                borderRadius: 'var(--radius-md)',
                padding: '1rem',
                marginBottom: '1.5rem',
                display: 'flex',
                alignItems: 'center',
                gap: '0.75rem',
                color: '#DC2626',
                fontSize: '0.9rem',
                fontWeight: 500,
                animation: 'slideUp 0.3s ease'
              }}
            >
              <i className="fas fa-exclamation-circle" style={{ fontSize: '1.1rem', flexShrink: 0 }} />
              <span>{error}</span>
            </div>
          )}

          {/* Login Form */}
          <form onSubmit={(e) => { e.preventDefault(); doLogin(); }}>
            {/* Username Field */}
            <div style={{ marginBottom: '1.5rem' }}>
              <label style={{ display: 'block', fontSize: '0.9rem', fontWeight: 700, color: '#1E293B', marginBottom: '0.5rem' }}>
                <i className="fas fa-user" style={{ marginRight: '0.5rem', color: '#3B82F6' }} />
                Username
              </label>
              <input
                type="text"
                className="input"
                placeholder="Enter your username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                autoComplete="username"
                disabled={loading}
                style={{ fontSize: '1rem' }}
              />
            </div>

            {/* Password Field */}
            <div style={{ marginBottom: '2rem' }}>
              <label style={{ display: 'block', fontSize: '0.9rem', fontWeight: 700, color: '#1E293B', marginBottom: '0.5rem' }}>
                <i className="fas fa-lock" style={{ marginRight: '0.5rem', color: '#3B82F6' }} />
                Password
              </label>
              <div style={{ position: 'relative' }}>
                <input
                  type={showPwd ? 'text' : 'password'}
                  className="input"
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  autoComplete="current-password"
                  disabled={loading}
                  style={{ fontSize: '1rem' }}
                />
                <button
                  type="button"
                  onClick={() => setShowPwd(!showPwd)}
                  style={{
                    position: 'absolute',
                    right: '1rem',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                    color: '#64748B',
                    fontSize: '1rem',
                    transition: 'all 0.2s ease'
                  }}
                >
                  <i className={`fas ${showPwd ? 'fa-eye-slash' : 'fa-eye'}`} />
                </button>
              </div>
            </div>

            {/* Login Button */}
            <button
              type="submit"
              disabled={loading}
              style={{
                width: '100%',
                padding: '1rem',
                background: 'linear-gradient(135deg, #3B82F6, #8B5CF6)',
                color: 'white',
                border: 'none',
                borderRadius: 'var(--radius-md)',
                fontSize: '1rem',
                fontWeight: 700,
                cursor: loading ? 'not-allowed' : 'pointer',
                transition: 'all 0.3s ease',
                opacity: loading ? 0.7 : 1,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '0.75rem',
                marginBottom: '1rem'
              }}
              onMouseEnter={(e) => !loading && (e.target.style.transform = 'translateY(-2px)', e.target.style.boxShadow = '0 10px 25px rgba(59, 130, 246, 0.3)')}
              onMouseLeave={(e) => !loading && (e.target.style.transform = 'translateY(0)', e.target.style.boxShadow = 'none')}
            >
              <i className={`fas ${loading ? 'fa-spinner fa-spin' : 'fa-sign-in-alt'}`} />
              {loading ? 'Signing in...' : 'Sign In'}
            </button>
          </form>

          {/* Back to Home */}
          <Link
            to="/"
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              marginTop: '1.5rem',
              color: '#3B82F6',
              fontSize: '0.9rem',
              fontWeight: 600,
              textDecoration: 'none',
              transition: 'all 0.2s ease'
            }}
            onMouseEnter={(e) => e.target.style.opacity = '0.7'}
            onMouseLeave={(e) => e.target.style.opacity = '1'}
          >
            <i className="fas fa-arrow-left" style={{ marginRight: '0.5rem' }} /> Back to Home
          </Link>
        </Card>
      </div>
    </>
  );
}
