/**
 * Sella 23 Birthday PWA Database System
 * Handles local storage with auto-backup to YAML files
 */

class BirthdayPwaDB {
    constructor() {
        this.dbName = 'SellaBirthdayDB';
        this.dbVersion = 1;
        this.db = null;
        this.autoBackupEnabled = true;
        this.backupInterval = 30000; // 30 seconds
        this.fileSystemHandle = null;
        this.isServiceWorkerReady = false;
        
        this.init();
    }

    async init() {
        try {
            await this.openDB();
            await this.registerServiceWorker();
            await this.setupFileSystem();
            this.loadPrePopulatedData();
            this.startAutoBackup();
            this.setupEventListeners();
            
            console.log('PWA Database initialized successfully');
        } catch (error) {
            console.error('Failed to initialize PWA Database:', error);
            this.fallbackToLocalStorage();
        }
    }

    // IndexedDB Operations
    async openDB() {
        return new Promise((resolve, reject) => {
            const request = indexedDB.open(this.dbName, this.dbVersion);
            
            request.onerror = () => reject(request.error);
            request.onsuccess = () => {
                this.db = request.result;
                resolve(this.db);
            };
            
            request.onupgradeneeded = (event) => {
                const db = event.target.result;
                
                // Create object stores
                if (!db.objectStoreNames.contains('messages')) {
                    const messageStore = db.createObjectStore('messages', { keyPath: 'id', autoIncrement: true });
                    messageStore.createIndex('timestamp', 'timestamp', { unique: false });
                }
                
                if (!db.objectStoreNames.contains('posts')) {
                    db.createObjectStore('posts', { keyPath: 'id' });
                }
                
                if (!db.objectStoreNames.contains('gallery')) {
                    const galleryStore = db.createObjectStore('gallery', { keyPath: 'id', autoIncrement: true });
                    galleryStore.createIndex('timestamp', 'timestamp', { unique: false });
                }
                
                if (!db.objectStoreNames.contains('settings')) {
                    db.createObjectStore('settings', { keyPath: 'key' });
                }
            };
        });
    }

    // Service Worker Registration
    async registerServiceWorker() {
        if ('serviceWorker' in navigator) {
            try {
                const registration = await navigator.serviceWorker.register('/sw.js');
                console.log('Service Worker registered:', registration);
                
                // Wait for service worker to be ready
                await navigator.serviceWorker.ready;
                this.isServiceWorkerReady = true;
                
                // Send initial backup request
                if (registration.active) {
                    registration.active.postMessage({ type: 'BACKUP_DATABASE' });
                }
                
            } catch (error) {
                console.warn('Service Worker registration failed:', error);
            }
        }
    }

    // File System Access API
    async setupFileSystem() {
        if ('showDirectoryPicker' in window) {
            try {
                // Request directory access
                this.fileSystemHandle = await window.showDirectoryPicker({
                    mode: 'readwrite',
                    startIn: 'documents'
                });
                console.log('File system access granted');
            } catch (error) {
                if (error.name !== 'AbortError') {
                    console.warn('File system access denied:', error);
                }
            }
        }
    }

    // Auto-backup functionality
    startAutoBackup() {
        if (this.autoBackupEnabled) {
            setInterval(async () => {
                try {
                    await this.backupToFile();
                } catch (error) {
                    console.log('Auto backup failed:', error);
                }
            }, this.backupInterval);
        }
    }

    // Setup event listeners for auto-backup triggers
    setupEventListeners() {
        // Listen for beforeunload to backup
        window.addEventListener('beforeunload', () => {
            this.backupToFile();
        });
        
        // Listen for visibility changes
        document.addEventListener('visibilitychange', () => {
            if (document.visibilityState === 'hidden') {
                this.backupToFile();
            }
        });
    }

