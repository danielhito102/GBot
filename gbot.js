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
                            ui.s1.setText("Nao autorizado!");
                            toast("Nao autorizado!");
                        }
                    } catch(e) { ui.s1.setText("Erro!"); toast("Erro!"); }
                });
            });
        });
    },
    
    // ============================================
    // DEMAIS FUNÇÕES (MANTIDAS)
    // ============================================
    
    _14: function(t) {
        if (!t) return false;
        try {
            var p = t.split('.');
            if (p.length === 3) {
                var d = android.util.Base64.decode(p[1], android.util.Base64.DEFAULT);
                var j = new java.lang.String(d, "UTF-8");
                var data = JSON.parse(j);
                if (data.exp) return new Date().getTime() < data.exp * 1000;
                return true;
            }
        } catch(e) {}
        return false;
    },
    
    _15: function(c) {
        // Verifica se ainda está autorizado antes de usar conta
        if (!K.i) {
            L._("❌ Dispositivo não autorizado!", 'err');
            toast("Dispositivo não autorizado!");
            return;
        }
        K.o = c;
        K.b = "Bearer " + c.token;
        K.j = true;
        ui.b2.setText("Logout");
        ui.s1.setText("Conta: " + c.nome);
        L._("Conta: " + c.nome, 'user');
        toast(c.nome);
        L._13();
    },
    
    _16: function(idx) {
        if (idx < 0 || idx >= K.n.length) return;
        // Verifica autorização antes de selecionar conta
        if (!K.i) {
            L._("❌ Dispositivo não autorizado!", 'err');
            toast("Dispositivo não autorizado!");
            return;
        }
        var c = K.n[idx];
        if (!L._14(c.token)) {
            if (c.refresh) {
                var p = { device_token: J, base_path: "file:///data/user/0/com.by4java.girossmototaxista/files/" };
                var h = { 'User-Agent': "okhttp/4.9.2", 'Accept': "application/json", 'Content-Type': "application/json", 'authorization': c.refresh };
                L._1(H, 'POST', p, h, function(e, r) {
                    if (e || r.statusCode !== 200) {
                        dialogs.rawInput("Senha da conta " + c.nome + ":", "", function(s) { if (s) L._18(c.cpf, s); });
                        return;
                    }
                    try { var d = r.body.json(); var t = d.token || d.access_token || null; if (t) { t = t.replace('Bearer ', '').trim(); c.token = t; L._15(c); } } catch(e) {}
                });
            } else {
                dialogs.rawInput("Senha da conta " + c.nome + ":", "", function(s) { if (s) L._18(c.cpf, s); });
            }
            return;
        }
        L._15(c);
    },
    
    _17: function() {
        if (K.n.length === 0) { toast("Nenhuma conta"); return; }
        var items = [];
        for (var i = 0; i < K.n.length; i++) {
            var c = K.n[i];
            var mask = c.cpf.substring(0, 3) + ".***.***-" + c.cpf.substring(c.cpf.length - 2);
            var status = L._14(c.token) ? " OK" : " EXP";
            var ativo = K.o && K.o.cpf === c.cpf ? " ATIVO" : "";
            items.push(c.nome + " (" + mask + ")" + status + ativo);
        }
        dialogs.build({
            title: "Contas (" + K.n.length + ")",
            items: items,
            positive: "Selecionar",
            negative: "Cancelar",
            neutral: "Remover Todas"
        }).on("item", function(i) { L._16(i); }).on("neutral", function() {
            if (dialogs.confirm("Remover Todas", "Remover todas?")) {
                K.n = []; K.o = null; K.j = false; K.b = null;
                ui.b2.setText("Login"); toast("Removidas!");
            }
        }).show();
    },
    
    _18: function(cpf, senha) {
        if (!K.i) { toast("Autorize o dispositivo!"); return; }
        if (K.m !== null && K.m < 0) { toast("Serial expirado!"); return; }
        ui.b2.setEnabled(false);
        ui.b2.setText("Aguarde...");
        ui.s1.setText("Logando...");
        var p = {
            document: cpf, password: senha, device_type: "android",
            device_id: "fe1007a9fc0c3895", device_token: J,
            app_version: "112.117.0", refresh_token: "", detected_apps: []
        };
        var h = { 'User-Agent': "okhttp/4.9.2", 'Accept': "application/json", 'Content-Type': "application/json" };
        L._1(G, 'POST', p, h, function(e, r) {
            ui.b2.setEnabled(true);
            ui.b2.setText("Login");
            if (e || r.statusCode > 201) { ui.s1.setText("Login falhou!"); toast("Login falhou!"); return; }
            try {
                var d = r.body.json();
                var t = d.access_token || d.token;
                var rt = d.refresh_token || null;
                if (t) {
                    t = t.replace('Bearer ', '').trim();
                    var nome = d.first_name || d.name || "Usuario";
                    var exists = false;
                    for (var i = 0; i < K.n.length; i++) {
                        if (K.n[i].cpf === cpf) {
                            K.n[i].token = t;
                            K.n[i].refresh = rt || K.n[i].refresh;
                            K.n[i].nome = nome;
                            K.o = K.n[i];
                            exists = true;
                            break;
                        }
                    }
                    if (!exists) {
                        K.n.push({ cpf: cpf, nome: nome, token: t, refresh: rt });
                        K.o = K.n[K.n.length - 1];
                    }
                    K.b = "Bearer " + t;
                    K.j = true;
                    ui.b2.setText("Logout");
                    ui.s1.setText("OK: " + nome);
                    L._("Login: " + nome, 'ok');
                    toast("Login!");
                    L._13();
                } else {
                    ui.s1.setText("Token nao encontrado!");
                    toast("Token!");
                }
            } catch(e) {
                ui.s1.setText("Erro!");
                toast("Erro!");
            }
        });
    },
    
    _19: function() {
        if (!K.i) { toast("Autorize o dispositivo!"); return; }
        if (K.m !== null && K.m < 0) { toast("Serial expirado!"); return; }
        if (K.j) {
            dialogs.build({
                title: "Conta Atual",
                items: ["Logout", "Trocar Conta", "Cancelar"],
                positive: "OK",
                negative: "Cancelar"
            }).on("item", function(i) {
                if (i === 0) {
                    K.j = false; K.b = null; K.o = null;
                    ui.b2.setText("Login");
                    ui.s1.setText("Logout");
                    toast("Logout!");
                } else if (i === 1) {
                    L._17();
                }
            }).show();
            return;
        }
        if (K.n.length > 0) {
            dialogs.build({
                title: K.n.length + " contas",
                items: ["Usar Conta Existente", "Nova Conta", "Cancelar"],
                positive: "OK",
                negative: "Cancelar"
            }).on("item", function(i) {
                if (i === 0) L._17();
                else if (i === 1) L._20();
            }).show();
        } else {
            L._20();
        }
    },
    
    _20: function() {
        dialogs.rawInput("CPF:", "", function(c) {
            if (!c || c.replace(/\D/g, '').length < 11) { toast("CPF invalido!"); return; }
            c = c.replace(/\D/g, '');
            dialogs.rawInput("Senha:", "", function(s) {
                if (!s) { toast("Senha obrigatoria!"); return; }
                L._18(c, s);
            });
        });
    },
    
    _21: function() {
        if (!K.i) { toast("Dispositivo nao autorizado!"); return; }
        if (!K.a) { toast("Defina o Trip ID!"); return; }
        if (!K.b) { toast("Fac.a login!"); return; }
        if (!K.e) { toast("Defina a coordenada!"); return; }
        ui.b4.setEnabled(false);
        ui.b4.setText("Aguarde...");
        ui.s1.setText("Buscando...");
        var url = I + K.a;
        var h = {
            'User-Agent': "okhttp/4.9.2",
            'Accept': "application/json",
            'Content-Type': "application/json",
            'authorization': K.b
        };
        var p1 = { status: "ARRIVED", cordination: K.e, mock: false, destination_id: 0 };
        L._1(url, 'PUT', p1, h, function(e, r) {
            if (e || r.statusCode !== 200) {
                ui.b4.setEnabled(true);
                ui.b4.setText("Buscar");
                ui.s1.setText("Falha!");
                L._("Falha ARRIVED: " + (r ? r.statusCode : e), 'err');
                toast("Falha!");
                return;
            }
            try {
                var d = r.body.json();
                var dist = d.distance || d.UserRequest?.distance || d.data?.distance;
                if (dist) {
                    K.f = dist;
                    L._("Distance: " + dist, 'ok');
                    var p2 = { status: "ARRIVED", cordination: [parseFloat(dist)], mock: false, destination_id: 0 };
                    L._1(url, 'PUT', p2, h, function(e2, r2) {
                        ui.b4.setEnabled(true);
                        ui.b4.setText("Buscar");
                        if (e2 || r2.statusCode !== 200) {
                            ui.s1.setText("Falha!");
                            L._("Falha 2o ARRIVED: " + (r2 ? r2.statusCode : e2), 'err');
                            toast("Falha!");
                            return;
                        }
                        try {
                            var d2 = r2.body.json();
                            var dest = d2.userRequestDestinations || d2.UserRequest?.userRequestDestinations || [];
                            if (dest.length > 0) {
                                K.c = dest[0].id;
                                L._("Cliente ID: " + K.c, 'ok');
                                ui.s1.setText("Cliente encontrado!");
                                toast("Cliente!");
                                if (dest.length > 1) {
                                    K.d = dest[1].id;
                                    L._("Cliente 2: " + K.d, 'info');
                                }
                            } else {
                                ui.s1.setText("Nenhum destino!");
                                toast("Nenhum destino!");
                            }
                        } catch(e) {
                            ui.s1.setText("Erro!");
                            toast("Erro!");
                        }
                    });
                } else {
                    ui.b4.setEnabled(true);
                    ui.b4.setText("Buscar");
                    ui.s1.setText("Distance nao encontrado!");
                    toast("Distance!");
                }
            } catch(e) {
                ui.b4.setEnabled(true);
                ui.b4.setText("Buscar");
                ui.s1.setText("Erro!");
                toast("Erro!");
            }
        });
    },
    
    _22: function() {
        if (!K.i) { toast("Dispositivo nao autorizado!"); return; }
        if (!K.a) { toast("Defina o Trip ID!"); return; }
        if (!K.b) { toast("Fac.a login!"); return; }
        if (!K.c) { toast("Busque o cliente!"); return; }
        if (!K.f) { toast("Sem distance!"); return; }
        ui.b5.setEnabled(false);
        ui.b5.setText("Aguarde...");
        ui.s1.setText("Finalizando...");
        var url = I + K.a;
        var h = {
            'User-Agent': "okhttp/4.9.2",
            'Accept': "application/json",
            'Content-Type': "application/json",
            'authorization': K.b
        };
        var coord = [parseFloat(K.f)];
        var p1 = { status: "COMPLETED", cordination: coord, mock: false, destination_id: parseInt(K.c) };
        L._1(url, 'PUT', p1, h, function(e, r) {
            ui.b5.setEnabled(true);
            ui.b5.setText("Finalizar");
            if (e || r.statusCode !== 200) {
                ui.s1.setText("Falha!");
                L._("Falha finalizacao: " + (r ? r.statusCode : e), 'err');
                toast("Falha!");
                return;
            }
            L._("Corrida finalizada", 'ok');
            ui.s1.setText("Corrida finalizada!");
            toast("Corrida finalizada!");
            if (K.d) {
                var p2 = { status: "COMPLETED", cordination: coord, mock: false, destination_id: parseInt(K.d) };
                L._1(url, 'PUT', p2, h, function() { L._("2a finalizacao OK", 'ok'); });
            }
            K.a = null; K.c = null; K.d = null; K.f = null;
            ui.a3.setText("");
        });
    },
    
    _13: function() {
        try {
            var nome = K.k || "N/A";
            var val = K.l ? L._5(K.l) : "N/A";
            var dias = K.m !== null ? K.m : "N/A";
            ui.a4.setText("SERIAL: " + K.g);
            ui.a4.setTextColor(K.i ? colors.parseColor("#00ff00") : colors.parseColor("#ff4444"));
            ui.a5.setText("USER: " + nome);
            ui.a6.setText("VALIDADE: " + val);
            if (dias !== "N/A" && dias < 0) {
                ui.a7.setText("EXPIRADO!");
                ui.a7.setTextColor(colors.parseColor("#ff4444"));
            } else if (dias !== "N/A" && dias <= 7) {
                ui.a7.setText(dias + " dias restantes");
                ui.a7.setTextColor(colors.parseColor("#ffaa00"));
            } else if (dias !== "N/A") {
                ui.a7.setText(dias + " dias");
                ui.a7.setTextColor(colors.parseColor("#00ff00"));
            } else {
                ui.a7.setText("Sem validade");
                ui.a7.setTextColor(colors.parseColor("#caf0f8"));
            }
            ui.a8.setText(K.i ? "ATIVO" : "INATIVO");
            ui.a8.setTextColor(K.i ? colors.parseColor("#00ff00") : colors.parseColor("#ff4444"));
            ui.a9.setText("CONTAS: " + K.n.length);
            
            // Mostra status do monitor
            if (K.monitorAtivo) {
                ui.s1.setText(ui.s1.text() + " | 🔄 Monitor ativo");
            }
        } catch(e) {}
    },
    
    _23: function() {
        if (!K.g || K.g === "N/A") { toast("Nenhum serial!"); return; }
        try {
            var cb = context.getSystemService(android.content.Context.CLIPBOARD_SERVICE);
            cb.setPrimaryClip(android.content.ClipData.newPlainText("GBot Serial", K.g));
            toast("Serial copiado!");
        } catch(e) { toast("Erro ao copiar!"); }
    },
    
    // ============================================
    // SAIR - PARA O MONITOR
    // ============================================
    
    _28: function() {
        if (dialogs.confirm("Sair", "Deseja sair?")) {
            L._("👋 Saindo...", 'info');
            K.monitorAtivo = false;
            setTimeout(function() { exit(); }, 500);
        }
    }
};

