import { useEffect, useRef, useState } from 'react';
import { useAuth } from '../context/AuthContext.jsx';
import { useData } from '../context/DataContext.jsx';
import { deleteMessage, sendMessage, subscribeMessages } from '../services/repository.js';

function when(ms) {
  const d = new Date(ms);
  const sameDay = d.toDateString() === new Date().toDateString();
  const time = d.toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' });
  return sameDay ? time : `${d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}, ${time}`;
}

// Group chat for everyone invited to a trip.
export default function TripChat({ trip }) {
  const { user, username } = useAuth();
  const { markChatSeen } = useData();
  const [msgs, setMsgs] = useState(null);
  const [text, setText] = useState('');
  const [err, setErr] = useState(null);
  const listRef = useRef(null);

  useEffect(() => subscribeMessages(trip.id, setMsgs, (e) => { setErr(e.message); setMsgs([]); }), [trip.id]);

  // Opening the trip marks its chat as read, and keeps it read as new messages arrive.
  useEffect(() => {
    if (trip.lastMessage?.at) markChatSeen(trip.id, trip.lastMessage.at);
  }, [trip.id, trip.lastMessage?.at, markChatSeen]);

  useEffect(() => {
    const el = listRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [msgs?.length]);

  async function send(e) {
    e.preventDefault();
    const t = text.trim();
    if (!t) return;
    setText(''); setErr(null);
    try {
      await sendMessage(trip.id, { uid: user.uid, name: username || user.displayName || 'angler', text: t });
    } catch (e2) {
      setErr(e2.message); setText(t);
    }
  }

  return (
    <section className="card p-0">
      <h2 className="px-4 pt-4 font-semibold">💬 Trip chat</h2>
      <p className="px-4 text-xs text-slate-500">Everyone invited can read and post here.</p>
      <div ref={listRef} className="mt-2 max-h-96 min-h-24 space-y-2 overflow-y-auto px-4 py-2">
        {msgs === null && <p className="py-6 text-center text-sm text-slate-400">Loading…</p>}
        {msgs?.length === 0 && <p className="py-6 text-center text-sm text-slate-400">No messages yet. Say hi, sort out carpools, or share what you're bringing!</p>}
        {msgs?.map((m, i) => {
          const mine = m.uid === user.uid;
          const showName = !mine && msgs[i - 1]?.uid !== m.uid;
          return (
            <div key={m.id} className={`flex flex-col ${mine ? 'items-end' : 'items-start'}`}>
              {showName && <span className="mb-0.5 px-1 text-[11px] font-medium text-slate-500">@{m.name}</span>}
              <div className={`max-w-[80%] whitespace-pre-wrap break-words rounded-2xl px-3 py-2 text-sm ${mine ? 'rounded-br-md bg-river-700 text-white' : 'rounded-bl-md bg-slate-100 text-slate-800'}`}>
                {m.text}
              </div>
              <span className="mt-0.5 flex items-center gap-2 px-1 text-[10px] text-slate-400">
                {when(m.createdAt)}
                {(mine || trip.ownerUid === user.uid) && (
                  <button type="button" onClick={() => window.confirm('Delete this message?') && deleteMessage(trip.id, m.id)} className="hover:text-rose-600">Delete</button>
                )}
              </span>
            </div>
          );
        })}
      </div>
      {err && <p className="px-4 text-sm text-rose-600">{err}</p>}
      <form onSubmit={send} className="flex gap-2 border-t border-slate-100 p-3">
        <textarea
          className="input min-h-0 flex-1 resize-none py-2"
          rows={1}
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) send(e); }}
          placeholder="Message the group…"
          maxLength={1000}
          aria-label="Message"
        />
        <button type="submit" disabled={!text.trim()} className="btn-primary px-4">Send</button>
      </form>
    </section>
  );
}
