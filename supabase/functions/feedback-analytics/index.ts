// Follow this setup guide to integrate the Deno language server with your editor:
// https://deno.land/manual/getting_started/setup_your_environment
// This enables autocomplete, go to definition, etc.

// Setup type definitions for built-in Supabase Runtime APIs
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.7'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': '*'
};

interface FeedbackAnalytics {
  rating_trends: {
    created_at: string;
    field: string;
    average_rating: number;
    count: number;
  }[];
  open_field_statistics: {
    field: string;
    average_length: number;
    response_rate: number;
  }[];
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    // Create Supabase client with service role key for internal access
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    // Fetch feedback data with timestamps
    const { data: feedbackData, error } = await supabaseClient
      .from('quiz_feedback_imports')
      .select('imported_at, rating_field')
      .order('imported_at', { ascending: true })

    if (error) throw error

    // Process rating fields by date and field
    const ratingTrends = new Map<string, Map<string, { sum: number; count: number }>>()

    // Group ratings by date (using day as granularity) and field
    for (const feedback of feedbackData) {
      const date = new Date(feedback.imported_at).toISOString().split('T')[0]
      const ratings = feedback.rating_field as Record<string, number>

      Object.entries(ratings).forEach(([field, value]) => {
        if (!ratingTrends.has(date)) {
          ratingTrends.set(date, new Map())
        }
        const dateMap = ratingTrends.get(date)!

        if (!dateMap.has(field)) {
          dateMap.set(field, { sum: 0, count: 0 })
        }
        const stats = dateMap.get(field)!
        stats.sum += value
        stats.count++
      })
    }

    // Convert to array format
    const ratingTrendsArray = Array.from(ratingTrends.entries()).flatMap(([date, fields]) =>
      Array.from(fields.entries()).map(([field, stats]) => ({
        created_at: date,
        field,
        average_rating: stats.sum / stats.count,
        count: stats.count
      }))
    )

    const analytics: FeedbackAnalytics = {
      rating_trends: ratingTrendsArray,
      open_field_statistics: [] // Keeping this for backwards compatibility
    }

    // Return response with CORS headers
    return new Response(
      JSON.stringify(analytics),
      {
        headers: {
          'Content-Type': 'application/json',
          ...corsHeaders
        }
      }
    )

  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: {
          'Content-Type': 'application/json',
          ...corsHeaders
        }
      }
    )
  }
})

/* To invoke locally:

  1. Run `supabase start` (see: https://supabase.com/docs/reference/cli/supabase-start)
  2. Make an HTTP request:

  curl -i --location --request POST 'http://127.0.0.1:54321/functions/v1/feedback-analytics' \
    --header 'Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0' \
    --header 'Content-Type: application/json' \
    --data '{"name":"Functions"}'

*/
