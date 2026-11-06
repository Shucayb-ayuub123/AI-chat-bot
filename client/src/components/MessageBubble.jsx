import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

export default function MessageBubble({ message }) {
  const isUser = message.role === 'user';
  const isTyping = message.pending && !message.content;

  return (
    <div
      className={`mx-auto flex w-full max-w-[840px] items-start gap-3 ${
        isUser ? 'flex-row-reverse' : ''
      }`}
    >
      <div
        className={`grid h-[34px] w-[34px] shrink-0 place-items-center rounded-[10px] text-[11px] font-bold text-white ${
          isUser
            ? 'bg-linear-to-br from-[#2563eb] to-[#1d4ed8]'
            : 'bg-linear-to-br from-[#3b82f6] to-[#8b5cf6]'
        }`}
      >
        {isUser ? 'You' : 'AI'}
      </div>
      <div
        className={`max-w-[84%] overflow-wrap-anywhere rounded-2xl px-4 py-3 text-[15px] leading-[1.62] break-words [overflow-wrap:anywhere] chat:max-w-[min(78%,660px)] ${
          isUser
            ? 'rounded-br-sm bg-linear-to-br from-[#2563eb] to-[#1e50c9] text-white'
            : 'rounded-bl-sm border border-border bg-panel-2'
        }`}
      >
        {isUser ? (
          <p className="m-0 whitespace-pre-wrap">{message.content}</p>
        ) : message.content ? (
          <div className="markdown">
            <ReactMarkdown remarkPlugins={[remarkGfm]}>{message.content}</ReactMarkdown>
            {message.pending && (
              <span className="ml-0.5 inline-block h-[1em] w-[7px] animate-blink rounded-[1px] bg-accent align-text-bottom" />
            )}
          </div>
        ) : (
          <span className="inline-flex items-center gap-1 py-[3px]">
            <i className="h-[7px] w-[7px] animate-dot rounded-full bg-muted [animation-delay:0s]" />
            <i className="h-[7px] w-[7px] animate-dot rounded-full bg-muted [animation-delay:0.15s]" />
            <i className="h-[7px] w-[7px] animate-dot rounded-full bg-muted [animation-delay:0.3s]" />
          </span>
        )}
      </div>
    </div>
  );
}
