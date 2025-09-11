import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import PageHeader from './ui/page-header';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useBackNavigation } from '@/hooks/useBackNavigation';

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
  const [faqs, setFaqs] = useState<FAQItem[]>([]);
  
  useBackNavigation({
    onBackNavigation: onBack,
    isActive: true
  });
  const [contactInfo, setContactInfo] = useState<ContactInfo>({
    email: '',
    phone: '',
    address: ''
  });
  const [newQuestion, setNewQuestion] = useState('');
  const [newAnswer, setNewAnswer] = useState('');
  const [editingContactInfo, setEditingContactInfo] = useState(false);
  const [tempContactInfo, setTempContactInfo] = useState(contactInfo);
  const [loading, setLoading] = useState(true);
  const [editingFaqId, setEditingFaqId] = useState<string | null>(null);
  const [editQuestion, setEditQuestion] = useState('');
  const [editAnswer, setEditAnswer] = useState('');
  
  const { toast } = useToast();

  useEffect(() => {
    fetchFAQs();
    fetchContactInfo();
  }, []);

  const fetchFAQs = async () => {
    try {
      const { data, error } = await supabase
        .from('faqs')
        .select('*')
        .order('created_at', { ascending: true });

      if (error) throw error;
      setFaqs(data || []);
    } catch (error) {
      console.error('Error fetching FAQs:', error);
    }
  };

  const fetchContactInfo = async () => {
    try {
      const { data, error } = await supabase
        .from('contact_info')
        .select('*')
        .limit(1)
        .single();

      if (error && error.code !== 'PGRST116') throw error;
      
      if (data) {
        setContactInfo({
          email: data.email || '',
          phone: data.phone || '',
          address: data.address || ''
        });
        setTempContactInfo({
          email: data.email || '',
          phone: data.phone || '',
          address: data.address || ''
        });
      }
      setLoading(false);
    } catch (error) {
      console.error('Error fetching contact info:', error);
      setLoading(false);
    }
  };

  const addFAQ = async () => {
    if (!newQuestion.trim() || !newAnswer.trim()) {
      toast({
        title: "Error",
        description: "Please fill in both question and answer",
        variant: "destructive"
      });
      return;
    }

    try {
      const { data, error } = await supabase
        .from('faqs')
        .insert({
          question: newQuestion.trim(),
          answer: newAnswer.trim(),
          created_by: user?.id
        })
        .select()
        .single();

      if (error) throw error;

      setFaqs([...faqs, data]);
      setNewQuestion('');
      setNewAnswer('');
      
      toast({
        title: "Success",
        description: "FAQ added successfully!"
      });
    } catch (error) {
      console.error('Error adding FAQ:', error);
      toast({
        title: "Error",
        description: "Failed to add FAQ",
        variant: "destructive"
      });
    }
  };

  const deleteFAQ = async (id: string) => {
    try {
      const { error } = await supabase
        .from('faqs')
        .delete()
        .eq('id', id);

      if (error) throw error;

      setFaqs(faqs.filter(faq => faq.id !== id));
      toast({
        title: "Success",
        description: "FAQ deleted successfully!"
      });
    } catch (error) {
      console.error('Error deleting FAQ:', error);
      toast({
        title: "Error",
        description: "Failed to delete FAQ",
        variant: "destructive"
      });
    }
  };

  const saveContactInfo = async () => {
    try {
      // Check if contact info exists
      const { data: existingData } = await supabase
        .from('contact_info')
        .select('id')
        .limit(1)
        .single();

      if (existingData) {
        // Update existing
        const { error } = await supabase
          .from('contact_info')
          .update({
            email: tempContactInfo.email,
            phone: tempContactInfo.phone,
            address: tempContactInfo.address
          })
          .eq('id', existingData.id);

        if (error) throw error;
      } else {
        // Create new
        const { error } = await supabase
          .from('contact_info')
          .insert({
            email: tempContactInfo.email,
            phone: tempContactInfo.phone,
            address: tempContactInfo.address,
            created_by: user?.id
          });

        if (error) throw error;
      }

      setContactInfo(tempContactInfo);
      setEditingContactInfo(false);
      toast({
        title: "Success",
        description: "Contact information updated!"
      });
    } catch (error) {
      console.error('Error saving contact info:', error);
      toast({
        title: "Error",
        description: "Failed to save contact information",
        variant: "destructive"
      });
    }
  };

  const startEditFaq = (faq: FAQItem) => {
    setEditingFaqId(faq.id);
    setEditQuestion(faq.question);
    setEditAnswer(faq.answer);
  };

  const cancelEditFaq = () => {
    setEditingFaqId(null);
    setEditQuestion('');
    setEditAnswer('');
  };

  const updateFAQ = async () => {
    if (!editingFaqId) return;
    if (!editQuestion.trim() || !editAnswer.trim()) {
      toast({ title: 'Error', description: 'Please fill in both fields', variant: 'destructive' });
      return;
    }

    try {
      const { data, error } = await supabase
        .from('faqs')
        .update({
          question: editQuestion.trim(),
          answer: editAnswer.trim(),
          updated_at: new Date().toISOString(),
        })
        .eq('id', editingFaqId)
        .select()
        .single();

      if (error) throw error;

      setFaqs(prev => prev.map(f => f.id === editingFaqId ? { ...f, question: data.question, answer: data.answer } : f));
      cancelEditFaq();
      toast({ title: 'Success', description: 'FAQ updated successfully!' });
    } catch (error) {
      console.error('Error updating FAQ:', error);
      toast({ title: 'Error', description: 'Failed to update FAQ', variant: 'destructive' });
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen p-4">
        <div className="max-w-md mx-auto space-y-6">
          <PageHeader
            title="FAQ & Contact"
            onBack={onBack}
            showBackButton={true}
          />
          <div className="text-center py-8">Loading...</div>
        </div>
      </div>
    );
  }

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
                  {isAdmin && editingFaqId === faq.id ? (
                    <div className="space-y-2">
                      <Input value={editQuestion} onChange={(e) => setEditQuestion(e.target.value)} placeholder="Question" />
                      <Textarea value={editAnswer} onChange={(e) => setEditAnswer(e.target.value)} rows={3} placeholder="Answer" />
                      <div className="flex gap-2">
                        <Button size="sm" onClick={updateFAQ}>Save</Button>
                        <Button size="sm" variant="outline" onClick={cancelEditFaq}>Cancel</Button>
                      </div>
                    </div>
                  ) : (
                    <>
                      <div className="flex justify-between items-start mb-2">
                        <h3 className="font-semibold text-sm flex-1">{faq.question}</h3>
                        {isAdmin && (
                          <div className="flex items-center gap-1">
                            <Button
                              variant="outline"
                              size="xs"
                              onClick={() => startEditFaq(faq)}
                            >
                              Edit
                            </Button>
                            <Button
                              variant="ghost"
                              size="xs"
                              onClick={() => deleteFAQ(faq.id)}
                              className="text-destructive hover:text-destructive"
                            >
                              Delete
                            </Button>
                          </div>
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground">{faq.answer}</p>
                    </>
                  )}
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