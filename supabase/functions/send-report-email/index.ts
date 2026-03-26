import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

/**
 * Sends an email via Gmail SMTP using a raw TCP connection emulated through
 * Deno.connect (which IS supported in Supabase Edge Functions for outbound).
 * 
 * Uses STARTTLS on port 587 via Deno's native TLS support.
 */
async function sendViaGmailSMTP(
  gmailUser: string,
  gmailAppPassword: string,
  recipients: string[],
  subject: string,
  bodyText: string,
  pdfBase64: string,
  filename: string
): Promise<void> {
  const encoder = new TextEncoder();
  const decoder = new TextDecoder();

  // Connect to Gmail SMTP on port 465 (implicit TLS)
  const conn = await Deno.connectTls({
    hostname: "smtp.gmail.com",
    port: 465,
  });

  async function readLine(): Promise<string> {
    const buf = new Uint8Array(4096);
    const n = await conn.read(buf);
    if (n === null) throw new Error("Connection closed unexpectedly");
    return decoder.decode(buf.subarray(0, n));
  }

  async function send(cmd: string): Promise<string> {
    const data = encoder.encode(cmd + "\r\n");
    let written = 0;
    while (written < data.length) {
      const n = await conn.write(data.subarray(written));
      if (n === null || n === 0) throw new Error("Failed to write to connection");
      written += n;
    }
    return await readLine();
  }

  // Read server greeting
  await readLine();

  // EHLO
  await send(`EHLO rental-tracker`);

  // AUTH LOGIN
  await send("AUTH LOGIN");
  await send(btoa(gmailUser));
  const authResult = await send(btoa(gmailAppPassword));

  if (!authResult.startsWith("235")) {
    conn.close();
    throw new Error(`SMTP Auth failed: ${authResult}`);
  }

  // MAIL FROM
  await send(`MAIL FROM:<${gmailUser}>`);

  // RCPT TO (one per recipient)
  for (const rcpt of recipients) {
    await send(`RCPT TO:<${rcpt}>`);
  }

  // DATA
  await send("DATA");

  // Build MIME email with PDF attachment
  const boundary = `----=_Part_${Date.now()}`;
  const mimeMessage = [
    `From: ${gmailUser}`,
    `To: ${recipients.join(', ')}`,
    `Subject: ${subject}`,
    `MIME-Version: 1.0`,
    `Content-Type: multipart/mixed; boundary="${boundary}"`,
    ``,
    `--${boundary}`,
    `Content-Type: text/plain; charset=UTF-8`,
    `Content-Transfer-Encoding: 7bit`,
    ``,
    bodyText,
    ``,
    `--${boundary}`,
    `Content-Type: application/pdf; name="${filename}"`,
    `Content-Transfer-Encoding: base64`,
    `Content-Disposition: attachment; filename="${filename}"`,
    ``,
    pdfBase64,
    ``,
    `--${boundary}--`,
    `.`,
  ].join('\r\n');

  const dataResult = await send(mimeMessage);

  // QUIT
  await send("QUIT");
  conn.close();

  if (!dataResult.startsWith("250")) {
    throw new Error(`SMTP send failed: ${dataResult}`);
  }
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const {
      toEmails,
      subject,
      body,
      pdfBase64,
      filename,
      gmailUser: reqGmailUser,
      gmailAppPassword: reqGmailAppPassword,
    } = await req.json();

    if (!toEmails || !subject || !pdfBase64) {
      return new Response(JSON.stringify({ error: 'Missing required fields' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const GMAIL_USER = reqGmailUser ?? Deno.env.get('GMAIL_USER');
    const GMAIL_APP_PASSWORD = reqGmailAppPassword ?? Deno.env.get('GMAIL_APP_PASSWORD');

    if (!GMAIL_USER || !GMAIL_APP_PASSWORD) {
      return new Response(JSON.stringify({ error: 'No Gmail credentials configured' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const recipientList = toEmails.split(',').map((e: string) => e.trim()).filter(Boolean);

    await sendViaGmailSMTP(
      GMAIL_USER,
      GMAIL_APP_PASSWORD,
      recipientList,
      subject,
      body,
      pdfBase64,
      filename || 'document.pdf'
    );

    return new Response(JSON.stringify({ success: true, sentFrom: GMAIL_USER, sentTo: recipientList }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Email send error:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
