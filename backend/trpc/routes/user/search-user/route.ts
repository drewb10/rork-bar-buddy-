import { z } from "zod";
import { publicProcedure } from "../../../create-context";

// Mock user database - in real app this would be a proper database
const mockUsers = [
  {
    userId: '#JohnDoe12345',
    firstName: 'John',
    lastName: 'Doe',
    profilePicture: undefined,
    nightsOut: 15,
    barsHit: 8,
    rankTitle: 'Tipsy Talent',
  },
  {
    userId: '#JaneSmith67890',
    firstName: 'Jane',
    lastName: 'Smith',
    profilePicture: undefined,
    nightsOut: 22,
    barsHit: 12,
    rankTitle: 'Buzzed Beginner',
  },
  {
    userId: '#MikeJohnson54321',
    firstName: 'Mike',
    lastName: 'Johnson',
    profilePicture: undefined,
    nightsOut: 8,
    barsHit: 5,
    rankTitle: 'Sober Star',
  },
];

export default publicProcedure
  .input(z.object({ 
    userId: z.string(),
  }))
  .query(({ input }) => {
    // Search for user by userId
    const user = mockUsers.find(u => u.userId === input.userId);
    
    if (user) {
      console.log('User found:', user);
      return {
        success: true,
        user,
        message: 'User found successfully'
      };
    } else {
      console.log('User not found:', input.userId);
      return {
        success: false,
        user: null,
        message: 'User not found'
      };
    }
  });