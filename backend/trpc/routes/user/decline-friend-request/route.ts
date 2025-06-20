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

    // Update request status to declined
    const { error } = await supabase
      .from('friend_requests')
      .update({ status: 'declined' })
      .eq('id', requestId)
      .eq('receiver_id', currentUserId)
      .eq('status', 'pending');

    if (error) {
      throw new Error('Failed to decline friend request');
    }

    return { success: true };
  });