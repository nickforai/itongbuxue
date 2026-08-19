/* i同步学 · Service Worker（离线缓存） */
'use strict';

var CACHE = 'xx3-v84';

var ASSETS = [
  './',
  './css/style.css',
  './doudizhu.html',
  './feiji.html',
  './foodchef.html',
  './hanbao.html',
  './icons/icon-180.png',
  './icons/icon-192.png',
  './icons/icon-512.png',
  './icons/splash-1536x2048.png',
  './icons/splash-1640x2360.png',
  './icons/splash-1668x2224.png',
  './icons/splash-1668x2388.png',
  './icons/splash-2048x1536.png',
  './icons/splash-2048x2732.png',
  './icons/splash-2224x1668.png',
  './icons/splash-2360x1640.png',
  './icons/splash-2388x1668.png',
  './icons/splash-2732x2048.png',
  './index.html',
  './js/common.js',
  './js/data-char.js',
  './js/data-reading.js',
  './js/data.js',
  './js/doudizhu-core.js',
  './js/doudizhu.js',
  './js/feiji.js',
  './js/foodchef.js',
  './js/home.js',
  './js/kexue.js',
  './js/kousuan.js',
  './js/minecraft.js',
  './js/parent.js',
  './js/pet.js',
  './js/pool.js',
  './js/shengzi.js',
  './js/storecook.js',
  './js/vendor/hanzi-data/一.json',
  './js/vendor/hanzi-data/三.json',
  './js/vendor/hanzi-data/丑.json',
  './js/vendor/hanzi-data/世.json',
  './js/vendor/hanzi-data/乐.json',
  './js/vendor/hanzi-data/书.json',
  './js/vendor/hanzi-data/二.json',
  './js/vendor/hanzi-data/云.json',
  './js/vendor/hanzi-data/人.json',
  './js/vendor/hanzi-data/信.json',
  './js/vendor/hanzi-data/假.json',
  './js/vendor/hanzi-data/健.json',
  './js/vendor/hanzi-data/全.json',
  './js/vendor/hanzi-data/写.json',
  './js/vendor/hanzi-data/冬.json',
  './js/vendor/hanzi-data/力.json',
  './js/vendor/hanzi-data/功.json',
  './js/vendor/hanzi-data/努.json',
  './js/vendor/hanzi-data/勇.json',
  './js/vendor/hanzi-data/十.json',
  './js/vendor/hanzi-data/卫.json',
  './js/vendor/hanzi-data/友.json',
  './js/vendor/hanzi-data/口.json',
  './js/vendor/hanzi-data/叶.json',
  './js/vendor/hanzi-data/同.json',
  './js/vendor/hanzi-data/听.json',
  './js/vendor/hanzi-data/和.json',
  './js/vendor/hanzi-data/善.json',
  './js/vendor/hanzi-data/喜.json',
  './js/vendor/hanzi-data/团.json',
  './js/vendor/hanzi-data/国.json',
  './js/vendor/hanzi-data/圆.json',
  './js/vendor/hanzi-data/地.json',
  './js/vendor/hanzi-data/坚.json',
  './js/vendor/hanzi-data/夏.json',
  './js/vendor/hanzi-data/大.json',
  './js/vendor/hanzi-data/天.json',
  './js/vendor/hanzi-data/失.json',
  './js/vendor/hanzi-data/学.json',
  './js/vendor/hanzi-data/安.json',
  './js/vendor/hanzi-data/家.json',
  './js/vendor/hanzi-data/对.json',
  './js/vendor/hanzi-data/小.json',
  './js/vendor/hanzi-data/山.json',
  './js/vendor/hanzi-data/师.json',
  './js/vendor/hanzi-data/希.json',
  './js/vendor/hanzi-data/平.json',
  './js/vendor/hanzi-data/幸.json',
  './js/vendor/hanzi-data/庆.json',
  './js/vendor/hanzi-data/康.json',
  './js/vendor/hanzi-data/德.json',
  './js/vendor/hanzi-data/心.json',
  './js/vendor/hanzi-data/忆.json',
  './js/vendor/hanzi-data/思.json',
  './js/vendor/hanzi-data/恶.json',
  './js/vendor/hanzi-data/想.json',
  './js/vendor/hanzi-data/成.json',
  './js/vendor/hanzi-data/手.json',
  './js/vendor/hanzi-data/持.json',
  './js/vendor/hanzi-data/敢.json',
  './js/vendor/hanzi-data/旗.json',
  './js/vendor/hanzi-data/日.json',
  './js/vendor/hanzi-data/早.json',
  './js/vendor/hanzi-data/时.json',
  './js/vendor/hanzi-data/星.json',
  './js/vendor/hanzi-data/春.json',
  './js/vendor/hanzi-data/晚.json',
  './js/vendor/hanzi-data/晴.json',
  './js/vendor/hanzi-data/月.json',
  './js/vendor/hanzi-data/朋.json',
  './js/vendor/hanzi-data/望.json',
  './js/vendor/hanzi-data/林.json',
  './js/vendor/hanzi-data/果.json',
  './js/vendor/hanzi-data/树.json',
  './js/vendor/hanzi-data/校.json',
  './js/vendor/hanzi-data/桥.json',
  './js/vendor/hanzi-data/梦.json',
  './js/vendor/hanzi-data/欢.json',
  './js/vendor/hanzi-data/水.json',
  './js/vendor/hanzi-data/江.json',
  './js/vendor/hanzi-data/河.json',
  './js/vendor/hanzi-data/活.json',
  './js/vendor/hanzi-data/海.json',
  './js/vendor/hanzi-data/湖.json',
  './js/vendor/hanzi-data/火.json',
  './js/vendor/hanzi-data/灯.json',
  './js/vendor/hanzi-data/爱.json',
  './js/vendor/hanzi-data/牛.json',
  './js/vendor/hanzi-data/班.json',
  './js/vendor/hanzi-data/瓜.json',
  './js/vendor/hanzi-data/生.json',
  './js/vendor/hanzi-data/田.json',
  './js/vendor/hanzi-data/界.json',
  './js/vendor/hanzi-data/白.json',
  './js/vendor/hanzi-data/目.json',
  './js/vendor/hanzi-data/真.json',
  './js/vendor/hanzi-data/祝.json',
  './js/vendor/hanzi-data/福.json',
  './js/vendor/hanzi-data/禾.json',
  './js/vendor/hanzi-data/秋.json',
  './js/vendor/hanzi-data/窗.json',
  './js/vendor/hanzi-data/笔.json',
  './js/vendor/hanzi-data/答.json',
  './js/vendor/hanzi-data/米.json',
  './js/vendor/hanzi-data/红.json',
  './js/vendor/hanzi-data/纸.json',
  './js/vendor/hanzi-data/绿.json',
  './js/vendor/hanzi-data/羊.json',
  './js/vendor/hanzi-data/美.json',
  './js/vendor/hanzi-data/老.json',
  './js/vendor/hanzi-data/耳.json',
  './js/vendor/hanzi-data/船.json',
  './js/vendor/hanzi-data/节.json',
  './js/vendor/hanzi-data/花.json',
  './js/vendor/hanzi-data/苗.json',
  './js/vendor/hanzi-data/草.json',
  './js/vendor/hanzi-data/蓝.json',
  './js/vendor/hanzi-data/记.json',
  './js/vendor/hanzi-data/讲.json',
  './js/vendor/hanzi-data/诚.json',
  './js/vendor/hanzi-data/说.json',
  './js/vendor/hanzi-data/读.json',
  './js/vendor/hanzi-data/豆.json',
  './js/vendor/hanzi-data/败.json',
  './js/vendor/hanzi-data/贺.json',
  './js/vendor/hanzi-data/足.json',
  './js/vendor/hanzi-data/路.json',
  './js/vendor/hanzi-data/车.json',
  './js/vendor/hanzi-data/错.json',
  './js/vendor/hanzi-data/门.json',
  './js/vendor/hanzi-data/问.json',
  './js/vendor/hanzi-data/间.json',
  './js/vendor/hanzi-data/队.json',
  './js/vendor/hanzi-data/阴.json',
  './js/vendor/hanzi-data/雨.json',
  './js/vendor/hanzi-data/雪.json',
  './js/vendor/hanzi-data/霜.json',
  './js/vendor/hanzi-data/面.json',
  './js/vendor/hanzi-data/风.json',
  './js/vendor/hanzi-data/马.json',
  './js/vendor/hanzi-data/鱼.json',
  './js/vendor/hanzi-data/鸟.json',
  './js/vendor/hanzi-data/黄.json',
  './js/vendor/hanzi-data/黑.json',
  './js/vendor/hanzi-writer.min.js',
  './js/vendor/three.min.js',
  './js/wrongredo.js',
  './js/yingyu.js',
  './js/yuedu.js',
  './js/yuwen.js',
  './kexue.html',
  './kousuan.html',
  './manifest.json',
  './minecraft.html',
  './niupai.html',
  './parent.html',
  './pet.html',
  './pool.html',
  './shengzi.html',
  './tangbao.html',
  './wrongredo.html',
  './yingyu.html',
  './yuedu.html',
  './yuwen.html',
];

