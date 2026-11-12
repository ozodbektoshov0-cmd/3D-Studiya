/* Xatti-harakat testlari: node tools/test.js — Studiya+ (avto-rig, loyiha fayli) Node’da, brauzersiz */
const fs=require('fs'),vm=require('vm'),path=require('path'),assert=require('assert');process.chdir(path.join(__dirname,'..'));
const saved=[],log=[],U8=()=>vm.runInContext('Uint8Array',ctx);
const ctx={TextEncoder,TextDecoder,Blob,console,toast:m=>log.push(m),menu:()=>{},grid:{},axs:{},tc:{detach(){},attach(){}},R:{},cv:{},
 vp:{style:{background:'#123456'}},saveBlob:b=>saved.push(b),name:'proj1',sel:null,addEventListener(){},loadAll(){},refresh(){},fit(){},anim(){},texNames(){},$:()=>({style:{}}),
 document:{createElement:()=>({}),body:{append(){}}},prompt:()=>'5',
 FileReader:class{readAsArrayBuffer(b){b.arrayBuffer().then(r=>{this.result=r;this.onloadend&&this.onloadend()})}}};
ctx.window=ctx;vm.createContext(ctx);
for(const f of['vendor/three.min.js','vendor/GLTFExporter.js','vendor/GLTFLoader.js'])vm.runInContext(fs.readFileSync(f,'utf8'),ctx);   // Three.js shu kontekst ichida (realm to’qnashuvi bo’lmasin)
const T=ctx.THREE,root=new T.Group(),cam=new T.PerspectiveCamera(),ctl={target:new T.Vector3(),update(){}};
Object.assign(ctx,{root,cam,ctl,log,meshes:()=>{const a=[];root.traverse(o=>o.isMesh&&a.push(o));return a}});
vm.runInContext('async function load(f){log.push("ESKI load: "+f.name)}',ctx);
vm.runInContext(fs.readFileSync('js/studio-plus.js','utf8'),ctx);
const SP=ctx.StudioPlus,tests=[];const test=(n,f)=>tests.push([n,f]);
test('avto-rig: suyaklar soni va vaznlar yig’indisi 1',async()=>{
 const m=new T.Mesh(new T.BoxGeometry(1,4,1,2,12,2),new T.MeshStandardMaterial());const sm=SP.rig(m,5),g=sm.geometry,w=g.attributes.skinWeight.array;
 assert(sm.isSkinnedMesh);assert.equal(sm.skeleton.bones.length,5);
 for(let v=0;v<g.attributes.position.count;v++)assert(Math.abs(w[v*4]+w[v*4+1]-1)<1e-5,'vazn yig’indisi 1 emas');
 sm.skeleton.bones.forEach((k,i)=>{if(i)k.rotation.z=.2});sm.updateMatrixWorld(true);const lo=new T.Vector3(),hi=new T.Vector3();
 let a=0,b=0,P=g.attributes.position;for(let i=0;i<P.count;i++){if(P.getY(i)<P.getY(a))a=i;if(P.getY(i)>P.getY(b))b=i}
 const vp=(i,o)=>sm.getVertexPosition?sm.getVertexPosition(i,o):sm.boneTransform(i,o);vp(a,lo);vp(b,hi);   // r147: boneTransform, r151+: getVertexPosition
 assert(Math.abs(lo.x)<1e-6,'pastki nuqta qimirlamasligi kerak');assert(hi.x>.1,'yuqori nuqta egilishi kerak')});
test('loyiha fayli: pack/unpack va buzuq fayl',async()=>{
 const g=new(U8())(10).fill(7).buffer,p=SP.pack(g,{a:1}),r=SP.unpack(p.buffer);assert.deepEqual(r.meta,{a:1});assert.equal(r.glb.byteLength,10);
 assert.throws(()=>SP.unpack(new(U8())(20).buffer),/loyiha fayli emas/)});
