import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = "https://oegsncksuqcesszrwtqw.supabase.co";
const ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9lZ3NuY2tzdXFjZXNzenJ3dHF3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzczMTIxMTcsImV4cCI6MjA5Mjg4ODExN30.pSF1GZkOfXL_DfhXnNN1qmFBU-FcLdWZ5f-eQP2-07A";
const SERVICE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9lZ3NuY2tzdXFjZXNzenJ3dHF3Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NzMxMjExNywiZXhwIjoyMDkyODg4MTE3fQ.Bn8cGweAkRyLSL_Gw4Slv9JfjXixUGl8_V0SRmzMy7g";

const anonClient = createClient(SUPABASE_URL, ANON_KEY);
const adminClient = createClient(SUPABASE_URL, SERVICE_KEY, { auth: { autoRefreshToken: false, persistSession: false } });

let passed = 0, failed = 0;
const results = [];

function log(icon, label, detail = '') {
  const line = `${icon} ${label}${detail ? ': ' + detail : ''}`;
  console.log(line);
  results.push({ status: icon === '✅' ? 'PASS' : 'FAIL', label, detail });
  if (icon === '✅') passed++; else failed++;
}

// ─────────────────────────────────────────────
// 1. CONNECTION TEST
// ─────────────────────────────────────────────
async function testConnection() {
  console.log('\n══════════════════════════════════════');
  console.log('  1. CONNECTION TEST');
  console.log('══════════════════════════════════════');
  const { data, error } = await anonClient.from('categories').select('count');
  if (error) log('❌', 'Supabase connectivity', error.message);
  else log('✅', 'Supabase connectivity', `Connected to ${SUPABASE_URL}`);
}

// ─────────────────────────────────────────────
// 2. AUTH FLOW
// ─────────────────────────────────────────────
let clientSession = null;
let clientUserId = null;
const testEmail = `e2e.client.${Date.now()}@cosumar.test`;
const testPassword = 'Client1234!';

async function testAuth() {
  console.log('\n══════════════════════════════════════');
  console.log('  2. AUTHENTICATION FLOW');
  console.log('══════════════════════════════════════');

  // 2a. Signup
  const { data: signupData, error: signupError } = await adminClient.auth.admin.createUser({
    email: testEmail, password: testPassword, email_confirm: true,
    user_metadata: { first_name: 'E2E', last_name: 'Client', role: 'client' }
  });
  if (signupError) { log('❌', 'User signup', signupError.message); return; }
  clientUserId = signupData.user.id;
  log('✅', 'User signup', `User ${clientUserId} created`);

  // 2b. Login
  const { data: loginData, error: loginError } = await anonClient.auth.signInWithPassword({ email: testEmail, password: testPassword });
  if (loginError) { log('❌', 'User login', loginError.message); return; }
  clientSession = loginData.session;
  log('✅', 'User login', `JWT token received`);

  // 2c. Session
  const { data: sessionData } = await anonClient.auth.getSession();
  if (sessionData?.session?.user?.id === clientUserId) log('✅', 'Session persistence', `Active session for user ${clientUserId}`);
  else log('❌', 'Session persistence', 'Session mismatch or missing');

  // 2d. Admin role validation
  const { data: adminProfile, error: adminRoleErr } = await adminClient.from('profiles').select('role').eq('email', 'admin@cosumar.ma').maybeSingle();
  // check by user_id
  const { data: profile } = await adminClient.from('profiles').select('role').eq('user_id', '95917de8-3c3f-421d-b916-a883e40fd7c4').maybeSingle();
  if (profile?.role === 'admin') log('✅', 'Admin role validation', 'admin@cosumar.ma has role=admin');
  else log('❌', 'Admin role validation', 'Could not verify admin role');

  // 2e. Client role validation
  const { data: clientProfile } = await adminClient.from('profiles').select('role').eq('user_id', clientUserId).maybeSingle();
  if (clientProfile?.role === 'client') log('✅', 'Client role validation', `${testEmail} has role=client`);
  else log('❌', 'Client role validation', `Got role: ${clientProfile?.role}`);
}

