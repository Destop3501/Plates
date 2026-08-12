-- ==============================================================================
-- PLATES DATABASE SCHEMA & RLS POLICIES
-- PostgreSQL / Supabase Migration Script
-- ==============================================================================

-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ==============================================================================
-- 1. TABLES DEFINITION
-- ==============================================================================

-- 1.1 PROFILES / USERS (Extends Supabase auth.users)
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT UNIQUE NOT NULL,
    full_name TEXT,
    avatar_url TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 1.2 FRIENDSHIPS TABLE
CREATE TABLE IF NOT EXISTS public.friendships (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id_1 UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    user_id_2 UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    status TEXT NOT NULL CHECK (status IN ('pending', 'accepted', 'rejected', 'blocked')) DEFAULT 'pending',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT prevent_self_friendship CHECK (user_id_1 <> user_id_2),
    CONSTRAINT unique_friendship UNIQUE (user_id_1, user_id_2)
);

-- 1.3 DEBTS / TRANSACTIONS TABLE
CREATE TABLE IF NOT EXISTS public.debts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    payer_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    payee_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    amount NUMERIC(10, 2) NOT NULL CHECK (amount > 0),
    description TEXT NOT NULL,
    category TEXT NOT NULL CHECK (category IN ('restaurant', 'shop', 'groceries', 'entertainment', 'utilities', 'other')) DEFAULT 'other',
    restaurant_id UUID REFERENCES public.restaurants(id) ON DELETE SET NULL,
    items JSONB DEFAULT '[]'::jsonb,
    status TEXT NOT NULL CHECK (status IN ('pending', 'settled', 'cancelled')) DEFAULT 'pending',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT prevent_self_debt CHECK (payer_id <> payee_id)
);

