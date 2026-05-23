/* ================================================================
   Carton-CRM 客户管理增强功能
   功能：客户分类（经销商/终端）、国家分组、跟进逻辑
   ================================================================ */

// ==================== 1. 国家→国旗映射 ====================
const COUNTRY_FLAGS = {
  '泰国': '\u{1F1F9}\u{1F1ED}', '印度尼西亚': '\u{1F1EE}\u{1F1E9}', '印尼': '\u{1F1EE}\u{1F1E9}', 
  '越南': '\u{1F1FB}\u{1F1F3}', '柬埔寨': '\u{1F1F0}\u{1F1ED}', '老挝': '\u{1F1F1}\u{1F1E6}',
  '新加坡': '\u{1F1F8}\u{1F1EC}', '马来西亚': '\u{1F1F2}\u{1F1FE}', '菲律宾': '\u{1F1F5}\u{1F1ED}', 
  '中国': '\u{1F1E8}\u{1F1F3}', '香港': '\u{1F1ED}\u{1F1F0}', '台湾': '\u{1F1F9}\u{1F1FC}', 
  '澳门': '\u{1F1F2}\u{1F1F4}', '文莱': '\u{1F1E7}\u{1F1F3}',
  '日本': '\u{1F1EF}\u{1F1F5}', '韩国': '\u{1F1F0}\u{1F1F7}', '印度': '\u{1F1EE}\u{1F1F3}', 
  '美国': '\u{1F1FA}\u{1F1F8}', '英国': '\u{1F1EC}\u{1F1E7}', '德国': '\u{1F1E9}\u{1F1EA}', 
  '法国': '\u{1F1EB}\u{1F1F7}', '意大利': '\u{1F1EE}\u{1F1F9}', '西班牙': '\u{1F1EA}\u{1F1F8}', 
  '加拿大': '\u{1F1E8}\u{1F1E6}', '澳大利亚': '\u{1F1E6}\u{1F1FA}', '巴西': '\u{1F1E7}\u{1F1F7}', 
  '墨西哥': '\u{1F1F2}\u{1F1FD}', '土耳其': '\u{1F1F9}\u{1F1F7}', '阿联酋': '\u{1F1E6}\u{1F1EA}', 
  '沙特': '\u{1F1F8}\u{1F1E6}', '南非': '\u{1F1FF}\u{1F1E6}', '埃及': '\u{1F1EA}\u{1F1EC}', 
  '俄罗斯': '\u{1F1F7}\u{1F1FA}', '波兰': '\u{1F1F5}\u{1F1F1}', '荷兰': '\u{1F1F3}\u{1F1F1}'
};

// ==================== 2. 客户类型定义 ====================
const CUSTOMER_TYPES = [
  { value: 'distributor', label: '经销商', icon: '🏪' },
  { value: 'end_user', label: '终端客户', icon: '🏭' }
];

// ==================== 3. 跟进频率配置 ====================
const FOLLOWUP_INTERVALS = {
  'A': 7,   // A级：7个工作日
  'B': 9,   // B级：9个工作日
  'C': 14,  // C级：14个工作日
  'D': 15   // D级：15个工作日
};

// ==================== 4. 阶段 & 优先级兼容配置 ====================
// 原应用的 STAGES 是字符串数组，PRIORITIES 没有 badge 属性
// 这里提供兼容版本供增强功能使用
var STAGES_CFG = [
  { value: '潜在客户', label: '潜在客户', badge: 'badge-gray' },
  { value: '意向明确', label: '意向明确', badge: 'badge-blue' },
  { value: '报价中',   label: '报价中',   badge: 'badge-orange' },
  { value: '谈判中',   label: '谈判中',   badge: 'badge-orange' },
  { value: '样品确认', label: '样品确认', badge: 'badge-green' },
  { value: '已成交',   label: '已成交',   badge: 'badge-green' },
  { value: '已流失',   label: '已流失',   badge: 'badge-red' }
];
var PRIORITIES_CFG = [
  { value: 'A', label: 'A级', badge: 'badge-green', color: '#34C759' },
  { value: 'B', label: 'B级', badge: 'badge-orange', color: '#FF9500' },
  { value: 'C', label: 'C级', badge: 'badge-blue', color: '#007AFF' },
  { value: 'D', label: 'D级', badge: 'badge-gray', color: '#86868B' }
];

