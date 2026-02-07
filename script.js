/**
 * 密码生成器 - 核心逻辑
 * 安全、强大、用户友好的密码生成工具
 */

// DOM 元素引用
const elements = {
    // 密码显示和操作
    passwordOutput: document.getElementById('passwordOutput'),
    copyBtn: document.getElementById('copyBtn'),
    regenerateBtn: document.getElementById('regenerateBtn'),
    generateBtn: document.getElementById('generateBtn'),

    // 配置选项
    lengthSlider: document.getElementById('lengthSlider'),
    lengthValue: document.getElementById('lengthValue'),
    uppercase: document.getElementById('uppercase'),
    lowercase: document.getElementById('lowercase'),
    numbers: document.getElementById('numbers'),
    symbols: document.getElementById('symbols'),
    ambiguous: document.getElementById('ambiguous'),

    // 强度指示器
    strengthBar: document.getElementById('strengthBar'),
    strengthText: document.getElementById('strengthText'),

    // 密码历史
    historyList: document.getElementById('historyList'),
    clearHistoryBtn: document.getElementById('clearHistoryBtn'),

    // 主题切换
    themeToggle: document.getElementById('themeToggle'),

    // Toast 通知
    toast: document.getElementById('toast'),
    toastMessage: document.getElementById('toastMessage')
};

// 字符集配置
const charSets = {
    uppercase: 'ABCDEFGHIJKLMNOPQRSTUVWXYZ',
    lowercase: 'abcdefghijklmnopqrstuvwxyz',
    numbers: '0123456789',
    symbols: '!@#$%^&*()_+-=[]{}|;:,.<>?',
    ambiguous: 'l1I0O'  // 容易混淆的字符
};

// 密码历史记录
let passwordHistory = [];

/**
 * 初始化应用
 */
function init() {
    // 加载保存的主题设置
    loadTheme();

    // 加载密码历史
    loadPasswordHistory();

    // 绑定事件监听器
    bindEvents();

    // 初始生成密码
    generatePassword();
}

/**
 * 绑定所有事件监听器
 */
function bindEvents() {
    // 生成密码按钮
    elements.generateBtn.addEventListener('click', generatePassword);

    // 重新生成按钮
    elements.regenerateBtn.addEventListener('click', generatePassword);

    // 复制按钮
    elements.copyBtn.addEventListener('click', copyPassword);

    // 滑块值变化
    elements.lengthSlider.addEventListener('input', updateLengthDisplay);

    // 主题切换
    elements.themeToggle.addEventListener('click', toggleTheme);

    // 清除历史记录
    elements.clearHistoryBtn.addEventListener('click', clearHistory);

    // 键盘快捷键
    document.addEventListener('keydown', handleKeyboard);

    // 页面加载完成时生成初始密码
    window.addEventListener('load', () => {
        if (!elements.passwordOutput.value) {
            generatePassword();
        }
    });
}

/**
 * 更新长度显示
 */
function updateLengthDisplay() {
    const length = elements.lengthSlider.value;
    elements.lengthValue.textContent = length;
}

/**
 * 生成随机密码
 */
function generatePassword() {
    const config = getConfig();
    
    // 验证至少选择一种字符类型
    if (!config.uppercase && !config.lowercase && !config.numbers && !config.symbols) {
        showToast('请至少选择一种字符类型', 'error');
        return;
    }

    // 构建字符池
    let charPool = '';
    if (config.uppercase) charPool += charSets.uppercase;
    if (config.lowercase) charPool += charSets.lowercase;
    if (config.numbers) charPool += charSets.numbers;
    if (config.symbols) charPool += charSets.symbols;

    // 排除相似字符
    if (config.ambiguous) {
        charSets.ambiguous.split('').forEach(char => {
            charPool = charPool.split(char).join('');
        });
    }

    // 生成密码
    let password = '';
    const cryptoArray = new Uint32Array(config.length);
    window.crypto.getRandomValues(cryptoArray);

    for (let i = 0; i < config.length; i++) {
        password += charPool[cryptoArray[i] % charPool.length];
    }

    // 确保密码包含至少一种所选字符类型
    password = ensureCharTypes(password, config);

    // 显示密码
    elements.passwordOutput.value = password;

    // 评估并显示密码强度
    const strength = evaluatePasswordStrength(password, config);
    displayStrength(strength);

    // 添加到历史记录
    addToHistory(password);
}

/**
 * 获取当前配置
 */
function getConfig() {
    return {
        length: parseInt(elements.lengthSlider.value, 10),
        uppercase: elements.uppercase.checked,
        lowercase: elements.lowercase.checked,
        numbers: elements.numbers.checked,
        symbols: elements.symbols.checked,
        ambiguous: elements.ambiguous.checked
    };
}

