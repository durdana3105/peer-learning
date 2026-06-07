import json

root_path = './package.json'
backend_path = './backend/package.json'

with open(root_path, 'r') as f:
    root_pkg = json.load(f)

backend_deps_list = [
  'bcryptjs', 'cookie-parser', 'cors', 'crypto', 'dotenv',
  'express', 'express-rate-limit', 'nodemailer', 'openai', 'web-push'
]

shared_deps_list = [
  '@supabase/supabase-js', 'axios', 'zod'
]

dev_backend_deps_list = [
  '@types/cookie-parser', 'supertest'
]

backend_pkg = {
  "name": "peer-learning-backend",
  "version": "1.0.0",
  "type": "module",
  "scripts": {
    "start": "node server.js",
    "dev": "node --watch server.js",
    "test": "vitest"
  },
  "dependencies": {},
  "devDependencies": {}
}

# Move pure backend deps
for dep in backend_deps_list:
    if 'dependencies' in root_pkg and dep in root_pkg['dependencies']:
        backend_pkg['dependencies'][dep] = root_pkg['dependencies'][dep]
        del root_pkg['dependencies'][dep]

# Copy shared deps
for dep in shared_deps_list:
    if 'dependencies' in root_pkg and dep in root_pkg['dependencies']:
        backend_pkg['dependencies'][dep] = root_pkg['dependencies'][dep]

# Move dev deps
for dep in dev_backend_deps_list:
    if 'devDependencies' in root_pkg and dep in root_pkg['devDependencies']:
        backend_pkg['devDependencies'][dep] = root_pkg['devDependencies'][dep]
        del root_pkg['devDependencies'][dep]
    elif 'dependencies' in root_pkg and dep in root_pkg['dependencies']:
        backend_pkg['devDependencies'][dep] = root_pkg['dependencies'][dep]
        del root_pkg['dependencies'][dep]

with open(backend_path, 'w') as f:
    json.dump(backend_pkg, f, indent=2)
    f.write('\n')

with open(root_path, 'w') as f:
    json.dump(root_pkg, f, indent=2)
    f.write('\n')

print("Packages split successfully.")
