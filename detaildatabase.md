# **Supabase Database Specification for WhatsApp Cloud API Front-End**

Version: 1.17  
Date: May 30, 2025

## **1\. Overview**

This document outlines the Supabase database schema, functions, storage, security policies, and optimization strategies required for the WhatsApp Cloud API Front-End application. The application leverages an existing Supabase project, extending it with new tables and functions while utilizing some existing resources. This version details a generalized message insertion mechanism, updated role definitions, and incorporates clarifications regarding admin interactions and RLS policies.

## **2\. Existing Tables Utilized**

These tables are pre-existing in the Supabase project. This application will interact with them as described. The standard ENUM type for all segment fields is public.segment\_type.

### **2.1. profile**

Stores user information for authentication and application-specific roles/attributes.

* id (UUID, PK, references auth.users.id): User's unique identifier.  
* email (TEXT, nullable): User's email address.  
* first\_name (TEXT, nullable): User's first name. (A system user may be seeded with first\_name \= 'System').  
* last\_name (TEXT, nullable): User's last name.  
* role (public.user\_role ENUM: 'admin', 'team\_leader', 'agent', 'backend', 'system', 'chatbot'): Role of the user. This is the source of truth for roles. JWTs issued upon login should have an app\_metadata.role claim populated from this field.  
* segment (public.segment\_type ENUM: 'PL', 'BL', 'PL\_Digital', 'BL\_Digital', nullable): Business segment the user belongs to.  
* is\_active (BOOLEAN, default TRUE): Whether the user account is active.  
* present\_today (BOOLEAN, default FALSE): Indicates if the user has logged in today. Logic handled by app login and reset\_present\_today() procedure.  
* last\_chat\_assigned\_at (TIMESTAMPTZ, nullable): Timestamp of when a chat was last assigned to this user.  
* created\_at (TIMESTAMPTZ, default now()): Timestamp of profile creation.  
* updated\_at (TIMESTAMPTZ, default now()): Timestamp of last profile update.  
  (A "System" user profile is typically seeded into this table, e.g., with a predefined UUID, first\_name \= 'System', and role \= 'system'. Its UUID is used as the SYSTEM\_USER\_ID environment variable for Edge Functions.)

### **2.2. leads**

Stores lead and contact information.

* id (UUID, PK): Lead's unique identifier.  
* mobile\_number (VARCHAR, UNIQUE, NOT NULL): Lead's 10-digit mobile number (without country code).  
* first\_name (TEXT): Lead's first name.  
* last\_name (TEXT, nullable): Lead's last name.  
* segment (public.segment\_type, nullable): Segment of the lead.  
* lead\_owner (UUID, FK to public.profile(id), nullable): The user ID of the agent/team leader assigned to this lead.

### **2.3. team**

Defines teams within the organization.

* id (UUID, PK, default gen\_random\_uuid()): Team's unique identifier.  
* name (TEXT, NOT NULL): Name of the team.  
* created\_at (TIMESTAMPTZ, default now(), nullable): Timestamp of team creation.  
* updated\_at (TIMESTAMPTZ, default now(), nullable): Timestamp of last team update.

### **2.4. team\_members**

Links users from the profile table to teams in the team table.

* id (UUID, PK, default gen\_random\_uuid()): Unique identifier for the membership.  
* user\_id (UUID, NOT NULL, FK to public.profile(id)): User's unique identifier.  
* team\_id (UUID, NOT NULL, FK to public.team(id)): Team's unique identifier.  
* created\_at (TIMESTAMPTZ, default now(), nullable): Timestamp of membership creation.

## **3\. New Tables to be Created**

### **3.1. business\_whatsapp\_numbers**

Stores details of the business's WhatsApp numbers. CRUD operations by admins are performed directly from the frontend via the Supabase client, secured by RLS.