// ==================== 5. 获取客户类型 ====================
function getCustomerType(customer) {
  // 兼容旧数据：如果没有 customerType 字段，默认为 'end_user'
  return customer.customerType || 'end_user';
}

// ==================== 5. 安全转义 HTML ====================
// 如果 Utils 没有 escapeHtml，提供一个后备实现
if (typeof Utils === 'undefined') window.Utils = {};
if (!Utils.escapeHtml) {
  Utils.escapeHtml = function(str) {
    if (typeof str !== 'string') return str;
    var div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
  };
}

// ==================== 6. 获取国家国旗 ====================
function getCountryFlag(country) {
  if (!country) return '🌍';
  // 尝试精确匹配
  if (COUNTRY_FLAGS[country]) return COUNTRY_FLAGS[country];
  // 尝试部分匹配
  for (const key of Object.keys(COUNTRY_FLAGS)) {
    if (country.includes(key) || key.includes(country)) {
      return COUNTRY_FLAGS[key];
    }
  }
  return '🌍'; // 默认地球图标
}

// ==================== 6. 计算下次跟进日期 ====================
function calculateNextFollowUp(lastFollowUp, priority) {
  if (!lastFollowUp) return null;
  
  const interval = FOLLOWUP_INTERVALS[priority] || 14; // 默认14天
  const lastDate = new Date(lastFollowUp);
  let bizDays = 0;
  let currentDate = new Date(lastDate);
  
  while (bizDays < interval) {
    currentDate.setDate(currentDate.getDate() + 1);
    // 跳过周末（0=周日，6=周六）
    if (currentDate.getDay() !== 0 && currentDate.getDay() !== 6) {
      bizDays++;
    }
  }
  
  return currentDate.toISOString().split('T')[0];
}

// ==================== 7. 格式化日期显示 ====================
function formatFollowUpStatus(nextFollowUp) {
  if (!nextFollowUp) return '<span style="color:var(--text-secondary)">未设置</span>';
  
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const target = new Date(nextFollowUp);
  target.setHours(0, 0, 0, 0);
  
  const diffDays = Math.ceil((target - today) / (1000 * 60 * 60 * 24));
  
  if (diffDays < 0) {
    return '<span style="color:var(--apple-red);font-weight:600">已过期 ' + Math.abs(diffDays) + ' 天</span>';
  } else if (diffDays === 0) {
    return '<span style="color:var(--apple-orange);font-weight:600">今天</span>';
  } else if (diffDays <= 3) {
    return '<span style="color:var(--apple-orange);font-weight:600">' + diffDays + ' 天后</span>';
  } else {
    return '<span style="color:var(--text-secondary)">' + diffDays + ' 天后</span>';
  }
}

// ==================== 8. 增强客户表单 ====================
// 重写 showCustomerForm 函数以包含客户类型字段
const originalShowCustomerForm = window.showCustomerForm || null;

