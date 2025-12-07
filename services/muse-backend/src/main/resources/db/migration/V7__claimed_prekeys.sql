-- V5__claimed_prekeys.sql
CREATE TABLE IF NOT EXISTS claimed_prekeys (
  id BIGSERIAL PRIMARY KEY,
  target_user_id BIGINT NOT NULL,
  target_device_id VARCHAR(128) NOT NULL,
  key_id BIGINT NOT NULL,
  public_key TEXT NOT NULL,
  claimed_by_user_id BIGINT NOT NULL,
  claimed_at TIMESTAMP DEFAULT now(),
  consumed BOOLEAN DEFAULT FALSE,
  consumed_at TIMESTAMP NULL,
  reclaimed BOOLEAN DEFAULT FALSE,
  reclaimed_at TIMESTAMP NULL
);

CREATE INDEX IF NOT EXISTS idx_claimed_prekeys_target ON claimed_prekeys(target_user_id, target_device_id);
CREATE INDEX IF NOT EXISTS idx_claimed_prekeys_claimed_at ON claimed_prekeys(claimed_at);

CREATE TABLE IF NOT EXISTS prekey_claim_audit (
  id BIGSERIAL PRIMARY KEY,
  claimed_prekey_id BIGINT NOT NULL,
  action VARCHAR(32) NOT NULL, -- "CLAIM","CONSUME","RECLAIM"
  actor_user_id BIGINT,
  created_at TIMESTAMP DEFAULT now(),
  details JSONB DEFAULT '{}'
);
