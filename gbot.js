// ============================================
// 🚀 GBot Launcher - AutoJS6
// COM TOKEN INDIVIDUAL PARA GBOT.JS
// ============================================

"ui";

// ============================================
// CONFIGURAÇÕES
// ============================================

var CONFIG = {
    SCRIPT_URL: "https://raw.githubusercontent.com/danielhito102/GBot/main/gbot.js",
    SCRIPT_NAME: "GBot V1 - By Nz",
    CACHE_FILE: "/sdcard/GBot/cache_gbot.js",
    CACHE_DIR: "/sdcard/GBot/",
    WRAPPER_FILE: "/sdcard/GBot/wrapper.js"
};

// ============================================
// TOKEN INDIVIDUAL PARA GBOT.JS
// ============================================

var GH_TOKEN = "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";
var GH_OWNER = "danielhito102";
var GH_REPO = "GBot";

// ============================================
// URLS
// ============================================

var URLS = {
    SCRIPT: "https://raw.githubusercontent.com/" + GH_OWNER + "/" + GH_REPO + "/main/gbot.js",
    SCRIPT_API: "https://api.github.com/repos/" + GH_OWNER + "/" + GH_REPO + "/contents/gbot.js",
    REPO: "https://api.github.com/repos/" + GH_OWNER + "/" + GH_REPO
};

// ============================================
// LOGS
// ============================================

var logs = [];
var maxLogs = 500;

function addLog(msg, tipo) {
    var d = new Date().toLocaleString('pt-BR');
    var icon = "[i]";
    if (tipo === 'ok') icon = "[OK]";
    else if (tipo === 'err') icon = "[ERRO]";
    else if (tipo === 'warn') icon = "[AVISO]";
    else if (tipo === 'debug') icon = "[DEBUG]";
    else if (tipo === 'step') icon = "[PASSO]";
    else if (tipo === 'github') icon = "[GITHUB]";
    
    var entry = "[" + d + "] " + icon + " " + msg + "\n";
    logs.push(entry);
    if (logs.length > maxLogs) logs.splice(0, 80);
    
    try {
        var v = ui.logText;
        if (v) {
            var txt = v.text();
            var lines = txt.split('\n');
            if (lines.length > maxLogs) lines.splice(0, 80);
            lines.push(entry);
            v.setText(lines.join('\n'));
            ui.logScroll.scrollTo(0, v.getHeight());
        }
    } catch(e) {}
    
    try {
        var file = new java.io.File("/sdcard/GBot/launcher_log.txt");
        var writer = new java.io.FileWriter(file, true);
        writer.write(entry);
        writer.close();
    } catch(e) {}
}

// ============================================
// REQUISIÇÃO HTTP
// ============================================

function httpRequest(url, options, callback) {
    var method = options.method || 'GET';
    var headers = options.headers || {};
    var body = options.body || null;
    var timeout = options.timeout || 30000;
    
    threads.start(function() {
        try {
            var response;
            if (method === 'GET') {
                response = http.get(url, { headers: headers, timeout: timeout });
            } else if (method === 'PUT') {
                response = http.request(url, { 
                    method: "PUT", 
                    headers: headers, 
                    body: body,
                    timeout: timeout 
                });
            }
            ui.run(function() { callback(null, response); });
        } catch(e) {
            ui.run(function() { callback(e.message, null); });
        }
    });
}

// ============================================
// TESTAR TOKEN
// ============================================

function testarToken(callback) {
    addLog("🔍 Testando token...", 'github');
    addLog("📝 Token: " + GH_TOKEN.substring(0, 30) + "...", 'debug');
    
    var headers = {
        'User-Agent': 'GBot/1.0',
        'Accept': 'application/vnd.github.v3+json',
        'Authorization': 'token ' + GH_TOKEN
    };
    
    httpRequest(URLS.REPO, { headers: headers, timeout: 10000 }, function(error, response) {
        if (error) {
            addLog("❌ Erro: " + error, 'err');
            if (callback) callback(false);
            return;
        }
        
        if (response.statusCode === 200) {
            addLog("✅ Token válido!", 'ok');
            if (callback) callback(true);
        } else {
            addLog("❌ Status: " + response.statusCode, 'err');
            if (callback) callback(false);
        }
    });
}

// ============================================
// CORRIGIR E EXECUTAR GBOT
// ============================================