function showCustomerFormEnhanced(id) {
  const isEdit = id ? true : false;
  let customer = null;
  
  if (isEdit) {
    const customers = Storage.getCustomers();
    customer = customers.find(c => c.id === id);
    if (!customer) return;
  }
  
  const html = '<div class="modal-overlay" onclick="closeModal()"></div>' +
    '<div class="modal fade-in">' +
      '<div class="modal-header">' +
        '<div class="modal-title">' + (isEdit ? '✏️ 编辑客户' : '➕ 新建客户') + '</div>' +
        '<button class="modal-close" onclick="closeModal()">✕</button>' +
      '</div>' +
      '<form onsubmit="saveCustomerForm(event' + (id ? ', \'' + id + '\'' : '') + ')">' +
        '<div class="form-grid">' +
          '<div class="form-group">' +
            '<label class="form-label">客户名称 *</label>' +
            '<input class="form-input" name="name" required value="' + (customer ? Utils.escapeHtml(customer.name) : '') + '">' +
          '</div>' +
          '<div class="form-group">' +
            '<label class="form-label">客户类型 *</label>' +
            '<select class="form-input" name="customerType" required>' +
              '<option value="">请选择...</option>' +
              CUSTOMER_TYPES.map(t => '<option value="' + t.value + '" ' + (customer && customer.customerType === t.value ? 'selected' : '') + '>' + t.icon + ' ' + t.label + '</option>').join('') +
            '</select>' +
          '</div>' +
          '<div class="form-group">' +
            '<label class="form-label">国家</label>' +
            '<input class="form-input" name="country" value="' + (customer ? Utils.escapeHtml(customer.country || '') : '') + '" placeholder="如：泰国、越南、印度尼西亚">' +
          '</div>' +
          '<div class="form-group">' +
            '<label class="form-label">优先级</label>' +
            '<select class="form-input" name="priority">' +
              '<option value="A" ' + (customer && customer.priority === 'A' ? 'selected' : '') + '>A 级（高优先级）</option>' +
              '<option value="B" ' + (customer && customer.priority === 'B' ? 'selected' : (!customer ? 'selected' : '')) + '>B 级（中优先级）</option>' +
              '<option value="C" ' + (customer && customer.priority === 'C' ? 'selected' : '') + '>C 级（低优先级）</option>' +
              '<option value="D" ' + (customer && customer.priority === 'D' ? 'selected' : '') + '>D 级（观望）</option>' +
            '</select>' +
          '</div>' +
          '<div class="form-group">' +
            '<label class="form-label">客户阶段</label>' +
            '<select class="form-input" name="stage">' +
              STAGES_CFG.map(s => '<option value="' + s.value + '" ' + (customer && customer.stage === s.value ? 'selected' : '') + '>' + s.label + '</option>').join('') +
            '</select>' +
          '</div>' +
          '<div class="form-group">' +
            '<label class="form-label">WhatsApp</label>' +
            '<input class="form-input" name="whatsapp" value="' + (customer ? Utils.escapeHtml(customer.whatsapp || '') : '') + '">' +
          '</div>' +
          '<div class="form-group">' +
            '<label class="form-label">Email</label>' +
            '<input class="form-input" name="email" type="email" value="' + (customer ? Utils.escapeHtml(customer.email || '') : '') + '">' +
          '</div>' +
          '<div class="form-group">' +
            '<label class="form-label">最近跟进</label>' +
            '<input class="form-input" name="lastFollowUp" type="date" value="' + (customer && customer.lastFollowUp ? customer.lastFollowUp : '') + '">' +
          '</div>' +
        '</div>' +
        '<div class="form-group" style="margin-top:12px;">' +
          '<label class="form-label">备注</label>' +
          '<textarea class="form-input" name="notes" rows="3">' + (customer ? Utils.escapeHtml(customer.notes || '') : '') + '</textarea>' +
        '</div>' +
        '<div style="display:flex;gap:12px;margin-top:20px;">' +
          '<button type="submit" class="btn btn-primary" style="flex:1">💾 保存</button>' +
          '<button type="button" class="btn btn-secondary" onclick="closeModal()">取消</button>' +
        '</div>' +
      '</form>' +
    '</div>';
  
  openModal(html);
}

