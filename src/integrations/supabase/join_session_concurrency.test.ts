import { createClient } from '@supabase/supabase-js';

/**
 * Concurrency Test for public.join_session
 * 
 * This test verifies that:
 * 1. Only one user can join a session with seat_limit = 1.
 * 2. Concurrent requests are handled safely.
 * 3. The participants counter and mapping table remain consistent.
 */

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const ANON_KEY = Deno.env.get('SUPABASE_ANON_KEY')!;

const adminClient = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);

async function runConcurrencyTest() {
  console.log('🚀 Starting Join Session Concurrency Test...');

  // 1. Setup: Create a session with seat_limit = 1
  const { data: session, error: sessionError } = await adminClient
    .from('sessions')
    .insert({
      title: 'Concurrency Test',
      seat_limit: 1,
      participants: 0,
      status: 'scheduled',
    })
    .select()
    .single();

  if (sessionError || !session) {
    throw new Error(`Failed to create test session: ${sessionError?.message}`);
  }

  const sessionId = session.id;
  console.log(`✅ Created test session with ID: ${sessionId} (Limit: 1)`);

  // 2. Setup: Create 10 test users
  const testUsers = [];
  for (let i = 0; i < 10; i++) {
    const email = `concurrency_test_${Date.now()}_${i}@example.com`;
    const { data: authUser, error: authError } = await adminClient.auth.admin.createUser({
      email,
      password: 'password123',
      email_confirm: true,
    });
    if (authError) throw authError;
    
    // Sign in to get a valid JWT for auth.uid()
    const { data: signInData, error: signInError } = await adminClient.auth.signInWithPassword({
        email,
        password: 'password123'
    });
    if (signInError) throw signInError;

    testUsers.push({ id: authUser.user.id, token: signInData.session.access_token });
  }
  console.log(`✅ Created 10 test users.`);

  // 3. Execution: Fire 10 concurrent join_session calls
  console.log(`🔥 Firing 10 concurrent join requests...`);
  
  const joinRequests = testUsers.map(async (userData) => {
    const userClient = createClient(SUPABASE_URL, ANON_KEY, {
        global: { headers: { Authorization: `Bearer ${userData.token}` } }
    });
    return userClient.rpc('join_session', { p_session_id: sessionId });
  });

  const results = await Promise.all(joinRequests);

  // 4. Verification
  const successes = results.filter(r => !r.error);
  const failures = results.filter(r => r.error);
  const fullErrors = failures.filter(f => f.error?.message.includes('Session is full'));

  console.log(`--- Results ---`);
  console.log(`Successes: ${successes.length}`);
  console.log(`Failures: ${failures.length}`);
  console.log(`'Session Full' Errors: ${fullErrors.length}`);

  // 5. Database State Validation
  const { data: finalSession } = await adminClient
    .from('sessions')
    .select('participants')
    .eq('id', sessionId)
    .single();

  const { count: participantsCount } = await adminClient
    .from('session_participants')
    .select('*', { count: 'exact', head: true })
    .eq('session_id', sessionId);

  console.log(`Final participants count in 'sessions' table: ${finalSession?.participants}`);
  console.log(`Total rows in 'session_participants' table: ${participantsCount}`);

  // Assertions
  const isSuccessful = 
    successes.length === 1 && 
    finalSession?.participants === 1 && 
    participantsCount === 1;

  if (isSuccessful) {
    console.log('TEST PASSED: Concurrency handled correctly.');
  } else {
    console.error('TEST FAILED: Race condition detected or unexpected state.');
    Deno.exit(1);
  }
}