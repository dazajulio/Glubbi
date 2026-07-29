const fs = require('fs');
const env = fs.readFileSync('.env.local', 'utf8').split('\n').reduce((acc, line) => {
  const [key, val] = line.split('=');
  if(key) acc[key] = val;
  return acc;
}, {});
const { createClient } = require('@supabase/supabase-js');
const supabase = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY);
async function run() {
  const { data: p } = await supabase.from('products').select('*').limit(1);
  console.log('PRODUCTS COLUMNS:', Object.keys(p[0] || {}));
  const { data: r } = await supabase.from('restaurants').select('*').limit(1);
  console.log('RESTAURANTS COLUMNS:', Object.keys(r[0] || {}));
}
run();
