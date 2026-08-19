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
  totalTickets?: number;
}

const TicketManager = ({ tickets, onChange, maxTicketsPerUser, onMaxTicketsChange, totalTickets }: TicketManagerProps) => {
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
  const updated = tickets.map(ticket => {
    if (ticket.id !== id) return ticket;
    if (field === 'quantity' && typeof totalTickets === 'number') {
      const othersSum = tickets.filter(t => t.id !== id).reduce((s, t) => s + (t.quantity || 0), 0);
      const maxForThis = Math.max(0, totalTickets - othersSum);
      const nextQty = Math.max(0, Math.min(Number(value) || 0, maxForThis));
      return { ...ticket, quantity: nextQty };
    }
    return { ...ticket, [field]: value };
  });
  onChange(updated);
};

const removeTicket = (id: string) => {
  onChange(tickets.filter(ticket => ticket.id !== id));
};

const totalAllocated = tickets.reduce((sum, t) => sum + (t.quantity || 0), 0);
const remaining = typeof totalTickets === 'number' ? Math.max(0, totalTickets - totalAllocated) : undefined;

return (
    <Card>
      <CardHeader>
        <CardTitle>Ticket Management</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <label className="text-sm font-medium">Max Tickets Per User</label>
          <select
            className="w-full p-2 border rounded-md"
            value={maxTicketsPerUser || 1}
            onChange={(e) => onMaxTicketsChange(Number(e.target.value))}
          >
            {[1,2,3,4,5,6,7,8,9,10].map(num => (
              <option key={num} value={num}>{num}</option>
            ))}
          </select>
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
{typeof totalTickets === 'number' && (
  <p className="text-xs text-muted-foreground">Remaining to allocate: {remaining} / {totalTickets}</p>
)}

{tickets.map((ticket) => {
  const othersSum = tickets.filter(t => t.id !== ticket.id).reduce((s, t) => s + (t.quantity || 0), 0);
  const computedMax = typeof totalTickets === 'number' ? Math.max(0, totalTickets - othersSum) : 600;
  const maxForInputs = Math.max(computedMax, ticket.quantity || 0);
  return (
    <div key={ticket.id} className="border rounded p-3 space-y-2">
      <div className="flex justify-between items-center">
        <span className="font-medium">Ticket Type</span>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => removeTicket(ticket.id)}
          className="text-destructive hover:text-destructive"
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
                value={ticket.price || ""}
                onChange={(e) => updateTicket(ticket.id, 'price', Number(e.target.value) || 0)}
                placeholder="Enter price"
                className="w-full"
              />
            </div>
          </div>
          
          <div>
            <label className="text-sm font-medium">Quantity: {ticket.quantity || 0}</label>
            {typeof totalTickets === 'number' && (
              <div className="text-xs text-muted-foreground mb-2">Max for this type based on total: {computedMax}</div>
            )}
            <div className="space-y-3">
              <Slider
                value={[ticket.quantity || 0]}
                onValueChange={(value) => updateTicket(ticket.id, 'quantity', value[0])}
                max={maxForInputs}
                min={0}
                step={1}
                className="w-full"
              />
              <Input
                type="number"
                min="0"
                max={maxForInputs}
                value={ticket.quantity || ""}
                onChange={(e) => updateTicket(ticket.id, 'quantity', Number(e.target.value) || 0)}
                placeholder="Enter quantity"
                className="w-full"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
})}

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