/* ---- Rasmdan 3D: relyef (yorqinlik → balandlik) va siluet (kontur bo'yicha cho'zish) ----
   Hammasi brauzerda bajariladi, rasm serverga yuborilmaydi. Natija — yopiq (suv o'tkazmaydigan) qattiq jism: yuqori sirt,
   tekis tag va devorlar; shuning uchun 3D bosib chiqarishga (STL) ham yaraydi. Rasm teksturaga aylantiriladi (DFF/TXD ga ham o'tadi). */
function img3dBuild(px,nx,ny,o){
 o=Object.assign({mode:'relief',width:1,height:.1,base:.02,invert:false,blur:1,athr:128,thr:128},o||{});
 const N=nx*ny,Wd=o.width,Hd=Wd*(ny/nx),lum=new Float32Array(N),raw=new Float32Array(N);let hasAlpha=false;
 for(let i=0;i<N;i++){const a=px[i*4+3];if(a<250)hasAlpha=true;raw[i]=(.299*px[i*4]+.587*px[i*4+1]+.114*px[i*4+2])/255}
 const mask=new Uint8Array(N);
 for(let i=0;i<N;i++){
  const a=px[i*4+3],opaque=a>=o.athr;
  if(o.mode=='sil'){mask[i]=hasAlpha?(opaque?1:0):(o.invert?(raw[i]>o.thr/255):(raw[i]<o.thr/255))?1:0}
  else mask[i]=opaque?1:0;
  lum[i]=o.invert?1-raw[i]:raw[i]}
 /* yumshatish: 3×3 o'rtacha, faqat relyefda; maska tashqarisidagi piksellar hisobga olinmaydi */
 for(let p=0;p<(o.mode=='sil'?0:o.blur);p++){const t=new Float32Array(N);
  for(let y=0;y<ny;y++)for(let x=0;x<nx;x++){let s=0,c=0;for(let dy=-1;dy<=1;dy++)for(let dx=-1;dx<=1;dx++){const X=x+dx,Y=y+dy;if(X<0||Y<0||X>=nx||Y>=ny)continue;const k=Y*nx+X;if(!mask[k])continue;s+=lum[k];c++}t[y*nx+x]=c?s/c:lum[y*nx+x]}
  lum.set(t)}
 const top=new Float32Array(N);
 for(let i=0;i<N;i++)top[i]=o.mode=='sil'?o.height:o.base+o.height*lum[i];
 const cell=new Uint8Array((nx-1)*(ny-1));let nc=0;
 for(let y=0;y<ny-1;y++)for(let x=0;x<nx-1;x++){const i=y*nx+x;if(mask[i]&&mask[i+1]&&mask[i+nx]&&mask[i+nx+1]){cell[y*(nx-1)+x]=1;nc++}}
 if(!nc)return null;
 const pos=[],uv=[],idx=[];
 const px_=x=>(x/(nx-1)-.5)*Wd,py_=y=>(.5-y/(ny-1))*Hd;
 /* yuqori sirt: umumiy uchlar (silliq normal) */
 for(let y=0;y<ny;y++)for(let x=0;x<nx;x++){pos.push(px_(x),py_(y),top[y*nx+x]);uv.push(x/(nx-1),1-y/(ny-1))}
 const T=(x,y)=>y*nx+x,Bo=nx*ny;
 /* tag: alohida uchlar (z=0) */
 for(let y=0;y<ny;y++)for(let x=0;x<nx;x++){pos.push(px_(x),py_(y),0);uv.push(x/(nx-1),1-y/(ny-1))}
 for(let y=0;y<ny-1;y++)for(let x=0;x<nx-1;x++){if(!cell[y*(nx-1)+x])continue;
  const a=T(x,y),b=T(x+1,y),c=T(x,y+1),d=T(x+1,y+1);
  idx.push(c,d,b, c,b,a);                       // yuqori (+Z)
  idx.push(Bo+c,Bo+b,Bo+d, Bo+c,Bo+a,Bo+b)}      // tag (−Z)
 /* devorlar: chegaradagi har bir katak qirrasi uchun, har devor o'z uchlari bilan (aniq qirra) */
 const has=(x,y)=>x>=0&&y>=0&&x<nx-1&&y<ny-1&&cell[y*(nx-1)+x]==1;
 const wall=(p,q)=>{const pb=pos.length/3;
  pos.push(pos[p*3],pos[p*3+1],pos[p*3+2],pos[p*3],pos[p*3+1],0,pos[q*3],pos[q*3+1],0,pos[q*3],pos[q*3+1],pos[q*3+2]);
  uv.push(uv[p*2],uv[p*2+1],uv[p*2],uv[p*2+1],uv[q*2],uv[q*2+1],uv[q*2],uv[q*2+1]);
  idx.push(pb,pb+1,pb+2, pb,pb+2,pb+3)};
 for(let y=0;y<ny-1;y++)for(let x=0;x<nx-1;x++){if(!has(x,y))continue;
  const a=T(x,y),b=T(x+1,y),c=T(x,y+1),d=T(x+1,y+1);
  if(!has(x-1,y))wall(a,c);   // chap  (a→c)
  if(!has(x,y+1))wall(c,d);   // past  (c→d)
  if(!has(x+1,y))wall(d,b);   // o'ng  (d→b)
  if(!has(x,y-1))wall(b,a)}   // yuqori(b→a)
 const g=new THREE.BufferGeometry();
 g.setAttribute('position',new THREE.Float32BufferAttribute(pos,3));g.setAttribute('uv',new THREE.Float32BufferAttribute(uv,2));
 g.setIndex(new THREE.Uint32BufferAttribute(idx,1));g.computeVertexNormals();
 return g}
