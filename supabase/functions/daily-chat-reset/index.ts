import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface SessionData {
  id: string;
}

interface MessageData {
  session_id: string;
}

serve(async (req: Request) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Create Supabase client with service role key for admin operations
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    )

    // Calculate cutoff time (5 AM today, or yesterday if it's before 5 AM)
    const now = new Date()
    const cutoffTime = new Date()
    cutoffTime.setHours(5, 0, 0, 0)
    
    // If current time is before 5 AM, use yesterday's 5 AM
    if (now.getHours() < 5) {
      cutoffTime.setDate(cutoffTime.getDate() - 1)
    }

    console.log(`Starting daily chat reset. Cutoff time: ${cutoffTime.toISOString()}`)

    // Delete messages older than cutoff time
    const { data: deletedMessages, error: deleteError } = await supabaseAdmin
      .from('chat_messages')
      .delete()
      .lt('created_at', cutoffTime.toISOString())

    if (deleteError) {
      console.error('Error deleting old messages:', deleteError)
      throw deleteError
    }

    // Clean up sessions that have no messages and are older than 7 days
    const sevenDaysAgo = new Date()
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)

    // First, get sessions that should be cleaned up
    const { data: sessionsToDelete, error: sessionsError } = await supabaseAdmin
      .from('chat_sessions')
      .select('id')
      .lt('created_at', sevenDaysAgo.toISOString())

    if (sessionsError) {
      console.error('Error finding sessions to delete:', sessionsError)
    } else if (sessionsToDelete && sessionsToDelete.length > 0) {
      // Check which of these sessions have no messages
      const sessionIds = sessionsToDelete.map((s: SessionData) => s.id)
      
      const { data: sessionsWithMessages, error: messagesCheckError } = await supabaseAdmin
        .from('chat_messages')
        .select('session_id')
        .in('session_id', sessionIds)

      if (!messagesCheckError) {
        const sessionsWithMessagesIds = new Set(sessionsWithMessages?.map((m: MessageData) => m.session_id) || [])
        const sessionsToDeleteIds = sessionIds.filter((id: string) => !sessionsWithMessagesIds.has(id))

        if (sessionsToDeleteIds.length > 0) {
          const { error: deleteSessionsError } = await supabaseAdmin
            .from('chat_sessions')
            .delete()
            .in('id', sessionsToDeleteIds)

          if (deleteSessionsError) {
            console.error('Error deleting old sessions:', deleteSessionsError)
          } else {
            console.log(`Deleted ${sessionsToDeleteIds.length} old sessions`)
          }
        }
      }
    }

    // Reset daily like limits at 4:59 AM
    const likeCutoffTime = new Date()
    likeCutoffTime.setHours(4, 59, 0, 0)
    
    // If current time is before 4:59 AM, use yesterday's 4:59 AM
    if (now.getHours() < 5 || (now.getHours() === 4 && now.getMinutes() < 59)) {
      likeCutoffTime.setDate(likeCutoffTime.getDate() - 1)
    }

    // Note: In a real implementation, you might want to reset like counters here
    // For now, the client-side logic handles this

    const result = {
      success: true,
      message: 'Daily chat reset completed successfully',
      cutoffTime: cutoffTime.toISOString(),
      likeCutoffTime: likeCutoffTime.toISOString(),
      timestamp: now.toISOString()
    }

    console.log('Daily chat reset completed:', result)

    return new Response(
      JSON.stringify(result),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      },
    )

  } catch (error) {
    console.error('Daily chat reset failed:', error)
    
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred'
    
    return new Response(
      JSON.stringify({
        success: false,
        error: errorMessage,
        timestamp: new Date().toISOString()
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      },
    )
  }
})