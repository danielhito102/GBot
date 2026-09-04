// ============================================
// 🚀 GBot Launcher - AutoJS6
// VERSÃO CORRIGIDA - SEM NetworkOnMainThreadException
// ============================================

"ui";

// ============================================
// CONFIGURAÇÕES
// ============================================

var GITHUB_TOKEN = "";
var OWNER = "danielhito102";
var REPO = "GBot";

// URLs
var URL_SERIAL_RAW = "https://raw.githubusercontent.com/" + OWNER + "/" + REPO + "/main/seriais.json";
var URL_SERIAL_API = "https://api.github.com/repos/" + OWNER + "/" + REPO + "/contents/seriais.json";
var URL_DEVICES_RAW = "https://raw.githubusercontent.com/" + OWNER + "/" + REPO + "/main/devices.json";
var URL_DEVICES_API = "https://api.github.com/repos/" + OWNER + "/" + REPO + "/contents/devices.json";
var URL_REGISTRO_RAW = "https://raw.githubusercontent.com/" + OWNER + "/" + REPO + "/main/registro.json";
var URL_REGISTRO_API = "https://api.github.com/repos/" + OWNER + "/" + REPO + "/contents/registro.json";
var URL_GBOT_RAW = "https://raw.githubusercontent.com/" + OWNER + "/" + REPO + "/main/GBot.js";

// ============================================
// CONFIGURAÇÕES DE MONITORAMENTO
// ============================================

var MONITOR_INTERVALO = 500;
var TIMEOUT_REQ = 5000;
var MAX_FALHAS = 3;

// ============================================
// ESTADO
// ============================================

var st = {
    serial: null,
    serialOriginal: null,
    androidId: null,
    autorizado: false,
    user: null,
    validade: null,
    dias: null,
    executando: false,
    trace: [],
    seriaisLista: [],
    dadosSeriais: null,
    monitorAtivo: false,
    threadMonitor: null,
    falhasConsecutivas: 0,
    ultimoSHA: null,
    dadosCache: null,
    revogado: false,
    gbotProcesso: null
};

// ============================================
// FUNÇÃO DE SLEEP
// ============================================

function sleep(ms) {
    try {
        if (typeof threads !== 'undefined' && threads.sleep) {
            threads.sleep(ms);
        } else {
            java.lang.Thread.sleep(ms);
        }
    } catch(e) {
        var start = Date.now();
        while (Date.now() - start < ms) {}
    }
}

// ============================================
// LOGS
// ============================================

function log(m, t) {
    var d = new Date().toLocaleString('pt-BR');
    var ic = "[i]";
    if (t === 'ok') ic = "[OK]";
    else if (t === 'err') ic = "[ERRO]";
    else if (t === 'warn') ic = "[AVISO]";
    else if (t === 'step') ic = "[PASSO]";
    else if (t === 'debug') ic = "[DEBUG]";
    else if (t === 'info') ic = "[INFO]";
    else if (t === 'serial') ic = "[SERIAL]";
    else if (t === 'security') ic = "[🔒SEG]";
    else if (t === 'monitor') ic = "[📡MON]";
    else if (t === 'revoke') ic = "[🚫REV]";
    else if (t === 'kill') ic = "[💀KILL]";
    else if (t === 'sha') ic = "[🔑SHA]";
    
    var e = "[" + d + "] " + ic + " " + m + "\n";
    st.trace.push(e);
    if (st.trace.length > 500) st.trace.splice(0, 100);
    
    try {
        var v = ui.logText;
        if (v) {
            var txt = v.text();
            var lines = txt.split('\n');
            if (lines.length > 500) lines.splice(0, 100);
            lines.push(e);
            v.setText(lines.join('\n'));
            ui.scrollView.scrollTo(0, v.getHeight());
        }
    } catch(e) {}
}

function status(msg, cor) {
    try { 
        ui.statusText.setText(msg);
        ui.statusText.setTextColor(colors.parseColor(cor || "#caf0f8"));
    } catch(e) {}
}

