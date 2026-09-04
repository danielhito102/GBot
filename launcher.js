// ============================================
// 🚀 GBot Launcher - AutoJS6
// VERSÃO COM ATUALIZAÇÃO OBRIGATÓRIA
// ============================================

"ui";

// ============================================
// CONFIGURAÇÕES
// ============================================

// VERSÃO ATUAL DO LAUNCHER (ATUALIZE QUANDO MUDAR)
var VERSAO_ATUAL = "2.0.0";

// Configurações do GitHub
var GITHUB_TOKEN = "";
var OWNER = "danielhito102";
var REPO = "GBot";

// URLs
var URL_LAUNCHER_RAW = "https://raw.githubusercontent.com/" + OWNER + "/" + REPO + "/main/launcher.js";
var URL_LAUNCHER_API = "https://api.github.com/repos/" + OWNER + "/" + REPO + "/contents/launcher.js";
var URL_SERIAL_RAW = "https://raw.githubusercontent.com/" + OWNER + "/" + REPO + "/main/seriais.json";
var URL_SERIAL_API = "https://api.github.com/repos/" + OWNER + "/" + REPO + "/contents/seriais.json";
var URL_DEVICES_RAW = "https://raw.githubusercontent.com/" + OWNER + "/" + REPO + "/main/devices.json";
var URL_DEVICES_API = "https://api.github.com/repos/" + OWNER + "/" + REPO + "/contents/devices.json";
var URL_REGISTRO_RAW = "https://raw.githubusercontent.com/" + OWNER + "/" + REPO + "/main/registro.json";
var URL_REGISTRO_API = "https://api.github.com/repos/" + OWNER + "/" + REPO + "/contents/registro.json";
var URL_GBOT_RAW = "https://raw.githubusercontent.com/" + OWNER + "/" + REPO + "/main/GBot.js";
var URL_VERSAO_RAW = "https://raw.githubusercontent.com/" + OWNER + "/" + REPO + "/main/version.json";

// ============================================
// CONFIGURAÇÕES
// ============================================

var MONITOR_INTERVALO = 500;
var TIMEOUT_REQ = 5000;
var MAX_FALHAS = 3;
var CHECK_UPDATE_INTERVAL = 10000; // 10 segundos (mais frequente para updates obrigatórios)

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
    threadUpdate: null,
    falhasConsecutivas: 0,
    ultimoSHA: null,
    dadosCache: null,
    revogado: false,
    gbotProcesso: null,
    token: null,
    tokenExpiracao: null,
    hashLauncher: null,
    atualizacaoPendente: false, // Flag para impedir execução
    atualizando: false
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
    else if (t === 'update') ic = "[🔄UPDATE]";
    else if (t === 'token') ic = "[🔐TOKEN]";
    else if (t === 'force') ic = "[⚠️FORÇADO]";
    
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
// 1️⃣ SISTEMA DE TOKEN ROTATIVO
// ============================================

function gerarToken() {
    try {
        var data = new Date().toISOString().split('T')[0];
        var hora = new Date().getHours();
        var base = st.serial + data + hora + "GBOT_SALT_2026_SECURE";
        
        var md = java.security.MessageDigest.getInstance("SHA-256");
        var bytes = md.digest(new java.lang.String(base).getBytes("UTF-8"));
        var token = "";
        for (var i = 0; i < bytes.length; i++) {
            var hex = java.lang.Integer.toHexString(bytes[i] & 0xFF);
            if (hex.length() === 1) hex = "0" + hex;
            token += hex;
        }
        token = token.substring(0, 32).toUpperCase();
        
        st.token = token;
        st.tokenExpiracao = new Date().getTime() + (60 * 60 * 1000);
        
        log("🔐 Token gerado: " + token.substring(0, 8) + "****", 'token');
        return token;
    } catch(e) {
        log("❌ Erro ao gerar token: " + e.message, 'err');
        return null;
    }
}

function validarToken(token) {
    if (!token) return false;
    if (!st.token) return false;
    if (st.tokenExpiracao && new Date().getTime() > st.tokenExpiracao) {
        log("⏰ Token expirado", 'token');
        return false;
    }
    return token === st.token;
}

function renovarToken() {
    var novoToken = gerarToken();
    log("🔄 Token renovado", 'token');
    return novoToken;
}

// ============================================
// 2️⃣ VALIDAÇÃO DE INTEGRIDADE (SHA-256)
// ============================================

