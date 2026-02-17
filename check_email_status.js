
import { createClient } from '@supabase/supabase-js'
import * as dotenv from 'dotenv'

dotenv.config()

const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_PUBLISHABLE_KEY

if (!supabaseUrl || !supabaseKey) {
    console.error('Missing Supabase URL or Key in environment variables')
    process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseKey)

async function checkDiagnostics() {
    // 1. Check notifications table
    console.log('=== NOTIFICATIONS TABLE ===')
    const { data: notifications, error: notifError } = await supabase
        .from('notifications')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(10)

    if (notifError) {
        console.error('Error:', notifError.message)
    } else if (notifications.length === 0) {
        console.log('NO NOTIFICATIONS FOUND - function is not logging to DB')
    } else {
        notifications.forEach(n => {
            console.log(`  [${n.created_at}] Type: ${n.type} | To: ${n.to_email} | Status: ${n.status}`)
            if (n.error) console.log(`    Error: ${n.error}`)
            if (n.payload) console.log(`    Payload: ${JSON.stringify(n.payload).substring(0, 200)}`)
        })
    }

    // 2. Check recent orders
    console.log('\n=== RECENT ORDERS ===')
    const { data: orders, error: ordersError } = await supabase
        .from('orders')
        .select('id, order_number, created_at, total')
        .order('created_at', { ascending: false })
        .limit(5)

    if (ordersError) {
        console.error('Error:', ordersError.message)
    } else if (orders.length === 0) {
        console.log('NO ORDERS FOUND')
    } else {
        orders.forEach(o => {
            console.log(`  [${o.created_at}] #${o.order_number} | Total: $${o.total}`)
        })
    }

    // 3. Test function with FULL response
    console.log('\n=== TESTING SEND-NOTIFICATION FUNCTION ===')
    const projectId = process.env.VITE_SUPABASE_PROJECT_ID
    const functionUrl = `https://${projectId}.supabase.co/functions/v1/send-notification`

    try {
        const response = await fetch(functionUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${supabaseKey}`
            },
            body: JSON.stringify({
                type: "order_confirmation",
                recipientEmail: "chukwuemekaawili@gmail.com",
                recipientName: "Test User",
                data: {
                    orderNumber: "DIAG-TEST-001",
                    total: "99.99",
                    fulfillmentMethod: "Pickup",
                    preferredContact: "email",
                    recipientPhone: "555-0199"
                }
            })
        })

        const responseText = await response.text()
        console.log('HTTP Status:', response.status)
        console.log('Full Response:', responseText)
    } catch (e) {
        console.error('Fetch Error:', e.message)
    }
}

checkDiagnostics()
