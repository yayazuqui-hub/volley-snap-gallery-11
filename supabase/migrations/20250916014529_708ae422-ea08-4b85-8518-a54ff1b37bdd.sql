-- Add price field to photos table
ALTER TABLE public.photos 
ADD COLUMN price DECIMAL(10,2) DEFAULT 0.00 NOT NULL;

-- Add comment for clarity
COMMENT ON COLUMN public.photos.price IS 'Price in BRL (Brazilian Real) for purchasing this photo';

-- Create payments table to track Mercado Pago transactions
CREATE TABLE public.payments (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  photo_ids UUID[] NOT NULL,
  total_amount DECIMAL(10,2) NOT NULL,
  mercado_pago_payment_id TEXT,
  mercado_pago_preference_id TEXT,
  status TEXT NOT NULL DEFAULT 'pending',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  approved_at TIMESTAMP WITH TIME ZONE,
  CONSTRAINT payments_status_check CHECK (status IN ('pending', 'approved', 'rejected', 'cancelled'))
);

-- Enable RLS on payments table
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;

-- Create policies for payments
CREATE POLICY "Users can view their own payments" 
ON public.payments 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own payments" 
ON public.payments 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admin can manage all payments" 
ON public.payments 
FOR ALL 
USING (EXISTS (
  SELECT 1 FROM profiles 
  WHERE profiles.user_id = auth.uid() AND profiles.approved = true
));

-- Create trigger for updating payments updated_at
CREATE TRIGGER update_payments_updated_at
BEFORE UPDATE ON public.payments
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create photo_purchases table to track individual photo purchases
CREATE TABLE public.photo_purchases (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  payment_id UUID NOT NULL REFERENCES public.payments(id) ON DELETE CASCADE,
  photo_id UUID NOT NULL REFERENCES public.photos(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  purchased_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  UNIQUE (user_id, photo_id)
);

-- Enable RLS on photo_purchases table
ALTER TABLE public.photo_purchases ENABLE ROW LEVEL SECURITY;

-- Create policies for photo_purchases
CREATE POLICY "Users can view their own purchases" 
ON public.photo_purchases 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own purchases" 
ON public.photo_purchases 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admin can manage all purchases" 
ON public.photo_purchases 
FOR ALL 
USING (EXISTS (
  SELECT 1 FROM profiles 
  WHERE profiles.user_id = auth.uid() AND profiles.approved = true
));