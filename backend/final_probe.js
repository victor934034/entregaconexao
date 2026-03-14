const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY);

async function finalProbe() {
    try {
        console.log("Probing with ONLY 'nome'...");
        const { data, error } = await supabase
            .from('estoque')
            .insert([{ nome: 'PROBE_FINAL' }])
            .select();

        if (error) {
            console.error('Final probe failed:', error.message);
        } else {
            console.log('Final probe SUCCEEDED! Available columns:', Object.keys(data[0]));
            await supabase.from('estoque').delete().eq('nome', 'PROBE_FINAL');
        }

    } catch (e) {
        console.error('Exception:', e.message);
    }
}

finalProbe();
