import axios from 'axios';
import { getSession, updateSession, withApiAuthRequired } from '@auth0/nextjs-auth0';

export default withApiAuthRequired(async function handler(req, res) {
  const { code } = req.query;
  const session = await getSession(req, res);
  const redirectUri = 'http://localhost:3000/api/oauth/outlook';

  if (code) {
    const response = await axios.post('https://login.microsoftonline.com/common/oauth2/v2.0/token', new URLSearchParams({
      client_id: process.env.OUTLOOK_CLIENT_ID,
      client_secret: process.env.OUTLOOK_CLIENT_SECRET,
      code,
      redirect_uri: redirectUri,
      grant_type: 'authorization_code'
    }));

    console.log(response.data);

    const { access_token, refresh_token } = response.data;

    // Save outlook tokens in the session
    await updateSession(req, res, {...session, user: {...session.user, outlookTokens: { access_token, refresh_token }}})

    res.redirect('/');
  } else {
    const authUrl = `https://login.microsoftonline.com/common/oauth2/v2.0/authorize?client_id=${process.env.OUTLOOK_CLIENT_ID}&response_type=code&redirect_uri=${redirectUri}&response_mode=query&scope=Mail.Read`;
    res.redirect(authUrl);
  }
});
