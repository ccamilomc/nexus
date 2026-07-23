/** @type {import('@commitlint/types').UserConfig} */
module.exports = {
  extends: ['@commitlint/config-conventional'],
  rules: {
    'scope-enum': [
      1,
      'always',
      [
        'app',
        'core',
        'decision-engine',
        'dashboard',
        'planning',
        'workout',
        'nutrition',
        'habits',
        'study',
        'sleep',
        'health',
        'analytics',
        'assistant',
        'settings',
        'shared',
        'ui',
        'db',
        'auth',
        'ci',
        'deps',
        'docs',
        'config',
      ],
    ],
  },
}
