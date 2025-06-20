import { z } from "zod";
import { protectedProcedure } from "../../../create-context";
import { supabase } from "../../../../../lib/supabase";

export default protectedProcedure
  .input(z.object({
    requestId: z.string(),
  }))
  .mutation(async ({ input, ctx }) => {
    const { requestId } = input;
    const currentUserId = ctx.user.id;

    // Get the friend request
    const { data: request, error: requestError } = await supabase
      .from('friend_requests')
      .select('*')
      .eq('id', requestId)
      .eq('receiver_id', currentUserId)
      .eq('status', 'pending')
      .single();

    if (requestError || !request) {
      throw new Error('Friend request not found');
    }

    // Create friendship
    const { error: friendshipError } = await supabase
      .from('friendships')
      .insert({
        user_id: currentUserId,
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