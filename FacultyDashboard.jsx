import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { clearSession, getSession } from '../utils/auth';
import { booksAPI, issuesAPI, requestsAPI, settingsAPI, notificationsAPI } from '../utils/api';
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

export default function FacultyDashboard() {
  const navigate = useNavigate();
  const toast = useToast();
  const session = getSession();
  const me = session;
  const [section, setSection] = useState('home');
  const [books, setBooks] = useState([]);
  const [allIssues, setAllIssues] = useState([]);
  const [myRequests, setMyRequests] = useState([]);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [sidebarMinimized, setSidebarMinimized] = useState(false);
  const [showNotif, setShowNotif] = useState(false);
  const [seenNotifs, setSeenNotifs] = useState(new Set());
  const [dbNotifications, setDbNotifications] = useState([]);
  const [searchQ, setSearchQ] = useState('');
  const [reqQ, setReqQ] = useState('');
  const [finePerDay, setFinePerDay] = useState(5);
  const [showSuggest, setShowSuggest] = useState(false);
  const [suggestBook, setSuggestBook] = useState({ title: '', author: '', note: '' });

  async function loadAll() {
    try {
      const [b, i, r, s, notifs] = await Promise.all([booksAPI.getAll(), issuesAPI.getAll(), requestsAPI.getAll(), settingsAPI.get(), notificationsAPI.getByUser(me?.id)]);
      setBooks(b.data);
      setAllIssues(i.data);
      setDbNotifications(notifs.data);
      setMyRequests(r.data.filter(r => (r.user?._id || r.userId) === me?.id));
      if (s.data?.finePerDay) setFinePerDay(s.data.finePerDay);
    } catch { toast('Backend not connected','err'); }
  }

  useEffect(() => {
    if (!session || session.role !== 'faculty') { navigate('/login'); return; }
    loadAll();
  }, [navigate, session]);

  function logout() { clearSession(); navigate('/'); }
  function go(s) { setSection(s); setSidebarOpen(false); }

  const today = new Date().toISOString().slice(0,10);
  const myIssues = allIssues.filter(i => (i.user?._id||i.user) === me?.id && !i.returnDate);
  const history  = [...allIssues.filter(i => (i.user?._id||i.user) === me?.id)].reverse();

  const d5 = new Date(); d5.setDate(d5.getDate()+5); const d5s = d5.toISOString().slice(0,10);
  const soon = myIssues.filter(i => (i.dueDate||'') >= today && (i.dueDate||'') <= d5s).length;
  const overdue = myIssues.filter(i => (i.dueDate||'') < today).length;
  const fineTotal = 0; // Faculty do not have fines

  const pageMeta = { home:['Faculty Dashboard','Your library overview'], search:['Search Books','Browse the catalog'], request:['Request Books','Request books to borrow'], myrequests:['My Requests','Track your requests'], history:['Borrow History','Your complete history'], profile:['My Profile','Your academic profile'] };
  const [ptitle, psub] = pageMeta[section] || [section,''];

  const notifications = [];
  if (overdue > 0) notifications.push({ id:'ov', icon:'fa-exclamation-circle text-err', title:'Overdue Books', text:`You have ${overdue} overdue book(s). Please return them as soon as possible.`, time:'Action Required' });
  if (soon > 0) notifications.push({ id:'soon', icon:'fa-clock text-warn', title:'Books Due Soon', text:`You have ${soon} book(s) due within 5 days.`, time:'Reminder' });
  dbNotifications.forEach(n => {
    notifications.push({ id: n._id, icon: n.icon, title: n.title, text: n.text, time: (n.createdAt||'').slice(0,10), isRead: n.isRead, isDb: true });
  });

  async function sendRequest(bookId) {
    try {
      await requestsAPI.create({ userId: me?.id, bookId });
      toast('Request submitted! Librarian will review it.','ok'); loadAll();
    } catch(e) { toast(e.response?.data?.message || 'Error','err'); }
  }

  async function handleSuggestBook() {
    if (!suggestBook.title) { toast('Please provide a title.', 'err'); return; }
    try {
      await notificationsAPI.create({
        role: 'admin',
        title: 'New Book Suggestion',
        text: `Faculty ${me?.name} suggested adding "${suggestBook.title}" by ${suggestBook.author||'Unknown'}. ${suggestBook.note ? 'Note: '+suggestBook.note : ''}`,
        icon: 'fa-solid fa-lightbulb text-info'
      });
      toast('Suggestion sent to admin!', 'ok');
      setShowSuggest(false);
      setSuggestBook({ title: '', author: '', note: '' });
    } catch(e) {
      toast('Error sending suggestion.', 'err');
    }
  }


  function isAlreadyIssued(bookId) { return myIssues.some(i => (i.book?._id||i.book) === bookId); }
  function hasPendingReq(bookId) { return myRequests.some(r => (r.bookId===bookId||r.book?._id===bookId) && r.status==='pending'); }

  const filteredSearch = books.filter(b => !searchQ || b.title.toLowerCase().includes(searchQ.toLowerCase()) || b.author.toLowerCase().includes(searchQ.toLowerCase()));
  const filteredReq = books.filter(b => !reqQ || b.title.toLowerCase().includes(reqQ.toLowerCase()) || b.author.toLowerCase().includes(reqQ.toLowerCase()));

  function getBookObj(id) { return books.find(x => x._id === id) || {title:'?',author:''}; }

  return (
    <div className="app">
      <aside className={`sidebar ${sidebarOpen?'open':''} ${sidebarMinimized?'minimized':''}`} style={{background:'linear-gradient(180deg,#064e3b 0%,#059669 60%,#10b981 100%)',transition:'width 0.3s ease'}}>
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
          {!sidebarMinimized && <span className="nav-label">Menu</span>}
          {[['home','fa-home','Dashboard'],['search','fa-search','Search'],['request','fa-paper-plane','Request'],['myrequests','fa-tasks','My Requests']].map(([s,ic,lb]) => (
            <button key={s} className={`nav-item ${section===s?'active':''}`} onClick={() => go(s)} title={sidebarMinimized?lb:''} style={{justifyContent:sidebarMinimized?'center':'flex-start'}}><i className={`fas ${ic}`}></i>{!sidebarMinimized && <span>{lb}</span>}</button>
          ))}
          {!sidebarMinimized && <div className="nav-divider"></div>}
          {[['history','fa-history','History'],['profile','fa-user','Profile']].map(([s,ic,lb]) => (
            <button key={s} className={`nav-item ${section===s?'active':''}`} onClick={() => go(s)} title={sidebarMinimized?lb:''} style={{justifyContent:sidebarMinimized?'center':'flex-start'}}><i className={`fas ${ic}`}></i>{!sidebarMinimized && <span>{lb}</span>}</button>
          ))}
        </nav>
        <div className="sidebar-footer"><div className="user-card" style={{flexDirection:sidebarMinimized?'column':'row',textAlign:sidebarMinimized?'center':'left'}}>
          <div className="user-avatar" style={{background:'linear-gradient(135deg,#059669,#10b981)',color:'#fff'}}>{(me?.name||'F')[0]}</div>
          {!sidebarMinimized && <div className="user-meta"><div className="name">{me?.name||'Faculty'}</div><div className="role">Faculty</div></div>}
        </div></div>
      </aside>

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
                    <div className="notif-empty"><i className="fas fa-bell-slash"></i> You're all caught up!</div>
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
          {/* HOME */}
          {section === 'home' && (
            <div>
              <div className="hero-banner" style={{background:'linear-gradient(135deg,#059669 0%,#10b981 50%,#34d399 100%)',borderRadius:'24px',padding:'2.5rem 2rem',color:'#fff',marginBottom:'2rem',boxShadow:'0 20px 40px rgba(16,185,129,.2)'}}>
                <div style={{display:'flex',alignItems:'center',gap:'1.5rem'}}>
                  <div style={{width:'72px',height:'72px',borderRadius:'50%',background:'rgba(255,255,255,.2)',display:'flex',alignItems:'center',justifyContent:'center',fontSize:'2rem',fontWeight:700,backdropFilter:'blur(10px)',border:'2px solid rgba(255,255,255,.3)'}}>{(me?.name||'F')[0]}</div>
                  <div>
                    <h1 style={{fontSize:'1.8rem',fontWeight:800,marginBottom:'.25rem'}}>Welcome, Prof. {me?.name?.split(' ').slice(-1)[0]||'Faculty'}! 👋</h1>
                    <p style={{fontSize:'.95rem',opacity:.9}}>{me?.department||'Faculty Member'} · {me?.email||me?.username}</p>
                  </div>
                </div>
              </div>
              {overdue > 0 && <div style={{background:'#fff5f5',border:'1px solid #fecaca',borderRadius:'12px',padding:'1rem 1.25rem',marginBottom:'1.5rem',display:'flex',alignItems:'center',gap:'.75rem',color:'#991b1b'}}><i className="fas fa-exclamation-circle" style={{fontSize:'1.1rem'}}></i><span><strong>⚠️ {overdue} overdue book(s)</strong>. Please return ASAP!</span></div>}
              {overdue === 0 && soon > 0 && <div style={{background:'#fffbeb',border:'1px solid #fde68a',borderRadius:'12px',padding:'1rem 1.25rem',marginBottom:'1.5rem',display:'flex',alignItems:'center',gap:'.75rem',color:'#92400e'}}><i className="fas fa-clock" style={{fontSize:'1rem'}}></i><span>{soon} book(s) due within 5 days. Plan returns.</span></div>}
              <div className="stats-row">
                <div className="stat-box"><div className="stat-ico blue"><i className="fas fa-book"></i></div><div className="stat-info"><div className="value">{myIssues.length}</div><div className="label">Issued</div></div></div>
                <div className="stat-box"><div className="stat-ico amber"><i className="fas fa-hourglass-end"></i></div><div className="stat-info"><div className="value">{soon}</div><div className="label">Due in 5 Days</div></div></div>
                <div className="stat-box"><div className="stat-ico red"><i className="fas fa-times-circle"></i></div><div className="stat-info"><div className="value">{overdue}</div><div className="label">Overdue</div></div></div>
                <div className="stat-box"><div className="stat-ico green"><i className="fas fa-history"></i></div><div className="stat-info"><div className="value">{history.length}</div><div className="label">Total</div></div></div>
              </div>
              <div className="card">
                <div className="card-header"><span className="card-title"><i className="fas fa-book" style={{color:'#059669',fontSize:'1.1rem'}}></i> Active Borrowings</span></div>
                <div className="card-body" style={{padding:0}}>
                  <div className="tbl-wrap"><table>
                    <thead><tr><th>Book</th><th>Author</th><th style={{textAlign:'center'}}>Issued</th><th style={{textAlign:'center'}}>Due</th><th style={{textAlign:'center'}}>Status</th><th style={{textAlign:'center'}}>Fine</th></tr></thead>
                    <tbody>
                      {myIssues.map((i, idx) => {
                        const b = getBookObj(i.book?._id||i.book);
                        const isOv = (i.dueDate||'') < today;
                        const due = new Date(i.dueDate); const now = new Date(today);
                        const fine = 0;
                        return <tr key={idx} style={{background:idx%2?'#fafafa':''}}>
                          <td className="fw-700" style={{fontSize:'.88rem'}}>{b.title}</td><td style={{fontSize:'.84rem'}}>{b.author}</td>
                          <td style={{fontSize:'.84rem',textAlign:'center'}}>{(i.issueDate||'').slice(0,10)}</td>
                          <td style={{fontSize:'.84rem',textAlign:'center',color:isOv?'var(--err)':'',fontWeight:isOv?700:400}}>{(i.dueDate||'').slice(0,10)}</td>
                          <td style={{textAlign:'center'}}>{isOv?<Pill text="Overdue" type="err"/>:<Pill text="Active" type="warn"/>}</td>
                          <td style={{textAlign:'center',fontSize:'.84rem'}}>—</td>
                        </tr>;
                      })}
                      {myIssues.length === 0 && <tr><td colSpan={6}><div style={{textAlign:'center',padding:'2rem',color:'var(--muted)'}}><i className="fas fa-inbox" style={{fontSize:'2rem',marginBottom:'.5rem',opacity:.5,display:'block'}}></i><p>No books currently issued</p></div></td></tr>}
                    </tbody>
                  </table></div>
                </div>
              </div>
            </div>
          )}

          {/* SEARCH */}
          {section === 'search' && (
            <div>
              <div style={{marginBottom:'1.5rem'}}><h2 style={{fontSize:'1.5rem',fontWeight:800,display:'flex',alignItems:'center',gap:'.75rem'}}><i className="fas fa-search" style={{color:'#059669'}}></i>Search Catalog</h2></div>
              <div className="card">
                <div className="card-header">
                  <span className="card-title">All Books</span>
                  <div className="search-wrap" style={{margin:0,width:'320px'}}><i className="fas fa-search"></i><input className="search-inp" placeholder="Title, author, ISBN…" value={searchQ} onChange={e => setSearchQ(e.target.value)}/></div>
                </div>
                <div className="card-body" style={{padding:0}}>
                  <div className="tbl-wrap"><table>
                    <thead><tr><th>Title & Author</th><th>Category</th><th style={{textAlign:'center'}}>Available</th><th style={{textAlign:'center'}}>Action</th></tr></thead>
                    <tbody>
                      {filteredSearch.map((b,idx) => <tr key={b._id} style={{background:idx%2?'#fafafa':''}}>
                        <td><div className="fw-700" style={{fontSize:'.87rem'}}>{b.title}</div><div style={{fontSize:'.75rem',color:'var(--muted)'}}>{b.author}</div></td>
                        <td><Pill text={b.category||'—'} type="info"/></td>
                        <td style={{textAlign:'center'}}><span className={`fw-700 ${b.available>0?'text-ok':'text-err'}`}>{b.available}</span><span style={{color:'var(--muted)',fontSize:'.8rem'}}>/{b.copies}</span></td>
                        <td style={{textAlign:'center'}}>{isAlreadyIssued(b._id)?<Pill text="Issued" type="ok"/>:hasPendingReq(b._id)?<Pill text="Pending" type="warn"/>:b.available<1?<Pill text="Unavailable" type="err"/>:
                          <button className="btn btn-primary btn-sm" onClick={() => sendRequest(b._id)}><i className="fas fa-paper-plane"></i> Request</button>}
                        </td>
                      </tr>)}
                      {filteredSearch.length===0 && <tr><td colSpan={4}><div style={{textAlign:'center',padding:'2rem',color:'var(--muted)'}}><i className="fas fa-inbox" style={{fontSize:'2rem',marginBottom:'.5rem',opacity:.5,display:'block'}}></i><p>No books found</p></div></td></tr>}
                    </tbody>
                  </table></div>
                </div>
              </div>
            </div>
          )}

          {/* REQUEST */}
          {section === 'request' && (
            <div>
              <div style={{marginBottom:'1.5rem',display:'flex',justifyContent:'space-between',alignItems:'center'}}>
                <h2 style={{fontSize:'1.5rem',fontWeight:800,display:'flex',alignItems:'center',gap:'.75rem'}}><i className="fas fa-paper-plane" style={{color:'#d97706'}}></i>Request Books</h2>
                <button className="btn btn-primary" onClick={() => setShowSuggest(true)}><i className="fas fa-lightbulb"></i> Suggest Book</button>
              </div>
              <div style={{background:'#eff6ff',border:'1px solid #bfdbfe',borderRadius:'12px',padding:'1rem 1.25rem',marginBottom:'1.5rem',display:'flex',alignItems:'center',gap:'.75rem',color:'#1e40af',fontSize:'.88rem'}}><i className="fas fa-info-circle"></i><span>Faculty can borrow up to 10 books for 30 days. Submit requests for librarian review.</span></div>
              <div className="card">
                <div className="card-header">
                  <span className="card-title">Available Books</span>
                  <div className="search-wrap" style={{margin:0,width:'280px'}}><i className="fas fa-search"></i><input className="search-inp" placeholder="Filter…" value={reqQ} onChange={e => setReqQ(e.target.value)}/></div>
                </div>
                <div className="card-body" style={{padding:0}}>
                  <div className="tbl-wrap"><table>
                    <thead><tr><th>Title & Author</th><th>Category</th><th style={{textAlign:'center'}}>Available</th><th style={{textAlign:'center'}}>Action</th></tr></thead>
                    <tbody>
                      {filteredReq.map((b,idx) => <tr key={b._id} style={{background:idx%2?'#fafafa':''}}>
                        <td><div className="fw-700" style={{fontSize:'.87rem'}}>{b.title}</div><div style={{fontSize:'.75rem',color:'var(--muted)'}}>{b.author}{b.publisher?` · ${b.publisher}`:''}</div></td>
                        <td><Pill text={b.category||'—'} type="info"/></td>
                        <td style={{textAlign:'center'}}><span className={`fw-700 ${b.available>0?'text-ok':'text-err'}`}>{b.available}</span></td>
                        <td style={{textAlign:'center'}}>{isAlreadyIssued(b._id)?<Pill text="Issued" type="ok"/>:hasPendingReq(b._id)?<Pill text="Pending" type="warn"/>:b.available<1?<Pill text="Unavailable" type="err"/>:
                          <button className="btn btn-primary btn-sm" onClick={() => sendRequest(b._id)}><i className="fas fa-paper-plane"></i> Request</button>}
                        </td>
                      </tr>)}
                      {filteredReq.length===0 && <tr><td colSpan={4}><div style={{textAlign:'center',padding:'2rem',color:'var(--muted)'}}><i className="fas fa-inbox" style={{fontSize:'2rem',marginBottom:'.5rem',opacity:.5,display:'block'}}></i><p>No books match</p></div></td></tr>}
                    </tbody>
                  </table></div>
                </div>
              </div>
            </div>
          )}

          {/* MY REQUESTS */}
          {section === 'myrequests' && (
            <div>
              <div style={{marginBottom:'1.5rem'}}><h2 style={{fontSize:'1.5rem',fontWeight:800,display:'flex',alignItems:'center',gap:'.75rem'}}><i className="fas fa-tasks" style={{color:'#7c3aed'}}></i>My Requests</h2></div>
              <div className="card"><div className="card-body" style={{padding:0}}>
                <div className="tbl-wrap"><table>
                  <thead><tr><th>Book</th><th style={{textAlign:'center'}}>Requested</th><th>Note</th><th style={{textAlign:'center'}}>Status</th></tr></thead>
                  <tbody>
                    {[...myRequests].reverse().map((r, idx) => {
                      const b = getBookObj(r.book?._id||r.bookId);
                      const st = r.status==='pending'?<Pill text="Pending" type="warn"/>:r.status==='approved'?<Pill text="Approved" type="ok"/>:<Pill text="Rejected" type="err"/>;
                      return <tr key={idx} style={{background:idx%2?'#fafafa':''}}>
                        <td className="fw-700" style={{fontSize:'.88rem'}}>{b.title}</td>
                        <td style={{fontSize:'.84rem',textAlign:'center'}}>{(r.requestDate||r.createdAt||'').slice(0,10)}</td>
                        <td style={{fontSize:'.82rem',color:'var(--muted)'}}>{r.note||'—'}</td>
                        <td style={{textAlign:'center'}}>{st}{r.message&&<div style={{fontSize:'.75rem',color:'var(--err)',marginTop:'3px'}}>{r.message}</div>}</td>
                      </tr>;
                    })}
                    {myRequests.length===0 && <tr><td colSpan={4}><div style={{textAlign:'center',padding:'2rem',color:'var(--muted)'}}><i className="fas fa-inbox" style={{fontSize:'2rem',marginBottom:'.5rem',opacity:.5,display:'block'}}></i><p>No requests submitted yet</p></div></td></tr>}
                  </tbody>
                </table></div>
              </div></div>
            </div>
          )}

          {/* HISTORY */}
          {section === 'history' && (
            <div>
              <div style={{marginBottom:'1.5rem'}}><h2 style={{fontSize:'1.5rem',fontWeight:800,display:'flex',alignItems:'center',gap:'.75rem'}}><i className="fas fa-history" style={{color:'#7c3aed'}}></i>Borrow History</h2></div>
              <div className="card"><div className="card-body" style={{padding:0}}>
                <div className="tbl-wrap"><table>
                  <thead><tr><th>Book</th><th style={{textAlign:'center'}}>Issued</th><th style={{textAlign:'center'}}>Due</th><th style={{textAlign:'center'}}>Returned</th><th style={{textAlign:'center'}}>Fine</th><th style={{textAlign:'center'}}>Status</th></tr></thead>
                  <tbody>
                    {history.map((i, idx) => {
                      const b = getBookObj(i.book?._id||i.book);
                      const retDate = i.returnDate?(i.returnDate+'').slice(0,10):today;
                      const due=new Date(i.dueDate);const ret=new Date(retDate);
                      const fine=0;
                      const st=i.returnDate?<Pill text="Returned" type="ok\"/>:(i.dueDate||'')<today?<Pill text="Overdue" type="err\"/>:<Pill text="Active" type="warn\"/>;
                      return <tr key={idx} style={{background:idx%2?'#fafafa':''}}>
                        <td className="fw-700" style={{fontSize:'.88rem'}}>{b.title}</td>
                        <td style={{fontSize:'.84rem',textAlign:'center'}}>{(i.issueDate||'').slice(0,10)}</td><td style={{fontSize:'.84rem',textAlign:'center'}}>{(i.dueDate||'').slice(0,10)}</td>
                        <td style={{fontSize:'.84rem',textAlign:'center'}}>{i.returnDate?(i.returnDate+'').slice(0,10):'—'}</td>
                        <td style={{textAlign:'center',fontSize:'.84rem'}}>—</td><td style={{textAlign:'center'}}>{st}</td>
                      </tr>;
                    })}
                    {history.length===0 && <tr><td colSpan={6}><div style={{textAlign:'center',padding:'2rem',color:'var(--muted)'}}><i className="fas fa-inbox" style={{fontSize:'2rem',marginBottom:'.5rem',opacity:.5,display:'block'}}></i><p>No history yet</p></div></td></tr>}
                  </tbody>
                </table></div>
              </div></div>
            </div>
          )}

          {/* PROFILE */}
          {section === 'profile' && (
            <div>
              <div style={{marginBottom:'1.5rem'}}><h2 style={{fontSize:'1.5rem',fontWeight:800,display:'flex',alignItems:'center',gap:'.75rem'}}><i className="fas fa-user" style={{color:'#6366f1'}}></i>My Profile</h2></div>
              <div className="card"><div className="card-body">
                <div style={{display:'flex',alignItems:'center',gap:'1.5rem',marginBottom:'2rem',flexWrap:'wrap'}}>
                  <div style={{width:'80px',height:'80px',borderRadius:'50%',background:'linear-gradient(135deg,#059669,#10b981)',display:'flex',alignItems:'center',justifyContent:'center',fontSize:'2rem',fontWeight:800,color:'#fff'}}>{(me?.name||'F')[0]}</div>
                  <div><h3 style={{fontSize:'1.4rem',fontWeight:700}}>{me?.name||'Faculty'}</h3><p style={{fontSize:'.88rem',color:'var(--muted)',marginTop:'4px'}}>{me?.email||'No email'}</p></div>
                </div>
                <div className="form-grid">
                  {[['Employee ID',me?.employeeId||me?.username],['Department',me?.department||'—'],['Phone',me?.phone||'—'],['Role','Faculty']].map(([l,v]) => (
                    <div key={l} style={{background:'#f8fafc',borderRadius:'12px',padding:'1rem',border:'1px solid #e2e8f0'}}>
                      <div style={{fontSize:'.75rem',color:'var(--muted)',fontWeight:600,textTransform:'uppercase',letterSpacing:'.04em'}}>{l}</div>
                      <div style={{fontWeight:700,marginTop:'.4rem'}}>{v}</div>
                    </div>
                  ))}
                </div>
                <div className="stats-row" style={{marginTop:'2rem'}}>
                  <div className="stat-box"><div className="stat-ico blue"><i className="fas fa-book"></i></div><div className="stat-info"><div className="value">{history.length}</div><div className="label">Total</div></div></div>
                  <div className="stat-box"><div className="stat-ico green"><i className="fas fa-check-circle"></i></div><div className="stat-info"><div className="value">{history.filter(i=>i.returnDate).length}</div><div className="label">Returned</div></div></div>
                  <div className="stat-box"><div className="stat-ico amber"><i className="fas fa-hourglass"></i></div><div className="stat-info"><div className="value">{myIssues.length}</div><div className="label">Active</div></div></div>
                </div>
              </div></div>
            </div>
          )}
        </div>
      </div>

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
