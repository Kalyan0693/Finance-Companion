-- Profiles
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT,
  full_name TEXT,
  avatar_url TEXT,
  currency_code TEXT NOT NULL DEFAULT 'USD',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "profiles_select_own" ON public.profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "profiles_update_own" ON public.profiles FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "profiles_insert_own" ON public.profiles FOR INSERT WITH CHECK (auth.uid() = id);

-- Groups
CREATE TABLE public.groups (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  type TEXT NOT NULL DEFAULT 'household',
  owner_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  invite_code TEXT UNIQUE NOT NULL DEFAULT encode(gen_random_bytes(6), 'hex'),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.groups ENABLE ROW LEVEL SECURITY;

-- Group members
CREATE TABLE public.group_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id UUID NOT NULL REFERENCES public.groups(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role TEXT NOT NULL DEFAULT 'member',
  joined_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (group_id, user_id)
);
ALTER TABLE public.group_members ENABLE ROW LEVEL SECURITY;

-- Security definer helper: is user member of group?
CREATE OR REPLACE FUNCTION public.is_group_member(_group_id UUID, _user_id UUID)
RETURNS BOOLEAN LANGUAGE SQL STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.group_members WHERE group_id = _group_id AND user_id = _user_id
  ) OR EXISTS (
    SELECT 1 FROM public.groups WHERE id = _group_id AND owner_id = _user_id
  );
$$;

CREATE OR REPLACE FUNCTION public.is_group_owner(_group_id UUID, _user_id UUID)
RETURNS BOOLEAN LANGUAGE SQL STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.groups WHERE id = _group_id AND owner_id = _user_id);
$$;

-- Groups policies
CREATE POLICY "groups_select_visible" ON public.groups FOR SELECT USING (
  owner_id = auth.uid() OR public.is_group_member(id, auth.uid())
);
CREATE POLICY "groups_insert_own" ON public.groups FOR INSERT WITH CHECK (owner_id = auth.uid());
CREATE POLICY "groups_update_owner" ON public.groups FOR UPDATE USING (owner_id = auth.uid());
CREATE POLICY "groups_delete_owner" ON public.groups FOR DELETE USING (owner_id = auth.uid());

-- Group members policies
CREATE POLICY "gm_select_member" ON public.group_members FOR SELECT USING (
  user_id = auth.uid() OR public.is_group_owner(group_id, auth.uid())
);
CREATE POLICY "gm_insert_owner_or_self" ON public.group_members FOR INSERT WITH CHECK (
  public.is_group_owner(group_id, auth.uid()) OR user_id = auth.uid()
);
CREATE POLICY "gm_delete_owner_or_self" ON public.group_members FOR DELETE USING (
  public.is_group_owner(group_id, auth.uid()) OR user_id = auth.uid()
);

