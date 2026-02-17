
import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// Load env vars manually
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const envPath = path.resolve(__dirname, '../.env');

console.log(`Reading env from ${envPath}`);

let envVars = {};
try {
    const envFile = fs.readFileSync(envPath, 'utf8');
    envFile.split('\n').forEach(line => {
        const match = line.match(/^([^=]+)=(.*)$/);
        if (match) {
            let key = match[1].trim();
            let value = match[2].trim();
            // Remove quotes if present
            if (value.startsWith('"') && value.endsWith('"')) {
                value = value.slice(1, -1);
            }
            envVars[key] = value;
        }
    });
} catch (e) {
    console.error('Failed to read .env file:', e);
    process.exit(1);
}

const SUPABASE_URL = envVars.VITE_SUPABASE_URL;
const SUPABASE_KEY = envVars.VITE_SUPABASE_PUBLISHABLE_KEY; // Anon key

if (!SUPABASE_URL || !SUPABASE_KEY) {
    console.error('Missing Supabase credentials in .env');
    console.log('Found vars:', Object.keys(envVars));
    process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

async function testReviewFlow() {
    console.log('--- Starting Review Automation Test ---');

    // 1. Check if we can write to DB
    /*
       Note: The policy "System can insert review requests" is:
       TO authenticated
       WITH CHECK (true);
  
       If we use the ANON key, we are NOT authenticated unless we sign in.
       If we don't sign in, we are 'anon'.
       If there is no policy for 'anon', we cannot insert.
       
       Let's see if we can sign in anonymously? Supabase doesn't support anonymous sign in by default unless enabled?
       Or maybe we can sign in with a test user?
       
       But wait, the 'scheduleReviewRequest' function in the app is called after checkout.
       Is the user logged in then?
       If NOT, then the app logic is flawed because `anon` users can't insert.
       
       Let's try to insert. If it fails, that confirms we need to fix the policy to allow 'anon' or service_role.
       (Since we don't have service_role key in .env, we verify the app's capability).
    */

    const testOrder = {
        customer_email: 'test-automation@example.com',
        customer_name: 'Test Verify User',
        order_number: 'TEST-VERIFY-001',
        scheduled_date: new Date(Date.now() - 1000).toISOString(),
        status: 'pending'
        // Intentionally omitting order_id if possible, or using an arbitrary UUID if not constrained by FK.
        // The table has: order_id UUID REFERENCES orders(id) ON DELETE CASCADE
        // If we don't provide it, it defaults to NULL?
        // It is NOT marked NOT NULL in the migration?
        // "order_id UUID REFERENCES orders(id) ON DELETE CASCADE," -> It is nullable.
    };

    console.log('Attempting to insert review request (as anon)...');
    const { data: requestData, error: insertError } = await supabase
        .from('review_requests')
        .insert(testOrder)
        .select();

    if (insertError) {
        console.error('❌ Insert failed (Expected if anon policy missing):', insertError);
        // If this fails, we cannot proceed with testing the Edge Function via DB trigger logic (if any).
        // But the Edge Function logic reads from DB:
        // const { data: pendingRequests } = await supabase.from("review_requests")...
        // So if we can't insert, the Edge Function won't find anything.

        // Can we call the Edge Function anyway?
        // Yes, but it won't send emails if no pending requests exist.
    } else {
        console.log('✅ Insert successful:', requestData);
    }

    // 2. Trigger Edge Function
    // We try to trigger it regardless of insert success, to see if we can reach it.
    console.log('Triggering Edge Function...');
    const functionUrl = `${SUPABASE_URL}/functions/v1/send-review-emails`;

    try {
        const response = await fetch(functionUrl, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${SUPABASE_KEY}`,
                'Content-Type': 'application/json'
            }
        });

        // It might return 200 even if no emails sent
        const text = await response.text();
        console.log(`Edge Function Status: ${response.status}`);
        console.log('Response:', text);

    } catch (err) {
        console.error('❌ Failed to call Edge Function:', err);
    }
}

testReviewFlow();
