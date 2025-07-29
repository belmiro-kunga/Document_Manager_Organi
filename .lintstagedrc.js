// Lint-staged configuration for Advanced DMS (Windows compatible)
// Configuração lint-staged para o DMS Avançado (compatível com Windows)

module.exports = {
  // TypeScript and JavaScript files
  '**/*.{js,ts,tsx}': [
    'prettier --write'
  ],
  
  // JSON files
  '**/*.json': [
    'prettier --write'
  ],
  
  // Markdown files
  '**/*.md': [
    'prettier --write'
  ],
  
  // YAML files
  '**/*.{yml,yaml}': [
    'prettier --write'
  ]
};