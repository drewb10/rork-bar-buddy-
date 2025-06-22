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
      if (!userId || userId.trim() === '') {
        throw new Error('User ID is required and cannot be empty');
      }
      
      if (!venueId || venueId.trim() === '') {
        throw new Error('Venue ID is required and cannot be empty');
      }
      
      if (!anonymousName || anonymousName.trim() === '') {
        throw new Error('Anonymous name is required and cannot be empty');
      }

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
        const { data: updatedSession, error: updateError } = await supabase
          .from('chat_sessions')
          .update({ last_active: new Date().toISOString() })
          .eq('id', existingSession.id)
          .select()
          .single();
        
        if (updateError) {
          console.warn('Failed to update session timestamp:', updateError);
          return { success: true, session: existingSession };
        }
        
        return { success: true, session: updatedSession };
      }

      const { data: newSession, error: createError } = await supabase
        .from('chat_sessions')
        .insert({
          user_id: userId.trim(),
          venue_id: venueId.trim(),
          anonymous_name: anonymousName.trim(),
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