    // Pre-populated data
    loadPrePopulatedData() {
        const PRE_POPULATED_MESSAGES = [
            {
                name: "Sara Pratistha",
                text: "Cellaku yang ndak pernh tua nan ceria selalu, sehat terus dan panjang umur ya non. Terima kasih udah selalu hadir di hidupku dalam moment apapun, semoga Tuhan selalu mempermudah & lancarkan usaha serta citamu. Semoga senantiasa bahagia, penuh kekayaan dan ketenangan, Tuhan selalu lindungi langkahmu dimanapun berada. Semangat terus Cella and happy birthday🤍"
            },
            {
                name: "Syahrena",
                text: "Happy level up cella!  sehat dan sukses selalu , bersinar di wajah dan karir nya semoga centil nya bertambah tapi lola nya berkurang yaaaa"
            },
            {
                name: "Fatimah",
                text: "happy birthday depoyyy.... selalu dilancarkan dalam hal apapun, sehat selalu dan apapun yang kamu panjatkan segera dikabulkan.Aamiin"
            },
            {
                name: "Muktiah (Imoy)",
                text: "Barakallahu fii umyrik wa hayati fi rezeki devitulllllllll yang cantilitull🌹🌹🫶🏻🫶🏻🫶🏻Berkah dunia wa akhirat .  Qobul segala hajat dunia wa akhirat .. Lancar segala urusan dunia dan akhirat kamu.. banyak² mendapatkan kasih sayang yg tulus dr org² sekitar kamu, dijauhkan dari hal² yg gabaik buat kmu serta dijauhin dr org² yg sirik&jahat sm kamu.. Panjng umur kamu, sehat badan kamu, makin disayang dan dicintai sama ayang kamu ya depooyyy🤍🤍🤍🤍🤍🤍 Emm apalagi ya depooyy,  Intinyaa SELALU BAHAGIA YA DEPOYYY .. 🌹🌹🌹🫶🏻🫶🏻🫶🏻🫶🏻💐💐💐🤍🤍🤍🤍🤍🤍🤍🤍🤍  생일 축하해 데비타 🎂🥳🥳🥳🥳🥳 ILYDEPOYY😽"
            },
            {
                name: "Bunga Revalina",
                text: "haii mba devita, ucapan dari aku Semoga kisah hidupmu terus ditulis dengan indah. Selamat ulang tahun, teruslah bersinar! Terimakasih sudah mau menjadi bagian teman keluh kesa aku loveyou so much 🥹🫶🏻🥰"
            },
            {
                name: "Adi Imeng",
                text: "Hallllllllo mba, udah tua aja nihh yee, happy birthday, sililimit iling tihinnnnn yak, Do'anya semoga sehat selalu dan desertai keberkahan, dilancarkan rezekinya dan karir nyaa makin merowkettt yak, gitu ajaaa deh ya mba, satu lagiii deh mba, cepet² merid deh yaa sama massehhhh 🤟🎉🥳🎂"
            },
            {
                name: "Dewi Shinelife",
                text: "Happy Birthday Cantikk, Sehatt selaluu yaa🤗 Karir makin bersinarr 🌈. langgeng terus sama Gilang miss you"
            },
            {
                name: "Andika Chris",
                text: "Haloo Devita, selamat ulang tahun! Semoga di umur ke-23 tahun ini selalu diberikan kesehatann, mental yang kuat dan rezekii sebanyak-banyaknya dan semoga hal-hal baik selalu menyertai!"
            },
            {
                name: "Iben Alxaitham",
                text: "Halo ka devita, selamat ulang tahun untuk umur ke 23 tahun ka, semoga terus di beri kesehatan, makin cantik, sukses terus🤩🥳🥳🎈🎆"
            },

            {
                name: "Yasmin Nafisah",
                text: "HAPPY BIRTHDAY, DEVITA! May your day be filled with endless love, laughter, and blessing. You deserve all the happiness in the world, and i hope this year brings you closer to your dreams, filled with beautiful moments, good health, and endless happiness. Keep going and growing, wherever you are. Happy birthday one again!"
            },
            {
                name: "Dewi Sukmawati",
                text: "Happy birthday, Dev 🎉🤍, ga kerasa kita udah 7 years of friendship dari ketawa random sampai phase hidup yang chaotic tapi we survived it together. thank you for always being there for me, for listening to all my nonsense, and for never leaving no matter how messy things get. inget ga pas jaman gw masih di bekasi wkwkwk, lu bantu gw banget sampe bisa kayak skrg🥹. i hope this new chapter brings you more happiness, peace of mind, and everything good you truly deserve. Please stay being you kind, strong, and genuine, grateful to have you in my life, and hopefully kita masih bareng terus for many more years to come 🫶✨"
            }
        ];

        // Check if data already exists
        this.getAllMessages().then(existingMessages => {
            if (existingMessages.length === 0) {
                // Add pre-populated messages
                PRE_POPULATED_MESSAGES.forEach(msg => {
                    this.addMessage(msg.name, msg.text);
                });
                console.log('Pre-populated messages added');
            }
        });
    }

