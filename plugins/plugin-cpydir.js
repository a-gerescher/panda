import fdir from 'fdir';
import path from 'path';
import picomatch from 'picomatch';

const name = 'rollup-plugin-cpydir';

import cpFile from 'cp-file';

function successMessage(files, dest) {
  console.log(`Successfully copied ${files}  ->  ${dest}`);
}

function errorMessage(files, dest, err) {
  console.log(`Error copying ${files}  ->  ${dest}\n${err}`);
}

function slash(pth) {
	const isExtendedLengthPath = /^\\\\\?\\/.test(pth);
	const hasNonAscii = /[^\u0000-\u0080]+/.test(pth); // eslint-disable-line no-control-regex

	if (isExtendedLengthPath || hasNonAscii) {
		return pth;
	}

	return pth.replace(/\\/g, '/');
}


async function copyFiles(params) {
  const { files, dest, options } = params;

  const { verbose = false } = options || {};

  try {
    let crawler = new fdir()
      .exclude((dir) => {
        if (dir.indexOf('node_modules')>=0) return true;
        if (dir.indexOf('.' + path.sep + '.')===0) return true;
        return false;
      })
      .group().crawl('.');
    let dirs = crawler.sync();
    for (const dir of dirs) {
      for (const f of dir.files) {
        const fName = (slash(dir.dir)+'/'+f).substr(2);
        if (!picomatch.isMatch(fName,files)) continue;
        cpFile(fName,dest+'/'+f);
      }
    }

  } catch (err) {
    throw new Error(errorMessage(files, dest, err));
  }

  if (verbose) {
    successMessage(files, dest);
  }
}

export default function(options) {
  return {
    name,
    async writeBundle() {
      if (Array.isArray(options)) {
        for (const option of options) {
          await copyFiles(option);
        }
      } else {
        await copyFiles(options);
      }
    }
  };
}