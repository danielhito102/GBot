// ============================================
// 🚗 GBot V1 - By Nz
// COM MONITORAMENTO CONTÍNUO DE AUTORIZAÇÃO
// ============================================

"ui";

// ============================================
// CONFIGURAÇÕES
// ============================================

var A = "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";
var B = "danielhito102";
var C = "GBot";

var D = "https://api.github.com/repos/" + B + "/" + C + "/contents/seriais.json";
var E = "https://api.github.com/repos/" + B + "/" + C + "/contents/devices.json";
var F = "https://api.github.com/repos/" + B + "/" + C;

var G = "https://api.giross.com.br/api/provider/oauth/token";
var H = "https://api.giross.com.br/api/provider/refresh/fmc_token";
var I = "https://api.giross.com.br/api/provider/trip/";
var J = "eubcB-jeSluQalzx0sSzXV:APA91bHoLVECLtPNxNxxNkN_17hj66HYduxf-2ludzzavkdrnNwWuYcR2RAIVbDJz7mTzw5jqrrybrHZ3krcqMzqjf6xsSWWoIGbi3xYxIzaZl9IwSFhtrQ";

// ============================================
// ESTADO
// ============================================

var K = {
    a: null, b: null, c: null, d: null, e: null, f: null,
    g: null, h: null, i: false, j: false, k: null, l: null,
    m: null, n: [], o: null, p: [], q: null, r: false,
    monitorAtivo: false, verificando: false, ultimaVerif: null
};

// ============================================
// INTERVALO DE MONITORAMENTO (30 SEGUNDOS)
// ============================================

var MONITOR_INTERVALO = 30000;

// ============================================
// FUNÇÕES
// ============================================

