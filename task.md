# **WhatsApp Cloud API Front-End: Task To Do List**

Version: 1.17  
Date: May 30, 2025  
**Assumption**: The Supabase database, including all tables, SQL RPCs (e.g., public.insert\_message, public.get\_or\_create\_conversation\_for\_contact), triggers, and RLS policies, is already built and configured as per "WA DATABASE V 1.17". The initial backend core and shared utilities are complete. This task list focuses on the remaining Edge Function development and Frontend (Next.js) development.

**Backend Core & Shared Utilities - COMPLETED**

[x] 1. Frontend Core Setup & Authentication  
Subtasks:  
* [x] 1.1 Initialize a new Next.js 14 project using the App Router. (PRD Sec 4)  
* [x] 1.2 Install and configure Material UI v7. (PRD Sec 4)  
* [x] 1.3 Install and configure Zustand for client-side state management. (PRD Sec 4)  
* [x] 1.4 Install and configure TanStack Query for server state management. (PRD Sec 4)  
* [x] 1.5 Install and configure Supabase client libraries (@supabase/ssr, @supabase/supabase-js). (PRD Sec 4)  
* [x] 1.6 Set up authentication flows (sign-in, sign-out, protected routes). (PRD Sec 5.1)  
* [x] 1.7 Create reusable UI components library structure. (PRD Sec 4)  
* [x] 1.8 Create a main layout component (e.g., including a header, sidebar for navigation). (PRD Sec 4)  
* [x] 1.9 Implement placeholder navigation links based on user roles (Admin, Team Leader, Agent). (PRD Sec 3, Sec 6.3)  
* [x] 1.10 Create a Login page UI (Email, Password fields). (PRD Sec 6.1)  
* [x] 1.11 Integrate Supabase Auth for email/password login. Ensure JWTs are populated with an app_metadata.role claim from profile.role. (PRD Sec 6.1, Sec 4)  
* [x] 1.12 Implement session management (storing auth state, handling redirects). (PRD Sec 6.1)  
* [x] 1.13 On successful login, fetch user profile data (including role and segment) from the profile table and store it in a global state (Zustand). (PRD Sec 6.1, Sec 3)  
* [x] 1.14 Implement a Logout functionality. (PRD Sec 6.1)  
* [x] 1.15 Protect routes based on authentication status. (PRD Sec 6.1)  
Achievement: A foundational Next.js application is set up with UI libraries, state management, Supabase client, basic layout, and user authentication.  
Working: A navigable application shell; User login, logout, and basic authenticated session.  
[x] 2. Core Agent/User Backend & Frontend (Chat Send/Receive)  
Subtasks:  
* [x] 2.1 **AUTHENTICATION FIXED** - Frontend/Backend JWT token flow working: (PRD Sec 4, Sec 6.3)  
* [x] 2.1.1 Frontend properly sends JWT in Authorization header to Next.js API route  
* [x] 2.1.2 API route extracts and validates JWT using supabase.auth.getUser()  
* [x] 2.1.3 Database operations work perfectly via direct RPC bypass  
* [x] 2.1.4 Messages appear as "sent" in UI and are stored in database  
* [x] 2.1.5 **COMPLETED**: Edge Function v16 RLS permissions fixed - service role can now access conversations and business_whatsapp_numbers tables
* [x] 2.1.6 **COMPLETED**: Edge Function authentication and WhatsApp message delivery fully working - messages now sent to customers' phones with real WhatsApp message IDs  
* [x] 2.2 Implement upload-chat-media Edge Function: (PRD Sec 4, Sec 6.3)  
* [x] 2.2.1 Handle multipart/form-data. Authenticate user.  
* [x] 2.2.2 Validate file size (max 10MB) and MIME types (as per PRD v1.17 Sec 4).  
* [x] 2.2.3 Upload to Supabase Storage (whatsapp bucket, path DDMMYYYY/<uploader_user_id>/<slugified_filename>-<uuid>.<ext>).  
* [x] 2.2.4 Return JSON with media_url, path, mime, size.  
* [x] 2.3 Implement get-customer-media-url Edge Function: (PRD Sec 4, Sec 6.3)  
* [x] 2.3.1 Authenticate user. Validate query params.  
* [x] 2.3.2 RLS check for conversation visibility. Fetch WA token.  
* [x] 2.3.3 Call WA Graph API for media metadata.  
* [x] 2.3.4 Handle download=true (stream) vs. download=false (JSON).  
* [x] 2.4 Frontend - Basic Chat Interface (Right Pane): (PRD Sec 6.3)  
* [x] 2.4.1 Create components for conversation view (message list, item, text input).  
* [x] 2.4.2 Fetch and display chat history.  
* [x] 2.4.3 Implement text input and "Send" button (calls send-message EF with conversation_id).  
* [x] 2.4.4 Visually differentiate Customer vs. Agent vs. System vs. Chatbot messages.  
* [x] 2.5 Frontend - Integrate Supabase Realtime for Receiving Messages: (PRD Sec 4)  
* [x] 2.5.1 Subscribe to new_message channel (from pg_notify in public.insert_message RPC).  
* [x] 2.5.2 Update chat view in real-time. **FIXED**: Customer messages now appear in real-time without page refresh.  
* [x] 2.6 Frontend - Chat List (Left Pane): (PRD Sec 6.3)  
* [x] 2.6.1 Create chat list components.  
* [x] 2.6.2 Fetch and display user's conversations (RLS-based).  
* [x] 2.6.3 List item: Contact, Last Message Timestamp, Unread Count.  
* [x] 2.6.4 Highlight active chat. Implement search.  
* [x] 2.6.5 (Agent View) Basic filters: Status (open/closed).  
* [x] 2.6.6 Real-time updates for chat list.  
Achievement: Users can send and receive various message types, view chat history, and see real-time updates. Media handling (upload/download) is functional.  
Working: Core chat functionality for agents/users.  
[x] 3. Conversation Management Backend & Frontend  
Subtasks:  
* [x] 3.1 Implement/Verify update-conversation-status Edge Function (calls set_conversation_status RPC, handles optimistic locking with If-Match header). (PRD Sec 4, Sec 6.4)  
* [x] 3.2 Implement/Verify assign-conversation Edge Function (Admin/TL, calls assign_conversation_and_update_related RPC, handles optimistic locking with If-Match header). (PRD Sec 4, Sec 6.2, Sec 6.6)  
* [x] 3.3 Implement/Verify toggle-chatbot Edge Function (Agent/TL, updates conversations.is_chatbot_active, handles optimistic locking with If-Match header). (PRD Sec 4, Sec 6.3, Sec 6.5)  
* [x] 3.4 Frontend - Chat Interface Enhancements:  
* [x] 3.4.1 "Stop Chatbot" / "Activate Chatbot" button (calls toggle-chatbot EF). (PRD Sec 6.3, Sec 6.5)  
* [x] 3.4.2 "Close Conversation" / "Reopen Conversation" button (calls update-conversation-status EF). (PRD Sec 6.3, Sec 6.4)  
* [x] 3.4.3 Display incoming customer media (integrates with get-customer-media-url EF). (PRD Sec 6.3)  
* [x] 3.4.4 Agent media upload (integrates upload-chat-media then send-message EFs). (PRD Sec 6.3)  
* [x] 3.4.5 "Send Template" functionality (modal, integrates with send-message EF). (PRD Sec 6.3)  
Achievement: Backend and frontend capabilities for managing conversation status, assignments, chatbot interaction are implemented.  
Working: Users can fully manage conversations.  
[x] 4. Admin Backend Functionality (Edge Functions)  
Subtasks:  
* [x] 4.1 Implement/Verify sync-templates Edge Function (Admin-only, fetches from WA Graph API, upserts to message_templates_cache). Admin role verified via JWT claim (app_metadata.role) or profile lookup. (PRD Sec 4, Sec 6.2)  
* [x] 4.2 Implement/Verify initiate-bulk-send Edge Function (Admin-only, validates payload, calls initiate_bulk_send_campaign SQL RPC). Admin role verified via JWT claim (app_metadata.role). (PRD Sec 4, Sec 6.2)  
* [x] 4.3 Implement/Verify trigger-round-robin-assignment Edge Function (Admin-only, uses advisory lock, calls assign_conversation_and_update_related RPC). Admin role verified via JWT claim (app_metadata.role) or profile lookup. (PRD Sec 4, Sec 6.2)  
Achievement: Core backend functionalities for admin users (template sync, bulk send initiation, round-robin assignment) are available.  
Working: Admins can manage templates, start bulk campaigns, and trigger auto-assignments.  
[x] 5. Scheduled & Automated Backend Processes (Edge Functions)  
Subtasks:  
* [x] 5.1 Refactor/Implement daily-conversation-auto-closure Edge Function (v1.3 or later): (PRD Sec 4, Sec 6.4)  
* [x] 5.1.1 Ensure scheduled setup.  
* [x] 5.1.2 Calls public.close_idle_conversations RPC.  
* [x] 5.1.3 Ensure close_idle_conversations RPC returns IDs of closed conversations.  
* [x] 5.1.4 EF iterates IDs and calls public.insert_message for each (sender: 'system', sender_id_override: SYSTEM_USER_ID, appropriate text, p_whatsapp_message_id as placeholder like crypto.randomUUID() or NULL).  
* [x] 5.2 Implement/Verify daily-rate-limit-reset Edge Function (Updates business_whatsapp_numbers). (PRD Sec 4)  
* [x] 5.3 Refactor/Implement bulk-send-processor Edge Function (v1.4 PRODUCTION-READY): (PRD Sec 4, Sec 10)  
* [x] 5.3.1 Setup triggers (DB Webhook on message_queue INSERT and/or schedule).  
* [x] 5.3.2 Fetch batch from message_queue with necessary joins.  
* [x] 5.3.3 For each message:  
* [x] 5.3.3.1 Mark as 'processing'.  
* [x] 5.3.3.2 Call get_or_create_conversation_for_contact RPC (params: p_recipient_phone_e164, p_business_number_id, p_business_segment).  
* [x] 5.3.3.3 Build WA payload using buildTemplateComponents (FIXED: Now uses same logic as send-message function).  
* [x] 5.3.3.4 Call sharedCallWhatsAppApi.  
* [x] 5.3.3.5 On WA API success: Call public.insert_message (sender: 'system', sender_id_override: SYSTEM_USER_ID, actual whatsapp_message_id). Update bulk_send_details, delete from message_queue.  
* [x] 5.3.3.6 On WA API failure: Implement retry/permanent failure logic for message_queue and bulk_send_details. Update business_whatsapp_numbers for rate limits.  
* [x] 5.3.4 **BULK MESSAGING FULLY FUNCTIONAL**: Tested and verified working with real WhatsApp message delivery  
* [x] 5.3.5 **PRODUCTION DEPLOYMENT COMPLETE**: Edge Function v1.6 deployed with all critical fixes (atomic idempotency, proper error handling, correct API signatures)  
Achievement: Automated system maintenance (auto-closure, rate limit reset) and reliable bulk message processing are functional. All system-generated messages are logged via public.insert_message.  
Working: Scheduled tasks run correctly; bulk campaigns are processed and logged with 'system' attribution. **PRODUCTION-READY BULK MESSAGING SYSTEM FULLY OPERATIONAL**.  
[ ] 6. Frontend Admin Section  
Subtasks:  
* [x] 6.1 Admin Dashboard UI (KPIs, recent campaigns, errors, links). (PRD Sec 6.2)  
* [x] 6.2 WhatsApp Number Management UI (CRUD for business_whatsapp_numbers): (PRD Sec 6.2)  
* [x] 6.2.1 Implement UI for listing, adding, editing, and deleting business_whatsapp_numbers.  
* [x] 6.2.2 Frontend performs CRUD operations using direct Supabase client calls.  
* [x] 6.2.3 Ensure robust RLS policies are in place in the database for the business_whatsapp_numbers table to restrict CUD operations to 'admin' role only.  
* [x] 6.3 Template Management UI (connects to sync-templates EF, previews templates). (PRD Sec 6.2)  
* [x] 6.4 Bulk Template Messaging UI (connects to initiate-bulk-send EF). (PRD Sec 6.2)  
* [x] 6.5 Bulk Campaigns List & Details UI. (PRD Sec 6.2)  
* [ ] 6.6 Admin Chat Initiation UI: (PRD Sec 6.2, Sec 5)  
* [x] 6.6.1 UI for admin to input customer phone (10-digit or E.164), select "Send From" Business WhatsApp Number, choose template, fill variables.  
* [x] 6.6.2 Frontend normalizes phone number to E.164.  
* [x] 6.6.3 Frontend calls public.get_or_create_conversation_for_contact RPC to get/create conversation_id.  
* [x] 6.6.4 Frontend calls send-message EF with the conversation_id and message details.  
* [x] 6.7 Chat Assignment Management UI (Admin) (connects to assign-conversation & trigger-round-robin EFs). (PRD Sec 6.2)  
* [x] 6.8 User Management (Read-only view of profile table). (PRD Sec 6.2)  
* [x] 6.9 Error Log Viewer UI (for application_error_logs). (PRD Sec 6.2, Sec 6.7)  
Achievement: A fully functional admin interface for managing all aspects of the WhatsApp application.  
Working: Admins can perform all their designated tasks.  
[ ] 7. Frontend Team Leader Enhancements  
Subtasks:  
* [ ] 7.1 Team Leader Specific Filters in Chat List (e.g., filter by assigned agent within their team). (PRD Sec 6.3)  
* [x] 7.2 Verify RLS for Team Leaders ensures they only see relevant conversations. (PRD Sec 6.1, Sec 3)  
Achievement: Team Leaders have appropriate views and controls for their teams.  
Working: Team Leader interface is functional and secure.  
[ ] 8. AI Chatbot Integration & Finalization  
Subtasks:  
* [ ] 8.1 Define/Implement Chatbot DB Update Strategy: (PRD Sec 6.5)  
* [ ] 8.1.1 Confirm chatbot system will directly call public.insert_message RPC (with sender_type='chatbot', sender_id_override as chatbot_identifier (TEXT), and whatsapp_message_id from Meta) for its outgoing messages.  
* [ ] 8.1.2 (If direct RPC call is not feasible for chatbot) Implement a simplified, secure log-chatbot-message Edge Function for the chatbot to call. This EF would then call public.insert_message. (This task is currently deferred as per user clarification).  
* [ ] 8.2 Frontend - Visual Differentiation for Chatbot & System Messages: Ensure messages with sender_type='chatbot' and sender_type='system' are distinct in the UI. (PRD Sec 6.3)  
Achievement: Clear mechanism for chatbot messages to be logged, and handover process defined.  
Working: Chatbot messages (if logged by chatbot) and system messages are visually distinct; handover (if applicable) is functional.  
[ ] 9. Project Finalization  
Subtasks:  
* [x] 9.1 Database Cleanup:  
* [x] 9.1.1 Deprecate or DROP the old public.insert_agent_message RPC from the database (if it exists and is no longer used).  
* [ ] 9.2 Update All Documentation to v1.17 Final:  
* [ ] 9.2.1 Ensure "Supabase Database Specification - v1.17" is complete and accurately reflects all RPCs, tables, ENUMs, and indexes.  
* [ ] 9.2.2 Ensure "Product Requirements Document - v1.17" accurately describes all functionalities and workflows.  
* [ ] 9.2.3 This "Task To Do List - v1.17" is reviewed and items are marked as complete.  
* [ ] 9.3 Comprehensive End-to-End Testing: (Covers all relevant PRD sections)  
* [ ] 9.3.1 Test all user role functionalities.  
* [ ] 9.3.2 Test all message sending/receiving paths (agent, bulk, system, customer, chatbot).  
* [ ] 9.3.3 Verify data integrity in the database.  
* [ ] 9.3.4 Test error handling and recovery.  
* [ ] 9.3.5 Test real-time features.  
* [x] 9.3.6 Test admin direct DB interactions for business_whatsapp_numbers ensuring RLS works as expected.  
* [ ] 9.3.7 Test admin chat initiation flow.  
Achievement: A fully tested, documented, and clean application ready for deployment or handover.  
Working: A production-ready application.