// ==================== 9. 增强保存客户表单 ====================
function saveCustomerFormEnhanced(e, id) {
  e.preventDefault();
  const form = e.target;
  const data = {};
  new FormData(form).forEach((v, k) => data[k] = v.trim());
  
  if (!data.name) return Utils.toast('请输入客户名称');
  if (!data.customerType) return Utils.toast('请选择客户类型');
  
  const customerData = {
    name: data.name,
    customerType: data.customerType,
    country: data.country || '',
    priority: data.priority || 'B',
    stage: data.stage || 'lead',
    whatsapp: data.whatsapp || '',
    email: data.email || '',
    lastFollowUp: data.lastFollowUp || '',
    notes: data.notes || '',
    updatedAt: new Date().toISOString()
  };
  
  // 计算下次跟进日期
  if (customerData.lastFollowUp && customerData.priority) {
    customerData.nextFollowUp = calculateNextFollowUp(customerData.lastFollowUp, customerData.priority);
  }
  
  const customers = Storage.getCustomers();
  
  if (id) {
    // 编辑模式
    const idx = customers.findIndex(c => c.id === id);
    if (idx === -1) return Utils.toast('客户不存在');
    customers[idx] = { ...customers[idx], ...customerData };
  } else {
    // 新增模式
    customers.push({
      id: 'c' + Date.now(),
      ...customerData,
      createdAt: new Date().toISOString()
    });
  }
  
  Storage.setCustomers(customers);
  closeModal();
  Router.renderCustomers();
  Utils.toast(id ? '✅ 客户已更新' : '✅ 客户已创建');
}

// ==================== 10. 重写客户列表渲染（按类型+国家分组）====================
function renderCustomersEnhanced() {
  const all = Storage.getCustomers();
  
  // 按客户类型分组
  const distributors = all.filter(c => getCustomerType(c) === 'distributor');
  const endUsers = all.filter(c => getCustomerType(c) === 'end_user');
  
  // 按国家分组函数
  function groupByCountry(customers) {
    const groups = {};
    customers.forEach(c => {
      const country = c.country || '未分类';
      if (!groups[country]) groups[country] = [];
      groups[country].push(c);
    });
    return groups;
  }
  
  const distributorGroups = groupByCountry(distributors);
  const endUserGroups = groupByCountry(endUsers);
  
  // 渲染国家分组卡片
  function renderCountryGroup(label, groups, bgColor) {
    const countries = Object.keys(groups).sort();
    if (countries.length === 0) return '';
    
    return '<div class="customer-type-section">' +
      '<div class="customer-type-header" style="background:' + bgColor + '20;color:' + bgColor + '">' +
        label + '（' + countries.reduce((sum, c) => sum + groups[c].length, 0) + '）' +
      '</div>' +
      '<div class="country-grid">' +
        countries.map(country => {
          const flag = getCountryFlag(country);
          const customers = groups[country];
          const priorityCounts = { A: 0, B: 0, C: 0, D: 0 };
          customers.forEach(c => { if (priorityCounts.hasOwnProperty(c.priority)) priorityCounts[c.priority]++; });
          
          return '<div class="country-card fade-in" onclick="renderCustomerCountryDetail(\'' + encodeURIComponent(country) + '\', \'' + (label.includes('经销商') ? 'distributor' : 'end_user') + '\')">' +
            '<div class="country-card-flag">' + flag + '</div>' +
            '<div class="country-card-name">' + Utils.escapeHtml(country) + '</div>' +
            '<div class="country-card-count">' + customers.length + ' 个客户</div>' +
            '<div class="country-card-priority">' +
              (priorityCounts.A > 0 ? '<span class="priority-dot" style="background:#FF3B30" title="A级">' + priorityCounts.A + '</span>' : '') +
              (priorityCounts.B > 0 ? '<span class="priority-dot" style="background:#FF9500" title="B级">' + priorityCounts.B + '</span>' : '') +
              (priorityCounts.C > 0 ? '<span class="priority-dot" style="background:#34C759" title="C级">' + priorityCounts.C + '</span>' : '') +
              (priorityCounts.D > 0 ? '<span class="priority-dot" style="background:#8E8E93" title="D级">' + priorityCounts.D + '</span>' : '') +
            '</div>' +
          '</div>';
        }).join('') +
      '</div>' +
    '</div>';
  }
  
  const html = '<div class="page-header">' +
    '<div class="page-title">👥 客户管理</div>' +
    '<div style="display:flex;gap:8px;">' +
      '<button class="btn btn-secondary" onclick="Router.renderFollowupKanban()">📋 跟进看板</button>' +
      '<button class="btn btn-primary" onclick="showCustomerFormEnhanced()">➕ 新建客户</button>' +
    '</div>' +
  '</div>' +
  renderCountryGroup('🏪 经销商', distributorGroups, '#007AFF') +
  renderCountryGroup('🏭 终端客户', endUserGroups, '#34C759');
  
  document.getElementById('main-content').innerHTML = html;
  
  // 添加样式
  if (!document.getElementById('customer-enhanced-styles')) {
    const style = document.createElement('style');
    style.id = 'customer-enhanced-styles';
    style.textContent = `
      .customer-type-section { margin-bottom: 32px; }
      .customer-type-header {
        font-size: 18px;
        font-weight: 700;
        padding: 12px 20px;
        border-radius: 12px;
        margin-bottom: 16px;
      }
      .country-grid {
        display: grid;
        grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
        gap: 16px;
      }
      .country-card {
        background: var(--card);
        border-radius: 16px;
        padding: 20px;
        cursor: pointer;
        transition: var(--transition);
        box-shadow: var(--shadow);
        text-align: center;
      }
      .country-card:hover {
        transform: translateY(-4px);
        box-shadow: var(--shadow-hover);
      }
      .country-card-flag {
        font-size: 48px;
        margin-bottom: 8px;
      }
      .country-card-name {
        font-size: 16px;
        font-weight: 600;
        color: var(--text-primary);
        margin-bottom: 4px;
      }
      .country-card-count {
        font-size: 13px;
        color: var(--text-secondary);
        margin-bottom: 8px;
      }
      .country-card-priority {
        display: flex;
        justify-content: center;
        gap: 4px;
      }
      .priority-dot {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        width: 24px;
        height: 24px;
        border-radius: 50%;
        color: white;
        font-size: 11px;
        font-weight: 700;
      }
    `;
    document.head.appendChild(style);
  }
}