* id (UUID, PK, default gen\_random\_uuid())  
* waba\_phone\_number\_id (TEXT, UNIQUE, NOT NULL): Unique Phone Number ID from Meta.  
* display\_number (TEXT, NOT NULL): The WhatsApp number string.  
* segment (public.segment\_type, NOT NULL): Business segment.  
* friendly\_name (TEXT, nullable): User-friendly name.  
* chatbot\_identifier (TEXT, NOT NULL, all lowercase): Identifier for AI chatbot logic (e.g., "bot:marketing\_v1").  
* chatbot\_endpoint\_url (TEXT, nullable): HTTP endpoint URL for chatbot. If NULL/blank, no AI chatbot is assigned.  
* is\_active (BOOLEAN, default TRUE, NOT NULL): Whether this number is active.  
* access\_token (TEXT, nullable): WhatsApp Cloud API System User Access Token. Store securely.  
* current\_mps\_target (NUMERIC, nullable, default 10.0): Current messages-per-second target for bulk sends.  
* mps\_target\_updated\_at (TIMESTAMPTZ, nullable): Timestamp of when current\_mps\_target was last updated.  
* is\_rate\_capped\_today (BOOLEAN, default FALSE, NOT NULL): Flag if bulk send rate was capped today.  
* created\_at (TIMESTAMPTZ, default now())  
* updated\_at (TIMESTAMPTZ, default now())

### **3.2. conversations**

Stores information about each chat session/thread.

* id (UUID, PK, default gen\_random\_uuid())  
* lead\_id (UUID, FK to public.leads(id), nullable)  
* contact\_e164\_phone (TEXT, NOT NULL): Customer's phone number in E.164 format.  
* business\_whatsapp\_number\_id (UUID, FK to public.business\_whatsapp\_numbers(id), NOT NULL)  
* segment (public.segment\_type, NOT NULL): Segment of this conversation.  
* assigned\_agent\_id (UUID, FK to public.profile(id), nullable)  
* is\_chatbot\_active (BOOLEAN, NOT NULL): Controlled by system logic and agent actions.  
* status (public.conversation\_status\_enum ('open', 'closed'), default 'open', NOT NULL)  
* version (INTEGER, NOT NULL, DEFAULT 1): For optimistic locking.  
* last\_message\_at (TIMESTAMPTZ, nullable)  
* last\_customer\_message\_at (TIMESTAMPTZ, nullable)  
* tags (TEXT\[\], nullable, default '{}')  
* created\_at (TIMESTAMPTZ, default now())  
* updated\_at (TIMESTAMPTZ, default now())  
* **Constraint:** uq\_conversation\_lead\_bwn UNIQUE (lead\_id, business\_whatsapp\_number\_id)

### **3.3. messages (Time-partitioned by month)**

Stores all individual messages.

* id (UUID, PK, default gen\_random\_uuid())  
* conversation\_id (UUID, FK to public.conversations(id), NOT NULL)  
* whatsapp\_message\_id (TEXT, nullable): Message ID from WhatsApp. Nullable to accommodate system messages not originating from WhatsApp, or messages logged before a WA ID is known.  
* sender\_type (public.message\_sender\_type\_enum ('customer', 'agent', 'chatbot', 'system'), NOT NULL)  
* sender\_id (TEXT, NOT NULL): Identifier of the sender (e.g., User UUID for agents, chatbot\_identifier for chatbots, System User UUID for system).  
* content\_type (public.message\_content\_type\_enum ('text', 'image', 'document', 'template', 'system\_notification', 'audio', 'video', 'sticker', 'location', 'contacts', 'interactive', 'button', 'order', 'unknown'), NOT NULL)  
* text\_content (TEXT, nullable)  
* media\_url (TEXT, nullable): Public URL for agent/chatbot/template-header sent media.  
* customer\_media\_whatsapp\_id (TEXT, nullable): Media ID from WhatsApp for customer media.  
* customer\_media\_mime\_type (TEXT, nullable)  
* customer\_media\_filename (TEXT, nullable)  
* template\_name\_used (TEXT, nullable)  
* template\_variables\_used (JSONB, nullable)  
* timestamp (TIMESTAMPTZ, NOT NULL) (Partition Key)  
* status (public.message\_delivery\_status\_enum ('sending', 'sent', 'delivered', 'read', 'failed', 'received'), NOT NULL)  
* error\_message (TEXT, nullable)  
* **Constraint (on parent table, propagated to partitions):** idx\_messages\_waid\_ts\_unique UNIQUE (timestamp, whatsapp\_message\_id) WHERE whatsapp\_message\_id IS NOT NULL.

