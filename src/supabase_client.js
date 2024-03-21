import { createClient } from '@supabase/supabase-js'
import { createBrowserClient } from '@supabase/ssr'
import { createServerComponentClient } from "@supabase/auth-helpers-nextjs";


const supabaseUrl = 'https://snbsfniifqahhmmpyujy.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNuYnNmbmlpZnFhaGhtbXB5dWp5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3MTAxMjI5NDAsImV4cCI6MjAyNTY5ODk0MH0.hKiXuxJCfsTFSQiB8YbDt3WLGmLqoi_BR4q3Nn0X1rU';


// const supabase = createServerComponentClient({ cookies });


// export const supabase = createBrowserClient(
//     supabaseUrl,
//     supabaseKey
// )

export default function qq(cookies) {
    return createServerComponentClient({ cookies });
}


// const supabase = createClient(supabaseUrl, supabaseKey, {
//     auth: {
//         autoRefreshToken: false, // All my Supabase access is from server, so no need to refresh the token
//         detectSessionInUrl: false, // We are not using OAuth, so we don't need this. Also, we are manually "detecting" the session in the server-side code
//         persistSession: false, // All our access is from server, so no need to persist the session to browser's local storage
//     }
// })

// export default supabase;