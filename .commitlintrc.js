// Commitlint configuration for Advanced DMS
// Configuração commitlint para o DMS Avançado

module.exports = {
  extends: ['@commitlint/config-conventional'],
  rules: {
    // Type enum - allowed commit types
    'type-enum': [
      2,
      'always',
      [
        'feat',     // New feature
        'fix',      // Bug fix
        'docs',     // Documentation changes
        'style',    // Code style changes (formatting, etc)
        'refactor', // Code refactoring
        'perf',     // Performance improvements
        'test',     // Adding or updating tests
        'build',    // Build system changes
        'ci',       // CI/CD changes
        'chore',    // Other changes (maintenance, etc)
        'revert',   // Revert previous commit
        'wip',      // Work in progress
        'hotfix',   // Critical hotfix
        'release'   // Release commits
      ]
    ],
    
    // Subject case - allow sentence case for Portuguese
    'subject-case': [2, 'always', 'sentence-case'],
    
    // Subject length
    'subject-max-length': [2, 'always', 100],
    'subject-min-length': [2, 'always', 10],
    
    // Body and footer
    'body-max-line-length': [2, 'always', 100],
    'footer-max-line-length': [2, 'always', 100],
    
    // Scope enum - allowed scopes
    'scope-enum': [
      1,
      'always',
      [
        'auth',         // Authentication service
        'document',     // Document service
        'python',       // Python analysis service
        'web',          // Web client
        'shared',       // Shared utilities
        'docker',       // Docker configuration
        'ci',           // CI/CD
        'deps',         // Dependencies
        'config',       // Configuration
        'test',         // Testing
        'docs',         // Documentation
        'i18n',         // Internationalization
        'security',     // Security
        'performance',  // Performance
        'ui',           // User interface
        'api',          // API changes
        'db',           // Database
        'storage',      // Storage
        'search',       // Search functionality
        'ai',           // AI features
        'workflow',     // Workflow features
        'signature',    // Digital signature
        'collaboration' // Collaboration features
      ]
    ],
    
    // Allow empty scope
    'scope-empty': [1, 'never'],
    
    // Header format
    'header-max-length': [2, 'always', 120]
  },
  
  // Custom prompt for better commit messages
  prompt: {
    questions: {
      type: {
        description: 'Select the type of change that you\'re committing:',
        enum: {
          feat: {
            description: 'A new feature',
            title: 'Features',
            emoji: '✨'
          },
          fix: {
            description: 'A bug fix',
            title: 'Bug Fixes',
            emoji: '🐛'
          },
          docs: {
            description: 'Documentation only changes',
            title: 'Documentation',
            emoji: '📚'
          },
          style: {
            description: 'Changes that do not affect the meaning of the code',
            title: 'Styles',
            emoji: '💎'
          },
          refactor: {
            description: 'A code change that neither fixes a bug nor adds a feature',
            title: 'Code Refactoring',
            emoji: '📦'
          },
          perf: {
            description: 'A code change that improves performance',
            title: 'Performance Improvements',
            emoji: '🚀'
          },
          test: {
            description: 'Adding missing tests or correcting existing tests',
            title: 'Tests',
            emoji: '🚨'
          },
          build: {
            description: 'Changes that affect the build system or external dependencies',
            title: 'Builds',
            emoji: '🛠'
          },
          ci: {
            description: 'Changes to our CI configuration files and scripts',
            title: 'Continuous Integrations',
            emoji: '⚙️'
          },
          chore: {
            description: 'Other changes that don\'t modify src or test files',
            title: 'Chores',
            emoji: '♻️'
          },
          revert: {
            description: 'Reverts a previous commit',
            title: 'Reverts',
            emoji: '🗑'
          }
        }
      },
      scope: {
        description: 'What is the scope of this change (e.g. component or file name)'
      },
      subject: {
        description: 'Write a short, imperative tense description of the change'
      },
      body: {
        description: 'Provide a longer description of the change'
      },
      isBreaking: {
        description: 'Are there any breaking changes?'
      },
      breakingBody: {
        description: 'A BREAKING CHANGE commit requires a body. Please enter a longer description of the commit itself'
      },
      breaking: {
        description: 'Describe the breaking changes'
      },
      isIssueAffected: {
        description: 'Does this change affect any open issues?'
      },
      issuesBody: {
        description: 'If issues are closed, the commit requires a body. Please enter a longer description of the commit itself'
      },
      issues: {
        description: 'Add issue references (e.g. "fix #123", "re #123".)'
      }
    }
  }
};