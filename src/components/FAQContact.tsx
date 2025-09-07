import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import PageHeader from './ui/page-header';
import { useToast } from '@/hooks/use-toast';

interface FAQItem {
  id: string;
  question: string;
  answer: string;
}

interface ContactInfo {
  email: string;
  phone: string;
  address?: string;
}

interface FAQContactProps {
  user?: any;
  onBack: () => void;
  isAdmin?: boolean;
}

const FAQContact = ({ user, onBack, isAdmin = false }: FAQContactProps) => {
  const [faqs, setFaqs] = useState<FAQItem[]>([
    {
      id: '1',
      question: 'How do I get my QR code?',
      answer: 'After purchasing a ticket, your QR code will be generated and needs admin approval before you can use it.'
    },
    {
      id: '2',
      question: 'Can I buy tickets for friends?',
      answer: 'Yes! You can purchase additional tickets for friends through the "Buy for Friends" option on each event page.'
    },
    {
      id: '3',
      question: 'What if my QR code is not working?',
      answer: 'Contact support immediately if your approved QR code is not scanning properly at the event entrance.'
    }
  ]);
  
  const [contactInfo, setContactInfo] = useState<ContactInfo>({
    email: 'support@trancetribes.com',
    phone: '+972-123-456-789',
    address: 'Tel Aviv, Israel'
  });

  const [newQuestion, setNewQuestion] = useState('');
  const [newAnswer, setNewAnswer] = useState('');
  const [editingContactInfo, setEditingContactInfo] = useState(false);
  const [tempContactInfo, setTempContactInfo] = useState(contactInfo);
  
  const { toast } = useToast();

  const addFAQ = () => {
    if (!newQuestion.trim() || !newAnswer.trim()) {
      toast({
        title: "Error",
        description: "Please fill in both question and answer",
        variant: "destructive"
      });
      return;
    }

    const newFAQ: FAQItem = {
      id: Date.now().toString(),
      question: newQuestion.trim(),
      answer: newAnswer.trim()
    };

    setFaqs([...faqs, newFAQ]);
    setNewQuestion('');
    setNewAnswer('');
    
    toast({
      title: "Success",
      description: "FAQ added successfully!"
    });
  };

  const deleteFAQ = (id: string) => {
    setFaqs(faqs.filter(faq => faq.id !== id));
    toast({
      title: "Success",
      description: "FAQ deleted successfully!"
    });
  };

  const saveContactInfo = () => {
    setContactInfo(tempContactInfo);
    setEditingContactInfo(false);
    toast({
      title: "Success",
      description: "Contact information updated!"
    });
  };

  return (
    <div className="min-h-screen p-4">
      <div className="max-w-md mx-auto space-y-6">
        <PageHeader
          title="FAQ & Contact"
          onBack={onBack}
          showBackButton={true}
        />

        <div className="space-y-6 pt-6">
          {/* FAQs Section */}
          <Card>
            <CardHeader>
              <CardTitle>Frequently Asked Questions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {faqs.map((faq) => (
                <div key={faq.id} className="border-b pb-4 last:border-b-0">
                  <div className="flex justify-between items-start mb-2">
                    <h3 className="font-semibold text-sm flex-1">{faq.question}</h3>
                    {isAdmin && (
                      <Button
                        variant="ghost"
                        size="xs"
                        onClick={() => deleteFAQ(faq.id)}
                        className="text-destructive hover:text-destructive ml-2"
                      >
                        Delete
                      </Button>
                    )}
                  </div>
                  <p className="text-sm text-muted-foreground">{faq.answer}</p>
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Add FAQ Section (Admin Only) */}
          {isAdmin && (
            <Card>
              <CardHeader>
                <CardTitle>Add New FAQ</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label className="text-sm font-medium">Question</label>
                  <Input
                    value={newQuestion}
                    onChange={(e) => setNewQuestion(e.target.value)}
                    placeholder="Enter the question..."
                  />
                </div>
                <div>
                  <label className="text-sm font-medium">Answer</label>
                  <Textarea
                    value={newAnswer}
                    onChange={(e) => setNewAnswer(e.target.value)}
                    placeholder="Enter the answer..."
                    rows={3}
                  />
                </div>
                <Button onClick={addFAQ} className="w-full">
                  Add FAQ
                </Button>
              </CardContent>
            </Card>
          )}

          {/* Contact Information */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Contact Information</CardTitle>
              {isAdmin && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    if (editingContactInfo) {
                      saveContactInfo();
                    } else {
                      setEditingContactInfo(true);
                      setTempContactInfo(contactInfo);
                    }
                  }}
                >
                  {editingContactInfo ? 'Save' : 'Edit'}
                </Button>
              )}
            </CardHeader>
            <CardContent className="space-y-3">
              {editingContactInfo ? (
                <>
                  <div>
                    <label className="text-sm font-medium">Email</label>
                    <Input
                      value={tempContactInfo.email}
                      onChange={(e) => setTempContactInfo({...tempContactInfo, email: e.target.value})}
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium">Phone</label>
                    <Input
                      value={tempContactInfo.phone}
                      onChange={(e) => setTempContactInfo({...tempContactInfo, phone: e.target.value})}
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium">Address</label>
                    <Input
                      value={tempContactInfo.address || ''}
                      onChange={(e) => setTempContactInfo({...tempContactInfo, address: e.target.value})}
                    />
                  </div>
                  <Button
                    variant="outline"
                    onClick={() => {
                      setEditingContactInfo(false);
                      setTempContactInfo(contactInfo);
                    }}
                    className="w-full"
                  >
                    Cancel
                  </Button>
                </>
              ) : (
                <>
                  <div className="text-sm">
                    <strong>Email:</strong> {contactInfo.email}
                  </div>
                  <div className="text-sm">
                    <strong>Phone:</strong> {contactInfo.phone}
                  </div>
                  {contactInfo.address && (
                    <div className="text-sm">
                      <strong>Address:</strong> {contactInfo.address}
                    </div>
                  )}
                </>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Footer */}
        <div className="mt-12 pt-6 border-t border-border/50 text-center space-y-3">
          <h3 className="font-bold text-xl text-primary">Trance Tribes Tickets</h3>
          <p className="text-sm text-muted-foreground">
            Created by Eyal Steinman, all rights reserved 2025
          </p>
        </div>
      </div>
    </div>
  );
};

export default FAQContact;