function calcularSHA256(conteudo) {
    try {
        var md = java.security.MessageDigest.getInstance("SHA-256");
        var bytes = md.digest(new java.lang.String(conteudo).getBytes("UTF-8"));
        var hash = "";
        for (var i = 0; i < bytes.length; i++) {
            var hex = java.lang.Integer.toHexString(bytes[i] & 0xFF);
            if (hex.length() === 1) hex = "0" + hex;
            hash += hex;
        }
        return hash.toUpperCase();
    } catch(e) {
        log("❌ Erro ao calcular SHA: " + e.message, 'err');
        return null;
    }
}

function validarIntegridade(conteudo, hashEsperado) {
    if (!conteudo || !hashEsperado) {
        log("⚠️ Dados insuficientes", 'warn');
        return false;
    }
    
    var hashCalculado = calcularSHA256(conteudo);
    if (!hashCalculado) return false;
    
    var valido = hashCalculado === hashEsperado.toUpperCase();
    
    if (valido) {
        log("✅ Integridade verificada (SHA-256)", 'security');
    } else {
        log("❌ INTEGRIDADE COMPROMETIDA!", 'security');
    }
    
    return valido;
}

// ============================================
// 3️⃣ AUTO UPDATE OBRIGATÓRIO
// ============================================

function verificarVersao(callback) {
    log("🔄 Verificando atualizações...", 'update');
    
    httpGetAsync(URL_VERSAO_RAW, { 'User-Agent': 'GBot/1.0' }, function(err, response) {
        if (err || !response || response.statusCode !== 200) {
            log("⚠️ Falha ao verificar versão", 'update');
            if (callback) callback(null, "Erro na requisição");
            return;
        }
        
        try {
            var data = JSON.parse(response.body.string());
            var versaoGitHub = data.versao || "0.0.0";
            var hashLauncher = data.hash || null;
            var changelog = data.changelog || "N/A";
            var obrigatorio = data.obrigatorio !== undefined ? data.obrigatorio : true; // Agora sempre obrigatório
            
            log("📌 Versão GitHub: " + versaoGitHub, 'update');
            log("📌 Versão Local: " + VERSAO_ATUAL, 'update');
            
            st.hashLauncher = hashLauncher;
            
            var atualizacaoDisponivel = compararVersoes(VERSAO_ATUAL, versaoGitHub) < 0;
            
            if (atualizacaoDisponivel) {
                st.atualizacaoPendente = true;
                log("⚠️ ATUALIZAÇÃO OBRIGATÓRIA DISPONÍVEL!", 'force');
                log("📝 Changelog: " + changelog, 'update');
            } else {
                st.atualizacaoPendente = false;
            }
            
            if (callback) callback({
                versaoAtual: VERSAO_ATUAL,
                versaoGitHub: versaoGitHub,
                hash: hashLauncher,
                changelog: changelog,
                obrigatorio: true,
                atualizacaoDisponivel: atualizacaoDisponivel
            }, null);
            
        } catch(e) {
            log("❌ Erro ao parsear version.json: " + e.message, 'err');
            if (callback) callback(null, "Erro no JSON");
        }
    });
}

function compararVersoes(v1, v2) {
    var p1 = v1.split('.').map(Number);
    var p2 = v2.split('.').map(Number);
    
    for (var i = 0; i < Math.max(p1.length, p2.length); i++) {
        var n1 = p1[i] || 0;
        var n2 = p2[i] || 0;
        if (n1 < n2) return -1;
        if (n1 > n2) return 1;
    }
    return 0;
}

function baixarAtualizacao(callback) {
    log("📥 Baixando nova versão do Launcher...", 'update');
    status("⏳ Baixando atualização obrigatória...", "#ffaa00");
    
    httpGetAsync(URL_LAUNCHER_RAW, { 'User-Agent': 'GBot/1.0' }, function(err, response) {
        if (err || !response || response.statusCode !== 200) {
            log("❌ Falha ao baixar atualização!", 'update');
            if (callback) callback(null, "Erro no download");
            return;
        }
        
        var script = response.body.string();
        
        if (!script || script.length < 100) {
            log("❌ Script baixado é inválido!", 'update');
            if (callback) callback(null, "Script inválido");
            return;
        }
        
        if (st.hashLauncher) {
            if (!validarIntegridade(script, st.hashLauncher)) {
                log("❌ Falha na validação de integridade!", 'update');
                if (callback) callback(null, "Falha na integridade");
                return;
            }
        }
        
        log("✅ Atualização baixada! " + script.length + " caracteres", 'update');
        if (callback) callback(script, null);
    });
}

