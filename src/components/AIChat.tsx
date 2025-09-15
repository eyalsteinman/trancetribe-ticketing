import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { MessageCircle, Send, Trash2 } from 'lucide-react';

interface ChatMessage {
  id: string;
  text: string;
  isUser: boolean;
  timestamp: Date;
}

const AIChat = () => {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: '1',
      text: "Hi! I'm here to help you navigate and use the Trance Tribes Tickets app. Ask me anything about events, tickets, features, or how to use the app!",
      isUser: false,
      timestamp: new Date()
    }
  ]);
  const [inputText, setInputText] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const appFeatures = {
    events: "Browse and join events, view event details, get tickets, and see your upcoming events in the Events & Parties section.",
    tickets: "Your QR code tickets appear on the dashboard after approval. Show them to enter events.",
    profile: "Update your personal information, nickname, and preferences in the My Info section.",
    social: "Connect your social media accounts and discover events through your networks.",
    vip: "Access exclusive VIP experiences and premium services for special events.",
    bartab: "Manage your bar tab balance, add funds, and track spending at events.",
    friends: "Share friend codes to connect with others and invite them to events.",
    insurance: "View insurance information and coverage details for events.",
    messages: "Receive notifications and communicate with event organizers.",
    faq: "Find answers to common questions and contact support when needed."
  };

  const getAIResponse = (userMessage: string): string => {
    const message = userMessage.toLowerCase();
    
    if (message.includes('ticket') || message.includes('qr')) {
      return "Your tickets appear as QR codes on your dashboard after they're approved by event organizers. Simply show the QR code at the event entrance for scanning. You can also view ticket details by tapping on any event card.";
    }
    
    if (message.includes('event') || message.includes('party')) {
      return "To find events: Go to 'Events & Parties' from your dashboard. You can browse available events, view details, and request tickets. Events show photos, dates, locations, and descriptions to help you choose.";
    }
    
    if (message.includes('profile') || message.includes('info') || message.includes('nickname')) {
      return "Update your profile in 'My Info' section. You can change your nickname, personal details, and preferences. Your display name appears when you interact with others at events.";
    }
    
    if (message.includes('social') || message.includes('facebook') || message.includes('instagram')) {
      return "Connect your social accounts in 'Social Networks' to discover events from your network and share your event participation with friends.";
    }
    
    if (message.includes('vip') || message.includes('premium')) {
      return "VIP services offer exclusive experiences like priority entry, special areas, and premium amenities. Check the VIP section to see available upgrades for events.";
    }
    
    if (message.includes('bar') || message.includes('drink') || message.includes('payment')) {
      return "The Bar Tab feature lets you add funds to your account for seamless payments at event bars. No need for cash or cards during events!";
    }
    
    if (message.includes('friend') || message.includes('invite') || message.includes('code')) {
      return "Share your friend codes with others to connect and invite them to events. Find these in 'Friends Codes' and 'Personal Code' sections.";
    }
    
    if (message.includes('message') || message.includes('notification') || message.includes('communication')) {
      return "Check 'Messages' for important notifications from event organizers, updates about your tickets, and communication about events you're attending.";
    }
    
    if (message.includes('help') || message.includes('support') || message.includes('contact')) {
      return "For support: Check this FAQ section first, then use the contact information provided to reach out to our support team for personalized assistance.";
    }
    
    if (message.includes('how') || message.includes('start') || message.includes('begin')) {
      return "Getting started: 1) Complete your profile in 'My Info' 2) Browse events in 'Events & Parties' 3) Request tickets for events you want to attend 4) Wait for approval and check your dashboard for QR codes 5) Show your QR code at the event entrance!";
    }
    
    if (message.includes('admin') || message.includes('organize') || message.includes('create')) {
      return "For event organizers: The admin dashboard allows you to create events, manage guest lists, scan QR codes, and communicate with attendees. Contact support to get admin access if you're organizing events.";
    }

    // Default response with app overview
    return "I can help you with: Events & tickets, Profile management, Social features, VIP services, Bar tab, Friend codes, Messages, and general app navigation. What specific feature would you like to know more about?";
  };

  const handleSendMessage = () => {
    if (!inputText.trim() || isLoading) return;
    
    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      text: inputText,
      isUser: true,
      timestamp: new Date()
    };
    
    setMessages(prev => [...prev, userMessage]);
    setInputText('');
    setIsLoading(true);
    
    // Simulate AI thinking time
    setTimeout(() => {
      const aiResponse: ChatMessage = {
        id: (Date.now() + 1).toString(),
        text: getAIResponse(inputText),
        isUser: false,
        timestamp: new Date()
      };
      
      setMessages(prev => [...prev, aiResponse]);
      setIsLoading(false);
    }, 1000);
  };

  const clearChat = () => {
    setMessages([
      {
        id: '1',
        text: "Hi! I'm here to help you navigate and use the Trance Tribes Tickets app. Ask me anything about events, tickets, features, or how to use the app!",
        isUser: false,
        timestamp: new Date()
      }
    ]);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSendMessage();
    }
  };

  return (
    <Card className="mb-6">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-lg">
          <MessageCircle className="h-5 w-5" />
          Ask AI Assistant
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Chat Messages */}
        <div className="max-h-64 overflow-y-auto space-y-3 border border-border rounded-md p-3 bg-background/50">
          {messages.map((message) => (
            <div
              key={message.id}
              className={`flex ${message.isUser ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-[80%] p-2 rounded-lg text-sm ${
                  message.isUser
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-muted text-foreground'
                }`}
              >
                {message.text}
              </div>
            </div>
          ))}
          {isLoading && (
            <div className="flex justify-start">
              <div className="bg-muted text-foreground p-2 rounded-lg text-sm">
                AI is typing...
              </div>
            </div>
          )}
        </div>

        {/* Input and Controls */}
        <div className="flex gap-2">
          <Input
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Ask about events, tickets, features..."
            className="flex-1"
            disabled={isLoading}
          />
          <Button 
            onClick={handleSendMessage}
            disabled={!inputText.trim() || isLoading}
            size="sm"
          >
            <Send className="h-4 w-4" />
          </Button>
          <Button 
            onClick={clearChat}
            variant="outline"
            size="sm"
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default AIChat;