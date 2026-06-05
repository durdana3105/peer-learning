import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"

/**
 * Types for AI Chat Edge Function
 */

/** Request payload from client */
interface AIChatRequest {
  prompt: string;
  conversation_id?: string;
  limit?: number;
  offset?: number;
}

/** Supabase auth response */
interface AuthUser {
  id: string;
  email?: string;
  [key: string]: unknown;
}

interface SupabaseAuthResponse {
  data?: {
    user: AuthUser | null;
  };
  user?: AuthUser | null;
  error?: {
    message: string;
  };
}

/** OpenRouter API message format */
interface OpenRouterMessage {
  role: "user" | "assistant" | "system";
  content: string;
}

/** OpenRouter API request payload */
interface OpenRouterRequest {
  model: string;
  messages: OpenRouterMessage[];
  max_tokens: number;
  temperature: number;
}

/** OpenRouter API response format */
interface OpenRouterChoice {
  message: {
    content: string;
    role: string;
  };
  finish_reason: string;
  index: number;
}

interface OpenRouterResponse {
  id: string;
  choices: OpenRouterChoice[];
  created: number;
  model: string;
  usage?: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
}

/** Standard error response */
interface ErrorResponse {
  error: string;
}

/** CORS headers configuration */
interface HeadersConfig {
  [key: string]: string;
}

/**
 * Get CORS headers with environment-based origin
 */
function getCorsHeaders(): HeadersConfig {
  return {
    'Access-Control-Allow-Origin': Deno.env.get('FRONTEND_URL') ?? 'https://peerlearn.app',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  };
}

const corsHeaders = getCorsHeaders();

/**
 * Main handler for AI Chat Edge Function
 * Validates user authentication, validates input, and calls OpenRouter API
 */
serve(async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Require a valid Supabase JWT before processing the request
    const authHeader = req.headers.get('Authorization')
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return createJsonResponse(
        { error: 'Unauthorized' } as ErrorResponse,
        401
      )
    }

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY')

    if (!supabaseUrl || !supabaseAnonKey) {
      console.error('Missing Supabase configuration')
      return createJsonResponse(
        { error: 'Server configuration error' } as ErrorResponse,
        500
      )
    }

    const supabase = createClient(supabaseUrl, supabaseAnonKey)

    // Get authenticated user
    const { data, error: authError } = (await supabase.auth.getUser(
      authHeader.replace('Bearer ', '')
    )) as SupabaseAuthResponse

    const user = data?.user ?? null

    if (authError || !user) {
      return createJsonResponse(
        { error: 'Unauthorized' } as ErrorResponse,
        401
      )
    }

    // Parse and validate request body
    const body = await parseRequestBody(req) as AIChatRequest;
    if (!body) {
      return createJsonResponse(
        { error: 'Invalid request body' } as ErrorResponse,
        400
      )
    }

    const { prompt, conversation_id, limit = 20, offset = 0 } = body;

    // Fetch paginated chat history if a conversation ID is provided
    let history: OpenRouterMessage[] = [];
    let totalCount = 0;

    if (conversation_id) {
      const { data, error: dbError, count } = await supabase
        .from('messages')
        .select('role, content', { count: 'exact' })
        .eq('conversation_id', conversation_id)
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .range(offset, offset + limit - 1);

      if (dbError) {
        console.error('Database error:', dbError);
      } else if (data) {
        // Reverse to maintain chronological order for the AI context
        history = data.reverse() as OpenRouterMessage[];
        totalCount = count || 0;
      }
    }

    // If only history was requested (no prompt), return the messages immediately
    if (!prompt) {
      return createJsonResponse({ messages: history, total: totalCount }, 200);
    }

    // Validate prompt parameter
    const promptValidation = validatePrompt(prompt)
    if (!promptValidation.valid) {
      return createJsonResponse(
        { error: promptValidation.message } as ErrorResponse,
        400
      )
    }

    // Get OpenRouter API key
    const openRouterApiKey = Deno.env.get('OPENROUTER_API_KEY')

    if (!openRouterApiKey) {
      console.error('Missing OPENROUTER_API_KEY secret')
      return createJsonResponse(
        { error: 'Server configuration error' } as ErrorResponse,
        500
      )
    }

    // Call OpenRouter API
    const aiResponse = await callOpenRouterAPI(openRouterApiKey, prompt, history)

    return createJsonResponse({
      reply: aiResponse,
      history_count: totalCount,
      offset_used: offset
    }, 200)
  } catch (error) {
    console.error('ai-chat error:', error)
    const errorMessage = error instanceof Error ? error.message : 'An unexpected error occurred'
    return createJsonResponse(
      { error: errorMessage } as ErrorResponse,
      500
    )
  }
})

/**
 * Parse JSON request body with type safety
 */
async function parseRequestBody(req: Request): Promise<unknown> {
  try {
    return await req.json()
  } catch {
    return null
  }
}

/**
 * Validate prompt input
 */
function validatePrompt(prompt: unknown): { valid: boolean; message: string } {
  if (typeof prompt !== 'string') {
    return { valid: false, message: 'Prompt must be a string' }
  }

  if (!prompt || prompt.trim().length === 0) {
    return { valid: false, message: 'Prompt is required' }
  }

  if (prompt.length > 2000) {
    return { valid: false, message: 'Prompt cannot exceed 2000 characters' }
  }

  return { valid: true, message: '' }
}

/**
 * Call OpenRouter API with typed request and response
 */
async function callOpenRouterAPI(apiKey: string, prompt: string, history: OpenRouterMessage[] = []): Promise<OpenRouterResponse | ErrorResponse> {
  const openRouterRequest: OpenRouterRequest = {
    model: 'openai/gpt-3.5-turbo',
    messages: [
      ...history,
      { role: 'user', content: prompt }
    ],
    max_tokens: 500,
    temperature: 0.7,
  }

  const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
      'HTTP-Referer': 'https://peerlearn.app',
      'X-Title': 'Peer Learning AI',
    },
    body: JSON.stringify(openRouterRequest),
  })

  if (!response.ok) {
    throw new Error(`OpenRouter API error: ${response.statusText}`)
  }

  const data: OpenRouterResponse = await response.json()
  return data
}

/**
 * Create a JSON response with CORS headers
 */
function createJsonResponse(data: ErrorResponse | OpenRouterResponse | Record<string, unknown>, status: number): Response {
  return new Response(
    JSON.stringify(data),
    {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status,
    }
  )
}
