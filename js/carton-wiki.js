// ================================================================
//  Carton Wiki 核心逻辑 — WikiS 对象 + Router.renderWiki
// ================================================================

// ─── WikiS 模块对象 ───────────────────────────────────────────────
var WikiS = {
  data: [],
  compareList: [],
  _searchTimer: null,

  // 糖果色映射（Morandi柔和色系）—— 40种纸箱全覆盖
  cartonColors: {
    'rsc': '#F5E6E8', 'hsc': '#E8F5E9', 'fol': '#E3F2FD', 'tel': '#FFFDE7',
    'foldr': '#FFF3E0', 'dc': '#F3E5F5', 'bls': '#E0F7FA', 'try': '#FCE4EC',
    'retf': '#F1F8E9', 'ctry': '#E8EAF6', 'cssc': '#FFF8E1', 'dcb': '#EDE7F6',
    'fpf': '#E0F2F1', 'pwb': '#FBE9E7', 'slb': '#E8EAF6',
    // 2026-05-22 新增25种
    'osc': '#E8EAF6', 'hsc_hc': '#F1F8E9', 'snap': '#E3F2FD', 'ilb': '#FFF3E0',
    'slbc': '#FCE4EC', 'ftc': '#F5E6E8', 'ftc_f': '#F3E5F5', 'fthsc': '#E0F7FA',
    'ptc': '#FFFDE7', 'dcc': '#EDE7F6', 'ffb': '#E8F5E9', 'ffc': '#FFF3E0',
    'fpf_5p': '#F3E5F5', 'clb': '#E3F2FD', 'snb': '#F5E6E8', 'fct': '#E8F5E9',
    'slt': '#FFFDE7', 'sb': '#FCE4EC', 'sbf': '#F1F8E9', 'sbh': '#FFF3E0',
    'drawer': '#E0F7FA', 'rb': '#EDE7F6', 'rbh': '#F5E6E8', 'part_01': '#E8EAF6',
    'pad': '#FFF8E1'
  },

  // 自动生成颜色的备用函数（自定义纸箱用）
  _fallbackColorIdx: 0,
  getColor: function(id) {
    if (this.cartonColors[id]) return this.cartonColors[id];
    var palette = ['#F5E6E8','#E8F5E9','#E3F2FD','#FFFDE7','#FFF3E0','#F3E5F5','#E0F7FA','#FCE4EC','#F1F8E9','#E8EAF6'];
    var c = palette[this._fallbackColorIdx % palette.length];
    this._fallbackColorIdx++;
    return c;
  },

  // 初始化
  init: function () {
    this.data = (typeof cartonWikiData !== 'undefined') ? cartonWikiData : [];
    // 按 FEFCO 编号排序
    this.data.sort(function(a, b) { return (a.fefcoCode || '9999').localeCompare(b.fefcoCode || '9999'); });
    var stored = sessionStorage.getItem('wiki_compare');
    this.compareList = stored ? JSON.parse(stored) : [];

    // 加载自定义纸箱
    this.loadCustomCartons();

    // 初始化图片上传功能
    if (typeof this.initImageUpload === 'function') {
      this.initImageUpload();
    }
  },

  // 渲染卡片网格
  renderCards: function (filter) {
    var grid = document.getElementById('wiki-grid');
    if (!grid) return;

    var keyword = (filter || '').toLowerCase();
    var filtered = this.data.filter(function (item) {
      if (!keyword) return true;
      // 支持搜索：FEFCO编号、缩写code、中文名、英文名、应用场景
      var fefcoNum = (item.fefcoCode || '').replace(/^0+/, ''); // 支持输入"200"匹配"0200"
      var hay = (fefcoNum + '|' + (item.fefcoCode || '') + '|' + item.code + '|' + item.nameEn + '|' + item.nameCn + '|' + (item.applications || []).join('|')).toLowerCase();
      return hay.indexOf(keyword) !== -1;
    });

    var html = '';
    for (var i = 0; i < filtered.length; i++) {
      var d = filtered[i];
      var checked = this.compareList.indexOf(d.id) !== -1 ? 'checked' : '';
      var disabled = (this.compareList.length >= 4 && !checked) ? 'disabled' : '';

      var bgColor = WikiS.getColor(d.id);
      var deleteBtn = d.isCustom ?
        '<button class="wiki-custom-delete" onclick="event.stopPropagation(); WikiS.deleteCustomCarton(\'' + d.id + '\')">×</button>' : '';
      var fefcoLabel = d.fefcoCode ? ('FEFCO ' + d.fefcoCode) : d.code;
      html += '<div class="wiki-card" onclick="WikiS.openDetail(\'' + d.id + '\')">' +
        deleteBtn +
        '<div class="wiki-card-color-header" style="background:' + bgColor + '">' +
          '<span class="wiki-card-icon">📦</span>' +
          '<span class="wiki-card-code-overlay">' + fefcoLabel + '</span>' +
        '</div>' +
        '<div class="wiki-card-body">' +
          '<div class="wiki-card-name">' + d.nameCn + '</div>' +
          '<div class="wiki-card-name-en">' + d.nameEn + '</div>' +
          '<div class="wiki-card-pop">' +
            '<span class="wiki-pop-label">普及率</span>' +
            '<div class="wiki-pop-bar"><div class="wiki-pop-fill" style="width:' + d.popularity + '%"></div></div>' +
            '<span class="wiki-pop-val">' + d.popularity + '%</span>' +
          '</div>' +
        '</div>' +
        '<label class="wiki-compare-chk" onclick="event.stopPropagation()">' +
          '<input type="checkbox" ' + checked + ' ' + disabled + ' onchange="WikiS.toggleCompare(\'' + d.id + '\')">' +
          '<span>对比</span>' +
        '</label>' +
      '</div>';
    }

    // 添加"新增纸箱"按钮
    html += '<div class="wiki-card wiki-card-add" onclick="WikiS.showAddCartonModal()">' +
      '<div class="wiki-card-add-icon">+</div>' +
      '<div class="wiki-card-add-text">添加自定义纸箱</div>' +
      '<div class="wiki-card-add-hint">导入新的纸箱类型</div>' +
    '</div>';

    if (filtered.length === 0 && !html.includes('wiki-card')) {
      html = '<div class="wiki-empty">🔍 未找到匹配的纸箱类型，请尝试其他关键词</div>';
    }

    grid.innerHTML = html;
  },

  // 搜索（带 300ms 防抖）
  search: function (keyword) {
    var self = this;
    if (this._searchTimer) clearTimeout(this._searchTimer);
    this._searchTimer = setTimeout(function () {
      self.renderCards(keyword);
    }, 300);
  },

  // 清空搜索
  clearSearch: function () {
    var input = document.getElementById('wiki-search-input');
    if (input) input.value = '';
    this.renderCards();
  },

  // 打开详情页
  openDetail: function (id) {
    Router.navigate('/wiki?id=' + id);
  },

  // 渲染详情页
  renderDetail: function (id) {
    var item = null;
    for (var i = 0; i < this.data.length; i++) {
      if (this.data[i].id === id) { item = this.data[i]; break; }
    }
    if (!item) { Utils.toast('未找到该纸箱类型'); Router.navigate('/wiki'); return; }

    var title = document.getElementById('page-title');
    var subtitle = document.getElementById('page-subtitle');
    var actions = document.getElementById('topbar-actions');
    var content = document.getElementById('page-content');

    var customBadge = item.isCustom ? '<span class="badge badge-blue" style="margin-left:8px;font-size:12px;">自定义</span>' : '';
    var fefcoLabel = item.fefcoCode ? ('FEFCO ' + item.fefcoCode) : item.code;
    title.innerHTML = item.nameCn + customBadge;
    subtitle.textContent = fefcoLabel + ' · ' + item.nameEn;
    var deleteBtn = item.isCustom ?
      '<button class="btn btn-danger" style="margin-left:8px;background:#FF3B30;color:white;" onclick="WikiS.deleteCustomCarton(\'' + item.id + '\'); Router.navigate(\'/wiki\');">🗑️ 删除</button>' : '';
    actions.innerHTML = '<button class="btn btn-ghost" onclick="Router.navigate(\'/wiki\')">← 返回列表</button>' + deleteBtn;

    var prosHtml = (item.pros || []).map(function (p) { return '<li>' + p + '</li>'; }).join('');
    var consHtml = (item.cons || []).map(function (c) { return '<li>' + c + '</li>'; }).join('');
    var appsHtml = (item.applications || []).map(function (a) { return '<span class="badge badge-blue">' + a + '</span>'; }).join('');
    var equipHtml = (item.equipment || []).map(function (e) { return '<span class="badge badge-gray">' + e + '</span>'; }).join('');
    var flutesHtml = (item.fluteTypes || []).map(function (f) { return '<span class="badge badge-green">' + f + '</span>'; }).join('');

    var costStars = '';
    for (var c = 0; c < 5; c++) {
      costStars += c < item.costLevel ? '●' : '○';
    }

    // 对比参数雷达图（用横向条形图代替）
    var params = item.comparisonParams || {};
    var paramLabels = {
      protection: '保护性', stackability: '堆码性', printability: '印刷性',
      assemblyEase: '易组装', storageEfficiency: '储运效率', costEfficiency: '成本优势',
      automation: '自动化', sustainability: '可持续性', customization: '可定制'
    };
    var paramsHtml = '';
    for (var key in paramLabels) {
      if (!paramLabels.hasOwnProperty(key)) continue;
      var val = params[key] || 0;
      paramsHtml += '<div class="wiki-param-row">' +
        '<span class="wiki-param-label">' + paramLabels[key] + '</span>' +
        '<div class="wiki-param-bar"><div class="wiki-param-fill" style="width:' + (val * 10) + '%"></div></div>' +
        '<span class="wiki-param-val">' + val + '/5</span>' +
      '</div>';
    }

    content.innerHTML = '<div class="wiki-detail fade-in">' +

      // ── 上半部分：纸箱结构图片 ──
      '<div class="wiki-structure-section">' +
        '<div class="wiki-section-title">📐 纸箱结构</div>' +
        '<div class="wiki-structure-image-wrap">' +
          '<div class="wiki-structure-label">展开/折叠示意图 <span class="wiki-image-count-hint" id="wiki-img-count-' + item.id + '"></span></div>' +
          '<div class="wiki-structure-images" id="wiki-img-grid-' + item.id + '">' +
            '<div class="wiki-structure-image" id="wiki-img-' + item.id + '-0" onclick="WikiS.triggerImageUpload(\'' + item.id + '\', 0)">' +
              '<div class="wiki-image-upload-hint">📷 点击上传<br>或粘贴图片</div>' +
            '</div>' +
            '<div class="wiki-structure-image" id="wiki-img-' + item.id + '-1" onclick="WikiS.triggerImageUpload(\'' + item.id + '\', 1)">' +
              '<div class="wiki-image-upload-hint">📷 点击上传<br>或粘贴图片</div>' +
            '</div>' +
          '</div>' +
        '</div>' +
      '</div>' +

      // ── 下半部分：参数信息 ──
      '<div class="wiki-params-section">' +
        '<div class="wiki-section-title">📊 参数信息</div>' +
        '<div class="wiki-params-grid">' +
          // 左列
          '<div class="wiki-params-col">' +
            '<div class="wiki-detail-section">' +
              '<h4>成本等级</h4>' +
              '<div class="wiki-cost-stars">' + costStars + ' <span class="wiki-cost-label">（1=最低，5=最高）</span></div>' +
            '</div>' +
            '<div class="wiki-detail-section">' +
              '<h4>优缺点</h4>' +
              '<div class="wiki-pros"><ul>' + prosHtml + '</ul></div>' +
              '<div class="wiki-cons"><ul>' + consHtml + '</ul></div>' +
            '</div>' +
            '<div class="wiki-detail-section">' +
              '<h4>结构说明</h4>' +
              '<div class="wiki-detail-structure-text">' + (item.structure || '') + '</div>' +
            '</div>' +
            '<div class="wiki-detail-section">' +
              '<h4>适用场景</h4>' +
              '<div class="wiki-tag-list">' + appsHtml + '</div>' +
            '</div>' +
          '</div>' +
          // 右列
          '<div class="wiki-params-col">' +
            '<div class="wiki-detail-section">' +
              '<h4>对比参数</h4>' +
              '<div class="wiki-params-list">' + paramsHtml + '</div>' +
            '</div>' +
            '<div class="wiki-detail-section">' +
              '<h4>适用设备</h4>' +
              '<div class="wiki-tag-list">' + equipHtml + '</div>' +
            '</div>' +
            '<div class="wiki-detail-section">' +
              '<h4>适用瓦型</h4>' +
              '<div class="wiki-tag-list">' + flutesHtml + '</div>' +
            '</div>' +
          '</div>' +
        '</div>' +
      '</div>' +

    '</div>';

    // 加载已保存的图片
    this.renderDetailImage(id);
  },

  // 切换对比勾选
  toggleCompare: function (id) {
    var idx = this.compareList.indexOf(id);
    if (idx !== -1) {
      this.compareList.splice(idx, 1);
    } else {
      if (this.compareList.length >= 4) {
        Utils.toast('最多同时对比 4 种类型');
        return;
      }
      this.compareList.push(id);
    }
    sessionStorage.setItem('wiki_compare', JSON.stringify(this.compareList));
    this.renderCards(document.getElementById('wiki-search-input') ? document.getElementById('wiki-search-input').value : '');
  },

  // 渲染对比页（T04）
  renderCompare: function () {
    if (this.compareList.length < 2) {
      Utils.toast('请至少选择 2 种类型进行对比');
      return;
    }
    Router.navigate('/wiki/compare');
    // TODO: T04 实现对比表格页面
    Utils.toast('对比功能将在 T04 中完成（当前已选 ' + this.compareList.length + ' 种）');
  },

  // ============================================================
  //  自定义纸箱功能
  // ============================================================

  // 加载自定义纸箱（从 localStorage）
  loadCustomCartons: function() {
    var stored = localStorage.getItem('wiki_custom_cartons');
    if (stored) {
      try {
        var custom = JSON.parse(stored);
        // 合并到数据中（避免重复）
        for (var i = 0; i < custom.length; i++) {
          var exists = false;
          for (var j = 0; j < this.data.length; j++) {
            if (this.data[j].id === custom[i].id) {
              exists = true;
              break;
            }
          }
          if (!exists) {
            this.data.push(custom[i]);
          }
        }
      } catch (e) {
        console.error('加载自定义纸箱失败:', e);
      }
    }
  },

  // 显示添加纸箱模态框
  showAddCartonModal: function() {
    var modal = document.createElement('div');
    modal.className = 'wiki-modal-overlay';
    modal.innerHTML =
      '<div class="wiki-modal">' +
        '<div class="wiki-modal-header">' +
          '<h3>📦 添加自定义纸箱类型</h3>' +
          '<button class="wiki-modal-close" onclick="this.closest(\'.wiki-modal-overlay\').remove()">×</button>' +
        '</div>' +
        '<div class="wiki-modal-body">' +
          '<div class="wiki-form-group">' +
            '<label>纸箱代码（如 ABC）</label>' +
            '<input type="text" id="custom-code" placeholder="输入代码" maxlength="10">' +
          '</div>' +
          '<div class="wiki-form-group">' +
            '<label>中文名称</label>' +
            '<input type="text" id="custom-name-cn" placeholder="如：自定义纸箱">' +
          '</div>' +
          '<div class="wiki-form-group">' +
            '<label>英文名称</label>' +
            '<input type="text" id="custom-name-en" placeholder="如：Custom Carton">' +
          '</div>' +
          '<div class="wiki-form-group">' +
            '<label>结构描述</label>' +
            '<textarea id="custom-structure" rows="3" placeholder="描述纸箱结构特点"></textarea>' +
          '</div>' +
          '<div class="wiki-form-group">' +
            '<label>适用场景（逗号分隔）</label>' +
            '<input type="text" id="custom-apps" placeholder="如：快递包装, 食品包装">' +
          '</div>' +
          '<div class="wiki-form-row">' +
            '<div class="wiki-form-group">' +
              '<label>市场普及率 (%)</label>' +
              '<input type="number" id="custom-popularity" min="0" max="100" value="10">' +
            '</div>' +
            '<div class="wiki-form-group">' +
              '<label>成本等级 (1-5)</label>' +
              '<input type="number" id="custom-cost" min="1" max="5" value="3">' +
            '</div>' +
          '</div>' +
        '</div>' +
        '<div class="wiki-modal-footer">' +
          '<button class="btn btn-ghost" onclick="this.closest(\'.wiki-modal-overlay\').remove()">取消</button>' +
          '<button class="btn btn-primary" onclick="WikiS.addCustomCarton()">添加</button>' +
        '</div>' +
      '</div>';
    document.body.appendChild(modal);
  },

  // 添加自定义纸箱
  addCustomCarton: function() {
    var code = document.getElementById('custom-code').value.trim().toUpperCase();
    var nameCn = document.getElementById('custom-name-cn').value.trim();
    var nameEn = document.getElementById('custom-name-en').value.trim();
    var structure = document.getElementById('custom-structure').value.trim();
    var appsStr = document.getElementById('custom-apps').value.trim();
    var popularity = parseInt(document.getElementById('custom-popularity').value) || 10;
    var costLevel = parseInt(document.getElementById('custom-cost').value) || 3;

    if (!code || !nameCn) {
      Utils.toast('请填写纸箱代码和中文名称');
      return;
    }

    var id = 'custom_' + code.toLowerCase() + '_' + Date.now();
    var apps = appsStr ? appsStr.split(/[,，]/).map(function(s) { return s.trim(); }).filter(function(s) { return s; }) : ['通用包装'];

    var newCarton = {
      id: id,
      code: code,
      nameEn: nameEn || code + ' Carton',
      nameCn: nameCn,
      popularity: popularity,
      structure: structure || '自定义纸箱结构',
      applications: apps,
      pros: ['自定义纸箱，灵活适配需求'],
      cons: ['需根据具体设计评估'],
      costLevel: costLevel,
      equipment: ['瓦楞纸板生产线'],
      fluteTypes: ['A瓦', 'B瓦', 'C瓦'],
      layers: ['单层（3层）', '双层（5层）'],
      comparisonParams: { protection:3, stackability:3, printability:3, assemblyEase:3, storageEfficiency:3, costEfficiency:3, automation:3, sustainability:3, customization:3 },
      isCustom: true
    };

    // 添加到数据
    this.data.push(newCarton);

    // 保存到 localStorage
    var custom = [];
    for (var i = 0; i < this.data.length; i++) {
      if (this.data[i].isCustom) {
        custom.push(this.data[i]);
      }
    }
    localStorage.setItem('wiki_custom_cartons', JSON.stringify(custom));

    // 分配颜色
    var colors = ['#F5E6E8', '#E8F5E9', '#E3F2FD', '#FFFDE7', '#FFF3E0', '#F3E5F5', '#E0F7FA', '#FCE4EC'];
    this.cartonColors[id] = colors[custom.length % colors.length];

    // 关闭模态框并刷新
    var modal = document.querySelector('.wiki-modal-overlay');
    if (modal) modal.remove();

    Utils.toast('✅ 已添加自定义纸箱：' + nameCn);
    this.renderCards();
  },

  // 删除自定义纸箱
  deleteCustomCarton: function(id) {
    if (!confirm('确定要删除这个自定义纸箱吗？')) return;

    // 从数据中移除
    for (var i = 0; i < this.data.length; i++) {
      if (this.data[i].id === id) {
        this.data.splice(i, 1);
        break;
      }
    }

    // 更新 localStorage
    var custom = [];
    for (var i = 0; i < this.data.length; i++) {
      if (this.data[i].isCustom) {
        custom.push(this.data[i]);
      }
    }
    localStorage.setItem('wiki_custom_cartons', JSON.stringify(custom));

    // 从对比列表中移除
    var idx = this.compareList.indexOf(id);
    if (idx !== -1) {
      this.compareList.splice(idx, 1);
      sessionStorage.setItem('wiki_compare', JSON.stringify(this.compareList));
    }

    Utils.toast('已删除自定义纸箱');
    this.renderCards();
  },

  // ============================================================
  //  图片上传功能
  // ============================================================

  // 初始化图片上传功能
  initImageUpload: function() {
    var self = this;

    // 初始化 IndexedDB
    if (typeof ImageStorage !== 'undefined') {
      ImageStorage.init().then(function() {
        console.log('ImageStorage initialized');
        self.renderAllCardImages();
      }).catch(function(err) {
        console.error('Failed to init ImageStorage:', err);
      });
    }

    // 监听全局粘贴事件（支持多张图片）
    document.addEventListener('paste', function(e) {
      var items = e.clipboardData.items;
      var imageFiles = [];
      for (var i = 0; i < items.length; i++) {
        if (items[i].type.indexOf('image') !== -1) {
          imageFiles.push(items[i].getAsFile());
        }
      }
      if (imageFiles.length === 0) return;

      var id = self.getCurrentId();
      if (!id) return;
      self._batchUploadImages(id, imageFiles);
    });

    // 监听全局拖拽事件（支持多张图片）
    document.addEventListener('dragover', function(e) {
      e.preventDefault();
      e.stopPropagation();
    });

    document.addEventListener('drop', function(e) {
      e.preventDefault();
      e.stopPropagation();

      var files = e.dataTransfer.files;
      var imageFiles = [];
      for (var i = 0; i < files.length; i++) {
        if (files[i].type.indexOf('image') !== -1) {
          imageFiles.push(files[i]);
        }
      }
      if (imageFiles.length === 0) return;

      var id = self.getCurrentId();
      if (!id) return;
      self._batchUploadImages(id, imageFiles);
    });
  },

  // 触发图片上传
  // slotIndex: 指定上传到的槽位(0-2)，不传则自动找第一个空位
  triggerImageUpload: function(id, slotIndex) {
    var input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.onchange = function(e) {
      var file = e.target.files[0];
      if (file) {
        if (typeof slotIndex === 'number') {
          WikiS.handleImageUpload(id, file, slotIndex);
        } else {
          WikiS.handleImageUpload(id, file);
        }
      }
    };
    input.click();
  },

  // 处理图片上传
  // slotIndex: 指定槽位(0-2)，不传则自动找第一个空位
  handleImageUpload: function(id, file, slotIndex) {
    if (!file || typeof ImageStorage === 'undefined') return;
    var self = this;

    function doUpload(slot) {
      ImageStorage.saveImage(id + '_img_' + slot, file).then(function() {
        WikiS.renderDetailImage(id);
        Utils.toast('图片上传成功！（' + (slot + 1) + '/3）');
      }).catch(function(err) {
        console.error('Failed to save image:', err);
        Utils.toast('图片上传失败，请重试');
      });
    }

    if (typeof slotIndex === 'number') {
      doUpload(slotIndex);
      return;
    }

    // 自动找第一个空槽位
    var checks = [
      ImageStorage.hasImage(id + '_img_0'),
      ImageStorage.hasImage(id + '_img_1')
    ];

    Promise.all(checks).then(function(results) {
      for (var i = 0; i < 2; i++) {
        if (!results[i]) {
          doUpload(i);
          return;
        }
      }
      Utils.toast('最多上传 2 张图片，请先删除不需要的图片');
    });
  },

  // 渲染所有卡片图片（卡片已改用糖果色，此函数仅保留兼容性）
  renderAllCardImages: function() {
    // 卡片现在使用糖果色头部，不再渲染图片
  },

  // 渲染卡片图片（已弃用，保留兼容性）
  renderCardImage: function(id) {
    // 卡片现在使用糖果色头部
  },

  // 渲染详情页图片（最多3张）
  renderDetailImage: function(id) {
    if (typeof ImageStorage === 'undefined') return;
    var self = this;

    // 兼容旧数据：如果存在旧键 {id}_img，迁移到 {id}_img_0
    var oldKey = id + '_img';
    var newKey = id + '_img_0';
    ImageStorage.hasImage(oldKey).then(function(hasOld) {
      if (hasOld) {
        ImageStorage.hasImage(newKey).then(function(hasNew) {
          if (!hasNew) {
            // 旧数据存在且新键不存在，执行迁移
            ImageStorage.getImage(oldKey).then(function(dataUrl) {
              if (dataUrl) {
                // 将 Data URL 转为 Blob 再保存
                var byteString = atob(dataUrl.split(',')[1]);
                var mimeString = dataUrl.split(',')[0].split(':')[1].split(';')[0];
                var ab = new ArrayBuffer(byteString.length);
                var ia = new Uint8Array(ab);
                for (var i = 0; i < byteString.length; i++) {
                  ia[i] = byteString.charCodeAt(i);
                }
                var blob = new Blob([ab], { type: mimeString });
                var file = new File([blob], 'migrated.jpg', { type: mimeString });
                ImageStorage.saveImage(newKey, file).then(function() {
                  ImageStorage.deleteImage(oldKey);
                  console.log('Migrated old image for', id);
                  self._doRenderDetailImages(id);
                });
              }
            });
          } else {
            self._doRenderDetailImages(id);
          }
        });
      } else {
        self._doRenderDetailImages(id);
      }
    });
  },

  // 实际渲染详情页图片
  _doRenderDetailImages: function(id) {
    var slots = [0, 1];
    var filledCount = 0;
    var promises = slots.map(function(slot) {
      var key = id + '_img_' + slot;
      return ImageStorage.hasImage(key).then(function(has) {
        if (has) {
          filledCount++;
          return ImageStorage.getImage(key).then(function(dataUrl) {
            return { slot: slot, dataUrl: dataUrl };
          });
        }
        return { slot: slot, dataUrl: null };
      }).catch(function() {
        return { slot: slot, dataUrl: null };
      });
    });

    Promise.all(promises).then(function(results) {
      results.forEach(function(result) {
        var container = document.getElementById('wiki-img-' + id + '-' + result.slot);
        if (!container) return;

        if (result.dataUrl) {
          container.innerHTML =
            '<img src="' + result.dataUrl + '" class="wiki-diag-img">' +
            '<button class="wiki-image-delete-btn" onclick="event.stopPropagation(); WikiS.deleteDetailImage(\'' + id + '\', ' + result.slot + ');" title="删除图片">×</button>';
        } else {
          container.innerHTML = '<div class="wiki-image-upload-hint">📷 点击上传<br>或粘贴图片</div>';
        }
      });

      // 更新计数提示
      var countEl = document.getElementById('wiki-img-count-' + id);
      if (countEl) {
        countEl.textContent = '（已上传 ' + filledCount + '/2 张）';
      }
    });
  },

  // 删除详情页指定槽位的图片
  deleteDetailImage: function(id, slotIndex) {
    if (typeof ImageStorage === 'undefined') return;
    if (!confirm('确定要删除这张图片吗？')) return;

    var key = id + '_img_' + slotIndex;
    ImageStorage.deleteImage(key).then(function() {
      WikiS.renderDetailImage(id);
      Utils.toast('图片已删除');
    }).catch(function(err) {
      console.error('Failed to delete image:', err);
      Utils.toast('删除失败，请重试');
    });
  },

  // 批量上传图片（粘贴/拖拽多张时调用）
  _batchUploadImages: function(id, files) {
    if (!files || files.length === 0 || typeof ImageStorage === 'undefined') return;
    var self = this;

    // 先检查当前各槽位状态
    var checks = [
      ImageStorage.hasImage(id + '_img_0'),
      ImageStorage.hasImage(id + '_img_1')
    ];

    Promise.all(checks).then(function(results) {
      var emptySlots = [];
      for (var i = 0; i < 2; i++) {
        if (!results[i]) emptySlots.push(i);
      }

      if (emptySlots.length === 0) {
        Utils.toast('最多上传 2 张图片，请先删除不需要的图片');
        return;
      }

      // 确定本次能上传多少张
      var uploadCount = Math.min(files.length, emptySlots.length);
      var uploaded = 0;
      var failed = 0;

      function uploadNext(idx) {
        if (idx >= uploadCount) {
          WikiS.renderDetailImage(id);
          if (failed === 0) {
            Utils.toast('成功上传 ' + uploaded + ' 张图片！');
          } else {
            Utils.toast('上传完成：成功 ' + uploaded + ' 张，失败 ' + failed + ' 张');
          }
          return;
        }

        var slot = emptySlots[idx];
        var file = files[idx];
        ImageStorage.saveImage(id + '_img_' + slot, file).then(function() {
          uploaded++;
          uploadNext(idx + 1);
        }).catch(function(err) {
          console.error('Batch upload failed for slot', slot, err);
          failed++;
          uploadNext(idx + 1);
        });
      }

      uploadNext(0);
    });
  },

  // 获取当前纸箱ID
  getCurrentId: function() {
    var params = new URLSearchParams(window.location.search);
    return params.get('id') || '';
  }
};

