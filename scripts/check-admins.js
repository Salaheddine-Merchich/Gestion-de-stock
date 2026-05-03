import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = "https://oegsncksuqcesszrwtqw.supabase.co";
const ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9lZ3NuY2tzdXFjZXNzenJ3dHF3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzczMTIxMTcsImV4cCI6MjA5Mjg4ODExN30.pSF1GZkOfXL_DfhXnNN1qmFBU-FcLdWZ5f-eQP2-07A";
const SERVICE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9lZ3NuY2tzdXFjZXNzenJ3dHF3Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NzMxMjExNywiZXhwIjoyMDkyODg4MTE3fQ.Bn8cGweAkRyLSL_Gw4Slv9JfjXixUGl8_V0SRmzMy7g";

const supabase = createClient(SUPABASE_URL, SERVICE_KEY);

async function checkAdmins() {
  const { data: admins, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('role', 'admin');

  if (error) {
    console.error('Error:', error);
    return;
  }

  console.log('Admins found:', admins.length);
  admins.forEach(a => console.log(`- ${a.user_id} (${a.first_name} ${a.last_name})`));
}

checkAdmins();