function aplicarAtualizacao(script) {
    if (!script) {
        log("❌ Script vazio", 'update');
        return;
    }
    
    if (st.atualizando) {
        log("⚠️ Atualização já em andamento", 'update');
        return;
    }
    
    st.atualizando = true;
    
    log("🔄 Aplicando atualização obrigatória...", 'update');
    status("⏳ Atualizando Launcher...", "#ffaa00");
    
    try {
        var tempFile = "/sdcard/launcher_update.js";
        var writer = new java.io.FileWriter(tempFile);
        writer.write(script);
        writer.close();
        
        log("📁 Arquivo salvo: " + tempFile, 'update');
        
        if (st.hashLauncher) {
            if (!validarIntegridade(script, st.hashLauncher)) {
                log("❌ Arquivo corrompido!", 'update');
                toast("❌ Falha na integridade!");
                st.atualizando = false;
                return;
            }
        }
        
        // Para o monitor atual
        st.monitorAtivo = false;
        if (st.threadMonitor) {
            try { st.threadMonitor.interrupt(); } catch(e) {}
            st.threadMonitor = null;
        }
        if (st.threadUpdate) {
            try { st.threadUpdate.interrupt(); } catch(e) {}
            st.threadUpdate = null;
        }
        
        log("🚀 Executando novo Launcher...", 'update');
        status("🔄 Reiniciando com nova versão...", "#ffaa00");
        
        var mainFile = "/sdcard/launcher_main.js";
        var writer2 = new java.io.FileWriter(mainFile);
        writer2.write(script);
        writer2.close();
        
        engines.execScriptFile(mainFile, {
            name: "GBot Launcher v" + VERSAO_ATUAL,
            executionMode: "ui"
        });
        
        log("✅ Atualização aplicada com sucesso!", 'update');
        status("✅ Launcher atualizado!", "#00ff00");
        toast("🔄 Launcher atualizado! Reiniciando...");
        
        sleep(2000);
        exit();
        
    } catch(e) {
        log("❌ Erro ao aplicar: " + e.message, 'err');
        status("❌ Falha na atualização!", "#ff4444");
        toast("❌ Erro ao atualizar!");
        st.atualizando = false;
    }
}

// ============================================
// VERIFICADOR DE UPDATE OBRIGATÓRIO (BACKGROUND)
// ============================================

function iniciarVerificadorUpdateObrigatorio() {
    if (st.threadUpdate) {
        log("⚠️ Verificador já está rodando", 'update');
        return;
    }
    
    log("========================================", 'update');
    log("⚠️ INICIANDO VERIFICADOR OBRIGATÓRIO", 'force');
    log("⏱️ Intervalo: " + (CHECK_UPDATE_INTERVAL/1000) + "s", 'update');
    log("🔒 Atualizações são OBRIGATÓRIAS", 'force');
    log("========================================", 'update');
    
    st.threadUpdate = threads.start(function() {
        var primeiroCheck = true;
        
        while (true) {
            try {
                sleep(CHECK_UPDATE_INTERVAL);
                
                ui.run(function() {
                    // Verifica versão
                    verificarVersao(function(info, erro) {
                        if (erro || !info) {
                            log("⚠️ Falha ao verificar versão", 'update');
                            return;
                        }
                        
                        if (info.atualizacaoDisponivel) {
                            log("🆕 NOVA VERSÃO OBRIGATÓRIA: " + info.versaoGitHub, 'force');
                            log("📝 Changelog: " + info.changelog, 'update');
                            
                            // Desabilita o botão iniciar
                            ui.run(function() {
                                ui.btnIniciar.setEnabled(false);
                                ui.btnIniciar.setText("⏳ Atualizando...");
                            });
                            
                            // Mostra diálogo bloqueante
                            dialogs.build({
                                title: "⚠️ ATUALIZAÇÃO OBRIGATÓRIA!",
                                content: "Uma nova versão do Launcher está disponível!\n\n" +
                                         "📌 Versão atual: " + VERSAO_ATUAL + "\n" +
                                         "🆕 Nova versão: " + info.versaoGitHub + "\n" +
                                         "📝 Changelog: " + info.changelog + "\n\n" +
                                         "🔒 A atualização é OBRIGATÓRIA para continuar.\n" +
                                         "O Launcher será reiniciado automaticamente.",
                                positive: "ATUALIZAR AGORA",
                                cancelable: false // Não permite cancelar
                            }).on("positive", function() {
                                baixarEAtualizarObrigatorio();
                            }).show();
                            
                        } else {
                            if (primeiroCheck) {
                                log("✅ Launcher atualizado (v" + VERSAO_ATUAL + ")", 'update');
                                primeiroCheck = false;
                                
                                // Habilita o botão iniciar se estiver atualizado
                                ui.run(function() {
                                    if (!st.monitorAtivo && !st.revogado) {
                                        ui.btnIniciar.setEnabled(true);
                                        ui.btnIniciar.setText("🚀 Iniciar GBot");
                                    }
                                });
                            }
                        }
                    });
                });
                
            } catch(e) {
                log("❌ Erro no verificador: " + e.message, 'update');
                sleep(5000);
            }
        }
    });
    
    log("✅ Verificador obrigatório iniciado!", 'update');
}

