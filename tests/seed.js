import { createClient } from '@supabase/supabase-js';
import { config as dotenvConfig } from 'dotenv';
import path from 'path';

// Load both environment files
dotenvConfig({ path: path.resolve(process.cwd(), '.env') });
dotenvConfig({ path: path.resolve(process.cwd(), '.env.test'), override: true });

const SUPABASE_URL = process.env.VITE_SUPABASE_URL;
const SUPABASE_KEY = process.env.VITE_SUPABASE_PUBLISHABLE_KEY; // Anon key

if (!SUPABASE_URL || !SUPABASE_KEY) {
  console.error("❌ ERREUR: VITE_SUPABASE_URL ou VITE_SUPABASE_PUBLISHABLE_KEY manquant dans le fichier .env");
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

const ADMIN_EMAIL = process.env.ADMIN_EMAIL || 'admin@cosumar.test';
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'Admin1234!';

const CLIENT_EMAIL = process.env.CLIENT_EMAIL || 'client@cosumar.test';
const CLIENT_PASSWORD = process.env.CLIENT_PASSWORD || 'Client1234!';

async function createUser(email, password, role, firstName, lastName) {
  console.log(`Création de l'utilisateur ${role} (${email})...`);
  
  // Attempt to sign up
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        first_name: firstName,
        last_name: lastName,
        role: role
      }
    }
  });

  if (error) {
    if (error.message.includes('already registered') || error.message.includes('User already exists')) {
      console.log(`✅ L'utilisateur ${email} existe déjà.`);
      return;
    }
    console.error(`❌ Erreur lors de la création de ${email}:`, error.message);
    return;
  }

  if (data.user && data.user.identities && data.user.identities.length === 0) {
    console.log(`✅ L'utilisateur ${email} existe déjà (détecté via identities).`);
  } else if (data.session) {
    console.log(`✅ Utilisateur ${email} créé et confirmé automatiquement !`);
  } else {
    console.log(`⚠️ Utilisateur ${email} créé MAIS nécessite une confirmation d'email.`);
    console.log(`➡️ Vous devez aller dans le dashboard Supabase (Authentication -> Users) et désactiver "Confirm email" ou confirmer l'utilisateur manuellement.`);
  }
}

async function run() {
  console.log("=== Création des utilisateurs de test Supabase ===");
  await createUser(ADMIN_EMAIL, ADMIN_PASSWORD, 'admin', 'Admin', 'Test');
  await createUser(CLIENT_EMAIL, CLIENT_PASSWORD, 'client', 'Client', 'Test');
  console.log("=== Terminé ===");
}

run();
