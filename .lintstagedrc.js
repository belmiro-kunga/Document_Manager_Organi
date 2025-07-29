// Lint-staged configuration for Advanced DMS
// Configuração lint-staged para o DMS Avançado

module.exports = {
  // TypeScript and JavaScript files
  '**/*.{js,ts,tsx}': [
    'eslint --fix',
    'prettier --write',
    'git add'
  ],
  
  // JSON files
  '**/*.json': [
    'prettier --write',
    'git add'
  ],
  
  // Markdown files
  '**/*.md': [
    'prettier --write',
    'git add'
  ],
  
  // YAML files
  '**/*.{yml,yaml}': [
    'prettier --write',
    'git add'
  ],
  
  // Package.json files (run tests after changes)
  '**/package.json': [
    'prettier --write',
    'npm run test:packages',
    'git add'
  ],
  
  // Docker files
  '**/Dockerfile*': [
    'prettier --write --parser dockerfile',
    'git add'
  ],
  
  // Docker compose files
  '**/docker-compose*.yml': [
    'prettier --write',
    'git add'
  ]
};