function corrigirEExecutar() {
    addLog("📥 Baixando gbot.js...", 'step');
    ui.statusText.setText("Baixando...");
    
    var headers = {
        'User-Agent': 'GBot/1.0',
        'Cache-Control': 'no-cache',
        'Accept': 'application/javascript, text/plain'
    };
    
    httpRequest(URLS.SCRIPT + "?t=" + new Date().getTime(), { headers: headers, timeout: 30000 }, function(error, response) {
        if (error || response.statusCode !== 200) {
            addLog("❌ Erro download: " + (error || response.statusCode), 'err');
            ui.statusText.setText("❌ Erro no download!");
            toast("❌ Erro no download!");
            
            // Tenta cache
            var cached = carregarCache();
            if (cached) {
                addLog("📂 Usando cache...", 'warn');
                executarScript(cached);
            }
            return;
        }
        
        var script = response.body.string();
        addLog("✅ Download OK! " + script.length + " caracteres", 'ok');
        
        // ============================================
        // INJETAR TOKEN INDIVIDUAL
        // ============================================
        
        // Remove tokens antigos
        var scriptCorrigido = script;
        scriptCorrigido = scriptCorrigido.replace(/var A = "github_pat_[^"]*";/g, '');
        scriptCorrigido = scriptCorrigido.replace(/var GH_TOKEN = "github_pat_[^"]*";/g, '');
        scriptCorrigido = scriptCorrigido.replace(/github_pat_[^"]*/g, '');
        
        // Adiciona token individual
        var header = '';
        header += '// ============================================\n';
        header += '// TOKEN INDIVIDUAL - GBOT.JS\n';
        header += '// ============================================\n';
        header += 'var A = "' + GH_TOKEN + '";\n';
        header += 'var GH_TOKEN = "' + GH_TOKEN + '";\n';
        header += 'var OWNER = "' + GH_OWNER + '";\n';
        header += 'var REPO = "' + GH_REPO + '";\n';
        header += '// ============================================\n\n';
        
        // Remove "ui" duplicado
        if (scriptCorrigido.indexOf('"ui"') === 0) {
            scriptCorrigido = scriptCorrigido.substring(scriptCorrigido.indexOf('\n') + 1);
        }
        
        var scriptFinal = '"ui";\n\n' + header + scriptCorrigido;
        
        // Verifica injeção
        if (scriptFinal.indexOf(GH_TOKEN) !== -1) {
            addLog("✅ Token individual injetado!", 'ok');
        } else {
            addLog("⚠️ Token não injetado, tentando método alternativo...", 'warn');
            scriptFinal = '"ui";\n\nvar A = "' + GH_TOKEN + '";\nvar GH_TOKEN = "' + GH_TOKEN + '";\n\n' + script;
        }
        
        // Salva cache
        try {
            var dir = new java.io.File(CONFIG.CACHE_DIR);
            if (!dir.exists()) dir.mkdirs();
            
            var cacheFile = new java.io.File(CONFIG.CACHE_FILE);
            var cacheWriter = new java.io.FileWriter(cacheFile);
            cacheWriter.write(scriptFinal);
            cacheWriter.close();
            addLog("💾 Cache salvo", 'ok');
        } catch(e) {
            addLog("⚠️ Erro cache: " + e.message, 'warn');
        }
        
        executarScript(scriptFinal);
    });
}

// ============================================
// EXECUTAR SCRIPT
// ============================================

function executarScript(script) {
    if (!script) {
        addLog("❌ Script vazio!", 'err');
        toast("Script vazio!");
        return;
    }
    
    ui.statusText.setText("Executando GBot...");
    addLog("🚀 Executando GBot com token individual...", 'step');
    
    try {
        // Tenta executar diretamente
        var engine = engines.execScript(CONFIG.SCRIPT_NAME, script);
        addLog("✅ GBot em execução!", 'ok');
        toast("GBot V1 iniciado!");
        ui.statusText.setText("✅ GBot em execução!");
    } catch(e) {
        addLog("❌ Erro executar: " + e.message, 'err');
        ui.statusText.setText("❌ Erro: " + e.message);
        toast("❌ Erro ao executar!");
        
        // Tenta via arquivo
        try {
            addLog("🔄 Tentando via arquivo...", 'warn');
            var wrapperFile = new java.io.File(CONFIG.WRAPPER_FILE);
            var writer = new java.io.FileWriter(wrapperFile);
            writer.write(script);
            writer.close();
            
            engines.execScriptFile(CONFIG.WRAPPER_FILE);
            addLog("✅ GBot executado via arquivo!", 'ok');
            toast("GBot V1 iniciado!");
            ui.statusText.setText("✅ GBot em execução!");
        } catch(e2) {
            addLog("❌ Erro alternativo: " + e2.message, 'err');
            ui.statusText.setText("❌ Erro: " + e2.message);
            toast("❌ Erro ao executar!");
        }
    }
}

// ============================================
// CARREGAR CACHE
// ============================================

function carregarCache() {
    try {
        var file = new java.io.File(CONFIG.CACHE_FILE);
        if (file.exists()) {
            var reader = new java.io.BufferedReader(new java.io.FileReader(file));
            var content = "";
            var line;
            while ((line = reader.readLine()) !== null) {
                content += line + "\n";
            }
            reader.close();
            return content;
        }
    } catch(e) {}
    return null;
}

// ============================================
// INICIAR
// ============================================

function iniciar() {
    addLog("========================================", 'debug');
    addLog("🚀 INICIANDO - TOKEN INDIVIDUAL", 'step');
    addLog("========================================", 'debug');
    addLog("📝 Token: " + GH_TOKEN.substring(0, 30) + "...", 'debug');
    addLog("📦 Repo: " + GH_OWNER + "/" + GH_REPO, 'debug');
    
    ui.statusText.setText("Testando token...");
    
    testarToken(function(ok) {
        if (!ok) {
            ui.statusText.setText("❌ Token inválido!");
            addLog("❌ TOKEN INVÁLIDO!", 'err');
            toast("❌ Token inválido!");
            return;
        }
        
        addLog("✅ Token válido!", 'ok');
        corrigirEExecutar();
    });
}

// ============================================
// COPIAR LOG
// ============================================

function copiarLog() {
    if (logs.length === 0) {
        toast("Nenhum log!");
        return;
    }
    
    var texto = "=== LOG ===\n\n";
    for (var i = 0; i < logs.length; i++) {
        texto += logs[i];
    }
    
    try {
        var cb = context.getSystemService(android.content.Context.CLIPBOARD_SERVICE);
        cb.setPrimaryClip(android.content.ClipData.newPlainText("Log", texto));
        toast("Log copiado!");
    } catch(e) {
        toast("Erro ao copiar!");
    }
}

// ============================================
// UI
// ============================================

ui.layout(
    <vertical bg="#1a1a2e" padding="8">
        <text text="GBot Launcher" textSize="18" textColor="#00b4d8" textStyle="bold" gravity="center"/>
        <text text="Token Individual" textSize="10" textColor="#90e0ef" gravity="center" marginBottom="8"/>
        
        <frame bg="#16213e" radius="6" padding="8" marginBottom="6">
            <vertical>
                <text id="statusText" text="Clique em Iniciar" textSize="10" textColor="#caf0f8" gravity="center"/>
                <text id="infoText" text="Token: Individual" textSize="8" textColor="#888" gravity="center" marginTop="2"/>
            </vertical>
        </frame>
        
        <horizontal marginBottom="4">
            <button id="btnRun" text="Iniciar" bg="#0077b6" textColor="#ffffff" layout_weight="0.33" marginRight="2"/>
            <button id="btnTest" text="Testar" bg="#2a2a4a" textColor="#ffffff" layout_weight="0.33" marginLeft="2" marginRight="2"/>
            <button id="btnLog" text="Log" bg="#2a2a4a" textColor="#ffffff" layout_weight="0.33" marginLeft="2"/>
        </horizontal>
        
        <frame layout_weight="1" bg="#0a0a1a" radius="4" padding="4">
            <vertical>
                <text text="Log" textSize="8" textColor="#888" marginBottom="2"/>
                <scroll id="logScroll">
                    <text id="logText" text="Aguardando...\n" textSize="7" textColor="#8888ff" lineSpacing="1.5"/>
                </scroll>
            </vertical>
        </frame>
        
        <button id="btnSair" text="Sair" bg="#6c757d" textColor="#ffffff" marginTop="4"/>
    </vertical>
);

// ============================================
// EVENTOS
// ============================================

ui.btnRun.click(function() { iniciar(); });

ui.btnTest.click(function() {
    addLog("🔍 Testando token...", 'step');
    ui.statusText.setText("Testando...");
    testarToken(function(ok) {
        if (ok) {
            ui.statusText.setText("✅ Token OK!");
            toast("✅ Token válido!");
        } else {
            ui.statusText.setText("❌ Token inválido!");
            toast("❌ Token inválido!");
        }
    });
});

ui.btnLog.click(function() { copiarLog(); });

ui.btnSair.click(function() {
    if (dialogs.confirm("Sair", "Deseja sair?")) {
        addLog("👋 Saindo...", 'step');
        setTimeout(function() { exit(); }, 500);
    }
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

try { device.keepScreenOn(); } catch(e) {}

addLog("========================================", 'debug');
addLog("🚀 GBot Launcher - Token Individual", 'step');
addLog("📱 AutoJS6 - " + new Date().toLocaleString('pt-BR'), 'debug');
addLog("📝 Token: " + GH_TOKEN.substring(0, 30) + "...", 'debug');
addLog("========================================", 'debug');

ui.infoText.setText("Token: " + GH_TOKEN.substring(0, 15) + "...");
ui.statusText.setText("Clique em Iniciar");

addLog("✅ Launcher pronto!", 'ok');
toast("GBot Launcher - Token Individual!");
