# **WhatsApp Cloud API Front-End: Task To Do List**

Version: 1.17  
Date: May 30, 2025  
**Assumption**: The Supabase database, including all tables, SQL RPCs (e.g., public.insert\_message, public.get\_or\_create\_conversation\_for\_contact), triggers, and RLS policies, is already built and configured as per "WA DATABASE V 1.17". The initial backend core and shared utilities are complete. This task list focuses on the remaining Edge Function development and Frontend (Next.js) development.

**Backend Core & Shared Utilities \- COMPLETED**

\[ \] 1\. Frontend Core Setup & Authentication  
Subtasks:  
\* \[ \] 1.1 Initialize a new Next.js 14 project using the App Router. (PRD Sec 4\)  
\* \[ \] 1.2 Install and configure Material UI v7. (PRD Sec 4\)  
\* \[ \] 1.3 Install and configure Zustand for client state management. (PRD Sec 4\)  
\* \[ \] 1.4 Install and configure TanStack Query for server state management. (PRD Sec 4\)  
\* \[ \] 1.5 Set up basic project structure (folders for components, pages/routes, services, hooks, etc.). (PRD Sec 4\)  
\* \[ \] 1.6 Configure Supabase client for frontend usage. (PRD Sec 4\)  
\* \[ \] 1.7 Create a main layout component (e.g., including a header, sidebar for navigation). (PRD Sec 4\)  
\* \[ \] 1.8 Implement placeholder navigation links based on user roles (Admin, Team Leader, Agent). (PRD Sec 3, Sec 6.3)  
\* \[ \] 1.9 Create a Login page UI (Email, Password fields). (PRD Sec 6.1)  
\* \[ \] 1.10 Integrate Supabase Auth for email/password login. Ensure JWTs are populated with an app\_metadata.role claim from profile.role. (PRD Sec 6.1, Sec 4\)  
\* \[ \] 1.11 Implement session management (storing auth state, handling redirects). (PRD Sec 6.1)  
\* \[ \] 1.12 On successful login, fetch user profile data (including role and segment) from the profile table and store it in a global state (Zustand). (PRD Sec 6.1, Sec 3\)  
\* \[ \] 1.13 Implement a Logout functionality. (PRD Sec 6.1)  
\* \[ \] 1.14 Protect routes based on authentication status. (PRD Sec 6.1)  
Achievement: A foundational Next.js application is set up with UI libraries, state management, Supabase client, basic layout, and user authentication.  
Working: A navigable application shell; User login, logout, and basic authenticated session.  
\[ \] 2\. Core Agent/User Backend & Frontend (Chat Send/Receive)  
Subtasks:  
\* \[ \] 2.1 Refactor/Implement send-message Edge Function (v1.6.2 or later): (PRD Sec 4, Sec 6.3)  
\* \[ \] 2.1.1 Ensure Zod schema handles all message types (text, template, image, document) and validates media\_url/header\_image\_url (including ALLOWED\_MEDIA\_HOSTS environment variable).  
\* \[ \] 2.1.2 Verify WhatsApp API payload construction.  
\* \[ \] 2.1.3 Confirm public.insert\_message RPC call correctly maps parameters (p\_sender\_type: 'agent', p\_sender\_id\_override: null (uses auth.uid()), p\_whatsapp\_message\_id from WA API, p\_media\_url for templates/direct media).  
\* \[ \] 2.1.4 Ensure response handling is updated for the uuid returned by insert\_message.  
\* \[ \] 2.2 Implement upload-chat-media Edge Function: (PRD Sec 4, Sec 6.3)  
\* \[ \] 2.2.1 Handle multipart/form-data. Authenticate user.  
\* \[ \] 2.2.2 Validate file size (max 10MB) and MIME types (as per PRD v1.17 Sec 4).  
\* \[ \] 2.2.3 Upload to Supabase Storage (whatsapp bucket, path DDMMYYYY/\<uploader\_user\_id\>/\<slugified\_filename\>-\<uuid\>.\<ext\>).  
\* \[ \] 2.2.4 Return JSON with media\_url, path, mime, size.  
\* \[ \] 2.3 Implement get-customer-media-url Edge Function: (PRD Sec 4, Sec 6.3)  
\* \[ \] 2.3.1 Authenticate user. Validate query params.  
\* \[ \] 2.3.2 RLS check for conversation visibility. Fetch WA token.  
\* \[ \] 2.3.3 Call WA Graph API for media metadata.  
\* \[ \] 2.3.4 Handle download=true (stream) vs. download=false (JSON).  
\* \[ \] 2.4 Frontend \- Basic Chat Interface (Right Pane): (PRD Sec 6.3)  
\* \[ \] 2.4.1 Create components for conversation view (message list, item, text input).  
\* \[ \] 2.4.2 Fetch and display chat history.  
\* \[ \] 2.4.3 Implement text input and "Send" button (calls send-message EF with conversation\_id).  
\* \[ \] 2.4.4 Visually differentiate Customer vs. Agent vs. System vs. Chatbot messages.  
\* \[ \] 2.5 Frontend \- Integrate Supabase Realtime for Receiving Messages: (PRD Sec 4\)  
\* \[ \] 2.5.1 Subscribe to new\_message channel (from pg\_notify in public.insert\_message RPC).  
\* \[ \] 2.5.2 Update chat view in real-time.  
\* \[ \] 2.6 Frontend \- Chat List (Left Pane): (PRD Sec 6.3)  
\* \[ \] 2.6.1 Create chat list components.  
\* \[ \] 2.6.2 Fetch and display user's conversations (RLS-based).  
\* \[ \] 2.6.3 List item: Contact, Last Message Timestamp, Unread Count.  
\* \[ \] 2.6.4 Highlight active chat. Implement search.  
\* \[ \] 2.6.5 (Agent View) Basic filters: Status (open/closed).  
\* \[ \] 2.6.6 Real-time updates for chat list.  
Achievement: Users can send and receive various message types, view chat history, and see real-time updates. Media handling (upload/download) is functional.  
Working: Core chat functionality for agents/users.  
\[ \] 3\. Conversation Management Backend & Frontend  
Subtasks:  
\* \[ \] 3.1 Implement/Verify update-conversation-status Edge Function (calls set\_conversation\_status RPC, handles optimistic locking with If-Match header). (PRD Sec 4, Sec 6.4)  
\* \[ \] 3.2 Implement/Verify assign-conversation Edge Function (Admin/TL, calls assign\_conversation\_and\_update\_related RPC, handles optimistic locking with If-Match header). (PRD Sec 4, Sec 6.2, Sec 6.6)  
\* \[ \] 3.3 Implement/Verify toggle-chatbot Edge Function (Agent/TL, updates conversations.is\_chatbot\_active, handles optimistic locking with If-Match header). (PRD Sec 4, Sec 6.3, Sec 6.5)  
\* \[ \] 3.4 Frontend \- Chat Interface Enhancements:  
\* \[ \] 3.4.1 "Stop Chatbot" / "Activate Chatbot" button (calls toggle-chatbot EF). (PRD Sec 6.3, Sec 6.5)  
\* \[ \] 3.4.2 "Close Conversation" / "Reopen Conversation" button (calls update-conversation-status EF). (PRD Sec 6.3, Sec 6.4)  
\* \[ \] 3.4.3 Display incoming customer media (integrates with get-customer-media-url EF). (PRD Sec 6.3)  
\* \[ \] 3.4.4 Agent media upload (integrates upload-chat-media then send-message EFs). (PRD Sec 6.3)  
\* \[ \] 3.4.5 "Send Template" functionality (modal, integrates with send-message EF). (PRD Sec 6.3)  
Achievement: Backend and frontend capabilities for managing conversation status, assignments, chatbot interaction are implemented.  
Working: Users can fully manage conversations.  
\[ \] 4\. Admin Backend Functionality (Edge Functions)  
Subtasks:  
\* \[ \] 4.1 Implement/Verify sync-templates Edge Function (Admin-only, fetches from WA Graph API, upserts to message\_templates\_cache). Admin role verified via JWT claim (app\_metadata.role) or profile lookup. (PRD Sec 4, Sec 6.2)  
\* \[ \] 4.2 Implement/Verify initiate-bulk-send Edge Function (Admin-only, validates payload, calls initiate\_bulk\_send\_campaign SQL RPC). Admin role verified via JWT claim (app\_metadata.role). (PRD Sec 4, Sec 6.2)  
\* \[ \] 4.3 Implement/Verify trigger-round-robin-assignment Edge Function (Admin-only, uses advisory lock, calls assign\_conversation\_and\_update\_related RPC). Admin role verified via JWT claim (app\_metadata.role) or profile lookup. (PRD Sec 4, Sec 6.2)  
Achievement: Core backend functionalities for admin users (template sync, bulk send initiation, round-robin assignment) are available.  
Working: Admins can manage templates, start bulk campaigns, and trigger auto-assignments.  
\[ \] 5\. Scheduled & Automated Backend Processes (Edge Functions)  
Subtasks:  
\* \[ \] 5.1 Refactor/Implement daily-conversation-auto-closure Edge Function (v1.3 or later): (PRD Sec 4, Sec 6.4)  
\* \[ \] 5.1.1 Ensure scheduled setup.  
\* \[ \] 5.1.2 Calls public.close\_idle\_conversations RPC.  
\* \[ \] 5.1.3 Ensure close\_idle\_conversations RPC returns IDs of closed conversations.  
\* \[ \] 5.1.4 EF iterates IDs and calls public.insert\_message for each (sender: 'system', sender\_id\_override: SYSTEM\_USER\_ID, appropriate text, p\_whatsapp\_message\_id as placeholder like crypto.randomUUID() or NULL).  
\* \[ \] 5.2 Implement/Verify daily-rate-limit-reset Edge Function (Updates business\_whatsapp\_numbers). (PRD Sec 4\)  
\* \[ \] 5.3 Refactor/Implement bulk-send-processor Edge Function (v1.3.2 or later): (PRD Sec 4, Sec 10\)  
\* \[ \] 5.3.1 Setup triggers (DB Webhook on message\_queue INSERT and/or schedule).  
\* \[ \] 5.3.2 Fetch batch from message\_queue with necessary joins.  
\* \[ \] 5.3.3 For each message:  
\* \[ \] 5.3.3.1 Mark as 'processing'.  
\* \[ \] 5.3.3.2 Call get\_or\_create\_conversation\_for\_contact RPC (params: p\_recipient\_phone\_e164, p\_business\_number\_id, p\_business\_segment).  
\* \[ \] 5.3.3.3 Build WA payload using buildTemplateComponents.  
\* \[ \] 5.3.3.4 Call sharedCallWhatsAppApi.  
\* \[ \] 5.3.3.5 On WA API success: Call public.insert\_message (sender: 'system', sender\_id\_override: SYSTEM\_USER\_ID, actual whatsapp\_message\_id). Update bulk\_send\_details, delete from message\_queue.  
\* \[ \] 5.3.3.6 On WA API failure: Implement retry/permanent failure logic for message\_queue and bulk\_send\_details. Update business\_whatsapp\_numbers for rate limits.  
Achievement: Automated system maintenance (auto-closure, rate limit reset) and reliable bulk message processing are functional. All system-generated messages are logged via public.insert\_message.  
Working: Scheduled tasks run correctly; bulk campaigns are processed and logged with 'system' attribution.  
\[ \] 6\. Frontend Admin Section  
Subtasks:  
\* \[ \] 6.1 Admin Dashboard UI (KPIs, recent campaigns, errors, links). (PRD Sec 6.2)  
\* \[ \] 6.2 WhatsApp Number Management UI (CRUD for business\_whatsapp\_numbers): (PRD Sec 6.2)  
\* \[ \] 6.2.1 Implement UI for listing, adding, editing, and deleting business\_whatsapp\_numbers.  
\* \[ \] 6.2.2 Frontend performs CRUD operations using direct Supabase client calls.  
\* \[ \] 6.2.3 Ensure robust RLS policies are in place in the database for the business\_whatsapp\_numbers table to restrict CUD operations to 'admin' role only.  
\* \[ \] 6.3 Template Management UI (connects to sync-templates EF, previews templates). (PRD Sec 6.2)  
\* \[ \] 6.4 Bulk Template Messaging UI (connects to initiate-bulk-send EF). (PRD Sec 6.2)  
\* \[ \] 6.5 Bulk Campaigns List & Details UI. (PRD Sec 6.2)  
\* \[ \] 6.6 Admin Chat Initiation UI: (PRD Sec 6.2, Sec 5\)  
\* \[ \] 6.6.1 UI for admin to input customer phone (10-digit or E.164), select "Send From" Business WhatsApp Number, choose template, fill variables.  
\* \[ \] 6.6.2 Frontend normalizes phone number to E.164.  
\* \[ \] 6.6.3 Frontend calls public.get\_or\_create\_conversation\_for\_contact RPC to get/create conversation\_id.  
\* \[ \] 6.6.4 Frontend calls send-message EF with the conversation\_id and message details.  
\* \[ \] 6.7 Chat Assignment Management UI (Admin) (connects to assign-conversation & trigger-round-robin EFs). (PRD Sec 6.2)  
\* \[ \] 6.8 User Management (Read-only view of profile table). (PRD Sec 6.2)  
\* \[ \] 6.9 Error Log Viewer UI (for application\_error\_logs). (PRD Sec 6.2, Sec 6.7)  
Achievement: A fully functional admin interface for managing all aspects of the WhatsApp application.  
Working: Admins can perform all their designated tasks.  
\[ \] 7\. Frontend Team Leader Enhancements  
Subtasks:  
\* \[ \] 7.1 Team Leader Specific Filters in Chat List (e.g., filter by assigned agent within their team). (PRD Sec 6.3)  
\* \[ \] 7.2 Verify RLS for Team Leaders ensures they only see relevant conversations. (PRD Sec 6.1, Sec 3\)  
Achievement: Team Leaders have appropriate views and controls for their teams.  
Working: Team Leader interface is functional and secure.  
\[ \] 8\. AI Chatbot Integration & Finalization  
Subtasks:  
\* \[ \] 8.1 Define/Implement Chatbot DB Update Strategy: (PRD Sec 6.5)  
\* \[ \] 8.1.1 Confirm chatbot system will directly call public.insert\_message RPC (with sender\_type='chatbot', sender\_id\_override as chatbot\_identifier (TEXT), and whatsapp\_message\_id from Meta) for its outgoing messages.  
\* \[ \] 8.1.2 (If direct RPC call is not feasible for chatbot) Implement a simplified, secure log-chatbot-message Edge Function for the chatbot to call. This EF would then call public.insert\_message. (This task is currently deferred as per user clarification).  
\* \[ \] 8.2 Frontend \- Visual Differentiation for Chatbot & System Messages: Ensure messages with sender\_type='chatbot' and sender\_type='system' are distinct in the UI. (PRD Sec 6.3)  
Achievement: Clear mechanism for chatbot messages to be logged, and handover process defined.  
Working: Chatbot messages (if logged by chatbot) and system messages are visually distinct; handover (if applicable) is functional.  
\[ \] 9\. Project Finalization  
Subtasks:  
\* \[ \] 9.1 Database Cleanup:  
\* \[ \] 9.1.1 Deprecate or DROP the old public.insert\_agent\_message RPC from the database (if it exists and is no longer used).  
\* \[ \] 9.2 Update All Documentation to v1.17 Final:  
\* \[ \] 9.2.1 Ensure "Supabase Database Specification \- v1.17" is complete and accurately reflects all RPCs, tables, ENUMs, and indexes.  
\* \[ \] 9.2.2 Ensure "Product Requirements Document \- v1.17" accurately describes all functionalities and workflows.  
\* \[ \] 9.2.3 This "Task To Do List \- v1.17" is reviewed and items are marked as complete.  
\* \[ \] 9.3 Comprehensive End-to-End Testing: (Covers all relevant PRD sections)  
\* \[ \] 9.3.1 Test all user role functionalities.  
\* \[ \] 9.3.2 Test all message sending/receiving paths (agent, bulk, system, customer, chatbot).  
\* \[ \] 9.3.3 Verify data integrity in the database.  
\* \[ \] 9.3.4 Test error handling and recovery.  
\* \[ \] 9.3.5 Test real-time features.  
\* \[ \] 9.3.6 Test admin direct DB interactions for business\_whatsapp\_numbers ensuring RLS works as expected.  
\* \[ \] 9.3.7 Test admin chat initiation flow.  
Achievement: A fully tested, documented, and clean application ready for deployment or handover.  
Working: A production-ready application.