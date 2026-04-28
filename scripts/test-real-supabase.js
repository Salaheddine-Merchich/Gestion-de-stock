import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = "https://oegsncksuqcesszrwtqw.supabase.co";
const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9lZ3NuY2tzdXFjZXNzenJ3dHF3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzczMTIxMTcsImV4cCI6MjA5Mjg4ODExN30.pSF1GZkOfXL_DfhXnNN1qmFBU-FcLdWZ5f-eQP2-07A";

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

async function runTests() {
  console.log("1. Checking Database Connectivity (Categories)...");
  const { data: categories, error: dbError } = await supabase.from('categories').select('*');
  if (dbError) {
    console.error("❌ DB Read Failed:", dbError.message);
  } else {
    console.log("✅ DB Read OK. Categories found:", categories.length);
  }

  console.log("2. Checking Auth...");
  const randomEmail = `salah.cosumar.${Math.floor(Math.random() * 10000)}@gmail.com`;
  const { data: authData, error: authError } = await supabase.auth.signUp({
    email: randomEmail,
    password: "password123!",
    options: {
      data: { first_name: "Test", last_name: "User", role: "client" }
    }
  });
  if (authError) {
    console.error("❌ Auth Failed:", authError.message);
  } else {
    console.log("✅ Auth OK. User created:", authData.user?.id);
  }
}

runTests();