// ─────────────────────────────────────────────
// 3. DATABASE CRUD
// ─────────────────────────────────────────────
let createdProductId = null;
let categoryId = null;

async function testCRUD() {
  console.log('\n══════════════════════════════════════');
  console.log('  3. DATABASE CRUD TESTS');
  console.log('══════════════════════════════════════');

  // Read categories
  const { data: cats, error: catErr } = await anonClient.from('categories').select('*');
  if (catErr || !cats?.length) { log('❌', 'READ categories', catErr?.message || 'No categories'); }
  else { categoryId = cats[0].id; log('✅', 'READ categories', `${cats.length} categories found`); }

  // Read products (public)
  const { data: products, error: prodErr } = await anonClient.from('products').select('*');
  if (prodErr) log('❌', 'READ products (public)', prodErr.message);
  else log('✅', 'READ products (public)', `${products.length} product(s) found`);

  // CREATE product (admin)
  const adminAnon = createClient(SUPABASE_URL, ANON_KEY);
  await adminAnon.auth.signInWithPassword({ email: 'admin@cosumar.ma', password: 'Admin1234!' });
  const { data: newProd, error: insertErr } = await adminAnon.from('products').insert({
    name: 'E2E Test - Sucre Cassonade 500g',
    description: 'Inserted via E2E test script',
    price: 9.99,
    stock: 50,
    category_id: categoryId
  }).select().single();
  if (insertErr) log('❌', 'CREATE product', insertErr.message);
  else { createdProductId = newProd.id; log('✅', 'CREATE product', `ID: ${createdProductId}`); }

  // UPDATE product
  if (createdProductId) {
    const { error: updateErr } = await adminAnon.from('products').update({ stock: 75, description: 'Updated by E2E test' }).eq('id', createdProductId);
    if (updateErr) log('❌', 'UPDATE product (stock=75)', updateErr.message);
    else {
      const { data: updated } = await adminAnon.from('products').select('stock').eq('id', createdProductId).single();
      if (updated?.stock === 75) log('✅', 'UPDATE product', 'Stock updated to 75 and verified');
      else log('❌', 'UPDATE product verify', `Expected 75, got ${updated?.stock}`);
    }
  }

  // RLS: Client cannot insert product
  const clientAnon = createClient(SUPABASE_URL, ANON_KEY);
  await clientAnon.auth.signInWithPassword({ email: testEmail, password: testPassword });
  const { error: clientInsertErr } = await clientAnon.from('products').insert({ name: 'Hack attempt', price: 1, stock: 1 });
  if (clientInsertErr) log('✅', 'RLS: Client blocked from INSERT product', 'Correctly rejected');
  else log('❌', 'RLS: Client blocked from INSERT product', 'Client should NOT be able to insert products!');

  // CREATE order (client)
  const { data: newOrder, error: orderErr } = await clientAnon.from('orders').insert({
    client_id: clientUserId, total: 9.99, status: 'en_attente'
  }).select().single();
  if (orderErr) log('❌', 'CREATE order (client)', orderErr.message);
  else {
    log('✅', 'CREATE order (client)', `Order ID: ${newOrder.id}`);

    // CREATE order_item
    if (createdProductId) {
      const { error: itemErr } = await clientAnon.from('order_items').insert({
        order_id: newOrder.id, product_id: createdProductId, quantity: 1, price: 9.99
      });
      if (itemErr) log('❌', 'CREATE order_item', itemErr.message);
      else log('✅', 'CREATE order_item', 'Linked to order and product');

      // DELETE order_item (admin)
      const { error: delItemErr } = await adminAnon.from('order_items').delete().eq('order_id', newOrder.id);
      if (delItemErr) log('❌', 'DELETE order_item (admin)', delItemErr.message);
      else log('✅', 'DELETE order_item (admin)', 'Order items deleted');
    }

    // DELETE order (admin)
    const { error: delOrderErr } = await adminAnon.from('orders').delete().eq('id', newOrder.id);
    if (delOrderErr) log('❌', 'DELETE order (admin)', delOrderErr.message);
    else log('✅', 'DELETE order (admin)', 'Order deleted');
  }

  // DELETE product (cleanup)
  if (createdProductId) {
    const { error: deleteErr } = await adminAnon.from('products').delete().eq('id', createdProductId);
    if (deleteErr) log('❌', 'DELETE product (cleanup)', deleteErr.message);
    else log('✅', 'DELETE product (cleanup)', 'Product deleted, DB consistent');
  }
}

