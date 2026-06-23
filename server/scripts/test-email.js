/**
 * Script de test pour l'envoi d'email
 * Usage: node scripts/test-email.js <email>
 */

require('dotenv').config({ path: '.env' });
const nodemailer = require('nodemailer');

const testEmail = process.argv[2] || 'loic5488@gmail.com';

/** Complète SMTP_USER si seul le login local est fourni (ex. facture). */
function resolveSmtpAuthUser() {
  const raw = process.env.SMTP_USER?.trim();
  if (!raw) return undefined;
  if (raw.includes('@')) return raw;
  const from = process.env.MAIL_FROM || '';
  const domain = from.includes('@') ? from.split('@')[1] : '';
  return domain ? `${raw}@${domain}` : raw;
}

const smtpUser = resolveSmtpAuthUser();

console.log('Configuration SMTP:');
console.log('  Host:', process.env.SMTP_HOST || 'localhost');
console.log('  Port:', process.env.SMTP_PORT || 1025);
console.log('  User:', smtpUser || 'non configuré');
console.log('  From:', process.env.MAIL_FROM || 'no-reply@example.com');
console.log('');

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || 'localhost',
  port: Number(process.env.SMTP_PORT || 1025),
  secure: process.env.SMTP_SECURE === 'true',
  requireTLS: Number(process.env.SMTP_PORT || 1025) === 587 && process.env.SMTP_SECURE !== 'true',
  auth: smtpUser
    ? {
        user: smtpUser,
        pass: process.env.SMTP_PASS || '',
      }
    : undefined,
  tls: process.env.SMTP_REJECT_UNAUTHORIZED === 'false'
    ? { rejectUnauthorized: false }
    : undefined,
});

const mailOptions = {
  from: `${process.env.MAIL_FROM_NAME || 'PrestaFacture'} <${process.env.MAIL_FROM || 'no-reply@example.com'}>`,
  to: testEmail,
  subject: 'Test email PrestaFacture',
  html: `
    <!DOCTYPE html>
    <html lang="fr">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Test email PrestaFacture</title>
      <style>
        body { font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #1f2937; margin: 0; padding: 0; background: #ffffff; }
        .container { max-width: 600px; margin: 0 auto; padding: 24px; }
        .header { background: linear-gradient(135deg, #f8f9fa 0%, #ffffff 100%); padding: 24px; border-radius: 8px; margin-bottom: 24px; border-left: 4px solid #dc2626; box-shadow: 0 1px 2px 0 rgb(0 0 0 / 0.05); }
        .header h2 { margin: 0; font-size: 1.5rem; color: #dc2626; font-weight: 700; }
        .content { padding: 0 0 24px; }
        .content p { margin: 0 0 12px; color: #374151; }
        .footer { margin-top: 32px; padding-top: 20px; border-top: 1px solid #e5e7eb; font-size: 11px; color: #6b7280; line-height: 1.5; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h2>Test email PrestaFacture</h2>
        </div>
        <div class="content">
          <p>Bonjour,</p>
          <p>Ceci est un email de test depuis PrestaFacture.</p>
          <p>Si vous recevez cet email, la configuration SMTP fonctionne correctement !</p>
        </div>
        <div class="footer">
          <p>${process.env.COMPANY_NAME || 'Votre Entreprise'} - ${process.env.COMPANY_ADDRESS || ''}</p>
          <p>Cet email a été envoyé automatiquement par PrestaFacture.</p>
        </div>
      </div>
    </body>
    </html>
  `,
  text: 'Bonjour,\n\nCeci est un email de test depuis PrestaFacture.\n\nSi vous recevez cet email, la configuration SMTP fonctionne correctement !'
};

console.log(`Envoi de l'email de test à ${testEmail}...`);

transporter.sendMail(mailOptions)
  .then((info) => {
    console.log('✅ Email envoyé avec succès !');
    console.log('Message ID:', info.messageId);
    console.log('Response:', info.response);
  })
  .catch((error) => {
    console.error('❌ Erreur lors de l\'envoi de l\'email:');
    console.error(error);
    process.exit(1);
  });
