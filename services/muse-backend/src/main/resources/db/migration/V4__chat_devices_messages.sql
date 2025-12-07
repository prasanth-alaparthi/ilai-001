-- devices table (public keys only)
CREATE TABLE IF NOT EXISTS devices (
  id BIGSERIAL PRIMARY KEY,
  user_id BIGINT NOT NULL,
  device_id VARCHAR(128) NOT NULL,
  device_name VARCHAR(255),
  identity_key TEXT NOT NULL,
  signed_prekey TEXT,
  signed_prekey_signature TEXT,
  prekeys JSONB,
  last_seen TIMESTAMP,
  created_at TIMESTAMP DEFAULT now(),
  CONSTRAINT uq_user_device UNIQUE (user_id, device_id)
);

CREATE INDEX IF NOT EXISTS idx_devices_user ON devices(user_id);

-- messages table (ciphertext only)
CREATE TABLE IF NOT EXISTS messages (
  id BIGSERIAL PRIMARY KEY,
  conversation_id BIGINT,
  sender_user_id BIGINT,
  sender_device_id VARCHAR(128),
  ciphertext BYTEA NOT NULL,
  ciphertext_version VARCHAR(64) NOT NULL,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP DEFAULT now(),
  delivered_to JSONB DEFAULT '[]'::jsonb,
  read_by JSONB DEFAULT '[]'::jsonb
);

CREATE INDEX IF NOT EXISTS idx_messages_conv ON messages(conversation_id, created_at DESC);