import { google } from 'googleapis';
import { withApiAuthRequired, updateSession, getSession } from '@auth0/nextjs-auth0';

export default withApiAuthRequired(async function handler(req, res) {
  const session = await getSession(req, res);

  const oauth2Client = new google.auth.OAuth2(
    process.env.GMAIL_CLIENT_ID,
    process.env.GMAIL_CLIENT_SECRET,
    'http://localhost:3000/api/oauth/gmail'
  );

  const { code } = req.query;

  if (code) {
    const { tokens } = await oauth2Client.getToken(code);
    oauth2Client.setCredentials(tokens);

    // Save tokens in session
    // Save outlook tokens in the session
    await updateSession(req, res, {...session, user: {...session.user, gmailTokens: { ...tokens }}})

    res.redirect('/');
  } else {
    const authUrl = oauth2Client.generateAuthUrl({
      access_type: 'offline',
      scope: ['https://www.googleapis.com/auth/gmail.readonly']
    });
    res.redirect(authUrl);
  }
});
