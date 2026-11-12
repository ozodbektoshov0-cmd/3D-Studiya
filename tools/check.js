/* Statik tekshiruv: node tools/check.js  (qo’shimcha kutubxona kerak emas)
   1) index.html dagi skriptlar mavjud va sintaksisi to’g’ri  2) js/ dagi har fayl index.html da bor
   3) global e’lonlar to’qnashmaydi  4) sw.js keshi diskdagi fayllarga aniq mos  5) README versiyasi sw.js bilan bir xil */
const fs=require('fs'),vm=require('vm'),path=require('path');process.chdir(path.join(__dirname,'..'));
let bad=0;const fail=m=>{bad++;console.log('✗',m)},ok=m=>console.log('✓',m);
const html=fs.readFileSync('index.html','utf8'),srcs=[...html.matchAll(/<script src="([^"]+)"/g)].map(m=>m[1]);
let e1=bad;srcs.forEach(s=>{if(!fs.existsSync(s))return fail('index.html: '+s+' topilmadi');try{new vm.Script(fs.readFileSync(s,'utf8'),{filename:s})}catch(e){fail(s+': '+e.message)}});
if(bad==e1)ok(srcs.length+' ta skript topildi va sintaksisi to’g’ri');
let e2=bad;fs.readdirSync('js').filter(f=>f.endsWith('.js')).forEach(f=>{if(!srcs.includes('js/'+f))fail('js/'+f+' index.html ga ulanmagan')});
if(bad==e2)ok('js/ dagi hamma fayl index.html ga ulangan');
const ctx=vm.createContext({});let e3=bad;
for(const s of srcs.filter(x=>x.startsWith('js/')))try{new vm.Script(fs.readFileSync(s,'utf8'),{filename:s}).runInContext(ctx,{timeout:2000})}catch(e){if(/already been declared/.test(e.message))fail('global to’qnashuv: '+s+' — '+e.message)}
if(bad==e3)ok('global e’lonlar to’qnashmaydi');
const sw=fs.readFileSync('sw.js','utf8'),cached=[...sw.matchAll(/"([^"]+\.(?:js|css|html|png|wasm|mjs|webmanifest))"/g)].map(m=>m[1]);
const all=[];(function w(d){for(const f of fs.readdirSync(d)){const p=d=='.'?f:d+'/'+f;if(/^(node_modules|\.git|tools|tests)/.test(p))continue;fs.statSync(p).isDirectory()?w(p):all.push(p)}})('.');
const need=all.filter(f=>/^(js|css)\//.test(f)||/^vendor\/.*\.(js|wasm|mjs)$/.test(f)||/^(index\.html|manifest\.webmanifest|icon-\d+\.png|og\.png)$/.test(f));
let e4=bad;cached.filter(f=>f!='.'&&!fs.existsSync(f)).forEach(f=>fail('sw.js keshida bor, diskda yo’q: '+f));need.filter(f=>!cached.includes(f)).forEach(f=>fail('diskda bor, sw.js keshida yo’q: '+f));
if(bad==e4)ok('sw.js keshi diskka mos ('+cached.length+' fayl)');
const v=(sw.match(/3d-studiya-v([\d.]+)/)||[])[1],rv=(fs.readFileSync('README.md','utf8').match(/^## v([\d.]+)/m)||[])[1];
if(v!==rv)fail('README versiyasi (v'+rv+') sw.js (v'+v+') bilan mos emas');else ok('README va sw.js versiyasi bir xil (v'+v+')');
console.log(bad?'\n'+bad+' ta muammo':'\nHammasi joyida');process.exit(bad?1:0);
