-- Fix Edge Function RLS Permissions
-- These commands allow the service role to bypass RLS for Edge Function operations

-- Grant service role the ability to bypass RLS on conversations table
ALTER TABLE conversations ENABLE ROW LEVEL SECURITY;
GRANT ALL ON conversations TO service_role;

-- Grant service role the ability to bypass RLS on business_whatsapp_numbers table  
ALTER TABLE business_whatsapp_numbers ENABLE ROW LEVEL SECURITY;
GRANT ALL ON business_whatsapp_numbers TO service_role;

-- Grant service role the ability to bypass RLS on message_templates_cache table
ALTER TABLE message_templates_cache ENABLE ROW LEVEL SECURITY;
GRANT ALL ON message_templates_cache TO service_role;

-- Ensure service role can execute the insert_message RPC
GRANT EXECUTE ON FUNCTION insert_message TO service_role;

-- Verify the grants
SELECT 
    tablename, 
    grantee, 
    privilege_type 
FROM information_schema.table_privileges 
WHERE grantee = 'service_role' 
    AND tablename IN ('conversations', 'business_whatsapp_numbers', 'message_templates_cache');

-- Note: The service_role should automatically bypass RLS, but these explicit grants ensure access 