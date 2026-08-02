/* 学习乐园 · Service Worker（离线缓存） */
'use strict';

var CACHE = 'xx3-v6';

var ASSETS = [
  './',
  './index.html',
  './kousuan.html',
  './yuwen.html',
  './yingyu.html',
  './kexue.html',
  './parent.html',
  './doudizhu.html',
  './minecraft.html',
  './manifest.json',
  './css/style.css',
  './js/common.js',
  './js/data.js',
  './js/home.js',
  './js/kousuan.js',
  './js/yuwen.js',
  './js/yingyu.js',
  './js/kexue.js',
  './js/parent.js',
  './js/doudizhu-core.js',
  './js/doudizhu.js',
  './js/minecraft.js',
  './js/vendor/three.min.js',
  './icons/icon-180.png',
  './icons/icon-192.png',
  './icons/icon-512.png'
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