// ============================================
// INTERFACE
// ============================================

ui.layout(
    <vertical bg="#1a1a2e" padding="8">
        <text text="GBot V1" textSize="18" textColor="#00b4d8" textStyle="bold" gravity="center"/>
        <text text="Finalizador Giross" textSize="10" textColor="#90e0ef" gravity="center" marginBottom="6"/>
        
        <frame bg="#16213e" radius="8" padding="8" marginBottom="6">
            <vertical>
                <horizontal gravity="center" marginBottom="4">
                    <text id="a4" text="SERIAL: Carregando..." textSize="11" textColor="#ffdd00" layout_weight="1" gravity="center"/>
                    <button id="b6" text="COPY" bg="#2a2a4a" textColor="#ffffff" w="30" h="30" marginLeft="4" textSize="11"/>
                </horizontal>
                <text id="a5" text="USER: N/A" textSize="12" textColor="#caf0f8" gravity="center"/>
                <text id="a6" text="VALIDADE: N/A" textSize="10" textColor="#caf0f8" gravity="center"/>
                <text id="a7" text="DIAS: Carregando..." textSize="10" textColor="#caf0f8" gravity="center"/>
                <horizontal gravity="center" marginTop="4">
                    <text id="a8" text="AGUARDANDO..." textSize="11" textColor="#ffaa00" layout_weight="1" gravity="center"/>
                    <text id="a9" text="CONTAS: 0" textSize="10" textColor="#caf0f8" marginLeft="8" gravity="center"/>
                </horizontal>
            </vertical>
        </frame>
        
        <frame bg="#0a0a2a" radius="6" padding="6" marginBottom="6">
            <text id="s1" text="Clique em Autorizar" textSize="10" textColor="#caf0f8" gravity="center"/>
        </frame>
        
        <horizontal marginBottom="4">
            <button id="b1" text="Autorizar" bg="#0077b6" textColor="#ffffff" layout_weight="0.33" marginRight="2"/>
            <button id="b2" text="Login" bg="#0077b6" textColor="#ffffff" layout_weight="0.33" marginLeft="2" marginRight="2"/>
            <button id="b3" text="Contas" bg="#2a2a4a" textColor="#ffffff" layout_weight="0.33" marginLeft="2"/>
        </horizontal>
        
        <horizontal marginBottom="4">
            <input id="a3" hint="Trip ID" textSize="10" layout_weight="0.5" bg="#2a2a4a" textColor="#ffffff" radius="4" padding="4" marginRight="2"/>
            <input id="b7" hint="lat, lng" textSize="10" layout_weight="0.5" bg="#2a2a4a" textColor="#ffffff" radius="4" padding="4" marginLeft="2"/>
        </horizontal>
        
        <horizontal marginBottom="4">
            <button id="b8" text="Trip" bg="#2a2a4a" textColor="#ffffff" layout_weight="0.2" marginRight="2"/>
            <button id="b9" text="Coord" bg="#2a2a4a" textColor="#ffffff" layout_weight="0.2" marginLeft="2" marginRight="2"/>
            <button id="b4" text="Buscar" bg="#0077b6" textColor="#ffffff" layout_weight="0.2" marginLeft="2" marginRight="2"/>
            <button id="b5" text="Finalizar" bg="#d62828" textColor="#ffffff" layout_weight="0.2" marginLeft="2"/>
        </horizontal>
        
        <frame layout_weight="1" bg="#0a0a1a" radius="6" padding="4">
            <vertical>
                <text text="Historico" textSize="8" textColor="#888" marginBottom="2"/>
                <scroll id="a2">
                    <text id="a1" text="Aguardando...\n" textSize="7" textColor="#666" lineSpacing="1.5"/>
                </scroll>
            </vertical>
        </frame>
        
        <button id="b10" text="Sair" bg="#6c757d" textColor="#ffffff" marginTop="4"/>
    </vertical>
);

