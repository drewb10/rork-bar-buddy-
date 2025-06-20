import { z } from "zod";
import { protectedProcedure } from "../../../create-context";
import { supabase } from "../../../../../lib/supabase";

export default protectedProcedure
  .input(z.object({
    userId: z.string(),
  }))
  .query(async ({ input }) => {
    const { userId } = input;

    // Get pending friend requests
    const { data: requests, error } = await supabase
      .from('friend_requests')
      .select(`
        id,
        sender_id,
        created_at,
        profiles!friend_requests_sender_id_fkey (
          name,
          profile_picture,
          nights_out,
          bars_hit,
          rank_title
        )
      `)
      .eq('receiver_id', userId)
      .eq('status', 'pending')
      .order('created_at', { ascending: false });

    if (error) {
      throw new Error('Failed to fetch friend requests');
    }

    return requests || [];
  });