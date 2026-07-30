const fs = require('fs');
const env = fs.readFileSync('.env.local', 'utf8').split('\n').reduce((acc, line) => {
  const [key, val] = line.split('=');
  if(key) acc[key] = val;
  return acc;
}, {});
const { createClient } = require('@supabase/supabase-js');
const supabase = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.NEXT_PUBLIC_SUPABASE_ANON_KEY);
async function run() {
  const { data: o } = await supabase.from('orders').select('id, status').limit(1);
  if(o && o.length > 0) {
     const { error } = await supabase.from('orders').update({ status: o[0].status }).eq('id', o[0].id);
     console.log('UPDATE ANON ERROR:', error);
  } else {
     console.log('NO ORDERS FOUND');
  }
}
run();