    // Message operations
    async addMessage(name, text) {
        const message = {
            name: name.trim(),
            text: text.trim(),
            timestamp: new Date().toISOString()
        };

        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction(['messages'], 'readwrite');
            const store = transaction.objectStore('messages');
            const request = store.add(message);

            request.onsuccess = () => {
                this.triggerBackup();
                resolve(request.result);
            };
            request.onerror = () => reject(request.error);
        });
    }

    async getAllMessages() {
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction(['messages'], 'readonly');
            const store = transaction.objectStore('messages');
            const request = store.getAll();

            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject(request.error);
        });
    }

    // Post operations
    async savePost(postData) {
        const post = {
            id: 'main',
            caption: postData.caption || '',
            image: postData.image || null,
            likes: postData.likes || 0,
            timestamp: new Date().toISOString()
        };

        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction(['posts'], 'readwrite');
            const store = transaction.objectStore('posts');
            const request = store.put(post);

            request.onsuccess = () => {
                this.triggerBackup();
                resolve(request.result);
            };
            request.onerror = () => reject(request.error);
        });
    }

    async getPost() {
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction(['posts'], 'readonly');
            const store = transaction.objectStore('posts');
            const request = store.get('main');

            request.onsuccess = () => resolve(request.result || {
                id: 'main',
                caption: "Happy 23rd Birthday to me! 🎉✨ Thank you to everyone who made this day special 💕",
                image: null,
                likes: 0,
                timestamp: new Date().toISOString()
            });
            request.onerror = () => reject(request.error);
        });
    }

    // Gallery operations
    async addGalleryItem(itemData) {
        const item = {
            caption: itemData.caption || 'New Photo',
            image: itemData.image || null,
            timestamp: new Date().toISOString()
        };

        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction(['gallery'], 'readwrite');
            const store = transaction.objectStore('gallery');
            const request = store.add(item);

            request.onsuccess = () => {
                this.triggerBackup();
                resolve(request.result);
            };
            request.onerror = () => reject(request.error);
        });
    }

    async getAllGalleryItems() {
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction(['gallery'], 'readonly');
            const store = transaction.objectStore('gallery');
            const request = store.getAll();

            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject(request.error);
        });
    }

    async updateGalleryItem(id, updates) {
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction(['gallery'], 'readwrite');
            const store = transaction.objectStore('gallery');
            const getRequest = store.get(id);

            getRequest.onsuccess = () => {
                const item = getRequest.result;
                if (item) {
                    Object.assign(item, updates);
                    const putRequest = store.put(item);
                    putRequest.onsuccess = () => {
                        this.triggerBackup();
                        resolve(putRequest.result);
                    };
                    putRequest.onerror = () => reject(putRequest.error);
                } else {
                    reject(new Error('Item not found'));
                }
            };
            getRequest.onerror = () => reject(getRequest.error);
        });
    }

    async deleteGalleryItem(id) {
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction(['gallery'], 'readwrite');
            const store = transaction.objectStore('gallery');
            const request = store.delete(id);

            request.onsuccess = () => {
                this.triggerBackup();
                resolve();
            };
            request.onerror = () => reject(request.error);
        });
    }

    // Backup operations
    triggerBackup() {
        // Send message to service worker
        if (this.isServiceWorkerReady && navigator.serviceWorker.controller) {
            navigator.serviceWorker.controller.postMessage({ type: 'BACKUP_DATABASE' });
        }
        
        // Auto backup to file system
        this.backupToFile();
    }

    async backupToFile() {
        try {
            const data = await this.exportAllData();
            
            // Try File System Access API first
            if (this.fileSystemHandle) {
                await this.saveToFileSystem(data);
            }
            
            // Always save to localStorage as fallback
            localStorage.setItem('sella_birthday_backup', JSON.stringify(data));
            localStorage.setItem('sella_birthday_backup_yaml', this.convertToYAML(data));
            
            console.log('Database backed up successfully');
        } catch (error) {
            console.warn('Backup failed:', error);
        }
    }

    async saveToFileSystem(data) {
        try {
            if (this.fileSystemHandle) {
                const fileHandle = await this.fileSystemHandle.getFileHandle('sella-birthday-backup.yml', {
                    create: true
                });
                
                const writable = await fileHandle.createWritable();
                await writable.write(this.convertToYAML(data));
                await writable.close();
                
                console.log('Database saved to file system');
            }
        } catch (error) {
            console.warn('File system save failed:', error);
            throw error;
        }
    }

    // Export operations
    async exportAllData() {
        const [messages, post, gallery] = await Promise.all([
            this.getAllMessages(),
            this.getPost(),
            this.getAllGalleryItems()
        ]);

        return {
            messages,
            post,
            gallery,
            app_info: {
                version: '1.0.0',
                export_date: new Date().toISOString(),
                total_messages: messages.length,
                total_gallery_items: gallery.length
            }
        };
    }


    convertToYAML(data) {
        let yaml = '# Sella 23 Birthday Website Database\n';
        yaml += '# Exported: ' + new Date().toISOString() + '\n';
        yaml += '# PWA Auto-Backup System\n';
        yaml += '# Online Database - Real-time Messages\n\n';
        
        yaml += 'messages:\n';
        data.messages.forEach(msg => {
            yaml += `  - name: "${this.escapeYaml(msg.name)}"\n`;
            yaml += `    text: |\n`;
            yaml += `      ${msg.text.replace(/\n/g, '\n      ')}\n`;
            yaml += `    timestamp: "${msg.timestamp}"\n\n`;
        });

        yaml += 'post:\n';
        yaml += `  caption: |\n`;
        yaml += `    ${data.post.caption.replace(/\n/g, '\n    ')}\n`;
        yaml += `  likes: ${data.post.likes}\n`;
        yaml += `  timestamp: "${data.post.timestamp}"\n`;
        yaml += `  has_image: ${data.post.image ? 'true' : 'false'}\n\n`;

        yaml += 'gallery:\n';
        data.gallery.forEach((item, idx) => {
            yaml += `  - id: ${idx}\n`;
            yaml += `    caption: "${this.escapeYaml(item.caption)}"\n`;
            yaml += `    timestamp: "${item.timestamp}"\n`;
            yaml += `    has_image: ${item.image ? 'true' : 'false'}\n\n`;
        });

        yaml += 'app_info:\n';
        yaml += `  version: "${data.app_info.version}"\n`;
        yaml += `  export_date: "${data.app_info.export_date}"\n`;
        yaml += `  total_messages: ${data.app_info.total_messages}\n`;
        yaml += `  total_gallery_items: ${data.app_info.total_gallery_items}\n`;
        yaml += `  system: "PWA with IndexedDB + File System Access"\n`;

        return yaml;
    }

    escapeYaml(text) {
        if (!text) return '';
        return text
            .replace(/"/g, '\\"')
            .replace(/\n/g, '\\n')
            .replace(/\r/g, '\\r')
            .replace(/\t/g, '\\t');
    }

    // Import operations
    async importFromYAML(yamlContent) {
        try {
            // Simple YAML parser for our specific format
            const data = this.parseYAML(yamlContent);
            
            // Clear existing data
            await this.clearAllData();
            
            // Import messages
            if (data.messages) {
                for (const msg of data.messages) {
                    await this.addMessage(msg.name, msg.text);
                }
            }
            
            // Import post
            if (data.post) {
                await this.savePost(data.post);
            }
            
            // Import gallery
            if (data.gallery) {
                for (const item of data.gallery) {
                    await this.addGalleryItem(item);
                }
            }
            
            console.log('Data imported successfully');
            this.triggerBackup();
            
        } catch (error) {
            console.error('Import failed:', error);
            throw error;
        }
    }

    parseYAML(yamlContent) {
        // Simple YAML parser for our specific format
        const lines = yamlContent.split('\n');
        const data = { messages: [], post: {}, gallery: [] };
        let currentSection = null;
        let currentItem = null;

        for (const line of lines) {
            const trimmed = line.trim();
            
            if (trimmed.startsWith('messages:')) {
                currentSection = 'messages';
                continue;
            } else if (trimmed.startsWith('post:')) {
                currentSection = 'post';
                continue;
            } else if (trimmed.startsWith('gallery:')) {
                currentSection = 'gallery';
                continue;
            }
            
            if (trimmed.startsWith('- name:')) {
                if (currentSection === 'messages') {
                    currentItem = {};
                    currentItem.name = trimmed.substring(8).replace(/"/g, '').trim();
                } else if (currentSection === 'gallery') {
                    currentItem = {};
                }
            } else if (trimmed.startsWith('text:')) {
                if (currentSection === 'messages' && currentItem) {
                    const textMatch = trimmed.match(/text:\s*\|\s*\n((?:\s+.*\n?)*)/);
                    if (textMatch) {
                        currentItem.text = textMatch[1].replace(/^\s+/gm, '').trim();
                    }
                }
            } else if (trimmed.startsWith('caption:')) {
                if (currentSection === 'post') {
                    const captionMatch = trimmed.match(/caption:\s*\|\s*\n((?:\s+.*\n?)*)/);
                    if (captionMatch) {
                        data.post.caption = captionMatch[1].replace(/^\s+/gm, '').trim();
                    }
                } else if (currentSection === 'gallery' && currentItem) {
                    currentItem.caption = trimmed.substring(10).replace(/"/g, '').trim();
                }
            } else if (trimmed.startsWith('likes:')) {
                if (currentSection === 'post') {
                    data.post.likes = parseInt(trimmed.split(':')[1].trim()) || 0;
                }
            } else if (trimmed === '' && currentItem) {
                if (currentSection === 'messages') {
                    data.messages.push(currentItem);
                } else if (currentSection === 'gallery') {
                    data.gallery.push(currentItem);
                }
                currentItem = null;
            }
        }

        // Add last item if exists
        if (currentItem) {
            if (currentSection === 'messages') {
                data.messages.push(currentItem);
            } else if (currentSection === 'gallery') {
                data.gallery.push(currentItem);
            }
        }

        return data;
    }

    async clearAllData() {
        const stores = ['messages', 'posts', 'gallery'];
        
        for (const storeName of stores) {
            await new Promise((resolve, reject) => {
                const transaction = this.db.transaction([storeName], 'readwrite');
                const store = transaction.objectStore(storeName);
                const request = store.clear();

                request.onsuccess = () => resolve();
                request.onerror = () => reject(request.error);
            });
        }
    }

    // Fallback to localStorage
    fallbackToLocalStorage() {
        console.log('Falling back to localStorage');
        this.useLocalStorage = true;
    }

    // Utility methods
    async getStorageInfo() {
        if (this.useLocalStorage) {
            return {
                type: 'localStorage',
                used: new Blob(Object.values(localStorage)).size,
                available: 'unknown'
            };
        } else {
            try {
                const usage = await navigator.storage.estimate();
                return {
                    type: 'IndexedDB',
                    used: usage.usage || 0,
                    available: usage.quota || 0,
                    percentage: ((usage.usage / usage.quota) * 100).toFixed(2) + '%'
                };
            } catch (error) {
                return { type: 'unknown', error: error.message };
            }
        }
    }

    // PWA Install prompt
    async showInstallPrompt() {
        if ('beforeinstallprompt' in window) {
            return new Promise((resolve) => {
                const handler = (e) => {
                    e.preventDefault();
                    window.deferredPrompt = e;
                    resolve(e);
                };
                
                window.addEventListener('beforeinstallprompt', handler, { once: true });
                
                // Auto-show after 10 seconds if not shown
                setTimeout(() => {
                    window.removeEventListener('beforeinstallprompt', handler);
                    resolve(null);
                }, 10000);
            });
        }
        return null;
    }
}

// Export for use in main script
window.BirthdayPwaDB = BirthdayPwaDB;
