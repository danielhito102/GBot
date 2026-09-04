// ============================================
// 🚀 GBOT LAUNCHER - AUTOJS6 COMPATIBLE
// Versão 2.2 - Correções e Melhorias
// ============================================

"ui";

// ============================================
// CONFIGURAÇÃO
// ============================================

var CONFIG = {
    OWNER: "danielhito102",
    REPO: "GBot",
    TOKEN: "",
    INTERVAL: 3000,
    TIMEOUT: 10000,
    MAX_FAILS: 5,
    TRACE_ENABLED: true,
    CLEAN_ON_START: true,
    CLEAN_ON_EXIT: true,
    CLEAN_ON_REVOKE: true,
    USE_THREADS: true
};

// ============================================
// URLs
// ============================================

var URLS = {
    SERIAL: "https://raw.githubusercontent.com/" + CONFIG.OWNER + "/" + CONFIG.REPO + "/main/seriais.json",
    GBOT: "https://raw.githubusercontent.com/" + CONFIG.OWNER + "/" + CONFIG.REPO + "/main/GBot.js",
    DEVICES: "https://raw.githubusercontent.com/" + CONFIG.OWNER + "/" + CONFIG.REPO + "/main/devices.json"
};

// ============================================
// SISTEMA DE TRACE
// ============================================

var traceSystem = {
    entries: [],
    maxEntries: 1000,
    startTime: 0,
    sessionId: "",
    serialHistory: [],
    revocationHistory: [],
    dbUpdateTimes: [],
    
    init: function() {
        this.startTime = Date.now();
        this.sessionId = Date.now().toString(36) + Math.random().toString(36).substr(2, 5);
        this.entries = [];
        this.serialHistory = [];
        this.revocationHistory = [];
        this.dbUpdateTimes = [];
    },
    
    add: function(type, data) {
        var entry = {
            timestamp: Date.now(),
            time: new Date().toISOString(),
            type: type,
            data: data,
            sessionId: this.sessionId,
            elapsed: Date.now() - this.startTime
        };
        
        this.entries.push(entry);
        if (this.entries.length > this.maxEntries) {
            this.entries.splice(0, 100);
        }
        
        if (type === 'SERIAL_CHECK' || type === 'SERIAL_FOUND' || type === 'SERIAL_REVOKED') {
            this.serialHistory.push(entry);
        }
        
        if (type === 'REVOKE' || type === 'REVOKE_DETECTED') {
            this.revocationHistory.push(entry);
        }
        
        if (type === 'DB_UPDATE') {
            this.dbUpdateTimes.push(entry);
        }
        
        return entry;
    },
    
    getSerialTimeline: function() {
        var result = [];
        for (var i = 0; i < this.serialHistory.length; i++) {
            var e = this.serialHistory[i];
            result.push({
                time: e.time,
                type: e.type,
                serial: e.data.serial || 'unknown',
                status: e.data.status || 'unknown',
                elapsed: e.elapsed
            });
        }
        return result;
    },
    
    getRevocationTimeline: function() {
        var result = [];
        for (var i = 0; i < this.revocationHistory.length; i++) {
            var e = this.revocationHistory[i];
            result.push({
                time: e.time,
                type: e.type,
                serial: e.data.serial || 'unknown',
                detectionTime: e.data.detectionTime || 0,
                checks: e.data.checks || 0
            });
        }
        return result;
    },
    
    getSummary: function() {
        var lastSerial = this.serialHistory.length > 0 ? this.serialHistory[this.serialHistory.length - 1] : null;
        var lastRevoke = this.revocationHistory.length > 0 ? this.revocationHistory[this.revocationHistory.length - 1] : null;
        
        return {
            sessionId: this.sessionId,
            startTime: new Date(this.startTime).toISOString(),
            duration: Date.now() - this.startTime,
            totalEntries: this.entries.length,
            serialChecks: this.serialHistory.length,
            revocations: this.revocationHistory.length,
            dbUpdates: this.dbUpdateTimes.length,
            lastSerialCheck: lastSerial,
            lastRevocation: lastRevoke
        };
    },
    
    exportTrace: function() {
        return {
            summary: this.getSummary(),
            serialTimeline: this.getSerialTimeline(),
            revocationTimeline: this.getRevocationTimeline(),
            fullLogs: this.entries
        };
    },
    
    clear: function() {
        this.entries = [];
        this.serialHistory = [];
        this.revocationHistory = [];
        this.dbUpdateTimes = [];
        this.startTime = Date.now();
        this.sessionId = Date.now().toString(36) + Math.random().toString(36).substr(2, 5);
    }
};

// ============================================
// SISTEMA DE CLEAN
// ============================================

