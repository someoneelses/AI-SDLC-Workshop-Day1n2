import {readdirSync,readFileSync} from 'node:fs';
import path from 'node:path';
import {gzipSync} from 'node:zlib';

// Sum every emitted JS and CSS chunk, including chunks unused on a single page.
// This does not measure HTML, images, network transfer or browser execution.
const root=path.join(process.cwd(),'.next','static','chunks');
function list(directory){
  return readdirSync(directory,{withFileTypes:true}).flatMap(entry=>{
    const name=path.join(directory,entry.name);
    return entry.isDirectory()?list(name):/\.(?:js|css)$/.test(entry.name)?[name]:[];
  });
}
try{
  const files=list(root);
  if(files.length===0)throw new Error('No production chunks found. Run npm run build first.');
  const totals=files.reduce((result,file)=>{
    const content=readFileSync(file);
    result.raw+=content.length;
    result.gzip+=gzipSync(content).length;
    return result;
  },{raw:0,gzip:0});
  console.log(`All ${files.length} emitted JS/CSS chunks: ${(totals.raw/1024).toFixed(1)} KiB raw, ${(totals.gzip/1024).toFixed(1)} KiB gzipped (sum of individually compressed files)`);
}catch(error){
  console.error(`Could not measure production chunks: ${error.message}`);
  process.exitCode=1;
}
