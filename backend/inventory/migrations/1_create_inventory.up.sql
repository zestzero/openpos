CREATE TABLE inventory_ledger (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  variant_id UUID NOT NULL,
  delta INTEGER NOT NULL,
  type VARCHAR(20) NOT NULL CHECK (type IN ('sale', 'restock', 'adjustment', 'sync')),
  reference_id UUID,
  reason TEXT,
  client_generated_id UUID UNIQUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_ledger_variant_id ON inventory_ledger(variant_id);
CREATE INDEX idx_ledger_created_at ON inventory_ledger(created_at);

CREATE TABLE inventory_snapshots (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  variant_id UUID NOT NULL,
  balance INTEGER NOT NULL DEFAULT 0,
  snapshot_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_snapshots_variant_id ON inventory_snapshots(variant_id);
