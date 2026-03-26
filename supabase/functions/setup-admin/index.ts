import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, {
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
      },
    });
  }

  try {
    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const { email, password, action } = await req.json();

    if (action === "setup-initial-admin") {
      // Create the initial admin user
      const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
        email: "neifranchi@gmail.com",
        password: "Admin@123456",
        email_confirm: true,
      });

      if (authError) {
        // If user already exists, find and ensure admin role
        if (authError.message.includes("already")) {
          const { data: { users } } = await supabaseAdmin.auth.admin.listUsers();
          const existingUser = users?.find((u: any) => u.email === "neifranchi@gmail.com");
          if (existingUser) {
            await supabaseAdmin.from("user_roles").upsert({
              user_id: existingUser.id,
              role: "admin",
            }, { onConflict: "user_id,role" });
            return new Response(JSON.stringify({ success: true, message: "Admin role assigned" }), {
              headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" },
            });
          }
        }
        throw authError;
      }

      // Assign admin role
      await supabaseAdmin.from("user_roles").insert({
        user_id: authData.user.id,
        role: "admin",
      });

      return new Response(JSON.stringify({ success: true, message: "Admin created" }), {
        headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" },
      });
    }

    if (action === "create-admin-user") {
      // Verify the requesting user is neifranchi@gmail.com (super admin)
      const authHeader = req.headers.get("Authorization");
      if (!authHeader) throw new Error("Not authenticated");

      const token = authHeader.replace("Bearer ", "");
      const { data: { user: caller } } = await supabaseAdmin.auth.getUser(token);
      if (!caller || caller.email !== "neifranchi@gmail.com") {
        throw new Error("Only the super admin can create other admins");
      }

      if (!email || !password) throw new Error("Email and password required");

      const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
        email,
        password,
        email_confirm: true,
      });

      if (authError) throw authError;

      await supabaseAdmin.from("user_roles").insert({
        user_id: authData.user.id,
        role: "admin",
      });

      return new Response(JSON.stringify({ success: true }), {
        headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" },
      });
    }

    if (action === "change-password") {
      const authHeader = req.headers.get("Authorization");
      if (!authHeader) throw new Error("Not authenticated");

      const token = authHeader.replace("Bearer ", "");
      const { data: { user: caller } } = await supabaseAdmin.auth.getUser(token);
      if (!caller) throw new Error("Not authenticated");

      if (!password) throw new Error("Password required");

      const { error } = await supabaseAdmin.auth.admin.updateUserById(caller.id, {
        password,
      });

      if (error) throw error;

      return new Response(JSON.stringify({ success: true }), {
        headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" },
      });
    }

    throw new Error("Invalid action");
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 400,
      headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" },
    });
  }
});