// ============================================
// REQUISIÇÃO SEGURA (SEMPRE EM THREAD)
// ============================================

function httpGetAsync(url, headers, callback) {
    threads.start(function() {
        try {
            var response = http.get(url, { 
                headers: headers || {}, 
                timeout: TIMEOUT_REQ 
            });
            ui.run(function() { 
                callback(null, response); 
            });
        } catch(e) {
            ui.run(function() { 
                callback(e.message, null); 
            });
        }
    });
}

function httpHeadAsync(url, headers, callback) {
    threads.start(function() {
        try {
            var response = http.request(url, { 
                method: "HEAD", 
                headers: headers || {},
                timeout: TIMEOUT_REQ 
            });
            ui.run(function() { 
                callback(null, response); 
            });
        } catch(e) {
            ui.run(function() { 
                callback(e.message, null); 
            });
        }
    });
}

// ============================================
// SERIAL
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

function normalizarSerial(serial) {
    if (!serial) return "";
    return serial.toString().trim().toUpperCase();
}

function getSerial() {
    log("🔍 Obtendo serial...", 'serial');
    var serial = null;
    var androidId = getAndroidId();
    st.androidId = androidId;
    
    if (androidId) {
        serial = androidId;
        log("📱 Android ID: " + serial, 'debug');
    }
    
    if (!serial) {
        try {
            var bs = android.os.Build.getSerial();
            if (bs && bs.length > 0 && bs !== "unknown") {
                serial = "SER_" + bs.substring(0, 8).toUpperCase();
                log("📱 Build Serial: " + serial, 'debug');
            }
        } catch(e) {}
    }
    
    if (!serial) {
        var u = java.util.UUID.randomUUID().toString().replace(/-/g, "").substring(0, 12).toUpperCase();
        serial = "DEV_" + u;
        log("⚠️ UUID fallback: " + serial, 'warn');
    }
    
    serial = serial.toUpperCase();
    st.serialOriginal = serial;
    log("🔑 Serial final: " + serial, 'serial');
    return serial;
}

// ============================================
// BUSCAR SERIAIS (ASSÍNCRONO)
// ============================================

function buscarSeriais(callback) {
    log("📡 Buscando seriais.json...", 'step');
    
    httpGetAsync(URL_SERIAL_RAW, { 'User-Agent': 'GBot/1.0' }, function(err, response) {
        if (err || !response || response.statusCode !== 200) {
            log("❌ Falha ao baixar seriais.json!", 'err');
            callback(null, "Erro ao baixar");
            return;
        }
        
        try {
            var dados = JSON.parse(response.body.string());
            callback(dados, null);
        } catch(e) {
            log("❌ Erro ao parsear JSON: " + e.message, 'err');
            callback(null, "Erro no JSON");
        }
    });
}

// ============================================
// VERIFICAÇÃO DE SERIAL
// ============================================

function verificarSerial(callback) {
    log("========================================", 'security');
    log("🔐 VERIFICANDO AUTORIZAÇÃO", 'security');
    log("========================================", 'security');
    
    st.serial = getSerial();
    ui.serialText.setText("🔑 " + st.serial);
    
    buscarSeriais(function(dados, erro) {
        if (erro || !dados) {
            log("❌ Falha: " + (erro || "Dados não encontrados"), 'err');
            callback(false, erro);
            return;
        }
        
        processarSeriais(dados, callback);
    });
}