/**
 * 确保密码包含至少一种所选字符类型
 */
function ensureCharTypes(password, config) {
    const types = [];
    if (config.uppercase) types.push(charSets.uppercase);
    if (config.lowercase) types.push(charSets.lowercase);
    if (config.numbers) types.push(charSets.numbers);
    if (config.symbols) types.push(charSets.symbols);

    // 如果只有一种类型，直接返回
    if (types.length === 1) return password;

    const cryptoArray = new Uint32Array(types.length);
    window.crypto.getRandomValues(cryptoArray);

    const newPassword = password.split('');
    
    // 确保每种类型至少有一个字符
    for (let i = 0; i < types.length; i++) {
        const pos = cryptoArray[i] % newPassword.length;
        newPassword[pos] = types[i][cryptoArray[i + types.length] % types[i].length];
    }

    // 打乱字符顺序
    return shuffleString(newPassword.join(''));
}

/**
 * 打乱字符串（使用 Fisher-Yates 算法）
 */
function shuffleString(str) {
    const array = str.split('');
    const cryptoArray = new Uint32Array(array.length);
    window.crypto.getRandomValues(cryptoArray);

    for (let i = array.length - 1; i > 0; i--) {
        const j = cryptoArray[i] % (i + 1);
        [array[i], array[j]] = [array[j], array[i]];
    }

    return array.join('');
}

/**
 * 评估密码强度
 */
function evaluatePasswordStrength(password, config) {
    let score = 0;

    // 基础分数
    score += Math.min(password.length / 16, 1) * 25; // 0-25 分（长度）
    score += config.uppercase ? 10 : 0;              // 10 分（大写）
    score += config.lowercase ? 5 : 0;               // 5 分（小写）
    score += config.numbers ? 10 : 0;                // 10 分（数字）
    score += config.symbols ? 15 : 0;                // 15 分（特殊字符）

    // 长度加成
    if (password.length >= 16) score += 15;
    else if (password.length >= 12) score += 10;
    else if (password.length >= 8) score += 5;

    // 字符多样性加成
    const uniqueChars = new Set(password).size;
    score += Math.min(uniqueChars / password.length * 10, 10);

    return Math.min(Math.round(score), 100);
}

/**
 * 显示密码强度
 */
function displayStrength(score) {
    let strength, className;

    if (score < 40) {
        strength = '弱';
        className = 'weak';
    } else if (score < 60) {
        strength = '一般';
        className = 'fair';
    } else if (score < 80) {
        strength = '良好';
        className = 'good';
    } else {
        strength = '强';
        className = 'strong';
    }

    // 更新强度文本
    elements.strengthText.textContent = `${strength} (${score}%)`;

    // 更新强度条
    elements.strengthBar.className = 'strength-fill ' + className;

    // 根据强度调整颜色
    const colors = {
        weak: '#ef4444',
        fair: '#f59e0b',
        good: '#84cc16',
        strong: '#10b981'
    };
    elements.strengthBar.style.background = colors[className];
}

/**
 * 复制密码到剪贴板
 */
async function copyPassword() {
    const password = elements.passwordOutput.value;
    
    if (!password) {
        showToast('请先生成密码', 'warning');
        return;
    }

    try {
        await navigator.clipboard.writeText(password);
        showToast('密码已复制到剪贴板');
        
        // 复制后清空输入框（可选）
        // setTimeout(() => {
        //     elements.passwordOutput.value = '';
        //     displayStrength(0);
        // }, 2000);
    } catch (err) {
        // 降级方案：使用传统的 clipboard API
        const textarea = document.createElement('textarea');
        textarea.value = password;
        textarea.style.position = 'fixed';
        textarea.style.opacity = '0';
        document.body.appendChild(textarea);
        textarea.select();
        document.execCommand('copy');
        document.body.removeChild(textarea);
        showToast('密码已复制到剪贴板');
    }
}

/**
 * 添加密码到历史记录
 */
function addToHistory(password) {
    if (!password || passwordHistory.includes(password)) return;

    // 最多保留10条记录
    if (passwordHistory.length >= 10) {
        passwordHistory.pop();
    }

    passwordHistory.unshift({
        password: password,
        timestamp: new Date()
    });

    // 保存到 localStorage
    savePasswordHistory();

    // 更新UI
    renderHistory();
}

/**
 * 渲染历史记录
 */
function renderHistory() {
    if (passwordHistory.length === 0) {
        elements.historyList.innerHTML = '<p class="empty-history">暂无历史记录</p>';
        return;
    }

    const historyHTML = passwordHistory.map((item, index) => `
        <div class="history-item" data-index="${index}">
            <span class="password">${escapeHtml(item.password)}</span>
            <span class="time">${formatTime(item.timestamp)}</span>
            <button class="copy-history-btn" title="复制" onclick="copyHistoryPassword(${index})">
                <i class="fas fa-copy"></i>
            </button>
        </div>
    `).join('');

    elements.historyList.innerHTML = historyHTML;
}