self.addEventListener('install', function (event) {
  event.waitUntil(
    caches.open(CACHE).then(function (cache) {
      return cache.addAll(ASSETS);
    }).then(function () {
      return self.skipWaiting();
    })
  );
});

self.addEventListener('activate', function (event) {
  event.waitUntil(
    caches.keys().then(function (keys) {
      return Promise.all(
        keys.filter(function (k) { return k !== CACHE; }).map(function (k) { return caches.delete(k); })
      );
    }).then(function () {
      return self.clients.claim();
    })
  );
});

self.addEventListener('fetch', function (event) {
  if (event.request.method !== 'GET') return;
  // 页面（导航）优先走网络，确保永远拿到最新版，避免和新 JS 不匹配
  if (event.request.mode === 'navigate') {
    event.respondWith(
      fetch(event.request).then(function (res) {
        var copy = res.clone();
        caches.open(CACHE).then(function (cache) { cache.put(event.request, copy); });
        return res;
      }).catch(function () {
        return caches.match(event.request).then(function (hit) {
          return hit || caches.match('./index.html');
        });
      })
    );
    return;
  }
  event.respondWith(
    caches.match(event.request).then(function (hit) {
      if (hit) return hit;
      return fetch(event.request).then(function (res) {
        if (res && res.status === 200 && (res.type === 'basic' || res.type === 'default')) {
          var copy = res.clone();
          caches.open(CACHE).then(function (cache) { cache.put(event.request, copy); });
        }
        return res;
      }).catch(function () {
        return caches.match('./index.html');
      });
    })
  );
});
