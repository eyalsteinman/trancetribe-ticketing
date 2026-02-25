import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.53.0'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const { email, password, uniquePassword } = await req.json()

    if (!email || !password || !uniquePassword) {
      return new Response(JSON.stringify({ error: 'Missing required fields' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    // Use service role to verify the admin password server-side
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      { auth: { autoRefreshToken: false, persistSession: false } }
    )

    // Check if the password is valid, not used, and not expired
    const { data: passwordData, error: passwordError } = await supabaseAdmin
      .from('admin_passwords')
      .select('*')
      .eq('admin_email', email)
      .eq('unique_password', uniquePassword)
      .eq('is_used', false)
      .gt('expires_at', new Date().toISOString())
      .maybeSingle()

    if (passwordError || !passwordData) {
      console.log('Invalid admin password attempt for:', email)
      return new Response(JSON.stringify({ error: 'Invalid or expired admin password' }), {
        status: 403,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const allowedTiles = passwordData.allowed_tiles || []

    // Create the user account
    const { data: newUser, error: createError } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: {
        display_name: email.split('@')[0],
      },
    })

    if (createError) {
      console.error('User creation failed:', createError.message)
      return new Response(JSON.stringify({ error: createError.message }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    if (!newUser.user) {
      return new Response(JSON.stringify({ error: 'User creation returned no user' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const userId = newUser.user.id

    // Mark password as used
    await supabaseAdmin
      .from('admin_passwords')
      .update({ is_used: true })
      .eq('id', passwordData.id)

    // Add admin role
    await supabaseAdmin
      .from('user_roles')
      .insert({ user_id: userId, role: 'admin' })

    // Create admin profile
    await supabaseAdmin
      .from('admin_profiles')
      .insert({
        user_id: userId,
        admin_level: 'level1',
        created_by: passwordData.created_by,
        allowed_tiles: allowedTiles,
      })

    console.log('Admin account created successfully for:', email)

    return new Response(JSON.stringify({
      success: true,
      message: 'Admin account created successfully',
    }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })

  } catch (error) {
    console.error('Unexpected error:', error)
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})
