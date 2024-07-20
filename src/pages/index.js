import { useEffect, useState } from 'react';
import { useUser } from '@auth0/nextjs-auth0/client';
import axios from 'axios';

export default function Home() {
  const { user, error, isLoading } = useUser();
  const [emails, setEmails] = useState([]);
  const [replyText, setReplyText] = useState('');
  const [isGmailAssociated, setIsGmailAssociated] = useState(false);
  const [isOutlookAssociated, setIsOutlookAssociated] = useState(false);

  const fetchEmails = async () => {
    try {
      const [gmailEmails, outlookEmails] = await Promise.all([
        axios.get('/api/gmail'),
        axios.get('/api/outlook')
      ]);
      setEmails([...gmailEmails.data, ...outlookEmails.data]);
    } catch (err) {
      console.error('Error fetching emails:', err);
    }
  };

  useEffect(() => {
    if (user) {
      const checkAssociations = async () => {
        try {
          const gmailResponse = await axios.get('/api/gmail');
          const outlookResponse = await axios.get('/api/outlook');
          setIsGmailAssociated(gmailResponse.data.length > 0);
          setIsOutlookAssociated(outlookResponse.data.length > 0);
          if (gmailResponse.data.length > 0 && outlookResponse.data.length > 0) {
            setEmails([...gmailResponse.data, ...outlookResponse.data]);
          }
        } catch (err) {
          console.error('Error checking associations:', err);
        }
      };
      checkAssociations();
    }
  }, [user]);

  const handleReply = async (email, replyText) => {
    const isGmail = email.source === 'gmail';
    const apiEndpoint = isGmail ? '/api/gmail/reply' : '/api/outlook/reply';
    try {
      await axios.post(apiEndpoint, {
        messageId: email.id,
        threadId: email.threadId,
        replyText
      });
      setReplyText('');
    } catch (err) {
      console.error('Error replying to email:', err);
    }
  };

  if (isLoading) return <div>Loading...</div>;
  if (error) return <div>{error.message}</div>;

  return (
    <div>
      {!user && <a href="/api/auth/login">Login</a>}
      {user && (
        <div>
          <a href="/api/auth/logout">Logout</a>
          &nbsp;&nbsp;&nbsp;&nbsp;
          <a href="/api/oauth/gmail">Associate Gmail</a>
          &nbsp;&nbsp;&nbsp;&nbsp;
          <a href="/api/oauth/outlook">Associate Outlook</a>
          &nbsp;&nbsp;&nbsp;&nbsp;
          <button onClick={fetchEmails}>Refresh emails</button>
          <h1><center>Unibox</center></h1>
          {(!isGmailAssociated || !isOutlookAssociated) && (
            <div style={{ color: 'red', fontSize:32 }}>
              <center>Please associate both your Gmail and Outlook accounts.</center>
            </div>
          )}
          {isGmailAssociated && isOutlookAssociated && (
            <ul>
              {emails.map(email => (
                <li style={{ color: email.source === 'gmail' ? 'blue' : 'green' }} key={email.id}>
                  <h2>
                    {email.source === 'gmail'
                      ? email.payload.headers.find(header => header.name === 'Subject').value
                      : email.subject }
                  </h2>
                  <p>
                    {email.source === 'gmail'
                      ? email.snippet
                      : email.bodyPreview }
                  </p>
                  {/* <textarea value={replyText} onChange={(e) => setReplyText(e.target.value)} />
                  <button onClick={() => handleReply(email, replyText)}>Reply</button> */}
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}
