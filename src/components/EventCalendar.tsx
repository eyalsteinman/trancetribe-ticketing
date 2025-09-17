import React, { useState, useEffect } from 'react';
import { Calendar } from '@/components/ui/calendar';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Users } from 'lucide-react';
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
          parties!inner (
            id,
            name,
            photo_url,
            date
          )
        `)
        .eq('user_id', userId);

      if (qrError) throw qrError;

      // Get user's friends
      const { data: friends, error: friendsError } = await supabase
        .from('friends')
        .select('*')
        .eq('user_id', userId);

      if (friendsError) throw friendsError;

      // Process events by date
      const eventsMap = new Map<string, EventDay>();

      qrCodes?.forEach((qr) => {
        const party = qr.parties as any;
        const dateKey = party.date;
        
        if (!eventsMap.has(dateKey)) {
          eventsMap.set(dateKey, {
            date: parseISO(party.date),
            party: {
              id: party.id,
              name: party.name,
              photo_url: party.photo_url,
              date: party.date,
            },
            qrStatus: qr.is_approved ? 'approved' : 'pending',
            friends: []
          });
        } else {
          // Update status to approved if any QR is approved
          const existing = eventsMap.get(dateKey)!;
          if (qr.is_approved) {
            existing.qrStatus = 'approved';
          }
        }
      });

      // For each event, find friends who are also going
      for (const [dateKey, eventDay] of eventsMap.entries()) {
        const partyId = eventDay.party.id;
        
        // Get QR codes for this party from friends
        const friendPersonalCodes = friends?.map(f => f.friend_personal_code) || [];
        
        if (friendPersonalCodes.length > 0) {
          const { data: friendProfiles, error: profilesError } = await supabase
            .from('profiles')
            .select('user_id, personal_code')
            .in('personal_code', friendPersonalCodes);

          if (profilesError) {
            console.error('Error fetching friend profiles:', profilesError);
          } else {
            const friendUserIds = friendProfiles?.map(p => p.user_id) || [];
            
            if (friendUserIds.length > 0) {
              const { data: friendQrs, error: friendQrError } = await supabase
                .from('qr_codes')
                .select('user_id')
                .eq('party_id', partyId)
                .in('user_id', friendUserIds);

              if (friendQrError) {
                console.error('Error fetching friend QR codes:', friendQrError);
              } else {
                // Match friend QRs with friend data
                const attendingFriends = friendQrs?.map(fqr => {
                  const friendProfile = friendProfiles.find(fp => fp.user_id === fqr.user_id);
                  const friendData = friends?.find(f => f.friend_personal_code === friendProfile?.personal_code);
                  return friendData;
                }).filter(Boolean) || [];

                eventDay.friends = attendingFriends as any[];
              }
            }
          }
        }
      }

      setEventDays(Array.from(eventsMap.values()));
    } catch (error) {
      console.error('Error loading events:', error);
      toast({
        title: "Error",
        description: "Failed to load events",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDateSelect = (date: Date | undefined) => {
    if (!date) return;
    
    setSelectedDate(date);
    const event = eventDays.find(e => isSameDay(e.date, date));
    setSelectedEvent(event || null);
  };

  const handlePartyClick = () => {
    if (selectedEvent) {
      // Store party in localStorage and navigate back to dashboard to show party details
      localStorage.setItem('selectedParty', JSON.stringify(selectedEvent.party));
      onBack();
    }
  };

  const getDayContent = (date: Date) => {
    const event = eventDays.find(e => isSameDay(e.date, date));
    if (!event) return null;

    return (
      <div className="relative">
        <div className={cn(
          "w-2 h-2 rounded-full absolute -top-1 -right-1",
          event.qrStatus === 'approved' ? "bg-green-500" : "bg-orange-500"
        )} />
      </div>
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background p-4">
        <div className="container mx-auto">
          <div className="flex items-center mb-6">
            <Button variant="ghost" size="icon" onClick={onBack} className="mr-2">
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <h1 className="text-2xl font-bold">{t('event_calendar')}</h1>
          </div>
          <div className="text-center">Loading...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-4">
      <div className="container mx-auto max-w-4xl">
        <div className="flex items-center mb-6">
          <Button variant="ghost" size="icon" onClick={onBack} className="mr-2">
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <h1 className="text-2xl font-bold">{t('event_calendar')}</h1>
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          {/* Calendar */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Your Events</CardTitle>
              <div className="flex gap-4 text-sm">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-green-500 rounded-full" />
                  <span>Approved</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-orange-500 rounded-full" />
                  <span>Pending</span>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <Calendar
                mode="single"
                selected={selectedDate}
                onSelect={handleDateSelect}
                className="rounded-md border w-full"
                modifiers={{
                  hasEvent: (date) => eventDays.some(e => isSameDay(e.date, date))
                }}
                modifiersStyles={{
                  hasEvent: { position: 'relative' }
                }}
                components={{
                  Day: ({ date, ...props }) => {
                    const event = eventDays.find(e => isSameDay(e.date, date));
                    return (
                      <div {...props} className="relative">
                        <span>{date.getDate()}</span>
                        {event && (
                          <div className={cn(
                            "w-2 h-2 rounded-full absolute top-0 right-0",
                            event.qrStatus === 'approved' ? "bg-green-500" : "bg-orange-500"
                          )} />
                        )}
                      </div>
                    );
                  },
                }}
              />
            </CardContent>
          </Card>

          {/* Event Details */}
          <div className="space-y-6">
            {selectedEvent ? (
              <>
                {/* Party Photo and Details */}
                <Card>
                  <CardContent className="p-6">
                    {selectedEvent.party.photo_url && (
                      <div 
                        className="w-full h-48 bg-cover bg-center rounded-lg mb-4 cursor-pointer hover:opacity-90 transition-opacity"
                        style={{ backgroundImage: `url(${selectedEvent.party.photo_url})` }}
                        onClick={handlePartyClick}
                      />
                    )}
                    <div className="space-y-2">
                      <h3 className="text-xl font-semibold">{selectedEvent.party.name}</h3>
                      <p className="text-muted-foreground">
                        {format(selectedEvent.date, 'EEEE, MMMM d, yyyy')}
                      </p>
                      <Badge variant={selectedEvent.qrStatus === 'approved' ? 'default' : 'secondary'}>
                        {selectedEvent.qrStatus === 'approved' ? 'Approved' : 'Pending Approval'}
                      </Badge>
                    </div>
                  </CardContent>
                </Card>

                {/* Friends Attending */}
                {selectedEvent.friends.length > 0 && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Users className="h-5 w-5" />
                        Friends Attending ({selectedEvent.friends.length})
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2">
                        {selectedEvent.friends.map((friend, index) => (
                          <div key={index} className="flex items-center p-2 bg-muted rounded-lg">
                            <span className="font-medium">
                              {friend.friend_first_name && friend.friend_last_name 
                                ? `${friend.friend_first_name} ${friend.friend_last_name}`
                                : friend.friend_display_name
                              }
                            </span>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                )}

                {selectedEvent.friends.length === 0 && (
                  <Card>
                    <CardContent className="p-6 text-center text-muted-foreground">
                      <Users className="h-12 w-12 mx-auto mb-2 opacity-50" />
                      <p>None of your friends are attending this event</p>
                    </CardContent>
                  </Card>
                )}
              </>
            ) : (
              <Card>
                <CardContent className="p-6 text-center text-muted-foreground">
                  <Calendar className="h-12 w-12 mx-auto mb-2 opacity-50" />
                  <p>Select a date with an event to see details</p>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default EventCalendar;