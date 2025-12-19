const CACHE_NAME = 'sella-birthday-v1.0.0';
const urlsToCache = [
    '/',
    '/index.html',
    '/manifest.json',
    'https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;700&family=DM+Serif+Display:ital@0;1&display=swap'
];

// Install Service Worker
self.addEventListener('install', (event) => {
    console.log('Service Worker installing...');
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then((cache) => {
                console.log('Opened cache');
                return cache.addAll(urlsToCache);
            })
    );
    self.skipWaiting();
});

// Activate Service Worker
self.addEventListener('activate', (event) => {
    console.log('Service Worker activating...');
    event.waitUntil(
        caches.keys().then((cacheNames) => {
            return Promise.all(
                cacheNames.map((cacheName) => {
                    if (cacheName !== CACHE_NAME) {
                        console.log('Deleting old cache:', cacheName);
                        return caches.delete(cacheName);
                    }
                })
            );
        })
    );
    self.clients.claim();
});

// Fetch event
self.addEventListener('fetch', (event) => {
    event.respondWith(
        caches.match(event.request)
            .then((response) => {
                // Return cached version or fetch from network
                if (response) {
                    return response;
                }
                return fetch(event.request);
            }
        )
    );
});

// Background Sync for database backup
self.addEventListener('sync', (event) => {
    console.log('Background sync triggered:', event.tag);
    if (event.tag === 'backup-database') {
        event.waitUntil(backupDatabase());
    }
});

// Background Sync function
async function backupDatabase() {
    try {
        // Request database from main thread
        const response = await fetch('/api/get-database');
        if (response.ok) {
            const dbData = await response.json();
            console.log('Database backed up in background');
            
            // Try to save to File System API if available
            if ('showDirectoryPicker' in window) {
                await saveToFileSystem(dbData);
            }
        }
    } catch (error) {
        console.log('Background backup failed:', error);
    }
}

// Save to File System API
async function saveToFileSystem(data) {
    try {
        if ('showDirectoryPicker' in window) {
            const dirHandle = await window.showDirectoryPicker({
                mode: 'readwrite'
            });
            
            const fileHandle = await dirHandle.getFileHandle('sella-birthday-backup.yml', {
                create: true
            });
            
            const writable = await fileHandle.createWritable();
            await writable.write(convertToYAML(data));
            await writable.close();
            
            console.log('Database saved to file system');
        }
    } catch (error) {
        console.log('File system save failed:', error);
    }
}

// Convert data to YAML format
function convertToYAML(data) {
    let yaml = '# Sella 23 Birthday Website Database\n';
    yaml += '# Auto-backup: ' + new Date().toISOString() + '\n\n';
    
    yaml += 'messages:\n';
    data.messages.forEach(msg => {
        yaml += `  - name: "${escapeYaml(msg.name)}"\n`;
        yaml += `    text: "${escapeYaml(msg.text)}"\n`;
        yaml += `    timestamp: "${msg.timestamp || new Date().toISOString()}"\n`;
    });

    yaml += '\npost:\n';
    yaml += `  caption: "${escapeYaml(data.post.caption)}"\n`;
    yaml += `  likes: ${data.post.likes}\n`;
    yaml += `  timestamp: "${data.post.timestamp || new Date().toISOString()}"\n`;

    yaml += '\ngallery:\n';
    data.gallery.forEach((item, idx) => {
        yaml += `  - id: ${idx}\n`;
        yaml += `    caption: "${escapeYaml(item.caption)}"\n`;
        yaml += `    timestamp: "${item.timestamp || new Date().toISOString()}"\n`;
    });

    yaml += '\napp_info:\n';
    yaml += `  version: "1.0.0"\n`;
    yaml += `  last_backup: "${new Date().toISOString()}"\n`;
    yaml += `  total_messages: ${data.messages.length}\n`;
    yaml += `  total_gallery_items: ${data.gallery.length}\n`;

    return yaml;
}

// Escape YAML strings
function escapeYaml(text) {
    if (!text) return '';
    return text
        .replace(/"/g, '\\"')
        .replace(/\n/g, '\\n')
        .replace(/\r/g, '\\r')
        .replace(/\t/g, '\\t');
}

// Handle messages from main thread
self.addEventListener('message', (event) => {
    console.log('Service Worker received message:', event.data);
    
    if (event.data && event.data.type === 'SKIP_WAITING') {
        self.skipWaiting();
    }
    
    if (event.data && event.data.type === 'BACKUP_DATABASE') {
        // Trigger background sync
        if ('sync' in self.registration) {
            self.registration.sync.register('backup-database');
        }
    }
    
    if (event.data && event.data.type === 'SAVE_TO_FILE') {
        saveToFileSystem(event.data.data);
    }
});

// Push notifications (for future use)
self.addEventListener('push', (event) => {
    console.log('Push message received:', event);
    
    const options = {
        body: event.data ? event.data.text() : 'New notification from Sella Birthday',
        icon: '/manifest-icon-192.png',
        badge: '/manifest-icon-96.png',
        tag: 'sella-birthday',
        actions: [
            {
                action: 'open',
                title: 'Open Website'
            },
            {
                action: 'close',
                title: 'Close'
            }
        ]
    };
    
    event.waitUntil(
        self.registration.showNotification('Sella Birthday', options)
    );
});

// Handle notification clicks
self.addEventListener('notificationclick', (event) => {
    console.log('Notification click received:', event);
    
    event.notification.close();
    
    if (event.action === 'open' || !event.action) {
        event.waitUntil(
            clients.openWindow('/')
        );
    }
});

// Periodic background sync (if supported)
self.addEventListener('periodicsync', (event) => {
    if (event.tag === 'periodic-backup') {
        event.waitUntil(backupDatabase());
    }
});

console.log('Service Worker loaded successfully');
