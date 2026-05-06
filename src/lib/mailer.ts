import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

export async function sendMail(opts: {
  to: string | string[];
  subject: string;
  html: string;
}) {
  const { error } = await resend.emails.send({
    from: 'נפש יהודי <onboarding@resend.dev>',
    to: Array.isArray(opts.to) ? opts.to : [opts.to],
    subject: opts.subject,
    html: opts.html,
  });
  if (error) throw new Error(error.message);
}
