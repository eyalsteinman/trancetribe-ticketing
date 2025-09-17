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
    <div className="min-h-screen flex flex-col items-center justify-center p-4 space-y-6">
      <div className="flex items-center mb-6">
        <Button variant="ghost" size="icon" onClick={onBack} className="mr-2">
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <h1 className="text-2xl font-bold">{t('event_calendar')}</h1>
      </div>

      <div className="w-full max-w-md mx-auto">
        <div className="backdrop-blur-lg bg-white/10 border border-white/20 rounded-2xl shadow-2xl p-6">
          <Calendar
            mode="single"
            selected={selectedDate}
            onSelect={handleDateSelect}
            modifiers={modifiers}
            modifiersStyles={modifiersStyles}
            className="w-full calendar-modern"
            classNames={{
              day: "h-12 w-12 text-center text-sm rounded-full hover:bg-primary/20 transition-colors",
              day_selected: "bg-primary text-primary-foreground hover:bg-primary/90",
              day_today: "bg-accent text-accent-foreground font-bold"
            }}
          />
        </div>
      </div>

      {/* Event Details Section */}
      {selectedEvent && (
        <div className="w-full max-w-md mx-auto space-y-6">
          {/* Party Photo and Details */}
          <div className="backdrop-blur-lg bg-white/10 border border-white/20 rounded-2xl shadow-2xl overflow-hidden">
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
              <h3 className="text-xl font-bold text-white">{selectedEvent.party.name}</h3>
              <p className="text-white/80 font-medium">
                {format(parseISO(selectedEvent.party.date), 'MMMM d, yyyy')}
              </p>
              <div className={`px-3 py-1 rounded-full text-sm font-medium inline-block ${
                selectedEvent.qrStatus === 'approved' ? 'bg-green-500/20 text-green-300' : 'bg-orange-500/20 text-orange-300'
              }`}>
                {selectedEvent.qrStatus === 'approved' ? t('approved') : t('pending')}
              </div>
            </div>
          </div>

          {/* Friends Going Section */}
          <div className="backdrop-blur-lg bg-white/10 border border-white/20 rounded-2xl shadow-2xl p-6">
            <div className="flex items-center gap-2 mb-4">
              <Users className="h-5 w-5 text-primary" />
              <h3 className="text-lg font-bold text-white">
                {t('friends_going')} ({selectedEvent.friends.length})
              </h3>
            </div>
            {selectedEvent.friends.length > 0 ? (
              <div className="space-y-3">
                {selectedEvent.friends.map((friend, index) => (
                  <div key={index} className="flex items-center gap-3 p-3 bg-white/10 rounded-xl">
                    <div className="w-10 h-10 bg-gradient-to-br from-primary/30 to-primary/10 rounded-full flex items-center justify-center">
                      <span className="text-sm font-bold text-white">
                        {friend.friend_first_name?.charAt(0) || friend.friend_display_name.charAt(0)}
                      </span>
                    </div>
                    <span className="font-medium text-white">
                      {friend.friend_first_name && friend.friend_last_name 
                        ? `${friend.friend_first_name} ${friend.friend_last_name}`
                        : friend.friend_display_name}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-white/60 text-center py-6 text-sm">
                {t('no_friends_going')}
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default EventCalendar;