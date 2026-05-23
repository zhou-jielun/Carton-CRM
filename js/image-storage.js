// ================================================================
//  Carton Wiki — 图片存储模块（IndexedDB）
//  使用 IndexedDB 存储纸箱图片，避免卡顿
//  用法：ImageStorage.init() -> saveImage() -> getImage()
// ================================================================

var ImageStorage = {
  dbName: 'cartonWikiDB',
  storeName: 'cartonImages',
  db: null,

  // 初始化数据库
  init: function() {
    var self = this;
    return new Promise(function(resolve, reject) {
      if (self.db) {
        resolve();
        return;
      }

      var request = indexedDB.open(self.dbName, 1);

      request.onupgradeneeded = function(e) {
        var db = e.target.result;
        if (!db.objectStoreNames.contains(self.storeName)) {
          db.createObjectStore(self.storeName, { keyPath: 'id' });
        }
      };

      request.onsuccess = function(e) {
        self.db = e.target.result;
        resolve();
      };

      request.onerror = function() {
        reject(request.error);
      };
    });
  },

  // 保存图片（含压缩）
  saveImage: function(id, file) {
    var self = this;
    return new Promise(function(resolve, reject) {
      self.compressImage(file, 800, 800, 0.8).then(function(blob) {
        var reader = new FileReader();
        reader.onload = function(e) {
          var data = {
            id: id,
            data: e.target.result,
            timestamp: Date.now()
          };

          var transaction = self.db.transaction([self.storeName], 'readwrite');
          var store = transaction.objectStore(self.storeName);
          var request = store.put(data);

          request.onsuccess = function() {
            resolve();
          };

          request.onerror = function() {
            reject(request.error);
          };
        };
        reader.readAsDataURL(blob);
      }).catch(function(err) {
        reject(err);
      });
    });
  },

  // 获取图片（返回 Data URL）
  getImage: function(id) {
    var self = this;
    return new Promise(function(resolve, reject) {
      var transaction = self.db.transaction([self.storeName], 'readonly');
      var store = transaction.objectStore(self.storeName);
      var request = store.get(id);

      request.onsuccess = function(e) {
        var result = e.target.result;
        if (result) {
          resolve(result.data);
        } else {
          resolve(null);
        }
      };

      request.onerror = function() {
        reject(request.error);
      };
    });
  },

  // 删除图片
  deleteImage: function(id) {
    var self = this;
    return new Promise(function(resolve, reject) {
      var transaction = self.db.transaction([self.storeName], 'readwrite');
      var store = transaction.objectStore(self.storeName);
      var request = store.delete(id);

      request.onsuccess = function() {
        resolve();
      };

      request.onerror = function() {
        reject(request.error);
      };
    });
  },

  // 检查是否有图片
  hasImage: function(id) {
    var self = this;
    return new Promise(function(resolve, reject) {
      var transaction = self.db.transaction([self.storeName], 'readonly');
      var store = transaction.objectStore(self.storeName);
      var request = store.get(id);

      request.onsuccess = function(e) {
        var result = e.target.result;
        resolve(result !== undefined && result !== null);
      };

      request.onerror = function() {
        reject(request.error);
      };
    });
  },

  // 压缩图片
  compressImage: function(file, maxWidth, maxHeight, quality) {
    return new Promise(function(resolve, reject) {
      var reader = new FileReader();
      reader.onload = function(e) {
        var img = new Image();
        img.onload = function() {
          var canvas = document.createElement('canvas');
          var ctx = canvas.getContext('2d');
          
          // 计算新尺寸
          var ratio = Math.min(maxWidth / img.width, maxHeight / img.height);
          canvas.width = img.width * ratio;
          canvas.height = img.height * ratio;
          
          // 绘制压缩后的图片
          ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
          
          // 转换为 Blob
          canvas.toBlob(function(blob) {
            resolve(blob);
          }, 'image/jpeg', quality);
        };
        img.onerror = function() {
          reject(new Error('Failed to load image'));
        };
        img.src = e.target.result;
      };
      reader.onerror = function() {
        reject(new Error('Failed to read file'));
      };
      reader.readAsDataURL(file);
    });
  }
};;