var cleanSystem = {
    
    getTempFiles: function() {
        var files = [];
        try {
            var dirs = [
                '/sdcard/',
                '/data/local/tmp/',
                '/sdcard/Android/data/org.autojs.autojs6/cache/',
                '/sdcard/autojs/',
                '/sdcard/脚本/',
                '/sdcard/Download/'
            ];
            
            var patterns = ['gbot_temp.js', 'gbot_*.js', 'temp_*.js', 'tmp-*.js', '*.bak', '*.cache'];
            
            for (var d = 0; d < dirs.length; d++) {
                try {
                    var folder = new java.io.File(dirs[d]);
                    if (folder.exists() && folder.isDirectory()) {
                        var list = folder.listFiles();
                        if (list) {
                            for (var f = 0; f < list.length; f++) {
                                var file = list[f];
                                var name = file.getName();
                                for (var p = 0; p < patterns.length; p++) {
                                    var pattern = patterns[p].replace(/\*/g, '.*');
                                    if (name.match(pattern)) {
                                        files.push({
                                            path: file.getAbsolutePath(),
                                            name: name,
                                            size: file.length(),
                                            modified: file.lastModified()
                                        });
                                        break;
                                    }
                                }
                            }
                        }
                    }
                } catch(e) {}
            }
        } catch(e) {}
        return files;
    },
    
    getRunningScripts: function() {
        var scripts = [];
        try {
            var all = engines.all();
            for (var i = 0; i < all.length; i++) {
                try {
                    var script = all[i];
                    var name = script.getName ? script.getName() : 'unknown';
                    scripts.push({
                        name: name,
                        running: true
                    });
                } catch(e) {}
            }
        } catch(e) {}
        return scripts;
    },
    
    cleanAll: function(force) {
        var result = {
            filesDeleted: [],
            scriptsKilled: [],
            cacheCleared: [],
            errors: []
        };
        
        try {
            var scripts = this.getRunningScripts();
            for (var i = 0; i < scripts.length; i++) {
                var script = scripts[i];
                if (script.name.indexOf('GBot') !== -1 || script.name.indexOf('Finalizador') !== -1 || force) {
                    try {
                        var all = engines.all();
                        for (var j = 0; j < all.length; j++) {
                            var s = all[j];
                            if (s.getName && s.getName().indexOf(script.name) !== -1) {
                                s.forceStop();
                                result.scriptsKilled.push(script.name);
                            }
                        }
                    } catch(e) {
                        result.errors.push('Erro ao matar ' + script.name + ': ' + e.message);
                    }
                }
            }
        } catch(e) {
            result.errors.push('Erro ao listar scripts: ' + e.message);
        }
        
        try {
            var tempFiles = this.getTempFiles();
            for (var i = 0; i < tempFiles.length; i++) {
                try {
                    var f = new java.io.File(tempFiles[i].path);
                    if (f.exists() && f.delete()) {
                        result.filesDeleted.push(tempFiles[i].path);
                    }
                } catch(e) {
                    result.errors.push('Erro ao deletar ' + tempFiles[i].path + ': ' + e.message);
                }
            }
        } catch(e) {}
        
        try {
            var cacheDir = context.getCacheDir();
            if (cacheDir && cacheDir.exists()) {
                var list = cacheDir.listFiles();
                if (list) {
                    for (var i = 0; i < list.length; i++) {
                        try {
                            if (list[i].delete()) {
                                result.cacheCleared.push(list[i].getAbsolutePath());
                            }
                        } catch(e) {}
                    }
                }
            }
        } catch(e) {}
        
        try { System.gc(); } catch(e) {}
        
        return result;
    },
    
    fullReset: function() {
        var result = {
            cleaned: false,
            killed: false,
            cacheCleared: false
        };
        
        var cleanResult = this.cleanAll(true);
        result.cleaned = cleanResult.filesDeleted.length > 0 || cleanResult.cacheCleared.length > 0;
        result.killed = cleanResult.scriptsKilled.length > 0;
        
        try {
            var prefs = context.getSharedPreferences('org.autojs.autojs6_preferences', 0);
            if (prefs) {
                var editor = prefs.edit();
                editor.clear();
                editor.apply();
                result.cacheCleared = true;
            }
        } catch(e) {}
        
        try {
            System.gc();
            System.runFinalization();
        } catch(e) {}
        
        return result;
    }
};

// ============================================
// ESTADO GLOBAL
// ============================================

var STATE = {
    serial: null,
    androidId: null,
    authorized: false,
    user: null,
    validity: null,
    days: null,
    running: false,
    revoked: false,
    monitorActive: false,
    checks: 0,
    fails: 0,
    startTime: 0,
    detectionTime: 0,
    gbotProcess: null,
    monitorThread: null,
    lastCheckResult: null,
    dbLatency: 0,
    firstCheckTime: 0,
    permissionGrantedTime: 0,
    networkAvailable: false
};

// ============================================
// INICIALIZAÇÃO
// ============================================

traceSystem.init();

// ============================================
// UI HELPERS
// ============================================

function $(id) {
    return ui[id];
}

function logMsg(msg, type) {
    type = type || 'info';
    var time = new Date().toLocaleTimeString('pt-BR');
    var line = '[' + time + '] ' + msg + '\n';
    
    if (CONFIG.TRACE_ENABLED) {
        traceSystem.add('LOG', { message: msg, type: type });
    }
    
    try {
        var el = $('logText');
        if (el) {
            var txt = el.text();
            var lines = txt.split('\n');
            if (lines.length > 200) lines.splice(0, 50);
            lines.push(line);
            el.setText(lines.join('\n'));
            $('scrollView').scrollTo(0, el.getHeight());
        }
    } catch(e) {}
}

function setStatus(msg, color) {
    color = color || '#caf0f8';
    try {
        $('statusText').setText(msg);
        $('statusText').setTextColor(colors.parseColor(color));
    } catch(e) {}
}

