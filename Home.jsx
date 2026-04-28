import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { booksAPI, statsAPI } from '../utils/api';
import { getSession } from '../utils/auth';
import Button from '../components/Button';
import Card from '../components/Card';
import Logo from '../components/Logo';

const BOOK_EMOJIS = {
  'Programming':'💻','Computer Science':'🖥️','AI / Machine Learning':'🤖',
  'Databases':'🗄️','Mathematics':'📐','Systems':'⚙️','Networking':'🌐',
  'Algorithms':'🔢','Software Engineering':'🛠️','Physics':'⚛️','default':'📖'
};

export default function Home() {
  const navigate = useNavigate();
  const session = getSession();
  const [books, setBooks] = useState([]);
  const [stats, setStats] = useState({ totalBooks:0, availableCopies:0, totalUsers:0, activeIssues:0, students:0 });
  const [searchQ, setSearchQ] = useState('');
  const [searchOpen, setSearchOpen] = useState(false);
  const searchRef = useRef();

  useEffect(() => {
    if (session) navigate(`/dashboard/${session.role}`);
  }, [session, navigate]);

  useEffect(() => {
    booksAPI.getAll().then(r => setBooks(r.data)).catch(() => {});
    statsAPI.get().then(r => setStats(r.data)).catch(() => {});
  }, []);

  useEffect(() => {
    const handler = (e) => {
      if (searchRef.current && !searchRef.current.contains(e.target)) setSearchOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const searchResults = searchQ.trim()
    ? books.filter(b =>
        b.title.toLowerCase().includes(searchQ.toLowerCase()) ||
        b.author.toLowerCase().includes(searchQ.toLowerCase()) ||
        (b.isbn && b.isbn.includes(searchQ))
      ).slice(0, 5)
    : [];

  // Handle click outside search
  // eslint-disable-next-line no-unused-vars
  const handleSearchClose = () => setSearchOpen(false);

  return (
    <>
      <div style={{ minHeight: '100vh', background: 'linear-gradient(135deg, #0F172A 0%, #1E293B 50%, #0F172A 100%)' }}>
        {/* Navigation Header */}
        <header
          style={{
            position: 'sticky',
            top: 0,
            zIndex: 100,
            background: 'rgba(15, 23, 42, 0.7)',
            backdropFilter: 'blur(20px)',
            borderBottom: '1px solid rgba(148, 163, 184, 0.1)',
            boxShadow: '0 4px 32px rgba(0, 0, 0, 0.3)'
          }}
        >
          <div style={{ maxWidth: '1400px', margin: '0 auto', padding: '0 2rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', height: '70px' }}>
            {/* Logo */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', fontSize: '1.5rem', fontWeight: 900 }}>
              <Logo size="md" animated={true} variant="gradient" />
              <div style={{ color: '#E2E8F0' }}>
                CSE<span style={{ background: 'linear-gradient(135deg, #60A5FA, #A78BFA)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>Library</span>
              </div>
            </div>

            {/* Navigation Links */}
            <nav style={{ display: 'flex', gap: '2rem', alignItems: 'center' }}>
              <a href="#features" style={{ fontSize: '0.95rem', fontWeight: 500, color: '#94A3B8', transition: 'all 0.2s ease', textDecoration: 'none' }} onMouseEnter={e => (e.target.style.color = '#60A5FA')} onMouseLeave={e => (e.target.style.color = '#94A3B8')}>
                Services
              </a>
              <a href="#portals" style={{ fontSize: '0.95rem', fontWeight: 500, color: '#94A3B8', transition: 'all 0.2s ease', textDecoration: 'none' }} onMouseEnter={e => (e.target.style.color = '#60A5FA')} onMouseLeave={e => (e.target.style.color = '#94A3B8')}>
                Dashboards
              </a>
              <a href="#books" style={{ fontSize: '0.95rem', fontWeight: 500, color: '#94A3B8', transition: 'all 0.2s ease', textDecoration: 'none' }} onMouseEnter={e => (e.target.style.color = '#60A5FA')} onMouseLeave={e => (e.target.style.color = '#94A3B8')}>
                Books
              </a>
              <Link to="/login">
                <Button variant="primary" size="sm">
                  <i className="fas fa-sign-in-alt" /> Login
                </Button>
              </Link>
            </nav>
          </div>
        </header>

        {/* Hero Section */}
        <section style={{ maxWidth: '1400px', margin: '0 auto', padding: '6rem 2rem', position: 'relative' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '4rem', alignItems: 'center', animation: 'fadeIn 0.8s ease' }}>
            {/* Content */}
            <div>
              <div
                style={{
                  display: 'inline-block',
                  padding: '0.6rem 1.2rem',
                  borderRadius: '24px',
                  background: 'linear-gradient(135deg, rgba(59, 130, 246, 0.2), rgba(139, 92, 246, 0.2))',
                  border: '1px solid rgba(96, 165, 250, 0.3)',
                  marginBottom: '2rem',
                  fontSize: '0.85rem',
                  fontWeight: 600,
                  color: '#60A5FA'
                }}
              >
                <i className="fas fa-sparkles" style={{ marginRight: '0.5rem' }} /> Smart Academic Library Platform
              </div>

              <h1 style={{ fontSize: '4rem', fontWeight: 900, color: '#F1F5F9', lineHeight: 1.15, marginBottom: '1.5rem', letterSpacing: '-0.02em' }}>
                CSE
                <br />
                <span style={{ background: 'linear-gradient(135deg, #60A5FA, #A78BFA)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>
                  Library
                </span>
              </h1>

              <p style={{ fontSize: '1.15rem', color: '#CBD5E1', marginBottom: '2.5rem', lineHeight: 1.8, maxWidth: '550px' }}>
                The VEMU CSE Library supports innovation, research, and academic excellence with a rich collection of books, journals, and digital resources.
              </p>

              <div style={{ display: 'flex', gap: '1rem', marginBottom: '3rem' }}>
                <Link to="/login">
                  <Button variant="primary" size="lg">
                    <i className="fas fa-rocket" /> Get Started
                  </Button>
                </Link>
                <a href="#features">
                  <Button variant="outline" size="lg">
                    <i className="fas fa-arrow-down" /> Learn More
                  </Button>
                </a>
              </div>

              {/* Stats Grid */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '2rem' }}>
                <div style={{ borderLeft: '2px solid #60A5FA', paddingLeft: '1.5rem' }}>
                  <div style={{ fontSize: '2rem', fontWeight: 900, color: '#60A5FA', marginBottom: '0.5rem' }}>{stats.totalBooks}</div>
                  <div style={{ fontSize: '0.85rem', color: '#94A3B8' }}>Total Books</div>
                </div>
                <div style={{ borderLeft: '2px solid #34D399', paddingLeft: '1.5rem' }}>
                  <div style={{ fontSize: '2rem', fontWeight: 900, color: '#34D399', marginBottom: '0.5rem' }}>{stats.availableCopies}</div>
                  <div style={{ fontSize: '0.85rem', color: '#94A3B8' }}>Available Now</div>
                </div>
                <div style={{ borderLeft: '2px solid #A78BFA', paddingLeft: '1.5rem' }}>
                  <div style={{ fontSize: '2rem', fontWeight: 900, color: '#A78BFA', marginBottom: '0.5rem' }}>{stats.activeIssues}</div>
                  <div style={{ fontSize: '0.85rem', color: '#94A3B8' }}>Issued</div>
                </div>
              </div>
            </div>

            {/* Search Card */}
            <Card style={{ background: 'linear-gradient(135deg, rgba(30, 41, 59, 0.6), rgba(15, 23, 42, 0.8))', backdropFilter: 'blur(20px)', border: '1px solid rgba(148, 163, 184, 0.2)', animation: 'slideUp 0.8s ease 0.2s both', transform: 'translateY(0)', boxShadow: '0 16px 64px rgba(0, 0, 0, 0.5)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '2rem' }}>
                <div style={{ fontSize: '1.5rem', color: '#60A5FA' }}>
                  <i className="fas fa-search" />
                </div>
                <h3 style={{ fontSize: '1.15rem', fontWeight: 700, color: '#F1F5F9' }}>Search Books</h3>
              </div>

              <div ref={searchRef} style={{ position: 'relative', marginBottom: '1.5rem' }}>
                <input
                  type="text"
                  className="input"
                  placeholder="Find books, authors, or categories..."
                  value={searchQ}
                  onChange={e => {
                    setSearchQ(e.target.value);
                    setSearchOpen(true);
                  }}
                  onFocus={() => setSearchOpen(true)}
                  style={{ background: 'rgba(71, 85, 105, 0.5)', border: '1px solid rgba(148, 163, 184, 0.2)', color: '#E2E8F0', transition: 'all 0.3s ease' }}
                  onMouseEnter={e => (e.currentTarget.style.background = 'rgba(71, 85, 105, 0.7)')}
                  onMouseLeave={e => (e.currentTarget.style.background = 'rgba(71, 85, 105, 0.5)')}
                />

                {/* Search Results Dropdown */}
                {searchOpen && searchQ && (
                  <div
                    style={{
                      position: 'absolute',
                      top: '100%',
                      left: 0,
                      right: 0,
                      marginTop: '0.5rem',
                      background: 'rgba(30, 41, 59, 0.95)',
                      border: '1px solid rgba(148, 163, 184, 0.2)',
                      borderRadius: '12px',
                      boxShadow: '0 20px 48px rgba(0, 0, 0, 0.6)',
                      maxHeight: '300px',
                      overflowY: 'auto',
                      zIndex: 100,
                      backdropFilter: 'blur(10px)'
                    }}
                  >
                    {searchResults.length === 0 ? (
                      <div style={{ padding: '2rem', textAlign: 'center', color: '#94A3B8' }}>
                        No results for "{searchQ}"
                      </div>
                    ) : (
                      searchResults.map(b => (
                        <button
                          key={b._id}
                          onClick={() => navigate('/login')}
                          style={{
                            width: '100%',
                            padding: '1rem',
                            borderBottom: '1px solid rgba(148, 163, 184, 0.1)',
                            background: 'none',
                            border: 'none',
                            textAlign: 'left',
                            cursor: 'pointer',
                            transition: 'background 0.2s ease',
                            display: 'flex',
                            gap: '1rem',
                            alignItems: 'center',
                            color: '#E2E8F0'
                          }}
                          onMouseEnter={e => (e.currentTarget.style.background = 'rgba(148, 163, 184, 0.1)')}
                          onMouseLeave={e => (e.currentTarget.style.background = 'none')}
                        >
                          <div
                            style={{
                              width: '40px',
                              height: '40px',
                              borderRadius: '8px',
                              background: 'linear-gradient(135deg, rgba(59, 130, 246, 0.2), rgba(139, 92, 246, 0.2))',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              color: '#60A5FA',
                              flexShrink: 0
                            }}
                          >
                            <i className="fas fa-book-open" />
                          </div>
                          <div style={{ flex: 1 }}>
                            <div style={{ fontWeight: 700, color: '#F1F5F9', marginBottom: '0.2rem' }}>{b.title}</div>
                            <div style={{ fontSize: '0.8rem', color: '#94A3B8' }}>
                              {b.author} • {b.available > 0 ? (<span style={{ color: '#34D399', fontWeight: 600 }}>Available</span>) : (<span style={{ color: '#F87171', fontWeight: 600 }}>Issued</span>)}
                            </div>
                          </div>
                        </button>
                      ))
                    )}
                  </div>
                )}
              </div>

              {/* Quick Stats */}
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(2, 1fr)',
                  gap: '1rem',
                  padding: '1.5rem',
                  background: 'rgba(148, 163, 184, 0.05)',
                  borderRadius: '12px',
                  border: '1px solid rgba(148, 163, 184, 0.1)'
                }}
              >
                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: '1.75rem', fontWeight: 900, color: '#60A5FA', marginBottom: '0.5rem' }}>{stats.totalBooks}</div>
                  <div style={{ fontSize: '0.75rem', color: '#94A3B8' }}>Total Resources</div>
                </div>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: '1.75rem', fontWeight: 900, color: '#34D399', marginBottom: '0.5rem' }}>{stats.availableCopies}</div>
                  <div style={{ fontSize: '0.75rem', color: '#94A3B8' }}>Available Books</div>
                </div>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: '1.75rem', fontWeight: 900, color: '#FBBF24', marginBottom: '0.5rem' }}>{stats.totalUsers}</div>
                  <div style={{ fontSize: '0.75rem', color: '#94A3B8' }}>Registered Users</div>
                </div>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: '1.75rem', fontWeight: 900, color: '#A78BFA', marginBottom: '0.5rem' }}>{stats.activeIssues}</div>
                  <div style={{ fontSize: '0.75rem', color: '#94A3B8' }}>Borrowed Books</div>
                </div>
              </div>
            </Card>
          </div>
        </section>

        {/* Hero Section */}
        <section style={{ maxWidth: '1400px', margin: '0 auto', padding: '4rem 2rem', position: 'relative' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '4rem', alignItems: 'center', animation: 'fadeIn 0.6s ease' }}>
            {/* Content */}
            <div>
              <div
                style={{
                  display: 'inline-block',
                  padding: '0.5rem 1rem',
                  borderRadius: '20px',
                  background: 'linear-gradient(135deg, rgba(59, 130, 246, 0.1), rgba(139, 92, 246, 0.1))',
                  border: '1px solid rgba(59, 130, 246, 0.2)',
                  marginBottom: '1.5rem',
                  fontSize: '0.85rem',
                  fontWeight: 600,
                  color: '#3B82F6'
                }}
              >
                <i className="fas fa-sparkles" style={{ marginRight: '0.5rem' }} /> Building Future Engineers
              </div>

              <h1 style={{ fontSize: '3.5rem', fontWeight: 900, color: '#1E293B', lineHeight: 1.2, marginBottom: '1.5rem' }}>
                CSE
                <br />
                <span style={{ background: 'linear-gradient(135deg, #3B82F6, #8B5CF6)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>
                  Library Management
                </span>
              </h1>

              <p style={{ fontSize: '1.1rem', color: '#64748B', marginBottom: '2rem', lineHeight: 1.8 }}>
                VEMU College is committed to academic excellence, innovation, and quality education, empowering students with modern infrastructure, skilled faculty, and a future-ready learning environment.
              </p>

              <div style={{ display: 'flex', gap: '1rem' }}>
                <Link to="/login">
                  <Button variant="primary" size="lg">
                    <i className="fas fa-rocket" />Login
                  </Button>
                </Link>
                <a href="#features">
                  <Button variant="outline" size="lg">
                    <i className="fas fa-stream" /> Explore Features
                  </Button>
                </a>
              </div>

              {/* Stats */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1.5rem', marginTop: '3rem' }}>
                <div>
                  <div style={{ fontSize: '2rem', fontWeight: 900, color: '#3B82F6' }}>{stats.totalBooks}</div>
                  <div style={{ fontSize: '0.85rem', color: '#64748B', marginTop: '0.5rem' }}>Total Books</div>
                </div>
                <div>
                  <div style={{ fontSize: '2rem', fontWeight: 900, color: '#10B981' }}>{stats.availableCopies}</div>
                  <div style={{ fontSize: '0.85rem', color: '#64748B', marginTop: '0.5rem' }}>Available Now</div>
                </div>
                <div>
                  <div style={{ fontSize: '2rem', fontWeight: 900, color: '#8B5CF6' }}>{stats.activeIssues}</div>
                  <div style={{ fontSize: '0.85rem', color: '#64748B', marginTop: '0.5rem' }}>Currently Issued</div>
                </div>
              </div>
            </div>

            {/* Search Card */}
            <Card className="card-glass" style={{ animation: 'slideUp 0.6s ease 0.2s both' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '2rem' }}>
                <div style={{ fontSize: '1.5rem', color: '#3B82F6' }}>
                  <i className="fas fa-search" />
                </div>
                <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: '#1E293B' }}>Search Catalog</h3>
              </div>

              <div ref={searchRef} style={{ position: 'relative', marginBottom: '1.5rem' }}>
                <input
                  type="text"
                  className="input"
                  placeholder="Type a title, author, or category..."
                  value={searchQ}
                  onChange={e => {
                    setSearchQ(e.target.value);
                    setSearchOpen(true);
                  }}
                  onFocus={() => setSearchOpen(true)}
                />

                {/* Search Results Dropdown */}
                {searchOpen && searchQ && (
                  <div
                    style={{
                      position: 'absolute',
                      top: '100%',
                      left: 0,
                      right: 0,
                      marginTop: '0.5rem',
                      background: '#FFFFFF',
                      border: '1px solid #E2E8F0',
                      borderRadius: 'var(--radius-md)',
                      boxShadow: 'var(--shadow)',
                      maxHeight: '300px',
                      overflowY: 'auto',
                      zIndex: 100
                    }}
                  >
                    {searchResults.length === 0 ? (
                      <div style={{ padding: '1.5rem', textAlign: 'center', color: '#64748B' }}>
                        No titles found for "{searchQ}"
                      </div>
                    ) : (
                      searchResults.map(b => (
                        <button
                          key={b._id}
                          onClick={() => navigate('/login')}
                          style={{
                            width: '100%',
                            padding: '1rem',
                            borderBottom: '1px solid #F1F5F9',
                            background: 'none',
                            border: 'none',
                            textAlign: 'left',
                            cursor: 'pointer',
                            transition: 'background 0.2s ease',
                            display: 'flex',
                            gap: '1rem',
                            alignItems: 'center'
                          }}
                          onMouseEnter={e => (e.currentTarget.style.background = '#F8FAFC')}
                          onMouseLeave={e => (e.currentTarget.style.background = 'none')}
                        >
                          <div
                            style={{
                              width: '40px',
                              height: '40px',
                              borderRadius: 'var(--radius-md)',
                              background: 'linear-gradient(135deg, rgba(59, 130, 246, 0.1), rgba(139, 92, 246, 0.1))',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              color: '#3B82F6',
                              flexShrink: 0
                            }}
                          >
                            <i className="fas fa-book-open" />
                          </div>
                          <div style={{ flex: 1 }}>
                            <div style={{ fontWeight: 700, color: '#1E293B', marginBottom: '0.2rem' }}>{b.title}</div>
                            <div style={{ fontSize: '0.8rem', color: '#64748B' }}>
                              {b.author} • {b.available > 0 ? (<span style={{ color: '#10B981', fontWeight: 600 }}>Available</span>) : (<span style={{ color: '#EF4444', fontWeight: 600 }}>Issued</span>)}
                            </div>
                          </div>
                        </button>
                      ))
                    )}
                  </div>
                )}
              </div>

              {/* Quick Stats */}
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(2, 1fr)',
                  gap: '1rem',
                  padding: '1rem',
                  background: '#F8FAFC',
                  borderRadius: 'var(--radius-md)'
                }}
              >
                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: '1.5rem', fontWeight: 900, color: '#3B82F6' }}>{stats.totalBooks}</div>
                  <div style={{ fontSize: '0.75rem', color: '#64748B', marginTop: '0.25rem' }}>Total Books</div>
                </div>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: '1.5rem', fontWeight: 900, color: '#10B981' }}>{stats.availableCopies}</div>
                  <div style={{ fontSize: '0.75rem', color: '#64748B', marginTop: '0.25rem' }}>Available</div>
                </div>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: '1.5rem', fontWeight: 900, color: '#F59E0B' }}>{stats.totalUsers}</div>
                  <div style={{ fontSize: '0.75rem', color: '#64748B', marginTop: '0.25rem' }}>Users</div>
                </div>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: '1.5rem', fontWeight: 900, color: '#8B5CF6' }}>{stats.activeIssues}</div>
                  <div style={{ fontSize: '0.75rem', color: '#64748B', marginTop: '0.25rem' }}>Issued</div>
                </div>
              </div>
            </Card>
          </div>
        </section>

        {/* Features Section */}
        <section id="features" style={{ maxWidth: '1400px', margin: '0 auto', padding: '6rem 2rem', position: 'relative' }}>
          <div style={{ textAlign: 'center', marginBottom: '4rem' }}>
            <div
              style={{
                display: 'inline-block',
                padding: '0.6rem 1.2rem',
                borderRadius: '24px',
                background: 'linear-gradient(135deg, rgba(59, 130, 246, 0.2), rgba(139, 92, 246, 0.2))',
                border: '1px solid rgba(96, 165, 250, 0.3)',
                marginBottom: '1rem',
                fontSize: '0.85rem',
                fontWeight: 600,
                color: '#60A5FA'
              }}
            >
              <i className="fas fa-lightning-bolt" style={{ marginRight: '0.5rem' }} /> Powerful Capabilities
            </div>
            <h2 style={{ fontSize: '3rem', fontWeight: 900, color: '#F1F5F9', marginBottom: '1rem', letterSpacing: '-0.02em' }}>Features Built for Scale</h2>
            <p style={{ fontSize: '1.1rem', color: '#CBD5E1', maxWidth: '700px', margin: '0 auto' }}>
              Enterprise-grade tools designed for academic libraries. Streamline operations, enhance user experience, and drive engagement across your institution.
            </p>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '2rem' }}>
            {[
              { icon: 'fa-database', title: 'MongoDB Database', desc: 'Centralized data storage with MongoDB Atlas. Secure, scalable, accessible 24/7 from any device.' },
              { icon: 'fa-users-cog', title: 'Admin Dashboard', desc: 'Complete system control. Manage users, books, transactions, settings, and analytics from one intuitive interface.' },
              { icon: 'fa-hourglass-end', title: 'Smart Fine System', desc: 'Automated due-date tracking with instant fine calculation. Librarians process returns in seconds.' },
              { icon: 'fa-branch', title: 'Multi-Branch Support', desc: 'Personalized libraries by branch. Students access their department catalog with relevant categories.' },
              { icon: 'fa-hand-paper', title: 'Request Workflow', desc: 'Digital book requests with approval pipeline. Transparent tracking for students and faculty.' },
              { icon: 'fa-chart-bar', title: 'Analytics Hub', desc: 'Real-time library insights. Track circulation, usage patterns, and export detailed CSV reports.' }
            ].map((f, i) => (
              <Card key={i} style={{ animation: `slideUp 0.6s ease ${i * 0.08}s both`, background: 'linear-gradient(135deg, rgba(30, 41, 59, 0.5), rgba(15, 23, 42, 0.7))', border: '1px solid rgba(148, 163, 184, 0.1)', transition: 'all 0.3s ease', cursor: 'default' }}
                onMouseEnter={e => {
                  e.currentTarget.style.background = 'linear-gradient(135deg, rgba(59, 130, 246, 0.1), rgba(139, 92, 246, 0.1))';
                  e.currentTarget.style.borderColor = 'rgba(96, 165, 250, 0.3)';
                  e.currentTarget.style.transform = 'translateY(-8px)';
                }}
                onMouseLeave={e => {
                  e.currentTarget.style.background = 'linear-gradient(135deg, rgba(30, 41, 59, 0.5), rgba(15, 23, 42, 0.7))';
                  e.currentTarget.style.borderColor = 'rgba(148, 163, 184, 0.1)';
                  e.currentTarget.style.transform = 'translateY(0)';
                }}
              >
                <div style={{ fontSize: '2.5rem', color: '#60A5FA', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', justifyContent: 'center', width: '56px', height: '56px', background: 'rgba(96, 165, 250, 0.1)', borderRadius: '12px' }}>
                  <i className={`fas ${f.icon}`} />
                </div>
                <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: '#F1F5F9', marginBottom: '0.75rem' }}>{f.title}</h3>
                <p style={{ fontSize: '0.95rem', color: '#CBD5E1', lineHeight: 1.6 }}>{f.desc}</p>
              </Card>
            ))}
          </div>
        </section>

        {/* Portals Section */}
        <section id="portals" style={{ maxWidth: '1400px', margin: '0 auto', padding: '6rem 2rem', position: 'relative' }}>
          <div style={{ textAlign: 'center', marginBottom: '4rem' }}>
            <div
              style={{
                display: 'inline-block',
                padding: '0.6rem 1.2rem',
                borderRadius: '24px',
                background: 'linear-gradient(135deg, rgba(139, 92, 246, 0.2), rgba(139, 92, 246, 0.2))',
                border: '1px solid rgba(167, 139, 250, 0.3)',
                marginBottom: '1rem',
                fontSize: '0.85rem',
                fontWeight: 600,
                color: '#A78BFA'
              }}
            >
              <i className="fas fa-lock" style={{ marginRight: '0.5rem' }} /> Role-Based Access
            </div>
            <h2 style={{ fontSize: '3rem', fontWeight: 900, color: '#F1F5F9', marginBottom: '1rem', letterSpacing: '-0.02em' }}>Four Dedicated Portals</h2>
            <p style={{ fontSize: '1.1rem', color: '#CBD5E1', maxWidth: '700px', margin: '0 auto' }}>
              Secure, customized dashboards tailored to the unique needs of each user tier. From administrators to students, everyone gets exactly what they need.
            </p>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '2rem' }}>
            {[
              { icon: 'fa-shield', title: 'Administrator', desc: 'Total system control. Manage accounts, inventory, configurations, analytics, and generate reports.', color: '#60A5FA' },
              { icon: 'fa-book-reader', title: 'Librarian', desc: 'Handle circulation operations. Process issues, returns, collect fines, and manage requests.', color: '#FBBF24' },
              { icon: 'fa-chalkboard-user', title: 'Faculty', desc: 'Extended privileges. Request books, manage courses, review borrow history, and recommend titles.', color: '#34D399' },
              { icon: 'fa-graduation-cap', title: 'Student', desc: 'Personalized portal for your branch. Search, request books, and track your dues and deadlines.', color: '#A78BFA' }
            ].map((p, i) => (
              <Link key={i} to="/login" style={{ textDecoration: 'none' }}>
                <Card
                  style={{
                    background: 'linear-gradient(135deg, rgba(30, 41, 59, 0.5), rgba(15, 23, 42, 0.7))',
                    border: '1px solid rgba(148, 163, 184, 0.1)',
                    textAlign: 'center',
                    cursor: 'pointer',
                    transition: 'all 0.3s ease',
                    animation: `slideUp 0.6s ease ${i * 0.1}s both`
                  }}
                  onMouseEnter={e => {
                    e.currentTarget.style.borderColor = `rgba(96, 165, 250, 0.3)`;
                    e.currentTarget.style.background = 'linear-gradient(135deg, rgba(59, 130, 246, 0.1), rgba(139, 92, 246, 0.1))';
                    e.currentTarget.style.transform = 'translateY(-12px)';
                    e.currentTarget.style.boxShadow = '0 20px 48px rgba(0, 0, 0, 0.4)';
                  }}
                  onMouseLeave={e => {
                    e.currentTarget.style.borderColor = 'rgba(148, 163, 184, 0.1)';
                    e.currentTarget.style.background = 'linear-gradient(135deg, rgba(30, 41, 59, 0.5), rgba(15, 23, 42, 0.7))';
                    e.currentTarget.style.transform = 'translateY(0)';
                    e.currentTarget.style.boxShadow = '0 4px 24px rgba(0, 0, 0, 0.2)';
                  }}
                >
                  <div
                    style={{
                      fontSize: '3rem',
                      marginBottom: '1.5rem',
                      color: p.color,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      width: '64px',
                      height: '64px',
                      margin: '0 auto 1.5rem',
                      background: `rgba(${p.color === '#60A5FA' ? '96, 165, 250' : p.color === '#FBBF24' ? '251, 191, 36' : p.color === '#34D399' ? '52, 211, 153' : '167, 139, 250'}, 0.1)`,
                      borderRadius: '16px',
                      transition: 'all 0.3s ease'
                    }}
                  >
                    <i className={`fas ${p.icon}`} />
                  </div>
                  <h3 style={{ fontSize: '1.3rem', fontWeight: 700, color: '#F1F5F9', marginBottom: '0.75rem' }}>{p.title}</h3>
                  <p style={{ fontSize: '0.95rem', color: '#CBD5E1', lineHeight: 1.6, marginBottom: '1.5rem' }}>{p.desc}</p>
                  <div style={{ color: p.color, fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', transition: 'all 0.2s ease' }}>
                    Access Portal <i className="fas fa-arrow-right" style={{ transition: 'transform 0.2s ease' }} />
                  </div>
                </Card>
              </Link>
            ))}
          </div>
        </section>

        {/* Books Preview Section */}
        <section id="books" style={{ maxWidth: '1400px', margin: '0 auto', padding: '6rem 2rem', position: 'relative' }}>
          <div style={{ textAlign: 'center', marginBottom: '4rem' }}>
            <div
              style={{
                display: 'inline-block',
                padding: '0.6rem 1.2rem',
                borderRadius: '24px',
                background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.2), rgba(16, 185, 129, 0.2))',
                border: '1px solid rgba(52, 211, 153, 0.3)',
                marginBottom: '1rem',
                fontSize: '0.85rem',
                fontWeight: 600,
                color: '#34D399'
              }}
            >
              <i className="fas fa-books" style={{ marginRight: '0.5rem' }} /> Live Library
            </div>
            <h2 style={{ fontSize: '3rem', fontWeight: 900, color: '#F1F5F9', marginBottom: '1rem', letterSpacing: '-0.02em' }}>Featured Collections</h2>
            <p style={{ fontSize: '1.1rem', color: '#CBD5E1', maxWidth: '700px', margin: '0 auto' }}>
              Explore our curated selection of academic resources. Real-time availability information for all titles.
            </p>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '1.5rem' }}>
            {books.slice(0, 8).map(b => (
              <Card key={b._id} style={{ overflow: 'hidden', animation: `slideUp 0.6s ease`, background: 'linear-gradient(135deg, rgba(30, 41, 59, 0.5), rgba(15, 23, 42, 0.7))', border: '1px solid rgba(148, 163, 184, 0.1)', transition: 'all 0.3s ease', cursor: 'default' }}
                onMouseEnter={e => {
                  e.currentTarget.style.borderColor = 'rgba(96, 165, 250, 0.3)';
                  e.currentTarget.style.transform = 'translateY(-8px)';
                  e.currentTarget.style.background = 'linear-gradient(135deg, rgba(59, 130, 246, 0.1), rgba(139, 92, 246, 0.1))';
                }}
                onMouseLeave={e => {
                  e.currentTarget.style.borderColor = 'rgba(148, 163, 184, 0.1)';
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.background = 'linear-gradient(135deg, rgba(30, 41, 59, 0.5), rgba(15, 23, 42, 0.7))';
                }}
              >
                <div
                  style={{
                    height: '150px',
                    background: 'linear-gradient(135deg, #3B82F6, #8B5CF6)',
                    borderRadius: '12px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '3rem',
                    marginBottom: '1rem',
                    position: 'relative',
                    overflow: 'hidden'
                  }}
                >
                  {BOOK_EMOJIS[b.category] || BOOK_EMOJIS.default}
                  <div
                    style={{
                      position: 'absolute',
                      top: '0.75rem',
                      right: '0.75rem',
                      padding: '0.5rem 1rem',
                      borderRadius: '8px',
                      fontSize: '0.75rem',
                      fontWeight: 700,
                      background: b.available > 0 ? 'rgba(52, 211, 153, 0.9)' : 'rgba(248, 113, 113, 0.9)',
                      color: 'white',
                      backdropFilter: 'blur(10px)'
                    }}
                  >
                    {b.available > 0 ? 'Available' : 'Issued'}
                  </div>
                </div>
                <h4 style={{ fontSize: '0.95rem', fontWeight: 700, color: '#F1F5F9', marginBottom: '0.4rem', lineHeight: 1.4 }}>
                  {b.title.substring(0, 50)}
                  {b.title.length > 50 ? '...' : ''}
                </h4>
                <div style={{ fontSize: '0.8rem', color: '#94A3B8', marginBottom: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                  <i className="fas fa-pen-nib" /> {b.author}
                </div>
                <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                  <span style={{ fontSize: '0.75rem', padding: '0.4rem 0.8rem', borderRadius: '8px', background: 'rgba(96, 165, 250, 0.2)', color: '#60A5FA', fontWeight: 600, border: '1px solid rgba(96, 165, 250, 0.2)' }}>
                    {b.category || 'General'}
                  </span>
                  <span style={{ fontSize: '0.75rem', padding: '0.4rem 0.8rem', borderRadius: '8px', background: 'rgba(167, 139, 250, 0.2)', color: '#A78BFA', fontWeight: 600, border: '1px solid rgba(167, 139, 250, 0.2)' }}>
                    {b.available}/{b.copies}
                  </span>
                </div>
              </Card>
            ))}
          </div>

          <div style={{ textAlign: 'center', marginTop: '4rem' }}>
            <Link to="/login">
              <Button variant="primary" size="lg">
                <i className="fas fa-arrow-right" /> View Library
              </Button>
            </Link>
          </div>
        </section>

        {/* Footer */}
        <footer style={{ background: 'linear-gradient(135deg, #0F172A 0%, #1E293B 50%, #0F172A 100%)', color: '#E2E8F0', padding: '4rem 2rem 2rem', marginTop: '6rem', borderTop: '1px solid rgba(148, 163, 184, 0.1)' }}>
          <div style={{ maxWidth: '1400px', margin: '0 auto' }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '3rem', marginBottom: '3rem' }}>
              {/* Brand */}
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', fontSize: '1.25rem', fontWeight: 900, marginBottom: '1rem' }}>
                  <Logo size="lg" animated={true} variant="gradient" />
                  CSE<span style={{ background: 'linear-gradient(135deg, #60A5FA, #A78BFA)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>Library</span>
                </div>
                <p style={{ fontSize: '0.9rem', color: '#94A3B8', marginBottom: '1.5rem', lineHeight: 1.6 }}>The next-generation library management system engineered for modern academic institutions.</p>
                <div style={{ display: 'flex', gap: '1rem' }}>
                  {['fab fa-facebook-f', 'fab fa-twitter', 'fab fa-instagram', 'fab fa-linkedin-in'].map((ic, i) => (
                    <a
                      key={i}
                      href="#"
                      style={{
                        width: '36px',
                        height: '36px',
                        borderRadius: '8px',
                        background: 'rgba(96, 165, 250, 0.1)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: '#60A5FA',
                        transition: 'all 0.2s ease',
                        border: '1px solid rgba(96, 165, 250, 0.2)'
                      }}
                      onMouseEnter={e => {
                        e.target.style.background = '#60A5FA';
                        e.target.style.color = 'white';
                        e.target.style.borderColor = '#60A5FA';
                      }}
                      onMouseLeave={e => {
                        e.target.style.background = 'rgba(96, 165, 250, 0.1)';
                        e.target.style.color = '#60A5FA';
                        e.target.style.borderColor = 'rgba(96, 165, 250, 0.2)';
                      }}
                    >
                      <i className={ic} />
                    </a>
                  ))}
                </div>
              </div>

              {/* Navigation */}
              <div>
                <h4 style={{ fontWeight: 700, marginBottom: '1.25rem', color: 'white', fontSize: '1rem' }}>Navigation</h4>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                  <a href="#home" style={{ color: '#94A3B8', transition: 'all 0.2s ease', textDecoration: 'none' }} onMouseEnter={e => (e.target.style.color = '#60A5FA')} onMouseLeave={e => (e.target.style.color = '#94A3B8')}>Home</a>
                  <a href="#features" style={{ color: '#94A3B8', transition: 'all 0.2s ease', textDecoration: 'none' }} onMouseEnter={e => (e.target.style.color = '#60A5FA')} onMouseLeave={e => (e.target.style.color = '#94A3B8')}>Services</a>
                  <a href="#portals" style={{ color: '#94A3B8', transition: 'all 0.2s ease', textDecoration: 'none' }} onMouseEnter={e => (e.target.style.color = '#60A5FA')} onMouseLeave={e => (e.target.style.color = '#94A3B8')}>Dashboards</a>
                  <a href="#books" style={{ color: '#94A3B8', transition: 'all 0.2s ease', textDecoration: 'none' }} onMouseEnter={e => (e.target.style.color = '#60A5FA')} onMouseLeave={e => (e.target.style.color = '#94A3B8')}>Book Collection</a>
                </div>
              </div>

              {/* Quick Access */}
              <div>
                <h4 style={{ fontWeight: 700, marginBottom: '1.25rem', color: 'white', fontSize: '1rem' }}>Access</h4>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                  <Link to="/login" style={{ color: '#94A3B8', transition: 'all 0.2s ease', textDecoration: 'none' }} onMouseEnter={e => (e.target.style.color = '#60A5FA')} onMouseLeave={e => (e.target.style.color = '#94A3B8')}>Admin Login</Link>
                  <Link to="/login" style={{ color: '#94A3B8', transition: 'all 0.2s ease', textDecoration: 'none' }} onMouseEnter={e => (e.target.style.color = '#60A5FA')} onMouseLeave={e => (e.target.style.color = '#94A3B8')}>Librarian Login</Link>
                  <Link to="/login" style={{ color: '#94A3B8', transition: 'all 0.2s ease', textDecoration: 'none' }} onMouseEnter={e => (e.target.style.color = '#60A5FA')} onMouseLeave={e => (e.target.style.color = '#94A3B8')}>Faculty Login</Link>
                  <Link to="/login" style={{ color: '#94A3B8', transition: 'all 0.2s ease', textDecoration: 'none' }} onMouseEnter={e => (e.target.style.color = '#60A5FA')} onMouseLeave={e => (e.target.style.color = '#94A3B8')}>Student Login</Link>
                </div>
              </div>

              {/* Contact */}
              <div>
                <h4 style={{ fontWeight: 700, marginBottom: '1.25rem', color: 'white', fontSize: '1rem' }}>Support</h4>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                  <a href="#" style={{ color: '#94A3B8', display: 'flex', alignItems: 'center', gap: '0.5rem', textDecoration: 'none', transition: 'all 0.2s ease' }} onMouseEnter={e => (e.currentTarget.style.color = '#60A5FA')} onMouseLeave={e => (e.currentTarget.style.color = '#94A3B8')}>
                    <i className="fas fa-map-marker-alt" style={{ color: '#60A5FA' }} /> Tech Campus
                  </a>
                  <a href="#" style={{ color: '#94A3B8', display: 'flex', alignItems: 'center', gap: '0.5rem', textDecoration: 'none', transition: 'all 0.2s ease' }} onMouseEnter={e => (e.currentTarget.style.color = '#60A5FA')} onMouseLeave={e => (e.currentTarget.style.color = '#94A3B8')}>
                    <i className="fas fa-phone-alt" style={{ color: '#60A5FA' }} /> +91 98765 43210
                  </a>
                  <a href="#" style={{ color: '#94A3B8', display: 'flex', alignItems: 'center', gap: '0.5rem', textDecoration: 'none', transition: 'all 0.2s ease' }} onMouseEnter={e => (e.currentTarget.style.color = '#60A5FA')} onMouseLeave={e => (e.currentTarget.style.color = '#94A3B8')}>
                    <i className="fas fa-envelope" style={{ color: '#60A5FA' }} /> support@library.edu
                  </a>
                </div>
              </div>
            </div>

            <div style={{ borderTop: '1px solid rgba(148, 163, 184, 0.1)', paddingTop: '2rem', textAlign: 'center', color: '#64748B' }}>
              <p>2026 CSELibrary Academic Systems. <i className="fas fa-heart" style={{ color: '#F87171', margin: '0 0.5rem' }} /> Built for education.</p>
            </div>
          </div>
        </footer>
      </div>
    </>
  );
}
