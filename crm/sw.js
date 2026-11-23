// Service worker del CRM: permite abrir la app sin internet.
// - Archivos de la app: primero red (para recibir siempre la versión nueva); si no hay señal, copia guardada.
// - Programas de Firebase (gstatic, con versión fija): primero copia guardada.
// - Los datos (Firestore) NO pasan por aquí: Firestore guarda su propia copia sin conexión.
const V='crm-v5';
const SHELL=['./','index.html','firebase-config.js','manifest.json','icono.png','icon-192.png','icon-512.png','apple-touch-icon.png'];
const SDK=['https://www.gstatic.com/firebasejs/10.12.2/firebase-app-compat.js','https://www.gstatic.com/firebasejs/10.12.2/firebase-auth-compat.js','https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore-compat.js'];
self.addEventListener('install',e=>{e.waitUntil((async()=>{const c=await caches.open(V);
  await Promise.all(SHELL.map(u=>c.add(new Request(u,{cache:'reload'})).catch(()=>{})));
  await Promise.all(SDK.map(u=>fetch(u,{mode:'no-cors'}).then(r=>c.put(u,r)).catch(()=>{})));
  self.skipWaiting()})())});
self.addEventListener('activate',e=>{e.waitUntil((async()=>{for(const k of await caches.keys())if(k!==V)await caches.delete(k);await self.clients.claim()})())});
const timeout=(p,ms)=>new Promise((res,rej)=>{const t=setTimeout(()=>rej(new Error('timeout')),ms);p.then(v=>{clearTimeout(t);res(v)},e=>{clearTimeout(t);rej(e)})});
self.addEventListener('fetch',e=>{
  const r=e.request;if(r.method!=='GET')return;const u=new URL(r.url);
  if(u.hostname==='www.gstatic.com'&&u.pathname.startsWith('/firebasejs/')){
    e.respondWith(caches.match(r.url).then(m=>m||fetch(r).then(x=>{const cp=x.clone();caches.open(V).then(c=>c.put(r.url,cp));return x})));return}
  if(u.origin!==location.origin)return;
  e.respondWith((async()=>{const c=await caches.open(V);
    try{const x=await timeout(fetch(r),4000);if(x&&x.ok)c.put(r,x.clone());return x}
    catch(err){const m=await c.match(r,{ignoreSearch:true})||(r.mode==='navigate'?await c.match('index.html')||await c.match('./'):null);
      return m||new Response('Sin conexión',{status:503,headers:{'Content-Type':'text/plain; charset=utf-8'}})}})())});
