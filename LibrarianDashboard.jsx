import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { clearSession, getSession } from '../utils/auth';
import { booksAPI, usersAPI, issuesAPI, requestsAPI, feedbackAPI, settingsAPI, notificationsAPI } from '../utils/api';
import { useToast } from '../context/ToastContext';
import Logo from '../components/Logo';

function Pill({ text, type }) { return <span className={`pill pill-${type}`}>{text}</span>; }

function Modal({ title, open, onClose, children }) {
  if (!open) return null;
  return (
    <div className="modal-overlay open" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal-box" style={{maxWidth:'500px'}}>
        <div className="modal-title">{title}</div>
        {children}
      </div>
    </div>
  );
}

function FeedItem({ color, name, title, sub, subColor }) {
  return (
    <div style={{display:'flex',gap:'.75rem',padding:'.7rem 1.5rem',borderBottom:'1px solid #f8fafc',alignItems:'flex-start'}}>
      <div style={{width:'10px',height:'10px',borderRadius:'50%',background:color,marginTop:'5px',flexShrink:0}}></div>
      <div>
        <div style={{fontSize:'.87rem'}}><strong>{name}</strong> – {title}</div>
        <div style={{fontSize:'.75rem',color:subColor||'var(--muted)',marginTop:'2px',fontWeight:subColor?700:400}}>{sub}</div>
      </div>
    </div>
  );
}

