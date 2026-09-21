import { Resend } from 'resend';

// Built on first use, not at import: `new Resend()` throws without an API key, and a module
// that fails to load would take down every server action importing it, including the ones
// that only want to *try* to send an email after their real work is done.
let client: Resend | undefined;

function getResend() {
  client ??= new Resend(process.env.RESEND_API_KEY);
  return client;
}

export async function sendAdminInviteEmail(opts: {
  to: string;
  inviteUrl: string;
  invitedByName: string;
}) {
  await getResend().emails.send({
    from: process.env.RESEND_FROM_EMAIL!,
    to: opts.to,
    subject: 'You have been invited to Talent Vault admin',
    html: `
      <p>${opts.invitedByName} invited you to join Talent Vault as an administrator.</p>
      <p><a href="${opts.inviteUrl}">Accept the invitation</a></p>
      <p>This link expires in 7 days. If you weren't expecting this, you can ignore this email.</p>
    `,
  });
}

function escapeHtml(text: string) {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

/**
 * Tells a chef the outcome of the review, in English and Italian: the language a chef picks
 * in the app lives only in their browser, so the email cannot know it.
 * Resolves to false instead of throwing, so a mail outage never undoes the decision itself.
 */
export async function sendChefReviewEmail(opts: {
  to: string;
  name: string;
  outcome: 'approved' | 'rejected';
  reason?: string;
  url: string;
}): Promise<boolean> {
  const name = escapeHtml(opts.name);
  const url = escapeHtml(opts.url);
  const reason = opts.reason ? escapeHtml(opts.reason).replace(/\n/g, '<br>') : '';

  const approved = opts.outcome === 'approved';

  const subject = approved
    ? 'Your application has been approved / La tua candidatura è stata approvata'
    : 'Your application was not approved / La tua candidatura non è stata approvata';

  const html = approved
    ? `
      <p>Hi ${name},</p>
      <p>Your application has been approved. You can now browse the opportunities available for your experience.</p>
      <p><a href="${url}">View opportunities</a></p>
      <hr>
      <p>Ciao ${name},</p>
      <p>La tua candidatura è stata approvata. Ora puoi visionare le opportunità disponibili in base alla tua esperienza.</p>
      <p><a href="${url}">Vedi le opportunità</a></p>
    `
    : `
      <p>Hi ${name},</p>
      <p>Your application was not approved. This is the note from our reviewer:</p>
      <blockquote>${reason}</blockquote>
      <p>Update your answers and documents, then send your application for review again.</p>
      <p><a href="${url}">Update my application</a></p>
      <hr>
      <p>Ciao ${name},</p>
      <p>La tua candidatura non è stata approvata. Questo è il messaggio del nostro revisore:</p>
      <blockquote>${reason}</blockquote>
      <p>Aggiorna le risposte e i documenti, poi invia di nuovo la candidatura per la revisione.</p>
      <p><a href="${url}">Aggiorna la candidatura</a></p>
    `;

  try {
    const { error } = await getResend().emails.send({
      from: process.env.RESEND_FROM_EMAIL!,
      to: opts.to,
      subject,
      html,
    });
    if (error) {
      console.error('Chef review email was rejected by Resend:', error);
      return false;
    }
    return true;
  } catch (error) {
    console.error('Chef review email could not be sent:', error);
    return false;
  }
}
