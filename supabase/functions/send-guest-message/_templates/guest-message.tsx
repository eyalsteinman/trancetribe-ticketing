import {
  Body,
  Container,
  Head,
  Heading,
  Html,
  Preview,
  Text,
  Section,
} from 'npm:@react-email/components@0.0.22';
import * as React from 'npm:react@18.3.1';

interface GuestMessageEmailProps {
  message: string;
  partyName?: string;
}

export const GuestMessageEmail = ({
  message,
  partyName,
}: GuestMessageEmailProps) => (
  <Html>
    <Head />
    <Preview>Message from Party Admin</Preview>
    <Body style={main}>
      <Container style={container}>
        <Heading style={h1}>Message from Party Admin</Heading>
        
        {partyName && (
          <Section style={section}>
            <Text style={label}>Regarding:</Text>
            <Text style={partyText}>{partyName}</Text>
          </Section>
        )}

        <Section style={messageSection}>
          <Text style={messageText}>{message}</Text>
        </Section>

        <Text style={footer}>
          This message was sent by the party administrator. Please do not reply to this email.
        </Text>
      </Container>
    </Body>
  </Html>
);

export default GuestMessageEmail;

const main = {
  backgroundColor: '#ffffff',
  fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", "Roboto", "Oxygen", "Ubuntu", "Cantarell", "Fira Sans", "Droid Sans", "Helvetica Neue", sans-serif',
};

const container = {
  paddingLeft: '20px',
  paddingRight: '20px',
  margin: '0 auto',
  maxWidth: '600px',
};

const h1 = {
  color: '#333',
  fontSize: '24px',
  fontWeight: 'bold',
  margin: '40px 0 30px 0',
  padding: '0',
};

const section = {
  margin: '20px 0',
};

const label = {
  color: '#666',
  fontSize: '14px',
  fontWeight: 'bold',
  margin: '0 0 5px 0',
};

const partyText = {
  color: '#333',
  fontSize: '16px',
  margin: '0',
  fontWeight: '500',
};

const messageSection = {
  backgroundColor: '#f9f9f9',
  padding: '20px',
  borderRadius: '8px',
  margin: '30px 0',
  border: '1px solid #e5e5e5',
};

const messageText = {
  color: '#333',
  fontSize: '16px',
  lineHeight: '1.6',
  margin: '0',
  whiteSpace: 'pre-wrap' as const,
};

const footer = {
  color: '#888',
  fontSize: '12px',
  lineHeight: '1.4',
  marginTop: '40px',
  marginBottom: '20px',
  textAlign: 'center' as const,
};