test('loyiha fayli: saqlash → ochish (nom, userData, yashirinlik, kamera, fon)',async()=>{
 const a=new T.Mesh(new T.BoxGeometry(1,1,1),new T.MeshStandardMaterial());a.name='quti';a.userData={tag:'A'};
 const b=new T.Mesh(new T.SphereGeometry(.5,8,6),new T.MeshStandardMaterial());b.name='shar';b.visible=false;b.userData={dummy:true};root.add(a,b);
 cam.position.set(3,4,5);ctl.target.set(0,1,0);SP.saveProj();await new Promise(r=>setTimeout(r,200));assert(saved.length,'saveBlob chaqirilmadi');
 const raw=await saved[0].arrayBuffer(),u=new(U8())(raw.byteLength);u.set(new Uint8Array(raw));
 assert(!a.userData.__hid&&!b.userData.__hid,'vaqtinchalik belgi tozalanmagan');
 root.clear();cam.position.set(0,0,0);ctx.vp.style.background='';
 await ctx.load({name:'p.s3dp',arrayBuffer:async()=>u.buffer});await ctx.load({name:'x.glb',arrayBuffer:async()=>new ArrayBuffer(0)});
 const ms=ctx.meshes(),q=ms.find(m=>m.name=='quti'),s=ms.find(m=>m.name=='shar');
 assert(q&&s&&q.userData.tag=='A'&&s.userData.dummy===true);assert(q.visible&&!s.visible,'yashirinlik saqlanmadi');
 assert.deepEqual(cam.position.toArray(),[3,4,5]);assert.deepEqual(ctl.target.toArray(),[0,1,0]);assert.equal(ctx.vp.style.background,'#123456');
 assert(log.includes('ESKI load: x.glb'),'oddiy fayllar eski yuklagichga o’tmadi')});
test('silliqlash: shovqinni kamaytiradi, hajmni saqlaydi, ochiq chekka joyida qoladi',async()=>{
 const noise=p=>{const x=Math.sin(p.x*127.1+p.y*311.7+p.z*74.7)*43758.5453;return x-Math.floor(x)-.5};
 const mk=ni=>{let g=new T.SphereGeometry(1,24,16);if(!ni)g=g.toNonIndexed();const P=g.attributes.position,v=new T.Vector3();
  for(let i=0;i<P.count;i++){v.fromBufferAttribute(P,i);const r=1+.3*noise(v.clone().multiplyScalar(1e3).round().multiplyScalar(1e-3));v.multiplyScalar(r);P.setXYZ(i,v.x,v.y,v.z)}return g};
 const st=g=>{const P=g.attributes.position,v=new T.Vector3(),r=[];for(let i=0;i<P.count;i++){v.fromBufferAttribute(P,i);r.push(v.length())}
  const m=r.reduce((a,b)=>a+b)/r.length;return{m,sd:Math.sqrt(r.reduce((a,b)=>a+(b-m)**2,0)/r.length)}};
 for(const ni of[true,false]){const g=mk(ni),a=st(g),s=SP.smooth(g,8),b=st(s);
  assert(b.sd<a.sd*.4,'shovqin yetarlicha kamaymadi: '+a.sd.toFixed(3)+' → '+b.sd.toFixed(3)+(ni?' (indexed)':' (non-indexed)'));
  assert(Math.abs(b.m-a.m)/a.m<.08,'hajm/radius keskin o’zgardi: '+a.m.toFixed(3)+' → '+b.m.toFixed(3));
  assert(!s.attributes.position.array.some(Number.isNaN)&&s.attributes.normal.count==g.attributes.position.count);
  assert(g.attributes.normal===undefined||g.attributes.normal.array!==s.attributes.normal.array,'asl geometriya o’zgargan bo’lmasligi kerak')}
 const pl=new T.PlaneGeometry(2,2,6,6),P=pl.attributes.position;for(let i=0;i<P.count;i++)P.setZ(i,.3*noise(new T.Vector3(P.getX(i),P.getY(i),0).multiplyScalar(1e3).round().multiplyScalar(1e-3)));
 const before=Array.from(P.array),sp=SP.smooth(pl,10),Q=sp.attributes.position;let moved=0;
 for(let i=0;i<P.count;i++){const edge=Math.abs(Math.abs(P.getX(i))-1)<1e-6||Math.abs(Math.abs(P.getY(i))-1)<1e-6;
  const d=Math.hypot(Q.getX(i)-before[i*3],Q.getY(i)-before[i*3+1],Q.getZ(i)-before[i*3+2]);if(edge)assert(d<1e-9,'ochiq chekka siljidi');else moved+=d}
 assert(moved>.1,'ichki nuqtalar silliqlanmadi')});
