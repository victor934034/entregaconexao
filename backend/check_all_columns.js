const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY);

async function checkAllPossibleColumns() {
    const columns = ['nome', 'quantidade', 'custo', 'preco_venda', 'modo_estocagem', 'foto_url'];
    const results = {};

    for (const col of columns) {
        try {
            const { error } = await supabase
                .from('estoque')
                .insert([{ [col]: 'test' }]) // Use a string to trigger type errors if column exists
                .select();

            if (error) {
                results[col] = error.message;
            } else {
                results[col] = 'PRESENT';
                // Cleanup
                await supabase.from('estoque').delete().eq(col, 'test');
            }
        } catch (e) {
            results[col] = 'EXCEPTION: ' + e.message;
        }
    }

    console.log('COLUMN RESULTS:');
    console.log(JSON.stringify(results, null, 2));
}

checkAllPossibleColumns();
