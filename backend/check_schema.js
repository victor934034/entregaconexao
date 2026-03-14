const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY);

async function checkSchema() {
    try {
        console.log("Checking columns for 'estoque' table...");

        // Method 1: Try to get one row
        const { data: rowData, error: rowError } = await supabase
            .from('estoque')
            .select('*')
            .limit(1);

        if (rowData && rowData.length > 0) {
            console.log('Columns found in row:', Object.keys(rowData[0]));
        } else {
            console.log('Table is empty, trying direct SQL query check (if possible)...');
        }

        // Method 2: Use information_schema if possible (might be restricted)
        const { data: colData, error: colError } = await supabase
            .rpc('get_table_columns', { table_name: 'estoque' }); // Custom RPC if it exists

        if (colError) {
            console.log('RPC failed (expected if not defined). Error:', colError.message);

            // Fallback: try to insert a dummy item and see what happens
            console.log('Trying to insert a dummy item with "custo" to verify...');
            const { error: insError } = await supabase
                .from('estoque')
                .insert([{ nome: 'TEST_DELETE_ME', custo: 0 }])
                .select();

            if (insError) {
                console.log('Insert failed! Error:', insError.message);
                if (insError.message.includes('column "custo" of relation "estoque" does not exist')) {
                    console.log('CONFIRMED: Column "custo" is missing.');
                }
            } else {
                console.log('Insert SUCCEEDED! Column "custo" exists.');
                // Cleanup
                await supabase.from('estoque').delete().eq('nome', 'TEST_DELETE_ME');
            }
        } else {
            console.log('Columns from RPC:', colData);
        }

    } catch (e) {
        console.error('Exception:', e.message);
    }
}

checkSchema();