function showToast(msg) {
    try { 
        android.widget.Toast.makeText(context, msg, 0).show(); 
    } catch(e) {}
}

function copyToClipboard(text, label) {
    try {
        var cb = context.getSystemService(android.content.Context.CLIPBOARD_SERVICE);
        cb.setPrimaryClip(android.content.ClipData.newPlainText(label || 'Text', text));
        showToast('✅ Copiado!');
        return true;
    } catch(e) {
        showToast('❌ Erro ao copiar');
        return false;
    }
}

// ============================================
// REQUISIÇÃO COM THREAD (CORRIGIDO)
// ============================================

function fetchWithMetrics(url, timeout, asJSON) {
    timeout = timeout || CONFIG.TIMEOUT;
    asJSON = asJSON !== undefined ? asJSON : true;
    var start = Date.now();
    var result = { data: null, latency: 0, status: 0, error: null };
    
    if (!CONFIG.USE_THREADS) {
        try {
            var response = http.get(url, {
                headers: { 
                    'User-Agent': 'GBot/2.0',
                    'Accept': asJSON ? 'application/json' : '*/*'
                },
                timeout: timeout
            });
            
            var latency = Date.now() - start;
            
            if (response && response.statusCode === 200) {
                var body = response.body.string();
                if (asJSON) {
                    try {
                        result.data = JSON.parse(body);
                    } catch(e) {
                        result.error = 'JSON Parse Error: ' + e.message;
                    }
                } else {
                    result.data = body;
                }
                result.latency = latency;
                result.status = response.statusCode;
                
                traceSystem.add('DB_UPDATE', {
                    url: url,
                    latency: latency,
                    status: response.statusCode,
                    size: body.length,
                    isJSON: asJSON
                });
            } else {
                result.status = response ? response.statusCode : 0;
                result.error = 'HTTP Error: ' + result.status;
                traceSystem.add('DB_ERROR', {
                    url: url,
                    latency: latency,
                    status: result.status
                });
            }
        } catch(e) {
            result.error = e.message;
            traceSystem.add('DB_ERROR', {
                url: url,
                latency: Date.now() - start,
                error: e.message
            });
        }
        return result;
    }
    
    // Modo com thread
    try {
        var thread = new java.lang.Thread(new java.lang.Runnable({
            run: function() {
                try {
                    var response = http.get(url, {
                        headers: { 
                            'User-Agent': 'GBot/2.0',
                            'Accept': asJSON ? 'application/json' : '*/*'
                        },
                        timeout: timeout
                    });
                    
                    var latency = Date.now() - start;
                    
                    if (response && response.statusCode === 200) {
                        var body = response.body.string();
                        if (asJSON) {
                            try {
                                result.data = JSON.parse(body);
                            } catch(e) {
                                result.error = 'JSON Parse Error: ' + e.message;
                            }
                        } else {
                            result.data = body;
                        }
                        result.latency = latency;
                        result.status = response.statusCode;
                        
                        traceSystem.add('DB_UPDATE', {
                            url: url,
                            latency: latency,
                            status: response.statusCode,
                            size: body.length,
                            isJSON: asJSON
                        });
                    } else {
                        result.status = response ? response.statusCode : 0;
                        result.error = 'HTTP Error: ' + result.status;
                        traceSystem.add('DB_ERROR', {
                            url: url,
                            latency: latency,
                            status: result.status
                        });
                    }
                } catch(e) {
                    result.error = e.message;
                    traceSystem.add('DB_ERROR', {
                        url: url,
                        latency: Date.now() - start,
                        error: e.message
                    });
                }
            }
        }));
        
        thread.start();
        thread.join(timeout + 2000);
        return result;
        
    } catch(e) {
        result.error = 'Thread Error: ' + e.message;
        traceSystem.add('DB_ERROR', {
            url: url,
            latency: Date.now() - start,
            error: result.error
        });
        return result;
    }
}

// ============================================
// FUNÇÕES ESPECÍFICAS
// ============================================

function fetchJSONWithMetrics(url, timeout) {
    return fetchWithMetrics(url, timeout, true);
}

function fetchTextWithMetrics(url, timeout) {
    return fetchWithMetrics(url, timeout, false);
}

// ============================================
// VERIFICAÇÃO DE CONEXÃO
// ============================================

function checkNetworkConnection() {
    try {
        var connectivityManager = context.getSystemService(android.content.Context.CONNECTIVITY_SERVICE);
        var networkInfo = connectivityManager.getActiveNetworkInfo();
        STATE.networkAvailable = networkInfo && networkInfo.isConnected();
        return STATE.networkAvailable;
    } catch(e) {
        return true;
    }
}

// ============================================
// SERIAL UTILITIES
// ============================================

function getAndroidId() {
    try {
        var aid = android.provider.Settings.Secure.getString(
            context.getContentResolver(),
            android.provider.Settings.Secure.ANDROID_ID
        );
        return aid ? aid.toUpperCase() : null;
    } catch(e) { 
        return null; 
    }
}

