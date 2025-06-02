# Re-enabling RLS on Conversations Table

## When you're ready to re-enable RLS security:

### 1. First, create proper RLS policies:

```sql
-- Allow admin users to see all conversations
CREATE POLICY "admin_all_conversations" ON public.conversations
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profile 
      WHERE profile.id = auth.uid() 
        AND profile.role = 'admin'
    )
  );

-- Allow team leaders to see conversations in their segment  
CREATE POLICY "team_leader_segment_conversations" ON public.conversations
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profile 
      WHERE profile.id = auth.uid() 
        AND profile.role = 'team_leader'
        AND profile.segment = conversations.segment
    )
  );

-- Allow agents to see conversations assigned to them or unassigned in their segment
CREATE POLICY "agent_assigned_conversations" ON public.conversations
  FOR ALL
  TO authenticated
  USING (
    (assigned_agent_id = auth.uid()) OR
    (assigned_agent_id IS NULL AND 
     EXISTS (
       SELECT 1 FROM public.profile 
       WHERE profile.id = auth.uid() 
         AND profile.role = 'agent'
         AND profile.segment = conversations.segment
     )
    )
  );
```

### 2. Then re-enable RLS:

```sql
ALTER TABLE public.conversations ENABLE ROW LEVEL SECURITY;
```

### 3. Test each role:
- Admin should see all conversations
- Team leaders should see conversations in their segment
- Agents should see their assigned conversations + unassigned in their segment

## Similar policies needed for messages table:

```sql
-- Messages inherit visibility from their conversation
CREATE POLICY "messages_follow_conversation_policy" ON public.messages
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.conversations 
      WHERE conversations.id = messages.conversation_id
      -- The conversation policies will determine access
    )
  );

ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;
``` 