// ==================== 11. 渲染国家详情（点击国家卡片后）====================
function renderCustomerCountryDetail(encodedCountry, customerType) {
  const country = decodeURIComponent(encodedCountry);
  const all = Storage.getCustomers();
  const customers = all.filter(c => 
    getCustomerType(c) === customerType && (c.country || '未分类') === country
  );
  
  const flag = getCountryFlag(country);
  const typeLabel = customerType === 'distributor' ? '经销商' : '终端客户';
  
  const html = '<div class="page-header">' +
    '<div style="display:flex;align-items:center;gap:12px;">' +
      '<button class="btn btn-secondary" onclick="renderCustomersEnhanced()">← 返回</button>' +
      '<div class="page-title">' + flag + ' ' + Utils.escapeHtml(country) + ' · ' + typeLabel + '（' + customers.length + '）</div>' +
    '</div>' +
    '<button class="btn btn-primary" onclick="showCustomerFormEnhanced()">➕ 新建客户</button>' +
  '</div>' +
  '<div class="customer-grid">' +
    customers.map(c => {
      const pCfg = PRIORITIES_CFG.find(p => p.value === c.priority) || PRIORITIES_CFG[1];
      const sCfg = STAGES_CFG.find(s => s.value === c.stage) || STAGES_CFG[0];
      const nextFU = c.nextFollowUp ? formatFollowUpStatus(c.nextFollowUp) : '<span style="color:var(--text-secondary)">未设置</span>';
      const interval = FOLLOWUP_INTERVALS[c.priority] || 14;
      
      return '<div class="customer-card fade-in" onclick="Router.renderCustomerDetail(\'' + c.id + '\')">' +
        '<div class="customer-avatar" style="background:' + AVATAR_COLORS[Math.abs(hashCode(c.name)) % AVATAR_COLORS.length] + '">' +
          (c.name ? c.name.charAt(0).toUpperCase() : '?') +
        '</div>' +
        '<div class="customer-name">' + Utils.escapeHtml(c.name) + '</div>' +
        '<div class="customer-meta">' +
          '<span class="badge ' + pCfg.badge + '">' + pCfg.label + '</span>' +
          '<span class="badge ' + sCfg.badge + '">' + sCfg.label + '</span>' +
        '</div>' +
        '<div class="customer-followup">' +
          '<div style="font-size:12px;color:var(--text-secondary);margin-bottom:4px;">跟进频率：每 ' + interval + ' 个工作日</div>' +
          '<div>下次跟进：' + nextFU + '</div>' +
        '</div>' +
        (c.whatsapp ? '<div class="customer-contact">📱 ' + Utils.escapeHtml(c.whatsapp) + '</div>' : '') +
        (c.email ? '<div class="customer-contact">📧 ' + Utils.escapeHtml(c.email) + '</div>' : '') +
      '</div>';
    }).join('') +
  '</div>';
  
  document.getElementById('main-content').innerHTML = html;
}