function processarSeriais(dados, callback) {
    var lista = dados.seriais || dados.s || [];
    
    if (lista.length === 0) {
        log("⚠️ Lista de seriais vazia!", 'warn');
        if (callback) callback(false, "Lista vazia");
        return;
    }
    
    log("📊 " + lista.length + " seriais encontrados", 'info');
    st.seriaisLista = lista;
    st.dadosCache = dados;
    
    var serialLocal = normalizarSerial(st.serial);
    log("🔍 Buscando: " + serialLocal, 'security');
    
    var encontrado = false;
    var usuario = null;
    var validade = null;
    
    for (var i = 0; i < lista.length; i++) {
        var item = lista[i];
        var serialGit = null;
        var nome = null;
        var val = null;
        
        if (typeof item === 'object' && item !== null) {
            serialGit = item.serial || null;
            nome = item.nome || null;
            val = item.validade || null;
        } else if (Array.isArray(item)) {
            serialGit = item[1] || null;
            nome = item[2] || null;
            val = item[3] || null;
        }
        
        if (serialGit) {
            var serialGitNorm = normalizarSerial(serialGit);
            log("📌 Comparando: " + serialGitNorm + " == " + serialLocal, 'debug');
            
            if (serialGitNorm === serialLocal) {
                encontrado = true;
                usuario = nome || "Usuário";
                validade = val || null;
                log("✅ SERIAL ENCONTRADO!", 'ok');
                log("👤 Usuário: " + usuario, 'info');
                break;
            }
        }
    }
    
    if (!encontrado) {
        log("❌ SERIAL NÃO ENCONTRADO!", 'revoke');
        log("💡 Serial do dispositivo: " + serialLocal, 'security');
        log("📝 Seriais disponíveis:", 'debug');
        for (var i = 0; i < lista.length; i++) {
            var item = lista[i];
            var serialGit = (typeof item === 'object') ? item.serial : (Array.isArray(item) ? item[1] : null);
            if (serialGit) {
                log("   - " + normalizarSerial(serialGit), 'debug');
            }
        }
        if (callback) callback(false, "Serial não autorizado");
        return;
    }
    
    if (validade) {
        try {
            var f = new java.text.SimpleDateFormat("yyyy-MM-dd");
            var dt = f.parse(validade);
            var diff = dt.getTime() - new Date().getTime();
            var dias = Math.ceil(diff / (1000 * 60 * 60 * 24));
            st.dias = dias;
            log("📅 Validade: " + validade + " (" + dias + " dias)", 'info');
            
            if (dias < 0) {
                log("🚫 SERIAL EXPIRADO!", 'revoke');
                if (callback) callback(false, "Serial expirado");
                return;
            }
        } catch(e) {
            log("⚠️ Erro ao validar data", 'warn');
        }
    }
    
    st.autorizado = true;
    st.user = usuario;
    st.validade = validade;
    ui.userText.setText("👤 " + st.user);
    status("✅ Autorizado: " + st.user, "#00ff00");
    
    log("✅ DISPOSITIVO AUTORIZADO!", 'ok');
    if (callback) callback(true, null);
}

// ============================================
// MONITORAMENTO
// ============================================

function iniciarMonitoramento() {
    if (st.monitorAtivo) {
        log("⚠️ Monitor já ativo", 'warn');
        return;
    }
    
    if (st.revogado) {
        log("⚠️ Acesso revogado", 'warn');
        return;
    }
    
    log("========================================", 'monitor');
    log("🚀 INICIANDO MONITOR", 'monitor');
    log("⚡ Intervalo: " + MONITOR_INTERVALO + "ms", 'monitor');
    log("========================================", 'monitor');
    
    st.monitorAtivo = true;
    var falhas = 0;
    var contador = 0;
    var ultimoSerialVerificado = null;
    
    st.threadMonitor = threads.start(function() {
        while (st.monitorAtivo && !st.revogado) {
            try {
                var inicio = Date.now();
                contador++;
                
                // Verifica serial no GitHub
                httpGetAsync(URL_SERIAL_RAW, { 'User-Agent': 'GBot/1.0' }, function(err, response) {
                    if (err || !response || response.statusCode !== 200) {
                        falhas++;
                        log("⚠️ Falha " + falhas + "/" + MAX_FALHAS, 'monitor');
                        if (falhas >= MAX_FALHAS) {
                            log("🚨 Muitas falhas!", 'monitor');
                            // Não revoga por falha de rede, apenas alerta
                            falhas = 0;
                        }
                        return;
                    }
                    
                    try {
                        var dados = JSON.parse(response.body.string());
                        var lista = dados.seriais || dados.s || [];
                        var serialLocal = normalizarSerial(st.serial);
                        var encontrado = false;
                        
                        for (var i = 0; i < lista.length; i++) {
                            var item = lista[i];
                            var serialGit = (typeof item === 'object') ? item.serial : (Array.isArray(item) ? item[1] : null);
                            if (serialGit && normalizarSerial(serialGit) === serialLocal) {
                                encontrado = true;
                                break;
                            }
                        }
                        
                        if (!encontrado) {
                            log("🚨 SERIAL REMOVIDO!", 'revoke');
                            ui.run(function() {
                                revogarAcesso("Serial removido do GitHub");
                            });
                            return;
                        }
                        
                        falhas = 0;
                        if (contador % 10 === 0) {
                            log("📡 Monitor OK (" + contador + ")", 'monitor');
                        }
                        
                    } catch(e) {
                        log("⚠️ Erro no monitor: " + e.message, 'monitor');
                    }
                });
                
                var elapsed = Date.now() - inicio;
                var waitTime = Math.max(0, MONITOR_INTERVALO - elapsed);
                if (waitTime > 0) {
                    sleep(waitTime);
                }
                
            } catch(e) {
                log("❌ Erro: " + e.message, 'monitor');
                sleep(1000);
            }
        }
    });
    
    log("✅ Monitor iniciado!", 'monitor');
}