function getDeviceSerial() {
    try {
        var aid = getAndroidId();
        if (aid) return aid;
        
        var bs = android.os.Build.getSerial();
        if (bs && bs !== 'unknown') return 'SER_' + bs.substring(0, 8).toUpperCase();
        
        var uuid = java.util.UUID.randomUUID().toString().replace(/-/g, '').substring(0, 12).toUpperCase();
        return 'DEV_' + uuid;
    } catch(e) {
        return 'DEV_' + Date.now().toString(16).toUpperCase();
    }
}

function getDeviceInfo() {
    try {
        return {
            serial: getDeviceSerial(),
            androidId: getAndroidId(),
            model: android.os.Build.MODEL || 'Unknown',
            brand: android.os.Build.BRAND || 'Unknown',
            manufacturer: android.os.Build.MANUFACTURER || 'Unknown',
            sdk: android.os.Build.VERSION.SDK_INT || 0,
            release: android.os.Build.VERSION.RELEASE || 'Unknown'
        };
    } catch(e) {
        return {
            serial: getDeviceSerial(),
            androidId: null,
            model: 'Unknown',
            brand: 'Unknown',
            manufacturer: 'Unknown',
            sdk: 0,
            release: 'Unknown'
        };
    }
}

function normalizeSerial(s) {
    return s ? s.toString().trim().toUpperCase() : '';
}

// ============================================
// GERENCIAMENTO DE DEVICES
// ============================================

function updateDeviceInfo() {
    try {
        var deviceInfo = getDeviceInfo();
        var serial = deviceInfo.serial;
        
        // Tentar carregar devices existentes
        var devices = {};
        try {
            var stored = storages.create('GBotDevices');
            devices = stored.get('devices') || {};
        } catch(e) {
            devices = {};
        }
        
        // Atualizar informações do dispositivo atual
        devices[serial] = {
            serial: serial,
            androidId: deviceInfo.androidId,
            model: deviceInfo.model,
            brand: deviceInfo.brand,
            manufacturer: deviceInfo.manufacturer,
            sdk: deviceInfo.sdk,
            release: deviceInfo.release,
            lastSeen: new Date().toISOString(),
            firstSeen: devices[serial] ? devices[serial].firstSeen : new Date().toISOString()
        };
        
        // Salvar localmente
        try {
            var stored = storages.create('GBotDevices');
            stored.put('devices', devices);
            stored.put('currentSerial', serial);
            logMsg('💾 Device info salva localmente', 'debug');
        } catch(e) {
            logMsg('⚠️ Erro ao salvar device info: ' + e.message, 'warn');
        }
        
        return devices[serial];
    } catch(e) {
        logMsg('⚠️ Erro ao atualizar device info: ' + e.message, 'warn');
        return null;
    }
}

function checkSerialInDatabase(serial) {
    var checkStart = Date.now();
    
    try {
        var result = fetchJSONWithMetrics(URLS.SERIAL);
        var checkTime = Date.now() - checkStart;
        
        if (result.error || !result.data) {
            return { 
                found: false, 
                status: 'ERROR', 
                error: result.error || 'No data',
                checkTime: checkTime,
                dbLatency: result.latency || 0
            };
        }
        
        var list = result.data.seriais || result.data.s || [];
        var target = normalizeSerial(serial);
        
        if (!target || list.length === 0) {
            return { 
                found: false, 
                status: 'EMPTY',
                checkTime: checkTime,
                dbLatency: result.latency || 0
            };
        }
        
        // Buscar apenas o serial atual
        var found = false;
        var user = null;
        var validity = null;
        
        for (var i = 0; i < list.length; i++) {
            var item = list[i];
            var itemSerial = null;
            
            if (typeof item === 'object') {
                itemSerial = item.serial || item.id || null;
                user = item.nome || item.user || null;
                validity = item.validade || item.expiry || null;
            } else if (Array.isArray(item)) {
                itemSerial = item[1] || null;
                user = item[2] || null;
                validity = item[3] || null;
            }
            
            if (itemSerial && normalizeSerial(itemSerial) === target) {
                found = true;
                break;
            }
        }
        
        STATE.dbLatency = result.latency || 0;
        
        if (!found) {
            return {
                found: false,
                status: 'REVOKED',
                checkTime: checkTime,
                dbLatency: result.latency || 0
            };
        }
        
        var valid = true;
        var days = null;
        
        if (validity) {
            var parts = validity.split('-');
            if (parts.length === 3) {
                var d = new Date(parts[0], parts[1] - 1, parts[2]);
                var diff = d.getTime() - Date.now();
                days = Math.ceil(diff / (1000 * 60 * 60 * 24));
                valid = days >= 0;
            }
        }
        
        return {
            found: true,
            status: valid ? 'VALID' : 'EXPIRED',
            user: user || 'Unknown',
            validity: validity || 'N/A',
            days: days,
            valid: valid,
            checkTime: checkTime,
            dbLatency: result.latency || 0
        };
        
    } catch(e) {
        return {
            found: false,
            status: 'ERROR',
            error: e.message,
            checkTime: Date.now() - checkStart
        };
    }
}

// ============================================
// VERIFICAÇÃO DE SERIAL COM TRACE
// ============================================

