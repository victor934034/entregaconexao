const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY);

async function probeColumns() {
    try {
        console.log("Probing columns by inserting a minimal record...");

        const { data, error } = await supabase
            .from('estoque')
            .insert([{ nome: 'PROBE_TEST', quantidade: 0 }])
            .select();

        if (error) {
            console.error('Insert failed:', error.message);
        } else {
            console.log('Insert SUCCEEDED! Available columns:', Object.keys(data[0]));
            // Cleanup
            await supabase.from('estoque').delete().eq('nome', 'PROBE_TEST');
        }

    } catch (e) {
        console.error('Exception:', e.message);
    }
}

probeColumns();
