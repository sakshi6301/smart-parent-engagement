import React, { useEffect, useState, useRef } from 'react';
import api from '../../services/api';
import socket from '../../services/socket';
import AppLayout from '../../components/layout/AppLayout';
import { useAuth } from '../../context/AuthContext';

const getRoomId = (idA, idB) => [idA, idB].sort().join('_');

const Chat = () => {
  const { user } = useAuth();
  const [students, setStudents] = useState([]);
  const [selected, setSelected] = useState(null); // { student, roomId, contactName, contactRole }
  const [messages, setMessages] = useState([]);
  const [text, setText] = useState('');
  const [search, setSearch] = useState('');
  const currentRoom = useRef(null);
  const bottomRef = useRef();

  useEffect(() => {
    api.get('/students').then(({ data }) => setStudents(data));
    socket.connect();
    socket.on('newMessage', (msg) => {
      if (msg.roomId === currentRoom.current) {
        setMessages(prev => [...prev, msg]);
      }
    });
    return () => { socket.off('newMessage'); socket.disconnect(); };
  }, []);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const selectContact = async (student, contactId, contactName, contactRole) => {
    if (currentRoom.current) socket.emit('leaveRoom', currentRoom.current);
    const roomId = getRoomId(user._id, contactId);
    currentRoom.current = roomId;
    setSelected({ student, roomId, contactName, contactRole, contactId });
    setMessages([]);
    socket.emit('joinRoom', roomId);
    const { data } = await api.get(`/chat/${roomId}`);
    setMessages(data);
  };

  const sendMessage = async (e) => {
    e.preventDefault();
    if (!text.trim() || !selected) return;
    await api.post('/chat/send', { roomId: selected.roomId, content: text, type: 'text' });
    setText('');
  };

  const isMe = (m) => (m.sender?._id || m.sender) === user._id;

  // Build contact list: each student → parent contact + (future) student contact
  const filtered = students.filter(s =>
    s.name.toLowerCase().includes(search.toLowerCase()) ||
    s.rollNumber?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <AppLayout>
      <div style={S.wrapper}>
        {/* Sidebar */}
        <div style={S.sidebar}>
          <div style={S.sidebarHeader}>
            <div style={S.sidebarTitle}>💬 Conversations</div>
            <input
              style={S.search}
              placeholder="Search students..."
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>
          <div style={S.list}>
            {filtered.length === 0 && (
              <div style={S.noContacts}>No students assigned</div>
            )}
            {filtered.map(s => {
              const parentId = s.parent?._id || s.parent;
              const parentName = s.parent?.name;
              const isSelectedParent = selected?.contactId === parentId;

              return (
                <div key={s._id}>
                  {/* Parent contact */}
                  {parentId ? (
                    <div
                      onClick={() => selectContact(s, parentId, parentName || `${s.name}'s Parent`, 'parent')}
                      style={{ ...S.contactItem, background: isSelectedParent ? '#e0e7ff' : '#fff', borderLeft: isSelectedParent ? '3px solid #4f46e5' : '3px solid transparent' }}
                    >
                      <div style={{ ...S.avatar, background: isSelectedParent ? '#4f46e5' : '#e0e7ff', color: isSelectedParent ? '#fff' : '#4f46e5' }}>
                        {(parentName || 'P')[0]}
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={S.contactName}>{parentName || `${s.name}'s Parent`}</div>
                        <div style={S.contactSub}>👨‍👩‍👧 Parent · {s.name} · {s.class}-{s.section}</div>
                      </div>
                    </div>
                  ) : (
                    <div style={{ ...S.contactItem, opacity: 0.5, cursor: 'not-allowed' }}>
                      <div style={{ ...S.avatar, background: '#f3f4f6', color: '#9ca3af' }}>{s.name[0]}</div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={S.contactName}>{s.name}</div>
                        <div style={{ ...S.contactSub, color: '#ef4444' }}>⚠️ No parent linked</div>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Chat Area */}
        <div style={S.chatArea}>
          {!selected ? (
            <div style={S.placeholder}>
              <span style={{ fontSize: '3rem' }}>💬</span>
              <p style={{ fontWeight: 600, color: '#374151' }}>Select a contact to start chatting</p>
              <p style={{ fontSize: '0.82rem', color: '#9ca3af' }}>Choose a parent from the list on the left</p>
            </div>
          ) : (
            <>
              <div style={S.chatHeader}>
                <div style={S.headerAvatar}>{selected.contactName[0]}</div>
                <div style={{ flex: 1 }}>
                  <div style={S.headerName}>{selected.contactName}</div>
                  <div style={S.headerSub}>
                    {selected.contactRole === 'parent' ? '👨‍👩‍👧 Parent' : '🎓 Student'} · {selected.student.name} · Class {selected.student.class}-{selected.student.section}
                  </div>
                </div>
                <div style={S.statusIndicator}>Active</div>
              </div>

              <div style={S.messages}>
                {messages.length === 0 && (
                  <div style={S.noMsg}>
                    <span style={{ fontSize: '2rem' }}>💬</span>
                    <p>No messages yet. Start the conversation!</p>
                  </div>
                )}
                {messages.map((m, i) => {
                  const mine = isMe(m);
                  return (
                    <div key={m._id || i} style={{ display: 'flex', justifyContent: mine ? 'flex-end' : 'flex-start', marginBottom: 8 }}>
                      {!mine && (
                        <div style={S.msgAvatar}>{selected.contactName[0]}</div>
                      )}
                      <div style={{ maxWidth: '60%' }}>
                        {!mine && <div style={S.senderLabel}>{m.sender?.name || selected.contactName}</div>}
                        <div style={{ ...S.bubble, background: mine ? '#4f46e5' : '#fff', color: mine ? '#fff' : '#111827', borderRadius: mine ? '16px 16px 4px 16px' : '16px 16px 16px 4px' }}>
                          <div style={{ fontSize: '0.9rem', lineHeight: 1.5 }}>{m.content}</div>
                          <div style={{ fontSize: '0.68rem', marginTop: 4, opacity: 0.65, textAlign: 'right' }}>
                            {new Date(m.createdAt).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
                <div ref={bottomRef} />
              </div>

              <form onSubmit={sendMessage} style={S.inputRow}>
                <input
                  style={S.input}
                  value={text}
                  onChange={e => setText(e.target.value)}
                  placeholder={`Message ${selected.contactName}...`}
                  autoFocus
                />
                <button type="submit" style={{ ...S.sendBtn, opacity: text.trim() ? 1 : 0.5 }} disabled={!text.trim()}>
                  Send ➤
                </button>
              </form>
            </>
          )}
        </div>
      </div>
    </AppLayout>
  );
};

const S = {
  wrapper:       { display: 'flex', height: 'calc(100vh - 120px)', background: '#fff', borderRadius: 12, boxShadow: '0 1px 4px rgba(0,0,0,0.07)', overflow: 'hidden' },
  sidebar:       { width: 280, flexShrink: 0, borderRight: '1px solid #e5e7eb', display: 'flex', flexDirection: 'column', background: '#fafafa' },
  sidebarHeader: { padding: '14px 14px 10px', borderBottom: '1px solid #e5e7eb' },
  sidebarTitle:  { fontWeight: 700, fontSize: '0.9rem', color: '#111827', marginBottom: 8 },
  search:        { width: '100%', padding: '8px 12px', border: '1.5px solid #e5e7eb', borderRadius: 8, fontSize: '0.82rem', outline: 'none', boxSizing: 'border-box' },
  list:          { flex: 1, overflowY: 'auto' },
  noContacts:    { padding: 20, textAlign: 'center', color: '#9ca3af', fontSize: '0.85rem' },
  contactItem:   { display: 'flex', alignItems: 'center', gap: 10, padding: '12px 14px', cursor: 'pointer', borderBottom: '1px solid #f3f4f6', transition: 'background 0.1s' },
  avatar:        { width: 38, height: 38, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: '0.95rem', flexShrink: 0 },
  contactName:   { fontWeight: 600, fontSize: '0.88rem', color: '#111827', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' },
  contactSub:    { fontSize: '0.72rem', color: '#9ca3af', marginTop: 2 },
  chatArea:      { flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0 },
  placeholder:   { flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: '#9ca3af', gap: 8 },
  chatHeader:    { display: 'flex', alignItems: 'center', gap: 12, padding: '14px 20px', background: 'linear-gradient(135deg,#1e1b4b,#4f46e5)', flexShrink: 0 },
  headerAvatar:  { width: 42, height: 42, borderRadius: '50%', background: 'rgba(255,255,255,0.2)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: '1rem', flexShrink: 0 },
  headerName:    { color: '#fff', fontWeight: 700, fontSize: '0.95rem' },
  headerSub:     { color: '#c7d2fe', fontSize: '0.75rem', marginTop: 2 },
  statusIndicator: { fontSize: '0.72rem', color: '#a5b4fc', background: 'rgba(255,255,255,0.15)', padding: '2px 8px', borderRadius: 10, fontWeight: 600 },
  messages:      { flex: 1, overflowY: 'auto', padding: '20px 20px 10px', background: '#f8fafc', display: 'flex', flexDirection: 'column' },
  noMsg:         { display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', flex: 1, color: '#9ca3af', gap: 8 },
  msgAvatar:     { width: 28, height: 28, borderRadius: '50%', background: '#e0e7ff', color: '#4f46e5', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: '0.75rem', flexShrink: 0, marginRight: 8, alignSelf: 'flex-end' },
  senderLabel:   { fontSize: '0.72rem', color: '#9ca3af', marginBottom: 3, marginLeft: 2 },
  bubble:        { padding: '10px 14px', boxShadow: '0 1px 3px rgba(0,0,0,0.08)' },
  inputRow:      { display: 'flex', gap: 10, padding: '14px 20px', borderTop: '1px solid #e5e7eb', background: '#fff', flexShrink: 0 },
  input:         { flex: 1, padding: '11px 16px', border: '1.5px solid #e5e7eb', borderRadius: 24, fontSize: '0.9rem', outline: 'none' },
  sendBtn:       { background: '#4f46e5', color: '#fff', border: 'none', padding: '11px 22px', borderRadius: 24, fontWeight: 600, fontSize: '0.88rem', cursor: 'pointer' },
};

export default Chat;
