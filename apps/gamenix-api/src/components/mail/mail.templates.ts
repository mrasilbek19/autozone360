const escapeHtml = (value: string): string => value.replace(/[&<>"']/g, (character) => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
}[character]));

export const emailVerificationMessage = (name: string, link: string) => ({
    subject: 'Gamenix365 — Verify your email',
    html: `<p>Hello ${escapeHtml(name)},</p><p>Verify your Gamenix365 email address:</p>
<p><a href="${escapeHtml(link)}">Verify email</a></p>
<p>This link expires in 15 minutes and can be used once. If you did not request it, ignore this email.</p>`,
    text: `Hello ${name},\n\nVerify your Gamenix365 email address:\n${link}\n\nThis link expires in 15 minutes and can be used once. If you did not request it, ignore this email.`,
});
