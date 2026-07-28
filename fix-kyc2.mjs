import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  'https://oxjbswrcdhlbifgsnhll.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im94amJzd3JjZGhsYmlmZ3NuaGxsIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4MzcyNjI3NiwiZXhwIjoyMDk5MzAyMjc2fQ.Pcx4CyDAqO0-2X17Nr5cyI0ZETjLnaijHLRpqk0KrYw'
);

async function run() {
  console.log('Fijando kyc_status = verified');
  const { error } = await supabase
    .from('restaurants')
    .update({ kyc_status: 'verified' })
    .in('kyc_status', ['approved', 'pending', null]);

  if (error) console.error(error);
  else console.log('Fixed to verified.');
}
run();