// ============================================
// REVOGAÇÃO
// ============================================

function revogarAcesso(motivo) {
    if (st.revogado) return;
    st.revogado = true;
    
    log("========================================", 'revoke');
    log("🚫 REVOGANDO ACESSO!", 'revoke');
    log("📝 Motivo: " + motivo, 'revoke');
    log("========================================", 'revoke');
    
    st.autorizado = false;
    st.monitorAtivo = false;
    
    if (st.threadMonitor) {
        try { st.threadMonitor.interrupt(); } catch(e) {}
        st.threadMonitor = null;
    }
    
    try {
        var scripts = engines.all();
        for (var i = 0; i < scripts.length; i++) {
            if (scripts[i].getName && scripts[i].getName().indexOf("GBot") !== -1) {
                log("🔪 Matando: " + scripts[i].getName(), 'kill');
                scripts[i].forceStop();
            }
        }
    } catch(e) {}
    
    ui.run(function() {
        status("🚫 ACESSO REVOGADO!", "#ff4444");
        ui.serialText.setText("🔑 " + st.serial + " 🚫");
        ui.userText.setText("👤 ACESSO NEGADO");
        ui.btnIniciar.setEnabled(true);
        ui.btnIniciar.setText("🚀 Reiniciar");
    });
    
    toast("🚫 ACESSO REVOGADO!");
    
    try {
        dialogs.alert("🚫 Acesso Revogado!", 
            "Motivo: " + motivo + "\n" +
            "Serial: " + st.serial + "\n" +
            "Data: " + new Date().toLocaleString('pt-BR'),
            function() { exit(); }
        );
    } catch(e) {
        sleep(3000);
        exit();
    }
}

// ============================================
// REGISTROS
// ============================================

function getDeviceInfo() {
    var info = { modelo: "N/A", android: "N/A", ip: "N/A" };
    try { info.modelo = android.os.Build.MODEL || "N/A"; } catch(e) {}
    try { info.android = android.os.Build.VERSION.RELEASE || "N/A"; } catch(e) {}
    try {
        var wifi = context.getSystemService(android.content.Context.WIFI_SERVICE);
        var ip = wifi.getConnectionInfo().getIpAddress();
        if (ip) info.ip = (ip & 0xFF) + "." + ((ip >> 8) & 0xFF) + "." + ((ip >> 16) & 0xFF) + "." + ((ip >> 24) & 0xFF);
    } catch(e) {}
    return info;
}