function checkSerialWithTrace(serial) {
    var checkStart = Date.now();
    STATE.checks++;
    
    traceSystem.add('SERIAL_CHECK', {
        serial: serial,
        checkNumber: STATE.checks,
        timestamp: checkStart
    });
    
    var result = checkSerialInDatabase(serial);
    result.checkTime = Date.now() - checkStart;
    
    if (result.found && result.valid) {
        traceSystem.add('SERIAL_FOUND', {
            serial: serial,
            user: result.user,
            validity: result.validity,
            days: result.days,
            valid: true,
            checkTime: result.checkTime,
            dbLatency: result.dbLatency
        });
    } else if (!result.found && result.status === 'REVOKED') {
        traceSystem.add('SERIAL_REVOKED', {
            serial: serial,
            checkNumber: STATE.checks,
            checkTime: result.checkTime,
            dbLatency: result.dbLatency || 0,
            totalChecks: STATE.checks
        });
    } else if (result.status === 'ERROR') {
        traceSystem.add('SERIAL_ERROR', {
            serial: serial,
            error: result.error,
            checkTime: result.checkTime
        });
    }
    
    return result;
}

// ============================================
// MONITORAMENTO COM TRACE
// ============================================

function startMonitoring() {
    if (STATE.monitorActive) {
        logMsg('⚠️ Monitor já ativo', 'warn');
        return;
    }
    
    if (STATE.revoked) {
        logMsg('⚠️ Acesso revogado', 'warn');
        return;
    }
    
    STATE.monitorActive = true;
    STATE.fails = 0;
    STATE.checks = 0;
    STATE.startTime = Date.now();
    STATE.detectionTime = 0;
    STATE.firstCheckTime = Date.now();
    
    traceSystem.add('MONITOR_START', {
        interval: CONFIG.INTERVAL,
        serial: STATE.serial,
        startTime: STATE.startTime
    });
    
    logMsg('📡 Monitor iniciado (' + CONFIG.INTERVAL + 'ms)', 'monitor');
    setStatus('🔍 Monitorando...', '#ffaa00');
    
    function monitorLoop() {
        if (!STATE.monitorActive || STATE.revoked) {
            traceSystem.add('MONITOR_STOP', {
                reason: STATE.revoked ? 'REVOKED' : 'MANUAL',
                totalChecks: STATE.checks
            });
            logMsg('⏹️ Monitor interrompido', 'monitor');
            return;
        }
        
        if (!checkNetworkConnection()) {
            logMsg('⚠️ Sem conexão de rede', 'warn');
            setStatus('⚠️ Sem rede', '#ff8800');
            setTimeout(monitorLoop, CONFIG.INTERVAL * 2);
            return;
        }
        
        var checkStart = Date.now();
        var result = checkSerialWithTrace(STATE.serial);
        var checkDuration = Date.now() - checkStart;
        
        STATE.lastCheckResult = result;
        
        if (STATE.checks % 5 === 0 || result.status === 'REVOKED') {
            ui.run(function() {
                try {
                    $('checksText').setText('📊 ' + STATE.checks);
                    $('timeText').setText('⏱️ ' + STATE.detectionTime + 'ms');
                    $('latencyText').setText('📡 ' + STATE.dbLatency + 'ms');
                    
                    if (result.found && result.user) {
                        $('userText').setText('👤 ' + result.user);
                        if (result.days !== null) {
                            $('validityText').setText('📅 ' + result.days + 'd');
                        }
                    }
                } catch(e) {}
            });
        }
        
        if (!result.found && result.status === 'REVOKED') {
            STATE.revoked = true;
            STATE.detectionTime = Date.now() - STATE.startTime;
            STATE.monitorActive = false;
            STATE.permissionGrantedTime = 0;
            
            traceSystem.add('REVOKE_DETECTED', {
                serial: STATE.serial,
                detectionTime: STATE.detectionTime,
                totalChecks: STATE.checks,
                checkDuration: checkDuration,
                dbLatency: result.dbLatency || 0
            });
            
            logMsg('🚫 REVOGADO! ' + STATE.detectionTime + 'ms (' + STATE.checks + ' checks)', 'revoke');
            setStatus('🚫 REVOGADO! ' + STATE.detectionTime + 'ms', '#ff4444');
            
            if (CONFIG.CLEAN_ON_REVOKE) {
                var cleanResult = cleanSystem.cleanAll(false);
                logMsg('🧹 Limpeza: ' + cleanResult.filesDeleted.length + ' arquivos removidos', 'clean');
                traceSystem.add('CLEAN_ON_REVOKE', cleanResult);
            }
            
            killGBot();
            
            var traceData = traceSystem.exportTrace();
            logMsg('📊 Trace: ' + traceData.summary.totalEntries + ' entries', 'info');
            
            ui.run(function() {
                var msg = 
                    '⏱️ Detecção: ' + STATE.detectionTime + 'ms\n' +
                    '📊 Verificações: ' + STATE.checks + '\n' +
                    '🔑 Serial: ' + STATE.serial + '\n' +
                    '📡 Latência DB: ' + STATE.dbLatency + 'ms\n' +
                    '🕐 Primeira verificação: ' + new Date(STATE.firstCheckTime).toLocaleTimeString() + '\n' +
                    '🕐 Revogação: ' + new Date().toLocaleTimeString() + '\n\n' +
                    'O GBot foi encerrado e rastros removidos.';
                
                dialogs.alert('🚫 ACESSO REVOGADO!', msg, function() {
                    $('btnStart').setText('🔄 Reiniciar');
                    $('btnStart').setEnabled(true);
                    
                    dialogs.confirm('Ver Trace?', 'Deseja ver o relatório completo do trace?', 
                        function(yes) {
                            if (yes) {
                                var traceData = traceSystem.exportTrace();
                                var summary = JSON.stringify(traceData.summary, null, 2);
                                dialogs.alert('📊 Relatório Trace', summary);
                            }
                        }
                    );
                });
            });
            
            return;
        }
        
        if (result.found && result.valid) {
            STATE.fails = 0;
            STATE.permissionGrantedTime = Date.now();
            
            if (STATE.checks % 10 === 0) {
                logMsg('✅ #' + STATE.checks + ': ' + result.user + ' (' + (result.days || '∞') + 'd) | DB: ' + result.dbLatency + 'ms', 'ok');
                setStatus('✅ ' + result.user + ' | ' + (result.days || '∞') + 'd', '#00ff00');
            }
        } else if (result.status === 'ERROR') {
            STATE.fails++;
            if (STATE.fails >= CONFIG.MAX_FAILS) {
                logMsg('⚠️ ' + CONFIG.MAX_FAILS + ' falhas consecutivas', 'warn');
                STATE.fails = 0;
            }
        }
        
        setTimeout(monitorLoop, CONFIG.INTERVAL);
    }
    
    setTimeout(monitorLoop, 100);
}

