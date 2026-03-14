const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY);

async function diagnose() {
    console.log('--- DIAGNOSTIC START ---');

    // 1. Check current data (ignoring RLS if possible, but we use anon key so RLS applies)
    const { data: items, error: fetchError } = await supabase
        .from('estoque')
        .select('*');

    if (fetchError) {
        console.error('Fetch Error:', fetchError);
    } else {
        console.log(`Table has ${items.length} items.`);
        if (items.length > 0) {
            console.log('Sample item:', items[0]);
            console.log('Names in DB:', items.map(i => i.nome).join(', '));
        }
    }

    // 2. Try to insert a dummy item to see what happens
    const dummy = { nome: 'TEST_DIAGNOSTIC_' + Date.now() };
    const { data: insData, error: insError } = await supabase
        .from('estoque')
        .insert([dummy]);

    if (insError) {
        console.error('Insert Error:', insError);
        console.log('Error Details:', JSON.stringify(insError, null, 2));
    } else {
        console.log('Insert Success:', insData);
    }

    console.log('--- DIAGNOSTIC END ---');
}

diagnose();