function registrarDevice(cb) {
    log("📡 Registrando...", 'step');
    var info = getDeviceInfo();
    
    httpGetAsync(URL_DEVICES_RAW, { 'User-Agent': 'GBot/1.0' }, function(e, r) {
        var devices = [];
        if (!e && r && r.statusCode === 200) {
            try { devices = JSON.parse(r.body.string()).devices || []; } catch(e) {}
        }
        
        var exists = false;
        for (var i = 0; i < devices.length; i++) {
            if (devices[i].serial === st.serial) {
                exists = true;
                devices[i].ultimo_acesso = new Date().toISOString();
                break;
            }
        }
        
        if (!exists) {
            devices.push({
                serial: st.serial,
                androidId: st.androidId,
                modelo: info.modelo,
                usuario: st.user || "N/A",
                data_registro: new Date().toISOString(),
                ativo: true
            });
        }
        
        try {
            var jc = JSON.stringify({ devices: devices }, null, 2);
            var enc = android.util.Base64.encodeToString(new java.lang.String(jc).getBytes("UTF-8"), android.util.Base64.NO_WRAP);
            var p = { message: "Auto update", content: enc, branch: "main" };
            var headers = { 'User-Agent': 'GBot/1.0', 'Accept': 'application/vnd.github.v3+json', 'Authorization': 'token ' + GITHUB_TOKEN, 'Content-Type': 'application/json' };
            
            threads.start(function() {
                try {
                    var response = http.put(URL_DEVICES_API, JSON.stringify(p), { headers: headers, timeout: TIMEOUT_REQ });
                    if (response && (response.statusCode === 200 || response.statusCode === 201)) {
                        log("✅ devices.json atualizado", 'ok');
                        if (cb) cb(true);
                    } else {
                        log("⚠️ Falha devices.json", 'warn');
                        if (cb) cb(false);
                    }
                } catch(e) {
                    log("⚠️ Erro: " + e.message, 'warn');
                    if (cb) cb(false);
                }
            });
        } catch(e) {
            log("⚠️ Erro: " + e.message, 'warn');
            if (cb) cb(false);
        }
    });
}

// ============================================
// CARREGAR E EXECUTAR GBOT
// ============================================

function carregarEExecutarGBot() {
    log("📥 Carregando GBot.js...", 'step');
    
    httpGetAsync(URL_GBOT_RAW, { 'User-Agent': 'GBot/1.0' }, function(e, r) {
        if (e || !r || r.statusCode !== 200) {
            log("❌ Falha ao carregar GBot.js!", 'err');
            return;
        }
        
        var script = r.body.string();
        if (!script || script.length < 100) {
            log("❌ Script inválido!", 'err');
            return;
        }
        
        log("✅ GBot.js carregado! " + script.length + " caracteres", 'ok');
        
        try {
            var tempFile = "/sdcard/gbot_temp.js";
            var writer = new java.io.FileWriter(tempFile);
            writer.write(script);
            writer.close();
            
            log("🚀 Executando GBot...", 'step');
            engines.execScriptFile(tempFile, { 
                name: "GBot Finalizador", 
                executionMode: "ui" 
            });
            
            log("✅ GBot executado!", 'ok');
            status("✅ GBot iniciado! Monitorando", "#00ff00");
            toast("🚀 GBot iniciado!");
            
            setTimeout(function() { 
                if (!st.revogado) {
                    iniciarMonitoramento();
                }
            }, 1000);
            
        } catch(e) {
            log("❌ Erro ao executar: " + e.message, 'err');
            try {
                eval(script);
                log("✅ Executado com eval!", 'ok');
                setTimeout(function() { 
                    if (!st.revogado) {
                        iniciarMonitoramento();
                    }
                }, 1000);
            } catch(e2) {
                log("❌ Erro no eval: " + e2.message, 'err');
            }
        }
    });
}

// ============================================
// COPIAR LOG
// ============================================

