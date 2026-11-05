/* نگهبان آفلاین بایگانی اطلاعات */
const CACHE='baygan-v1';
const CDN='baygan-cdn-v1';
const PRECACHE=['./','./index.html','./manifest.json','./icon-192.png','./icon-512.png'];

self.addEventListener('install',e=>{
  e.waitUntil(caches.open(CACHE).then(c=>Promise.allSettled(PRECACHE.map(p=>c.add(p)))).then(()=>self.skipWaiting()));
});

self.addEventListener('activate',e=>{
  e.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(k=>k!==CACHE&&k!==CDN).map(k=>caches.delete(k)))).then(()=>self.clients.claim()));
});

self.addEventListener('fetch',e=>{
  const req=e.request;
  if(req.method!=='GET')return;
  const url=new URL(req.url);
  if(url.origin===self.location.origin){
    /* فایل‌های خود برنامه: اول اینترنت (برای دریافت آپدیت)، اگر آفلاین بود از کش */
    e.respondWith(
      fetch(req).then(res=>{
        const copy=res.clone();
        caches.open(CACHE).then(c=>c.put(req,copy));
        return res;
      }).catch(()=>caches.match(req).then(hit=>hit||caches.match('./index.html')))
    );
  }else{
    /* منابع بیرونی (فونت وزیر و کتابخانه‌ها): اول کش، اگر نبود از اینترنت */
    e.respondWith(
      caches.open(CDN).then(c=>c.match(req).then(hit=>{
        if(hit)return hit;
        return fetch(req).then(res=>{
          if(res&&res.ok)c.put(req,res.clone());
          return res;
        });
      }))
    );
  }
});