function baixarEAtualizarObrigatorio() {
    log("📥 Baixando atualização obrigatória...", 'force');
    status("⏳ Baixando nova versão obrigatória...", "#ffaa00");
    
    baixarAtualizacao(function(script, erro) {
        if (erro || !script) {
            log("❌ Falha ao baixar: " + erro, 'update');
            toast("❌ Falha ao atualizar!");
            status("❌ Falha na atualização!", "#ff4444");
            
            // Tenta novamente após 5 segundos
            sleep(5000);
            baixarEAtualizarObrigatorio();
            return;
        }
        
        aplicarAtualizacao(script);
    });
}

// ============================================
// REQUISIÇÃO ASSÍNCRONA
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
    
    gerarToken();
    
    return serial;
}

// ============================================
// BUSCAR SERIAIS
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
    
    // Verifica se há atualização pendente
    if (st.atualizacaoPendente) {
        log("⚠️ Atualização pendente, monitor não inicia", 'update');
        status("⚠️ Atualize o Launcher primeiro!", "#ff4444");
        return;
    }
    
    log("========================================", 'monitor');
    log("🚀 INICIANDO MONITOR", 'monitor');
    log("⚡ Intervalo: " + MONITOR_INTERVALO + "ms", 'monitor');
    log("========================================", 'monitor');
    
    st.monitorAtivo = true;
    var falhas = 0;
    var contador = 0;
    
    st.threadMonitor = threads.start(function() {
        while (st.monitorAtivo && !st.revogado) {
            try {
                var inicio = Date.now();
                contador++;
                
                httpGetAsync(URL_SERIAL_RAW, { 'User-Agent': 'GBot/1.0' }, function(err, response) {
                    if (err || !response || response.statusCode !== 200) {
                        falhas++;
                        if (falhas >= MAX_FALHAS) {
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
                        
                        if (st.tokenExpiracao && new Date().getTime() > st.tokenExpiracao - 300000) {
                            renovarToken();
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
    if (st.threadUpdate) {
        try { st.threadUpdate.interrupt(); } catch(e) {}
        st.threadUpdate = null;
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
// VERIFICAR ATUALIZAÇÃO MANUAL
// ============================================

function verificarUpdateManual() {
    log("🔄 Verificando atualizações manualmente...", 'update');
    status("⏳ Verificando...", "#ffaa00");
    
    verificarVersao(function(info, erro) {
        if (erro || !info) {
            log("❌ Falha ao verificar versão", 'update');
            toast("❌ Falha ao verificar!");
            status("❌ Erro na verificação", "#ff4444");
            return;
        }
        
        if (info.atualizacaoDisponivel) {
            dialogs.build({
                title: "⚠️ ATUALIZAÇÃO OBRIGATÓRIA!",
                content: "Uma nova versão do Launcher está disponível!\n\n" +
                         "📌 Versão atual: " + VERSAO_ATUAL + "\n" +
                         "🆕 Nova versão: " + info.versaoGitHub + "\n" +
                         "📝 Changelog: " + info.changelog + "\n\n" +
                         "🔒 A atualização é OBRIGATÓRIA.",
                positive: "ATUALIZAR AGORA",
                cancelable: false
            }).on("positive", function() {
                baixarEAtualizarObrigatorio();
            }).show();
        } else {
            toast("✅ Launcher está atualizado (v" + VERSAO_ATUAL + ")");
            status("✅ Atualizado!", "#00ff00");
        }
    });
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

// ============================================
// CARREGAR E EXECUTAR GBOT
// ============================================

function carregarEExecutarGBot() {
    // Verifica se há atualização pendente
    if (st.atualizacaoPendente) {
        log("⚠️ Atualização pendente! Execute a atualização primeiro.", 'force');
        status("⚠️ Atualize o Launcher!", "#ff4444");
        toast("⚠️ Atualização obrigatória pendente!");
        return;
    }
    
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
                if (!st.revogado && !st.atualizacaoPendente) {
                    iniciarMonitoramento();
                }
            }, 1000);
            
        } catch(e) {
            log("❌ Erro ao executar: " + e.message, 'err');
            try {
                eval(script);
                log("✅ Executado com eval!", 'ok');
                setTimeout(function() { 
                    if (!st.revogado && !st.atualizacaoPendente) {
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
        logCompleto += "  🌐 IP: " + (info.ip || "N/A") + "\n";
        logCompleto += "  🔐 Token: " + (st.token ? st.token.substring(0, 8) + "****" : "N/A") + "\n";
        logCompleto += "  📌 Versão Launcher: " + VERSAO_ATUAL + "\n";
        logCompleto += "  ⚠️ Atualização Pendente: " + (st.atualizacaoPendente ? "SIM" : "NÃO") + "\n\n";
        
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
        logCompleto += "  🔧 GBot Launcher v" + VERSAO_ATUAL + " (Atualização Obrigatória)\n";
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
    
    // Verifica se há atualização pendente
    if (st.atualizacaoPendente) {
        log("⚠️ Atualização pendente! Atualize o Launcher primeiro.", 'force');
        status("⚠️ Atualização obrigatória pendente!", "#ff4444");
        toast("⚠️ Atualize o Launcher primeiro!");
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
        <text text={ "v" + VERSAO_ATUAL + " - Atualização Obrigatória" } textSize="11" textColor="#ff6b6b" gravity="center" marginBottom="12"/>
        
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
        
        <horizontal marginBottom="8">
            <button id="btnIniciar" text="🚀 Iniciar GBot" bg="#0077b6" textColor="#ffffff" layout_weight="0.7" marginRight="4"/>
            <button id="btnUpdate" text="🔄" bg="#ff6b6b" textColor="#ffffff" layout_weight="0.3" textSize="16"/>
        </horizontal>
        
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

ui.btnUpdate.click(function() { 
    verificarUpdateManual(); 
});

ui.btnCopiarLog.click(function() { 
    copiarLogCompleto(); 
});

ui.btnSair.click(function() {
    if (dialogs.confirm("Sair", "Deseja sair?")) {
        st.monitorAtivo = false;
        st.revogado = true;
        if (st.threadMonitor) try { st.threadMonitor.interrupt(); } catch(e) {}
        if (st.threadUpdate) try { st.threadUpdate.interrupt(); } catch(e) {}
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
log("🔐 GBot Launcher v" + VERSAO_ATUAL + " pronto!", 'step');
log("⚠️ ATUALIZAÇÕES SÃO OBRIGATÓRIAS", 'force');
log("📱 Serial: " + serialTemp, 'info');
log("🔐 Token: " + (st.token ? st.token.substring(0, 8) + "****" : "N/A"), 'token');
log("🔄 Auto Update Obrigatório: ATIVO", 'update');
log("========================================", 'step');

// Verifica atualização imediatamente ao iniciar
status("⏳ Verificando atualizações obrigatórias...", "#ffaa00");
verificarVersao(function(info, erro) {
    if (erro || !info) {
        log("⚠️ Falha na verificação inicial", 'update');
        status("✅ Clique em 'Iniciar GBot'", "#00ff00");
        return;
    }
    
    if (info.atualizacaoDisponivel) {
        log("⚠️ ATUALIZAÇÃO OBRIGATÓRIA DISPONÍVEL!", 'force');
        status("⚠️ Atualização obrigatória disponível!", "#ff4444");
        
        // Desabilita o botão iniciar
        ui.btnIniciar.setEnabled(false);
        ui.btnIniciar.setText("⏳ Atualize!");
        
        dialogs.build({
            title: "⚠️ ATUALIZAÇÃO OBRIGATÓRIA!",
            content: "Uma nova versão do Launcher está disponível!\n\n" +
                     "📌 Versão atual: " + VERSAO_ATUAL + "\n" +
                     "🆕 Nova versão: " + info.versaoGitHub + "\n" +
                     "📝 Changelog: " + info.changelog + "\n\n" +
                     "🔒 A atualização é OBRIGATÓRIA para continuar.",
            positive: "ATUALIZAR AGORA",
            cancelable: false
        }).on("positive", function() {
            baixarEAtualizarObrigatorio();
        }).show();
    } else {
        log("✅ Launcher atualizado (v" + VERSAO_ATUAL + ")", 'update');
        status("✅ Clique em 'Iniciar GBot'", "#00ff00");
        ui.btnIniciar.setEnabled(true);
        ui.btnIniciar.setText("🚀 Iniciar GBot");
    }
});

// Inicia o verificador em background
iniciarVerificadorUpdateObrigatorio();

toast("🔐 GBot Launcher v" + VERSAO_ATUAL + " - Atualização Obrigatória");