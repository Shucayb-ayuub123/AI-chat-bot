export default function Sidebar({
  conversations,
  activeId,
  open,
  onClose,
  onSelect,
  onNew,
  onDelete,
}) {
  return (
    <>
      <div
        className={`fixed inset-0 z-20 bg-black/55 chat:hidden ${open ? 'block' : 'hidden'}`}
        onClick={onClose}
      />
      <aside
        className={`fixed inset-y-0 left-0 z-30 flex w-[280px] shrink-0 flex-col border-r border-border bg-panel shadow-[0_20px_60px_rgba(0,0,0,0.5)] transition-transform duration-200 chat:static chat:translate-x-0 chat:shadow-none ${
          open ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="flex flex-col gap-3.5 px-4 pt-[18px] pb-3">
          <div className="flex items-center gap-2.5 font-semibold tracking-[0.2px]">
            <span className="grid h-[30px] w-[30px] place-items-center rounded-[9px] bg-linear-to-br from-[#3b82f6] to-[#8b5cf6] text-[12px] font-extrabold text-white">
              AI
            </span>
            <span>Chat Pilot</span>
          </div>
          <button
            className="flex cursor-pointer items-center justify-center gap-2 rounded-[10px] border border-border bg-panel-2 px-3 py-2.5 text-sm font-[550] text-text transition hover:border-accent hover:bg-panel-3"
            type="button"
            onClick={onNew}
          >
            <span className="text-base leading-none">+</span> New chat
          </button>
        </div>

        <nav className="flex flex-1 flex-col gap-0.5 overflow-y-auto px-2.5 pb-3" aria-label="Conversations">
          {conversations.length === 0 && (
            <p className="px-2 py-3.5 text-center text-[13px] text-muted">No conversations yet.</p>
          )}
          {conversations.map((conversation) => (
            <div
              key={conversation._id}
              className={`group flex cursor-pointer items-center gap-2 rounded-[10px] py-2.5 pr-2.5 pl-3 transition-colors ${
                conversation._id === activeId
                  ? 'bg-panel-3 text-text'
                  : 'text-[#c9d5e2] hover:bg-panel-2'
              }`}
              role="button"
              tabIndex={0}
              onClick={() => onSelect(conversation._id)}
              onKeyDown={(event) => {
                if (event.key === 'Enter' || event.key === ' ') {
                  event.preventDefault();
                  onSelect(conversation._id);
                }
              }}
            >
              <span className="min-w-0 flex-1 truncate text-[13.5px]">{conversation.title}</span>
              <button
                type="button"
                className="h-[22px] w-[22px] shrink-0 cursor-pointer rounded-md border-0 bg-transparent text-base leading-none text-muted opacity-0 transition group-hover:opacity-100 group-focus-within:opacity-100 focus-visible:opacity-100 hover:bg-danger/15 hover:text-danger"
                aria-label={`Delete ${conversation.title}`}
                onClick={(event) => onDelete(event, conversation._id)}
              >
                &times;
              </button>
            </div>
          ))}
        </nav>

        <div className="flex items-center gap-2 border-t border-border px-4 py-3 text-xs text-muted">
          <span className="h-[7px] w-[7px] rounded-full bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.7)]" />
          Powered by Gemini
        </div>
      </aside>
    </>
  );
}
