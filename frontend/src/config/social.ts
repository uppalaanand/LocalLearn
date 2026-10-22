// Leave unset until an official Local Learn profile exists.
export const socialLinks = ['LINKEDIN', 'TWITTER', 'INSTAGRAM', 'GITHUB'].flatMap(name => {
  const url = import.meta.env[`VITE_SOCIAL_${name}`];
  if (!url) return [];
  try { const parsed = new URL(url); return parsed.protocol === 'https:' && parsed.pathname !== '/' ? [{ name, url }] : []; }
  catch { return []; }
});
