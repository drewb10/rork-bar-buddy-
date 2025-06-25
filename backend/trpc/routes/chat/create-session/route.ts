import { z } from "zod";
import { publicProcedure } from "../../../create-context";
import { supabase } from "@/lib/supabase";

interface LocalSessionData {
  id: string;
  user_id: string;
  venue_id: string;
  anonymous_name: string;
  anonymous_id: string;
  created_at: string;
  last_active: string;
}

const generateAnonymousIdentity = (): { id: string; name: string } => {
  const adjectives = [
    'Cool', 'Wild', 'Epic', 'Chill', 'Rad', 'Smooth', 'Fresh', 'Bold',
    'Swift', 'Bright', 'Sharp', 'Quick', 'Clever', 'Witty', 'Brave', 'Lucky'
  ];
  
  const nouns = [
    'Tiger', 'Eagle', 'Wolf', 'Fox', 'Bear', 'Lion', 'Hawk', 'Shark',
    'Phoenix', 'Dragon', 'Falcon', 'Panther', 'Viper', 'Raven', 'Lynx', 'Cobra'
  ];
  
  const randomAdjective = adjectives[Math.floor(Math.random() * adjectives.length)];
  const randomNoun = nouns[Math.floor(Math.random() * nouns.length)];
  const randomNumber = Math.floor(Math.random() * 999) + 1;
  
  const anonymousId = `anon-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`;
  const anonymousName = `${randomAdjective}${randomNoun}${randomNumber}`;
  
  return { id: anonymousId, name: anonymousName };
};

export const createSessionProcedure = publicProcedure
  .input(z.object({
    venueId: z.string().min(1, "Venue ID is required"),
    deviceId: z.string().optional(),
  }))
  .mutation(async ({ input }) => {
    const { venueId, deviceId } = input;

    try {
      if (!venueId || venueId.trim() === '') {
        throw new Error('Venue ID is required and cannot be empty');
      }

      // Generate anonymous identity
      const identity = generateAnonymousIdentity();
      const anonymousUserId = deviceId || identity.id;

      // Check for existing session for this device/venue combination
      const { data: existingSession, error: fetchError } = await supabase
        .from('chat_sessions')
        .select('*')
        .eq('user_id', anonymousUserId)
        .eq('venue_id', venueId)
        .maybeSingle();

      if (fetchError && fetchError.code !== 'PGRST116') {
        console.error('Session fetch error:', fetchError);
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
          return { success: true, session: existingSession as LocalSessionData };
        }
        
        return { success: true, session: updatedSession as LocalSessionData };
      }

      // Create new anonymous session
      const { data: newSession, error: createError } = await supabase
        .from('chat_sessions')
        .insert({
          user_id: anonymousUserId,
          venue_id: venueId.trim(),
          anonymous_name: identity.name,
          anonymous_id: identity.id,
        })
        .select()
        .single();

      if (createError) {
        console.error('Session creation error:', createError);
        throw new Error(`Failed to create session: ${createError.message}`);
      }

      return { success: true, session: newSession as LocalSessionData };
    } catch (error) {
      console.error('Create session error:', error);
      throw new Error(`Failed to create session: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  });

export default createSessionProcedure;