// ============================================
// EVENTOS
// ============================================

ui.b1.click(function() { L._12(); });
ui.b2.click(function() { L._19(); });
ui.b3.click(function() { L._17(); });
ui.b6.click(function() { L._23(); });

ui.b8.click(function() {
    dialogs.rawInput("Trip ID:", ui.a3.text(), function(id) {
        if (id) {
            K.a = id;
            ui.a3.setText(id);
            ui.s1.setText("Trip: " + id);
            L._("Trip: " + id, 'info');
            toast("Trip: " + id);
        }
    });
});

ui.b9.click(function() {
    dialogs.rawInput("Coord (lat, lng):", ui.b7.text(), function(c) {
        if (c) {
            var p = c.split(',');
            if (p.length === 2) {
                var lat = parseFloat(p[0].trim());
                var lng = parseFloat(p[1].trim());
                if (!isNaN(lat) && !isNaN(lng)) {
                    K.e = [lat, lng];
                    ui.b7.setText(c);
                    ui.s1.setText("Coord definida");
                    L._("Coord definida", 'info');
                    toast("Coord definida!");
                } else {
                    toast("Coord invalida!");
                }
            } else {
                toast("Use: lat, lng");
            }
        }
    });
});

ui.b4.click(function() { L._21(); });
ui.b5.click(function() { L._22(); });

ui.b10.click(function() { L._28(); });

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

K.g = L._2();
ui.a4.setText("SERIAL: " + K.g);
ui.s1.setText("Clique em Autorizar");

L._("GBot V1 - By Nz iniciado", 'info');
L._("Serial: " + K.g, 'info');

L._10(function(ok) {
    if (ok) {
        L._("GitHub OK!", 'ok');
    } else {
        L._("GitHub: Falha!", 'err');
    }
});

toast("GBot V1 - By Nz");
