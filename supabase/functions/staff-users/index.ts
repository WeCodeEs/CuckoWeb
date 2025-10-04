import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
}

interface StaffUser {
  uuid: string
  full_name: string
  email: string
  role: 'Administrador' | 'Operador'
  active: boolean
  created_at: string
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Get environment variables
    const supabaseUrl = Deno.env.get('SUPABASE_URL')
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')

    if (!supabaseUrl || !supabaseServiceKey) {
      console.error('Missing environment variables:', { supabaseUrl: !!supabaseUrl, supabaseServiceKey: !!supabaseServiceKey })
      return new Response(
        JSON.stringify({ error: 'Server configuration error' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Create Supabase admin client
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    })

    // Get the authorization header
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'No authorization header' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Verify the user token
    const token = authHeader.replace('Bearer ', '')
    const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(token)

    if (authError || !user) {
      console.error('Auth error:', authError)
      return new Response(
        JSON.stringify({ error: 'Invalid token' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Check if user is staff and get their role
    const { data: staffUser, error: staffError } = await supabaseAdmin
      .from('staff_users')
      .select('role, active')
      .eq('uuid', user.id)
      .single()

    if (staffError || !staffUser) {
      console.error('Staff user not found:', staffError)
      return new Response(
        JSON.stringify({ error: 'Access denied: Not a staff user' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    if (!staffUser.active) {
      return new Response(
        JSON.stringify({ error: 'Access denied: Inactive user' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Only administrators can manage users
    if (staffUser.role !== 'Administrador') {
      return new Response(
        JSON.stringify({ error: 'Access denied: Administrator role required' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const method = req.method
    const url = new URL(req.url)

    switch (method) {
      case 'GET': {
        // List all staff users
        console.log('Fetching all staff users...')
        
        const { data: staffUsers, error: fetchError } = await supabaseAdmin
          .from('staff_users')
          .select('*')
          .order('created_at', { ascending: false })

        if (fetchError) {
          console.error('Error fetching staff users:', fetchError)
          return new Response(
            JSON.stringify({ error: 'Failed to fetch users' }),
            { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          )
        }

        console.log(`Found ${staffUsers?.length || 0} staff users`)
        
        return new Response(
          JSON.stringify({ users: staffUsers || [] }),
          { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      case 'POST': {
        // Create new staff user
        const body = await req.json()
        const { email, password, full_name, role, active = true } = body

        console.log('Creating new staff user:', { email, full_name, role, active })

        // Validate input
        if (!email || !password || !full_name || !role) {
          return new Response(
            JSON.stringify({ error: 'Missing required fields: email, password, full_name, role' }),
            { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          )
        }

        if (!['Administrador', 'Operador'].includes(role)) {
          return new Response(
            JSON.stringify({ error: 'Invalid role. Must be Administrador or Operador' }),
            { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          )
        }

        if (password.length < 6) {
          return new Response(
            JSON.stringify({ error: 'Password must be at least 6 characters long' }),
            { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          )
        }

        try {
          // Create auth user
          const { data: authData, error: signUpError } = await supabaseAdmin.auth.admin.createUser({
            email,
            password,
            email_confirm: true,
            user_metadata: {
              full_name,
              role
            }
          })

          if (signUpError) {
            console.error('Error creating auth user:', signUpError)
            if (signUpError.message.includes('already registered')) {
              return new Response(
                JSON.stringify({ error: 'Email already registered' }),
                { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
              )
            }
            return new Response(
              JSON.stringify({ error: `Failed to create user: ${signUpError.message}` }),
              { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            )
          }

          if (!authData.user) {
            return new Response(
              JSON.stringify({ error: 'Failed to create user' }),
              { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            )
          }

          // Create staff user record
          const { data: newStaffUser, error: staffInsertError } = await supabaseAdmin
            .from('staff_users')
            .insert([{
              uuid: authData.user.id,
              email,
              full_name,
              role,
              active
            }])
            .select()
            .single()

          if (staffInsertError) {
            console.error('Error creating staff user record:', staffInsertError)
            // Try to clean up the auth user
            try {
              await supabaseAdmin.auth.admin.deleteUser(authData.user.id)
            } catch (cleanupError) {
              console.error('Error cleaning up auth user:', cleanupError)
            }
            return new Response(
              JSON.stringify({ error: `Failed to create staff profile: ${staffInsertError.message}` }),
              { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            )
          }

          console.log('Successfully created staff user:', newStaffUser.email)
          
          return new Response(
            JSON.stringify({ user: newStaffUser }),
            { status: 201, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          )
        } catch (error) {
          console.error('Unexpected error creating user:', error)
          return new Response(
            JSON.stringify({ error: 'Internal server error' }),
            { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          )
        }
      }

      case 'PUT': {
        // Update staff user
        const body = await req.json()
        const { id, email, password, full_name, role, active } = body

        console.log('Updating staff user:', { id, email, full_name, role, active })

        if (!id) {
          return new Response(
            JSON.stringify({ error: 'User ID is required' }),
            { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          )
        }

        // Validate role if provided
        if (role && !['Administrador', 'Operador'].includes(role)) {
          return new Response(
            JSON.stringify({ error: 'Invalid role. Must be Administrador or Operador' }),
            { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          )
        }

        // Validate password if provided
        if (password && password.length < 6) {
          return new Response(
            JSON.stringify({ error: 'Password must be at least 6 characters long' }),
            { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          )
        }

        try {
          // Update auth user if email or password changed
          if (email || password) {
            const authUpdateData: any = {}
            if (email) authUpdateData.email = email
            if (password) authUpdateData.password = password

            const { error: authUpdateError } = await supabaseAdmin.auth.admin.updateUserById(id, authUpdateData)

            if (authUpdateError) {
              console.error('Error updating auth user:', authUpdateError)
              if (authUpdateError.message.includes('already registered')) {
                return new Response(
                  JSON.stringify({ error: 'Email already registered' }),
                  { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
                )
              }
              return new Response(
                JSON.stringify({ error: `Failed to update credentials: ${authUpdateError.message}` }),
                { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
              )
            }
          }

          // Update staff user record
          const updateData: any = {}
          if (email) updateData.email = email
          if (full_name) updateData.full_name = full_name
          if (role) updateData.role = role
          if (typeof active !== 'undefined') updateData.active = active

          const { data: updatedUser, error: staffUpdateError } = await supabaseAdmin
            .from('staff_users')
            .update(updateData)
            .eq('uuid', id)
            .select()
            .single()

          if (staffUpdateError) {
            console.error('Error updating staff user:', staffUpdateError)
            return new Response(
              JSON.stringify({ error: `Failed to update user: ${staffUpdateError.message}` }),
              { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            )
          }

          console.log('Successfully updated staff user:', updatedUser.email)
          
          return new Response(
            JSON.stringify({ user: updatedUser }),
            { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          )
        } catch (error) {
          console.error('Unexpected error updating user:', error)
          return new Response(
            JSON.stringify({ error: 'Internal server error' }),
            { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          )
        }
      }

      case 'DELETE': {
        // Delete staff user
        const userId = url.searchParams.get('id')

        console.log('Deleting staff user:', userId)

        if (!userId) {
          return new Response(
            JSON.stringify({ error: 'User ID is required' }),
            { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          )
        }

        // Prevent self-deletion
        if (userId === user.id) {
          return new Response(
            JSON.stringify({ error: 'Cannot delete your own account' }),
            { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          )
        }

        try {
          // Delete staff user record (this will cascade due to foreign key constraints)
          const { error: staffDeleteError } = await supabaseAdmin
            .from('staff_users')
            .delete()
            .eq('uuid', userId)

          if (staffDeleteError) {
            console.error('Error deleting staff user:', staffDeleteError)
            return new Response(
              JSON.stringify({ error: `Failed to delete user: ${staffDeleteError.message}` }),
              { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            )
          }

          // Delete auth user
          const { error: authDeleteError } = await supabaseAdmin.auth.admin.deleteUser(userId)

          if (authDeleteError) {
            console.error('Error deleting auth user:', authDeleteError)
            // Don't return error here as staff user is already deleted
          }

          console.log('Successfully deleted staff user:', userId)
          
          return new Response(
            JSON.stringify({ success: true }),
            { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          )
        } catch (error) {
          console.error('Unexpected error deleting user:', error)
          return new Response(
            JSON.stringify({ error: 'Internal server error' }),
            { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          )
        }
      }

      default:
        return new Response(
          JSON.stringify({ error: 'Method not allowed' }),
          { status: 405, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
    }
  } catch (error) {
    console.error('Unexpected error in staff-users function:', error)
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})