export default function LibrarianDashboard() {
  const navigate = useNavigate();
  const toast = useToast();
  const session = getSession();
  const [section, setSection] = useState('overview');
  const [books, setBooks] = useState([]);
  const [users, setUsers] = useState([]);
  const [issues, setIssues] = useState([]);
  const [requests, setRequests] = useState([]);
  const [feedback, setFeedback] = useState([]);
  const [settings, setSettings] = useState({ finePerDay:5, daysStudent:14, daysFaculty:30 });
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [sidebarMinimized, setSidebarMinimized] = useState(false);
  const [showNotif, setShowNotif] = useState(false);
  const [seenNotifs, setSeenNotifs] = useState(new Set());
  const [dbNotifications, setDbNotifications] = useState([]);
  const [showSuggest, setShowSuggest] = useState(false);
  const [suggestBook, setSuggestBook] = useState({ title: '', author: '', note: '' });

  // Issue book
  const [issueUser, setIssueUser] = useState('');
  const [issueBook, setIssueBook] = useState('');
  const [issuePreview, setIssuePreview] = useState('');
  const [bookSearch, setBookSearch] = useState('');

  // Return search
  const [returnSearch, setReturnSearch] = useState('');

  // Catalog search
  const [catSearch, setCatSearch] = useState('');

  // Members search
  const [memSearch, setMemSearch] = useState('');

  // Request filter
  const [reqFilter, setReqFilter] = useState('pending');

  async function loadAll() {
    try {
      const [b, u, i, r, f, s, notifs] = await Promise.all([
        booksAPI.getAll(), usersAPI.getAll(), issuesAPI.getAll(),
        requestsAPI.getAll(), feedbackAPI.getAll(), settingsAPI.get(), notificationsAPI.getByUser(session?.id)
      ]);
      setBooks(b.data); setUsers(u.data); setIssues(i.data);
      setRequests(r.data); setFeedback(f.data); setDbNotifications(notifs.data);
      if (s.data) setSettings(s.data);
    } catch { toast('Backend not connected', 'err'); }
  }

  useEffect(() => {
    if (!session || session.role !== 'librarian') { navigate('/login'); return; }
    loadAll();
  }, [navigate, session]);

  function logout() { clearSession(); navigate('/'); }
  function go(s) { setSection(s); setSidebarOpen(false); }

  async function handleSuggestBook() {
    if (!suggestBook.title) { toast('Please provide a title.', 'err'); return; }
    try {
      await notificationsAPI.create({
        role: 'admin',
        title: 'New Book Suggestion',
        text: `Librarian ${session?.name} suggested adding "${suggestBook.title}" by ${suggestBook.author||'Unknown'}. ${suggestBook.note ? 'Note: '+suggestBook.note : ''}`,
        icon: 'fa-solid fa-lightbulb text-info'
      });
      toast('Suggestion sent to admin!', 'ok');
      setShowSuggest(false);
      setSuggestBook({ title: '', author: '', note: '' });
    } catch(e) { toast('Error sending suggestion.', 'err'); }
  }

  const today = new Date().toISOString().slice(0,10);

  function calcFine(issue, overrideReturnDate) {
    if (!issue) return 0;
    const u = getUser(issue.user);
    if (u && u.role === 'faculty') return 0;
    const due = new Date(issue.dueDate); const ret = new Date(overrideReturnDate || issue.returnDate || today);
    if (ret <= due) return 0;
    return Math.ceil((ret - due) / 86400000) * (settings.finePerDay || 5);
  }
  function getName(id) { const u = users.find(x => x._id === (id?._id || id)); return u?.name || '?'; }
  function getTitle(id) { const b = books.find(x => x._id === (id?._id || id)); return b?.title || '?'; }
  function getUser(id) { return users.find(x => x._id === (id?._id || id)); }
  function getBook(id) { return books.find(x => x._id === (id?._id || id)); }

  const activeIssues = issues.filter(i => !i.returnDate);
  const overdueIssues = activeIssues.filter(i => (i.dueDate?.toString().slice(0,10) || '') < today);
  const pendingReqs = requests.filter(r => r.status === 'pending');

  const notifications = [];
  if (pendingReqs.length > 0) notifications.push({ id:'reqs', icon:'fa-clipboard-list text-info', title:'Pending Requests', text:`${pendingReqs.length} book request(s) waiting for approval.`, time:'Action Required' });
  if (overdueIssues.length > 0) notifications.push({ id:'ov', icon:'fa-exclamation-circle text-err', title:'Overdue Issues', text:`There are ${overdueIssues.length} overdue books to follow up on.`, time:'Alert' });
  dbNotifications.forEach(n => {
    notifications.push({ id: n._id, icon: n.icon, title: n.title, text: n.text, time: (n.createdAt||'').slice(0,10), isRead: n.isRead, isDb: true });
  });

  const pageMeta = {
    overview:  ['Dashboard',       'Library circulation overview'],
    requests:  ['Book Requests',   'Member book requests awaiting action'],
    issue:     ['Issue Book',      'Assign book to member'],
    return:    ['Return Book',     'Process book returns'],
    overdue:   ['Overdue Books',   'Track overdue items'],
    catalog:   ['Book Catalog',    'Browse all books'],
    members:   ['Members',         'View member details'],
    feedback:  ['Member Feedback', 'View submitted feedback'],
  };
  const [ptitle, psub] = pageMeta[section] || [section, ''];

  // ─── ISSUE BOOK ───
  const filteredBooksForIssue = books.filter(b =>
    b.available > 0 && (!bookSearch || b.title.toLowerCase().includes(bookSearch.toLowerCase()) || b.author.toLowerCase().includes(bookSearch.toLowerCase()))
  );

  function onIssueUserChange(uid) {
    setIssueUser(uid); buildPreview(uid, issueBook);
  }
  function onIssueBookChange(bid) {
    setIssueBook(bid); buildPreview(issueUser, bid);
  }
  function buildPreview(uid, bid) {
    if (!uid || !bid) { setIssuePreview(''); return; }
    const u = users.find(x => x._id === uid); const b = books.find(x => x._id === bid);
    if (!u || !b) { setIssuePreview(''); return; }
    const days = u.role === 'faculty' ? (settings.daysFaculty || 30) : (settings.daysStudent || 14);
    const due = new Date(); due.setDate(due.getDate() + days);
    setIssuePreview(`<strong>${u.name}</strong> will receive <strong>${b.title}</strong> — due on <strong>${due.toISOString().slice(0,10)}</strong> (${days} days)`);
  }

  async function handleIssue() {
    if (!issueUser || !issueBook) { toast('Select member and book', 'err'); return; }
    try {
      const u = users.find(x => x._id === issueUser); const role = u?.role || 'student';
      const days = role === 'faculty' ? (settings.daysFaculty||30) : (settings.daysStudent||14);
      const dueDate = new Date(); dueDate.setDate(dueDate.getDate() + days);
      await issuesAPI.issue({ userId: issueUser, bookId: issueBook, dueDate: dueDate.toISOString().slice(0,10) });
      toast('Book issued successfully!', 'ok');
      setIssueUser(''); setIssueBook(''); setIssuePreview('');
      loadAll();
    } catch(e) { toast(e.response?.data?.message || 'Error issuing book', 'err'); }
  }

  // ─── RETURN ───
  const filteredReturns = activeIssues.filter(i => {
    const q = returnSearch.toLowerCase();
    const uName = i.user?.name || getName(i.user); const bTitle = i.book?.title || getTitle(i.book);
    return !q || uName.toLowerCase().includes(q) || bTitle.toLowerCase().includes(q);
  });

  async function handleReturn(issueId, fine) {
    try {
      await issuesAPI.return(issueId, { fine, returnDate: today });
      toast(`Book returned! Fine: ₹${fine}`, 'ok');
      loadAll();
    } catch(e) { toast(e.response?.data?.message || 'Error', 'err'); }
  }

  // ─── REQUESTS ───
  const filteredReqs = requests.filter(r => reqFilter === 'all' ? true : r.status === reqFilter).reverse();

  async function handleApprove(req) {
    try {
      const u = getUser(req.user?._id || req.userId); const role = u?.role || 'student';
      const days = role === 'faculty' ? (settings.daysFaculty||30) : (settings.daysStudent||14);
      const dueDate = new Date(); dueDate.setDate(dueDate.getDate() + days);
      await requestsAPI.approve(req._id, { bookId: req.book?._id||req.bookId, userId: req.user?._id||req.userId, dueDate: dueDate.toISOString().slice(0,10), days });
      toast('Request approved & book issued!', 'ok'); loadAll();
    } catch(e) { toast(e.response?.data?.message || 'Error', 'err'); }
  }

  async function handleReject(req) {
    try {
      await requestsAPI.reject(req._id, { message: 'Request rejected by librarian.' });
      toast('Request rejected', 'ok'); loadAll();
    } catch(e) { toast(e.response?.data?.message || 'Error', 'err'); }
  }

  // ─── CATALOG ───
  const filteredCatalog = books.filter(b => {
    const q = catSearch.toLowerCase();
    return !q || b.title.toLowerCase().includes(q) || b.author.toLowerCase().includes(q) || (b.isbn&&b.isbn.includes(q)) || (b.category&&b.category.toLowerCase().includes(q));
  });

  // ─── MEMBERS ───
  const filteredMembers = users.filter(u => (u.role==='student'||u.role==='faculty') && (!memSearch || (u.name||'').toLowerCase().includes(memSearch.toLowerCase()) || u.username.toLowerCase().includes(memSearch.toLowerCase())));

  // ─── TODAY's ACTIVITY ───
  const todayActivity = [
    ...issues.filter(i => (i.issueDate?.toString().slice(0,10)||'') === today).map(i => ({...i, act:'Issued'})),
    ...issues.filter(i => (i.returnDate?.toString().slice(0,10)||'') === today).map(i => ({...i, act:'Returned'}))
  ].slice(0,6);

  // ─── OVERDUE FEED (for dashboard) ───
  const overdueFeed = overdueIssues.slice(0,5);

  // ─── RECENT TX ───
  const recentTx = [...issues].reverse().slice(0,8);

  return (
    <div className="app">
      {/* Sidebar */}
      <aside className={`sidebar ${sidebarOpen?'open':''} ${sidebarMinimized?'minimized':''}`} style={{background:'linear-gradient(180deg,#78350f 0%,#92400e 50%,#b45309 100%)',transition:'width 0.3s ease'}}>
        <div className="sidebar-brand" style={{display:'flex',alignItems:'center',justifyContent:'space-between',padding:'1rem'}}>
          <div style={{display:'flex',alignItems:'center',gap:'.5rem',minWidth:0,flex:1}}>
            <Logo size="md" animated={true} variant="dark" />
            {!sidebarMinimized && <div className="brand-text">CSE<span>Library</span></div>}
          </div>
          <button className="sidebar-toggle" onClick={() => setSidebarMinimized(!sidebarMinimized)} style={{background:'none',border:'none',color:'#fff',cursor:'pointer',padding:'.5rem',display:'flex',alignItems:'center',fontSize:'1rem',opacity:.8,transition:'opacity 0.2s'}} title={sidebarMinimized?'Expand':'Collapse'}>
            <i className={`fas ${sidebarMinimized?'fa-chevron-right':'fa-chevron-left'}`}></i>
          </button>
        </div>
        <nav className="sidebar-nav">
          {!sidebarMinimized && <span className="nav-label">Operations</span>}
          <button className={`nav-item ${section==='overview'?'active':''}`} onClick={() => go('overview')} title={sidebarMinimized?'Dashboard':''} style={{justifyContent:sidebarMinimized?'center':'flex-start'}}><i className="fas fa-chart-line"></i>{!sidebarMinimized && <span>Dashboard</span>}</button>
          <button className={`nav-item ${section==='requests'?'active':''}`} onClick={() => go('requests')} title={sidebarMinimized?'Requests':''} style={{justifyContent:sidebarMinimized?'center':'space-between'}}>
            <i className="fas fa-clipboard-list"></i>{!sidebarMinimized && <span>Requests</span>}
            {pendingReqs.length > 0 && <span style={{background:'#ef4444',color:'#fff',borderRadius:'50%',width:'1.2rem',height:'1.2rem',display:'flex',alignItems:'center',justifyContent:'center',fontSize:'.65rem',fontWeight:700,flexShrink:0}}>{pendingReqs.length}</span>}
          </button>
          <button className={`nav-item ${section==='issue'?'active':''}`} onClick={() => go('issue')} title={sidebarMinimized?'Issue':''} style={{justifyContent:sidebarMinimized?'center':'flex-start'}}><i className="fas fa-arrow-right"></i>{!sidebarMinimized && <span>Issue</span>}</button>
          <button className={`nav-item ${section==='return'?'active':''}`} onClick={() => go('return')} title={sidebarMinimized?'Return':''} style={{justifyContent:sidebarMinimized?'center':'flex-start'}}><i className="fas fa-arrow-left"></i>{!sidebarMinimized && <span>Return</span>}</button>
          <button className={`nav-item ${section==='overdue'?'active':''}`} onClick={() => go('overdue')} title={sidebarMinimized?'Overdue':''} style={{justifyContent:sidebarMinimized?'center':'space-between'}}>
            <i className="fas fa-exclamation-triangle"></i>{!sidebarMinimized && <span>Overdue</span>}
            {overdueIssues.length > 0 && <span style={{background:'#ef4444',color:'#fff',borderRadius:'50%',width:'1.2rem',height:'1.2rem',display:'flex',alignItems:'center',justifyContent:'center',fontSize:'.65rem',fontWeight:700,flexShrink:0}}>{overdueIssues.length}</span>}
          </button>
          {!sidebarMinimized && <div className="nav-divider"></div>}
          {!sidebarMinimized && <span className="nav-label">Library</span>}
          <button className={`nav-item ${section==='catalog'?'active':''}`} onClick={() => go('catalog')} title={sidebarMinimized?'Catalog':''} style={{justifyContent:sidebarMinimized?'center':'flex-start'}}><i className="fas fa-book"></i>{!sidebarMinimized && <span>Catalog</span>}</button>
          <button className={`nav-item ${section==='members'?'active':''}`} onClick={() => go('members')} title={sidebarMinimized?'Members':''} style={{justifyContent:sidebarMinimized?'center':'flex-start'}}><i className="fas fa-users"></i>{!sidebarMinimized && <span>Members</span>}</button>
          <button className={`nav-item ${section==='feedback'?'active':''}`} onClick={() => go('feedback')} title={sidebarMinimized?'Feedback':''} style={{justifyContent:sidebarMinimized?'center':'flex-start'}}><i className="fas fa-comments"></i>{!sidebarMinimized && <span>Feedback</span>}</button>
        </nav>
        <div className="sidebar-footer">
          <div className="user-card" style={{flexDirection:sidebarMinimized?'column':'row',textAlign:sidebarMinimized?'center':'left'}}>
            <div className="user-avatar" style={{background:'linear-gradient(135deg,#b45309,#d97706)',color:'#fff'}}>{(session?.name||'L')[0]}</div>
            {!sidebarMinimized && <div className="user-meta"><div className="name">{session?.name||'Librarian'}</div><div className="role">Librarian</div></div>}
          </div>
        </div>
      </aside>

      {/* Main */}
      <div className="main">
        <div className="topbar">
          <div className="topbar-left">
            <button className="topbar-btn" onClick={() => setSidebarOpen(!sidebarOpen)}><i className="fas fa-bars"></i></button>
            <div><div className="page-title">{ptitle}</div><div className="page-sub">{psub}</div></div>
          </div>
          <div className="topbar-right">
            <div className="notif-wrapper">
              <button className="topbar-btn" onClick={() => {
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
                {notifications.filter(n => (n.isDb ? !n.isRead : !seenNotifs.has(n.id))).length > 0 && <span className="notif-badge">{notifications.filter(n => (n.isDb ? !n.isRead : !seenNotifs.has(n.id))).length}</span>}
              </button>
              {showNotif && (
                <div className="notif-dropdown">
                  <div className="notif-header">Notifications <span style={{fontSize:'.75rem',color:'var(--accent)',cursor:'pointer'}} onClick={()=>setShowNotif(false)}>Close</span></div>
                  {notifications.length === 0 ? (
                    <div className="notif-empty"><i className="fas fa-bell-slash"></i> All caught up!</div>
                  ) : (
                    <div className="notif-list">
                      {notifications.map((n, idx) => (
                        <div key={n.id||idx} className="notif-item">
                          <div className={`notif-icon ${n.icon.includes('text-err')?'err':n.icon.includes('text-warn')?'warn':n.icon.includes('text-ok')?'ok':'info'}`}><i className={`fas ${n.icon.split(' ')[0]}`}></i></div>
                          <div>
                            <div style={{fontWeight:700,fontSize:'.85rem'}}>{n.title}</div>
                            <div className="notif-text">{n.text}</div>
                            <span className="notif-time">{n.time}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
            <button className="logout-link" onClick={logout}><i className="fas fa-sign-out-alt"></i> Logout</button>
          </div>
        </div>

        <div className="content">

          {/* ══ OVERVIEW DASHBOARD ══ */}
          {section === 'overview' && (
            <div>
              {/* Stats */}
              <div className="stats-row">
                <div className="stat-box"><div className="stat-ico amber"><i className="fas fa-book-open"></i></div><div className="stat-info"><div className="value">{activeIssues.length}</div><div className="label">Active Issues</div></div></div>
                <div className="stat-box"><div className="stat-ico green"><i className="fas fa-undo"></i></div><div className="stat-info"><div className="value">{issues.filter(i=>(i.returnDate?.toString().slice(0,10)||'')===today).length}</div><div className="label">Returns Today</div></div></div>
                <div className="stat-box"><div className="stat-ico red"><i className="fas fa-times-circle"></i></div><div className="stat-info"><div className="value">{overdueIssues.length}</div><div className="label">Overdue</div></div></div>
                <div className="stat-box"><div className="stat-ico blue"><i className="fas fa-check"></i></div><div className="stat-info"><div className="value">{books.reduce((a,b)=>a+b.available,0)}</div><div className="label">Available</div></div></div>
                <div className="stat-box"><div className="stat-ico red"><i className="fas fa-rupee-sign"></i></div><div className="stat-info"><div className="value">₹{overdueIssues.reduce((a,i)=>a+calcFine(i),0)}</div><div className="label">Pending Fines</div></div></div>
              </div>

              {/* Today's Activity + Overdue Alerts */}
              <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'1.5rem',marginBottom:'2rem'}}>
                {/* Today's Activity */}
                <div className="card">
                  <div className="card-header"><span className="card-title"><i className="fas fa-clock" style={{color:'#f59e0b',fontSize:'1.1rem'}}></i> Today's Activity</span></div>
                  <div className="card-body" style={{padding:0}}>
                    {todayActivity.length === 0
                      ? <div style={{textAlign:'center',padding:'2rem',color:'var(--muted)'}}><i className="fas fa-calendar-day" style={{fontSize:'2rem',marginBottom:'.5rem',opacity:.5,display:'block'}}></i><p>No activity yet</p></div>
                      : todayActivity.map((i, idx) => {
                          const uName = i.user?.name || getName(i.user);
                          const bTitle = (i.book?.title || getTitle(i.book))?.substring(0,24);
                          const type = i.act;
                          return <FeedItem key={idx} color={type==='Returned'?'#10b981':'#f59e0b'} name={uName} title={bTitle} sub={type}/>;
                        })
                    }
                  </div>
                </div>

                {/* Overdue Alerts */}
                <div className="card">
                  <div className="card-header"><span className="card-title"><i className="fas fa-exclamation" style={{color:'#ef4444',fontSize:'1.1rem'}}></i> Overdue Alerts</span></div>
                  <div className="card-body" style={{padding:0}}>
                    {overdueFeed.length === 0
                      ? <div style={{textAlign:'center',padding:'2rem',color:'var(--muted)'}}><i className="fas fa-check-circle" style={{fontSize:'2rem',marginBottom:'.5rem',opacity:.5,display:'block'}}></i><p>All good! 🎉</p></div>
                      : overdueFeed.map((i, idx) => {
                          const uName = i.user?.name || getName(i.user);
                          const bTitle = (i.book?.title || getTitle(i.book))?.substring(0,22);
                          const days = Math.ceil((new Date(today) - new Date(i.dueDate)) / 86400000);
                          const fineAmount = calcFine(i);
                          return <FeedItem key={idx} color='#ef4444' name={uName} title={bTitle} sub={`${days} days · ₹${fineAmount}`} subColor='#ef4444'/>;
                        })
                    }
                  </div>
                </div>
              </div>

              {/* Recent Transactions */}
              <div className="card">
                <div className="card-header"><span className="card-title"><i className="fas fa-list" style={{color:'#3b82f6',fontSize:'1.1rem'}}></i> Recent Transactions</span></div>
                <div className="card-body" style={{padding:0}}>
                  <div className="tbl-wrap"><table>
                    <thead><tr><th>Member</th><th>Book</th><th style={{textAlign:'center'}}>Issued</th><th style={{textAlign:'center'}}>Due</th><th style={{textAlign:'center'}}>Status</th><th style={{textAlign:'center'}}>Fine</th></tr></thead>
                    <tbody>
                      {recentTx.map((i, idx) => {
                        const uName = i.user?.name || getName(i.user);
                        const bTitle = (i.book?.title || getTitle(i.book))?.substring(0,26);
                        const fine = calcFine(i);
                        const isOv = !i.returnDate && (i.dueDate?.toString().slice(0,10)||'') < today;
                        const st = i.returnDate ? <Pill text="Returned" type="ok"/> : isOv ? <Pill text="Overdue" type="err"/> : <Pill text="Active" type="warn"/>;
                        return <tr key={idx} style={{background:idx%2?'#fafafa':''}}>
                          <td className="fw-700" style={{fontSize:'.86rem'}}>{uName}</td>
                          <td style={{fontSize:'.84rem'}}>{bTitle}</td>
                          <td style={{fontSize:'.84rem',textAlign:'center'}}>{(i.issueDate?.toString()||'').slice(0,10)}</td>
                          <td style={{fontSize:'.84rem',textAlign:'center',color:isOv?'var(--err)':'',fontWeight:isOv?700:400}}>{(i.dueDate?.toString()||'').slice(0,10)}</td>
                          <td style={{textAlign:'center'}}>{st}</td>
                          <td style={{textAlign:'center',fontSize:'.84rem',color:fine>0?'var(--err)':'',fontWeight:fine>0?700:400}}>₹{fine}</td>
                        </tr>;
                      })}
                      {issues.length === 0 && <tr><td colSpan={6}><div style={{textAlign:'center',padding:'2rem',color:'var(--muted)'}}><i className="fas fa-inbox" style={{fontSize:'2rem',marginBottom:'.5rem',opacity:.5,display:'block'}}></i><p>No transactions yet</p></div></td></tr>}
                    </tbody>
                  </table></div>
                </div>
              </div>
            </div>
          )}

          {/* ══ BOOK REQUESTS ══ */}
          {section === 'requests' && (
            <div>
              <div style={{marginBottom:'1.5rem'}}><h2 style={{fontSize:'1.5rem',fontWeight:800,display:'flex',alignItems:'center',gap:'.75rem'}}><i className="fas fa-clipboard-list" style={{color:'#7c3aed'}}></i>Book Requests</h2></div>
              {pendingReqs.length > 0 && <div style={{background:'#fef3c7',border:'1px solid #fcd34d',borderRadius:'12px',padding:'1rem 1.25rem',marginBottom:'1.5rem',display:'flex',alignItems:'center',gap:'.75rem',color:'#92400e'}}><i className="fas fa-info-circle" style={{fontSize:'1rem'}}></i><span><strong>{pendingReqs.length} pending request(s)</strong> awaiting your review</span></div>}
              <div className="card">
                <div className="card-header">
                  <span className="card-title">Member Requests</span>
                  <select className="inp" style={{width:'150px',borderRadius:'20px',margin:0}} value={reqFilter} onChange={e => setReqFilter(e.target.value)}>
                    <option value="pending">Pending</option><option value="approved">Approved</option><option value="rejected">Rejected</option><option value="all">All</option>
                  </select>
                </div>
                <div className="card-body" style={{padding:0}}>
                  <div className="tbl-wrap"><table>
                    <thead><tr><th>Member</th><th>Book</th><th style={{textAlign:'center'}}>Requested</th><th>Status</th><th style={{textAlign:'center'}}>Actions</th></tr></thead>
                    <tbody>
                      {filteredReqs.map((r, idx) => {
                        const uName = r.user?.name || getName(r.userId||r.user?._id);
                        const uSub  = r.user?.rollNo || r.user?.employeeId || r.user?.username || '';
                        const bTitle = r.book?.title || getTitle(r.bookId||r.book?._id);
                        const bAvail = books.find(x=>x._id===(r.book?._id||r.bookId))?.available || 0;
                        const isPending = r.status === 'pending';
                        const st = r.status==='pending'?<Pill text="Pending" type="warn"/>:r.status==='approved'?<Pill text="Approved" type="ok"/>:<Pill text="Rejected" type="err"/>;
                        return <tr key={idx} style={{background:idx%2?'#fafafa':''}}>
                          <td><div className="fw-700" style={{fontSize:'.86rem'}}>{uName}</div><div style={{fontSize:'.74rem',color:'var(--muted)'}}>{uSub}</div></td>
                          <td style={{fontSize:'.84rem'}}>{bTitle?.substring(0,28)}<br/><span style={{fontSize:'.75rem',color:bAvail>0?'var(--ok)':'var(--err)'}}>Available: {bAvail}</span></td>
                          <td style={{fontSize:'.84rem',textAlign:'center'}}>{(r.requestDate||r.createdAt||'').toString().slice(0,10)}</td>
                          <td>{st}</td>
                          <td style={{textAlign:'center'}}>{isPending && <div style={{display:'flex',gap:'.5rem',justifyContent:'center',flexWrap:'wrap'}}>
                            <button className="btn btn-success btn-sm" onClick={() => handleApprove(r)} disabled={bAvail<1}><i className="fas fa-check"></i> Approve</button>
                            <button className="btn btn-outline btn-sm" onClick={() => handleReject(r)}><i className="fas fa-times"></i> Reject</button>
                          </div>}</td>
                        </tr>;
                      })}
                      {filteredReqs.length===0 && <tr><td colSpan={5}><div style={{textAlign:'center',padding:'2rem',color:'var(--muted)'}}><i className="fas fa-inbox" style={{fontSize:'2rem',marginBottom:'.5rem',opacity:.5,display:'block'}}></i><p>No requests found</p></div></td></tr>}
                    </tbody>
                  </table></div>
                </div>
              </div>
            </div>
          )}

          {/* ══ ISSUE BOOK ══ */}
          {section === 'issue' && (
            <div>
              <div style={{marginBottom:'1.5rem'}}><h2 style={{fontSize:'1.5rem',fontWeight:800,display:'flex',alignItems:'center',gap:'.75rem'}}><i className="fas fa-arrow-right" style={{color:'#d97706'}}></i>Issue Book</h2></div>
              <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'2rem'}}>
                {/* Left: Form */}
                <div className="card">
                  <div className="card-header"><span className="card-title">Select Member &amp; Book</span></div>
                  <div className="card-body">
                    <div className="form-group">
                      <label>Member</label>
                      <select className="inp" value={issueUser} onChange={e => onIssueUserChange(e.target.value)}>
                        <option value="">— Select Member —</option>
                        {users.filter(u=>u.role==='student'||u.role==='faculty').map(u => (
                          <option key={u._id} value={u._id}>{u.name} ({u.role}) · {u.rollNo||u.username}</option>
                        ))}
                      </select>
                    </div>
                    <div className="form-group">
                      <label>Book</label>
                      <div className="search-wrap" style={{marginBottom:'.5rem'}}><i className="fas fa-search"></i><input className="search-inp" placeholder="Search books…" value={bookSearch} onChange={e => setBookSearch(e.target.value)}/></div>
                      <select className="inp" size={5} style={{height:'160px'}} value={issueBook} onChange={e => onIssueBookChange(e.target.value)}>
                        {filteredBooksForIssue.map(b => <option key={b._id} value={b._id}>{b.title} [{b.available} avail.]</option>)}
                      </select>
                    </div>
                    {issuePreview && (
                      <div style={{background:'#dbeafe',border:'1px solid #93c5fd',borderRadius:'12px',padding:'1rem 1.25rem',marginBottom:'1rem',display:'flex',alignItems:'center',gap:'.75rem',color:'#1e40af'}}><i className="fas fa-info-circle" style={{fontSize:'1rem'}}></i><span dangerouslySetInnerHTML={{__html:issuePreview}}/></div>
                    )}
                    <button className="btn btn-success" onClick={handleIssue} disabled={!issueUser||!issueBook}><i className="fas fa-check"></i> Issue Book</button>
                  </div>
                </div>

                {/* Right: Recently Issued */}
                <div className="card">
                  <div className="card-header"><span className="card-title"><i className="fas fa-clock" style={{color:'#f59e0b'}}></i> Recently Issued</span></div>
                  <div className="card-body" style={{padding:0}}>
                    <div className="tbl-wrap"><table>
                      <thead><tr><th>Member</th><th>Book</th><th style={{textAlign:'center'}}>Due</th><th style={{textAlign:'center'}}>Status</th></tr></thead>
                      <tbody>
                        {activeIssues.slice(-5).reverse().map((i, idx) => {
                          const uName = i.user?.name || getName(i.user);
                          const bTitle = (i.book?.title || getTitle(i.book))?.substring(0,22);
                          const isOv = (i.dueDate?.toString().slice(0,10)||'') < today;
                          return <tr key={idx} style={{background:idx%2?'#fafafa':''}}>
                            <td className="fw-700" style={{fontSize:'.84rem'}}>{uName}</td>
                            <td style={{fontSize:'.83rem'}}>{bTitle}</td>
                            <td style={{fontSize:'.84rem',textAlign:'center',color:isOv?'var(--err)':'',fontWeight:isOv?700:400}}>{(i.dueDate?.toString()||'').slice(0,10)}</td>
                            <td style={{textAlign:'center'}}>{isOv?<Pill text="Overdue" type="err"/>:<Pill text="Active" type="warn"/>}</td>
                          </tr>;
                        })}
                        {activeIssues.length===0 && <tr><td colSpan={4}><div style={{textAlign:'center',padding:'2rem',color:'var(--muted)'}}><i className="fas fa-inbox" style={{fontSize:'2rem',marginBottom:'.5rem',opacity:.5,display:'block'}}></i><p>No active issues</p></div></td></tr>}
                      </tbody>
                    </table></div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ══ RETURN BOOK ══ */}
          {section === 'return' && (
            <div>
              <div style={{marginBottom:'1.5rem'}}><h2 style={{fontSize:'1.5rem',fontWeight:800,display:'flex',alignItems:'center',gap:'.75rem'}}><i className="fas fa-arrow-left" style={{color:'#059669'}}></i>Process Return</h2></div>
              <div className="card">
                <div className="card-header">
                  <span className="card-title">Active Borrowings</span>
                  <div className="search-wrap" style={{margin:0,width:'280px'}}><i className="fas fa-search"></i><input className="search-inp" placeholder="Search member or book…" value={returnSearch} onChange={e => setReturnSearch(e.target.value)}/></div>
                </div>
                <div className="card-body" style={{padding:0}}>
                  <div className="tbl-wrap"><table>
                    <thead><tr><th>Member</th><th>Book</th><th style={{textAlign:'center'}}>Issued</th><th style={{textAlign:'center'}}>Due</th><th style={{textAlign:'center'}}>Fine</th><th style={{textAlign:'center'}}>Action</th></tr></thead>
                    <tbody>
                      {filteredReturns.reverse().map((i, idx) => {
                        const uName = i.user?.name || getName(i.user);
                        const bTitle = (i.book?.title || getTitle(i.book))?.substring(0,26);
                        const fine = calcFine(i, today);
                        const isOv = (i.dueDate?.toString().slice(0,10)||'') < today;
                        return <tr key={idx} style={{background:idx%2?'#fafafa':''}}>
                          <td className="fw-700" style={{fontSize:'.86rem'}}>{uName}</td>
                          <td style={{fontSize:'.83rem'}}>{bTitle}</td>
                          <td style={{fontSize:'.84rem',textAlign:'center'}}>{(i.issueDate?.toString()||'').slice(0,10)}</td>
                          <td style={{fontSize:'.84rem',textAlign:'center',color:isOv?'var(--err)':'',fontWeight:isOv?700:400}}>{(i.dueDate?.toString()||'').slice(0,10)}{isOv?' ⚠️':''}</td>
                          <td style={{textAlign:'center',fontWeight:fine>0?700:400,color:fine>0?'var(--err)':''}}>₹{fine}</td>
                          <td style={{textAlign:'center'}}><button className="btn btn-success btn-sm" onClick={() => handleReturn(i._id, fine)}><i className="fas fa-check"></i> Return</button></td>
                        </tr>;
                      })}
                      {filteredReturns.length===0 && <tr><td colSpan={6}><div style={{textAlign:'center',padding:'2rem',color:'var(--muted)'}}><i className="fas fa-inbox" style={{fontSize:'2rem',marginBottom:'.5rem',opacity:.5,display:'block'}}></i><p>No active borrowings</p></div></td></tr>}
                    </tbody>
                  </table></div>
                </div>
              </div>
            </div>
          )}

          {/* ══ OVERDUE BOOKS ══ */}
          {section === 'overdue' && (
            <div>
              <div style={{marginBottom:'1.5rem'}}><h2 style={{fontSize:'1.5rem',fontWeight:800,display:'flex',alignItems:'center',gap:'.75rem'}}><i className="fas fa-exclamation-triangle" style={{color:'#ef4444'}}></i>Overdue Books</h2></div>
              {overdueIssues.length > 0 && <div style={{background:'#fee2e2',border:'1px solid #fca5a5',borderRadius:'12px',padding:'1rem 1.25rem',marginBottom:'1.5rem',display:'flex',alignItems:'center',gap:'.75rem',color:'#991b1b'}}><i className="fas fa-exclamation-circle" style={{fontSize:'1rem'}}></i><span><strong>{overdueIssues.length} overdue book(s)</strong> — total pending fine: ₹{overdueIssues.reduce((a,i)=>a+calcFine(i),0)}</span></div>}
              <div className="card">
                <div className="card-header"><span className="card-title">All Overdue Issues</span></div>
                <div className="card-body" style={{padding:0}}>
                  <div className="tbl-wrap"><table>
                    <thead><tr><th>Member</th><th>Contact</th><th>Book</th><th style={{textAlign:'center'}}>Due Date</th><th style={{textAlign:'center'}}>Days Overdue</th><th style={{textAlign:'center'}}>Fine</th><th style={{textAlign:'center'}}>Action</th></tr></thead>
                    <tbody>
                      {[...overdueIssues].sort((a,b) => (a.dueDate?.toString()||'').localeCompare(b.dueDate?.toString()||'')).map((i, idx) => {
                        const u = getUser(i.user?._id || i.user);
                        const bTitle = (i.book?.title || getTitle(i.book))?.substring(0,24);
                        const days = Math.ceil((new Date(today) - new Date(i.dueDate)) / 86400000);
                        const fine = calcFine(i);
                        return <tr key={idx} style={{background:idx%2?'#fafafa':''}}>
                          <td><div className="fw-700" style={{fontSize:'.86rem'}}>{u?.name||'?'}</div><div style={{fontSize:'.75rem',color:'var(--muted)'}}>{u?.department||''}</div></td>
                          <td style={{fontSize:'.8rem'}}>{u?.email||u?.phone||'—'}</td>
                          <td style={{fontSize:'.83rem'}}>{bTitle}</td>
                          <td style={{fontSize:'.84rem',textAlign:'center',color:'var(--err)',fontWeight:700}}>{(i.dueDate?.toString()||'').slice(0,10)}</td>
                          <td style={{fontSize:'.84rem',textAlign:'center',color:'var(--err)',fontWeight:700}}>{days} days</td>
                          <td style={{fontSize:'.84rem',textAlign:'center',color:'var(--err)',fontWeight:700}}>₹{fine}</td>
                          <td style={{textAlign:'center'}}><button className="btn btn-success btn-sm" onClick={() => handleReturn(i._id, fine)}><i className="fas fa-check"></i> Return</button></td>
                        </tr>;
                      })}
                      {overdueIssues.length===0 && <tr><td colSpan={7}><div style={{textAlign:'center',padding:'2rem',color:'var(--muted)'}}><i className="fas fa-check-circle" style={{fontSize:'2rem',marginBottom:'.5rem',opacity:.5,display:'block'}}></i><p>All books returned on time 🎉</p></div></td></tr>}
                    </tbody>
                  </table></div>
                </div>
              </div>
            </div>
          )}

          {/* ══ BOOK CATALOG ══ */}
          {section === 'catalog' && (
            <div>
              <div style={{marginBottom:'1.5rem',display:'flex',justifyContent:'space-between',alignItems:'center',flexWrap:'wrap',gap:'1rem'}}>
                <h2 style={{fontSize:'1.5rem',fontWeight:800,display:'flex',alignItems:'center',gap:'.75rem'}}><i className="fas fa-book" style={{color:'#2563eb'}}></i>Book Catalog</h2>
                <button className="btn btn-primary" onClick={() => setShowSuggest(true)}><i className="fas fa-lightbulb"></i> Suggest Book to Admin</button>
              </div>
              <div className="card">
                <div className="card-header">
                  <span className="card-title">All Books <span style={{background:'#f1f5f9',borderRadius:'20px',padding:'.15rem .6rem',fontSize:'.78rem',marginLeft:'6px',fontWeight:600}}>{filteredCatalog.length}</span></span>
                  <div className="search-wrap" style={{margin:0,width:'300px'}}><i className="fas fa-search"></i><input className="search-inp" placeholder="Title, author, ISBN, category…" value={catSearch} onChange={e => setCatSearch(e.target.value)}/></div>
                </div>
                <div className="card-body" style={{padding:0}}>
                  <div className="tbl-wrap"><table>
                    <thead><tr><th>Title &amp; Author</th><th>ISBN</th><th>Category</th><th style={{textAlign:'center'}}>Total</th><th style={{textAlign:'center'}}>Available</th><th>Location</th></tr></thead>
                    <tbody>
                      {filteredCatalog.map((b, idx) => (
                        <tr key={b._id} style={{background:idx%2?'#fafafa':''}}>
                          <td><div className="fw-700" style={{fontSize:'.87rem'}}>{b.title}</div><div style={{fontSize:'.75rem',color:'var(--muted)'}}>{b.author}{b.edition?` · ${b.edition} ed.`:''}</div></td>
                          <td><code style={{fontSize:'.8rem'}}>{b.isbn}</code></td>
                          <td><Pill text={b.category||'—'} type="info"/></td>
                          <td style={{textAlign:'center',fontWeight:700}}>{b.copies}</td>
                          <td style={{textAlign:'center'}}><span style={{fontWeight:700,color:b.available>0?'#10b981':'#ef4444'}}>{b.available}</span><span style={{color:'var(--muted)',fontSize:'.8rem'}}>/{b.copies}</span></td>
                          <td style={{fontSize:'.83rem'}}>{b.location||'—'}</td>
                        </tr>
                      ))}
                      {filteredCatalog.length===0 && <tr><td colSpan={6}><div style={{textAlign:'center',padding:'2rem',color:'var(--muted)'}}><i className="fas fa-inbox" style={{fontSize:'2rem',marginBottom:'.5rem',opacity:.5,display:'block'}}></i><p>No books found</p></div></td></tr>}
                    </tbody>
                  </table></div>
                </div>
              </div>
            </div>
          )}

          {/* ══ MEMBERS ══ */}
          {section === 'members' && (
            <div>
              <div style={{marginBottom:'1.5rem'}}><h2 style={{fontSize:'1.5rem',fontWeight:800,display:'flex',alignItems:'center',gap:'.75rem'}}><i className="fas fa-users" style={{color:'#7c3aed'}}></i>Members</h2></div>
              <div className="card">
                <div className="card-header">
                  <span className="card-title">All Members</span>
                  <div className="search-wrap" style={{margin:0,width:'280px'}}><i className="fas fa-search"></i><input className="search-inp" placeholder="Search members…" value={memSearch} onChange={e => setMemSearch(e.target.value)}/></div>
                </div>
                <div className="card-body" style={{padding:0}}>
                  <div className="tbl-wrap"><table>
                    <thead><tr><th>Member</th><th>ID</th><th>Role</th><th>Dept</th><th style={{textAlign:'center'}}>Issued</th><th style={{textAlign:'center'}}>Overdue</th><th style={{textAlign:'center'}}>Fine</th></tr></thead>
                    <tbody>
                      {filteredMembers.map((u, idx) => {
                        const myI = issues.filter(i => (i.user?._id||i.user) === u._id && !i.returnDate);
                        const ov  = myI.filter(i => (i.dueDate?.toString().slice(0,10)||'') < today).length;
                        const fine= myI.reduce((acc,i) => acc + calcFine(i), 0);
                        const bg  = u.role==='faculty'?'linear-gradient(135deg,#065f46,#059669)':'linear-gradient(135deg,#1e3a8a,#3b82f6)';
                        return <tr key={u._id} style={{background:idx%2?'#fafafa':''}}>
                          <td><div style={{display:'flex',alignItems:'center',gap:'.6rem'}}>
                            <div style={{width:'32px',height:'32px',borderRadius:'50%',background:bg,color:'#fff',fontSize:'.78rem',display:'flex',alignItems:'center',justifyContent:'center',fontWeight:800,flexShrink:0}}>{(u.name||'?')[0]}</div>
                            <div><div className="fw-700" style={{fontSize:'.86rem'}}>{u.name||'—'}</div><div style={{fontSize:'.73rem',color:'var(--muted)'}}>{u.email||''}</div></div>
                          </div></td>
                          <td style={{fontSize:'.82rem'}}>{u.rollNo||u.employeeId||u.username}</td>
                          <td><Pill text={u.role} type={u.role}/></td>
                          <td style={{fontSize:'.83rem'}}>{u.department||'—'}</td>
                          <td style={{textAlign:'center',fontWeight:700}}>{myI.length}</td>
                          <td style={{textAlign:'center',color:ov?'var(--err)':'',fontWeight:ov?700:400}}>{ov}</td>
                          <td style={{textAlign:'center',color:fine?'var(--err)':'',fontWeight:fine?700:400}}>₹{fine}</td>
                        </tr>;
                      })}
                      {filteredMembers.length===0 && <tr><td colSpan={7}><div style={{textAlign:'center',padding:'2rem',color:'var(--muted)'}}><i className="fas fa-inbox" style={{fontSize:'2rem',marginBottom:'.5rem',opacity:.5,display:'block'}}></i><p>No members found</p></div></td></tr>}
                    </tbody>
                  </table></div>
                </div>
              </div>
            </div>
          )}

          {/* ══ FEEDBACK ══ */}
          {section === 'feedback' && (
            <div>
              <div style={{marginBottom:'1.5rem'}}><h2 style={{fontSize:'1.5rem',fontWeight:800,display:'flex',alignItems:'center',gap:'.75rem'}}><i className="fas fa-comments" style={{color:'#d97706'}}></i>Member Feedback</h2></div>
              <div className="card">
                <div className="card-header"><span className="card-title">All Submitted Feedback</span></div>
                <div className="card-body" style={{padding:0}}>
                  {feedback.length === 0
                    ? <div style={{textAlign:'center',padding:'3rem 1.5rem',color:'var(--muted)'}}><i className="fas fa-comments" style={{fontSize:'2rem',marginBottom:'1rem',opacity:.5,display:'block'}}></i><p>No feedback submitted yet</p></div>
                    : [...feedback].reverse().map((f, i) => {
                        const uName = f.user?.name || getName(f.userId||f.user?._id);
                        const uRole = f.user?.role || '';
                        const stars = '★'.repeat(f.rating)+'☆'.repeat(5-f.rating);
                        return (
                          <div key={i} style={{padding:'1.25rem 1.5rem',borderBottom:'1px solid #f1f5f9',display:'flex',gap:'1rem',alignItems:'flex-start',background:i%2?'#fafafa':''}}>
                            <div style={{width:'40px',height:'40px',borderRadius:'50%',background:'linear-gradient(135deg,#1e3a8a,#3b82f6)',color:'#fff',display:'flex',alignItems:'center',justifyContent:'center',fontWeight:700,fontSize:'.9rem',flexShrink:0}}>{(uName||'?')[0]}</div>
                            <div style={{flex:1}}>
                              <div style={{display:'flex',alignItems:'center',gap:'.5rem',flexWrap:'wrap',marginBottom:'.4rem'}}>
                                <strong style={{fontSize:'.87rem'}}>{uName}</strong>
                                {uRole && <Pill text={uRole} type={uRole}/>}
                                <Pill text={f.category||'General'} type="info"/>
                                <span style={{marginLeft:'auto',fontSize:'.75rem',color:'var(--muted)',fontWeight:500}}>{(f.date||f.createdAt||'').toString().slice(0,10)}</span>
                              </div>
                              <div style={{color:'#f59e0b',marginBottom:'.4rem',fontSize:'.95rem',letterSpacing:'.05em'}}>{stars}</div>
                              <div style={{fontSize:'.87rem',lineHeight:1.5}}>{f.message}</div>
                            </div>
                          </div>
                        );
                      })
                  }
                </div>
              </div>
            </div>
          )}

        </div>
      </div>

      {/* Suggest Book Modal */}
      <Modal title={<><i className="fas fa-lightbulb" style={{color:'#d97706'}}></i> Suggest Book to Admin</>} open={showSuggest} onClose={() => setShowSuggest(false)}>
        <div className="form-grid">
          <div className="form-group" style={{gridColumn:'1/-1'}}><label>Book Title *</label><input className="inp" value={suggestBook.title} onChange={e => setSuggestBook(b => ({...b, title:e.target.value}))} placeholder="e.g. Clean Code"/></div>
          <div className="form-group" style={{gridColumn:'1/-1'}}><label>Author</label><input className="inp" value={suggestBook.author} onChange={e => setSuggestBook(b => ({...b, author:e.target.value}))}/></div>
          <div className="form-group" style={{gridColumn:'1/-1'}}><label>Reason / Note</label><input className="inp" value={suggestBook.note} onChange={e => setSuggestBook(b => ({...b, note:e.target.value}))} placeholder="Why should library add this?"/></div>
        </div>
        <div className="modal-footer" style={{marginTop:'1.5rem',display:'flex',gap:'10px',justifyContent:'flex-end'}}>
          <button className="btn btn-outline" onClick={() => setShowSuggest(false)}>Cancel</button>
          <button className="btn btn-primary" onClick={handleSuggestBook}><i className="fas fa-paper-plane"></i> Send Suggestion</button>
        </div>
      </Modal>

    </div>
  );
}