### **3.4. message\_templates\_cache**

Stores a local cache of approved WhatsApp message templates.

* id (UUID, PK, default gen\_random\_uuid())  
* waba\_id (TEXT, NOT NULL): WhatsApp Business Account ID.  
* name (TEXT, NOT NULL)  
* language (TEXT, NOT NULL): Language code.  
* category (TEXT, NOT NULL): Template category.  
* components\_json (JSONB, NOT NULL): JSON structure of template components.  
* status\_from\_whatsapp (TEXT, NOT NULL): Status from WhatsApp.  
* last\_synced\_at (TIMESTAMPTZ, default now())  
* **Constraint:** uq\_msg\_templates\_waba\_name\_lang UNIQUE (waba\_id, name, language)

### **3.5. bulk\_sends**

Logs bulk messaging campaigns.

* id (UUID, PK, default gen\_random\_uuid())  
* campaign\_name (TEXT, nullable)  
* admin\_user\_id (UUID, FK to public.profile(id), NOT NULL): The admin who initiated the campaign.  
* template\_id (UUID, FK to public.message\_templates\_cache(id), NOT NULL)  
* business\_whatsapp\_number\_id (UUID, FK to public.business\_whatsapp\_numbers(id), NOT NULL)  
* csv\_file\_name (TEXT, nullable)  
* total\_recipients (INTEGER, NOT NULL)  
* status (public.bulk\_send\_status\_enum ('queued', 'processing', 'completed', 'failed'), NOT NULL)  
* created\_at (TIMESTAMPTZ, default now())  
* completed\_at (TIMESTAMPTZ, nullable)

### **3.6. bulk\_send\_details**

Logs status for each recipient in a bulk send.

* id (UUID, PK, default gen\_random\_uuid())  
* bulk\_send\_id (UUID, FK to public.bulk\_sends(id), NOT NULL)  
* mobile\_number\_e164 (TEXT, NOT NULL)  
* status (public.bulk\_send\_detail\_status\_enum ('sent', 'failed', 'skipped'), NOT NULL)  
* whatsapp\_message\_id (TEXT, nullable)  
* failure\_reason (TEXT, nullable)  
* **Constraint:** uq\_bulk\_send\_recipient UNIQUE (bulk\_send\_id, mobile\_number\_e164)

### **3.7. message\_queue**

Stores individual messages for bulk campaigns pending processing.

* id (UUID, PK, default gen\_random\_uuid())  
* bulk\_send\_id (UUID, FK to public.bulk\_sends(id), NOT NULL)  
* recipient\_e164\_phone (TEXT, NOT NULL)  
* template\_variables\_used (JSONB, nullable)  
* image\_url (TEXT, nullable): Header image URL for the template message.  
* status (public.message\_queue\_status\_enum ('pending', 'processing', 'retry\_queued'), NOT NULL)  
* attempt\_count (INTEGER, default 0, NOT NULL)  
* last\_attempt\_at (TIMESTAMPTZ, nullable)  
* next\_attempt\_at (TIMESTAMPTZ, nullable, default now())  
* created\_at (TIMESTAMPTZ, default now())  
* **Constraint:** uq\_message\_queue\_bulk\_send\_recipient UNIQUE (bulk\_send\_id, recipient\_e164\_phone)

### **3.8. application\_error\_logs**

Logs significant API errors and critical application failures.

* id (UUID, PK, default gen\_random\_uuid())  
* timestamp (TIMESTAMPTZ, default now())  
* user\_id (UUID, FK to public.profile(id), nullable)  
* error\_source (TEXT, NOT NULL)  
* error\_code (TEXT, nullable)  
* error\_message (TEXT, NOT NULL)  
* details (JSONB, nullable)  
* resolved\_status (BOOLEAN, default FALSE, NOT NULL)

### **3.9. internal\_notes**

Stores internal notes on conversations.

* id (UUID, PK, default gen\_random\_uuid())  
* conversation\_id (UUID, FK to public.conversations(id), NOT NULL)  
* user\_id (UUID, FK to public.profile(id), NOT NULL)  
* note\_content (TEXT, NOT NULL)  
* created\_at (TIMESTAMPTZ, default now())