// ============================================
// MATAR GBOT E LIMPAR
// ============================================

function killGBot() {
    logMsg('💀 Matando GBot...', 'kill');
    
    var killed = [];
    try {
        var scripts = engines.all();
        for (var i = 0; i < scripts.length; i++) {
            var script = scripts[i];
            var name = script.getName ? script.getName() : '';
            
            if (name && (name.indexOf('GBot') !== -1 || name.indexOf('Finalizador') !== -1 || name.indexOf('gbot') !== -1)) {
                try {
                    script.forceStop();
                    killed.push(name);
                    logMsg('🔪 Matou: ' + name, 'kill');
                } catch(e) {}
            }
        }
    } catch(e) {}
    
    if (killed.length > 0) {
        logMsg('✅ ' + killed.length + ' processos finalizados', 'ok');
        traceSystem.add('GBOT_KILLED', { processes: killed });
    } else {
        logMsg('ℹ️ Nenhum GBot encontrado', 'info');
    }
    
    STATE.gbotProcess = null;
}

// ============================================
// RESET COMPLETO
// ============================================

function fullReset() {
    logMsg('🔄 Resetando sistema...', 'step');
    
    STATE.running = false;
    STATE.monitorActive = false;
    STATE.revoked = true;
    
    killGBot();
    
    var cleanResult = cleanSystem.fullReset();
    traceSystem.add('FULL_RESET', cleanResult);
    
    logMsg('🧹 Reset completo: ' + (cleanResult.cleaned ? '✅' : '❌'), 'clean');
    logMsg('🗑️ Arquivos removidos: ' + (cleanResult.killed ? '✅' : '❌'), 'clean');
    
    traceSystem.clear();
    
    $('btnStart').setText('🚀 Iniciar');
    $('btnStart').setEnabled(true);
    $('checksText').setText('📊 0');
    $('timeText').setText('⏱️ 0ms');
    $('latencyText').setText('📡 0ms');
    $('userText').setText('👤 ---');
    $('validityText').setText('📅 ---');
    setStatus('✅ Reset completo', '#00ff00');
    
    logMsg('✅ Reset finalizado!', 'ok');
    showToast('🔄 Reset completo!');
    
    return cleanResult;
}

// ============================================
// CARREGAR GBOT (CORRIGIDO)
// ============================================

function loadAndRunGBot() {
    logMsg('📥 Carregando GBot...', 'step');
    setStatus('⏳ Carregando...', '#ffaa00');
    
    try {
        var result = fetchTextWithMetrics(URLS.GBOT);
        var script = result.data;
        
        if (result.error || !script || typeof script !== 'string' || script.length < 100) {
            logMsg('❌ GBot.js vazio ou inválido', 'err');
            return false;
        }
        
        logMsg('✅ GBot.js carregado (' + script.length + ' caracteres)', 'ok');
        
        try {
            var result2 = engines.execScript('GBot Finalizador', script, {
                executionMode: 'ui'
            });
            
            STATE.gbotProcess = result2;
            logMsg('✅ GBot em execução!', 'ok');
            setStatus('✅ GBot ativo!', '#00ff00');
            showToast('🚀 GBot iniciado!');
            
            setTimeout(function() {
                if (!STATE.revoked) {
                    startMonitoring();
                }
            }, 1000);
            
            return true;
        } catch(e) {
            logMsg('❌ Erro ao executar: ' + e.message, 'err');
            return false;
        }
        
    } catch(e) {
        logMsg('❌ Erro ao carregar: ' + e.message, 'err');
        setStatus('❌ Erro na execução', '#ff4444');
        return false;
    }
}

// ============================================
// PROCESSO PRINCIPAL
// ============================================

