const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY);

async function checkSchema() {
    try {
        const { data, error } = await supabase
            .from('estoque')
            .select('*')
            .limit(1);

        if (error) {
            console.error('Error fetching data:', error);
        } else {
            console.log('Sample item (keys represent columns):', data[0] ? Object.keys(data[0]) : 'No data in table');
        }

        // Try to get column details via a RPC or query if possible
        // But simply looking at one record usually works.
    } catch (e) {
        console.error('Exception:', e.message);
    }
}

checkSchema();