// ==================== 12. 辅助函数：字符串哈希 ====================
function hashCode(str) {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // 转换为32位整数
  }
  return hash;
}

// ==================== 13. 重写 Router.renderCustomers ====================
// 保存原始函数
const originalRenderCustomers = Router.renderCustomers;

// 替换为增强版本
function replaceRouterRender() {
  if (typeof Router !== 'undefined' && Router.renderCustomers) {
    Router.renderCustomers = function() {
      renderCustomersEnhanced();
    };
    console.log('[Customer Enhanced] ✅ Router.renderCustomers 已替换');
  } else {
    console.error('[Customer Enhanced] ❌ Router 未定义，无法替换');
  }
}

// 立即执行（如果 Router 已存在）或等待 DOMContentLoaded
if (typeof Router !== 'undefined' && Router.renderCustomers) {
  replaceRouterRender();
} else {
  document.addEventListener('DOMContentLoaded', replaceRouterRender);
}

// ==================== 14. 增强客户详情页 ====================
const originalRenderCustomerDetail = Router.renderCustomerDetail;

Router.renderCustomerDetail = function(id) {
  const customers = Storage.getCustomers();
  const c = customers.find(x => x.id === id);
  if (!c) return Router.renderCustomers();
  
  const pCfg = PRIORITIES_CFG.find(p => p.value === c.priority) || PRIORITIES_CFG[1];
  const sCfg = STAGES_CFG.find(s => s.value === c.stage) || STAGES_CFG[0];
  const flag = getCountryFlag(c.country);
  const typeLabel = getCustomerType(c) === 'distributor' ? '🏪 经销商' : '🏭 终端客户';
  const interval = FOLLOWUP_INTERVALS[c.priority] || 14;
  const nextFU = c.nextFollowUp ? formatFollowUpStatus(c.nextFollowUp) : '<span style="color:var(--text-secondary)">未设置</span>';
  
  const html = '<div class="page-header">' +
    '<div style="display:flex;align-items:center;gap:12px;">' +
      '<button class="btn btn-secondary" onclick="Router.renderCustomers()">← 返回</button>' +
      '<div class="page-title">客户详情</div>' +
    '</div>' +
    '<div style="display:flex;gap:8px;">' +
      '<button class="btn btn-secondary" onclick="showCustomerFormEnhanced(\'' + id + '\')">✏️ 编辑</button>' +
      '<button class="btn btn-danger" onclick="deleteCustomer(\'' + id + '\')">🗑️ 删除</button>' +
    '</div>' +
  '</div>' +
  '<div class="detail-grid">' +
    '<div class="detail-card fade-in">' +
      '<div class="detail-card-header">基本信息</div>' +
      '<div style="display:flex;align-items:center;gap:16px;margin-bottom:20px;">' +
        '<div class="customer-avatar" style="width:64px;height:64px;font-size:24px;background:' + AVATAR_COLORS[Math.abs(hashCode(c.name)) % AVATAR_COLORS.length] + '">' +
          (c.name ? c.name.charAt(0).toUpperCase() : '?') +
        '</div>' +
        '<div>' +
          '<div style="font-size:20px;font-weight:700;color:var(--text-primary);">' + Utils.escapeHtml(c.name) + '</div>' +
          '<div style="font-size:14px;color:var(--text-secondary);margin-top:4px;">' + typeLabel + ' · ' + flag + ' ' + Utils.escapeHtml(c.country || '未设置国家') + '</div>' +
        '</div>' +
      '</div>' +
      '<div class="detail-row"><span class="detail-label">优先级</span><span class="badge ' + pCfg.badge + '">' + pCfg.label + '</span></div>' +
      '<div class="detail-row"><span class="detail-label">客户阶段</span><span class="badge ' + sCfg.badge + '">' + sCfg.label + '</span></div>' +
      '<div class="detail-row"><span class="detail-label">跟进频率</span><span style="font-weight:600;color:var(--apple-blue);">每 ' + interval + ' 个工作日</span></div>' +
      (c.whatsapp ? '<div class="detail-row"><span class="detail-label">WhatsApp</span><span>📱 ' + Utils.escapeHtml(c.whatsapp) + '</span></div>' : '') +
      (c.email ? '<div class="detail-row"><span class="detail-label">Email</span><span>📧 ' + Utils.escapeHtml(c.email) + '</span></div>' : '') +
    '</div>' +
    '<div class="detail-card fade-in" style="animation-delay:0.1s">' +
      '<div class="detail-card-header">跟进信息</div>' +
      '<div class="detail-row"><span class="detail-label">最近跟进</span><span>' + (c.lastFollowUp || '<span style="color:var(--text-secondary)">未记录</span>') + '</span></div>' +
      '<div class="detail-row"><span class="detail-label">下次跟进</span><span>' + nextFU + '</span></div>' +
      '<div style="margin-top:16px;">' +
        '<button class="btn btn-primary" style="width:100%" onclick="logFollowUp(\'' + id + '\')">📝 记录跟进</button>' +
      '</div>' +
    '</div>' +
    (c.notes ? '<div class="detail-card fade-in" style="animation-delay:0.2s">' +
      '<div class="detail-card-header">备注</div>' +
      '<div style="color:var(--text-secondary);line-height:1.6;">' + Utils.escapeHtml(c.notes).replace(/\n/g, '<br>') + '</div>' +
    '</div>' : '') +
  '</div>';
  
  document.getElementById('main-content').innerHTML = html;
};

