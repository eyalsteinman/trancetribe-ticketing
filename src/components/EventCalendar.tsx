import React, { useState, useEffect } from 'react';
import { Calendar } from '@/components/ui/calendar';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Users, Calendar as CalendarIcon, Sparkles } from 'lucide-react';
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
      border: '2px solid hsl(var(--primary))',
      borderRadius: '50%',
      backgroundColor: 'hsl(var(--primary) / 0.1)',
    },
    pendingEvent: {
      border: '2px solid hsl(var(--secondary))',
      borderRadius: '50%',
      backgroundColor: 'hsl(var(--secondary) / 0.1)',
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-background/95 to-primary/5 flex flex-col items-center justify-center p-4">
        <div className="absolute top-6 left-6">
          <Button variant="ghost" size="icon" onClick={onBack}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
        </div>
        <div className="flex flex-col items-center space-y-4">
          <div className="w-8 h-8 border-4 border-primary/30 border-t-primary rounded-full animate-spin"></div>
          <p className="text-foreground font-medium">{t('loading')}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background/95 to-primary/5 flex flex-col items-center justify-center p-4 relative">
      {/* Floating back button */}
      <div className="absolute top-6 left-6 z-10">
        <Button 
          variant="ghost" 
          size="icon" 
          onClick={onBack}
          className="bg-white/10 backdrop-blur-md border border-white/20 text-foreground hover:bg-white/20 transition-all duration-300"
        >
          <ArrowLeft className="h-5 w-5" />
        </Button>
      </div>

      {/* Floating title */}
      <div className="absolute top-6 left-1/2 transform -translate-x-1/2 z-10">
        <h1 className="text-2xl font-bold text-foreground bg-white/10 backdrop-blur-md px-6 py-2 rounded-full border border-white/20">
          {t('event_calendar')}
        </h1>
      </div>

      {/* Main calendar floating in center */}
      <div className="w-full max-w-sm mx-auto mt-20">
        <div className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-3xl shadow-2xl p-8 hover:shadow-3xl transition-all duration-500">
          <Calendar
            mode="single"
            selected={selectedDate}
            onSelect={handleDateSelect}
            modifiers={modifiers}
            modifiersStyles={modifiersStyles}
            className="w-full"
            classNames={{
              months: "space-y-4",
              month: "space-y-4",
              caption: "flex justify-center pt-1 relative items-center text-foreground font-bold text-lg",
              caption_label: "text-sm font-medium",
              nav: "space-x-1 flex items-center",
              nav_button: "h-7 w-7 bg-transparent p-0 opacity-50 hover:opacity-100 text-foreground",
              nav_button_previous: "absolute left-1",
              nav_button_next: "absolute right-1",
              table: "w-full border-collapse space-y-1",
              head_row: "flex",
              head_cell: "text-muted-foreground rounded-md w-9 font-normal text-[0.8rem]",
              row: "flex w-full mt-2",
              cell: "text-center text-sm p-0 relative",
              day: "h-9 w-9 p-0 font-normal text-foreground hover:bg-primary/20 rounded-full transition-all duration-200 flex items-center justify-center cursor-pointer",
              day_selected: "bg-primary text-primary-foreground hover:bg-primary/90 font-bold",
              day_today: "bg-secondary text-secondary-foreground font-bold",
              day_outside: "text-muted-foreground opacity-50",
              day_disabled: "text-muted-foreground opacity-50 cursor-not-allowed",
              day_range_middle: "aria-selected:bg-accent aria-selected:text-accent-foreground",
              day_hidden: "invisible",
            }}
          />
        </div>
      </div>

      {/* Floating event details */}
      {selectedEvent && (
        <div className="fixed bottom-4 left-4 right-4 max-w-md mx-auto">
          <div className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-3xl shadow-2xl overflow-hidden hover:shadow-3xl transition-all duration-500">
            {/* Party image or placeholder */}
            {selectedEvent.party.photo_url ? (
              <div 
                className="w-full h-48 bg-cover bg-center cursor-pointer relative group"
                style={{ backgroundImage: `url(${selectedEvent.party.photo_url})` }}
                onClick={handlePartyClick}
              >
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
                <div className="absolute inset-0 bg-primary/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                <div className="absolute bottom-4 left-4 right-4">
                  <h3 className="text-xl font-bold text-white drop-shadow-lg">{selectedEvent.party.name}</h3>
                  <p className="text-white/90 font-medium drop-shadow">
                    {format(parseISO(selectedEvent.party.date), 'MMMM d, yyyy')}
                  </p>
                </div>
                <Sparkles className="absolute top-4 right-4 h-6 w-6 text-white/80" />
              </div>
            ) : (
              <div 
                className="w-full h-48 bg-gradient-to-br from-primary/30 to-secondary/20 cursor-pointer relative group flex items-center justify-center"
                onClick={handlePartyClick}
              >
                <CalendarIcon className="h-16 w-16 text-primary/60" />
                <div className="absolute bottom-4 left-4 right-4">
                  <h3 className="text-xl font-bold text-foreground">{selectedEvent.party.name}</h3>
                  <p className="text-muted-foreground font-medium">
                    {format(parseISO(selectedEvent.party.date), 'MMMM d, yyyy')}
                  </p>
                </div>
              </div>
            )}
            
            {/* Status and friends info */}
            <div className="p-6 space-y-4">
              <div className="flex items-center justify-between">
                <Badge 
                  variant={selectedEvent.qrStatus === 'approved' ? 'default' : 'secondary'}
                  className="px-3 py-1 text-sm font-medium"
                >
                  {selectedEvent.qrStatus === 'approved' ? t('approved') : t('pending')}
                </Badge>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Users className="h-4 w-4" />
                  <span>{selectedEvent.friends.length} {t('friends_going')}</span>
                </div>
              </div>
              
              {selectedEvent.friends.length > 0 && (
                <div className="flex -space-x-2">
                  {selectedEvent.friends.slice(0, 5).map((friend, index) => (
                    <div 
                      key={index} 
                      className="w-8 h-8 bg-gradient-to-br from-primary/30 to-secondary/20 rounded-full flex items-center justify-center border-2 border-white text-xs font-bold text-foreground"
                    >
                      {friend.friend_first_name?.charAt(0) || friend.friend_display_name.charAt(0)}
                    </div>
                  ))}
                  {selectedEvent.friends.length > 5 && (
                    <div className="w-8 h-8 bg-muted rounded-full flex items-center justify-center border-2 border-white text-xs font-bold text-muted-foreground">
                      +{selectedEvent.friends.length - 5}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default EventCalendar;