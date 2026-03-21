// Unified Stock Routing for "Gestão de Items" App
// Part of the Barcode System & Backend Unification Integration
const express = require('express');
const router = express.Router();
const supabase = require('../config/supabase');

// Compatibility routes for "Gestão de Items" App
// These routes follow the structure expected by the Android app's Repository

router.get('/status', async (req, res) => {
    try {
        const { data, error, count } = await supabase
            .from('estoque')
            .select('*', { count: 'exact', head: true });

        if (error) throw error;

        res.json({
            initialized: true,
            table_accessible: true,
            count: count,
            success: true
        });
    } catch (error) {
        res.status(500).json({
            initialized: true,
            table_accessible: false,
            error: error.message,
            success: false
        });
    }
});

router.get('/products', async (req, res) => {
    try {
        const { data, error } = await supabase
            .from('estoque')
            .select('*')
            .order('nome');

        if (error) throw error;

        res.json({
            success: true,
            products: data
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

router.patch('/products/:id/quantity', async (req, res) => {
    let { id } = req.params;
    // Clean ID: "14.0" -> "14"
    if (id && id.includes('.')) id = id.split('.')[0];

    const { quantidade } = req.body;
    console.log(`[STOCK] PATCH quantity for ID: ${id}, New Quantity: ${quantidade}`);

    try {
        const { data, error } = await supabase
            .from('estoque')
            .update({ quantidade })
            .eq('id', id)
            .select()
            .single();

        if (error) {
            console.error(`[STOCK] PATCH Error: ${error.message}`);
            throw error;
        }

        console.log(`[STOCK] PATCH Success for ID: ${id}`);
        res.json({
            success: true,
            product: data
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: error.message,
            details: error
        });
    }
});

router.post('/products', async (req, res) => {
    const product = req.body;
    console.log(`[STOCK] POST new product: ${product.nome}`);
    // Remove ID if provided to let Supabase generate it
    delete product.id;

    try {
        const { data, error } = await supabase
            .from('estoque')
            .insert([product])
            .select()
            .single();

        if (error) {
            console.error(`[STOCK] POST Error: ${error.message}`);
            throw error;
        }

        console.log(`[STOCK] POST Success, New ID: ${data.id}`);
        res.json({
            success: true,
            product: data
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: error.message,
            details: error
        });
    }
});

router.put('/products/:id', async (req, res) => {
    let { id } = req.params;
    // Clean ID: "14.0" -> "14"
    if (id && id.includes('.')) id = id.split('.')[0];

    const product = req.body;
    console.log(`[STOCK] PUT update product ID: ${id}`);
    delete product.id; // Ensure we don't try to update the ID

    try {
        const { data, error } = await supabase
            .from('estoque')
            .update(product)
            .eq('id', id)
            .select()
            .single();

        if (error) {
            console.error(`[STOCK] PUT Error: ${error.message}`);
            throw error;
        }

        console.log(`[STOCK] PUT Success for ID: ${id}`);
        res.json({
            success: true,
            product: data
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: error.message,
            details: error
        });
    }
});

router.delete('/products/:id', async (req, res) => {
    const { id } = req.params;

    try {
        const { error } = await supabase
            .from('estoque')
            .delete()
            .eq('id', id);

        if (error) throw error;

        res.json({
            success: true
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

// Transactions Endpoints
router.get('/transactions', async (req, res) => {
    try {
        const { data, error } = await supabase
            .from('transacoes')
            .select('*')
            .order('data_hora', { ascending: false })
            .limit(50);

        if (error) throw error;

        res.json({
            success: true,
            transactions: data
        });
    } catch (error) {
        console.error('[STOCK] Get Transactions Error:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

router.post('/transactions', async (req, res) => {
    const transaction = req.body;
    console.log(`[STOCK] POST new transaction for item: ${transaction.item_name}`);

    try {
        const { data, error } = await supabase
            .from('transacoes')
            .insert([transaction])
            .select()
            .single();

        if (error) throw error;

        res.json({
            success: true,
            transaction: data
        });
    } catch (error) {
        console.error('[STOCK] Post Transaction Error:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

module.exports = router;
