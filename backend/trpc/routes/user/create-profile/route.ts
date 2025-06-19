import { z } from "zod";
import { publicProcedure } from "../../../create-context";

// In a real app, this would save to a database
const userProfiles: any[] = [];

export default publicProcedure
  .input(z.object({ 
    userId: z.string(),
    firstName: z.string(),
    lastName: z.string(),
    profilePicture: z.string().optional(),
  }))
  .mutation(({ input }) => {
    // Store the user profile
    const profile = {
      ...input,
      id: Math.random().toString(36).substr(2, 9),
      createdAt: new Date().toISOString(),
      nightsOut: 0,
      barsHit: 0,
      drunkScaleRatings: [],
      friends: [],
    };
    
    // Remove existing profile with same userId if exists
    const existingIndex = userProfiles.findIndex(p => p.userId === input.userId);
    if (existingIndex !== -1) {
      userProfiles[existingIndex] = profile;
    } else {
      userProfiles.push(profile);
    }
    
    console.log('User profile created/updated:', profile);
    
    return {
      success: true,
      profileId: profile.id,
      message: 'Profile created successfully'
    };
  });