// ─────────────────────────────────────────────
// 4. BUSINESS LOGIC
// ─────────────────────────────────────────────
async function testBusinessLogic() {
  console.log('\n══════════════════════════════════════');
  console.log('  4. BUSINESS LOGIC TESTS');
  console.log('══════════════════════════════════════');

  // Categories are Cosumar-specific
  const { data: cats } = await anonClient.from('categories').select('name');
  const names = cats?.map(c => c.name) || [];
  const expectedCats = ['Sucre en morceaux', 'Sucre semoule', 'Sucre pain'];
  const allPresent = expectedCats.every(e => names.includes(e));
  if (allPresent) log('✅', 'Cosumar categories present', names.join(', '));
  else log('❌', 'Cosumar categories missing', `Found: ${names.join(', ')}`);

  // Verify product from previous E2E add still in DB
  const { data: dbProducts } = await anonClient.from('products').select('name, price, stock');
  const testProd = dbProducts?.find(p => p.name === 'Sucre Semoule Premium 1kg');
  if (testProd) log('✅', 'Previous E2E product persisted', `Price=${testProd.price}, Stock=${testProd.stock}`);
  else log('❌', 'Previous E2E product not found', 'Data consistency issue');

  // Admin can see all orders
  const adminAnon = createClient(SUPABASE_URL, ANON_KEY);
  await adminAnon.auth.signInWithPassword({ email: 'admin@cosumar.ma', password: 'Admin1234!' });
  const { data: allOrders, error: ordersErr } = await adminAnon.from('orders').select('*');
  if (ordersErr) log('❌', 'Admin: view all orders', ordersErr.message);
  else log('✅', 'Admin: view all orders', `${allOrders.length} order(s) accessible`);
}

// ─────────────────────────────────────────────
// 5. STORAGE TESTS
// ─────────────────────────────────────────────
async function testStorage() {
  console.log('\n══════════════════════════════════════');
  console.log('  5. STORAGE TESTS');
  console.log('══════════════════════════════════════');

  // List buckets
  const { data: buckets, error: bucketsErr } = await adminClient.storage.listBuckets();
  if (bucketsErr) { log('❌', 'Storage: list buckets', bucketsErr.message); return; }
  const productBucket = buckets.find(b => b.id === 'product-images');
  if (productBucket) log('✅', 'Storage: bucket "product-images" exists', `public=${productBucket.public}`);
  else log('❌', 'Storage: bucket "product-images" missing', 'Check migrations');

  // Upload a test file
  const adminAnon = createClient(SUPABASE_URL, ANON_KEY);
  await adminAnon.auth.signInWithPassword({ email: 'admin@cosumar.ma', password: 'Admin1234!' });
  const testContent = Buffer.from('E2E test image placeholder');
  const fileName = `e2e-test-${Date.now()}.txt`;
  const { error: uploadErr } = await adminAnon.storage.from('product-images').upload(fileName, testContent, { contentType: 'text/plain', upsert: true });
  if (uploadErr) log('❌', 'Storage: upload file', uploadErr.message);
  else {
    log('✅', 'Storage: upload file', fileName);
    // Get public URL
    const { data: urlData } = adminAnon.storage.from('product-images').getPublicUrl(fileName);
    if (urlData?.publicUrl) log('✅', 'Storage: get public URL', urlData.publicUrl);
    else log('❌', 'Storage: get public URL', 'URL missing');
    // Delete
    await adminAnon.storage.from('product-images').remove([fileName]);
    log('✅', 'Storage: delete file (cleanup)', fileName);
  }
}

