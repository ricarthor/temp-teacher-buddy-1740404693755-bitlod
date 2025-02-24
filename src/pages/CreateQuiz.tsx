import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { PlusCircle, X, Code } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { CodeEditor } from '../components/CodeEditor';
import { FeedbackEditor } from '../components/FeedbackEditor';
import { SUPPORTED_LANGUAGES } from '../types/quiz';

type QuestionType = 'multiple-choice' | 'true-false' | 'code-interpretation';

interface Question {
  id: string;
  type: QuestionType;
  text: string;
  options?: string[];
  correctAnswer: string;
  codeLanguage?: string;
  codeSnippet?: string;
  tags: string[]; // Added tags field
}

interface FeedbackQuestion {
  id: string;
  type: 'rating' | 'open';
  text: string;
}

export function CreateQuiz() {
  const navigate = useNavigate();
  const { quizId } = useParams();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [topic, setTopic] = useState('');
  const [questions, setQuestions] = useState<Question[]>([]);
  const [feedback, setFeedback] = useState<FeedbackQuestion[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [quizCode, setQuizCode] = useState<string | null>(null);
  const [status, setStatus] = useState<'draft' | 'active' | 'archived'>('draft');
  const [isLoading, setIsLoading] = useState(!!quizId);

  useEffect(() => {
    if (quizId) {
      fetchQuiz();
    }
  }, [quizId]);

  const fetchQuiz = async () => {
    try {
      const { data: quiz, error: fetchError } = await supabase
        .from('teacher_quizzes')
        .select('*')
        .eq('id', quizId)
        .single();

      if (fetchError) throw fetchError;

      setTitle(quiz.title);
      setDescription(quiz.description || '');
      setTopic(quiz.topic);
      setStatus(quiz.status);
      setQuestions(quiz.questions.map((q: any) => ({
        id: q.question_id || crypto.randomUUID(),
        type: q.type,
        text: q.text,
        options: q.options,
        correctAnswer: q.correct_answer,
        codeLanguage: q.code_language,
        codeSnippet: q.code_snippet,
        tags: q.tags || [], // Load existing tags
      })));
      setFeedback(quiz.feedback || []);
    } catch (err: any) {
      console.error('Error fetching quiz:', err);
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const addQuestion = (type: QuestionType) => {
    const newQuestion: Question = {
      id: crypto.randomUUID(),
      type,
      text: '',
      options: type === 'multiple-choice' || type === 'code-interpretation' ? ['', '', '', ''] : undefined,
      correctAnswer: '',
      ...(type === 'code-interpretation' ? {
        codeLanguage: 'python',
        codeSnippet: ''
      } : {}),
      tags: [], // Initialize with empty tags array
    };
    setQuestions([...questions, newQuestion]);
  };

  const updateQuestion = (id: string, updates: Partial<Question>) => {
    setQuestions(questions.map(q =>
      q.id === id ? { ...q, ...updates } : q
    ));
  };

  const removeQuestion = (id: string) => {
    setQuestions(questions.filter(q => q.id !== id));
  };

    const handleTagChange = (questionId: string, tags: string[]) => {
    updateQuestion(questionId, { tags });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);

    try {
      const questionData = questions.map(q => ({
        question_id: q.id,
        text: q.text,
        type: q.type,
        options: q.options,
        correct_answer: q.correctAnswer,
        code_language: q.codeLanguage,
        code_snippet: q.codeSnippet,
        tags: q.tags, // Include tags in the submission
      }));

      const quizData = {
        title,
        topic,
        description,
        status,
        questions: questionData,
        feedback
      };

      if (quizId) {
        // Update existing quiz
        const { error: updateError } = await supabase
          .from('teacher_quizzes')
          .update({
            ...quizData,
            updated_at: new Date().toISOString()
          })
          .eq('id', quizId);

        if (updateError) throw updateError;
        navigate('/quizzes');
      } else {
        // Create new quiz
        const { data: quiz, error: createError } = await supabase
          .from('teacher_quizzes')
          .insert(quizData)
          .select('code')
          .single();

        if (createError) throw createError;
        setQuizCode(quiz.code);
      }
    } catch (err: any) {
      console.error('Error saving quiz:', err);
      setError(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#2563eb]"></div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-[#1e293b] mb-2">
          {quizId ? 'Edit Quiz' : 'Create New Quiz'}
        </h1>
        <p className="text-[#64748b]">
          {quizId ? 'Update your quiz content and settings' : 'Design your quiz with various question types'}
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Quiz Details */}
        <div className="bg-white p-6 rounded-xl shadow-sm space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2">
              Quiz Title
            </label>
            <input
              type="text"
              required
              value={title}
              onChange={e => setTitle(e.target.value)}
              className="w-full px-4 py-2 border border-default rounded-lg focus:outline-none focus:ring-2 focus:ring-primary bg-card"
              placeholder="Enter quiz title"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">
              Topic
            </label>
            <input
              type="text"
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              className="w-full px-4 py-2 border border-default rounded-lg focus:outline-none focus:ring-2 focus:ring-primary bg-card"
              placeholder="Enter quiz topic"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">
              Description
            </label>
            <textarea
              value={description}
              onChange={e => setDescription(e.target.value)}
              rows={4}
              className="w-full px-4 py-2 border border-default rounded-lg focus:outline-none focus:ring-2 focus:ring-primary bg-card"
              placeholder="Enter quiz description"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">
              Status
            </label>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value as 'draft' | 'active' | 'archived')}
              className="w-full px-4 py-2 border border-default rounded-lg focus:outline-none focus:ring-2 focus:ring-primary bg-card"
            >
              <option value="draft">Draft</option>
              <option value="active">Active</option>
              <option value="archived">Archived</option>
            </select>
          </div>
        </div>

        {/* Questions */}
        <div className="space-y-4">
          {questions.map((question, index) => (
            <div key={question.id} className="bg-card p-6 rounded-xl shadow-sm space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="font-medium">Question {index + 1}</h3>
                <button
                  type="button"
                  onClick={() => removeQuestion(question.id)}
                  className="text-red-600 hover:text-red-700"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-2">
                    Question Text
                  </label>
                  <textarea
                    value={question.text}
                    onChange={(e) => updateQuestion(question.id, { text: e.target.value })}
                    className="w-full px-4 py-2 border border-default rounded-lg focus:outline-none focus:ring-2 focus:ring-primary bg-card"
                    placeholder="Enter your question"
                    rows={2}
                    required
                  />
                </div>

                {/* Code Snippet for Code Interpretation */}
                {question.type === 'code-interpretation' && (
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium mb-2">
                        Programming Language
                      </label>
                      <select
                        value={question.codeLanguage}
                        onChange={(e) => updateQuestion(question.id, { codeLanguage: e.target.value })}
                        className="w-full px-4 py-2 border border-default rounded-lg focus:outline-none focus:ring-2 focus:ring-primary bg-card"
                      >
                        {SUPPORTED_LANGUAGES.map(lang => (
                          <option key={lang.value} value={lang.value}>
                            {lang.label}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-2">
                        Code Snippet
                      </label>
                      <CodeEditor
                        value={question.codeSnippet || ''}
                        onChange={(value) => updateQuestion(question.id, { codeSnippet: value })}
                        language={question.codeLanguage || 'python'}
                        placeholder="Enter your code snippet here..."
                      />
                    </div>
                  </div>
                )}

                {/* Multiple Choice Options */}
                {(question.type === 'multiple-choice' || question.type === 'code-interpretation') && (
                  <div className="space-y-2">
                    <label className="block text-sm font-medium">
                      {question.type === 'code-interpretation' ? 'Possible Interpretations' : 'Options'}
                    </label>
                    {question.options?.map((option, optionIndex) => (
                      <div key={optionIndex} className="flex gap-2">
                        <input
                          type="text"
                          value={option}
                          onChange={(e) => {
                            const newOptions = [...(question.options || [])];
                            newOptions[optionIndex] = e.target.value;
                            updateQuestion(question.id, { options: newOptions });
                          }}
                          className="flex-1 px-4 py-2 border border-default rounded-lg focus:outline-none focus:ring-2 focus:ring-primary bg-card"
                          placeholder={question.type === 'code-interpretation'
                            ? `Interpretation ${optionIndex + 1}`
                            : `Option ${optionIndex + 1}`
                          }
                          required
                        />
                        <button
                          type="button"
                          onClick={() => {
                            const newOptions = question.options?.filter((_, i) => i !== optionIndex);
                            updateQuestion(question.id, { options: newOptions });
                          }}
                          className="px-3 py-2 text-textSecondary hover:text-text"
                        >
                          <X className="w-5 h-5" />
                        </button>
                      </div>
                    ))}
                    {(question.options?.length || 0) < 6 && (
                      <button
                        type="button"
                        onClick={() => {
                          const newOptions = [...(question.options || []), ''];
                          updateQuestion(question.id, { options: newOptions });
                        }}
                        className="text-primary text-sm hover:text-blue-700"
                      >
                        Add {question.type === 'code-interpretation' ? 'Interpretation' : 'Option'}
                      </button>
                    )}
                  </div>
                )}

                {/* Correct Answer */}
                <div>
                  <label className="block text-sm font-medium mb-2">
                    Correct Answer
                  </label>
                  {question.type === 'true-false' ? (
                    <select
                      value={question.correctAnswer}
                      onChange={(e) => updateQuestion(question.id, { correctAnswer: e.target.value })}
                      className="w-full px-4 py-2 border border-default rounded-lg focus:outline-none focus:ring-2 focus:ring-primary bg-card"
                      required
                    >
                      <option value="">Select correct answer</option>
                      <option value="true">True</option>
                      <option value="false">False</option>
                    </select>
                  ) : (question.type === 'multiple-choice' || question.type === 'code-interpretation') ? (
                    <select
                      value={question.correctAnswer}
                      onChange={(e) => updateQuestion(question.id, { correctAnswer: e.target.value })}
                      className="w-full px-4 py-2 border border-default rounded-lg focus:outline-none focus:ring-2 focus:ring-primary bg-card"
                      required
                    >
                      <option value="">Select correct answer</option>
                      {question.options?.map((option, index) => (
                        <option key={index} value={option}>
                          {option}
                        </option>
                      ))}
                    </select>
                  ) : (
                    <input
                      type="text"
                      value={question.correctAnswer}
                      onChange={(e) => updateQuestion(question.id, { correctAnswer: e.target.value })}
                      className="w-full px-4 py-2 border border-default rounded-lg focus:outline-none focus:ring-2 focus:ring-primary bg-card"
                      placeholder="Enter correct answer"
                      required
                    />
                  )}
                </div>
                {/* Tags Input */}
                <div>
                    <label className="block text-sm font-medium mb-2">Tags</label>
                    <input
                      type="text"
                      value={question.tags.join(', ')} // Display tags as comma-separated string
                      onChange={(e) => handleTagChange(question.id, e.target.value.split(',').map(tag => tag.trim()))}
                      className="w-full px-4 py-2 border border-default rounded-lg focus:outline-none focus:ring-2 focus:ring-primary bg-card"
                      placeholder="Enter tags separated by commas (e.g., math, algebra, calculus)"
                    />
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Add Question Buttons */}
        <div className="bg-card p-6 rounded-xl shadow-sm">
          <h3 className="font-medium mb-4">Add Question</h3>
          <div className="flex flex-wrap gap-4">
            <button
              type="button"
              onClick={() => addQuestion('multiple-choice')}
              className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-primary bg-blue-50 dark:bg-blue-900/20 rounded-lg hover:bg-blue-100 dark:hover:bg-blue-900/40 transition-colors"
            >
              <PlusCircle className="w-4 h-4" />
              Multiple Choice
            </button>
            <button
              type="button"
              onClick={() => addQuestion('true-false')}
              className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-primary bg-blue-50 dark:bg-blue-900/20 rounded-lg hover:bg-blue-100 dark:hover:bg-blue-900/40 transition-colors"
            >
              <PlusCircle className="w-4 h-4" />
              True/False
            </button>
            <button
              type="button"
              onClick={() => addQuestion('code-interpretation')}
              className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-primary bg-blue-50 dark:bg-blue-900/20 rounded-lg hover:bg-blue-100 dark:hover:bg-blue-900/40 transition-colors"
            >
              <Code className="w-4 h-4" />
              Code Interpretation
            </button>
          </div>
        </div>

        {/* Feedback Section */}
        <div className="bg-card p-6 rounded-xl shadow-sm">
          <FeedbackEditor
            feedback={feedback}
            onChange={setFeedback}
          />
        </div>

        {error && (
          <div className="text-red-600 text-sm bg-red-50 dark:bg-red-900/20 p-3 rounded-lg">
            {error}
          </div>
        )}

        {quizCode && (
          <div className="bg-green-50 p-4 rounded-lg">
            <h3 className="text-lg font-semibold text-green-700 mb-2">Quiz Created Successfully!</h3>
            <p className="text-green-600">Your quiz code is: <span className="font-mono font-bold">{quizCode}</span></p>
            <p className="text-green-600 text-sm mt-2">Share this code with course owners to import your quiz.</p>
          </div>
        )}

        <div className="flex justify-end gap-4">
          <button
            type="button"
            onClick={() => navigate('/quizzes')}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={isSubmitting || questions.length === 0}
            className="px-6 py-2 text-sm font-medium text-white bg-primary rounded-lg hover:bg-blue-600 transition-colors disabled:opacity-50"
          >
            {isSubmitting ? 'Saving...' : quizId ? 'Save Changes' : 'Create Quiz'}
          </button>
        </div>
      </form>
    </div>
  );
}
