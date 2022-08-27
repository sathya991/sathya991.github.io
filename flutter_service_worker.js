'use strict';
const MANIFEST = 'flutter-app-manifest';
const TEMP = 'flutter-temp-cache';
const CACHE_NAME = 'flutter-app-cache';
const RESOURCES = {
  "version.json": "009c9e65172e010890f7f65fde438006",
"index.html": "5e8bf753de7ae2e01b99cab50933fb07",
"/": "5e8bf753de7ae2e01b99cab50933fb07",
"main.dart.js": "fe1388eb7be1512784ace567abf10b71",
"flutter.js": "eb2682e33f25cd8f1fc59011497c35f8",
"favicon.png": "5dcef449791fa27946b3d35ad8803796",
"icons/Icon-192.png": "ac9a721a12bbc803b44f645561ecb1e1",
"icons/Icon-maskable-192.png": "c457ef57daa1d16f64b27b786ec2ea3c",
"icons/Icon-maskable-512.png": "301a7604d45b3e739efc881eb04896ea",
"icons/Icon-512.png": "96e752610906ba2a93c65f8abe1645f1",
"manifest.json": "d40c47d1c161f94dbcb13094d37f1f55",
".git/config": "a969f2bc46aa8e8c65cea873462037ed",
".git/objects/0d/df8103e5763f568d3385e8da3eaab3e559c2b6": "ce517884316f79bf10903bba1504aa7b",
".git/objects/0d/0df08f7c3e147a8ae36017cf81a96e35b73717": "106e868f28a72727fb6fb0fa71123633",
".git/objects/59/62efb2dffef4c259bda261b128fcab4b659c34": "11e1a7683fedc73b6a0da57ee3c6a112",
".git/objects/59/d6de3600961bd7f7192687a73d061b6f2c29d6": "5dc0633620d662d4e47c2610bc56a762",
".git/objects/6a/47e79da0e628838fda7995785419efb54186d7": "8e538bbdacf549fea29ee42f7f8cc948",
".git/objects/3c/c84e31f88f789cc1f0279de27c032b560fe227": "4f464f57984faacf0b2182dbdd530223",
".git/objects/9d/caae21224f13ccbbaa4e07cca5f54e40643d38": "bae74917f680574724539d6c516da68f",
".git/objects/a4/3f2d869984eabb92b83a44a7d02c3e8ed7de56": "1a6efbc9574ff7b8b85cc7630e976624",
".git/objects/a4/4839e1d236136b331ef9915b889d76dcad3f48": "11caa4466e418af1517fb8d7cf3ea43e",
".git/objects/b2/f83dbb5e2b99f646887ae3e74fad79faa7de3f": "5128001f0af1c3feee7a7b005cc13fb6",
".git/objects/da/645b75fa1f56e67d1b4198fed7e386d5779b1d": "5564328865984c744b020ff8d8cf3f06",
".git/objects/b4/4c8ab8168e24f912d87a3229d4ee55bffa0444": "efd2550438af4c0855df921f81793e70",
".git/objects/b4/5401827fbf8902b76e566b15010866cbbd385b": "9d8f27f79ebf9ff1078bf04828372903",
".git/objects/a5/d395752eb2e121394f00b70b1fcd0b0491356d": "a46afbfdbe5fc9282c0cb7349142ccf2",
".git/objects/a5/5ba7eab127eec8496b444dd519e5862db6a993": "3e121d9ed4afe43068b438fa3703ac5c",
".git/objects/d6/9c56691fbdb0b7efa65097c7cc1edac12a6d3e": "868ce37a3a78b0606713733248a2f579",
".git/objects/ab/0e98497a51ead7821d1da35a24968ff314e50f": "557c35fe3928eb2af403d1b3926bb9ba",
".git/objects/e5/951dfb943474a56e611d9923405cd06c2dd28d": "c6fa51103d8db5478e1a43a661f6c68d",
".git/objects/eb/9b4d76e525556d5d89141648c724331630325d": "37c0954235cbe27c4d93e74fe9a578ef",
".git/objects/eb/10969aececcb1bd116825e95d95ba889337878": "ed65ae57e6282eb76df471e241a70a1d",
".git/objects/eb/af444535d91d112ac7bbd29536952fc1d7b0fe": "30e2b6e04c1661a2aa2514badb0dc9a3",
".git/objects/fd/66886c3bee76ae9c709ea0606b5e25a3502bd6": "941649891b5241cc86996e8b691d80cd",
".git/objects/f5/4e2e5db5cf94fdffaa5e9b78d7f5d8fb174c14": "07dd0ff46ebb7eda2bdc11bc61073533",
".git/objects/fe/3914bcf3baf9d87a873a444cac8aaf9dcd54c1": "372add7dd6cdabc32b9333e8d66bff72",
".git/objects/c8/5b76e7f032b0bceb04aec22979108d98105615": "5dea73dd2c3d69e7217dbf9c18d371f1",
".git/objects/4e/89617a3696bd10c155ec378f4a65a9f89e9e3a": "d8056e20bae90d092b619c895129e982",
".git/objects/4e/92da24fb8fcae1cf125504d9c9ff6b62e28278": "d30c36afa9391df07939346880d5f286",
".git/objects/20/631b0b53482bfd5bacf521fb85a4bf2549f34b": "47a0b0663c68e228163f303581b241fa",
".git/objects/29/2214367c0af9a2eee8f873b2944224e2fe3f0c": "902d6cf3d5ea70392a74bfc9ded583bb",
".git/objects/7c/d2bf06ed6426b4bd9582e1aa1b295cf6daa505": "31e9974c121d9a47b0e7f5a5953bcfe0",
".git/objects/1f/eb4b7e796d525fd00aca3c55074b30e0dac4f4": "23d58a9bbc865af0d068a50c9537e521",
".git/objects/80/a26e8501f7ffc1bd88dfed42627a589b4369c7": "515d1b29d1388fba80942b620d5a39af",
".git/objects/8a/aa46ac1ae21512746f852a42ba87e4165dfdd1": "1d8820d345e38b30de033aa4b5a23e7b",
".git/objects/26/59c0addbd271a3dbd56dca23d8513fbffd55c9": "8e2a130f8a255abfb80f84374a0a3b80",
".git/objects/86/a394fc1f9d19c0fcd312b2cfc73fdce41fe052": "1c3cdc4efc3fe0172ede91e9a39452e5",
".git/objects/44/dcb2a37831f43ec00b259909a2ebfdcbab60f2": "839996cc62ac8532c0b220c38c022ddb",
".git/objects/43/d366c6e519a5ce0f8d6781eadcc20c590e6349": "7cd79cd34cf449b898368a4ce7ee33d8",
".git/objects/88/cfd48dff1169879ba46840804b412fe02fefd6": "e42aaae6a4cbfbc9f6326f1fa9e3380c",
".git/objects/6e/f033de6965b2ade054aa99c2dd5d427dea7bd3": "849fae30aea94f1033aa3ab14aa36a30",
".git/objects/54/f70cbef387838d185f25d2c6d07bbb9d9e4b5d": "03a8f7f63158cccac216fdf8da635a5b",
".git/objects/5b/21d9e6aad0bc9259a6306be2188aa334187fcc": "fc0fd1ce71fa9406a3c808eba4681fed",
".git/objects/08/747567cb361629fc8c1d9f42e8d4e67ebb6a1d": "3da6868f6d71f42f4c80adac4bf57523",
".git/objects/6d/ca25025e4bd8b5c6ccde583520e7a284ff7f30": "d916e2e4b6c769d91c0f69200ae280f7",
".git/objects/06/c9c503ea06cf2e74febaa09575d10ee2a99f16": "98a60843a7e95982e63ef248cd401a9e",
".git/objects/06/f3932ee8f884b96e5065f8f9627eaa4bfa7174": "6402d7392900ac6055b9e8a51c6dc6f7",
".git/objects/0f/1d609c44c8fdfc801387f498723fd90db0c1b1": "67c30f2c410b8ae9349578a7f82c21b5",
".git/objects/0a/649ebf0b4667ef41ee152d79ae3a5ed1c629b6": "5c7baf9fb130459a37b39f873b0a1d2c",
".git/objects/d3/55a77e8973f3e5cf9180bf2c32e9faa1115104": "fa19d808dfc72c241c62c40c5db439f6",
".git/objects/d4/3ca0983f45d5e885b5533f9a33a6b5a849461c": "74ccaacfd973a9b1f9064fbd8c1bb46e",
".git/objects/ba/0ce0c2eed524e337f72a2fb2afb1e73322f906": "db138f7b551ecf5c46fa67c244b73b24",
".git/objects/b7/49bfef07473333cf1dd31e9eed89862a5d52aa": "36b4020dca303986cad10924774fb5dc",
".git/objects/de/28db843d7df6ed23b8a7526f6b6b4a83425fe7": "797e4f7b3d8dced098c51679ff33e848",
".git/objects/b9/2a0d854da9a8f73216c4a0ef07a0f0a44e4373": "f62d1eb7f51165e2a6d2ef1921f976f3",
".git/objects/a1/3837a12450aceaa5c8e807c32e781831d67a8f": "bfe4910ea01eb3d69e9520c3b42a0adf",
".git/objects/c4/fbc2dc341d089ec3634e0d2ed58e4f1cefa0b9": "52b2833dd7da15678371e26199dafd27",
".git/objects/c4/fde4cc4d196fc48d3417e5093dc555277a8028": "062f8802277890422ef68a33820ade85",
".git/objects/ea/db0a7fbbe2cf4124a2124ce288f04f52820976": "954a89a00475e90a919227e1d978f251",
".git/objects/cd/22076013ce8b84475eae9bb4cd6c60b5460fbe": "81c620e2d6cbe5638d6c90ee25886389",
".git/objects/e6/d96954407a91413874b45497461c2b56de5ee2": "785b1c91895c6b912a37dfc5ac68d57d",
".git/objects/f7/13666629fd358154116c3955eeca5c2d86956b": "899442abbd38fba65baa38d1a00fb475",
".git/objects/c5/7c9adcda06630414a9593dfe675166323cbe8e": "316e68fab37d848d89150a19a034ef35",
".git/objects/c5/57439106b1b166fc5ae37dc44fedd78d3ce167": "30cae78e7e67fc432902713e3e7a9a01",
".git/objects/e9/e575d0b36ebd696294496017834c26b62e1505": "8eca52e53d59927cc7c00a13888ea67b",
".git/objects/f1/4bcdc4516762aba858debd947c4209b00d9cee": "45839dc534b22a4f3954897f0e6cf33a",
".git/objects/f1/02bcf507ba66a315cbf31c4d2c210727170342": "16711a99ade1a72d1ff3609b97cfe010",
".git/objects/e7/e202c6efd6e5f82b8fe64dce432412512425c4": "cccf2423cd4ddcbd4591c6601c2e2e83",
".git/objects/46/4ab5882a2234c39b1a4dbad5feba0954478155": "2e52a767dc04391de7b4d0beb32e7fc4",
".git/objects/79/ba7ea0836b93b3f178067bcd0a0945dbc26b3f": "f3e31aec622d6cf63f619aa3a6023103",
".git/objects/2d/cf3542c874e33cd8ab86ceb6f0ec444228aa78": "66baad0ae5d874f09b6eee790095bc65",
".git/objects/70/019b05c80834cdf874be0a9d94df8e070365c7": "d37613c29d8d739d93ad4eba596dd248",
".git/objects/4a/2c949a1d8873afc9a7d44c7e5e28be61165acb": "477aea15f483abfebc6d879ce72b544a",
".git/objects/24/b1f14dd348b07c9b8373758bde9ac14d16fd92": "dbf45d6c044044561758a334420e9569",
".git/objects/23/cc255742a434e7e3a2d9ffee82d73c8b80a0f5": "b3919a4918f12fdf12d83c3a25a9e1c7",
".git/objects/15/5e3ea0453f0fae167ce37336e1643f054cc0dc": "9b97ea5e81bd25b35ada13dd5b22eac2",
".git/objects/8c/cb1af8beabd73aeead02225d7a9af454d289b6": "653d2463f6692486f74474a8f8f8b47c",
".git/objects/76/8651b2e249c2517c7b37bdbeea0a5d8bfbb707": "495b1c4fefa633f6afe4dc5840ebe18f",
".git/objects/8b/c2d53ce28288d1004a2ea9670fa4571b0343dc": "96cc8c1bdfea4a759dffd59bfb526f8b",
".git/objects/13/c693b5110f5ce779b85edc149af93f7a8eb1f3": "83e73268e305bc52c5ff2300fa173d67",
".git/objects/14/412db434b95a4214f45edc72b495b88eb1b77a": "f385d2ee39b11f28c7bdcd9d12c70ea9",
".git/objects/8e/f9ab905837addfb4d6c5276328af701f9fe99c": "ba671d11e4711251423ef90db5877a1e",
".git/objects/22/e45fb5d524a9628d282ca77ef80a2607f05447": "cffa829eea102834aef42e09d4adefc0",
".git/HEAD": "4cf2d64e44205fe628ddd534e1151b58",
".git/info/exclude": "036208b4a1ab4a235d75c181e685e5a3",
".git/logs/HEAD": "7cf80f061953c0f89350eb012095c3e1",
".git/logs/refs/heads/master": "7cf80f061953c0f89350eb012095c3e1",
".git/logs/refs/remotes/origin/master": "6c305a4c6e80c1635415321ef03d9ec1",
".git/description": "a0a7c3fff21f2aea3cfa1d0316dd816c",
".git/hooks/commit-msg.sample": "579a3c1e12a1e74a98169175fb913012",
".git/hooks/pre-rebase.sample": "56e45f2bcbc8226d2b4200f7c46371bf",
".git/hooks/pre-commit.sample": "305eadbbcd6f6d2567e033ad12aabbc4",
".git/hooks/applypatch-msg.sample": "ce562e08d8098926a3862fc6e7905199",
".git/hooks/fsmonitor-watchman.sample": "ea587b0fae70333bce92257152996e70",
".git/hooks/pre-receive.sample": "2ad18ec82c20af7b5926ed9cea6aeedd",
".git/hooks/prepare-commit-msg.sample": "2b5c047bdb474555e1787db32b2d2fc5",
".git/hooks/post-update.sample": "2b7ea5cee3c49ff53d41e00785eb974c",
".git/hooks/pre-merge-commit.sample": "39cb268e2a85d436b9eb6f47614c3cbc",
".git/hooks/pre-applypatch.sample": "054f9ffb8bfe04a599751cc757226dda",
".git/hooks/pre-push.sample": "2c642152299a94e05ea26eae11993b13",
".git/hooks/update.sample": "647ae13c682f7827c22f5fc08a03674e",
".git/hooks/push-to-checkout.sample": "c7ab00c7784efeadad3ae9b228d4b4db",
".git/refs/heads/master": "230be3af442449f8c90cce5d152b878b",
".git/refs/remotes/origin/master": "230be3af442449f8c90cce5d152b878b",
".git/index": "8a6c08f1244cc7a786c3357e36333431",
".git/COMMIT_EDITMSG": "40993b812ce063e76fb0c35d4ad53e1d",
"assets/AssetManifest.json": "1baffbd5864ad248b350dfcaf1a5973a",
"assets/NOTICES": "cde5ccbee0793c8ff0cbbd385b9efe8e",
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
"assets/assets/images/android.png": "4d0751ca410345fdb49ee12ce41741ce",
"assets/assets/images/gmail.png": "eabc1a70245f1384e30960f25f9b2784",
"assets/assets/images/todoImage8.png": "58b3a40704f175e25fea0f72fb2460d2",
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
