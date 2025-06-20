import { z } from "zod";
import { protectedProcedure } from "../../../create-context";
import { supabase } from "../../../../../lib/supabase";

export default protectedProcedure
  .input(z.object({
    userId: z.string(),
    targetUserId: z.string(),
  }))
  .mutation(async ({ input }) => {
    const { targetUserId, userId } = input;

    // Check if users are already friends
    const { data: existingFriendship } = await supabase
      .from('friendships')
      .select('*')
      .or(`and(user_id.eq.${userId},friend_id.eq.${targetUserId}),and(user_id.eq.${targetUserId},friend_id.eq.${userId})`)
      .single();

    if (existingFriendship) {
      throw new Error('Already friends or request pending');
    }

    // Check if request already exists
    const { data: existingRequest } = await supabase
      .from('friend_requests')
      .select('*')
      .eq('sender_id', userId)
      .eq('receiver_id', targetUserId)
      .single();

    if (existingRequest) {
      throw new Error('Friend request already sent');
    }

    // Send friend request
    const { data, error } = await supabase
      .from('friend_requests')
      .insert({
        sender_id: userId,
        receiver_id: targetUserId,
        status: 'pending'
      })
      .select()
      .single();

    if (error) {
      throw new Error('Failed to send friend request');
    }

    return { success: true, request: data };
  });