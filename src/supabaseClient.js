import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://ngsccrvfrcbooluxrmew.supabase.co'
const supabaseAnonKey = 'sb_publishable_IGmWBIvUiTxqGFqwrmCXMg_z_K1KH2t'

export const supabase = createClient(supabaseUrl, supabaseAnonKey)