test('mesh tekshiruvi: yopiq shar/torus, ochiq tekislik, teskari yuza, buzuq uchburchak, bir nechta qism',async()=>{
 const A=SP.analyze,sph=new T.SphereGeometry(1,24,16),r1=A(sph),r2=A(sph.toNonIndexed());
 for(const r of[r1,r2]){assert(r.watertight&&r.components==1&&r.genus===0&&!r.boundary&&!r.nonManifold&&!r.flipped,'shar: '+JSON.stringify(r))}
 assert.equal(A(new T.TorusGeometry(1,.4,12,24)).genus,1,'torus genus 1 bo’lishi kerak');
 const pl=A(new T.PlaneGeometry(2,2,6,6));assert(!pl.watertight&&pl.boundary==24,'tekislik chekkasi: '+pl.boundary);
 const bx=new T.BoxGeometry(1,1,1),ix=bx.index.array;assert(A(bx).watertight);
 const f=bx.clone();const fi=f.index.array;[fi[1],fi[2]]=[fi[2],fi[1]];const rf=A(f);assert(!rf.watertight&&rf.flipped==3,'teskari yuza: '+rf.flipped);
 const dg=bx.clone();dg.setIndex([...ix,0,0,1]);assert.equal(A(dg).degenerate,1);
 const two=new T.BufferGeometry(),b2=bx.clone().translate(5,0,0),P1=bx.attributes.position,P2=b2.attributes.position,pos=new Float32Array(P1.count*6);
 pos.set(P1.array);pos.set(P2.array,P1.count*3);two.setAttribute('position',new T.BufferAttribute(pos,3));two.setIndex([...ix,...Array.from(ix,v=>v+P1.count)]);
 const rt=A(two);assert(rt.components==2&&rt.watertight,'ikki qism: '+rt.components)});
test('teshiklarni yopish: ochiq shar/quti yopiladi, yo’nalish mos, atributlar va yopiq mesh tegilmaydi',async()=>{
 const A=SP.analyze,F=SP.fillHoles,cut=(g,pred)=>{const P=g.attributes.position,ix=g.index.array,o=[];
  for(let t=0;t<ix.length;t+=3){const cy=(P.getY(ix[t])+P.getY(ix[t+1])+P.getY(ix[t+2]))/3;if(!pred(cy))o.push(ix[t],ix[t+1],ix[t+2])}g.setIndex(o);return g};
 for(const ni of[false,true]){let g=cut(new T.SphereGeometry(1,24,16),y=>y>.7);if(ni)g=g.toNonIndexed();
  const b=A(g);assert(!b.watertight&&b.boundary>0,'kesilgan shar ochiq bo’lishi kerak');const before=g.attributes.position.count,r=F(g);
  assert(r.geo&&r.holes==1&&r.tris==b.boundary,'1 teshik, '+b.boundary+' uchburchak kutilgan: '+JSON.stringify({h:r.holes,t:r.tris}));
  const a=A(r.geo);assert(a.watertight&&a.components==1&&a.genus===0&&a.flipped==0,'yopilgandan keyin: '+JSON.stringify(a));
  assert.equal(g.attributes.position.count,before,'asl geometriya o’zgarmasligi kerak');assert.equal(r.geo.attributes.uv.count,r.geo.attributes.position.count,'uv uzunligi mos emas');
  assert.equal(r.geo.attributes.normal.count,r.geo.attributes.position.count)}
 const bx=cut(new T.BoxGeometry(1,1,1),y=>y>.4),rb=F(bx);assert(A(bx).boundary==4&&rb.holes==1&&A(rb.geo).watertight,'quti teshigi yopilmadi');
 const closed=F(new T.SphereGeometry(1,16,12));assert(closed===null||closed.geo===null,'yopiq mesh o’zgarmasligi kerak');
 const gm=cut(new T.SphereGeometry(1,12,8),y=>y>.7);gm.clearGroups();gm.addGroup(0,gm.index.count,2);const rg=F(gm);
 assert(rg.geo.groups.length==2&&rg.geo.groups[1].materialIndex==2&&rg.geo.groups[1].start+rg.geo.groups[1].count==rg.geo.index.count,'material guruhi yangi uchburchaklarni qamramadi')});
