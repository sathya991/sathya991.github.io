'use strict';
const MANIFEST = 'flutter-app-manifest';
const TEMP = 'flutter-temp-cache';
const CACHE_NAME = 'flutter-app-cache';
const RESOURCES = {
  "version.json": "009c9e65172e010890f7f65fde438006",
"index.html": "13dc797ce9328493a7ac251f6e46d87e",
"/": "13dc797ce9328493a7ac251f6e46d87e",
"main.dart.js": "50707241d64d76bcbeae85729c5b4da7",
"flutter.js": "eb2682e33f25cd8f1fc59011497c35f8",
"favicon.png": "5dcef449791fa27946b3d35ad8803796",
"icons/Icon-192.png": "ac9a721a12bbc803b44f645561ecb1e1",
"icons/Icon-maskable-192.png": "c457ef57daa1d16f64b27b786ec2ea3c",
"icons/Icon-maskable-512.png": "301a7604d45b3e739efc881eb04896ea",
"icons/Icon-512.png": "96e752610906ba2a93c65f8abe1645f1",
"manifest.json": "d40c47d1c161f94dbcb13094d37f1f55",
"assets/AssetManifest.json": "7ab4451282affebb671ef61a3e1bb08c",
"assets/NOTICES": "2d7d85a94c2cccb5417d9615b80dae0a",
"assets/FontManifest.json": "dc3d03800ccca4601324923c0b1d6d57",
"assets/packages/cupertino_icons/assets/CupertinoIcons.ttf": "6d342eb68f170c97609e9da345464e5e",
"assets/fonts/MaterialIcons-Regular.otf": "95db9098c58fd6db106f1116bae85a0b",
"assets/assets/images/porfolio.png": "cff688e38ef8aec7253c7a8f0b97cb91",
"assets/assets/images/linkLogo.png": "1b18d461ce75c75fdb4d7b6ec08b3e65",
"assets/assets/images/portfolioImage3.png": "c56eecfda0ce7132d3e98289d0ede748",
"assets/assets/images/1024.png": "94d9de170462afd3aa9b335b6b9a9841",
"assets/assets/images/portfolioImage2.png": "f5ab512e04d1c9402f28af784d0e9bc3",
"assets/assets/images/portfolioImage1.png": "895f24612aba630cc8df025ef27addb4",
"assets/assets/images/instagram.png": "4a8c23476a7c20c5bee2a752a6f96e9e",
"assets/assets/images/github.png": "63de5479e8eb4676570c49e2579cab01",
"assets/assets/images/cBG.jpg": "683218495208108273804b5ffbee5c27",
"assets/assets/images/android.png": "4d0751ca410345fdb49ee12ce41741ce",
"assets/assets/images/gmail.png": "eabc1a70245f1384e30960f25f9b2784",
"assets/assets/images/todoImage8.png": "58b3a40704f175e25fea0f72fb2460d2",
"assets/assets/images/background.jpg": "452eaf7f49793d34768a4bc1aeb5dd70",
"assets/assets/images/worksBG.jpg": "580cf82fe7d45d6772b53110b2b2d4ba",
"assets/assets/images/todoImage6.png": "5b807bf86f82b2bd3376a79a044b9890",
"assets/assets/images/todoImage7.png": "6abe2fe32919eb9437993bdc3b413449",
"assets/assets/images/todoImage5.png": "81bfa111471953f5295da0b9561e13fc",
"assets/assets/images/todoImage4.png": "912e34970fc3e5394af0e2f3d70c82f4",
"assets/assets/images/cloud.png": "633a01b26fe0c48b992f80dfd8c03067",
"assets/assets/images/twitter.png": "5e50007c58f3521b7fd6470e6af616c6",
"assets/assets/images/handshake.png": "91a71ee4a9aa3456138474b208440fe1",
"assets/assets/images/todoImage1.png": "72df7a5b08e8e56c4aabb500317822e6",
"assets/assets/images/todoImage3.png": "36715bf4b9f6d51ad4480c322ed9bbc9",
"assets/assets/images/web.png": "da9c79f9a2b05323b0cf7bb31c518800",
"assets/assets/images/todoImage2.png": "86ecfcd6b82b8ef2ce7e1af09630e9d2",
"assets/assets/images/ios.jpeg": "e360a2f7bb9d216cc79a0d891608d94c",
"assets/assets/images/whatsapp.png": "a59e768eebc730446e35f676487b8815",
"canvaskit/canvaskit.js": "c2b4e5f3d7a3d82aed024e7249a78487",
"canvaskit/profiling/canvaskit.js": "ae2949af4efc61d28a4a80fffa1db900",
"canvaskit/profiling/canvaskit.wasm": "95e736ab31147d1b2c7b25f11d4c32cd",
"canvaskit/canvaskit.wasm": "4b83d89d9fecbea8ca46f2f760c5a9ba"
};

