import { createClient } from '@supabase/supabase-js';
const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);
async function run() {
  await supabase.from('restaurants').update({ kyc_status: 'verified' }).eq('kyc_status', 'aprobado');
  await supabase.from('restaurants').update({ kyc_status: 'pending_review' }).eq('kyc_status', 'en_proceso');
  await supabase.from('restaurants').update({ kyc_status: 'rejected' }).eq('kyc_status', 'rechazado');
  console.log('Fixed kyc_status values in DB');
}
run();
