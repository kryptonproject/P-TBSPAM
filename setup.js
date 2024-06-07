const { execSync } = require('child_process');

function checkAndInstall(packageName) {
    try {
        require.resolve(packageName);
        console.log(`${packageName} is already installed.`);
    } catch (e) {
        console.log(`${packageName} is not installed, installing...`);
        execSync(`npm install ${packageName}`, { stdio: 'inherit'});
    }
}

const packages = ['axios', 'yargs', 'readline', 'form-data', 'child_process'];
packages.forEach(pkg => checkAndInstall(pkg));

console.log('All packages are installed. you can now run the script.')
