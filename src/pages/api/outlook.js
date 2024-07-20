import axios from 'axios';
import { getSession, withApiAuthRequired } from '@auth0/nextjs-auth0';

export default withApiAuthRequired(async function handler(req, res) {
  const session = await getSession(req, res);
  console.log(session.user);
  const tokens = session.user?.outlookTokens;
  
  if (!tokens) {
    return res.status(401).json({ error: 'No Outlook tokens' });
  }

  const response = await axios.get('https://graph.microsoft.com/v1.0/me/messages', {
    headers: { Authorization: `Bearer ${tokens.access_token}` }
  });

  const messages = response.data.value.map(message => ({
    ...message,
    source: 'outlook' 
  }));

  console.log(messages.length);

  res.json(messages);
});