-- 1.4 RESTAURANTS TABLE
CREATE TABLE IF NOT EXISTS public.restaurants (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    location TEXT,
    description TEXT,
    image_url TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 1.5 FOODS / MENU ITEMS TABLE
CREATE TABLE IF NOT EXISTS public.foods (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    restaurant_id UUID NOT NULL REFERENCES public.restaurants(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    price NUMERIC(10, 2) NOT NULL CHECK (price >= 0),
    description TEXT,
    image_url TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ==============================================================================
-- 2. AUTOMATIC PROFILE SYNC TRIGGER (auth.users -> public.profiles)
-- ==============================================================================

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.profiles (id, email, full_name, avatar_url)
    VALUES (
        NEW.id,
        NEW.email,
        COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name', ''),
        COALESCE(NEW.raw_user_meta_data->>'avatar_url', NEW.raw_user_meta_data->>'picture', '')
    )
    ON CONFLICT (id) DO UPDATE SET
        email = EXCLUDED.email,
        full_name = EXCLUDED.full_name,
        avatar_url = EXCLUDED.avatar_url,
        updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger execution
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Backfill any existing users into public.profiles
INSERT INTO public.profiles (id, email, full_name, avatar_url)
SELECT 
    id, 
    email, 
    COALESCE(raw_user_meta_data->>'full_name', raw_user_meta_data->>'name', ''),
    COALESCE(raw_user_meta_data->>'avatar_url', raw_user_meta_data->>'picture', '')
FROM auth.users
ON CONFLICT (id) DO UPDATE SET
    email = EXCLUDED.email,
    full_name = EXCLUDED.full_name,
    avatar_url = EXCLUDED.avatar_url;

-- ==============================================================================
-- 3. INDEXES FOR OPTIMAL QUERY PERFORMANCE
-- ==============================================================================

CREATE INDEX IF NOT EXISTS idx_friendships_user1 ON public.friendships(user_id_1);
CREATE INDEX IF NOT EXISTS idx_friendships_user2 ON public.friendships(user_id_2);
CREATE INDEX IF NOT EXISTS idx_friendships_status ON public.friendships(status);

CREATE INDEX IF NOT EXISTS idx_debts_payer ON public.debts(payer_id);
CREATE INDEX IF NOT EXISTS idx_debts_payee ON public.debts(payee_id);
CREATE INDEX IF NOT EXISTS idx_debts_status ON public.debts(status);

CREATE INDEX IF NOT EXISTS idx_foods_restaurant ON public.foods(restaurant_id);

-- ==============================================================================
-- 4. ROW LEVEL SECURITY (RLS) POLICIES
-- ==============================================================================

-- Enable RLS on all tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.friendships ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.debts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.restaurants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.foods ENABLE ROW LEVEL SECURITY;

-- ------------------------------------------------------------------------------
-- 4.1 PROFILES POLICIES
-- ------------------------------------------------------------------------------
DROP POLICY IF EXISTS "Users can view self and friends profiles" ON public.profiles;
CREATE POLICY "Users can view self and friends profiles"
ON public.profiles FOR SELECT
TO authenticated
USING (
    auth.uid() = id
    OR EXISTS (
        SELECT 1 FROM public.friendships f
        WHERE f.status = 'accepted'
          AND ((f.user_id_1 = auth.uid() AND f.user_id_2 = profiles.id)
            OR (f.user_id_2 = auth.uid() AND f.user_id_1 = profiles.id))
    )
);

DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
CREATE POLICY "Users can update own profile"
ON public.profiles FOR UPDATE
TO authenticated
USING (auth.uid() = id)
WITH CHECK (auth.uid() = id);

-- ------------------------------------------------------------------------------
-- 4.2 FRIENDSHIPS POLICIES
-- ------------------------------------------------------------------------------
DROP POLICY IF EXISTS "Users can view their friendships" ON public.friendships;
CREATE POLICY "Users can view their friendships"
ON public.friendships FOR SELECT
TO authenticated
USING (auth.uid() = user_id_1 OR auth.uid() = user_id_2);

DROP POLICY IF EXISTS "Users can create friend requests" ON public.friendships;
CREATE POLICY "Users can create friend requests"
ON public.friendships FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id_1);

DROP POLICY IF EXISTS "Users can update their friendships" ON public.friendships;
CREATE POLICY "Users can update their friendships"
ON public.friendships FOR UPDATE
TO authenticated
USING (auth.uid() = user_id_1 OR auth.uid() = user_id_2)
WITH CHECK (auth.uid() = user_id_1 OR auth.uid() = user_id_2);

DROP POLICY IF EXISTS "Users can delete their friendships" ON public.friendships;
CREATE POLICY "Users can delete their friendships"
ON public.friendships FOR DELETE
TO authenticated
USING (auth.uid() = user_id_1 OR auth.uid() = user_id_2);

-- ------------------------------------------------------------------------------
-- 4.3 DEBTS / TRANSACTIONS POLICIES
-- ------------------------------------------------------------------------------
DROP POLICY IF EXISTS "Users can view their debts" ON public.debts;
CREATE POLICY "Users can view their debts"
ON public.debts FOR SELECT
TO authenticated
USING (auth.uid() = payer_id OR auth.uid() = payee_id);

DROP POLICY IF EXISTS "Users can create debts" ON public.debts;
CREATE POLICY "Users can create debts"
ON public.debts FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = payer_id OR auth.uid() = payee_id);

DROP POLICY IF EXISTS "Users can update their debts" ON public.debts;
CREATE POLICY "Users can update their debts"
ON public.debts FOR UPDATE
TO authenticated
USING (auth.uid() = payer_id OR auth.uid() = payee_id)
WITH CHECK (auth.uid() = payer_id OR auth.uid() = payee_id);

-- ------------------------------------------------------------------------------
-- 4.4 RESTAURANTS & FOODS POLICIES
-- ------------------------------------------------------------------------------
DROP POLICY IF EXISTS "Anyone authenticated can view restaurants" ON public.restaurants;
CREATE POLICY "Anyone authenticated can view restaurants"
ON public.restaurants FOR SELECT
TO authenticated
USING (true);

DROP POLICY IF EXISTS "Anyone authenticated can view foods" ON public.foods;
CREATE POLICY "Anyone authenticated can view foods"
ON public.foods FOR SELECT
TO authenticated
USING (true);

-- Note: INSERT/UPDATE/DELETE on restaurants and foods are restricted to service role / admin.
