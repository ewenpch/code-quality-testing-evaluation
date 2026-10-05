/**
 * Lighthouse CI configuration.
 * @see https://github.com/GoogleChrome/lighthouse-ci/blob/main/docs/configuration.md
 *
 * Audits the production build of the frontend (packages/frontend/build), served by
 * LHCI's built-in static server. Only public routes are audited: the authenticated
 * pages need a running backend and a session token.
 */
module.exports = {
  ci: {
    collect: {
      staticDistDir: './packages/frontend/build',
      isSinglePageApplication: true,
      url: ['/login', '/register'],
      numberOfRuns: 3,
      settings: {
        chromeFlags: '--no-sandbox --headless=new'
      }
    },
    assert: {
      assertions: {
        'categories:performance': ['error', { minScore: 0.8 }],
        'categories:accessibility': ['error', { minScore: 1 }],
        'categories:best-practices': ['error', { minScore: 0.9 }],
        'categories:seo': ['error', { minScore: 0.8 }]
      }
    },
    upload: {
      target: 'filesystem',
      outputDir: './.lighthouseci/reports'
    }
  }
};
