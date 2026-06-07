const fs = require('fs');

const rootPath = './package.json';
const backendPath = './backend/package.json';

const rootPkg = JSON.parse(fs.readFileSync(rootPath, 'utf8'));

const backendDepsList = [
  'bcryptjs', 'cookie-parser', 'cors', 'crypto', 'dotenv',
  'express', 'express-rate-limit', 'nodemailer', 'openai', 'web-push'
];

const sharedDepsList = [
  '@supabase/supabase-js', 'axios', 'zod'
];

const devBackendDepsList = [
  '@types/cookie-parser', 'supertest'
];

const backendPkg = {
  name: "peer-learning-backend",
  version: "1.0.0",
  type: "module",
  scripts: {
    "start": "node server.js",
    "dev": "node --watch server.js",
    "test": "vitest"
  },
  dependencies: {},
  devDependencies: {}
};

// Move pure backend deps
backendDepsList.forEach(dep => {
  if (rootPkg.dependencies[dep]) {
    backendPkg.dependencies[dep] = rootPkg.dependencies[dep];
    delete rootPkg.dependencies[dep];
  }
});

// Copy shared deps
sharedDepsList.forEach(dep => {
  if (rootPkg.dependencies[dep]) {
    backendPkg.dependencies[dep] = rootPkg.dependencies[dep];
  }
});

// Move dev deps
devBackendDepsList.forEach(dep => {
  if (rootPkg.devDependencies && rootPkg.devDependencies[dep]) {
    backendPkg.devDependencies[dep] = rootPkg.devDependencies[dep];
    delete rootPkg.devDependencies[dep];
  } else if (rootPkg.dependencies && rootPkg.dependencies[dep]) {
    backendPkg.devDependencies[dep] = rootPkg.dependencies[dep];
    delete rootPkg.dependencies[dep];
  }
});

fs.writeFileSync(backendPath, JSON.stringify(backendPkg, null, 2) + '\n');
fs.writeFileSync(rootPath, JSON.stringify(rootPkg, null, 2) + '\n');

console.log("Packages split successfully.");
