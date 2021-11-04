const fs = require('fs');
const path = require('path');

const { transform } = require('esbuild');
const { createFilter } = require('@rollup/pluginutils');

function esbuild(opts = {}) {
  const filter = createFilter(opts.include, opts.exclude);

  return {
    name: 'esbuild',

    // eslint-disable-next-line consistent-return
    resolveId(importee, importer) {
      if (importer && /^[./]/.test(importee)) {
        const resolved = path.resolve(importer ? path.dirname(importer) : process.cwd(), importee);
        // resolve in the same order that TypeScript resolves modules
        const resolvedFilename = [
          `${resolved}.ts`,
          `${resolved}.tsx`,
          `${resolved}/index.ts`,
          `${resolved}/index.tsx`
        ].find((filename) => fs.existsSync(filename));

        if (resolvedFilename) {
          return resolvedFilename;
        }
      }
    },

    transform: async (code, id) => {
      if (!filter(id)) return null;

      const result = await transform(code, {
        jsxFactory: opts.jsxFactory,
        jsxFragment: opts.jsxFragment,
        minifyIdentifiers: true,
        minifySyntax: true,
        sourcemap: opts.sourceMap || false,
        target: opts.target,
        format: 'esm',
        loader: opts.loader
      });
      return {
        code: result.code,
        map: result.sourceMap
      };
    }
  };
};

export { esbuild }