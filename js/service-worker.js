// Define el nombre del caché
const CACHE_NAME = 'web-radio-v2'; // Incrementa la versión del caché

// Lista de archivos a almacenar en caché
const urlsToCache = [
    '/RadioPlayer-ZenoRadio-main/', // Almacena en caché el directorio base del reproductor
    '/RadioPlayer-ZenoRadio-main/index.html',
    '/RadioPlayer-ZenoRadio-main/css/style.css',
    '/RadioPlayer-ZenoRadio-main/js/script.js',
    '/RadioPlayer-ZenoRadio-main/imagesg/Nuevo Logo.png',
    // Agrega otros recursos específicos del reproductor aquí
];

// Instala el Service Worker y agrega los archivos al caché
self.addEventListener('install', function(event) {
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then(function(cache) {
                console.log('Caché abierto para web-radio');
                return cache.addAll(urlsToCache);
            })
    );
});

// Intercepta las solicitudes y sirve los archivos en caché si están disponibles
self.addEventListener('fetch', function(event) {
    // Verifica si la solicitud es para recursos del reproductor
    if (event.request.url.includes('/RadioPlayer-ZenoRadio-main/')) {
        event.respondWith(
            caches.match(event.request)
                .then(function(response) {
                    // Cache hit - devuelve la respuesta del caché
                    if (response) {
                        return response;
                    }
                    // No encontrado en caché - busca en la red
                    return fetch(event.request);
                })
        );
    } else {
        // Para otras solicitudes, deja que el navegador se encargue
        event.respondWith(fetch(event.request));
    }
});

// Limpia el caché antiguo cuando se instala una nueva versión
self.addEventListener('activate', function(event) {
    const cacheWhitelist = [CACHE_NAME];
    event.waitUntil(
        caches.keys().then(function(cacheNames) {
            return Promise.all(
                cacheNames.map(function(cacheName) {
                    if (cacheWhitelist.indexOf(cacheName) === -1) {
                        return caches.delete(cacheName);
                    }
                })
            );
        })
    );
});