
import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// Load env vars manually
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const envPath = path.resolve(__dirname, '../.env');
const envVars = {};

try {
    const envFile = fs.readFileSync(envPath, 'utf8');
    envFile.split('\n').forEach(line => {
        const match = line.match(/^([^=]+)=(.*)$/);
        if (match) {
            let val = match[2].trim();
            if (val.startsWith('"') && val.endsWith('"')) val = val.slice(1, -1);
            envVars[match[1].trim()] = val;
        }
    });
} catch (e) {
    console.error('Failed to read .env', e);
    process.exit(1);
}

const supabase = createClient(envVars.VITE_SUPABASE_URL, envVars.VITE_SUPABASE_PUBLISHABLE_KEY);

async function checkRequests() {
    console.log('Checking review_requests table...');

    const { data, error } = await supabase
        .from('review_requests')
        .select('*')
        .limit(10);

    if (error) {
        console.error('Error selecting:', error);
    } else {
        console.log(`Found ${data.length} requests:`);
        console.log(JSON.stringify(data, null, 2));
    }
}

checkRequests();
