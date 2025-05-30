# **Product Requirements Document: WhatsApp Cloud API Front-End**

Version: 1.17  
Date: May 30, 2025  
Author: AI Assistant (Gemini) based on User Input & Revisions

## **1\. Introduction**

This document outlines the requirements for a web-based front-end application designed to interact with the WhatsApp Cloud API. The application will provide distinct functionalities for Admin, Team Leader, and Agent users, leveraging an existing Supabase setup for authentication, data storage (including chat history and application-specific data), and backend logic via Edge Functions and SQL RPCs. The application aims to streamline WhatsApp communication management, campaign execution, and customer engagement for different business segments. This version details current backend message handling, role definitions, and overall system functionality, incorporating clarifications on admin chat initiation, direct database interactions for specific admin tasks, bulk message sender attribution, and admin role verification in Edge Functions.

## **2\. Goals**

* To provide an intuitive and efficient interface for managing WhatsApp conversations originating from multiple business WhatsApp numbers.  
* To enable Admin users to manage WhatsApp templates, execute bulk messaging campaigns (including selecting the sending number) with improved validation and persistent adaptive rate limiting, manage business WhatsApp numbers (including their segment assignment and associated chatbot logic), and oversee user activity and chat assignments.  
* To equip Team Leaders with tools to monitor and manage conversations within their assigned segment and team.  
* To allow Agents to effectively handle assigned WhatsApp conversations, send templated and free-form messages (including documents and images, with support for template header images), and control AI chatbot participation in their conversations, with a clear strategy for handling incoming customer media.  
* To ensure secure and relevant access to chat data for all user roles through Supabase Row Level Security (RLS).  
* To integrate with an existing leads table in Supabase for contact information and context.  
* To facilitate a hybrid human-AI interaction model where an AI chatbot handles initial engagement (if configured), with seamless hand-off and control by human agents.  
* To accurately log all messages (customer, agent, chatbot, system) using a unified backend mechanism centered around the public.insert\_message RPC.

## **3\. User Roles & Personas**

* **Admin**:  
  * Oversees the entire application.  
  * Manages system settings, WhatsApp number configurations (including segment assignment and chatbot association), template synchronization, bulk messaging campaigns (including specifying the sending WhatsApp number), and chat assignments (manual and round-robin).  
  * Can view all conversations across all segments and assign them.  
  * Manages user access and roles. Database roles for message attribution include 'system' and 'chatbot', as defined in the public.user\_role ENUM.  
  * Monitors system activity and errors via a dedicated dashboard.  
* **Team Leader**:  
  * Oversees a team of Agents within a specific business segment.  
  * Can view all conversations assigned to themselves or to agents within their team and segment.  
  * Cannot see unassigned conversations or conversations outside their segment/team.  
  * Can handle conversations assigned to them directly.  
* **Agent**:  
  * Handles customer interactions for a specific business segment.  
  * Can only view and interact with conversations specifically assigned to them within their segment.  
  * Cannot see unassigned conversations or conversations not assigned to them.  
  * Can send text messages, approved templates (including those with header images), documents, and images.  
  * Can control AI chatbot participation in their assigned conversations (if a chatbot is configured for the number).  
* **System (Implicit Persona)**: Represents automated actions within the application, such as auto-closing conversations or processing bulk sends. Messages from 'system' are logged via public.insert\_message for audit and context, using a designated System User ID.  
* **Chatbot (Implicit Persona)**: Represents an external AI chatbot. Messages from 'chatbot' are logged via public.insert\_message for a complete conversation history, typically initiated by the chatbot system itself using its chatbot\_identifier.

## **4\. Core System Architecture & Technology**

* **Front-End Framework**: Next.js 14 (using App Router) with React 18\.  
* **UI Component Library**: Material UI v7, using the default Material palette and theme.  
* **State Management**:  
  * Server State: TanStack Query.  
  * UI/Client State: Zustand.  
