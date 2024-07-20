import { google } from "googleapis";
import { getSession, withApiAuthRequired } from "@auth0/nextjs-auth0";

export default withApiAuthRequired(async function handler(req, res) {
  const session = await getSession(req, res);
  // const tokens = JSON.parse(
  //   Buffer.from(process.env.GMAIL_CLIENT_TOKEN, "base64")
  // );
  const tokens = session.user?.gmailTokens;

  if (!tokens) {
    return res.status(401).json({ error: "No Gmail tokens" });
  }

  const oauth2Client = new google.auth.OAuth2(
    process.env.GMAIL_CLIENT_ID,
    process.env.GMAIL_CLIENT_SECRET
  );

  oauth2Client.setCredentials(tokens);

  const gmail = google.gmail({ version: "v1", auth: oauth2Client });

  const response = await gmail.users.messages.list({
    userId: "me",
    maxResults: 10,
  });

  const messages = await Promise.all(
    response.data.messages.map(async (message) => {
      const msg = await gmail.users.messages.get({
        userId: "me",
        id: message.id,
      });
      return {
        ...msg.data,
        source: "gmail",
      };
    })
  );

  //console.log(messages);

  res.json(messages);
});