test('vaznlar: xarita ranglari va silliqlash (yig’indi 1, ≤4 ta ta’sir, tarqaladi)',async()=>{
 const m=new T.Mesh(new T.BoxGeometry(1,4,1,2,12,2),new T.MeshStandardMaterial()),sm=SP.rig(m,4),g=sm.geometry,n=g.attributes.position.count;
 const C=SP.weightColors(g,0),P=g.attributes.position;let lo=-1,hi=-1;for(let i=0;i<n;i++){if(P.getY(i)<-1.99)lo=i;if(P.getY(i)>1.99)hi=i}
 assert.deepEqual([C[lo*3],C[lo*3+1],C[lo*3+2]],[1,0,0],'bo’lgan suyak 0 pastki uchda qizil bo’lishi kerak');assert.deepEqual([C[hi*3],C[hi*3+1],C[hi*3+2]],[0,0,1],'yuqori uch 0-suyakda ko’k bo’lishi kerak');
 const cnt=a=>{let c=0;for(let i=0;i<n;i++){let k=0;for(let j=0;j<4;j++)if(a.sw.getX&&a.sw['get'+'XYZW'[j]](i)>1e-4)k++;if(k>2)c++}return c};
 const before=cnt({sw:g.attributes.skinWeight}),r=SP.smoothWeights(g,4,3),after=cnt(r);
 assert.equal(before,0,'avto-rigda har uchda ko’pi bilan 2 ta ta’sir');assert(after>0,'silliqlashdan keyin vaznlar tarqalmadi');
 for(let i=0;i<n;i++){let s=0;for(let j=0;j<4;j++){s+=r.sw['get'+'XYZW'[j]](i);const b=r.si['get'+'XYZW'[j]](i);assert(b>=0&&b<4)}assert(Math.abs(s-1)<1e-4,'vazn yig’indisi 1 emas: '+s)}
 assert(g.attributes.skinWeight.array!==r.sw.array,'asl vaznlar o’zgarmasligi kerak')});
