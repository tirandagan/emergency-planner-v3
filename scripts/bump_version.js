const fs = require('fs');
const path = require('path');

const packageJsonPath = path.join(__dirname, '../package.json');
const packageJson = require(packageJsonPath);

const args = process.argv.slice(2);
const type = args[0]; // 'major', 'minor', or 'patch'

if (!['major', 'minor', 'patch'].includes(type)) {
    console.error('Usage: node scripts/bump_version.js <major|minor|patch>');
    process.exit(1);
}

const currentVersion = packageJson.version;
const parts = currentVersion.split('.').map(Number);

if (parts.length !== 3) {
    console.error(`Invalid version format in package.json: ${currentVersion}`);
    process.exit(1);
}

let [major, minor, patch] = parts;

if (type === 'major') {
    major++;
    minor = 0;
    patch = 0;
} else if (type === 'minor') {
    minor++;
    patch = 0;
} else if (type === 'patch') {
    patch++;
}

const newVersion = `${major}.${minor}.${patch}`;
packageJson.version = newVersion;

fs.writeFileSync(packageJsonPath, JSON.stringify(packageJson, null, 2) + '\n');

console.log(`Version bumped from ${currentVersion} to ${newVersion}`);



















