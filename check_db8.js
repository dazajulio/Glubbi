const fs = require('fs');
const env = fs.readFileSync('.env.local', 'utf8').split('\n').reduce((acc, line) => {
  const [key, val] = line.split('=');
  if(key) acc[key] = val;
  return acc;
}, {});
const { createClient } = require('@supabase/supabase-js');
const supabase = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.NEXT_PUBLIC_SUPABASE_ANON_KEY);
async function run() {
  const { data: c } = await supabase.from('glubbi_customers').select('id, addresses').limit(1);
  if(c && c.length > 0) {
     const { error } = await supabase.from('glubbi_customers').update({ addresses: [] }).eq('id', c[0].id);
     console.log('UPDATE ANON ERROR:', error);
  }
}
run();
