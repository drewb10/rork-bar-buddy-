import { z } from "zod";
import { protectedProcedure } from "../../../create-context";
import { supabase } from "../../../../../lib/supabase";

export default protectedProcedure
  .input(z.object({
    userId: z.string(),
    requestId: z.string(),
  }))
  .mutation(async ({ input }) => {
    const { requestId, userId } = input;

    // Get the friend request
    const { data: request, error: requestError } = await supabase
      .from('friend_requests')
      .select('*')
      .eq('id', requestId)
      .eq('receiver_id', userId)
      .eq('status', 'pending')
      .single();

    if (requestError || !request) {
      throw new Error('Friend request not found');
    }

    // Create friendship
    const { error: friendshipError } = await supabase
      .from('friendships')
      .insert({
        user_id: userId,
        friend_id: request.sender_id,
        created_at: new Date().toISOString()
      });

    if (friendshipError) {
      throw new Error('Failed to create friendship');
    }

    // Update request status
    const { error: updateError } = await supabase
      .from('friend_requests')
      .update({ status: 'accepted' })
      .eq('id', requestId);

    if (updateError) {
      throw new Error('Failed to update request status');
    }

    return { success: true };
  });