/* Piksellar → tayyor mesh (materiali bilan). tex: ixtiyoriy THREE.Texture */
function img3dMesh(px,nx,ny,name,o,tex){
 const g=img3dBuild(px,nx,ny,o);if(!g)return null;
 const m=new THREE.MeshStandardMaterial({color:tex?0xffffff:0xcfd3d8,side:2,roughness:.8,metalness:0});
 if(tex){m.map=tex;m.userData.tex=name}
 const mesh=new THREE.Mesh(g,m);mesh.name=name+'_3d';return mesh}
/* ---------- oyna (dialog) ---------- */
(function(){
 if(typeof document=='undefined'||!document.createElement)return;
 const d=document.createElement('dialog');d.id='i3d';
 d.style.cssText='background:var(--pn);color:var(--tx);border:1px solid var(--bd);border-radius:8px;padding:0;max-width:94vw;width:380px;box-shadow:0 10px 30px #000c';
 d.innerHTML=`<div class="ph" style="display:flex;align-items:center"><b>Rasmdan 3D</b><span class="sp"></span><button type="button" id="i3x" title="Yopish">✕</button></div>
<div style="padding:8px 10px;display:grid;gap:7px;max-height:78vh;overflow:auto">
<label class="it" style="background:var(--ip);text-align:center">Rasm tanlash (PNG, JPG, WEBP)…<input id="i3f" type="file" accept="image/*" hidden></label>
<canvas id="i3p" width="160" height="100" style="width:100%;max-height:110px;object-fit:contain;background:#222;border-radius:4px"></canvas>
<div id="i3n" style="color:var(--mt)">Rasm tanlanmagan</div>
<label>Rejim <select id="i3m" style="width:100%"><option value="relief">Relyef — yorqinlik balandlikka aylanadi</option><option value="sil">Siluet — kontur bo’yicha cho’zish</option></select></label>
<div class="row" style="padding:0"><label style="flex:1">Kenglik<input id="i3w" type="number" step="0.1" min="0.01" value="1" style="width:100%"></label>
<label style="flex:1">Balandlik / qalinlik<input id="i3h" type="number" step="0.01" min="0.001" value="0.1" style="width:100%"></label>
<label style="flex:1">Asos qalinligi<input id="i3b" type="number" step="0.01" min="0" value="0.02" style="width:100%"></label></div>
<label>Aniqlik (panjara): <b id="i3rv">160</b><input id="i3r" type="range" min="32" max="256" step="8" value="160" style="width:100%"></label>
<label>Yumshatish: <b id="i3sv">1</b><input id="i3s" type="range" min="0" max="4" step="1" value="1" style="width:100%"></label>
<label>Siluet chegarasi: <b id="i3tv">128</b><input id="i3t" type="range" min="1" max="254" step="1" value="128" style="width:100%"></label>
<label class="chk"><input id="i3i" type="checkbox">Teskari (yorug’ ↔ qorong’i)</label>
<label class="chk"><input id="i3c" type="checkbox" checked>Rasmni tekstura qilib qo’llash</label>
<div class="row" style="padding:0"><button type="button" id="i3g" class="pri" style="flex:1">Yaratish</button><button type="button" id="i3z" style="flex:1">Yopish</button></div>
<div id="i3i2" style="color:var(--mt)"></div></div>`;
 document.body.appendChild(d);
 const Q=s=>d.querySelector(s);let src=null,fname='rasm';
 const safe=n=>String(n).replace(/\.[^.]+$/,'').replace(/[^\w]+/g,'_').replace(/^_+|_+$/g,'').slice(0,24)||'rasm';
 Q('#i3x').onclick=Q('#i3z').onclick=()=>d.close();
 d.addEventListener('keydown',e=>e.stopPropagation());
 const bind=(a,b)=>{Q(a).oninput=()=>Q(b).textContent=Q(a).value;};bind('#i3r','#i3rv');bind('#i3s','#i3sv');bind('#i3t','#i3tv');
 const dims=()=>{const r=+Q('#i3r').value,A=src.w/src.h;return A>=1?[r,Math.max(2,Math.round(r/A))]:[Math.max(2,Math.round(r*A)),r]};
 const grab=(w,h)=>{const c=document.createElement('canvas');c.width=w;c.height=h;const x=c.getContext('2d',{willReadFrequently:true});x.clearRect(0,0,w,h);x.drawImage(src.bmp,0,0,w,h);return{c,x}};
 const pow2=n=>1<<Math.max(5,Math.floor(Math.log2(Math.max(32,n))));
 Q('#i3f').onchange=async e=>{const f=e.target.files[0];e.target.value='';if(!f)return;
  try{let bmp;try{bmp=await createImageBitmap(f,{imageOrientation:'from-image'})}catch(x){bmp=await createImageBitmap(f)}
   src={bmp,w:bmp.width,h:bmp.height};fname=safe(f.name);
   const p=Q('#i3p'),px=p.getContext('2d'),k=Math.min(160/src.w,100/src.h);p.width=Math.max(1,Math.round(src.w*k));p.height=Math.max(1,Math.round(src.h*k));px.drawImage(bmp,0,0,p.width,p.height);
   Q('#i3n').textContent=f.name+' · '+src.w+'×'+src.h}catch(x){src=null;Q('#i3n').textContent='Rasm ochilmadi: '+(x.message||x)}};
 Q('#i3g').onclick=()=>{
  if(!src)return toast('Avval rasm tanlang');
  try{const [nx,ny]=dims(),{x}=grab(nx,ny),px=x.getImageData(0,0,nx,ny).data;
   const o={mode:Q('#i3m').value,width:+Q('#i3w').value||1,height:+Q('#i3h').value||.1,base:+Q('#i3b').value||0,invert:Q('#i3i').checked,blur:+Q('#i3s').value,thr:+Q('#i3t').value};
   let tex=null;
   if(Q('#i3c').checked){const tw=pow2(Math.min(1024,src.w)),th=pow2(Math.min(1024,src.h)),t=grab(tw,th);tex=new THREE.CanvasTexture(t.c);tex.name=fname;tex.encoding=THREE.sRGBEncoding}
   const mesh=img3dMesh(px,nx,ny,fname,o,tex);
   if(!mesh)return toast('Hech narsa yaratilmadi: siluet chegarasini o’zgartiring yoki “Teskari”ni yoqing');
   mesh.userData.img3d=1;add(mesh);fit(mesh);d.close();
   toast('Yaratildi: '+Math.round(mesh.geometry.index.count/3)+' ta uchburchak')}
  catch(x){toast('Xato: '+(x.message||x))}};
 const b=$('#img3d');if(b)b.onclick=()=>{const m=document.querySelector('details.mn[open]');m&&m.removeAttribute('open');d.showModal()};
})();