// The application shell files that are downloaded before a service worker can
// start.
const CORE = [
  "main.dart.js",
"index.html",
"assets/NOTICES",
"assets/AssetManifest.json",
"assets/FontManifest.json"];
// During install, the TEMP cache is populated with the application shell files.
self.addEventListener("install", (event) => {
  self.skipWaiting();
  return event.waitUntil(
    caches.open(TEMP).then((cache) => {
      return cache.addAll(
        CORE.map((value) => new Request(value, {'cache': 'reload'})));
    })
  );
});

// During activate, the cache is populated with the temp files downloaded in
// install. If this service worker is upgrading from one with a saved
// MANIFEST, then use this to retain unchanged resource files.
self.addEventListener("activate", function(event) {
  return event.waitUntil(async function() {
    try {
      var contentCache = await caches.open(CACHE_NAME);
      var tempCache = await caches.open(TEMP);
      var manifestCache = await caches.open(MANIFEST);
      var manifest = await manifestCache.match('manifest');
      // When there is no prior manifest, clear the entire cache.
      if (!manifest) {
        await caches.delete(CACHE_NAME);
        contentCache = await caches.open(CACHE_NAME);
        for (var request of await tempCache.keys()) {
          var response = await tempCache.match(request);
          await contentCache.put(request, response);
        }
        await caches.delete(TEMP);
        // Save the manifest to make future upgrades efficient.
        await manifestCache.put('manifest', new Response(JSON.stringify(RESOURCES)));
        return;
      }
      var oldManifest = await manifest.json();
      var origin = self.location.origin;
      for (var request of await contentCache.keys()) {
        var key = request.url.substring(origin.length + 1);
        if (key == "") {
          key = "/";
        }
        // If a resource from the old manifest is not in the new cache, or if
        // the MD5 sum has changed, delete it. Otherwise the resource is left
        // in the cache and can be reused by the new service worker.
        if (!RESOURCES[key] || RESOURCES[key] != oldManifest[key]) {
          await contentCache.delete(request);
        }
      }
      // Populate the cache with the app shell TEMP files, potentially overwriting
      // cache files preserved above.
      for (var request of await tempCache.keys()) {
        var response = await tempCache.match(request);
        await contentCache.put(request, response);
      }
      await caches.delete(TEMP);
      // Save the manifest to make future upgrades efficient.
      await manifestCache.put('manifest', new Response(JSON.stringify(RESOURCES)));
      return;
    } catch (err) {
      // On an unhandled exception the state of the cache cannot be guaranteed.
      console.error('Failed to upgrade service worker: ' + err);
      await caches.delete(CACHE_NAME);
      await caches.delete(TEMP);
      await caches.delete(MANIFEST);
    }
  }());
});

// The fetch handler redirects requests for RESOURCE files to the service
// worker cache.
self.addEventListener("fetch", (event) => {
  if (event.request.method !== 'GET') {
    return;
  }
  var origin = self.location.origin;
  var key = event.request.url.substring(origin.length + 1);
  // Redirect URLs to the index.html
  if (key.indexOf('?v=') != -1) {
    key = key.split('?v=')[0];
  }
  if (event.request.url == origin || event.request.url.startsWith(origin + '/#') || key == '') {
    key = '/';
  }
  // If the URL is not the RESOURCE list then return to signal that the
  // browser should take over.
  if (!RESOURCES[key]) {
    return;
  }
  // If the URL is the index.html, perform an online-first request.
  if (key == '/') {
    return onlineFirst(event);
  }
  event.respondWith(caches.open(CACHE_NAME)
    .then((cache) =>  {
      return cache.match(event.request).then((response) => {
        // Either respond with the cached resource, or perform a fetch and
        // lazily populate the cache.
        return response || fetch(event.request).then((response) => {
          cache.put(event.request, response.clone());
          return response;
        });
      })
    })
  );
});

self.addEventListener('message', (event) => {
  // SkipWaiting can be used to immediately activate a waiting service worker.
  // This will also require a page refresh triggered by the main worker.
  if (event.data === 'skipWaiting') {
    self.skipWaiting();
    return;
  }
  if (event.data === 'downloadOffline') {
    downloadOffline();
    return;
  }
});

// Download offline will check the RESOURCES for all files not in the cache
// and populate them.
async function downloadOffline() {
  var resources = [];
  var contentCache = await caches.open(CACHE_NAME);
  var currentContent = {};
  for (var request of await contentCache.keys()) {
    var key = request.url.substring(origin.length + 1);
    if (key == "") {
      key = "/";
    }
    currentContent[key] = true;
  }
  for (var resourceKey of Object.keys(RESOURCES)) {
    if (!currentContent[resourceKey]) {
      resources.push(resourceKey);
    }
  }
  return contentCache.addAll(resources);
}

// Attempt to download the resource online before falling back to
// the offline cache.
function onlineFirst(event) {
  return event.respondWith(
    fetch(event.request).then((response) => {
      return caches.open(CACHE_NAME).then((cache) => {
        cache.put(event.request, response.clone());
        return response;
      });
    }).catch((error) => {
      return caches.open(CACHE_NAME).then((cache) => {
        return cache.match(event.request).then((response) => {
          if (response != null) {
            return response;
          }
          throw error;
        });
      });
    })
  );
}
