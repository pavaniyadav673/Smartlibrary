import React, { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { clearSession, getSession } from '../utils/auth';
import { usersAPI, booksAPI, issuesAPI, statsAPI, settingsAPI, notificationsAPI } from '../utils/api';
import { useToast } from '../context/ToastContext';
import Logo from '../components/Logo';

const categories = ['Programming','Computer Science','AI / Machine Learning','Databases','Mathematics','Systems','Networking','Algorithms','Software Engineering','Physics','Chemistry','Other'];

// ═══════════════════════════════════════════════════════════════════════════════════
// MODERN COMPONENTS
// ═══════════════════════════════════════════════════════════════════════════════════

function Pill({ text, type }) {
  return <span className={`pill pill-${type}`}>{text}</span>;
}

function Modal({ title, open, onClose, children }) {
  if (!open) return null;
  return (
    <div className="modal-overlay open" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal-box" style={{maxWidth:'560px'}}>
        <div className="modal-title">{title}</div>
        {children}
      </div>
    </div>
  );
}

// Modern Gradient Stat Card with icons and animations
function StatCard({ icon, label, value, trend, color, bgGradient }) {
  return (
    <div className="stat-card-modern" style={{backgroundImage: bgGradient}}>
      <div className="stat-card-header">
        <div className="stat-icon" style={{color}}><i className={`fas ${icon}`}></i></div>
        <div className="stat-label">{label}</div>
      </div>
      <div className="stat-card-content">
        <div className="stat-value">{value}</div>
        {trend && <div className="stat-trend" style={{color: trend > 0 ? '#10B981' : '#EF4444'}}><i className={`fas fa-trend-${trend > 0 ? 'up' : 'down'}`}></i> {Math.abs(trend)}%</div>}
      </div>
    </div>
  );
}

// Modern Activity Feed Item
function ActivityItem({ icon, title, description, time, status, type }) {
  return (
    <div className="activity-item">
      <div className={`activity-icon activity-${type}`}><i className={`fas ${icon}`}></i></div>
      <div className="activity-content">
        <div className="activity-title">{title}</div>
        <div className="activity-desc">{description}</div>
      </div>
      <div className="activity-time">{time}</div>
    </div>
  );
}

// Quick Action Button
function QuickActionBtn({ icon, label, onClick }) {
  return (
    <button className="quick-action-btn" onClick={onClick}>
      <div className="qa-icon"><i className={`fas ${icon}`}></i></div>
      <div className="qa-label">{label}</div>
    </button>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════════
// MAIN ADMIN DASHBOARD COMPONENT
// ═══════════════════════════════════════════════════════════════════════════════════

export default function AdminDashboard() {
  const navigate = useNavigate();
  const toast = useToast();
  const session = getSession();
  const [activeSection, setActiveSection] = useState('overview');
  const [stats, setStats] = useState({});
  const [users, setUsers] = useState([]);
  const [books, setBooks] = useState([]);
  const [issues, setIssues] = useState([]);
  const [settings, setSettings] = useState({});
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [showNotif, setShowNotif] = useState(false);
  const [seenNotifs, setSeenNotifs] = useState(new Set());
  const [dbNotifications, setDbNotifications] = useState([]);
  const [profileDropdown, setProfileDropdown] = useState(false);
  
  // Search & Filter states
  const [userSearch, setUserSearch] = useState('');
  const [bookSearch, setBookSearch] = useState('');
  const [txSearch, setTxSearch] = useState('');
  const [txFilter, setTxFilter] = useState('all');

  // Modal states
  const [showAddUser, setShowAddUser] = useState(false);
  const [showEditUser, setShowEditUser] = useState(false);
  const [showAddBook, setShowAddBook] = useState(false);
  const [showEditBook, setShowEditBook] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [confirmData, setConfirmData] = useState({});
  const [editUser, setEditUser] = useState({});
  const [editBook, setEditBook] = useState({});
  const [newUser, setNewUser] = useState({ name:'',username:'',password:'',role:'student',email:'',phone:'',department:'' });
  const [newBook, setNewBook] = useState({ title:'',author:'',isbn:'',category:'Programming',publisher:'',edition:'',year:'',copies:1,location:'' });

  const loadAll = useCallback(async () => {
    try {
      const [s, u, b, i, stg, notifs] = await Promise.all([
        statsAPI.get(), usersAPI.getAll(), booksAPI.getAll(), issuesAPI.getAll(), settingsAPI.get(), notificationsAPI.getByUser(session?.id)
      ]);
      setStats(s?.data || {}); 
      setUsers(u?.data || []); 
      setBooks(b?.data || []); 
      setIssues(i?.data || []); 
      setSettings(stg?.data || {}); 
      setDbNotifications(notifs?.data || []);
    } catch { toast('Failed to load data. Is the backend running?', 'err'); }
  }, [session?.id, toast]);

  useEffect(() => {
    if (!session || session.role !== 'admin') { navigate('/login'); return; }
    loadAll();
  }, [navigate, session, loadAll]);

  function logout() { clearSession(); navigate('/'); }
  function go(s) { setActiveSection(s); setSidebarOpen(false); }

  const today = new Date().toISOString().slice(0,10);

  function calcFine(issue, overrideReturnDate) {
    if (!issue) return 0;
    const u = users.find(x => x._id === (issue.user?._id || issue.user));
    if (u && u.role === 'faculty') return 0;
    const fpd = settings.finePerDay || 5;
    const due = new Date(issue.dueDate);
    const ret = new Date(overrideReturnDate || issue.returnDate || today);
    if (ret <= due) return 0;
    return Math.ceil((ret - due) / 86400000) * fpd;
  }

  function getStatusPill(issue) {
    if (issue.returnDate) return <Pill text="Returned" type="ok"/>;
    if (issue.dueDate < today) return <Pill text="Overdue" type="err"/>;
    return <Pill text="Active" type="warn"/>;
  }

  function getUserName(id) { const u = users.find(x => x._id === id); return u?.name || '?'; }
  function getBookTitle(id) { const b = books.find(x => x._id === id); return b?.title || '?'; }

  // ═══ USERS MANAGEMENT ═══
  const filteredUsers = users.filter(u =>
    (u.name||'').toLowerCase().includes(userSearch.toLowerCase()) ||
    (u.username||'').toLowerCase().includes(userSearch.toLowerCase()) ||
    (u.role||'').toLowerCase().includes(userSearch.toLowerCase()) ||
    (u.department||'').toLowerCase().includes(userSearch.toLowerCase())
  );

  async function handleAddUser() {
    if (!newUser.name || !newUser.username || !newUser.password) { toast('Fill Name, Username & Password','err'); return; }
    try {
      await usersAPI.create(newUser);
      toast(`User "${newUser.name}" created!`, 'ok');
      setShowAddUser(false);
      setNewUser({ name:'',username:'',password:'',role:'student',email:'',phone:'',department:'' });
      loadAll();
    } catch(e) { toast(e.response?.data?.message || 'Error creating user','err'); }
  }

  async function handleEditUser() {
    try {
      await usersAPI.update(editUser._id, editUser);
      toast('User updated!','ok'); setShowEditUser(false); loadAll();
    } catch(e) { toast(e.response?.data?.message || 'Error','err'); }
  }

  async function handleDeleteUser(u) {
    setConfirmData({ title:'Delete User', msg:`Delete "${u.name}"? This cannot be undone.`, action: async () => {
      try { await usersAPI.delete(u._id); toast('User deleted','ok'); loadAll(); setShowConfirm(false); }
      catch(e) { toast(e.response?.data?.message || 'Error','err'); setShowConfirm(false); }
    }});
    setShowConfirm(true);
  }

  // ═══ BOOKS MANAGEMENT ═══
  const filteredBooks = books.filter(b =>
    (b.title||'').toLowerCase().includes(bookSearch.toLowerCase()) ||
    (b.author||'').toLowerCase().includes(bookSearch.toLowerCase()) ||
    (b.isbn && b.isbn.includes(bookSearch))
  );

  async function handleAddBook() {
    if (!newBook.title || !newBook.author || !newBook.isbn) { toast('Fill Title, Author & ISBN','err'); return; }
    try {
      await booksAPI.create(newBook);
      toast('Book added!','ok'); setShowAddBook(false);
      setNewBook({ title:'',author:'',isbn:'',category:'Programming',publisher:'',edition:'',year:'',copies:1,location:'' });
      loadAll();
    } catch(e) { toast(e.response?.data?.message || 'Error','err'); }
  }

  async function handleEditBook() {
    try {
      await booksAPI.update(editBook._id, editBook);
      toast('Book updated!','ok'); setShowEditBook(false); loadAll();
    } catch(e) { toast(e.response?.data?.message || 'Error','err'); }
  }

  async function handleDeleteBook(b) {
    setConfirmData({ title:'Delete Book', msg:`Delete "${b.title}"? This cannot be undone.`, action: async () => {
      try { await booksAPI.delete(b._id); toast('Book deleted','ok'); loadAll(); setShowConfirm(false); }
      catch(e) { toast(e.response?.data?.message || 'Error','err'); setShowConfirm(false); }
    }});
    setShowConfirm(true);
  }

  // ═══ TRANSACTIONS ═══
  const filteredIssues = [...issues].reverse().filter(i => {
    const u = getUserName(i.user?._id || i.user); const b = getBookTitle(i.book?._id || i.book);
    const q = txSearch.toLowerCase();
    const matchQ = !q || u.toLowerCase().includes(q) || b.toLowerCase().includes(q);
    const matchF = txFilter === 'all' ? true : txFilter === 'active' ? !i.returnDate : txFilter === 'returned' ? !!i.returnDate : (!i.returnDate && (i.dueDate||'') < today);
    return matchQ && matchF;
  });

  // ═══ SETTINGS ═══
  async function saveSettings() {
    try {
      await settingsAPI.update(settings);
      toast('Settings saved!','ok');
    } catch { toast('Error saving settings','err'); }
  }

  // ═══ REPORTS ═══
  function genReport(type) {
    let csv = '', title = '';
    if (type === 'users') {
      title = 'Users Report'; csv = 'Name,Username,Role,Email,Department,Status\n' + users.map(u => `"${u.name}",${u.username},${u.role},"${u.email||''}","${u.department||''}",${u.active!==false?'Active':'Inactive'}`).join('\n');
    } else if (type === 'books') {
      title = 'Books Report'; csv = 'Title,Author,ISBN,Category,Copies,Available\n' + books.map(b => `"${b.title}","${b.author}",${b.isbn},"${b.category||''}",${b.copies},${b.available}`).join('\n');
    } else if (type === 'transactions') {
      title = 'Transactions'; csv = 'User,Book,IssueDate,DueDate,ReturnDate,Fine\n' + issues.map(i => `"${getUserName(i.user?._id||i.user)}","${getBookTitle(i.book?._id||i.book)}",${(i.issueDate||'').slice(0,10)},${(i.dueDate||'').slice(0,10)},${i.returnDate?(i.returnDate+'').slice(0,10):''},${calcFine(i, i.returnDate||today)}`).join('\n');
    }
    const a = document.createElement('a'); a.href = URL.createObjectURL(new Blob([csv],{type:'text/csv'})); a.download = `${type}_report.csv`; a.click();
    toast(`${title} downloaded!`, 'ok');
  }

  // Notifications
  const notifications = [];
  if (stats.overdueIssues > 0) notifications.push({ id:'ov', icon:'fa-exclamation-circle', title:'System Alert', text:`There are ${stats.overdueIssues} overdue books in the system.`, time:'Alert', type:'error' });
  if (stats.totalFines > 0) notifications.push({ id:'fine', icon:'fa-coins', title:'Pending Fines', text:`Total of ₹${stats.totalFines} in pending fines.`, time:'Notice', type:'warning' });
  dbNotifications.forEach(n => {
    notifications.push({ id: n._id, icon: n.icon, title: n.title, text: n.text, time: (n.createdAt||'').slice(0,10), isRead: n.isRead, isDb: true });
  });

  function InputField({label, ...props}) {
    return (
      <div className="form-group">
        <label>{label}</label>
        <input className="inp" {...props} />
      </div>
    );
  }

  function SelectField({label, children, ...props}) {
    return (
      <div className="form-group">
        <label>{label}</label>
        <select className="inp" {...props}>{children}</select>
      </div>
    );
  }

  // ═══════════════════════════════════════════════════════════════════════════════════
  // RENDER - MODERN ADMIN DASHBOARD
  // ═══════════════════════════════════════════════════════════════════════════════════
  
  const navItems = [
    {id: 'overview', label: 'Overview', icon: 'fa-chart-line', color: '#3B82F6'},
    {id: 'users', label: 'Users', icon: 'fa-users', color: '#06B6D4'},
    {id: 'books', label: 'Books', icon: 'fa-book', color: '#10B981'},
    {id: 'issues', label: 'Transactions', icon: 'fa-exchange-alt', color: '#F59E0B'},
    {id: 'reports', label: 'Reports', icon: 'fa-chart-bar', color: '#8B5CF6'},
    {id: 'backup', label: 'Backup', icon: 'fa-database', color: '#EC4899'},
    {id: 'settings', label: 'Settings', icon: 'fa-cog', color: '#6366F1'},
  ];

  const pageTitles = {
    overview: { title: 'Dashboard Overview', subtitle: 'System statistics and recent activity' },
    users: { title: 'User Management', subtitle: 'Manage and monitor all library users' },
    books: { title: 'Book Inventory', subtitle: 'Manage library catalog and availability' },
    issues: { title: 'Transactions', subtitle: 'Track all book issues and returns' },
    reports: { title: 'Reports & Export', subtitle: 'Generate and download library reports' },
    backup: { title: 'Backup & Restore', subtitle: 'Manage your library database backups' },
    settings: { title: 'Settings', subtitle: 'Configure library policies and rules' },
  };

  const ptitle = pageTitles[activeSection]?.title || 'Dashboard';
  const psub = pageTitles[activeSection]?.subtitle || '';

  return (
    <div className="admin-dashboard-modern">
      {/* ═══ MODERN SIDEBAR ═══ */}
      <aside className={`modern-sidebar ${sidebarOpen ? 'open' : ''}`}>
        <div className="sidebar-brand-modern">
          <Logo size="md" animated={true} variant="dark" />
          <div className="brand-text-modern">CSE Library</div>
        </div>

        <nav className="modern-nav">
          {navItems.map((item) => (
            <button
              key={item.id}
              className={`nav-item-modern ${activeSection === item.id ? 'active' : ''}`}
              onClick={() => go(item.id)}
              style={{
                borderLeftColor: activeSection === item.id ? item.color : 'transparent'
              }}
            >
              <i className={`fas ${item.icon}`} style={{color: activeSection === item.id ? item.color : '#94A3B8'}}></i>
              <span>{item.label}</span>
            </button>
          ))}
        </nav>

        <div className="sidebar-footer-modern">
          <button className="logout-btn-modern" onClick={logout}>
            <i className="fas fa-sign-out-alt"></i>
            <span>Logout</span>
          </button>
        </div>
      </aside>

      {/* ═══ MAIN CONTENT AREA ═══ */}
      <div className="modern-main">
        {/* ═══ TOP NAVBAR ═══ */}
        <div className="modern-topbar">
          <div className="topbar-left-modern">
            <button className="menu-toggle" onClick={() => setSidebarOpen(!sidebarOpen)}>
              <i className="fas fa-bars"></i>
            </button>
            <div className="topbar-search-wrap">
              <i className="fas fa-search"></i>
              <input type="text" placeholder="Search library..." />
            </div>
          </div>

          <div className="topbar-right-modern">
            {/* Notifications */}
            <div className="topbar-notif">
              <button className="notif-btn" onClick={() => {
                const opening = !showNotif;
                if (opening) {
                  setSeenNotifs(new Set(notifications.filter(n => !n.isDb).map(n => n.id)));
                  const unreadDb = dbNotifications.filter(n => !n.isRead).map(n => n._id);
                  if (unreadDb.length > 0) {
                    notificationsAPI.markRead(unreadDb).catch(()=>{});
                    setDbNotifications(dbNotifications.map(n => ({...n, isRead: true})));
                  }
                }
                setShowNotif(opening);
              }}>
                <i className="fas fa-bell"></i>
                {notifications.filter(n => (n.isDb ? !n.isRead : !seenNotifs.has(n.id))).length > 0 && (
                  <span className="notif-badge">{notifications.filter(n => (n.isDb ? !n.isRead : !seenNotifs.has(n.id))).length}</span>
                )}
              </button>

              {showNotif && (
                <div className="notif-panel">
                  <div className="notif-header">
                    <h3>Notifications</h3>
                    <button className="close-btn" onClick={() => setShowNotif(false)}><i className="fas fa-times"></i></button>
                  </div>
                  <div className="notif-content">
                    {notifications.length === 0 ? (
                      <div className="notif-empty"><i className="fas fa-bell-slash"></i><p>All caught up!</p></div>
                    ) : (
                      notifications.map((n, idx) => (
                        <div key={n.id || idx} className={`notif-item notif-${n.type || 'info'}`}>
                          <i className={`fas ${n.icon}`}></i>
                          <div>
                            <div className="notif-title">{n.title}</div>
                            <div className="notif-text">{n.text}</div>
                            <span className="notif-time">{n.time}</span>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Profile Dropdown */}
            <div className="profile-dropdown-wrapper">
              <button className="profile-btn" onClick={() => setProfileDropdown(!profileDropdown)}>
                <div className="profile-avatar" style={{background: 'linear-gradient(135deg, #3B82F6, #8B5CF6)'}}>{(session?.name || 'A')[0]}</div>
                <span className="profile-name">{session?.name || 'Admin'}</span>
                <i className="fas fa-chevron-down"></i>
              </button>

              {profileDropdown && (
                <div className="profile-menu">
                  <div className="profile-header">
                    <div className="profile-avatar-lg" style={{background: 'linear-gradient(135deg, #3B82F6, #8B5CF6)'}}>{(session?.name || 'A')[0]}</div>
                    <div>
                      <div className="profile-name-lg">{session?.name || 'Admin'}</div>
                      <div className="profile-role">Super Admin</div>
                    </div>
                  </div>
                  <div className="profile-menu-divider"></div>
                  <button className="profile-menu-item" onClick={() => { setProfileDropdown(false); toast('Profile page coming soon', 'info'); }}>
                    <i className="fas fa-user-circle"></i> View Profile
                  </button>
                  <button className="profile-menu-item" onClick={() => { setProfileDropdown(false); go('settings'); }}>
                    <i className="fas fa-cog"></i> Settings
                  </button>
                  <div className="profile-menu-divider"></div>
                  <button className="profile-menu-item logout" onClick={() => { logout(); setProfileDropdown(false); }}>
                    <i className="fas fa-sign-out-alt"></i> Logout
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Mobile Overlay */}
          {sidebarOpen && <div className="sidebar-overlay" onClick={() => setSidebarOpen(false)}></div>}
        </div>

        {/* ═══ CONTENT AREA ═══ */}
        <div className="modern-content">
          {/* Page Header */}
          <div className="section-header-modern">
            <div>
              <h2><i className="fas fa-chart-line"></i> {ptitle}</h2>
              <p>{psub}</p>
            </div>
          </div>

          {/* OVERVIEW PAGE */}
          {activeSection === 'overview' && (
            <div className="overview-section">
              {/* Stats Grid */}
              <div className="stats-grid">
                <StatCard icon="fa-users" label="Total Users" value={stats.totalUsers} color="#06B6D4" bgGradient="linear-gradient(135deg, rgba(6, 182, 212, 0.1), rgba(34, 211, 238, 0.05))" />
                <StatCard icon="fa-book" label="Total Books" value={stats.totalBooks} color="#10B981" bgGradient="linear-gradient(135deg, rgba(16, 185, 129, 0.1), rgba(52, 211, 153, 0.05))" />
                <StatCard icon="fa-exchange-alt" label="Active Issues" value={stats.activeIssues} color="#F59E0B" bgGradient="linear-gradient(135deg, rgba(245, 158, 11, 0.1), rgba(251, 191, 36, 0.05))" />
                <StatCard icon="fa-exclamation-circle" label="Overdue" value={stats.overdueIssues} color="#EF4444" bgGradient="linear-gradient(135deg, rgba(239, 68, 68, 0.1), rgba(252, 165, 165, 0.05))" />
                <StatCard icon="fa-coins" label="Total Fines" value={`₹${stats.totalFines}`} color="#8B5CF6" bgGradient="linear-gradient(135deg, rgba(139, 92, 246, 0.1), rgba(196, 181, 253, 0.05))" />
                <StatCard icon="fa-users-cog" label="Active Members" value={users.filter(u => u.active !== false).length} color="#3B82F6" bgGradient="linear-gradient(135deg, rgba(59, 130, 246, 0.1), rgba(96, 165, 250, 0.05))" />
              </div>

              {/* Quick Actions */}
              <div className="quick-actions-section">
                <h3>Quick Actions</h3>
                <div className="quick-actions-grid">
                  <QuickActionBtn icon="fa-user-plus" label="Add User" color="#06B6D4" onClick={() => setShowAddUser(true)} />
                  <QuickActionBtn icon="fa-book-medical" label="Add Book" color="#10B981" onClick={() => setShowAddBook(true)} />
                  <QuickActionBtn icon="fa-hand-holding-hand" label="Issue Book" color="#F59E0B" onClick={() => toast('Issue functionality in user page', 'info')} />
                  <QuickActionBtn icon="fa-chart-bar" label="Reports" color="#8B5CF6" onClick={() => go('reports')} />
                </div>
              </div>

              {/* Recent Transactions */}
              <div className="modern-card">
                <div className="card-header-modern">
                  <div>
                    <h3>Recent Transactions</h3>
                    <p>Last 8 issue/return records</p>
                  </div>
                  <button className="view-all-btn" onClick={() => go('issues')}>View All →</button>
                </div>
                <div className="card-body-modern">
                  <table>
                    <thead>
                      <tr>
                        <th>Member</th>
                        <th>Book</th>
                        <th>Issue Date</th>
                        <th>Due Date</th>
                        <th>Status</th>
                        <th>Fine</th>
                      </tr>
                    </thead>
                    <tbody>
                      {issues.slice(-8).reverse().map(i => {
                        const fine = calcFine(i, i.returnDate || today);
                        return (
                          <tr key={i._id} className={!i.returnDate && (i.dueDate || '') < today ? 'overdue-row' : ''}>
                            <td><strong>{getUserName(i.user?._id || i.user)}</strong></td>
                            <td>{getBookTitle(i.book?._id || i.book)}</td>
                            <td>{(i.issueDate || '').slice(0, 10)}</td>
                            <td>{(i.dueDate || '').slice(0, 10)}</td>
                            <td>{!i.returnDate ? (i.dueDate < today ? <span className="overdue-text">Overdue</span> : <span className="pill" style={{background:'#10B98114', color:'#10B981'}}>Active</span>) : <span className="pill" style={{background:'#0EA5E914', color:'#0EA5E9'}}>Returned</span>}</td>
                            <td className="fine-cell">₹{fine}</td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* USERS PAGE */}
          {activeSection === 'users' && (
            <div className="users-section">
              <div className="modern-card">
                <div className="card-body-modern">
                  <div className="card-toolbar">
                    <div className="search-box-modern">
                      <i className="fas fa-search"></i>
                      <input type="text" placeholder="Search users..." value={userSearch} onChange={(e) => setUserSearch(e.target.value)} />
                    </div>
                    <span className="result-count">{filteredUsers.length} users</span>
                    <button className="btn-primary-modern" onClick={() => setShowAddUser(true)}><i className="fas fa-plus"></i> Add User</button>
                  </div>
                  <table>
                    <thead>
                      <tr>
                        <th>User</th>
                        <th>Username</th>
                        <th>Role</th>
                        <th>Department</th>
                        <th>Status</th>
                        <th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredUsers.map(u => (
                        <tr key={u._id}>
                          <td>
                            <div className="user-cell">
                              <div className="user-avatar" style={{background: ['#3B82F6','#8B5CF6','#10B981','#F59E0B','#EF4444'][Math.floor(Math.random()*5)]}}>{(u.name || 'U')[0]}</div>
                              <div>
                                <div className="user-name">{u.name}</div>
                                <div className="user-email">{u.email}</div>
                              </div>
                            </div>
                          </td>
                          <td><code>{u.username}</code></td>
                          <td><span className="pill" style={{background:`${['#3B82F6','#8B5CF6','#10B981','#F59E0B'][['admin','student','faculty','librarian'].indexOf(u.role)]||'#3B82F6'}20`, color:`${['#3B82F6','#8B5CF6','#10B981','#F59E0B'][['admin','student','faculty','librarian'].indexOf(u.role)]||'#3B82F6'}`}}>{u.role}</span></td>
                          <td>{u.department || '-'}</td>
                          <td>{getStatusPill(u.active !== false)}</td>
                          <td>
                            <div className="action-buttons">
                              <button className="btn-icon edit" onClick={() => { setEditUser({...u}); setShowEditUser(true); }}><i className="fas fa-edit"></i></button>
                              <button className="btn-icon delete" onClick={() => handleDeleteUser(u)}><i className="fas fa-trash"></i></button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* BOOKS PAGE */}
          {activeSection === 'books' && (
            <div className="books-section">
              <div className="modern-card">
                <div className="card-body-modern">
                  <div className="card-toolbar">
                    <div className="search-box-modern">
                      <i className="fas fa-search"></i>
                      <input type="text" placeholder="Search books..." value={bookSearch} onChange={(e) => setBookSearch(e.target.value)} />
                    </div>
                    <span className="result-count">{filteredBooks.length} books</span>
                    <button className="btn-primary-modern" onClick={() => setShowAddBook(true)}><i className="fas fa-plus"></i> Add Book</button>
                  </div>
                  <table>
                    <thead>
                      <tr>
                        <th>Book</th>
                        <th>ISBN</th>
                        <th>Category</th>
                        <th>Copies</th>
                        <th>Location</th>
                        <th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredBooks.map(b => (
                        <tr key={b._id}>
                          <td>
                            <div className="book-cell">
                              <div className="book-icon"><i className="fas fa-book"></i></div>
                              <div>
                                <div className="book-title">{b.title}</div>
                                <div className="book-author">{b.author}</div>
                              </div>
                            </div>
                          </td>
                          <td><code>{b.isbn}</code></td>
                          <td><span className="pill" style={{background:'#F59E0B14', color:'#F59E0B'}}>{b.category || 'General'}</span></td>
                          <td><strong>{b.copies}</strong> <span className="availability" style={{marginLeft:'8px'}}>{b.available || 0} available</span></td>
                          <td>{b.location || '-'}</td>
                          <td>
                            <div className="action-buttons">
                              <button className="btn-icon edit" onClick={() => { setEditBook({...b}); setShowEditBook(true); }}><i className="fas fa-edit"></i></button>
                              <button className="btn-icon delete" onClick={() => handleDeleteBook(b)}><i className="fas fa-trash"></i></button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* TRANSACTIONS PAGE */}
          {activeSection === 'issues' && (
            <div className="transactions-section">
              <div className="modern-card">
                <div className="card-body-modern">
                  <div className="card-toolbar">
                    <select className="filter-select" value={txFilter} onChange={(e) => setTxFilter(e.target.value)}>
                      <option value="all">All Transactions</option>
                      <option value="active">Active Issues</option>
                      <option value="returned">Returned</option>
                      <option value="overdue">Overdue</option>
                    </select>
                    <div className="search-box-modern">
                      <i className="fas fa-search"></i>
                      <input type="text" placeholder="Search..." value={txSearch} onChange={(e) => setTxSearch(e.target.value)} />
                    </div>
                    <span className="result-count">{filteredIssues.length} records</span>
                  </div>
                  <table>
                    <thead>
                      <tr>
                        <th>Member</th>
                        <th>Book</th>
                        <th>Issue Date</th>
                        <th>Due Date</th>
                        <th>Return Date</th>
                        <th>Status</th>
                        <th>Fine</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredIssues.map(i => {
                        const fine = calcFine(i, i.returnDate || today);
                        const isOverdue = !i.returnDate && (i.dueDate || '') < today;
                        return (
                          <tr key={i._id} className={isOverdue ? 'overdue-row' : ''}>
                            <td><strong>{getUserName(i.user?._id || i.user)}</strong></td>
                            <td>{getBookTitle(i.book?._id || i.book)}</td>
                            <td>{(i.issueDate || '').slice(0, 10)}</td>
                            <td>{(i.dueDate || '').slice(0, 10)}</td>
                            <td>{i.returnDate ? (i.returnDate + '').slice(0, 10) : '-'}</td>
                            <td>{!i.returnDate ? (isOverdue ? <span className="overdue-text">Overdue</span> : <span className="status-badge active">Active</span>) : <span className="status-badge inactive">Returned</span>}</td>
                            <td className="fine-cell" style={{fontWeight: fine > 0 ? '700' : '500', color: fine > 0 ? '#EF4444' : '#64748B'}}>₹{fine}</td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* REPORTS PAGE */}
          {activeSection === 'reports' && (
            <div className="reports-section">
              <div className="reports-grid">
                <div className="modern-card report-card" onClick={() => genReport('users')}>
                  <i className="fas fa-users report-icon" style={{color: '#3B82F6'}}></i>
                  <h3>Users Report</h3>
                  <p>Export all users data</p>
                  <span className="report-action">Download CSV →</span>
                </div>
                <div className="modern-card report-card" onClick={() => genReport('books')}>
                  <i className="fas fa-book report-icon" style={{color: '#10B981'}}></i>
                  <h3>Books Report</h3>
                  <p>Export all books data</p>
                  <span className="report-action">Download CSV →</span>
                </div>
                <div className="modern-card report-card" onClick={() => genReport('transactions')}>
                  <i className="fas fa-chart-line report-icon" style={{color: '#8B5CF6'}}></i>
                  <h3>Transactions Report</h3>
                  <p>Export all transactions</p>
                  <span className="report-action">Download CSV →</span>
                </div>
              </div>
            </div>
          )}

          {/* BACKUP PAGE */}
          {activeSection === 'backup' && (
            <div className="backup-section">
              <div className="backup-grid">
                <div className="modern-card backup-card">
                  <i className="fas fa-download backup-icon"></i>
                  <h3>Download Backup</h3>
                  <p>Download complete database backup</p>
                  <button className="btn-primary-modern" onClick={() => { const a = document.createElement('a'); a.href = URL.createObjectURL(new Blob([JSON.stringify({users,books,issues,settings})],{type:'application/json'})); a.download = `backup_${new Date().toISOString().slice(0,10)}.json`; a.click(); toast('Backup downloaded!','ok'); }}>
                    <i className="fas fa-file-download"></i> Download
                  </button>
                </div>
                <div className="modern-card backup-card">
                  <i className="fas fa-upload backup-icon restore"></i>
                  <h3>Restore Backup</h3>
                  <p>Restore database from backup file</p>
                  <button className="btn-primary-modern warn" onClick={() => toast('Restore functionality would go here','info')}>
                    <i className="fas fa-file-upload"></i> Restore
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* SETTINGS PAGE */}
          {activeSection === 'settings' && (
            <div className="settings-section">
              <div className="modern-card">
                <div className="card-header-modern">
                  <h3>Library Configuration</h3>
                </div>
                <div className="card-body-modern">
                  <div className="settings-form">
                    <div className="form-group">
                      <label>Institution Name</label>
                      <input type="text" value={settings.institutionName || ''} onChange={(e) => setSettings({...settings, institutionName: e.target.value})} />
                    </div>
                    <div className="form-group">
                      <label>Fine Per Day (₹)</label>
                      <input type="number" value={settings.finePerDay || 0} onChange={(e) => setSettings({...settings, finePerDay: parseFloat(e.target.value)})} />
                    </div>
                    <div className="form-group">
                      <label>Max Books (Student)</label>
                      <input type="number" value={settings.maxStudentBooks || 5} onChange={(e) => setSettings({...settings, maxStudentBooks: parseInt(e.target.value)})} />
                    </div>
                    <div className="form-group">
                      <label>Max Books (Faculty)</label>
                      <input type="number" value={settings.maxFacultyBooks || 10} onChange={(e) => setSettings({...settings, maxFacultyBooks: parseInt(e.target.value)})} />
                    </div>
                    <div className="form-group">
                      <label>Loan Days (Student)</label>
                      <input type="number" value={settings.studentLoanDays || 14} onChange={(e) => setSettings({...settings, studentLoanDays: parseInt(e.target.value)})} />
                    </div>
                    <div className="form-group">
                      <label>Loan Days (Faculty)</label>
                      <input type="number" value={settings.facultyLoanDays || 30} onChange={(e) => setSettings({...settings, facultyLoanDays: parseInt(e.target.value)})} />
                    </div>
                  </div>
                  <button className="btn-primary-modern" onClick={saveSettings}><i className="fas fa-save"></i> Save Settings</button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ═══ MODALS ═══ */}
      {/* Add User Modal */}
      <Modal title={<><i className="fas fa-user-plus"></i> Add New User</>} open={showAddUser} onClose={() => setShowAddUser(false)}>
        <div className="form-grid">
          {[['Full Name *','name','text'],['Username *','username','text'],['Password *','password','password'],['Email','email','email'],['Phone','phone','tel'],['Department','department','text']].map(([label, key, type]) => (
            <div key={key} className="form-group">
              <label>{label}</label>
              <input className="inp" type={type} value={newUser[key]||''} onChange={e => setNewUser(u => ({...u, [key]:e.target.value}))} />
            </div>
          ))}
          <div className="form-group">
            <label>Role</label>
            <select className="inp" value={newUser.role} onChange={e => setNewUser(u => ({...u, role:e.target.value}))}>
              <option value="student">Student</option><option value="faculty">Faculty</option><option value="librarian">Librarian</option><option value="admin">Admin</option>
            </select>
          </div>
        </div>
        <div className="modal-footer">
          <button className="btn btn-primary" onClick={handleAddUser}><i className="fas fa-save"></i> Create User</button>
          <button className="btn btn-outline" onClick={() => setShowAddUser(false)}>Cancel</button>
        </div>
      </Modal>

      {/* Edit User Modal */}
      <Modal title={<><i className="fas fa-user-edit"></i> Edit User</>} open={showEditUser} onClose={() => setShowEditUser(false)}>
        <div className="form-grid">
          {[['Full Name','name','text'],['Username','username','text'],['Email','email','email'],['Phone','phone','tel'],['Department','department','text']].map(([label, key, type]) => (
            <div key={key} className="form-group">
              <label>{label}</label>
              <input className="inp" type={type} value={editUser[key]||''} onChange={e => setEditUser(u => ({...u, [key]:e.target.value}))} />
            </div>
          ))}
          <div className="form-group"><label>Role</label><select className="inp" value={editUser.role||'student'} onChange={e => setEditUser(u => ({...u, role:e.target.value}))}><option value="student">Student</option><option value="faculty">Faculty</option><option value="librarian">Librarian</option><option value="admin">Admin</option></select></div>
          <div className="form-group"><label>Status</label><select className="inp" value={editUser.active !== false ? 'true':'false'} onChange={e => setEditUser(u => ({...u, active:e.target.value==='true'}))}><option value="true">Active</option><option value="false">Inactive</option></select></div>
        </div>
        <div className="modal-footer">
          <button className="btn btn-primary" onClick={handleEditUser}><i className="fas fa-save"></i> Save Changes</button>
          <button className="btn btn-outline" onClick={() => setShowEditUser(false)}>Cancel</button>
        </div>
      </Modal>

      {/* Add Book Modal */}
      <Modal title={<><i className="fas fa-plus-circle"></i> Add New Book</>} open={showAddBook} onClose={() => setShowAddBook(false)}>
        <div className="form-grid">
          <div className="form-group" style={{gridColumn:'1/-1'}}><label>Book Title *</label><input className="inp" value={newBook.title} onChange={e => setNewBook(b => ({...b, title:e.target.value}))} placeholder="e.g. Introduction to Algorithms"/></div>
          {[['Author *','author','text'],['ISBN *','isbn','text'],['Publisher','publisher','text'],['Edition','edition','text'],['Year','year','number'],['Total Copies *','copies','number'],['Shelf Location','location','text']].map(([label, key, type]) => (
            <div key={key} className="form-group"><label>{label}</label><input className="inp" type={type} value={newBook[key]||''} onChange={e => setNewBook(b => ({...b, [key]:e.target.value}))}/></div>
          ))}
          <div className="form-group"><label>Category</label><select className="inp" value={newBook.category} onChange={e => setNewBook(b => ({...b, category:e.target.value}))}>{categories.map(c => <option key={c}>{c}</option>)}</select></div>
        </div>
        <div className="modal-footer">
          <button className="btn btn-success" onClick={handleAddBook}><i className="fas fa-plus"></i> Add Book</button>
          <button className="btn btn-outline" onClick={() => setShowAddBook(false)}>Cancel</button>
        </div>
      </Modal>

      {/* Edit Book Modal */}
      <Modal title={<><i className="fas fa-book-open"></i> Edit Book</>} open={showEditBook} onClose={() => setShowEditBook(false)}>
        <div className="form-grid">
          <div className="form-group" style={{gridColumn:'1/-1'}}><label>Title</label><input className="inp" value={editBook.title||''} onChange={e => setEditBook(b => ({...b, title:e.target.value}))}/></div>
          {[['Author','author','text'],['ISBN','isbn','text'],['Publisher','publisher','text'],['Copies','copies','number'],['Edition','edition','text'],['Location','location','text']].map(([label, key, type]) => (
            <div key={key} className="form-group"><label>{label}</label><input className="inp" type={type} value={editBook[key]||''} onChange={e => setEditBook(b => ({...b, [key]:e.target.value}))}/></div>
          ))}
          <div className="form-group"><label>Category</label><select className="inp" value={editBook.category||'Other'} onChange={e => setEditBook(b => ({...b, category:e.target.value}))}>{categories.map(c => <option key={c}>{c}</option>)}</select></div>
        </div>
        <div className="modal-footer">
          <button className="btn btn-primary" onClick={handleEditBook}><i className="fas fa-save"></i> Save Changes</button>
          <button className="btn btn-outline" onClick={() => setShowEditBook(false)}>Cancel</button>
        </div>
      </Modal>

      {/* Confirm Modal */}
      {showConfirm && (
        <div className="modal-overlay open" onClick={e => e.target===e.currentTarget && setShowConfirm(false)}>
          <div className="modal-box" style={{maxWidth:'380px'}}>
            <div className="modal-title">{confirmData.title}</div>
            <p style={{color:'var(--muted)',fontSize:'.9rem'}}>{confirmData.msg}</p>
            <div className="modal-footer">
              <button className="btn btn-danger" onClick={confirmData.action}>Yes, Proceed</button>
              <button className="btn btn-outline" onClick={() => setShowConfirm(false)}>Cancel</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
