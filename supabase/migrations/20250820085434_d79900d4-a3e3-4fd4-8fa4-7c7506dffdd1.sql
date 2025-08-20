-- Add vip_price column to productions table
ALTER TABLE productions ADD COLUMN vip_price NUMERIC;

-- Clean up duplicate QR codes - keep only the latest one per user per party
DELETE FROM qr_codes 
WHERE id NOT IN (
  SELECT DISTINCT ON (user_id, party_id) id 
  FROM qr_codes 
  ORDER BY user_id, party_id, created_at DESC
);