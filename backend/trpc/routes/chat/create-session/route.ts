import { z } from "zod";
import { publicProcedure } from "../../../create-context";
import { supabase } from "@/lib/supabase";

export const createSessionProcedure = publicProcedure
  .input(z.object({
    userId: z.string().min(1, "User ID is required"),
    venueId: z.string().min(1, "Venue ID is required"),
    anonymousName: z.string().min(1, "Anonymous name is required"),
  }))
  .mutation(async ({ input }) => {
    const { userId, venueId, anonymousName } = input;

    try {
      // Validate inputs
      if (!userId || !venueId || !anonymousName) {
        throw new Error('Missing required fields: userId, venueId, and anonymousName are required');
      }

      // Check if session already exists for this user and venue
      const { data: existingSession, error: fetchError } = await supabase
        .from('chat_sessions')
        .select('*')
        .eq('user_id', userId)
        .eq('venue_id', venueId)
        .maybeSingle();

      if (fetchError && fetchError.code !== 'PGRST116') {
        throw new Error(`Failed to check existing session: ${fetchError.message}`);
      }

      if (existingSession) {
        // Update last_active timestamp
        const { data: updatedSession, error: updateError } = await supabase
          .from('chat_sessions')
          .update({ last_active: new Date().toISOString() })
          .eq('id', existingSession.id)
          .select()
          .single();
        
        if (updateError) {
          console.warn('Failed to update session timestamp:', updateError);
          // Return existing session even if timestamp update fails
          return { success: true, session: existingSession };
        }
        
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

      if (createError) {
        throw new Error(`Failed to create session: ${createError.message}`);
      }

      return { success: true, session: newSession };
    } catch (error) {
      console.error('Create session error:', error);
      throw new Error(`Failed to create session: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  });

export default createSessionProcedure;