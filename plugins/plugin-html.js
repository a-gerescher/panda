const { extname } = require('path');
const { deflate } = require('zlib');


const getFiles = (bundle,paths) => {
  const files = Object.values(bundle).filter(
    (file) => file.isEntry || (typeof file.type === 'string' ? file.type === 'asset' : file.isAsset)
  );
  const result = {};
  for (const file of files) {
    const { fileName, code } = file;

    deflate(code, (err, buffer) => {
      if (err) {
        console.error('An error occurred:', err);
      }
      console.log(fileName,'size',Math.ceil(code.length/1024)+'kb','gz size',Math.ceil(buffer.toString().length/1024)+'kb');
    });

    // console.log(
    //   'output', fileName//,
    //   //'\n  dynamicImports',file.dynamicImports,
    //   //'\n  implicitlyLoadedBefore',file.implicitlyLoadedBefore,
    //   //'\n  imports',file.imports//,
    //   //'\n  importedBindings',Object.keys(file.importedBindings),
    //   //'\n  isDynamicEntry',file.isDynamicEntry,
    //   //'\n  isEntry',file.isEntry,
    //   //'\n  isImplicitEntry',file.isImplicitEntry,
    //   //'\n  modules',Object.keys(file.modules),
    //   //'\n  name',file.name
    //   ,
    // );

    /*
      dynamicImports: string[],
      exports: string[],
      facadeModuleId: string | null,
      fileName: string,
      implicitlyLoadedBefore: string[],
      imports: string[],
      importedBindings: {[imported: string]: string[]},
      isDynamicEntry: boolean,
      isEntry: boolean,
      isImplicitEntry: boolean,
      map: SourceMap | null,
      modules: {
        [id: string]: {
          renderedExports: string[],
          removedExports: string[],
          renderedLength: number,
          originalLength: number
        },
      },
      name: string,
      referencedFiles: string[],
    */

    const extension = extname(fileName).substring(1);
    result[extension] = (result[extension] || []).concat(file);
  }

  return result;
};

const makeHtmlAttributes = (attributes) => {
  if (!attributes) {
    return '';
  }

  const keys = Object.keys(attributes);
  // eslint-disable-next-line no-param-reassign
  return keys.reduce((result, key) => (result += ` ${key}="${attributes[key]}"`), '');
};

const defaultTemplate = async ({ attributes, files, meta, publicPath, title }) => {
  const scripts = (files.js || [])
    .map(({ fileName }) => {
      const attrs = makeHtmlAttributes(attributes.script);
      return `<script src="${publicPath}${fileName}"${attrs}></script>`;
    })
    .join('\n');

  const links = (files.css || [])
    .map(({ fileName }) => {
      const attrs = makeHtmlAttributes(attributes.link);
      return `<link href="${publicPath}${fileName}" rel="stylesheet"${attrs}>`;
    })
    .join('\n');

  const metas = meta
    .map((input) => {
      const attrs = makeHtmlAttributes(input);
      return `<meta${attrs}>`;
    })
    .join('\n');

  return `
<!doctype html>
<html${makeHtmlAttributes(attributes.html)}>
  <head>
    ${metas}
    <title>${title}</title>
    ${links}
  </head>
  <body>
    ${scripts}
  </body>
</html>`;
};

const supportedFormats = ['es', 'esm', 'iife', 'umd'];

const defaults = {
  attributes: {
    link: null,
    html: { lang: 'en' },
    script: null
  },
  fileName: 'index.html',
  meta: [{ charset: 'utf-8' }],
  publicPath: '',
  template: defaultTemplate,
  title: 'Rollup Bundle'
};

const html = (opts = {}) => {
  const { attributes, fileName, meta, publicPath, template, title } = Object.assign(
    {},
    defaults,
    opts
  );

  return {
    name: 'html',

    async generateBundle(output, bundle) {
      if (!supportedFormats.includes(output.format) && !opts.template) {
        this.warn(
          `plugin-html: The output format '${
            output.format
          }' is not directly supported. A custom \`template\` is probably required. Supported formats include: ${supportedFormats.join(
            ', '
          )}`
        );
      }

      if (output.format === 'esm' || output.format === 'es') {
        attributes.script = Object.assign({}, attributes.script, { type: 'module' });
      }

      const files = getFiles(bundle,output.paths);
      const source = await template({ attributes, bundle, files, meta, publicPath, title });

      const htmlFile = {
        type: 'asset',
        source,
        name: 'Rollup HTML Asset',
        fileName
      };

      this.emitFile(htmlFile);
    }
  };
};

export { html, makeHtmlAttributes };