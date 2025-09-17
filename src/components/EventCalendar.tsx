import React, { useState, useEffect } from 'react';
import { Calendar } from '@/components/ui/calendar';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Users, Calendar as CalendarIcon } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { format, parseISO, isSameDay } from 'date-fns';
import { cn } from '@/lib/utils';
import { useLanguage } from '@/contexts/LanguageContext';
import { toast } from '@/hooks/use-toast';

interface EventCalendarProps {
  onBack: () => void;
  userId: string;
}

interface EventDay {
  date: Date;
  party: {
    id: string;
    name: string;
    photo_url?: string;
    date: string;
  };
  qrStatus: 'approved' | 'pending';
  friends: {
    friend_display_name: string;
    friend_first_name?: string;
    friend_last_name?: string;
  }[];
}

const EventCalendar: React.FC<EventCalendarProps> = ({ onBack, userId }) => {
  const { t } = useLanguage();
  const [selectedDate, setSelectedDate] = useState<Date>();
  const [eventDays, setEventDays] = useState<EventDay[]>([]);
  const [selectedEvent, setSelectedEvent] = useState<EventDay | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadUserEvents();
  }, [userId]);

  const loadUserEvents = async () => {
    try {
      setLoading(true);
      
      // Get user's QR codes with party details
      const { data: qrCodes, error: qrError } = await supabase
        .from('qr_codes')
        .select(`
          *,
          parties (
            id,
            name,
            photo_url,
            date
          )
        `)
        .eq('user_id', userId);

      if (qrError) throw qrError;

      // Get user's friends for each party
      const { data: friends, error: friendsError } = await supabase
        .from('friends')
        .select('*')
        .eq('user_id', userId);

      if (friendsError) throw friendsError;

      // Create event days array
      const events: EventDay[] = [];
      
      if (qrCodes) {
        for (const qrCode of qrCodes) {
          if (qrCode.parties) {
            // Get friends who have QR codes for this party
            const partyFriends = await supabase
              .from('qr_codes')
              .select(`
                user_id,
                profiles!inner (
                  personal_code
                )
              `)
              .eq('party_id', qrCode.parties.id)
              .neq('user_id', userId);

            // Match with user's friends list
            const matchingFriends = friends?.filter(friend => 
              partyFriends.data?.some(pf => 
                pf.profiles.personal_code === friend.friend_personal_code
              )
            ) || [];

            events.push({
              date: parseISO(qrCode.parties.date),
              party: qrCode.parties,
              qrStatus: qrCode.is_approved ? 'approved' : 'pending',
              friends: matchingFriends
            });
          }
        }
      }

      setEventDays(events);
    } catch (error) {
      console.error('Error loading events:', error);
      toast({
        title: t('error'),
        description: t('failed_to_load_events'),
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDateSelect = (date: Date | undefined) => {
    if (!date) return;
    
    setSelectedDate(date);
    const event = eventDays.find(ed => isSameDay(ed.date, date));
    setSelectedEvent(event || null);
  };

  const handlePartyClick = () => {
    if (selectedEvent) {
      // Store party in localStorage and navigate back to dashboard to show party details
      localStorage.setItem('selectedPartyId', selectedEvent.party.id);
      localStorage.setItem('viewPartyDetails', 'true');
      onBack();
    }
  };

  // Custom day modifier to show circles around dates with events
  const modifiers = {
    eventDay: (date: Date) => eventDays.some(e => isSameDay(e.date, date)),
    approvedEvent: (date: Date) => {
      const event = eventDays.find(e => isSameDay(e.date, date));
      return event?.qrStatus === 'approved';
    },
    pendingEvent: (date: Date) => {
      const event = eventDays.find(e => isSameDay(e.date, date));
      return event?.qrStatus === 'pending';
    }
  };

  const modifiersStyles = {
    eventDay: {
      position: 'relative' as const,
    },
    approvedEvent: {
      border: '2px solid #22c55e',
      borderRadius: '50%',
      backgroundColor: 'rgba(34, 197, 94, 0.1)',
    },
    pendingEvent: {
      border: '2px solid #f97316',
      borderRadius: '50%',
      backgroundColor: 'rgba(249, 115, 22, 0.1)',
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-background/80 to-primary/5">
        <div className="container mx-auto max-w-6xl p-4">
          <div className="flex items-center mb-6">
            <Button variant="ghost" size="icon" onClick={onBack} className="mr-2">
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <h1 className="text-2xl font-bold">{t('event_calendar')}</h1>
          </div>
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background/80 to-primary/5">
      <div className="container mx-auto max-w-6xl p-4">
        <div className="flex items-center mb-6">
          <Button variant="ghost" size="icon" onClick={onBack} className="mr-2">
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <h1 className="text-2xl font-bold">{t('event_calendar')}</h1>
        </div>
        
        <div className="flex flex-col items-center justify-center min-h-[calc(100vh-200px)] space-y-8">
          <div className="w-full max-w-7xl grid lg:grid-cols-2 gap-8 items-start">
            {/* Calendar Section - Modern floating design */}
            <div className="flex justify-center lg:justify-end">
              <div className="bg-card/80 backdrop-blur-sm rounded-3xl shadow-2xl border border-border/50 p-8 hover:shadow-3xl transition-all duration-300">
                <div className="text-center mb-6">
                  <h2 className="text-2xl font-bold bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent flex items-center justify-center gap-2">
                    <CalendarIcon className="h-6 w-6 text-primary" />
                    {t('your_events')}
                  </h2>
                </div>
                <Calendar
                  mode="single"
                  selected={selectedDate}
                  onSelect={handleDateSelect}
                  modifiers={modifiers}
                  modifiersStyles={modifiersStyles}
                  className="rounded-2xl border-0 shadow-inner bg-background/50"
                />
              </div>
            </div>

            {/* Event Details Section - Modern floating design */}
            <div className="flex justify-center lg:justify-start">
              <div className="w-full max-w-md space-y-6">
                {selectedEvent ? (
                  <>
                    {/* Party Photo and Details */}
                    <div className="bg-card/80 backdrop-blur-sm rounded-3xl shadow-2xl border border-border/50 overflow-hidden hover:shadow-3xl transition-all duration-300">
                      {selectedEvent.party.photo_url ? (
                        <div 
                          className="w-full h-64 bg-cover bg-center cursor-pointer hover:scale-105 transition-transform duration-500"
                          style={{ backgroundImage: `url(${selectedEvent.party.photo_url})` }}
                          onClick={handlePartyClick}
                          title="Click to view party details"
                        />
                      ) : (
                        <div 
                          className="w-full h-64 bg-gradient-to-br from-primary/20 to-primary/5 cursor-pointer hover:scale-105 transition-transform duration-500 flex items-center justify-center"
                          onClick={handlePartyClick}
                          title="Click to view party details"
                        >
                          <CalendarIcon className="h-16 w-16 text-primary/40" />
                        </div>
                      )}
                      
                      <div className="p-6 space-y-3">
                        <h3 className="text-xl font-bold bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text">{selectedEvent.party.name}</h3>
                        <p className="text-muted-foreground font-medium">
                          {format(parseISO(selectedEvent.party.date), 'MMMM d, yyyy')}
                        </p>
                        <Badge 
                          variant={selectedEvent.qrStatus === 'approved' ? 'default' : 'secondary'}
                          className="shadow-md"
                        >
                          {selectedEvent.qrStatus === 'approved' ? t('approved') : t('pending')}
                        </Badge>
                      </div>
                    </div>

                    {/* Friends Going Section */}
                    <div className="bg-card/80 backdrop-blur-sm rounded-3xl shadow-2xl border border-border/50 p-6 hover:shadow-3xl transition-all duration-300">
                      <div className="flex items-center gap-2 mb-4">
                        <Users className="h-5 w-5 text-primary" />
                        <h3 className="text-lg font-bold bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent">
                          {t('friends_going')} ({selectedEvent.friends.length})
                        </h3>
                      </div>
                      {selectedEvent.friends.length > 0 ? (
                        <div className="space-y-3">
                          {selectedEvent.friends.map((friend, index) => (
                            <div key={index} className="flex items-center gap-3 p-3 bg-background/50 rounded-2xl border border-border/30 hover:bg-background/70 transition-colors">
                              <div className="w-10 h-10 bg-gradient-to-br from-primary/20 to-primary/10 rounded-full flex items-center justify-center shadow-sm">
                                <span className="text-sm font-bold text-primary">
                                  {friend.friend_first_name?.charAt(0) || friend.friend_display_name.charAt(0)}
                                </span>
                              </div>
                              <span className="font-medium">
                                {friend.friend_first_name && friend.friend_last_name 
                                  ? `${friend.friend_first_name} ${friend.friend_last_name}`
                                  : friend.friend_display_name}
                              </span>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="text-muted-foreground text-center py-6 text-sm">
                          {t('no_friends_going')}
                        </p>
                      )}
                    </div>
                  </>
                ) : (
                  <div className="bg-card/80 backdrop-blur-sm rounded-3xl shadow-2xl border border-border/50 p-8 text-center hover:shadow-3xl transition-all duration-300">
                    <CalendarIcon className="h-12 w-12 text-muted-foreground mx-auto mb-4 opacity-50" />
                    <h3 className="text-lg font-semibold mb-2">{t('select_date')}</h3>
                    <p className="text-muted-foreground text-sm">
                      {t('click_on_highlighted_date')}
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EventCalendar;