function startGBot() {
    if (STATE.running) {
        showToast('⏳ Já está rodando!');
        return;
    }
    
    if (STATE.monitorActive) {
        showToast('⏳ Monitor ativo!');
        return;
    }
    
    if (!checkNetworkConnection()) {
        logMsg('❌ Sem conexão de rede', 'err');
        setStatus('❌ Sem rede', '#ff4444');
        showToast('❌ Verifique sua conexão!');
        return;
    }
    
    if (CONFIG.CLEAN_ON_START) {
        logMsg('🧹 Limpando antes de iniciar...', 'clean');
        var cleanResult = cleanSystem.cleanAll(false);
        traceSystem.add('CLEAN_ON_START', cleanResult);
        logMsg('🧹 ' + cleanResult.filesDeleted.length + ' arquivos removidos', 'clean');
    }
    
    STATE.revoked = false;
    STATE.monitorActive = false;
    STATE.running = true;
    STATE.checks = 0;
    STATE.detectionTime = 0;
    STATE.firstCheckTime = 0;
    STATE.permissionGrantedTime = 0;
    
    STATE.serial = getDeviceSerial();
    STATE.androidId = getAndroidId();
    
    // Atualizar informações do dispositivo
    updateDeviceInfo();
    
    traceSystem.add('APP_START', {
        serial: STATE.serial,
        androidId: STATE.androidId,
        timestamp: Date.now()
    });
    
    logMsg('========================================', 'step');
    logMsg('🚀 INICIANDO GBOT', 'step');
    logMsg('🔑 Serial: ' + STATE.serial, 'serial');
    logMsg('📱 Android ID: ' + STATE.androidId, 'debug');
    logMsg('📡 Trace ID: ' + traceSystem.sessionId, 'debug');
    logMsg('========================================', 'step');
    
    $('btnStart').setText('⏳ Iniciando...');
    $('btnStart').setEnabled(false);
    $('serialText').setText('🔑 ' + STATE.serial);
    $('userText').setText('👤 Verificando...');
    
    var result = checkSerialWithTrace(STATE.serial);
    
    if (result.error || !result.found || !result.valid) {
        logMsg('❌ Acesso negado: ' + (result.status || result.error), 'err');
        setStatus('❌ Acesso negado!', '#ff4444');
        showToast('❌ Não autorizado!');
        $('btnStart').setText('🚀 Iniciar');
        $('btnStart').setEnabled(true);
        STATE.running = false;
        
        traceSystem.add('ACCESS_DENIED', {
            serial: STATE.serial,
            status: result.status || 'ERROR',
            error: result.error,
            reason: 'Not authorized'
        });
        return;
    }
    
    STATE.authorized = true;
    STATE.user = result.user;
    STATE.validity = result.validity;
    STATE.days = result.days;
    STATE.permissionGrantedTime = Date.now();
    
    traceSystem.add('ACCESS_GRANTED', {
        serial: STATE.serial,
        user: result.user,
        validity: result.validity,
        days: result.days,
        checkTime: result.checkTime,
        dbLatency: result.dbLatency
    });
    
    logMsg('✅ Autorizado: ' + result.user, 'ok');
    logMsg('📅 Validade: ' + result.validity + ' (' + result.days + 'd)', 'info');
    logMsg('📡 Latência DB: ' + result.dbLatency + 'ms', 'info');
    
    $('userText').setText('👤 ' + result.user);
    $('validityText').setText('📅 ' + result.days + 'd');
    $('latencyText').setText('📡 ' + result.dbLatency + 'ms');
    setStatus('✅ ' + result.user + ' | ' + result.days + 'd', '#00ff00');
    
    var success = loadAndRunGBot();
    
    if (success) {
        $('btnStart').setText('⏳ Monitorando...');
        $('btnStart').setEnabled(true);
    } else {
        $('btnStart').setText('🚀 Tentar Novamente');
        $('btnStart').setEnabled(true);
        STATE.running = false;
    }
}

// ============================================
// UI
// ============================================