function copiarLogCompleto() {
    try {
        var info = getDeviceInfo();
        var agora = new Date();
        
        var logCompleto = "";
        logCompleto += "═══════════════════════════════════════════════════════\n";
        logCompleto += "              📋 GBOT LAUNCHER - LOG COMPLETO           \n";
        logCompleto += "═══════════════════════════════════════════════════════\n\n";
        
        logCompleto += "📌 INFORMAÇÕES DO SISTEMA\n";
        logCompleto += "───────────────────────────────────────────────────────\n";
        logCompleto += "  📅 Data/Hora: " + agora.toLocaleString('pt-BR') + "\n";
        logCompleto += "  📱 Serial: " + (st.serial || "N/A") + "\n";
        logCompleto += "  🔑 Android ID: " + (st.androidId || "N/A") + "\n";
        logCompleto += "  👤 Usuário: " + (st.user || "N/A") + "\n";
        logCompleto += "  ✅ Autorizado: " + (st.autorizado ? "SIM" : "NÃO") + "\n";
        logCompleto += "  📡 Monitor: " + (st.monitorAtivo ? "ATIVO" : "INATIVO") + "\n";
        logCompleto += "  🚫 Revogado: " + (st.revogado ? "SIM" : "NÃO") + "\n";
        logCompleto += "  📊 Seriais na Lista: " + st.seriaisLista.length + "\n";
        logCompleto += "  📱 Modelo: " + (info.modelo || "N/A") + "\n";
        logCompleto += "  🤖 Android: " + (info.android || "N/A") + "\n";
        logCompleto += "  🌐 IP: " + (info.ip || "N/A") + "\n\n";
        
        logCompleto += "📌 LISTA DE SERIAIS (GitHub)\n";
        logCompleto += "───────────────────────────────────────────────────────\n";
        if (st.seriaisLista.length > 0) {
            for (var i = 0; i < st.seriaisLista.length; i++) {
                var item = st.seriaisLista[i];
                var serial = (typeof item === 'object') ? item.serial : (Array.isArray(item) ? item[1] : null);
                var nome = (typeof item === 'object') ? item.nome : (Array.isArray(item) ? item[2] : null);
                var validade = (typeof item === 'object') ? item.validade : (Array.isArray(item) ? item[3] : null);
                if (serial) {
                    var ativo = (normalizarSerial(serial) === normalizarSerial(st.serial)) ? " ◄ ATUAL" : "";
                    logCompleto += "  " + (i+1) + ". " + serial + " | " + (nome || "N/A") + " | " + (validade || "N/A") + ativo + "\n";
                }
            }
        } else {
            logCompleto += "  ⚠️ Nenhum serial encontrado\n";
        }
        logCompleto += "\n";
        
        logCompleto += "📌 LOG DE EXECUÇÃO (" + st.trace.length + " linhas)\n";
        logCompleto += "───────────────────────────────────────────────────────\n";
        if (st.trace.length > 0) {
            for (var i = 0; i < st.trace.length; i++) {
                logCompleto += st.trace[i];
            }
        } else {
            logCompleto += "  ⚠️ Nenhum log disponível\n";
        }
        
        logCompleto += "\n═══════════════════════════════════════════════════════\n";
        logCompleto += "  📋 Log gerado em: " + agora.toLocaleString('pt-BR') + "\n";
        logCompleto += "═══════════════════════════════════════════════════════\n";
        
        var clipboard = context.getSystemService(android.content.Context.CLIPBOARD_SERVICE);
        clipboard.setPrimaryClip(android.content.ClipData.newPlainText("GBot Log", logCompleto));
        
        var tamanhoKB = Math.round(logCompleto.length / 1024);
        toast("✅ Log copiado! (" + tamanhoKB + " KB, " + st.trace.length + " linhas)");
        status("📋 Log copiado!", "#00ff00");
        log("📋 Log completo copiado (" + tamanhoKB + " KB)", 'info');
        
    } catch(e) {
        log("❌ Erro ao copiar log: " + e.message, 'err');
        toast("❌ Erro ao copiar log!");
    }
}

// ============================================
// PROCESSO PRINCIPAL
// ============================================

