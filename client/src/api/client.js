const API_BASE = import.meta.env.VITE_API_URL || '/api';

async function request(path, options = {}) {
  const response = await fetch(`${API_BASE}${path}`, {
    headers: { 'Content-Type': 'application/json' },
    ...options,
  });

  if (!response.ok) {
    const data = await response.json().catch(() => ({}));
    throw new Error(data.error || `Request failed (${response.status})`);
  }

  return response.json();
}

export function listConversations() {
  return request('/conversations').then((data) => data.conversations);
}

export function createConversation() {
  return request('/conversations', { method: 'POST' }).then((data) => data.conversation);
}

export function getConversation(id) {
  return request(`/conversations/${id}`);
}

export function deleteConversation(id) {
  return request(`/conversations/${id}`, { method: 'DELETE' });
}

export async function sendMessageStream(conversationId, content, handlers) {
  const response = await fetch(`${API_BASE}/conversations/${conversationId}/messages`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ content }),
  });

  if (!response.ok) {
    const data = await response.json().catch(() => ({}));
    throw new Error(data.error || `Request failed (${response.status})`);
  }

  if (!response.body) {
    throw new Error('Streaming is not supported in this browser.');
  }

  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let buffer = '';
  let completed = false;

  while (true) {
    const { value, done } = await reader.read();
    if (done) break;

    buffer += decoder.decode(value, { stream: true });
    const events = buffer.split('\n\n');
    buffer = events.pop() ?? '';

    for (const event of events) {
      const line = event.split('\n').find((item) => item.startsWith('data:'));
      if (!line) continue;

      let payload;
      try {
        payload = JSON.parse(line.slice(5).trim());
      } catch {
        continue;
      }

      if (payload.type === 'delta') handlers.onDelta(payload.text);
      else if (payload.type === 'done') {
        completed = true;
        handlers.onDone(payload);
      } else if (payload.type === 'error') {
        completed = true;
        handlers.onError(new Error(payload.message));
      }
    }
  }

  if (!completed) {
    handlers.onError(new Error('The connection closed before the response finished.'));
  }
}
