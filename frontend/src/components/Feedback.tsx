import React, { useEffect, useState } from 'react';
export function notify(message: string) { window.dispatchEvent(new CustomEvent('feedback', { detail: message })); }
export default function Feedback() {
  const [message, setMessage] = useState('');
  useEffect(() => { const listener = (event: Event) => setMessage((event as CustomEvent<string>).detail); window.addEventListener('feedback', listener); return () => window.removeEventListener('feedback', listener); }, []);
  useEffect(() => { if (!message) return; const timer = setTimeout(() => setMessage(''), 7000); return () => clearTimeout(timer); }, [message]);
  return message ? <div role="status" aria-live="polite" className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[100] max-w-[90vw] rounded-xl bg-gray-900 text-white shadow-xl p-4 flex gap-4"><span>{message}</span><button aria-label="Dismiss notification" onClick={() => setMessage('')}>×</button></div> : null;
}
