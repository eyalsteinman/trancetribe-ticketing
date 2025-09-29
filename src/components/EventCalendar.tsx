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
          // Use secure lookup for friend profiles
          const friendLookups = await Promise.all(
            friendPersonalCodes.map(code => 
              supabase.rpc('lookup_friend_by_personal_code', { _personal_code: code })
            )
          );
          
          const friendProfiles = friendLookups
            .filter(result => result.data && !result.error)
            .map(result => result.data) as any[];
          const profilesError = friendLookups.find(result => result.error)?.error;

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
      <div className="min-h-screen bg-background p-4">
        <div className="container mx-auto max-w-6xl">
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
    <div className="min-h-screen bg-background p-4 scroll-smooth">
      <div className="container mx-auto max-w-4xl px-4">
        <div className="flex items-center mb-6">
          <Button variant="ghost" size="icon" onClick={onBack} className="mr-2">
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <h1 className="text-2xl font-bold">{t('event_calendar')}</h1>
        </div>

        <div className="space-y-6">
          {/* Legend */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Legend</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex gap-6 text-sm">
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 border-2 border-green-500 rounded-full bg-green-100" />
                  <span>Approved Events</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 border-2 border-orange-500 rounded-full bg-orange-100" />
                  <span>Pending Events</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Calendar and Event Details */}
          <div className="grid gap-6 lg:grid-cols-2">
            {/* Calendar */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Your Events Calendar</CardTitle>
              </CardHeader>
              <CardContent className="p-4">
                <Calendar
                  mode="single"
                  selected={selectedDate}
                  onSelect={handleDateSelect}
                  modifiers={modifiers}
                  modifiersStyles={modifiersStyles}
                  className="w-full pointer-events-auto"
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
                      {selectedEvent.party.photo_url ? (
                        <div 
                          className="w-full h-64 bg-cover bg-center rounded-lg mb-4 cursor-pointer hover:opacity-90 transition-opacity shadow-lg"
                          style={{ backgroundImage: `url(${selectedEvent.party.photo_url})` }}
                          onClick={handlePartyClick}
                          title="Click to view party details"
                        />
                      ) : (
                        <div 
                          className="w-full h-64 bg-gradient-to-br from-primary/20 to-primary/5 rounded-lg mb-4 cursor-pointer hover:opacity-90 transition-opacity shadow-lg flex items-center justify-center"
                          onClick={handlePartyClick}
                          title="Click to view party details"
                        >
                          <CalendarIcon className="h-16 w-16 text-primary/40" />
                        </div>
                      )}
                      <div className="space-y-3">
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
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Users className="h-5 w-5" />
                        Friends Attending ({selectedEvent.friends.length})
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      {selectedEvent.friends.length > 0 ? (
                        <div className="space-y-3">
                          {selectedEvent.friends.map((friend, index) => (
                            <div key={index} className="flex items-center p-3 bg-muted rounded-lg">
                              <div className="w-8 h-8 bg-primary/20 rounded-full flex items-center justify-center mr-3">
                                <span className="text-primary font-semibold text-sm">
                                  {friend.friend_first_name?.charAt(0) || friend.friend_display_name?.charAt(0) || '?'}
                                </span>
                              </div>
                              <span className="font-medium">
                                {friend.friend_first_name && friend.friend_last_name 
                                  ? `${friend.friend_first_name} ${friend.friend_last_name}`
                                  : friend.friend_display_name
                                }
                              </span>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="text-center text-muted-foreground py-8">
                          <Users className="h-12 w-12 mx-auto mb-3 opacity-50" />
                          <p>None of your friends are attending this event</p>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </>
              ) : (
                <Card>
                  <CardContent className="p-8 text-center text-muted-foreground">
                    <CalendarIcon className="h-16 w-16 mx-auto mb-4 opacity-50" />
                    <h3 className="text-lg font-medium mb-2">Select an Event Date</h3>
                    <p>Click on a date with a colored circle to see event details and friends attending</p>
                  </CardContent>
                </Card>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EventCalendar;