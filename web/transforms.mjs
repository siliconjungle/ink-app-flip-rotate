export const IDENTITY=[1,0,0,1];
const OPERATIONS={right:[0,1,-1,0],left:[0,-1,1,0],horizontal:[-1,0,0,1],vertical:[1,0,0,-1]};
export const equal=(a,b)=>a.every((v,i)=>v===b[i]);
export function apply(matrix,operation){const n=OPERATIONS[operation];if(!n)throw Error('Unknown transform');const[a,b,c,d]=n,[e,f,g,h]=matrix;return[a*e+c*f,b*e+d*f,a*g+c*h,b*g+d*h].map(v=>v||0);}
export function dimensions(width,height,matrix){if(!Number.isInteger(width)||!Number.isInteger(height)||width<1||height<1||width*height>16_000_000)throw Error('Use an image with up to 16 million pixels.');const[a,b,c,d]=matrix;return{width:Math.abs(a)*width+Math.abs(c)*height,height:Math.abs(b)*width+Math.abs(d)*height};}
export function outputName(name){const stem=String(name||'Image').split(/[\\/]/).at(-1).replace(/\.[^.]*$/,'').replace(/[\x00-\x1f]/g,'').slice(0,170)||'Image';return stem+'-edited.png';}
export function pngName(name){const clean=String(name||'').trim();if(!clean||clean.length>200||/[\\/\x00-\x1f]/.test(clean))throw Error('Enter a file name without slashes (up to 200 characters).');return clean.replace(/\.(png|jpe?g|webp|gif|bmp|avif)$/i,'')+'.png';}