/**
 * 复制历史记录中的密码
 */
function copyHistoryPassword(index) {
    const password = passwordHistory[index].password;
    
    navigator.clipboard.writeText(password).then(() => {
        showToast('密码已复制到剪贴板');
    }).catch(() => {
        // 降级方案
        const textarea = document.createElement('textarea');
        textarea.value = password;
        textarea.style.position = 'fixed';
        textarea.style.opacity = '0';
        document.body.appendChild(textarea);
        textarea.select();
        document.execCommand('copy');
        document.body.removeChild(textarea);
        showToast('密码已复制到剪贴板');
    });
}

/**
 * 清除历史记录
 */
function clearHistory() {
    if (passwordHistory.length === 0) return;

    if (confirm('确定要清除所有历史记录吗？')) {
        passwordHistory = [];
        savePasswordHistory();
        renderHistory();
        showToast('历史记录已清除');
    }
}

/**
 * 保存密码历史到 localStorage
 */
function savePasswordHistory() {
    try {
        localStorage.setItem('passwordHistory', JSON.stringify(passwordHistory));
    } catch (e) {
        console.warn('无法保存密码历史:', e);
    }
}

/**
 * 从 localStorage 加载密码历史
 */
function loadPasswordHistory() {
    try {
        const saved = localStorage.getItem('passwordHistory');
        if (saved) {
            passwordHistory = JSON.parse(saved).map(item => ({
                ...item,
                timestamp: new Date(item.timestamp)
            }));
            renderHistory();
        }
    } catch (e) {
        console.warn('无法加载密码历史:', e);
    }
}

/**
 * 主题切换功能
 */
function toggleTheme() {
    const currentTheme = document.documentElement.getAttribute('data-theme');
    const newTheme = currentTheme === 'dark' ? 'light' : 'dark';

    document.documentElement.setAttribute('data-theme', newTheme);
    localStorage.setItem('theme', newTheme);

    // 更新图标
    const icon = elements.themeToggle.querySelector('i');
    if (newTheme === 'dark') {
        icon.className = 'fas fa-sun';
    } else {
        icon.className = 'fas fa-moon';
    }
}

/**
 * 加载保存的主题
 */
function loadTheme() {
    const savedTheme = localStorage.getItem('theme') || 'light';
    document.documentElement.setAttribute('data-theme', savedTheme);

    // 更新图标
    const icon = elements.themeToggle.querySelector('i');
    if (savedTheme === 'dark') {
        icon.className = 'fas fa-sun';
    } else {
        icon.className = 'fas fa-moon';
    }
}

/**
 * 键盘快捷键处理
 */
function handleKeyboard(e) {
    // Ctrl/Cmd + Enter: 生成密码
    if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
        e.preventDefault();
        generatePassword();
    }

    // Ctrl/Cmd + C: 复制密码
    if ((e.ctrlKey || e.metaKey) && e.key === 'c' && elements.passwordOutput.value) {
        // 允许默认复制行为
    }

    // Ctrl/Cmd + Shift + T: 切换主题
    if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === 'T') {
        e.preventDefault();
        toggleTheme();
    }
}

/**
 * 显示 Toast 通知
 */
function showToast(message, type = 'success') {
    elements.toastMessage.textContent = message;
    elements.toast.className = 'toast show';

    // 根据类型调整颜色
    const icon = elements.toast.querySelector('i');
    if (type === 'error') {
        icon.className = 'fas fa-exclamation-circle';
        icon.style.color = '#ef4444';
    } else if (type === 'warning') {
        icon.className = 'fas fa-exclamation-triangle';
        icon.style.color = '#f59e0b';
    } else {
        icon.className = 'fas fa-check-circle';
        icon.style.color = '#10b981';
    }

    // 3秒后隐藏
    setTimeout(() => {
        elements.toast.classList.remove('show');
    }, 3000);
}

/**
 * 格式化时间
 */
function formatTime(date) {
    const now = new Date();
    const diff = now - date;

    if (diff < 60000) { // 1分钟内
        return '刚刚';
    } else if (diff < 3600000) { // 1小时内
        return `${Math.floor(diff / 60000)}分钟前`;
    } else if (diff < 86400000) { // 24小时内
        return `${Math.floor(diff / 3600000)}小时前`;
    } else {
        return date.toLocaleDateString('zh-CN');
    }
}

/**
 * HTML 转义（防止 XSS）
 */
function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// 将复制历史密码函数暴露到全局作用域
window.copyHistoryPassword = copyHistoryPassword;

// 启动应用
init();
