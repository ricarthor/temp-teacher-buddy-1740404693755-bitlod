import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.7'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': '*'
};

interface CourseAnalytics {
  active_students: number;
  ratings_summary: {
    average_ratings: number;
    total_ratings: number;
  };
  feedback_summary: {
    total_responses: number;
  };
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    // Create Supabase client
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    // Parse request body
    const { course_id } = await req.json()

    // Validate course_id
    if (!course_id) {
      return new Response(
        JSON.stringify({ error: 'course_id is required' }),
        {
          status: 400,
          headers: {
            'Content-Type': 'application/json',
            ...corsHeaders
          }
        }
      )
    }

    // Get active students (students with quiz answers in the last 30 days)
    const { data: activeStudentsRaw, error: activeError } = await supabaseClient
      .from('quiz_answers')
      .select('student_id')
      .eq('course_id', course_id)
      .gte('created_at', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString())

    if (activeError) {
      throw new Error(`Error fetching active students: ${activeError.message}`)
    }

    // Get unique student IDs using Set
    const activeStudents = [...new Set(activeStudentsRaw?.map(row => row.student_id))]

    // Get feedback data
    const { data: feedbackData, error: feedbackError } = await supabaseClient
      .from('quiz_feedback_imports')
      .select(`
        rating_field,
        open_field
      `)
      .eq('course_id', course_id)

    if (feedbackError) {
      throw new Error(`Error fetching feedback: ${feedbackError.message}`)
    }

    // Calculate average ratings
    let totalRatingSum = 0
    let totalRatingCount = 0

    feedbackData?.forEach(feedback => {
      Object.values(feedback.rating_field).forEach(rating => {
        if (typeof rating === 'number') {
          totalRatingSum += rating
          totalRatingCount++
        }
      })
    })

    // Count open feedback responses
    const totalOpenResponses = feedbackData?.reduce((count, feedback) => {
      return count + Object.keys(feedback.open_field).length
    }, 0) || 0

    // Prepare response
    const analytics: CourseAnalytics = {
      active_students: activeStudents?.length || 0,
      ratings_summary: {
        average_ratings: totalRatingCount > 0 ? totalRatingSum / totalRatingCount : 0,
        total_ratings: totalRatingCount
      },
      feedback_summary: {
        total_responses: totalOpenResponses
      }
    }

    // Return response with CORS headers
    return new Response(
      JSON.stringify("picha"),
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