// ─── Router.renderWiki ───────────────────────────────────────────
// 主页：搜索 + 卡片网格
Router.renderWiki = function (content, title, subtitle, actions) {
  WikiS.init();

  title.textContent = '纸箱 Wiki';
  subtitle.textContent = '纸箱类型百科全书 — 点击卡片查看详情';
  actions.innerHTML =
    '<button class="btn btn-primary" onclick="WikiS.renderCompare()" ' +
    'id="wiki-compare-btn">对比已选（<span id="wiki-compare-cnt">0</span>）</button>';

  content.innerHTML =
    '<div class="wiki-container fade-in">' +
      '<div class="wiki-search-wrap">' +
        '<svg class="wiki-search-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">' +
          '<circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>' +
        '</svg>' +
        '<input type="text" id="wiki-search-input" class="wiki-search-input" ' +
          'placeholder="搜索纸箱代码、名称或应用场景（如 RSC、常规、快递）" ' +
          'oninput="WikiS.search(this.value)">' +
        '<button class="wiki-search-clear" id="wiki-search-clear" onclick="WikiS.clearSearch()">×</button>' +
      '</div>' +
      '<div class="wiki-grid" id="wiki-grid"></div>' +
    '</div>';

  WikiS.renderCards();
  WikiS._updateCompareBtn();
};

// 给 WikiS 补充一个更新对比按钮的方法
WikiS._updateCompareBtn = function () {
  var cnt = this.compareList.length;
  var btn = document.getElementById('wiki-compare-btn');
  var cntEl = document.getElementById('wiki-compare-cnt');
  if (cntEl) cntEl.textContent = cnt;
  if (btn) btn.disabled = cnt < 2;
};

// ─── Wiki 详情页路由回调（由 Router.render() 调用）───
Router.renderWikiDetail = function (id, content, title, subtitle, actions) {
  WikiS.renderDetail(id);
};
