import {
  Body,
  Container,
  Head,
  Heading,
  Html,
  Preview,
  Text,
  Section,
} from 'npm:@react-email/components@0.0.22'
import * as React from 'npm:react@18.3.1'

interface QRCodeEmailProps {
  qrCode: string;
  partyName: string;
  userName?: string;
  partyDate?: string;
}

export const QRCodeEmail = ({
  qrCode,
  partyName,
  userName,
  partyDate,
}: QRCodeEmailProps) => (
  <Html>
    <Head />
    <Preview>Your QR code for {partyName} has been approved!</Preview>
    <Body style={main}>
      <Container style={container}>
        <Heading style={h1}>🎉 Your QR Code is Ready!</Heading>
        
        <Text style={text}>
          Hi{userName ? ` ${userName}` : ''},
        </Text>
        
        <Text style={text}>
          Great news! Your QR code for <strong>{partyName}</strong> has been approved and is ready to use.
          {partyDate && ` The party is on ${new Date(partyDate).toLocaleDateString()}.`}
        </Text>
        
        <Section style={qrSection}>
          <Heading style={h2}>Your QR Code</Heading>
          <div style={qrCodeContainer}>
            <Text style={qrCodeText}>
              {qrCode}
            </Text>
          </div>
          <Text style={instructions}>
            Screenshot this QR code or save this email to show at the party entrance
          </Text>
        </Section>
        
        <Text style={text}>
          <strong>Important:</strong> Please bring this QR code with you to the party. 
          You can either show this email or screenshot the QR code above.
        </Text>
        
        <Text style={text}>
          Have an amazing time at the party! 🎉
        </Text>
        
        <hr style={separator} />
        <Text style={footer}>
          This email was sent automatically. Please do not reply to this email.
        </Text>
      </Container>
    </Body>
  </Html>
)

export default QRCodeEmail

const main = {
  backgroundColor: '#ffffff',
  fontFamily: '-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,Oxygen-Sans,Ubuntu,Cantarell,"Helvetica Neue",sans-serif',
}

const container = {
  maxWidth: '600px',
  margin: '0 auto',
  padding: '20px',
}

const h1 = {
  color: '#333',
  fontSize: '28px',
  fontWeight: 'bold',
  margin: '30px 0',
  textAlign: 'center' as const,
}

const h2 = {
  color: '#333',
  fontSize: '20px',
  fontWeight: 'bold',
  margin: '20px 0 10px 0',
  textAlign: 'center' as const,
}

const text = {
  color: '#333',
  fontSize: '16px',
  lineHeight: '24px',
  margin: '16px 0',
}

const qrSection = {
  backgroundColor: '#f5f5f5',
  padding: '30px',
  margin: '30px 0',
  borderRadius: '8px',
  textAlign: 'center' as const,
}

const qrCodeContainer = {
  backgroundColor: '#ffffff',
  padding: '20px',
  borderRadius: '8px',
  margin: '20px 0',
  border: '2px solid #ddd',
}

const qrCodeText = {
  fontFamily: 'monospace',
  fontSize: '14px',
  wordBreak: 'break-all' as const,
  margin: '0',
  padding: '10px',
  backgroundColor: '#f9f9f9',
  borderRadius: '4px',
}

const instructions = {
  fontSize: '14px',
  color: '#666',
  margin: '15px 0 5px 0',
  fontStyle: 'italic',
}

const separator = {
  margin: '30px 0',
  border: 'none',
  borderTop: '1px solid #eee',
}

const footer = {
  fontSize: '12px',
  color: '#888',
  textAlign: 'center' as const,
  margin: '20px 0',
}