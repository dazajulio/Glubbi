const fs = require('fs');
const env = fs.readFileSync('.env.local', 'utf8').split('\n').reduce((acc, line) => {
  const [key, val] = line.split('=');
  if(key) acc[key] = val;
  return acc;
}, {});
const { createClient } = require('@supabase/supabase-js');
const supabase = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY);
async function run() {
  const { data: c } = await supabase.from('glubbi_customers').select('*').limit(1);
  console.log('GLUBBI CUSTOMERS COLUMNS:', Object.keys(c[0] || {}));
}
run();
