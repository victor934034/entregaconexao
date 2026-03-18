const { execSync } = require('child_process');
try {
    console.log('--- STATUS ---');
    console.log(execSync('git status', { encoding: 'utf8' }));
    console.log('--- REMOTE ---');
    console.log(execSync('git remote -v', { encoding: 'utf8' }));
    console.log('--- LOG ---');
    console.log(execSync('git log -n 1 --oneline', { encoding: 'utf8' }));
} catch (e) {
    console.log('ERROR:');
    if (e.stdout) console.log('STDOUT:', e.stdout.toString());
    if (e.stderr) console.log('STDERR:', e.stderr.toString());
    console.log('MESSAGE:', e.message);
}