* **Real-time Delivery (Messages & Chat List Updates)**: Supabase Realtime, subscribing to postgres\_changes on the messages table (triggered by pg\_notify from public.insert\_message RPC) and relevant conversation data.  
* **Backend & Database**:  
  * **Supabase**: (Refer to Database Specification Document v1.17 for detailed schemas and function descriptions)  
    * User Authentication (Supabase Auth). JWTs are expected to have an app\_metadata.role claim populated from profile.role upon login, which is the preferred method for admin role verification in Edge Functions.  
    * Database (PostgreSQL). The messages table uses a generalized insertion mechanism via the public.insert\_message RPC.  
    * Time-based partitioning for the messages table.  
  * **Supabase Edge Functions & SQL RPCs**:  
    * whatsapp-webhook-ingestion Edge Function: Receives WhatsApp webhooks, validates signatures. For message processing, it primarily invokes the public.handle\_whatsapp\_message SQL RPC which encapsulates logic for lead/conversation management and calls public.insert\_message (with sender\_type='customer') for saving incoming messages. The RPC's return value is then used by the Edge Function for chatbot forwarding decisions.  
    * API endpoints for front-end actions (Edge Functions):  
      * send-message: Called by authenticated users (Agent/TL/Admin) for sending messages to *existing* conversations. Validates payload (including media/header image URLs against allowed hosts), checks permissions and agent rate limits, calls WhatsApp API, and then calls public.insert\_message RPC (with sender\_type='agent') to persist the message.  
      * update-conversation-status: Handles changes to conversation status.  
      * assign-conversation: Manages conversation assignments.  
      * toggle-chatbot: Allows agents/TLs to toggle chatbot activity.  
      * upload-chat-media: Manages uploads of media by users.  
      * get-customer-media-url: Retrieves media sent by customers.  
      * initiate-bulk-send: Admin-only. Calls initiate\_bulk\_send\_campaign RPC to start bulk campaigns. Admin role verified via JWT claim (app\_metadata.role).  
      * sync-templates: Admin-only. Synchronizes message templates from WhatsApp. Admin role verification may use JWT claim or direct profile lookup.  
      * trigger-round-robin-assignment: Admin-only. Initiates round-robin assignment of conversations. Admin role verification may use JWT claim or direct profile lookup.  
    * Scheduled functions (Edge Functions):  
      * daily-conversation-auto-closure: Runs daily. Calls public.close\_idle\_conversations(INT) SQL function. If this RPC returns IDs of closed conversations, the Edge Function then calls public.insert\_message (with sender\_type='system' and sender\_id\_override set to the System User's ID) for each closed conversation to log a system message.  
      * daily-rate-limit-reset: Resets daily rate limits for messaging.  
      * bulk-send-processor: Triggered by message\_queue inserts and a schedule. Processes queued messages, calls WhatsApp API, and then calls public.insert\_message (with sender\_type='system' and sender\_id\_override as the SYSTEM\_USER\_ID) to log sent bulk messages. Manages adaptive rate limiting.  
    * send-message-from-chatbot Edge Function: (Currently Deferred) The external chatbot system is responsible for its own WhatsApp API sends and for ensuring its outgoing messages are recorded in the application's database (e.g., by directly calling public.insert\_message RPC if authorized, or via a future simplified EF if needed).  
  * **Row Level Security (RLS)**.  
* **WhatsApp Cloud API**: Direct integration via Edge Functions.  
* **AI Coding Assistant**: Cursor (for development assistance).  
* **MIME types allowed for media uploads**:  
  * **Images**: image/jpeg (.jpg), image/png (.png), image/gif (.gif), image/webp (.webp)  
  * **PDF**: application/pdf (.pdf)  
  * **Office Documents (Legacy \+ OOXML)**: application/msword (.doc), application/vnd.openxmlformats-officedocument.wordprocessingml.document (.docx), application/vnd.ms-excel (.xls), application/vnd.openxmlformats-officedocument.spreadsheetml.sheet (.xlsx), application/vnd.ms-powerpoint (.ppt), application/vnd.openxmlformats-officedocument.presentationml.presentation (.pptx)

## **5\. Phone Number Handling**

The system employs specific strategies for handling phone numbers across different contexts:

* **WhatsApp API Format (E.164)**: All interactions with the WhatsApp API use the E.164 format, which includes a country code prefix (e.g., \+91XXXXXXXXXX).  
* **Internal leads Table Format**: The leads table stores 10-digit local mobile numbers (e.g., XXXXXXXXXX) for primary identification within that table.  
* **Conversion Strategy**:  
  * Backend utility SQL functions, public.convertToE164(local\_number TEXT, ...) and public.convertToLocalFormat(e164\_number TEXT, ...), are available for converting between these formats.  
  * **Incoming Messages**: The WhatsApp webhook provides customer phone numbers in E.164 format. The public.handle\_whatsapp\_message RPC uses this E.164 number. For interactions with the leads table (e.g., finding or creating a lead via internal\_find\_or\_create\_lead\_for\_whatsapp), numbers are normalized to the 10-digit format. The E.164 format is stored in conversations.contact\_e164\_phone.  
  * **Outgoing Messages (to WhatsApp API)**: Messages sent to the WhatsApp API must always use the E.164 format.  
  * **CSV for Bulk Send**: The mobile column in CSV files used for bulk messaging campaigns must contain phone numbers in E.164 format, including the \+ prefix.  
  * **Admin Single Chat Initiation**: The interface allows administrators to input phone numbers in either 10-digit or E.164 format. The frontend is responsible for normalizing these to E.164 before calling the public.get\_or\_create\_conversation\_for\_contact RPC and subsequently the send-message Edge Function.

## **6\. Features**

### **6.1. Authentication & Authorization**

* **Authentication Method**: Users authenticate via email and password using Supabase Auth.  
* **User Roles and Permissions**: User roles (defined in public.user\_role ENUM as 'admin', 'team\_leader', 'agent') and segment assignments are managed in the profile table. System and chatbot identities are also represented in public.user\_role and public.message\_sender\_type\_enum for comprehensive message attribution.  
* **Password Policy**: A minimum of 6 characters is required for passwords. No other complexity rules are enforced by this application.  
* **Row Level Security (RLS)**: RLS is implemented in the Supabase database to enforce data access restrictions based on user roles and their specific assignments (e.g., to conversations, segments, or teams).  
* **Admin Role Verification in Edge Functions**: The preferred method for verifying admin roles in Edge Functions is by checking the app\_metadata.role claim in the user's JWT. This requires the JWT to be reliably populated with this claim upon login.

### **6.2. Admin Section**

This section provides administrators with comprehensive control over the application.

* **Dashboard**: Displays key performance indicators (KPIs) such as total active WhatsApp numbers, number of unassigned conversations, and number of active agents. It also shows recent bulk messaging campaigns, critical system notifications from application\_error\_logs, and quick links to common administrative tasks.  
* **WhatsApp Number Management**: Allows admins to add, link, and manage the business's WhatsApp API numbers. For each number, admins can assign a segment, a chatbot\_identifier (a lowercase string for AI logic), an optional chatbot\_endpoint\_url (if blank, no chatbot is invoked), and a friendly name. Admins can also view and manage the active status of these numbers and see rate limit persistence fields (though these are primarily system-managed). **CRUD operations on the business\_whatsapp\_numbers table are performed by the frontend via direct database interaction using the Supabase client, secured by robust RLS policies specific to the 'admin' role.**  
* **Template Management**: Provides a view of all synchronized message templates from the message\_templates\_cache. Admins can manually trigger a synchronization with the WhatsApp Graph API for a specified WABA ID using the sync-templates Edge Function. A preview modal displays template components with placeholders.  
* **Bulk Template Messaging**: A multi-step workflow enables admins to:  
  1. Select the "Send From" Business WhatsApp Number, choose an approved template, download a sample CSV for recipient data, upload the CSV, and optionally provide a campaign name.  
  2. Preview and validate the CSV, with client-side notices for mobile number format (E.164 with '+') and image URL format.  
  3. Initiate the bulk send, which calls the initiate-bulk-send Edge Function. Rate limiting and retries are managed by the bulk-send-processor Edge Function.  
* **Bulk Campaigns List Page**: Displays a history of all bulk messaging campaigns from the bulk\_sends table, showing status and success/failure counts. Allows viewing detailed reports for each campaign.  
* **Chat Initiation (Admin)**: A modal dialog allows admins to initiate a new conversation.  
  1. Admin inputs the customer's phone number (10-digit or E.164), selects the "Send From" Business WhatsApp Number, chooses an approved template, and fills in template variables.  
  2. The frontend normalizes the phone number to E.164 format.  
  3. The frontend calls the public.get\_or\_create\_conversation\_for\_contact SQL RPC (passing the E.164 number, business\_whatsapp\_number\_id, and segment) to obtain or create a conversation\_id.  
  4. The frontend then calls the send-message Edge Function with the obtained conversation\_id and message details.  
* **Chat Assignment Management (Admin)**: A table view of conversations with filters for assignee status, conversation status, segment, assigned agent/TL, business number, and date range. Provides a global action to "Assign Unassigned via Round-Robin" (calling trigger-round-robin-assignment EF) and row-level actions to assign/reassign individual conversations (calling assign-conversation EF) or view the chat.  
* **User Management (Basic)**: A read-only table view of the profile table, with filters for role, segment, active status, present\_today status, and search by name/email.  
* **Error Log Viewer**: A table view of the application\_error\_logs table, with filters for resolved status, error source, error code, date range, and user ID. Allows viewing details and marking errors as resolved/unresolved.

### **6.3. User Section (Agents & Team Leaders)**

This section provides tools for agents and team leaders to manage customer interactions.

* **Navigation**: Users are presented with pages and views relevant to their assigned segment.  
* **Chat Interface**:  
  * **Left Pane (Chat List)**: Displays conversations accessible to the user based on RLS policies. Each item shows the contact's name/phone, the timestamp of the last message, and an unread message count badge. The active chat is highlighted. Users can search by contact name or phone number. Team Leaders have an additional filter for assigned agents within their team. The list updates in real-time via Supabase Realtime.  
  * **Right Pane (Conversation View)**:  
    * Displays the full chat history for the selected conversation from the messages table, with infinite scroll. Messages from customers, agents (self), AI chatbots, and system notifications are visually differentiated.  
    * Shows message timestamps and read receipts for outgoing agent messages.  
    * The contact's name/number is displayed at the top.  
    * A "Stop Chatbot" / "Activate Chatbot" button is available (if a chatbot is configured for the conversation's business number and the conversation is assigned), which calls the toggle-chatbot Edge Function.  
    * Users can view or download media sent by customers by clicking an icon/button on the media message, which calls the get-customer-media-url Edge Function.  
  * **Message Input Area**:  
    * An icon to attach documents or images, which first calls upload-chat-media to upload the file and then send-message (with the returned media URL and conversation\_id) to send the message.  
    * An icon to send a pre-approved template, which opens a modal to select a template and fill variables, then calls send-message (with conversation\_id).  
    * A multi-line text input area (Enter sends, Shift+Enter for new line).  
    * A send icon button, which calls send-message for text messages (with conversation\_id).

### **6.4. Conversation Status Management**

* Agents and Team Leaders can manually close assigned conversations using the update-conversation-status Edge Function.  
* A conversation's status is automatically changed from 'closed' back to 'open' by the public.handle\_whatsapp\_message RPC when a new customer message arrives.  
* The daily-conversation-auto-closure scheduled Edge Function automatically closes inactive 'open' conversations and logs a system message (via public.insert\_message) in each.

### **6.5. AI Chatbot Integration & Workflow**

The system supports AI chatbot integration for initial message handling, contingent on a business WhatsApp number being configured for chatbot use via business\_whatsapp\_numbers.chatbot\_endpoint\_url.

* **Webhook Ingestion & RPC Logic for Chatbot Invocation**:  
  * When a new message is received, the whatsapp-webhook-ingestion Edge Function calls the public.handle\_whatsapp\_message RPC.  
  * This RPC determines if a chatbot is configured for the business number and the appropriate is\_chatbot\_active state for the conversation (new conversations on configured numbers default to chatbot active; reopened conversations may also reactivate the chatbot if previously active or by default).  
  * The RPC returns chatbot\_endpoint\_url, is\_chatbot\_active, and chatbot\_identifier to the Edge Function.  
  * If chatbot\_endpoint\_url is present and is\_chatbot\_active is TRUE, the Edge Function forwards the message payload (including chatbot\_identifier) to the chatbot\_endpoint\_url.  
* **Agent Control**: Agents can use "Stop Chatbot" / "Activate Chatbot" buttons in the chat interface, which call the toggle-chatbot Edge Function to set conversations.is\_chatbot\_active.  
* **AI Chatbot System (External)**:  
  * This is an external system with its own API endpoint (defined by chatbot\_endpoint\_url).  
  * It receives message payloads from this application, processes them, and handles its own message sending directly to the WhatsApp Cloud API.  
  * The external chatbot system is also responsible for ensuring its outgoing messages are recorded in this application's database. This is typically achieved by the chatbot system making a secure, authenticated call to the public.insert\_message RPC directly (if it has appropriate database access credentials, e.g., a service role key or a specific JWT) with sender\_type='chatbot', sender\_id\_override as its chatbot\_identifier, and the whatsapp\_message\_id it received from Meta.

### **6.6. Contact & Lead Management Workflow**

The application integrates with the leads table for contact and lead information.

* **Lead Creation/Lookup on Incoming Conversation**: When an incoming message initiates a conversation, the public.handle\_whatsapp\_message RPC (called by the whatsapp-webhook-ingestion service) uses the customer's phone number (E.164) and the segment associated with the business WhatsApp number to call the internal\_find\_or\_create\_lead\_for\_whatsapp SQL function. This function normalizes the phone number to the 10-digit format, searches for an existing lead or creates a new one in the leads table, and returns the lead\_id. This lead\_id is then stored in the conversations record by the handle\_whatsapp\_message RPC.  
* **Lead Segment Update**: The lead's segment in the leads table is populated or updated based on the segment of the business\_whatsapp\_numbers record that received the message.  
* **Lead Owner Update**: When a conversation is assigned to an agent or team leader, the application logic (typically within the assign-conversation Edge Function or its underlying RPC assign\_conversation\_and\_update\_related) updates the lead\_owner field in the associated leads record to the profile.id of the assigned user.

### **6.7. Error Handling & Feedback**

The application provides clear user feedback and handles errors gracefully.

* **General UI Feedback**: Toast notifications are used for success messages (e.g., "Message Sent," "Campaign Initiated"). Loading indicators are displayed during asynchronous operations. Empty state messages are shown in lists or tables when no data is available.  
* **Form Validation**: Both client-side (immediate feedback) and server-side validation (via Zod schemas in Edge Functions) are implemented. User-friendly error messages are displayed near the relevant form fields or as general alerts.  
* **API & System Errors**: User-facing messages generally mask technical details, providing a simpler explanation (e.g., "An unexpected error occurred. Please try again later."). Critical system errors, API failures, and significant issues are logged to the application\_error\_logs table for administrative review.  
* **Retry Mechanisms**: For bulk send operations, the bulk-send-processor Edge Function implements retries for transient errors encountered when sending messages via the WhatsApp API. Permanent content-related errors (e.g., WhatsApp error code 470 for template mismatch) result in immediate failure for that specific message without retries and do not negatively impact the overall sending rate of the business number.  
* **Real-time Connection Issues**: The UI attempts to inform the user about issues with the real-time connection (e.g., to Supabase Realtime for chat updates) and should attempt to auto-reconnect.  
* **Bulk Operations Feedback**: Upon initiating a bulk operation (like a messaging campaign), a toast notification confirms initiation. The "Bulk Campaigns List Page" displays the ongoing status and progress of these campaigns.

## **7\. Non-Functional Requirements**

* **Mobile Responsiveness**: The application must be fully responsive and provide a good user experience on common mobile and tablet devices, in addition to desktop browsers.  
* **Performance**: Key user interactions, such as loading chat history, sending messages, and navigating lists, should be performant. Database queries will be optimized with appropriate indexing (see Database Specification Document v1.17).  
* **Security**: All API endpoints must be authenticated. Sensitive data (like API tokens) must be handled securely. RLS policies must be strictly enforced. Input validation is critical.  
* **Scalability**: The system should be designed to handle a growing number of users, conversations, and messages, leveraging Supabase's scalable infrastructure.  
* **Reliability**: Edge Functions and database operations should be robust, with proper error handling and logging to ensure system stability.  
* **Browser Support**: The application should support recent versions of major modern web browsers (e.g., Chrome, Firefox, Safari, Edge).

## **8\. Out of Scope for This Version**

The following items are considered out of scope for the current version (v1.17) of the application:

* Real-time "Pause," "Resume," or "Cancel" functionality for bulk messaging campaigns that are already in the 'processing' state.  
* A dedicated Edge Function within this application (send-message-from-chatbot) for the external chatbot to proxy its message sending or logging (the chatbot is expected to handle its own WhatsApp API calls and database updates directly via the public.insert\_message RPC).  
* Advanced analytics or reporting features beyond the basic admin dashboard KPIs and bulk campaign detail views.  
* Multi-Factor Authentication (MFA) for user login.  
* Sound or browser push notifications for new messages or chat assignments.

## **9\. Deployment & Hosting**

The application will be deployed with the following considerations:

* **External Access (Primary Frontend)**: The Next.js front-end application is intended to be deployed to Vercel for public accessibility.  
* **Local Network Access**: A version or specific components of the application may also be hosted on a local Ubuntu machine for internal or restricted access, if required.  
* **Backend & Database**: All backend services, including the PostgreSQL database, authentication, Edge Functions, and storage, are hosted on Supabase Cloud.  
* **CI/CD**: Continuous Integration/Continuous Deployment pipelines are to be defined and implemented to automate testing and deployment processes.  
* **Environment Management**: Separate environments (e.g., Development, Staging, Production) are recommended for Supabase and the frontend deployment to manage the development lifecycle effectively. Configuration for each environment (e.g., API keys, database connection strings, ALLOWED\_MEDIA\_HOSTS) must be managed securely.  
* **Dual Deployment Consistency**: If both Vercel and local instances are maintained, careful consideration must be given to ensuring consistency in application versions, configurations, and data access policies.

## **10\. Key System Understandings for v1.17**

This section summarizes critical design points and workflows for the application.

* **UI/UX Details**: Specifications for key user interfaces (Admin Dashboard, Chat Interface, Management Tables, Modals) have been established to guide frontend development.  
* **Chatbot Configuration**: Each business WhatsApp number can be configured with a chatbot\_identifier and a chatbot\_endpoint\_url. The conversations.is\_chatbot\_active flag, managed by agents and system logic, determines if incoming messages are forwarded to this endpoint.  
* **Bulk Send Queue Processor**: This Edge Function uses a hybrid trigger (database webhook and schedule). It implements adaptive rate limiting based on platform errors from WhatsApp; content-related errors (like WhatsApp code 470\) are treated as permanent for the specific message and do not cause the business number's overall sending rate to be capped. All messages successfully sent by the processor are logged into the messages table via the public.insert\_message RPC with sender\_type='system' and sender\_id\_override as the SYSTEM\_USER\_ID.  
* **Database Optimization**: Indexing strategies (including unique indexes for idempotency) and time-based partitioning for the messages table are detailed in the Database Specification Document v1.17 to ensure query performance and data manageability.  
* **Contact & Lead Management**: A defined workflow integrates with the existing leads table, including lead creation/lookup based on incoming messages and updates to lead ownership upon conversation assignment.  
* **Error Handling**: Strategies for UI feedback, form validation, API error responses, and critical backend error logging (to application\_error\_logs) are in place.  
* **Conversation Status Management**: Logic for manual (agent-driven) and automatic (system-driven, e.g., on new customer message or daily inactivity check) updates to conversation status ('open'/'closed') is defined. Auto-closure actions result in a system message being logged in the conversation via public.insert\_message.  
* **Webhook Ingestion**: The whatsapp-webhook-ingestion Edge Function processes incoming webhooks from Meta. It calls the public.handle\_whatsapp\_message SQL RPC, which in turn uses the public.insert\_message RPC to log incoming customer messages with sender\_type='customer'.  
* **Message Persistence**: A central design principle is that all messages (customer, agent, system, chatbot) are logged into the messages table via the canonical public.insert\_message SQL RPC, ensuring data consistency and a unified audit trail.  
* **Admin Chat Initiation**: Admins initiate new chats by providing a phone number. The frontend normalizes this number, calls public.get\_or\_create\_conversation\_for\_contact RPC to get/create a conversation\_id, and then calls the send-message Edge Function with this ID.  
* **Admin Management of business\_whatsapp\_numbers**: Admins perform CRUD operations on the business\_whatsapp\_numbers table directly from the frontend using the Supabase client, secured by RLS policies.  
* **Admin Role Verification in Edge Functions**: The preferred method is checking the app\_metadata.role claim in the JWT. Supabase Auth must be configured to populate this claim reliably.