// ==================== 15. 记录跟进 ====================
function logFollowUp(id) {
  const customers = Storage.getCustomers();
  const idx = customers.findIndex(c => c.id === id);
  if (idx === -1) return;
  
  const today = new Date().toISOString().split('T')[0];
  customers[idx].lastFollowUp = today;
  customers[idx].updatedAt = new Date().toISOString();
  
  // 重新计算下次跟进日期
  if (customers[idx].priority) {
    customers[idx].nextFollowUp = calculateNextFollowUp(today, customers[idx].priority);
  }
  
  Storage.setCustomers(customers);
  Router.renderCustomerDetail(id);
  Utils.toast('✅ 跟进已记录');
}

// ==================== 16. 初始化：确保旧数据有 customerType 字段 ====================
function migrateCustomerData() {
  const customers = Storage.getCustomers();
  let migrated = false;
  
  customers.forEach(c => {
    if (!c.customerType) {
      c.customerType = 'end_user'; // 默认为终端客户
      migrated = true;
    }
    if (!c.nextFollowUp && c.lastFollowUp && c.priority) {
      c.nextFollowUp = calculateNextFollowUp(c.lastFollowUp, c.priority);
      migrated = true;
    }
  });
  
  if (migrated) {
    Storage.setCustomers(customers);
    console.log('[Customer Migration] 客户数据已迁移');
  }
}

console.log('[Customer Enhanced] ✅ 脚本已加载（v2.0）');

// ==================== 17. 页面加载时执行迁移 ====================
document.addEventListener('DOMContentLoaded', function() {
  console.log('[Customer Enhanced] DOMContentLoaded 触发，执行数据迁移...');
  setTimeout(migrateCustomerData, 500);
});
