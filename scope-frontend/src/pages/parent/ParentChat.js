import React, { useEffect, useState, useRef } from 'react';
import AppLayout from '../../components/layout/AppLayout';
import api from '../../services/api';
import socket from '../../services/socket';
import { useAuth } from '../../context/AuthContext';

const getRoomId = (idA, idB) => [idA, idB].sort().join('_');

const ParentChat = () => {
  const { user } = useAuth();
  const [student, setStudent] = useState(null);
  const [teacher, setTeacher] = useState(null);
  const [messages, setMessages] = useState([]);
  const [text, setText] = useState('');
  const [loading, setLoading] = useState(true);
  const currentRoom = useRef(null);
  const bottomRef = useRef();

  useEffect(() => {
    api.get('/students').then(async ({ data }) => {
      if (data.length > 0) {
        const s = data[0];
        setStudent(s);
        // teacher field is populated with name/email from getStudents
        const t = s.teacher;
        if (t && (t._id || typeof t === 'string')) {
          const teacherId = t._id || t;
          const teacherObj = t.name ? t : { _id: teacherId, name: 'Teacher' };
          setTeacher(teacherObj);

          const roomId = getRoomId(user._id, teacherId);
          currentRoom.current = roomId;
          socket.connect();
          socket.emit('joinRoom', roomId);
          const { data: msgs } = await api.get(`/chat/${roomId}`);
          setMessages(msgs);
        }
      }
      setLoading(false);
    }).catch(() => setLoading(false));

    socket.on('newMessage', (msg) => {
      if (msg.roomId === currentRoom.current) {
        setMessages(prev => [...prev, msg]);
      }
    });
    return () => { socket.off('newMessage'); socket.disconnect(); };
  }, [user._id]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const sendMessage = async (e) => {
    e.preventDefault();
    if (!text.trim() || !teacher) return;
    const roomId = getRoomId(user._id, teacher._id || teacher);
    await api.post('/chat/send', { roomId, content: text, type: 'text' });
    setText('');
  };

  const isMe = (m) => (m.sender?._id || m.sender) === user._id;

  if (loading) return <AppLayout><div style={S.center}>Loading...</div></AppLayout>;

  if (!student || !teacher) return (
    <AppLayout>
      <div style={S.empty}>
        <span style={{ fontSize: '3rem' }}>👨🏫</span>
        <h3 style={{ color: '#111827' }}>No teacher assigned yet</h3>
        <p style={{ color: '#9ca3af' }}>Your child's teacher hasn't been assigned. Please contact the school admin.</p>
      </div>
    </AppLayout>
  );

  return (
    <AppLayout>
      <div style={S.wrapper}>
        <div style={S.chatHeader}>
          <div style={S.headerAvatar}>{(teacher.name || 'T')[0]}</div>
          <div style={{ flex: 1 }}>
            <div style={S.headerName}>{teacher.name || 'Class Teacher'}</div>
            <div style={S.headerSub}>
              👨🏫 Class Teacher · {student.name} · Class {student.class}-{student.section}
            </div>
          </div>
          <div style={S.onlineDot} title="Connected" />
        </div>

        <div style={S.messages}>
          {messages.length === 0 && (
            <div style={S.noMsg}>
              <span style={{ fontSize: '2.5rem' }}>💬</span>
              <p style={{ fontWeight: 600 }}>No messages yet</p>
              <p style={{ fontSize: '0.82rem' }}>Start the conversation with {teacher.name || 'the teacher'}!</p>
            </div>
          )}
          {messages.map((m, i) => {
            const mine = isMe(m);
            return (
              <div key={m._id || i} style={{ display: 'flex', justifyContent: mine ? 'flex-end' : 'flex-start', marginBottom: 8 }}>
                {!mine && (
                  <div style={S.msgAvatar}>{(teacher.name || 'T')[0]}</div>
                )}
                <div style={{ maxWidth: '60%' }}>
                  {!mine && <div style={S.senderLabel}>{m.sender?.name || teacher.name}</div>}
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
            placeholder={`Message ${teacher.name || 'teacher'}...`}
            autoFocus
          />
          <button type="submit" style={{ ...S.sendBtn, opacity: text.trim() ? 1 : 0.5 }} disabled={!text.trim()}>
            Send ➤
          </button>
        </form>
      </div>
    </AppLayout>
  );
};

const S = {
  center:      { textAlign: 'center', padding: 60, color: '#9ca3af' },
  empty:       { background: '#fff', borderRadius: 12, padding: '60px 24px', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10, boxShadow: '0 1px 4px rgba(0,0,0,0.07)' },
  wrapper:     { background: '#fff', borderRadius: 12, boxShadow: '0 1px 4px rgba(0,0,0,0.07)', display: 'flex', flexDirection: 'column', height: 'calc(100vh - 120px)', overflow: 'hidden' },
  chatHeader:  { display: 'flex', alignItems: 'center', gap: 12, padding: '16px 20px', background: 'linear-gradient(135deg,#1e1b4b,#4f46e5)', flexShrink: 0 },
  headerAvatar:{ width: 44, height: 44, borderRadius: '50%', background: 'rgba(255,255,255,0.2)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: '1.1rem', flexShrink: 0 },
  headerName:  { color: '#fff', fontWeight: 700, fontSize: '0.95rem' },
  headerSub:   { color: '#c7d2fe', fontSize: '0.75rem', marginTop: 2 },
  onlineDot:   { width: 10, height: 10, borderRadius: '50%', background: '#10b981', boxShadow: '0 0 0 2px rgba(16,185,129,0.3)', flexShrink: 0 },
  messages:    { flex: 1, overflowY: 'auto', padding: '20px 20px 10px', background: '#f8fafc', display: 'flex', flexDirection: 'column' },
  noMsg:       { display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', flex: 1, color: '#9ca3af', gap: 6 },
  msgAvatar:   { width: 28, height: 28, borderRadius: '50%', background: '#e0e7ff', color: '#4f46e5', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: '0.75rem', flexShrink: 0, marginRight: 8, alignSelf: 'flex-end' },
  senderLabel: { fontSize: '0.72rem', color: '#9ca3af', marginBottom: 3, marginLeft: 2 },
  bubble:      { padding: '10px 14px', boxShadow: '0 1px 3px rgba(0,0,0,0.08)' },
  inputRow:    { display: 'flex', gap: 10, padding: '14px 20px', borderTop: '1px solid #e5e7eb', background: '#fff', flexShrink: 0 },
  input:       { flex: 1, padding: '11px 16px', border: '1.5px solid #e5e7eb', borderRadius: 24, fontSize: '0.9rem', outline: 'none' },
  sendBtn:     { background: '#4f46e5', color: '#fff', border: 'none', padding: '11px 22px', borderRadius: 24, fontWeight: 600, fontSize: '0.88rem', cursor: 'pointer' },
};

export default ParentChat;
