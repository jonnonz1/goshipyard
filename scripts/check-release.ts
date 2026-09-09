import { VERSION } from '../cli/index.ts';
import pkg from '../package.json';

if (VERSION !== pkg.version) throw new Error('CLI and package versions differ');
if (process.env.GITHUB_REF_TYPE === 'tag' && process.env.GITHUB_REF_NAME !== 'cli-v' + VERSION) {
  throw new Error('Release tag must be cli-v' + VERSION);
}
console.log('Release version checked: ' + VERSION);
