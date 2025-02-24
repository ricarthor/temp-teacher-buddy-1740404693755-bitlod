# Course Analytics Edge Function

This Edge Function calculates metrics for a course dashboard.

## Features

- Calculates number of active students (students with quiz activity in last 30 days)
- Aggregates feedback ratings data
- Counts total feedback responses
- Returns structured analytics data

## Usage

```bash
# Deploy the function
supabase functions deploy course-analytics

# Call the function
curl -L -X POST 'https://[PROJECT_REF].supabase.co/functions/v1/course-analytics' \
  -H 'Authorization: Bearer [ANON_KEY]' \
  --data '{"course_id":"[COURSE_ID]"}'
```

## Response Format

```json
{
  "active_students": 156,
  "ratings_summary": {
    "average_ratings": 4.2,
    "total_ratings": 450
  },
  "feedback_summary": {
    "total_responses": 120
  }
}
```

## Error Handling

The function includes error handling for:
- Missing course_id parameter
- Database query errors
- Invalid data formats

## Security

- Uses service role key for database access
- Validates input parameters
- Returns appropriate error responses