ui.layout(
    <vertical bg="#1a1a2e" padding="12">
        <text text="🚀 GBot Launcher" textSize="18" textColor="#00b4d8" textStyle="bold" gravity="center"/>
        <text text="AutoJS6 Compatible v2.2" textSize="11" textColor="#90e0ef" gravity="center" marginBottom="8"/>
        
        <frame bg="#16213e" radius="8" padding="10" marginBottom="8">
            <vertical>
                <text id="statusText" text="✅ Pronto" textSize="14" textColor="#00ff00" gravity="center" marginBottom="4"/>
                <horizontal gravity="center">
                    <text id="serialText" text="🔑 ---" textSize="10" textColor="#888" layout_weight="1" gravity="center"/>
                    <text id="userText" text="👤 ---" textSize="10" textColor="#888" layout_weight="1" gravity="center"/>
                </horizontal>
                <horizontal gravity="center" marginTop="4">
                    <text id="checksText" text="📊 0" textSize="10" textColor="#888" layout_weight="1" gravity="center"/>
                    <text id="timeText" text="⏱️ 0ms" textSize="10" textColor="#888" layout_weight="1" gravity="center"/>
                    <text id="latencyText" text="📡 0ms" textSize="10" textColor="#888" layout_weight="1" gravity="center"/>
                </horizontal>
                <horizontal gravity="center" marginTop="2">
                    <text id="validityText" text="📅 ---" textSize="10" textColor="#888" layout_weight="1" gravity="center"/>
                </horizontal>
            </vertical>
        </frame>
        
        <horizontal marginBottom="6">
            <button id="btnStart" text="🚀 Iniciar" bg="#0077b6" textColor="#ffffff" layout_weight="1" marginRight="4"/>
            <button id="btnReset" text="🔄 Reset" bg="#dc3545" textColor="#ffffff" layout_weight="1" marginLeft="4"/>
        </horizontal>
        
        <frame layout_weight="1" bg="#0a0a1a" radius="6" padding="6" marginBottom="6">
            <vertical>
                <text text="📋 Logs" textSize="9" textColor="#888"/>
                <scroll id="scrollView">
                    <text id="logText" text="Aguardando...\n" textSize="8" textColor="#666"/>
                </scroll>
            </vertical>
        </frame>
        
        <horizontal>
            <button id="btnCopySerial" text="📋 Serial" bg="#6c757d" textColor="#ffffff" layout_weight="1" marginRight="4"/>
            <button id="btnTrace" text="📊 Trace" bg="#6c757d" textColor="#ffffff" layout_weight="1" marginRight="4"/>
            <button id="btnClear" text="🧹 Limpar" bg="#6c757d" textColor="#ffffff" layout_weight="1" marginLeft="4"/>
            <button id="btnExit" text="🚪 Sair" bg="#6c757d" textColor="#ffffff" layout_weight="1" marginLeft="4"/>
        </horizontal>
    </vertical>
);

// ============================================
// EVENTOS
// ============================================

$('btnStart').click(startGBot);

$('btnReset').click(function() {
    dialogs.confirm('Reset Completo?', 'Isso vai matar todos os processos e remover todos os rastros. Continuar?', 
        function(yes) {
            if (yes) {
                fullReset();
            }
        }
    );
});

$('btnCopySerial').click(function() {
    var serial = STATE.serial || getDeviceSerial();
    if (copyToClipboard(serial, 'Device Serial')) {
        logMsg('📋 Serial copiado: ' + serial, 'info');
        showToast('✅ Serial copiado!');
    }
});

$('btnTrace').click(function() {
    var traceData = traceSystem.exportTrace();
    var summary = 
        '📊 RELATÓRIO TRACE\n\n' +
        'Session: ' + traceData.summary.sessionId + '\n' +
        'Duração: ' + (traceData.summary.duration / 1000).toFixed(1) + 's\n' +
        'Total Entries: ' + traceData.summary.totalEntries + '\n' +
        'Serial Checks: ' + traceData.summary.serialChecks + '\n' +
        'Revocações: ' + traceData.summary.revocations + '\n' +
        'DB Updates: ' + traceData.summary.dbUpdates + '\n\n' +
        'Último Serial Check: ' + (traceData.summary.lastSerialCheck ? 
            new Date(traceData.summary.lastSerialCheck.timestamp).toLocaleTimeString() : 'N/A') + '\n' +
        'Última Revocação: ' + (traceData.summary.lastRevocation ? 
            new Date(traceData.summary.lastRevocation.timestamp).toLocaleTimeString() : 'N/A');
    
    dialogs.alert('📊 Trace', summary, function() {
        dialogs.confirm('Exportar Trace?', 'Deseja copiar o trace completo para o clipboard?',
            function(yes) {
                if (yes) {
                    try {
                        var json = JSON.stringify(traceData, null, 2);
                        copyToClipboard(json, 'Trace Export');
                    } catch(e) {
                        showToast('❌ Erro ao exportar');
                    }
                }
            }
        );
    });
});

$('btnClear').click(function() {
    try {
        $('logText').setText('');
        logMsg('🗑️ Logs limpos', 'info');
    } catch(e) {}
});

$('btnExit').click(function() {
    dialogs.confirm('Sair', 'Deseja sair e limpar tudo?', function(yes) {
        if (yes) {
            if (CONFIG.CLEAN_ON_EXIT) {
                fullReset();
            } else {
                killGBot();
                STATE.running = false;
                STATE.monitorActive = false;
            }
            exit();
        }
    });
});

// ============================================
// INICIALIZAÇÃO
// ============================================

try {
    activity.getWindow().setFlags(
        android.view.WindowManager.LayoutParams.FLAG_FULLSCREEN,
        android.view.WindowManager.LayoutParams.FLAG_FULLSCREEN
    );
} catch(e) {}

if (CONFIG.CLEAN_ON_START) {
    cleanSystem.cleanAll(false);
}

STATE.serial = getDeviceSerial();

// Atualizar informações do dispositivo na inicialização
updateDeviceInfo();

logMsg('🚀 GBot Launcher AutoJS6 v2.2', 'info');
logMsg('🔑 Serial: ' + STATE.serial, 'serial');
logMsg('📡 Trace ID: ' + traceSystem.sessionId, 'debug');
logMsg('⚡ Intervalo: ' + CONFIG.INTERVAL + 'ms', 'info');
logMsg('🧹 Sistema de limpeza ativo', 'clean');
logMsg('📌 Clique em "Iniciar" para começar', 'info');

$('serialText').setText('🔑 ' + STATE.serial);
setStatus('✅ Pronto!', '#00ff00');
showToast('🚀 GBot AutoJS6 v2.2 pronto!');