### **3.10. conversation\_assignment\_audit**

Logs changes to conversation assignments.

* id (BIGSERIAL, PK)  
* conversation\_id (UUID, NOT NULL, FK to public.conversations(id) ON DELETE CASCADE)  
* old\_agent\_id (UUID, NULL, FK to public.profile(id) ON DELETE SET NULL)  
* new\_agent\_id (UUID, NULL, FK to public.profile(id) ON DELETE SET NULL)  
* actor\_id (UUID, NOT NULL, FK to public.profile(id) ON DELETE CASCADE)  
* reason (TEXT, NULL)  
* changed\_at (TIMESTAMPTZ, NOT NULL, default now())

### **3.11. conversation\_status\_audit**

Logs changes to conversation statuses.

* id (BIGSERIAL, PK)  
* conversation\_id (UUID, NOT NULL, FK to public.conversations(id) ON DELETE CASCADE)  
* changed\_by (UUID, NOT NULL, FK to auth.users(id))  
* old\_status (public.conversation\_status\_enum, NOT NULL)  
* new\_status (public.conversation\_status\_enum, NOT NULL)  
* reason (TEXT, NULL)  
* changed\_at (TIMESTAMPTZ, NOT NULL, default now())

## **4\. Key Supabase Edge Functions & SQL RPCs**

(Refer to PRD v1.17 and Edge Function code for detailed logic)

### **4.1. Webhook Ingestion Service (whatsapp-webhook-ingestion Edge Function)**

* Receives Meta webhooks, validates, calls public.handle\_whatsapp\_message RPC, and forwards to chatbot if applicable.

### **4.2. Bulk Send Queue Processor (bulk-send-processor Edge Function)**

* Processes message\_queue, sends via WhatsApp API, calls public.insert\_message (as 'system'), updates details. Sender attribution is fixed to 'system' using SYSTEM\_USER\_ID.

### **4.3. Scheduled Functions (Edge Functions)**

* daily-conversation-auto-closure: Calls public.close\_idle\_conversations, then public.insert\_message (as 'system') for each closed conversation.  
* daily-rate-limit-reset: Resets rate limit flags in business\_whatsapp\_numbers.

### **4.4. API Endpoints for Front-End Actions (Edge Functions)**

Admin role verification in these functions preferably uses the app\_metadata.role JWT claim.

* send-message: For sending messages to existing conversations.  
* update-conversation-status  
* assign-conversation  
* toggle-chatbot  
* upload-chat-media  
* get-customer-media-url  
* initiate-bulk-send (Admin-only)  
* sync-templates (Admin-only)  
* trigger-round-robin-assignment (Admin-only)

## **5\. Existing Supabase Functions & Their Usage**

* public.reset\_present\_today() (PROCEDURE)  
* public.handle\_lead\_insert\_assign\_owner() (TRIGGER FUNCTION)  
* public.handle\_lead\_update\_assign\_owner() (TRIGGER FUNCTION)  
* public.is\_owner\_in\_requesting\_user\_team(requesting\_user\_id UUID, target\_lead\_owner\_id UUID) RETURNS BOOLEAN  
* public.can\_user\_access\_lead(requesting\_user\_id UUID, target\_lead\_id UUID) RETURNS BOOLEAN

## **6\. Row Level Security (RLS) Strategy**

RLS is enabled on all new tables. Policies are role-based and contextual.

* **business\_whatsapp\_numbers Table RLS**: Specific RLS policies must be implemented to allow only users with the 'admin' role (verified via auth.uid() and profile.role) to perform CUD (Create, Update, Delete) operations. Read access might also be admin-restricted. These policies are critical as admins will interact with this table directly from the frontend.  
* Service role key bypasses RLS for system-level Edge Functions.

## **7\. Supabase Storage**

* **Bucket Name:** whatsapp  
* **Purpose:** Storing outgoing media sent by users.  
* **Path Structure:** DDMMYYYY/\<uploader\_user\_id\>/\<slugified\_filename\>-\<uuid\>.\<ext\>  
* **Access Policies:** RLS for storage; bucket is public for read access via generated URLs.

## **8\. Database Utility Functions (New \- SQL or PL/pgSQL)**

