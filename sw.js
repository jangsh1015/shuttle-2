/* 2호차 셔틀 시간표 — 오프라인 지원 Service Worker (build.py가 생성)

- 네트워크가 있으면 항상 새 배포본을 받는다 (network-first)
- 네트워크가 없으면 마지막으로 저장해 둔 잠금 화면(index.html)을 그대로 연다
- index.html 은 암호문만 담고 있어 캐시에 남아도 학생 정보는 드러나지 않는다
*/
var CACHE = 'shuttle-2-shell-202611240659';
var SCOPE = new URL('./', self.location.href).href;
var SHELL = new URL('index.html', SCOPE).href;
var PRECACHE = [SCOPE, SHELL, new URL('icon.png', SCOPE).href];

self.addEventListener('install', function(e){
  e.waitUntil(
    caches.open(CACHE).then(function(c){
      return Promise.all(PRECACHE.map(function(u){
        return fetch(new Request(u, {cache:'reload'})).then(function(r){
          if (r && r.ok) return c.put(u, r);
        }).catch(function(){});
      }));
    }).then(function(){ return self.skipWaiting(); })
  );
});

self.addEventListener('activate', function(e){
  e.waitUntil(
    caches.keys().then(function(keys){
      return Promise.all(keys.map(function(k){
        if (k !== CACHE && k.indexOf('shuttle-2-shell-') === 0) return caches.delete(k);
      }));
    }).then(function(){ return self.clients.claim(); })
  );
});

self.addEventListener('fetch', function(e){
  var req = e.request;
  if (req.method !== 'GET') return;
  var url;
  try { url = new URL(req.url); } catch (err) { return; }
  if (url.origin !== self.location.origin) return;
  if (url.href.indexOf(SCOPE) !== 0) return;

  var key = url.origin + url.pathname;

  e.respondWith(
    fetch(req, {cache:'no-store'}).then(function(res){
      if (res && res.ok && res.type === 'basic'){
        var copy = res.clone();
        caches.open(CACHE).then(function(c){ c.put(key, copy); }).catch(function(){});
      }
      return res;
    }).catch(function(){
      return caches.match(key).then(function(hit){
        if (hit) return hit;
        return caches.match(SHELL).then(function(shell){
          if (shell) return shell;
          return new Response(
            '<meta charset="utf-8"><p style="font:800 15px -apple-system,BlinkMacSystemFont,sans-serif;text-align:center;padding:40px 18px;color:#475569">오프라인이라 시간표를 열지 못했습니다.<br>인터넷이 연결되면 다시 열어 주세요.</p>',
            {status: 200, headers: {'Content-Type': 'text/html; charset=utf-8'}});
        });
      });
    })
  );
});