var L = {
    _: function(m, t) {
        var d = new Date().toLocaleString('pt-BR');
        var x = "[i]";
        if (t === 'ok') x = "[OK]";
        else if (t === 'err') x = "[ERRO]";
        else if (t === 'warn') x = "[AVISO]";
        else if (t === 'user') x = "[USER]";
        else if (t === 'renew') x = "[RENEW]";
        else if (t === 'test') x = "[TESTE]";
        else if (t === 'monitor') x = "[MONITOR]";
        else if (t === 'revoke') x = "[REVOGADO]";
        
        m = m.replace(/\b\d{11}\b/g, "***.***.***-**");
        m = m.replace(/Bearer\s+[a-zA-Z0-9._-]+/g, "Bearer ***");
        
        var e = "[" + d + "] " + x + " " + m + "\n";
        K.p.push(e);
        if (K.p.length > 300) K.p.splice(0, 80);
        
        try {
            var v = ui.a1;
            if (v) {
                var t = v.text();
                var l = t.split('\n');
                if (l.length > 300) l.splice(0, 80);
                l.push(e);
                v.setText(l.join('\n'));
                ui.a2.scrollTo(0, v.getHeight());
            }
        } catch(e) {}
    },
    
    _1: function(u, m, d, h, cb) {
        threads.start(function() {
            try {
                var r;
                if (m === 'GET') {
                    r = http.get(u, { headers: h, timeout: 30000 });
                } else if (m === 'POST') {
                    r = http.post(u, d, { headers: h, timeout: 30000 });
                } else if (m === 'PUT') {
                    var b = typeof d === 'string' ? d : JSON.stringify(d);
                    r = http.request(u, { method: "PUT", headers: h, body: b, timeout: 30000 });
                }
                ui.run(function() { if (cb) cb(null, r); });
            } catch(e) {
                L._("Erro: " + e.message, 'err');
                ui.run(function() { if (cb) cb(e.message, null); });
            }
        });
    },
    
    _2: function() {
        var x = null;
        try {
            var t = context.getSystemService(android.content.Context.TELEPHONY_SERVICE);
            if (t) {
                var y = t.getDeviceId();
                if (y && y.length > 0 && y !== "unknown" && y !== "000000000000000") x = y;
            }
        } catch(e) {}
        
        if (!x) {
            try {
                var z = android.provider.Settings.Secure.getString(context.getContentResolver(), android.provider.Settings.Secure.ANDROID_ID);
                if (z && z.length > 0) x = z;
            } catch(e) {}
        }
        
        if (!x) {
            try {
                var w = android.os.Build.getSerial();
                if (w && w.length > 0 && w !== "unknown") x = w;
            } catch(e) {}
        }
        
        if (!x) {
            var v = java.util.UUID.randomUUID().toString().replace(/-/g, "").toUpperCase();
            x = v;
        }
        
        try {
            var m = java.security.MessageDigest.getInstance("MD5");
            var h = m.digest(new java.lang.String(x + "GBotFixo2024").getBytes());
            var r = "";
            for (var i = 0; i < h.length; i++) {
                var hex = java.lang.Integer.toHexString(h[i] & 0xFF);
                if (hex.length() === 1) hex = "0" + hex;
                r += hex;
            }
            K.h = x;
            return r.toUpperCase();
        } catch(e) {
            K.h = x;
            return x.toUpperCase();
        }
    },
    
    _3: function() {
        try {
            var w = context.getSystemService(android.content.Context.WIFI_SERVICE);
            var ip = w.getConnectionInfo().getIpAddress();
            if (ip) {
                return (ip & 0xFF) + "." + ((ip >> 8) & 0xFF) + "." + 
                       ((ip >> 16) & 0xFF) + "." + ((ip >> 24) & 0xFF);
            }
        } catch(e) {}
        return "N/A";
    },
    
    _4: function() {
        try { return android.os.Build.MODEL || "N/A"; } catch(e) { return "N/A"; }
    },
    
    _5: function(d) {
        try {
            var f = new java.text.SimpleDateFormat("yyyy-MM-dd");
            var dt = f.parse(d);
            var o = new java.text.SimpleDateFormat("dd/MM/yyyy");
            return o.format(dt);
        } catch(e) { return d; }
    },
    
    _6: function(d) {
        try {
            var f = new java.text.SimpleDateFormat("yyyy-MM-dd");
            var dt = f.parse(d);
            var diff = dt.getTime() - new Date().getTime();
            return Math.ceil(diff / (1000 * 60 * 60 * 24));
        } catch(e) { return null; }
    },
    
    _7: function(o) {
        if (typeof o === 'string') return o;
        if (o === null || o === undefined) return "";
        if (o.toString) return o.toString();
        return String(o);
    },
    
    _8: function(u, cb) {
        var h = { 'User-Agent': 'GBot/1.0', 'Accept': 'application/vnd.github.v3+json', 'Authorization': 'token ' + A };
        L._1(u, 'GET', null, h, function(e, r) {
            if (e || !r || r.statusCode === 404 || r.statusCode !== 200) { cb(null, null); return; }
            try {
                var d = r.body.json();
                if (!d || !d.content) { cb(null, null); return; }
                var dec = android.util.Base64.decode(d.content, android.util.Base64.DEFAULT);
                var js = new java.lang.String(dec, "UTF-8");
                var s = L._7(js);
                if (s && s.length > 0) { cb(d, s); } else { cb(null, null); }
            } catch(e) { cb(null, null); }
        });
    },
    
    _9: function(u, c, s, cb) {
        var sc = L._7(c);
        var bytes = new java.lang.String(sc).getBytes("UTF-8");
        var enc = android.util.Base64.encodeToString(bytes, android.util.Base64.NO_WRAP);
        var p = { message: "Auto update", content: enc, branch: "main" };
        if (s && typeof s === 'string' && s.length > 0) p.sha = s;
        var h = { 'User-Agent': 'GBot/1.0', 'Accept': 'application/vnd.github.v3+json', 'Authorization': 'token ' + A, 'Content-Type': 'application/json' };
        var ps = JSON.stringify(p);
        L._1(u, 'PUT', ps, h, function(e, r) {
            if (e || !r || (r.statusCode !== 200 && r.statusCode !== 201)) {
                if (r && r.statusCode === 422) {
                    L._8(u, function(d, c) {
                        if (d && d.sha) {
                            var np = p; np.sha = d.sha; var nps = JSON.stringify(np);
                            L._1(u, 'PUT', nps, h, function(e2, r2) {
                                if (cb) cb(!e2 && r2 && (r2.statusCode === 200 || r2.statusCode === 201));
                            });
                        } else { if (cb) cb(false); }
                    });
                } else { if (cb) cb(false); }
            } else { if (cb) cb(true); }
        });
    },
    
    _10: function(cb) {
        var h = { 'User-Agent': 'GBot/1.0', 'Accept': 'application/vnd.github.v3+json', 'Authorization': 'token ' + A };
        L._1(F, 'GET', null, h, function(e, r) {
            if (e || !r || r.statusCode !== 200) { if (cb) cb(false); return; }
            try { var d = r.body.json(); if (cb) cb(true); } catch(e) { if (cb) cb(false); }
        });
    },
    
    _11: function(cb) {
        L._8(E, function(d, c) {
            var dev = []; var sha = null;
            if (d && c && typeof c === 'string' && c.length > 0) {
                try { var p = JSON.parse(c); dev = p.devices || []; sha = d.sha; } catch(e) {}
            }
            var ex = false;
            for (var i = 0; i < dev.length; i++) {
                if (dev[i].serial === K.g) {
                    ex = true;
                    dev[i].ultimo_acesso = new Date().toISOString();
                    dev[i].ip = L._3();
                    dev[i].ativo = true;
                    break;
                }
            }
            if (!ex) {
                dev.push({
                    serial: K.g, serialOriginal: K.h, modelo: L._4(),
                    ip: L._3(), data_registro: new Date().toISOString(),
                    ultimo_acesso: new Date().toISOString(), ativo: true
                });
            }
            var jc = JSON.stringify({ devices: dev }, null, 2);
            L._9(E, jc, sha, function(s) { if (cb) cb(s); });
        });
    },
    
    // ============================================
    // VERIFICAÇÃO DE AUTORIZAÇÃO - CORAÇÃO DO SISTEMA
    // ============================================
    
    _24: function(cb) {
        if (K.verificando) {
            if (cb) cb(false);
            return;
        }
        K.verificando = true;
        K.ultimaVerif = new Date().toLocaleString('pt-BR');
        
        L._8(D, function(d2, c2) {
            K.verificando = false;
            if (!c2) {
                if (cb) cb(false);
                return;
            }
            try {
                var json = c2.trim();
                if (json.charCodeAt(0) === 0xFEFF) json = json.substring(1);
                var data = JSON.parse(json);
                var list = data.seriais || data.s || [];
                var cur = K.g.toLowerCase();
                var found = false;
                var userData = null;
                
                for (var i = 0; i < list.length; i++) {
                    var item = list[i];
                    var serial = item.serial || (item.length >= 2 ? item[1] : null);
                    if (serial) {
                        var norm = serial.toString().trim().toLowerCase();
                        if (norm === cur) {
                            found = true;
                            userData = {
                                nome: item.nome || (item.length >= 3 ? item[2] : "Usuario"),
                                validade: item.validade || (item.length >= 4 ? item[3] : null)
                            };
                            break;
                        }
                    }
                }
                
                // Se estava autorizado e agora não está mais
                if (K.i && !found) {
                    L._("🚫 SERIAL REVOGADO! Acesso removido.", 'revoke');
                    L._25("Serial removido da lista de autorizados");
                    if (cb) cb(false);
                    return;
                }
                
                // Se não estava autorizado e agora está
                if (!K.i && found) {
                    L._("✅ Serial autorizado novamente!", 'ok');
                    K.i = true;
                    K.k = userData.nome;
                    K.l = userData.validade;
                    K.m = K.l ? L._6(K.l) : null;
                    L._13();
                    ui.s1.setText("OK: " + K.k);
                    toast("✅ Autorizado!");
                    if (cb) cb(true);
                    return;
                }
                
                // Se continua autorizado, atualiza dados
                if (K.i && found && userData) {
                    // Verifica se mudou nome ou validade
                    var mudou = false;
                    if (K.k !== userData.nome) {
                        K.k = userData.nome;
                        mudou = true;
                    }
                    if (K.l !== userData.validade) {
                        K.l = userData.validade;
                        K.m = K.l ? L._6(K.l) : null;
                        mudou = true;
                    }
                    if (mudou) {
                        L._("🔄 Dados do usuário atualizados", 'monitor');
                        L._13();
                    }
                    if (cb) cb(true);
                    return;
                }
                
                // Nunca foi autorizado
                if (!K.i && !found) {
                    if (cb) cb(false);
                    return;
                }
                
                if (cb) cb(found);
            } catch(e) {
                L._("Erro na verificação: " + e.message, 'err');
                if (cb) cb(false);
            }
        });
    },
    
    // ============================================
    // REVOGAÇÃO DE ACESSO
    // ============================================
    
    _25: function(motivo) {
        L._("🚫 REVOGANDO ACESSO!", 'revoke');
        L._("📝 Motivo: " + motivo, 'revoke');
        
        // Revoga autorização
        K.i = false;
        K.k = null;
        K.l = null;
        K.m = null;
        
        // Se estiver logado, faz logout
        if (K.j) {
            L._("🔐 Realizando logout automático...", 'revoke');
            K.j = false;
            K.b = null;
            K.o = null;
            ui.b2.setText("Login");
        }
        
        // Limpa contas em cache
        K.n = [];
        K.o = null;
        
        // Atualiza UI
        L._13();
        ui.s1.setText("🚫 ACESSO REVOGADO!");
        ui.s1.setTextColor(colors.parseColor("#ff4444"));
        
        // Alerta o usuário
        toast("🚫 Acesso revogado!");
        dialogs.alert("Acesso Revogado", 
            "🚫 Seu acesso ao sistema foi revogado.\n\n" +
            "Motivo: " + motivo + "\n\n" +
            "Contate o administrador para obter acesso novamente.");
        
        L._("✅ Revogação concluída", 'revoke');
    },
    
    // ============================================
    // INICIAR MONITORAMENTO CONTÍNUO
    // ============================================
    
    _26: function() {
        if (K.monitorAtivo) {
            L._("⚠️ Monitor já está ativo!", 'warn');
            return;
        }
        
        L._("🔄 Iniciando monitoramento contínuo...", 'monitor');
        L._("⏰ Intervalo: " + (MONITOR_INTERVALO / 1000) + " segundos", 'monitor');
        
        K.monitorAtivo = true;
        K.ultimaVerif = new Date().toLocaleString('pt-BR');
        
        // Primeira verificação imediata
        L._24(function(resultado) {
            if (resultado) {
                L._("✅ Verificação inicial: Autorizado", 'monitor');
            } else {
                L._("⚠️ Verificação inicial: Não autorizado", 'monitor');
            }
            L._13();
        });
        
        // Thread de monitoramento
        threads.start(function() {
            while (K.monitorAtivo) {
                // Aguarda o intervalo
                for (var i = 0; i < MONITOR_INTERVALO / 1000; i++) {
                    if (!K.monitorAtivo) break;
                    sleep(1000);
                }
                if (!K.monitorAtivo) break;
                
                // Verifica autorização
                L._("🔄 Verificação periódica...", 'monitor');
                L._24(function(resultado) {
                    if (resultado) {
                        if (K.i) {
                            L._("✅ Dispositivo ainda autorizado", 'monitor');
                        }
                    } else {
                        if (K.i) {
                            // Se perdeu autorização, já foi tratado no _24
                        } else {
                            L._("⚠️ Dispositivo não autorizado", 'monitor');
                        }
                    }
                    L._13();
                });
            }
            L._("🔄 Monitoramento encerrado.", 'monitor');
        });
    },
    
    // ============================================
    // PARAR MONITORAMENTO
    // ============================================
    
    _27: function() {
        if (!K.monitorAtivo) {
            L._("⚠️ Monitor já está inativo!", 'warn');
            return;
        }
        K.monitorAtivo = false;
        L._("🔄 Monitoramento desativado.", 'monitor');
    },
    
    // ============================================
    // AUTORIZAR - COM INÍCIO DO MONITOR
    // ============================================
    
    _12: function() {
        K.g = L._2();
        L._("Serial: " + K.g, 'info');
        ui.b1.setEnabled(false);
        ui.b1.setText("Aguarde...");
        ui.s1.setText("Verificando...");
        
        L._10(function(ok) {
            if (!ok) {
                ui.b1.setEnabled(true);
                ui.b1.setText("Autorizar");
                ui.s1.setText("GitHub: Falha!");
                toast("Falha no GitHub!");
                return;
            }
            
            L._11(function(r) {
                L._8(D, function(d2, c2) {
                    ui.b1.setEnabled(true);
                    ui.b1.setText("Autorizar");
                    if (!c2) { ui.s1.setText("Falha!"); toast("Falha!"); return; }
                    try {
                        var json = c2.trim();
                        if (json.charCodeAt(0) === 0xFEFF) json = json.substring(1);
                        var data = JSON.parse(json);
                        var list = data.seriais || data.s || [];
                        var cur = K.g.toLowerCase();
                        var found = false;
                        
                        for (var i = 0; i < list.length; i++) {
                            var item = list[i];
                            var serial = item.serial || (item.length >= 2 ? item[1] : null);
                            if (serial) {
                                var norm = serial.toString().trim().toLowerCase();
                                if (norm === cur) {
                                    found = true;
                                    K.k = item.nome || (item.length >= 3 ? item[2] : "Usuario");
                                    K.l = item.validade || (item.length >= 4 ? item[3] : null);
                                    K.m = K.l ? L._6(K.l) : null;
                                    K.i = true;
                                    L._("Autorizado: " + K.k, 'ok');
                                    break;
                                }
                            }
                        }
                        
                        if (found) {
                            L._13();
                            ui.s1.setText("OK: " + K.k);
                            toast("Autorizado!");
                            // Inicia monitoramento após autorização
                            if (!K.monitorAtivo) {
                                L._26();
                            }
                        } else {
                            ui.s1.setText("❌ NÃO AUTORIZADO!");
                            ui.s1.setTextColor(colors.parseColor("#ff4444"));
                            toast("❌ Não autorizado!");
                            L._("NÃO AUTORIZADO!", 'err');
                            dialogs.alert("Acesso Negado", 
                                "❌ Seu dispositivo não está autorizado!\n\n" +
                                "Serial: " + K.g + "\n\n" +
                                "Contate o administrador para autorização.");
                        }
                    } catch(e) {
                        ui.s1.setText("Erro!");
                        L._("Erro: " + e.message, 'err');
                    }
                });
            });
        });
    },
    
    _13: function() {
        try {
            var status = K.i ? "✅ AUTORIZADO" : "❌ NÃO AUTORIZADO";
            var cor = K.i ? "#4CAF50" : "#ff4444";
            var info = "";
            if (K.i) {
                info = "👤 " + K.k;
                if (K.l) info += " | 📅 " + L._5(K.l);
                if (K.m !== null) info += " | ⏳ " + (K.m > 0 ? K.m + " dias" : (K.m === 0 ? "Expira hoje" : "Expirado"));
                if (K.j) info += " | 🔐 Logado";
                if (K.monitorAtivo) info += " | 📡 Monitor Ativo";
            }
            ui.s1.setText(status + " - " + info);
            ui.s1.setTextColor(colors.parseColor(cor));
        } catch(e) {}
    },
    
    // ============================================
    // INTERFACE DO USUÁRIO
    // ============================================
    
    _28: function() {
        ui.layout(
            <vertical padding="16">
                <vertical bg="#f5f5f5" padding="12" margin="0 0 16 0" radius="8">
                    <text id="s1" text="⚠️ Clique em Autorizar" textColor="#333" textSize="16sp" gravity="center" />
                </vertical>
                
                <horizontal gravity="center" margin="0 0 16 0">
                    <button id="b1" text="Autorizar" w="auto" style="Widget.AppCompat.Button.Colored" />
                    <button id="b2" text="Login" w="auto" style="Widget.AppCompat.Button.Colored" margin="8 0 0 0" />
                    <button id="b3" text="Testar" w="auto" style="Widget.AppCompat.Button.Colored" margin="8 0 0 0" />
                </horizontal>
                
                <horizontal gravity="center" margin="0 0 16 0">
                    <button id="b4" text="Iniciar Monitor" w="auto" style="Widget.AppCompat.Button.Colored" />
                    <button id="b5" text="Parar Monitor" w="auto" style="Widget.AppCompat.Button.Colored" margin="8 0 0 0" />
                </horizontal>
                
                <horizontal gravity="center" margin="0 0 16 0">
                    <button id="b6" text="Limpar Log" w="auto" style="Widget.AppCompat.Button.Colored" />
                </horizontal>
                
                <vertical id="a2" h="200" bg="#1e1e1e" padding="8" radius="4" margin="0 0 16 0">
                    <text id="a1" text="📋 Logs do sistema..." textColor="#00ff00" textSize="12sp" />
                </vertical>
            </vertical>
        );
        
        // ============================================
        // EVENTOS DOS BOTÕES
        // ============================================
        
        ui.b1.on("click", function() {
            L._12();
        });
        
        ui.b2.on("click", function() {
            if (!K.i) {
                toast("❌ Autorize o dispositivo primeiro!");
                return;
            }
            // Função de login (simplificada)
            dialogs.rawInput("Login", "Digite seu usuário:", "", function(u) {
                if (u === null || u.trim() === "") return;
                dialogs.rawInput("Login", "Digite sua senha:", "", function(s) {
                    if (s === null || s.trim() === "") return;
                    K.j = true;
                    ui.b2.setText("Logout");
                    L._("✅ Login realizado: " + u, 'ok');
                    L._13();
                    toast("✅ Login OK!");
                });
            });
        });
        
        ui.b3.on("click", function() {
            L._("🔍 Teste manual de autorização...", 'test');
            L._24(function(resultado) {
                if (resultado) {
                    toast("✅ Autorizado!");
                } else {
                    toast("❌ Não autorizado!");
                }
                L._13();
            });
        });
        
        ui.b4.on("click", function() {
            if (!K.i) {
                toast("❌ Autorize o dispositivo primeiro!");
                return;
            }
            L._26();
        });
        
        ui.b5.on("click", function() {
            L._27();
        });
        
        ui.b6.on("click", function() {
            ui.a1.setText("");
            K.p = [];
            L._("🧹 Log limpo!", 'warn');
        });
    }
};

// ============================================
// INÍCIO
// ============================================

L._28();
L._("🚗 GBot V1 Iniciado!", 'info');
L._("📡 Monitoramento contínuo integrado", 'info');
L._("🔑 Token configurado", 'info');
L._("💡 Clique em 'Autorizar' para ativar", 'info');