### **8.1. public.convertToE164(local\_number TEXT, default\_country\_code TEXT DEFAULT '91') RETURNS TEXT**

Converts local phone to E.164.

### **8.2. public.convertToLocalFormat(e164\_number TEXT, default\_country\_code TEXT DEFAULT '91') RETURNS TEXT**

Converts E.164 to local format.

### **8.3. public.manage\_message\_partitions() RETURNS TRIGGER**

Manages monthly partitions for messages table.

### **8.4. public.internal\_find\_or\_create\_lead\_for\_whatsapp(p\_customer\_phone\_e164 TEXT, p\_segment public.segment\_type, p\_customer\_name TEXT) RETURNS UUID**

Finds/creates lead, normalizes phone, returns lead\_id.

### **8.5. public.select\_now\_utc() RETURNS TEXT**

Returns current UTC timestamp as ISO-8601 string.

### **8.6. public.handle\_whatsapp\_message(...) RETURNS JSONB**

Core RPC for whatsapp-webhook-ingestion EF. Processes incoming messages, manages lead/conversation, calls public.insert\_message (as 'customer'), determines chatbot eligibility. SECURITY DEFINER.

### **8.7. public.insert\_message(...) RETURNS UUID (Canonical Message Insertion RPC)**

Generic function to insert any message into messages. Handles idempotency, updates conversation, emits realtime notifications via pg\_notify('new\_message', ...). SECURITY DEFINER. SET search\_path \= public, pg\_temp.

* Parameters include p\_conversation\_id, p\_content\_type, p\_sender\_type, p\_text\_content, p\_template\_name, p\_template\_variables, p\_media\_url, p\_whatsapp\_message\_id, p\_sender\_id\_override, p\_initial\_status.

### **8.8. public.close\_idle\_conversations(p\_hours INT DEFAULT 24\) RETURNS JSONB (or SETOF UUID)**

Finds and closes inactive conversations. Must return conversation\_ids of closed conversations for the daily-conversation-auto-closure EF.

### **8.9. public.can\_agent\_insert\_into\_conversation(agent\_id UUID, target\_conversation\_id UUID) RETURNS BOOLEAN**

RLS helper.

### **8.10. public.assign\_conversation\_and\_update\_related(...) RETURNS JSONB**

Atomically assigns conversation, updates related records, audits.

### **8.11. public.can\_agent\_update\_conversation\_status(...) RETURNS BOOLEAN**

RLS helper.

### **8.12. public.set\_conversation\_status(...) RETURNS JSONB**

Atomically changes conversation status, audits.

### **8.13. public.initiate\_bulk\_send\_campaign(...) RETURNS JSONB**

Creates bulk send campaign, queues messages.

### **8.14. public.rate\_limit\_outbound(p\_agent\_id UUID) RETURNS BOOLEAN**

Checks agent rate limits.

### **8.15. public.get\_or\_create\_conversation\_for\_contact(p\_recipient\_phone\_e164 TEXT, p\_business\_number\_id UUID, p\_business\_segment public.segment\_type) RETURNS UUID**

* **Purpose**: Retrieves an existing conversation or creates a new one for a given contact E.164 phone number and business WhatsApp number. This is used by the frontend for Admin Chat Initiation and by the bulk-send-processor.  
* **SECURITY DEFINER**.  
* **Key Logic**:  
  1. Validates parameters.  
  2. Looks up business\_whatsapp\_numbers to confirm validity and get segment if not provided or to validate provided segment.  
  3. Calls public.internal\_find\_or\_create\_lead\_for\_whatsapp using p\_recipient\_phone\_e164 and the determined segment to get/create a lead\_id.  
  4. Attempts to find an existing conversation using lead\_id and p\_business\_number\_id.  
  5. If not found, creates a new conversation record, setting contact\_e164\_phone, business\_whatsapp\_number\_id, lead\_id, segment, is\_chatbot\_active (based on business number config), and status to 'open'.  
  6. Returns the conversation\_id.

## **9\. User-Defined ENUM Types**

