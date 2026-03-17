const express = require('express');
const router = express.Router();

// NOTE: Hardcoded for now. 
// Can be moved to database (Supabase/PostgreSQL) later.
// "latestVersion" is the version code of the app that should be prompt for an update
// "minVersion" is the minimum version code the app requires to function without forcing update
// "apkUrl" is the direct URL to download the new APK
const CURRENT_APP_INFO = {
    latestVersion: "1.0.1",
    minVersion: "1.0.0",
    apkUrl: "https://github.com/dudushy/GestaoItemsApp/releases/latest/download/app-release.apk"
    // Example github releases URL.
};

router.get('/', (req, res) => {
    try {
        res.json({
            success: true,
            version: CURRENT_APP_INFO
        });
    } catch (error) {
        console.error('[Version Route] Error fetching version:', error);
        res.status(500).json({
            success: false,
            error: 'Erro interno ao buscar versão'
        });
    }
});

module.exports = router;
