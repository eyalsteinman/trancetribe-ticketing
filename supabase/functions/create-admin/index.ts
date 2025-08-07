import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  console.log('Create admin function called with method:', req.method)
  
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    // Create a Supabase admin client
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    // Get the authorization header
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'No authorization header' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    // Verify the caller is an admin
    const token = authHeader.replace('Bearer ', '')
    console.log('Verifying user with token...')
    
    const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(token)
    
    if (authError || !user) {
      console.error('Auth verification failed:', authError)
      return new Response(JSON.stringify({ error: 'Unauthorized: ' + (authError?.message || 'No user found') }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    console.log('User verified:', user.id)

    // Check if user has admin role using the new is_admin function
    console.log('Checking admin role for user:', user.id)
    
    const { data: isAdmin, error: roleCheckError } = await supabaseAdmin
      .rpc('is_admin', { _user_id: user.id })

    console.log('Admin check result:', { isAdmin, roleCheckError })

    if (roleCheckError) {
      console.error('Role check error:', roleCheckError)
      return new Response(JSON.stringify({ error: 'Role check failed: ' + roleCheckError.message }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    if (!isAdmin) {
      console.log('User is not admin, denying access')
      return new Response(JSON.stringify({ error: 'Not authorized as admin' }), {
        status: 403,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    console.log('Admin verification successful')

    // Parse request body
    const { email, password } = await req.json()
    
    if (!email || !password) {
      return new Response(JSON.stringify({ error: 'Email and password are required' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    // Create the user with email verification bypassed using admin privileges
    console.log('Creating new user with email:', email)
    
    const { data: newUser, error: createError } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true, // Bypass email verification
      phone_confirm: true, // Bypass phone verification  
      app_metadata: {
        provider: 'email',
        providers: ['email'],
        email_verified: true // Mark as verified
      },
      user_metadata: {
        display_name: email.split('@')[0],
        email_confirmed: true // Additional confirmation flag
      }
    })

    console.log('User creation result:', { 
      success: !!newUser.user, 
      userId: newUser.user?.id,
      error: createError?.message 
    })

    if (createError) {
      console.error('User creation failed:', createError)
      return new Response(JSON.stringify({ error: createError.message }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    if (newUser.user) {
      console.log('Adding admin role to user:', newUser.user.id)
      
      // Add admin role
      const { error: roleError } = await supabaseAdmin
        .from('user_roles')
        .insert({
          user_id: newUser.user.id,
          role: 'admin'
        })

      console.log('Role assignment result:', { error: roleError?.message })

      if (roleError) {
        console.error('Failed to assign admin role:', roleError)
        return new Response(JSON.stringify({ error: 'Failed to assign admin role: ' + roleError.message }), {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        })
      }

      return new Response(JSON.stringify({ 
        success: true, 
        user: {
          id: newUser.user.id,
          email: newUser.user.email
        },
        message: 'Admin created successfully with immediate access'
      }), {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    return new Response(JSON.stringify({ error: 'Failed to create user' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })

  } catch (error) {
    console.error('Unexpected error:', error)
    return new Response(JSON.stringify({ 
      error: 'Internal server error', 
      details: error.message 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})