-- Buckets
CREATE TABLE public.buckets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  group_id UUID REFERENCES public.groups(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  icon TEXT,
  color_hex TEXT NOT NULL DEFAULT '#0d7a5f',
  monthly_budget NUMERIC(14,2) NOT NULL DEFAULT 0,
  is_shared BOOLEAN NOT NULL DEFAULT false,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.buckets ENABLE ROW LEVEL SECURITY;
CREATE POLICY "buckets_select" ON public.buckets FOR SELECT USING (
  owner_id = auth.uid() OR (group_id IS NOT NULL AND public.is_group_member(group_id, auth.uid()))
);
CREATE POLICY "buckets_insert" ON public.buckets FOR INSERT WITH CHECK (owner_id = auth.uid());
CREATE POLICY "buckets_update" ON public.buckets FOR UPDATE USING (owner_id = auth.uid());
CREATE POLICY "buckets_delete" ON public.buckets FOR DELETE USING (owner_id = auth.uid());

-- Recurring rules
CREATE TABLE public.recurring_rules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  bucket_id UUID REFERENCES public.buckets(id) ON DELETE SET NULL,
  group_id UUID REFERENCES public.groups(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  amount NUMERIC(14,2) NOT NULL,
  frequency TEXT NOT NULL DEFAULT 'monthly',
  start_date DATE NOT NULL DEFAULT CURRENT_DATE,
  end_date DATE,
  next_run_date DATE NOT NULL DEFAULT CURRENT_DATE,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.recurring_rules ENABLE ROW LEVEL SECURITY;
CREATE POLICY "rr_select" ON public.recurring_rules FOR SELECT USING (
  user_id = auth.uid() OR (group_id IS NOT NULL AND public.is_group_member(group_id, auth.uid()))
);
CREATE POLICY "rr_insert" ON public.recurring_rules FOR INSERT WITH CHECK (user_id = auth.uid());
CREATE POLICY "rr_update" ON public.recurring_rules FOR UPDATE USING (user_id = auth.uid());
CREATE POLICY "rr_delete" ON public.recurring_rules FOR DELETE USING (user_id = auth.uid());

-- Transactions
CREATE TABLE public.transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  bucket_id UUID REFERENCES public.buckets(id) ON DELETE SET NULL,
  group_id UUID REFERENCES public.groups(id) ON DELETE CASCADE,
  amount NUMERIC(14,2) NOT NULL,
  currency_code TEXT NOT NULL DEFAULT 'USD',
  description TEXT NOT NULL,
  notes TEXT,
  transaction_date DATE NOT NULL DEFAULT CURRENT_DATE,
  type TEXT NOT NULL DEFAULT 'expense',
  recurring_rule_id UUID REFERENCES public.recurring_rules(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "tx_select" ON public.transactions FOR SELECT USING (
  user_id = auth.uid() OR (group_id IS NOT NULL AND public.is_group_member(group_id, auth.uid()))
);
CREATE POLICY "tx_insert" ON public.transactions FOR INSERT WITH CHECK (user_id = auth.uid());
CREATE POLICY "tx_update" ON public.transactions FOR UPDATE USING (user_id = auth.uid());
CREATE POLICY "tx_delete" ON public.transactions FOR DELETE USING (user_id = auth.uid());

CREATE INDEX idx_tx_user_date ON public.transactions(user_id, transaction_date DESC);
CREATE INDEX idx_tx_group_date ON public.transactions(group_id, transaction_date DESC) WHERE group_id IS NOT NULL;
CREATE INDEX idx_tx_bucket ON public.transactions(bucket_id);

-- Invitations
CREATE TABLE public.invitations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id UUID NOT NULL REFERENCES public.groups(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  token TEXT UNIQUE NOT NULL DEFAULT encode(gen_random_bytes(16), 'hex'),
  status TEXT NOT NULL DEFAULT 'pending',
  invited_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  expires_at TIMESTAMPTZ NOT NULL DEFAULT (now() + INTERVAL '14 days'),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.invitations ENABLE ROW LEVEL SECURITY;
CREATE POLICY "inv_select_owner_or_invitee" ON public.invitations FOR SELECT USING (
  public.is_group_owner(group_id, auth.uid())
  OR email = (SELECT email FROM auth.users WHERE id = auth.uid())
);
CREATE POLICY "inv_insert_owner" ON public.invitations FOR INSERT WITH CHECK (
  public.is_group_owner(group_id, auth.uid()) AND invited_by = auth.uid()
);
CREATE POLICY "inv_update_invitee" ON public.invitations FOR UPDATE USING (
  email = (SELECT email FROM auth.users WHERE id = auth.uid())
  OR public.is_group_owner(group_id, auth.uid())
);
CREATE POLICY "inv_delete_owner" ON public.invitations FOR DELETE USING (
  public.is_group_owner(group_id, auth.uid())
);

-- Profile auto-create trigger
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name)
  VALUES (NEW.id, NEW.email, COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email));
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- updated_at trigger
CREATE OR REPLACE FUNCTION public.touch_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END;
$$;

CREATE TRIGGER tx_touch BEFORE UPDATE ON public.transactions FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();
CREATE TRIGGER profiles_touch BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();