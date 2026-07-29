const fs = require('fs');
const env = fs.readFileSync('.env.local', 'utf8').split('\n').reduce((acc, line) => {
  const [key, val] = line.split('=');
  if(key) acc[key] = val;
  return acc;
}, {});
const { createClient } = require('@supabase/supabase-js');
const supabase = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY);
async function run() {
  const { data, error } = await supabase
          .from('products')
          .select('id, name, base_price, discount_percentage, image_url, restaurants(id, name, slug, logo_url, is_active)')
          .gt('discount_percentage', 0)
          .eq('is_available', true);
  console.log(JSON.stringify(data, null, 2));
  if (error) console.log('ERROR:', error);
}
run();