function iniciar() {
    if (st.executando) return;
    if (st.monitorAtivo) {
        toast("⏳ Monitor já ativo!");
        return;
    }
    
    st.revogado = false;
    st.executando = true;
    ui.btnIniciar.setEnabled(false);
    ui.btnIniciar.setText("⏳ Verificando...");
    
    verificarSerial(function(autorizado, motivo) {
        if (!autorizado) {
            log("❌ Acesso negado: " + motivo, 'err');
            status("❌ Acesso negado!", "#ff4444");
            toast("❌ Não autorizado!");
            ui.btnIniciar.setEnabled(true);
            ui.btnIniciar.setText("🚀 Iniciar GBot");
            st.executando = false;
            return;
        }
        
        registrarDevice(function() {});
        carregarEExecutarGBot();
        
        ui.btnIniciar.setText("⏳ Monitorando");
        ui.btnIniciar.setEnabled(true);
        st.executando = false;
    });
}

// ============================================
// UI
// ============================================

ui.layout(
    <vertical bg="#1a1a2e" padding="16">
        <text text="🔐 GBot Launcher" textSize="22" textColor="#00b4d8" textStyle="bold" gravity="center"/>
        <text text="Monitor" textSize="11" textColor="#90e0ef" gravity="center" marginBottom="12"/>
        
        <frame bg="#16213e" radius="8" padding="12" marginBottom="8">
            <vertical>
                <horizontal gravity="center" marginBottom="8">
                    <text id="statusText" text="⏳ Aguardando..." textSize="12" textColor="#caf0f8" layout_weight="1" gravity="center"/>
                    <button id="btnCopiarLog" text="📋" bg="#2a2a4a" textColor="#ffffff" w="30" h="30" textSize="11"/>
                </horizontal>
                <text id="serialText" text="🔑 Serial: Aguardando..." textSize="10" textColor="#888" gravity="center" marginBottom="4"/>
                <text id="userText" text="👤 Usuário: N/A" textSize="10" textColor="#888" gravity="center"/>
            </vertical>
        </frame>
        
        <button id="btnIniciar" text="🚀 Iniciar GBot" bg="#0077b6" textColor="#ffffff" marginBottom="8"/>
        
        <frame layout_weight="1" bg="#0a0a1a" radius="6" padding="6">
            <vertical>
                <horizontal marginBottom="4">
                    <text text="🐛 Debug" textSize="9" textColor="#888" layout_weight="1"/>
                    <text id="logCount" text="0 linhas" textSize="8" textColor="#555"/>
                </horizontal>
                <scroll id="scrollView">
                    <text id="logText" text="Aguardando...\n" textSize="8" textColor="#666"/>
                </scroll>
            </vertical>
        </frame>
        
        <button id="btnSair" text="🚪 Sair" bg="#6c757d" textColor="#ffffff" marginTop="6"/>
    </vertical>
);

// ============================================
// EVENTOS
// ============================================

ui.btnIniciar.click(function() { 
    if (st.monitorAtivo) {
        toast("⏳ Monitor já ativo!");
        return;
    }
    if (st.revogado) {
        st.revogado = false;
    }
    iniciar(); 
});

ui.btnCopiarLog.click(function() { 
    copiarLogCompleto(); 
});

ui.btnSair.click(function() {
    if (dialogs.confirm("Sair", "Deseja sair?")) {
        st.monitorAtivo = false;
        st.revogado = true;
        if (st.threadMonitor) try { st.threadMonitor.interrupt(); } catch(e) {}
        exit();
    }
});

// ============================================
// INICIALIZAÇÃO
// ============================================

try { activity.getWindow().setFlags(android.view.WindowManager.LayoutParams.FLAG_FULLSCREEN, android.view.WindowManager.LayoutParams.FLAG_FULLSCREEN); } catch(e) {}
try { device.keepScreenOn(); } catch(e) {}

var serialTemp = getSerial();
ui.serialText.setText("🔑 " + serialTemp);

log("========================================", 'step');
log("🔐 GBot Launcher pronto!", 'step');
log("📱 Serial: " + serialTemp, 'info');
log("========================================", 'step');
status("✅ Clique em 'Iniciar GBot'", "#00ff00");
toast("🔐 GBot Launcher pronto!");