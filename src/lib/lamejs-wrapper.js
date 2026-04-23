// ESM wrapper for lamejs
// lamejs CJS module has cross-file globals (MPEGMode etc.) that break with Vite.
// We load the self-contained lame.min.js as raw text and execute it in an
// isolated scope, then export the result.
import src from 'lamejs/lame.min.js?raw';

const lamejs = new Function(src + '\nreturn lamejs;')();

export const Mp3Encoder = lamejs.Mp3Encoder;
export const WavHeader = lamejs.WavHeader;
export default lamejs;
