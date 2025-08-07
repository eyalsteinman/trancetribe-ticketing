import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.53.0'
import { corsHeaders } from '../_shared/cors.ts'

console.log("Delete User function initialized")

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log("Processing delete user request")
    
    // Create Supabase client with service role key
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    )

    // Get the user ID from request body
    const { userId } = await req.json()
    
    if (!userId) {
      console.error("No userId provided")
      return new Response(
        JSON.stringify({ success: false, error: 'User ID is required' }),
        { 
          status: 400, 
          headers: { 
            ...corsHeaders, 
            'Content-Type': 'application/json' 
          } 
        }
      )
    }

    console.log(`Attempting to delete user: ${userId}`)

    // First, delete user roles
    const { error: rolesError } = await supabaseAdmin
      .from('user_roles')
      .delete()
      .eq('user_id', userId)
    
    if (rolesError) {
      console.error('Error deleting user roles:', rolesError)
    } else {
      console.log('User roles deleted successfully')
    }

    // Delete user profile
    const { error: profileError } = await supabaseAdmin
      .from('profiles')
      .delete()
      .eq('user_id', userId)
    
    if (profileError) {
      console.error('Error deleting user profile:', profileError)
    } else {
      console.log('User profile deleted successfully')
    }

    // Finally, delete the auth user
    const { error: authError } = await supabaseAdmin.auth.admin.deleteUser(userId)
    
    if (authError) {
      console.error('Error deleting auth user:', authError)
      return new Response(
        JSON.stringify({ success: false, error: authError.message }),
        { 
          status: 500, 
          headers: { 
            ...corsHeaders, 
            'Content-Type': 'application/json' 
          } 
        }
      )
    }

    console.log('User deleted successfully from auth')

    return new Response(
      JSON.stringify({ success: true, message: 'User deleted successfully' }),
      { 
        status: 200, 
        headers: { 
          ...corsHeaders, 
          'Content-Type': 'application/json' 
        } 
      }
    )

  } catch (error) {
    console.error('Unexpected error in delete-user function:', error)
    return new Response(
      JSON.stringify({ success: false, error: 'Internal server error' }),
      { 
        status: 500, 
        headers: { 
          ...corsHeaders, 
          'Content-Type': 'application/json' 
        } 
      }
    )
  }
})