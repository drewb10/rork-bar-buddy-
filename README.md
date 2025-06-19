# Bar Buddy - Cloud Data Analytics

## Cloud Data Storage

Bar Buddy now includes cloud data storage capabilities using tRPC backend endpoints. All user interactions and analytics data are automatically tracked and stored.

### Tracked Data

1. **Venue Interactions**
   - Venue ID
   - User ID (optional)
   - Arrival time preferences
   - Timestamp
   - Session ID

2. **Drunk Scale Ratings**
   - Rating (1-10)
   - User ID (optional)
   - Timestamp
   - Session ID

### API Endpoints

#### Track Venue Interaction
```typescript
POST /api/trpc/analytics.trackInteraction
{
  venueId: string,
  userId?: string,
  arrivalTime?: string,
  timestamp: string,
  sessionId?: string
}
```

#### Get Analytics Data
```typescript
GET /api/trpc/analytics.getInteractions
{
  venueId?: string,
  startDate?: string,
  endDate?: string
}
```

#### Track Drunk Scale Rating
```typescript
POST /api/trpc/analytics.trackDrunkScale
{
  rating: number (1-10),
  userId?: string,
  timestamp: string,
  sessionId?: string
}
```

### Accessing Analytics Data

To access the stored analytics data for business insights:

1. **Real-time Monitoring**: Check the server console logs for immediate interaction tracking
2. **API Access**: Use the `getInteractions` endpoint to retrieve aggregated data
3. **Database Integration**: In production, replace the in-memory storage with a proper database (PostgreSQL, MongoDB, etc.)

### Business Metrics Available

- **Total Interactions**: Number of venue likes/RSVPs
- **Unique Users**: Count of distinct users
- **Popular Times**: Most popular arrival times across all venues
- **Venue Breakdown**: Interaction counts per venue
- **Daily Stats**: Daily interaction trends
- **Drunk Scale Analytics**: Average ratings and trends

### Production Setup

For production deployment:

1. **Database**: Replace in-memory storage with persistent database
2. **Authentication**: Add proper user authentication
3. **Rate Limiting**: Implement API rate limiting
4. **Monitoring**: Add proper logging and monitoring tools
5. **Analytics Dashboard**: Create admin dashboard for viewing metrics

### Data Privacy

- User data is anonymized by default
- Session IDs are randomly generated
- No personal information is stored without consent
- Age verification is stored locally only

### Example Usage

```typescript
// Track a venue interaction
const result = await trpcClient.analytics.trackInteraction.mutate({
  venueId: '2',
  arrivalTime: '21:00',
  timestamp: new Date().toISOString(),
});

// Get analytics data
const analytics = await trpcClient.analytics.getInteractions.query({
  startDate: '2025-06-01',
  endDate: '2025-06-30',
});
```

This cloud storage system provides valuable insights into user behavior, popular venues, peak times, and overall app engagement metrics that can be used for business intelligence and marketing decisions.