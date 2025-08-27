import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Slider } from '@/components/ui/slider';
import { Trash2, Plus } from 'lucide-react';
import RtlText from './RtlText';

interface TicketType {
  id: string;
  label: string;
  price: number;
  quantity: number;
}

interface TicketManagerProps {
  tickets: TicketType[];
  onChange: (tickets: TicketType[]) => void;
  maxTicketsPerUser: number;
  onMaxTicketsChange: (max: number) => void;
}

const TicketManager = ({ tickets, onChange, maxTicketsPerUser, onMaxTicketsChange }: TicketManagerProps) => {
  const addTicketType = () => {
    const newTicket: TicketType = {
      id: Date.now().toString(),
      label: '',
      price: 0,
      quantity: 0
    };
    onChange([...tickets, newTicket]);
  };

  const updateTicket = (id: string, field: keyof TicketType, value: string | number) => {
    const updated = tickets.map(ticket => 
      ticket.id === id ? { ...ticket, [field]: value } : ticket
    );
    onChange(updated);
  };

  const removeTicket = (id: string) => {
    onChange(tickets.filter(ticket => ticket.id !== id));
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Ticket Management</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <label className="text-sm font-medium">Max Tickets Per User</label>
          <Input
            type="number"
            min="1"
            value={maxTicketsPerUser || ""}
            onChange={(e) => onMaxTicketsChange(Number(e.target.value) || 1)}
            placeholder="Enter amount"
          />
        </div>

        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h4 className="font-medium">Ticket Types</h4>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={addTicketType}
            >
              <Plus className="h-4 w-4 mr-1" />
              Add Type
            </Button>
          </div>

          {tickets.map((ticket) => (
            <div key={ticket.id} className="border rounded p-3 space-y-2">
              <div className="flex justify-between items-center">
                <span className="font-medium">Ticket Type</span>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => removeTicket(ticket.id)}
                  className="text-red-600 hover:text-red-700"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
              
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium">Label</label>
                  <Input
                    placeholder="e.g. Early Bird, VIP, General"
                    value={ticket.label}
                    onChange={(e) => updateTicket(ticket.id, 'label', e.target.value)}
                    className="text-base w-full"
                  />
                  {ticket.label && (
                    <div className="mt-1">
                      <RtlText text={ticket.label} className="text-sm text-muted-foreground" />
                    </div>
                  )}
                </div>
                
                <div className="space-y-6">
                  <div>
                    <label className="text-sm font-medium">Price (ILS): {ticket.price || 0}</label>
                    <div className="space-y-3">
                      <Slider
                        value={[ticket.price || 0]}
                        onValueChange={(value) => updateTicket(ticket.id, 'price', value[0])}
                        max={600}
                        min={0}
                        step={5}
                        className="w-full"
                      />
                      <Input
                        type="number"
                        min="0"
                        max="600"
                        step="5"
                        value={ticket.price === 0 ? "0" : ticket.price || ""}
                        onChange={(e) => updateTicket(ticket.id, 'price', Number(e.target.value) || 0)}
                        placeholder="Enter price"
                        className="w-full"
                      />
                    </div>
                  </div>
                  
                  <div>
                    <label className="text-sm font-medium">Quantity: {ticket.quantity || 0}</label>
                    <div className="space-y-3">
                      <Slider
                        value={[ticket.quantity || 0]}
                        onValueChange={(value) => updateTicket(ticket.id, 'quantity', value[0])}
                        max={600}
                        min={0}
                        step={1}
                        className="w-full"
                      />
                      <Input
                        type="number"
                        min="0"
                        max="600"
                        value={ticket.quantity === 0 ? "0" : ticket.quantity || ""}
                        onChange={(e) => updateTicket(ticket.id, 'quantity', Number(e.target.value) || 0)}
                        placeholder="Enter quantity"
                        className="w-full"
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}

          {tickets.length === 0 && (
            <p className="text-sm text-muted-foreground text-center py-4">
              No ticket types added. Click "Add Type" to create ticket options.
            </p>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default TicketManager;