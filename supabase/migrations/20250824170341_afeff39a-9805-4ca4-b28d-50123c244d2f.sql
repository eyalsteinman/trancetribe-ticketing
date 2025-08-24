-- Create bar_tabs table for managing bar tab options by production
CREATE TABLE public.bar_tabs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  production_id UUID NOT NULL,
  created_by UUID NOT NULL,
  item_name TEXT NOT NULL,
  regular_price NUMERIC NOT NULL DEFAULT 0,
  discounted_price NUMERIC NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.bar_tabs ENABLE ROW LEVEL SECURITY;

-- Create policies for bar_tabs
CREATE POLICY "Admins can manage bar tabs" 
ON public.bar_tabs 
FOR ALL 
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Everyone can view active bar tabs" 
ON public.bar_tabs 
FOR SELECT 
USING (is_active = true);

-- Create user_bar_tabs table for tracking user purchases
CREATE TABLE public.user_bar_tabs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  production_id UUID NOT NULL,
  total_amount NUMERIC NOT NULL DEFAULT 0,
  remaining_amount NUMERIC NOT NULL DEFAULT 0,
  barcode TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'active',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.user_bar_tabs ENABLE ROW LEVEL SECURITY;

-- Create policies for user_bar_tabs
CREATE POLICY "Users can view their own bar tabs" 
ON public.user_bar_tabs 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own bar tabs" 
ON public.user_bar_tabs 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins can view and update all bar tabs" 
ON public.user_bar_tabs 
FOR ALL 
USING (has_role(auth.uid(), 'admin'::app_role));

-- Create bar_tab_transactions table for tracking individual purchases
CREATE TABLE public.bar_tab_transactions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_bar_tab_id UUID NOT NULL,
  bar_tab_id UUID NOT NULL,
  quantity INTEGER NOT NULL DEFAULT 1,
  amount_spent NUMERIC NOT NULL DEFAULT 0,
  transaction_type TEXT NOT NULL DEFAULT 'purchase', -- 'purchase' or 'refund'
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_by UUID
);

-- Enable Row Level Security
ALTER TABLE public.bar_tab_transactions ENABLE ROW LEVEL SECURITY;

-- Create policies for bar_tab_transactions
CREATE POLICY "Users can view their own transactions" 
ON public.bar_tab_transactions 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM public.user_bar_tabs 
    WHERE id = user_bar_tab_id AND user_id = auth.uid()
  )
);

CREATE POLICY "Admins can manage all transactions" 
ON public.bar_tab_transactions 
FOR ALL 
USING (has_role(auth.uid(), 'admin'::app_role));

-- Create triggers for updated_at columns
CREATE TRIGGER update_bar_tabs_updated_at
  BEFORE UPDATE ON public.bar_tabs
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_user_bar_tabs_updated_at
  BEFORE UPDATE ON public.user_bar_tabs
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();