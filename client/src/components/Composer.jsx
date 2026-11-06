import { useEffect, useRef, useState } from 'react';

export default function Composer({ onSend, disabled }) {
  const [value, setValue] = useState('');
  const textareaRef = useRef(null);

  useEffect(() => {
    const element = textareaRef.current;
    if (!element) return;
    element.style.height = 'auto';
    element.style.height = `${Math.min(element.scrollHeight, 180)}px`;
  }, [value]);

  function submit() {
    const content = value.trim();
    if (!content || disabled) return;
    setValue('');
    onSend(content);
  }

  return (
    <div className="mx-auto w-full max-w-[880px] shrink-0 px-3 pt-2 pb-3 chat:px-5 chat:pt-2.5 chat:pb-4">
      <div className="flex items-end gap-2.5 rounded-[18px] border border-border bg-panel p-2 pl-4 transition focus-within:border-accent/60 focus-within:shadow-[0_0_0_3px_rgba(59,130,246,0.12)]">
        <textarea
          ref={textareaRef}
          rows={1}
          value={value}
          placeholder="Message the assistant..."
          className="max-h-[180px] min-h-6 flex-1 resize-none border-0 bg-transparent py-2 text-[15px] leading-normal text-text outline-none placeholder:text-muted"
          onChange={(event) => setValue(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === 'Enter' && !event.shiftKey) {
              event.preventDefault();
              submit();
            }
            
          }}
          disabled={disabled}
        />
        <button
          type="button"
          className="grid h-10 w-10 shrink-0 cursor-pointer place-items-center rounded-xl border-0 bg-accent-strong text-white transition enabled:hover:-translate-y-px disabled:cursor-not-allowed disabled:opacity-40"
          onClick={submit}
          disabled={disabled || !value.trim()}
          aria-label="Send message"
        >
          <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true">
            <path
              d="M4 12l16-8-5.5 16-2.6-6.2L4 12z"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.8"
              strokeLinejoin="round"
            />
          </svg>
        </button>
      </div>
      <p className="mt-2 mb-0 text-center text-[11px] text-muted">
        Enter to send, Shift + Enter for a new line
      </p>
    </div>
  );
}