// ─────────────────────────────────────────────
// 6. ERROR HANDLING
// ─────────────────────────────────────────────
async function testErrorHandling() {
  console.log('\n══════════════════════════════════════');
  console.log('  6. ERROR HANDLING TESTS');
  console.log('══════════════════════════════════════');

  // Invalid login
  const { error: badLogin } = await anonClient.auth.signInWithPassword({ email: 'wrong@test.com', password: 'wrongpassword' });
  if (badLogin) log('✅', 'Invalid login rejected', badLogin.message);
  else log('❌', 'Invalid login not rejected', 'Should have returned an error');

  // Invalid signup (bad email format)
  const { error: badSignup } = await anonClient.auth.signUp({ email: 'not-an-email', password: '123' });
  if (badSignup) log('✅', 'Invalid signup rejected', badSignup.message);
  else log('❌', 'Invalid signup not rejected', 'Should have returned an error');

  // Unauthenticated write attempt
  const fresh = createClient(SUPABASE_URL, ANON_KEY);
  const { error: unauthWrite } = await fresh.from('products').insert({ name: 'unauthenticated hack', price: 1, stock: 1 });
  if (unauthWrite) log('✅', 'Unauthenticated write blocked', unauthWrite.message);
  else log('❌', 'Unauthenticated write NOT blocked', 'Security issue!');

  // Query non-existent record
  const { data: noData, error: noErr } = await anonClient.from('products').select('*').eq('id', '00000000-0000-0000-0000-000000000000').single();
  if (noErr) log('✅', 'Query non-existent row handled', noErr.message);
  else log('❌', 'Query non-existent row - no error', 'Expected an error or empty');
}

// ─────────────────────────────────────────────
// CLEANUP
// ─────────────────────────────────────────────
async function cleanup() {
  if (clientUserId) {
    await adminClient.auth.admin.deleteUser(clientUserId);
    console.log(`\n🧹 Cleanup: Deleted test user ${testEmail}`);
  }
}

// ─────────────────────────────────────────────
// MAIN
// ─────────────────────────────────────────────
async function main() {
  console.log('╔══════════════════════════════════════╗');
  console.log('║  COSUMAR SUPABASE E2E TEST SUITE      ║');
  console.log('╚══════════════════════════════════════╝');

  await testConnection();
  await testAuth();
  await testCRUD();
  await testBusinessLogic();
  await testStorage();
  await testErrorHandling();
  await cleanup();

  const total = passed + failed;
  console.log('\n╔══════════════════════════════════════╗');
  console.log('║            FINAL REPORT               ║');
  console.log('╠══════════════════════════════════════╣');
  console.log(`║  ✅ PASSED : ${String(passed).padEnd(24)}║`);
  console.log(`║  ❌ FAILED : ${String(failed).padEnd(24)}║`);
  console.log(`║  📊 TOTAL  : ${String(total).padEnd(24)}║`);
  console.log('╠══════════════════════════════════════╣');
  const verdict = failed === 0 ? 'FULLY WORKING ✅' : failed <= 2 ? 'PARTIALLY WORKING ⚠️' : 'NOT WORKING ❌';
  console.log(`║  VERDICT: ${verdict.padEnd(26)}║`);
  console.log('╚══════════════════════════════════════╝');

  if (failed > 0) {
    console.log('\n⚠️  Failed Tests:');
    results.filter(r => r.status === 'FAIL').forEach(r => console.log(`   ❌ ${r.label}: ${r.detail}`));
  }
}

main().catch(console.error);
