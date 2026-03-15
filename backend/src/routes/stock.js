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
    const { id } = req.params;
    const { quantidade } = req.body;

    try {
        const { data, error } = await supabase
            .from('estoque')
            .update({ quantidade })
            .eq('id', id)
            .select()
            .single();

        if (error) throw error;

        res.json({
            success: true,
            product: data
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

router.post('/products', async (req, res) => {
    const product = req.body;
    // Remove ID if provided to let Supabase generate it
    delete product.id;

    try {
        const { data, error } = await supabase
            .from('estoque')
            .insert([product])
            .select()
            .single();

        if (error) throw error;

        res.json({
            success: true,
            product: data
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

router.put('/products/:id', async (req, res) => {
    const { id } = req.params;
    const product = req.body;
    delete product.id; // Ensure we don't try to update the ID

    try {
        const { data, error } = await supabase
            .from('estoque')
            .update(product)
            .eq('id', id)
            .select()
            .single();

        if (error) throw error;

        res.json({
            success: true,
            product: data
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: error.message
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

module.exports = router;