* public.segment\_type: 'PL', 'BL', 'PL\_Digital', 'BL\_Digital'.  
* public.user\_role: 'admin', 'team\_leader', 'agent', 'backend', 'system', 'chatbot'.  
* public.conversation\_status\_enum: 'open', 'closed'.  
* public.message\_sender\_type\_enum: 'customer', 'agent', 'chatbot', 'system'.  
* public.message\_content\_type\_enum: 'text', 'image', 'document', 'template', 'system\_notification', 'audio', 'video', 'sticker', 'location', 'contacts', 'interactive', 'button', 'order', 'unknown'.  
* public.message\_delivery\_status\_enum: 'sending', 'sent', 'delivered', 'read', 'failed', 'received'.  
* public.bulk\_send\_status\_enum: 'queued', 'processing', 'completed', 'failed'.  
* public.bulk\_send\_detail\_status\_enum: 'sent', 'failed', 'skipped'.  
* public.message\_queue\_status\_enum: 'pending', 'processing', 'retry\_queued'.

## **10\. Database Optimization Strategy**

### **10.1. Indexing**

Recommended indexes in addition to default PK/FK indexes and those created by UNIQUE constraints:

* **profile table:**  
  * idx\_profile\_round\_robin: (segment, present\_today, is\_active, last\_chat\_assigned\_at ASC NULLS FIRST, id ASC)  
* **conversations table:**  
  * idx\_conversations\_agent\_inbox: (assigned\_agent\_id, status, segment)  
  * idx\_conversations\_segment\_status: (segment, status, assigned\_agent\_id)  
  * idx\_conversations\_auto\_close: (status, last\_message\_at)  
  * idx\_conversations\_lead: (lead\_id)  
  * idx\_conversations\_version: (version)  
  * uq\_conversation\_lead\_bwn ON (lead\_id, business\_whatsapp\_number\_id) (UNIQUE)  
* **messages table (on parent table, propagated to partitions):**  
  * idx\_messages\_conversation\_time: (conversation\_id, timestamp DESC)  
  * idx\_messages\_waid\_ts\_unique ON (timestamp, whatsapp\_message\_id) WHERE whatsapp\_message\_id IS NOT NULL (UNIQUE).  
* **message\_queue table:**  
  * idx\_message\_queue\_processor: (status, next\_attempt\_at ASC)  
  * uq\_message\_queue\_bulk\_send\_recipient ON (bulk\_send\_id, recipient\_e164\_phone) (UNIQUE)  
* **bulk\_send\_details table:**  
  * idx\_bulk\_send\_details\_campaign: (bulk\_send\_id)  
  * uq\_bulk\_send\_recipient ON (bulk\_send\_id, mobile\_number\_e164) (UNIQUE)  
* **message\_templates\_cache table:**  
  * idx\_message\_templates\_status: (status\_from\_whatsapp)  
  * uq\_msg\_templates\_waba\_name\_lang ON (waba\_id, name, language) (UNIQUE)  
* **leads table:**  
  * Unique index/constraint on mobile\_number.  
* **Audit tables (conversation\_assignment\_audit, conversation\_status\_audit):**  
  * Indexes on conversation\_id and relevant actor/user IDs.

### **10.2. Partitioning (messages Table)**

* **Strategy:** Time-based range partitioning on the timestamp column (e.g., monthly).  
* **Rationale:** Improves query performance for recent messages; facilitates data retention.  
* **Maintenance:** A scheduled SQL function (public.manage\_message\_partitions) creates new partitions in advance and ensures necessary indexes are applied.

### **10.3. Guard-rails on messages table**

* A CHECK constraint chk\_sender\_id\_format is applied to messages.sender\_id to ensure that for sender\_type values associated with human users (e.g., 'agent'), the sender\_id conforms to a UUID format, while allowing other text formats for 'chatbot' or 'system' identifiers.  
  ALTER TABLE public.messages  
    ADD CONSTRAINT chk\_sender\_id\_format  
    CHECK (  
      NOT (sender\_type IN ('agent','admin','team\_leader','backend') \-- List relevant human/user roles  
           AND sender\_id \!\~ '^\[0-9a-fA-F\]{8}-\[0-9a-fA-F\]{4}-\[0-9a-fA-F\]{4}-\[0-9a-fA-F\]{4}-\[0-9a-fA-F\]{12}$')  
    );  
