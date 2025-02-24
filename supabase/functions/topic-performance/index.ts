import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.7'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': '*'
};

interface TopicPerformance {
  topic: string;
  total_questions: number;
  correct_answers: number;
  performance_percentage: number;
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

    // Fetch quizzes for the given course_id
    const { data: quizzes, error: quizzesError } = await supabaseClient
      .from('teacher_quizzes')
      .select('id, questions')
      .eq('course_id', course_id);

    if (quizzesError) {
      throw new Error(`Error fetching quizzes: ${quizzesError.message}`)
    }

    if (!quizzes || quizzes.length === 0) {
      return new Response(
        JSON.stringify({ message: 'No quizzes found for this course' }),
        {
          status: 200, // Not an error, just no data
          headers: {
            'Content-Type': 'application/json',
            ...corsHeaders
          }
        }
      )
    }

    // Extract all question IDs and topics from the quizzes
    const questionData: { id: string; topic: string; }[] = [];
    quizzes.forEach(quiz => {
      quiz.questions?.forEach((question: { question_id: string; topic: string; }) => {
        if (question.question_id && question.topic) { // Ensure question_id and topic exist
          questionData.push({ id: question.question_id, topic: question.topic });
        }
      });
    });

    // Fetch answers for all questions in the quizzes
    const questionIds = questionData.map(q => q.id);
    const { data: answers, error: answersError } = await supabaseClient
      .from('quiz_answers')
      .select('question_id, is_correct')
      .in('question_id', questionIds);

    if (answersError) {
      throw new Error(`Error fetching answers: ${answersError.message}`)
    }

    // Aggregate topic performance
    const topicPerformance: Record<string, { total: number; correct: number; }> = {};
    questionData.forEach(question => {
      topicPerformance[question.topic] = topicPerformance[question.topic] || { total: 0, correct: 0 };
      topicPerformance[question.topic].total++;
    });

    answers?.forEach(answer => {
      const question = questionData.find(q => q.id === answer.question_id);
      if (question && answer.is_correct) {
        topicPerformance[question.topic].correct++;
      }
    });

    // Calculate performance percentage
    const result: TopicPerformance[] = Object.entries(topicPerformance).map(([topic, data]) => ({
      topic,
      total_questions: data.total,
      correct_answers: data.correct,
      performance_percentage: (data.correct / data.total) * 100
    }));

    // Return response with CORS headers
    return new Response(
      JSON.stringify(result),
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
