import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = "https://oegsncksuqcesszrwtqw.supabase.co";
const SUPABASE_SERVICE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9lZ3NuY2tzdXFjZXNzenJ3dHF3Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NzMxMjExNywiZXhwIjoyMDkyODg4MTE3fQ.Bn8cGweAkRyLSL_Gw4Slv9JfjXixUGl8_V0SRmzMy7g";

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false }
});

async function createAdmin() {
  const email = "admin@cosumar.ma";
  const password = "Admin1234!";

  // Create user via admin API
  const { data, error } = await supabase.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: { first_name: "Admin", last_name: "Cosumar", role: "admin" }
  });

  if (error) {
    console.error("❌ Failed to create admin user:", error.message);
    return;
  }

  console.log("✅ Admin user created:", data.user.id);

  // Update their profile role to admin
  const { error: profileError } = await supabase
    .from('profiles')
    .update({ role: 'admin' })
    .eq('user_id', data.user.id);

  if (profileError) {
    console.error("❌ Failed to update profile role:", profileError.message);
  } else {
    console.log("✅ Profile role set to 'admin'");
    console.log("\n🔑 Admin credentials:");
    console.log("   Email:    ", email);
    console.log("   Password: ", password);
  }
}

createAdmin();