test('zstd dekoder: ko’p blokli, RLE blokli va Huffman/FSE kadrlar (3ds Max 2024+ oqimlari uchun)',async()=>{
 vm.runInContext(fs.readFileSync('js/zstd.js','utf8'),ctx);const dec=vm.runInContext('zstdDecode',ctx);
 const hex=s=>Uint8Array.from(s.match(/../g).map(x=>parseInt(x,16)));
 const same=(u,e,nm)=>{assert.equal(u.length,e.length,nm+': uzunlik mos emas');for(let i=0;i<e.length;i++)if(u[i]!==e[i])assert.fail(nm+': '+i+'-bayt mos emas')};
 /* A: “ab”×80000 — 2 blok, bloklar orasidagi holat va standart jadvallar */
 same(dec(hex("28b52ffda4007102005400001061620100fbffe50e0b450000000100fd70bb03020edb20b1")),Uint8Array.from({length:160000},(_,i)=>i%2?98:97),'ko’p blokli');
 /* B: deterministik matn — Huffman literallar + FSE ketma-ketliklar + checksum */
 let seed=12345;const rnd=()=>(seed=(seed*1103515245+12345)&0x7fffffff)/0x7fffffff;
 const W=['mesh','vertex','node','poly','material','bitmap','scene','chunk','editable','0.5','1.0','3ds','max','zstd','Scene','ClassDirectory3','Editable Poly'];
 let t='';while(t.length<4000)t+=W[(rnd()*W.length)|0]+(rnd()<.2?'\n':' ');
 same(dec(hex("28b52ffd64a00e251a0022871617903b072cb262f1b48c8625db71f6792b457b7991992354ffffc8ffffff8db65eca2ebced7f42ec21b94cd15eea60c6394bca0182afd3c265302b2b92e982db711bee93eb362509b1d724010457cd51d496ab9ecb001092d5108189a881332928d4d83a2108c240244c2ded01210c8f40661c191a924925496a340693cc1530e3d633fbac6ccf47c113479e0580fedb6207bdd20a6781350b223273f7f26f5a020cd23ce513fa9f268a86aadd2f8c66d19047051605c9871b5f0b1652fd1afea3171c8c5a21331e573bac33c8ae24a7167a40796833932b56f36487c68331d98c7da8a495a80cc200eb21e7f6a2e4eb4af8d79c8835510e6196c6426aa430ebcbecf7a67646e2408580366898db54f378db24ea3ac25c5514d8de7cbcbe82b72b382c2de91386c2e529a3f33344d6ba1047333b8ce854b5d1f091d9b12643bbb2c56b58af03162437c409e9016088513c00a35ccf4e5d63123f0194df014460c18dca67e63856cf738c46e3a42f9a7629f25aa63fd638dbcae3a00941a1e28b7b13f259c48178578fccd5edd3f515b13d29fd96552724f1dd58531bd0a988328c8a3df028abb39ee4dcb9aed2aa621acec789e43d219a89765fdfa122950ad83fe6827c08055bd5a25e335fbdd79e83b894678a710d538e16cdb046db16e087964d791cbbe26941685e9928230e0cbcd43523a413f57d8215064ecc5f8facf236861057449aaa7b534b598d3ae06a46d18833ba0dd6fba405947c49c7906f1714304d78315e77027d15e64b8c08f5e62c62b29b6d1acc818e9988ed77d9100e973a7251932b7fafe202bb5cd8a34eafc6ce2d6e26b92609c6b99aba1ca45946bf3a323b03f69bf30d67ff5b4b4c9db143295fc2ab233497445f49320bbc26e9f9934012c84a3c80137a9206ad7257e0a3be014f2632c502f04b93ffacdc610cc8606ec2e1fff7214d1e372db77318d312bfa278397895834ea9db7c8d512c8102f0ad9ce9c3105e3bcb3518c2f92b187a63ac1f1e8dcbe643fe65b54f181e0d597413e56666e213283e0ab04026dcb8298fee053cacb15a52dbedf96d994a306210de0c41b62b9f7d0d3496c21053b698f9fab059f6dece09554ec3ab6959ed4d8826fa1ef5900068513088f5e971cd41b4df81c9e023f02a0d967a65d475a502b97415bf")),new TextEncoder().encode(t.slice(0,4000)),'Huffman/FSE');
 /* C: 300000 nol — RLE bloklar (o’lchami oqimdagi 1 baytdan katta) */
 same(dec(hex("28b52ffda4e09304005400001000000100fbff39c00202001000039f04002d28de26")),new(U8())(300000),'RLE');
 assert.throws(()=>dec(new(U8())(16).fill(1)),/zstd/,'zstd bo’lmagan ma’lumot xato berishi kerak')});
(async()=>{let bad=0;for(const[n,f]of tests){try{await f();console.log('✓',n)}catch(e){bad++;console.log('✗',n,'\n   ',e.message)}}
 console.log(bad?'\n'+bad+' ta test yiqildi':'\nHamma testlar o’tdi');process.exit(bad?1:0)})();
