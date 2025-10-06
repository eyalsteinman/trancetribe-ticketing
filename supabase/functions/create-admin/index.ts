import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  console.log('=== CREATE ADMIN FUNCTION START ===')
  console.log('Method:', req.method)
  console.log('URL:', req.url)
  
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    console.log('Handling CORS preflight')
    return new Response(null, { headers: corsHeaders })
  }

  try {
    // Verify authentication
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      console.log('No authorization header')
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Create client for authentication check
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: authHeader } } }
    );

    // Verify user is authenticated
    const { data: { user }, error: userError } = await supabaseClient.auth.getUser();
    if (userError || !user) {
      console.log('Invalid or missing user token')
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Verify user is super admin
    const { data: adminData, error: adminError } = await supabaseClient
      .from('admin_profiles')
      .select('is_super_admin')
      .eq('user_id', user.id)
      .single();

    if (adminError || !adminData?.is_super_admin) {
      console.log('User is not super admin')
      return new Response(JSON.stringify({ error: 'Forbidden: Super admin access required' }), {
        status: 403,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    console.log('Super admin verified:', user.email)
    console.log('Creating Supabase admin client...')
    
    // Create a Supabase admin client
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

    console.log('Supabase URL:', Deno.env.get('SUPABASE_URL'))
    console.log('Service role key exists:', !!Deno.env.get('SUPABASE_SERVICE_ROLE_KEY'))

    // Parse request body
    console.log('Parsing request body...')
    const requestBody = await req.json()
    console.log('Request body:', requestBody)
    
    const { email, password } = requestBody
    
    if (!email || !password) {
      console.error('Missing email or password')
      return new Response(JSON.stringify({ 
        success: false, 
        error: 'Email and password are required' 
      }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    console.log('Creating user for email:', email)

    // Create the user with admin privileges - bypass all verification
    const { data: newUser, error: createError } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      phone_confirm: true,
      user_metadata: {
        display_name: email.split('@')[0]
      }
    })

    console.log('User creation result:', {
      success: !!newUser.user,
      userId: newUser.user?.id,
      email: newUser.user?.email,
      error: createError?.message
    })

    if (createError) {
      console.error('User creation failed:', createError)
      return new Response(JSON.stringify({ 
        success: false, 
        error: 'Failed to create user: ' + createError.message 
      }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    if (!newUser.user) {
      console.error('No user returned from creation')
      return new Response(JSON.stringify({ 
        success: false, 
        error: 'User creation returned no user object' 
      }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const userId = newUser.user.id
    console.log('User created successfully with ID:', userId)

    // Manually create profile (bypass trigger issues)
    console.log('Creating profile...')
    const { error: profileError } = await supabaseAdmin
      .from('profiles')
      .insert({
        user_id: userId,
        email: email,
        display_name: email.split('@')[0],
        first_name: '',
        last_name: ''
      })

    if (profileError) {
      console.error('Profile creation failed:', profileError)
      // Don't fail the whole operation, just log it
    } else {
      console.log('Profile created successfully')
    }

    // Add user role first
    console.log('Adding user role...')
    const { error: userRoleError } = await supabaseAdmin
      .from('user_roles')
      .insert({
        user_id: userId,
        role: 'user'
      })

    if (userRoleError) {
      console.error('User role assignment failed:', userRoleError)
    } else {
      console.log('User role assigned successfully')
    }

    // Add admin role
    console.log('Adding admin role...')
    const { error: adminRoleError } = await supabaseAdmin
      .from('user_roles')
      .insert({
        user_id: userId,
        role: 'admin'
      })

    if (adminRoleError) {
      console.error('Admin role assignment failed:', adminRoleError)
      return new Response(JSON.stringify({ 
        success: false, 
        error: 'Failed to assign admin role: ' + adminRoleError.message 
      }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    console.log('Admin role assigned successfully')
    console.log('=== CREATE ADMIN FUNCTION SUCCESS ===')

    return new Response(JSON.stringify({ 
      success: true, 
      user: {
        id: userId,
        email: email
      },
      message: 'Admin created successfully'
    }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })

  } catch (error) {
    console.error('=== CREATE ADMIN FUNCTION ERROR ===')
    console.error('Unexpected error:', error)
    console.error('Error stack:', error.stack)
    
    return new Response(JSON.stringify({ 
      success: false,
      error: 'Internal server error: ' + error.message,
      details: error.stack
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})