import { useEffect, useMemo, useRef, useState } from 'react';
import Sidebar from './components/Sidebar.jsx';
import MessageBubble from './components/MessageBubble.jsx';
import Composer from './components/Composer.jsx';
import {
  createConversation,
  deleteConversation,
  getConversation,
  listConversations,
  sendMessageStream,
} from './api/client.js';

const SUGGESTIONS = [
  'Explain how JWT authentication works',
  'Write a SQL query to find duplicate emails',
  'Draft a short product launch email',
  'Give me a 30-minute beginner workout plan',
];

function localId(prefix) {
  return `${prefix}-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

export default function App() {
  const [conversations, setConversations] = useState([]);
  const [activeId, setActiveId] = useState(null);
  const [messages, setMessages] = useState([]);
  const [isStreaming, setIsStreaming] = useState(false);
  const [booting, setBooting] = useState(true);
  const [error, setError] = useState('');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const endRef = useRef(null);

  const activeConversation = useMemo(
    () => conversations.find((conversation) => conversation._id === activeId),
    [conversations, activeId]
  );

  useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        const data = await listConversations();
        if (!cancelled) setConversations(data);
      } catch (err) {
        if (!cancelled) setError(err.message);
      } finally {
        if (!cancelled) setBooting(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: isStreaming ? 'auto' : 'smooth', block: 'end' });
  }, [messages, isStreaming]);

  async function selectConversation(id) {
    if (isStreaming) return;
    setActiveId(id);
    setError('');
    setSidebarOpen(false);

    try {
      const data = await getConversation(id);
      setMessages(data.messages);
    } catch (err) {
      setError(err.message);
    }
  }

  async function startNewChat() {
    if (isStreaming) return;

    try {
      const conversation = await createConversation();
      setConversations((prev) => [conversation, ...prev]);
      setActiveId(conversation._id);
      setMessages([]);
      setError('');
      setSidebarOpen(false);
    } catch (err) {
      setError(err.message);
    }
  }

  async function removeConversation(event, id) {
    event.stopPropagation();
    if (isStreaming) return;

    try {
      await deleteConversation(id);
      setConversations((prev) => prev.filter((conversation) => conversation._id !== id));
      if (activeId === id) {
        setActiveId(null);
        setMessages([]);
      }
    } catch (err) {
      setError(err.message);
    }
  }

  async function handleSend(content) {
    if (isStreaming) return;

    setError('');
    let conversationId = activeId;

    try {
      if (!conversationId) {
        const conversation = await createConversation();
        conversationId = conversation._id;
        setConversations((prev) => [conversation, ...prev]);
        setActiveId(conversationId);
        setMessages([]);
      }

      const assistantId = localId('assistant');
      const userMessage = {
        _id: localId('user'),
        role: 'user',
        content,
        createdAt: new Date().toISOString(),
      };

      setMessages((prev) => [
        ...prev,
        userMessage,
        { _id: assistantId, role: 'assistant', content: '', pending: true },
      ]);
      setIsStreaming(true);

      await sendMessageStream(conversationId, content, {
        onDelta(text) {
          setMessages((prev) =>
            prev.map((message) =>
              message._id === assistantId
                ? { ...message, content: message.content + text }
                : message
            )
          );
        },
        onDone(payload) {
          setMessages((prev) =>
            prev.map((message) =>
              message._id === assistantId ? { ...payload.message, pending: false } : message
            )
          );
          setConversations((prev) => [
            payload.conversation,
            ...prev.filter((conversation) => conversation._id !== payload.conversation._id),
          ]);
        },
        onError(err) {
          setMessages((prev) =>
            prev
              .map((message) =>
                message._id === assistantId ? { ...message, pending: false } : message
              )
              .filter((message) => message._id !== assistantId || message.content)
          );
          setError(err.message);
        },
      });
    } catch (err) {
      setError(err.message);
    } finally {
      setIsStreaming(false);
    }
  }

  return (
    <div className="flex h-dvh overflow-hidden">
      <Sidebar
        conversations={conversations}
        activeId={activeId}
        open={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        onSelect={selectConversation}
        onNew={startNewChat}
        onDelete={removeConversation}
      />

      <main className="flex min-w-0 flex-1 flex-col bg-bg bg-[radial-gradient(900px_500px_at_80%_-10%,rgba(59,130,246,0.12),transparent_60%)]">
        <header className="flex h-[62px] shrink-0 items-center gap-3 border-b border-border bg-[rgba(11,15,20,0.6)] px-5 backdrop-blur-[8px]">
          <button
            type="button"
            className="grid h-9 w-9 cursor-pointer place-items-center rounded-[9px] border border-border bg-panel-2 text-text chat:hidden"
            onClick={() => setSidebarOpen((value) => !value)}
            aria-label="Toggle sidebar"
          >
            <svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true">
              <path
                d="M4 6h16M4 12h16M4 18h16"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.8"
                strokeLinecap="round"
              />
            </svg>
          </button>

          <div className="flex min-w-0 flex-1 items-center gap-2.5 text-[14.5px] font-[550]">
            <span className="truncate">{activeConversation?.title || 'New chat'}</span>
            {isStreaming && (
              <span className="shrink-0 animate-soft-pulse text-[11px] font-semibold tracking-[0.6px] text-accent uppercase">
                Generating...
              </span>
            )}
          </div>

          <div className="shrink-0 rounded-full border border-accent/[0.35] bg-accent/[0.08] px-[9px] py-1 text-[11px] font-semibold tracking-[0.4px] text-accent uppercase">
            Gemini
          </div>
        </header>

        {error && (
          <div
            className="mx-5 mt-3.5 flex items-center gap-3 rounded-[10px] border border-danger/40 bg-danger/10 px-3.5 py-2.5 text-[13px] text-red-200"
            role="alert"
          >
            <span className="flex-1">{error}</span>
            <button
              type="button"
              className="cursor-pointer border-0 bg-transparent text-lg leading-none text-inherit"
              onClick={() => setError('')}
              aria-label="Dismiss error"
            >
              &times;
            </button>
          </div>
        )}

        <div className="flex flex-1 flex-col gap-[22px] overflow-y-auto px-3 pt-5 pb-2 chat:px-5 chat:pt-[26px]">
          {booting ? (
            <div className="m-auto text-sm text-muted">Loading conversations...</div>
          ) : messages.length === 0 ? (
            <div className="m-auto flex w-full max-w-[620px] flex-col items-center px-4 pt-[30px] pb-[60px] text-center">
              <div className="grid h-14 w-14 place-items-center rounded-2xl bg-linear-to-br from-[#3b82f6] to-[#8b5cf6] font-extrabold text-white shadow-[0_12px_30px_rgba(59,130,246,0.28)]">
                AI
              </div>
              <h1 className="mt-[18px] mb-1.5 text-[26px]">How can I help today?</h1>
              <p className="mt-0 mb-6 text-[14.5px] text-muted">
                Ask anything. Your conversations are stored in MongoDB.
              </p>
              <div className="grid w-full grid-cols-1 gap-2.5 chat:grid-cols-2">
                {SUGGESTIONS.map((suggestion) => (
                  <button
                    key={suggestion}
                    type="button"
                    className="cursor-pointer rounded-xl border border-border bg-panel px-3.5 py-3 text-left text-[13.5px] text-[#c9d5e2] transition enabled:hover:-translate-y-px enabled:hover:border-accent enabled:hover:bg-panel-2"
                    onClick={() => handleSend(suggestion)}
                    disabled={isStreaming}
                  >
                    {suggestion}
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <>
              {messages.map((message) => (
                <MessageBubble key={message._id} message={message} />
              ))}
            </>
          )}
          <div ref={endRef} />
        </div>

        <Composer onSend={handleSend} disabled={isStreaming || booting} />
      </main>
    </div>
  );
}
