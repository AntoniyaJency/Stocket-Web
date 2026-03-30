/*
  # Automated Trading System Database Schema

  1. New Tables
    - `trading_bots`
      - `id` (uuid, primary key) - Unique bot identifier
      - `user_id` (uuid) - Owner of the bot
      - `name` (text) - Bot name
      - `symbol` (text) - Trading symbol
      - `status` (text) - Bot status (active, paused, stopped)
      - `strategy` (text) - Trading strategy type
      - `config` (jsonb) - Bot configuration
      - `created_at` (timestamptz) - Creation timestamp
      - `updated_at` (timestamptz) - Last update timestamp
    
    - `bot_trades`
      - `id` (uuid, primary key) - Trade identifier
      - `bot_id` (uuid) - Associated bot
      - `symbol` (text) - Trading symbol
      - `type` (text) - BUY or SELL
      - `quantity` (numeric) - Trade quantity
      - `price` (numeric) - Execution price
      - `profit` (numeric) - Profit/loss amount
      - `status` (text) - Trade status
      - `executed_at` (timestamptz) - Execution time
    
    - `bot_signals`
      - `id` (uuid, primary key) - Signal identifier
      - `bot_id` (uuid) - Associated bot
      - `symbol` (text) - Trading symbol
      - `type` (text) - Signal type
      - `confidence` (numeric) - Signal confidence
      - `reason` (text) - Signal reason
      - `price` (numeric) - Price at signal
      - `created_at` (timestamptz) - Signal generation time
    
    - `bot_performance`
      - `id` (uuid, primary key) - Performance record ID
      - `bot_id` (uuid) - Associated bot
      - `total_trades` (integer) - Total trades executed
      - `winning_trades` (integer) - Successful trades
      - `total_profit` (numeric) - Total profit/loss
      - `win_rate` (numeric) - Win percentage
      - `recorded_at` (timestamptz) - Performance snapshot time

  2. Security
    - Enable RLS on all tables
    - Add policies for authenticated users to manage their own bots
    - Restrict access to user's own trading data only
*/

-- Create trading_bots table
CREATE TABLE IF NOT EXISTS trading_bots (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  name text NOT NULL,
  symbol text NOT NULL,
  status text NOT NULL DEFAULT 'stopped',
  strategy text NOT NULL DEFAULT 'RSI',
  config jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create bot_trades table
CREATE TABLE IF NOT EXISTS bot_trades (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  bot_id uuid NOT NULL REFERENCES trading_bots(id) ON DELETE CASCADE,
  symbol text NOT NULL,
  type text NOT NULL,
  quantity numeric NOT NULL,
  price numeric NOT NULL,
  profit numeric DEFAULT 0,
  status text NOT NULL DEFAULT 'CLOSED',
  executed_at timestamptz DEFAULT now()
);

-- Create bot_signals table
CREATE TABLE IF NOT EXISTS bot_signals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  bot_id uuid NOT NULL REFERENCES trading_bots(id) ON DELETE CASCADE,
  symbol text NOT NULL,
  type text NOT NULL,
  confidence numeric NOT NULL,
  reason text NOT NULL,
  price numeric NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- Create bot_performance table
CREATE TABLE IF NOT EXISTS bot_performance (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  bot_id uuid NOT NULL REFERENCES trading_bots(id) ON DELETE CASCADE,
  total_trades integer DEFAULT 0,
  winning_trades integer DEFAULT 0,
  total_profit numeric DEFAULT 0,
  win_rate numeric DEFAULT 0,
  recorded_at timestamptz DEFAULT now()
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_trading_bots_user_id ON trading_bots(user_id);
CREATE INDEX IF NOT EXISTS idx_trading_bots_status ON trading_bots(status);
CREATE INDEX IF NOT EXISTS idx_bot_trades_bot_id ON bot_trades(bot_id);
CREATE INDEX IF NOT EXISTS idx_bot_trades_executed_at ON bot_trades(executed_at);
CREATE INDEX IF NOT EXISTS idx_bot_signals_bot_id ON bot_signals(bot_id);
CREATE INDEX IF NOT EXISTS idx_bot_performance_bot_id ON bot_performance(bot_id);

-- Enable Row Level Security
ALTER TABLE trading_bots ENABLE ROW LEVEL SECURITY;
ALTER TABLE bot_trades ENABLE ROW LEVEL SECURITY;
ALTER TABLE bot_signals ENABLE ROW LEVEL SECURITY;
ALTER TABLE bot_performance ENABLE ROW LEVEL SECURITY;

-- Policies for trading_bots
CREATE POLICY "Users can view own bots"
  ON trading_bots FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create own bots"
  ON trading_bots FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own bots"
  ON trading_bots FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own bots"
  ON trading_bots FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Policies for bot_trades
CREATE POLICY "Users can view own bot trades"
  ON bot_trades FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM trading_bots
      WHERE trading_bots.id = bot_trades.bot_id
      AND trading_bots.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can create trades for own bots"
  ON bot_trades FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM trading_bots
      WHERE trading_bots.id = bot_trades.bot_id
      AND trading_bots.user_id = auth.uid()
    )
  );

-- Policies for bot_signals
CREATE POLICY "Users can view own bot signals"
  ON bot_signals FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM trading_bots
      WHERE trading_bots.id = bot_signals.bot_id
      AND trading_bots.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can create signals for own bots"
  ON bot_signals FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM trading_bots
      WHERE trading_bots.id = bot_signals.bot_id
      AND trading_bots.user_id = auth.uid()
    )
  );

-- Policies for bot_performance
CREATE POLICY "Users can view own bot performance"
  ON bot_performance FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM trading_bots
      WHERE trading_bots.id = bot_performance.bot_id
      AND trading_bots.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can create performance records for own bots"
  ON bot_performance FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM trading_bots
      WHERE trading_bots.id = bot_performance.bot_id
      AND trading_bots.user_id = auth.uid()
    )
  );

-- Update timestamp function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to auto-update updated_at
CREATE TRIGGER update_trading_bots_updated_at
  BEFORE UPDATE ON trading_bots
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();