import { z } from "zod";
import { publicProcedure } from "../../../create-context";
import { supabase } from "@/lib/supabase";

const createSessionSchema = z.object({
  userId: z.string(),
  venueId: z.string(),
  anonymousName: z.string(),
});

export const createSessionProcedure = publicProcedure
  .input(createSessionSchema)
  .mutation(async ({ input }) => {
    const { userId, venueId, anonymousName } = input;

    try {
      // Check if session already exists
      const { data: existingSession, error: fetchError } = await supabase
        .from('chat_sessions')
        .select('*')
        .eq('user_id', userId)
        .eq('venue_id', venueId)
        .single();

      if (existingSession && !fetchError) {
        // Update last_active
        const { data: updatedSession, error: updateError } = await supabase
          .from('chat_sessions')
          .update({ last_active: new Date().toISOString() })
          .eq('id', existingSession.id)
          .select()
          .single();

        if (updateError) throw updateError;
        return { success: true, session: updatedSession };
      }

      // Create new session
      const { data: newSession, error: createError } = await supabase
        .from('chat_sessions')
        .insert({
          user_id: userId,
          venue_id: venueId,
          anonymous_name: anonymousName,
        })
        .select()
        .single();

      if (createError) throw createError;

      return { success: true, session: newSession };
    } catch (error) {
      throw new Error(`Failed to create session: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  });

export default createSessionProcedure;