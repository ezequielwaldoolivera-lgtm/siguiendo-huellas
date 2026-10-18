import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://bemuplmnrdaggxrdpvdp.supabase.co';
const supabaseAnonKey = 'sb_publishable_OH31K16wKxu8Yp-wU752Mw_JG8QfTP4';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);