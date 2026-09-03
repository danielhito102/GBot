// ============================================
// 🚗 GBot V1 - By Nz
// FINALIZADOR DE CORRIDAS - TOKEN ATUALIZADO
// ============================================

"ui";

// ============================================
// CONFIGURAÇÕES - TOKEN ATUALIZADO
// ============================================

var GITHUB_TOKEN = "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";
var OWNER = "danielhito102";
var REPO = "GBot";

var URL_SERIAL_API = "https://api.github.com/repos/" + OWNER + "/" + REPO + "/contents/seriais.json";
var URL_DEVICES_API = "https://api.github.com/repos/" + OWNER + "/" + REPO + "/contents/devices.json";
var URL_REPO_API = "https://api.github.com/repos/" + OWNER + "/" + REPO;

var LOGIN_URL = "https://api.giross.com.br/api/provider/oauth/token";
var REFRESH_URL = "https://api.giross.com.br/api/provider/refresh/fmc_token";
var API_URL = "https://api.giross.com.br/api/provider/trip/";
var DEVICE_TOKEN = "eubcB-jeSluQalzx0sSzXV:APA91bHoLVECLtPNxNxxNkN_17hj66HYduxf-2ludzzavkdrnNwWuYcR2RAIVbDJz7mTzw5jqrrybrHZ3krcqMzqjf6xsSWWoIGbi3xYxIzaZl9IwSFhtrQ";

// ============================================
// ESTADO DO SISTEMA
// ============================================

var st = {
    t1: null, t2: null, c1: null, c2: null,
    c3: null, c4: null, s1: null, s2: null,
    a1: false, a2: false, u1: null, v1: null, d1: null,
    ct: [], at: null, lg: [], r1: null, r2: false
};

// ============================================
// MAPEAMENTO DE FUNÇÕES
// ============================================

var F = {
    log: function(m, t) {
        var d = new Date().toLocaleString('pt-BR');
        var ic = "[i]";
        if (t === 'ok') ic = "[OK]";
        else if (t === 'err') ic = "[ERRO]";
        else if (t === 'warn') ic = "[AVISO]";
        else if (t === 'user') ic = "[USER]";
        else if (t === 'renew') ic = "[RENEW]";
        else if (t === 'test') ic = "[TESTE]";
        
        m = m.replace(/\b\d{11}\b/g, "***.***.***-**");
        m = m.replace(/Bearer\s+[a-zA-Z0-9._-]+/g, "Bearer ***");
        
        var e = "[" + d + "] " + ic + " " + m + "\n";
        st.lg.push(e);
        if (st.lg.length > 200) st.lg.splice(0, 50);
        
        try {
            var v = ui.l1;
            if (v) {
                var txt = v.text();
                var lines = txt.split('\n');
                if (lines.length > 200) lines.splice(0, 50);
                lines.push(e);
                v.setText(lines.join('\n'));
                ui.sv.scrollTo(0, v.getHeight());
            }
        } catch(e) {}
    },
    
    req: function(url, method, data, headers, cb) {
        threads.start(function() {
            try {
                var r;
                if (method === 'GET') {
                    r = http.get(url, { headers: headers, timeout: 30000 });
                } else if (method === 'POST') {
                    r = http.post(url, data, { headers: headers, timeout: 30000 });
                } else if (method === 'PUT') {
                    var bodyStr = typeof data === 'string' ? data : JSON.stringify(data);
                    r = http.request(url, { 
                        method: "PUT", 
                        headers: headers, 
                        body: bodyStr,
                        timeout: 30000 
                    });
                }
                ui.run(function() { 
                    if (cb) cb(null, r); 
                });
            } catch(e) {
                F.log("Erro req: " + e.message, 'err');
                ui.run(function() { 
                    if (cb) cb(e.message, null); 
                });
            }
        });
    },
    
    getSerial: function() {
        var id = null;
        var src = "N/A";
        
        try {
            var tm = context.getSystemService(android.content.Context.TELEPHONY_SERVICE);
            if (tm) {
                var im = tm.getDeviceId();
                if (im && im.length > 0 && im !== "unknown" && im !== "000000000000000") {
                    id = im;
                    src = "IMEI";
                }
            }
        } catch(e) {}
        
        if (!id) {
            try {
                var aid = android.provider.Settings.Secure.getString(
                    context.getContentResolver(),
                    android.provider.Settings.Secure.ANDROID_ID
                );
                if (aid && aid.length > 0) {
                    id = aid;
                    src = "Android ID";
                }
            } catch(e) {}
        }
        
        if (!id) {
            try {
                var bs = android.os.Build.getSerial();
                if (bs && bs.length > 0 && bs !== "unknown") {
                    id = bs;
                    src = "Build Serial";
                }
            } catch(e) {}
        }
        
        if (!id) {
            var u = java.util.UUID.randomUUID().toString().replace(/-/g, "").toUpperCase();
            id = u;
            src = "UUID";
        }
        
        try {
            var md5 = java.security.MessageDigest.getInstance("MD5");
            var h = md5.digest(new java.lang.String(id + "GBotFixo2024").getBytes());
            var r = "";
            for (var i = 0; i < h.length; i++) {
                var hex = java.lang.Integer.toHexString(h[i] & 0xFF);
                if (hex.length() === 1) hex = "0" + hex;
                r += hex;
            }
            var f = r.toUpperCase();
            st.s2 = id;
            return f;
        } catch(e) {
            st.s2 = id;
            return id.toUpperCase();
        }
    },
    
    getIP: function() {
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
    
    getModel: function() {
        try { return android.os.Build.MODEL || "N/A"; } catch(e) { return "N/A"; }
    },
    
    fmtDate: function(d) {
        try {
            var f = new java.text.SimpleDateFormat("yyyy-MM-dd");
            var dt = f.parse(d);
            var o = new java.text.SimpleDateFormat("dd/MM/yyyy");
            return o.format(dt);
        } catch(e) { return d; }
    },
    
    calcDays: function(d) {
        try {
            var f = new java.text.SimpleDateFormat("yyyy-MM-dd");
            var dt = f.parse(d);
            var diff = dt.getTime() - new Date().getTime();
            return Math.ceil(diff / (1000 * 60 * 60 * 24));
        } catch(e) { return null; }
    },
    
    toStr: function(obj) {
        if (typeof obj === 'string') return obj;
        if (obj === null || obj === undefined) return "";
        if (obj.toString) return obj.toString();
        return String(obj);
    },
    
    readGit: function(url, cb) {
        var h = {
            'User-Agent': 'GBot/1.0',
            'Accept': 'application/vnd.github.v3+json',
            'Authorization': 'token ' + GITHUB_TOKEN
        };
        
        F.req(url, 'GET', null, h, function(err, r) {
            if (err || !r || r.statusCode === 404 || r.statusCode !== 200) {
                cb(null, null);
                return;
            }
            try {
                var d = r.body.json();
                if (!d || !d.content) {
                    cb(null, null);
                    return;
                }
                var dec = android.util.Base64.decode(d.content, android.util.Base64.DEFAULT);
                var js = new java.lang.String(dec, "UTF-8");
                var s = F.toStr(js);
                if (s && s.length > 0) {
                    cb(d, s);
                } else {
                    cb(null, null);
                }
            } catch(e) {
                cb(null, null);
            }
        });
    },
    
    writeGit: function(url, content, sha, cb) {
        var sc = F.toStr(content);
        var bytes = new java.lang.String(sc).getBytes("UTF-8");
        var enc = android.util.Base64.encodeToString(bytes, android.util.Base64.NO_WRAP);
        
        var p = {
            message: "Auto update - GBot V1",
            content: enc,
            branch: "main"
        };
        if (sha && typeof sha === 'string' && sha.length > 0) {
            p.sha = sha;
        }
        
        var h = {
            'User-Agent': 'GBot/1.0',
            'Accept': 'application/vnd.github.v3+json',
            'Authorization': 'token ' + GITHUB_TOKEN,
            'Content-Type': 'application/json'
        };
        
        var ps = JSON.stringify(p);
        F.req(url, 'PUT', ps, h, function(err, r) {
            if (err || !r || (r.statusCode !== 200 && r.statusCode !== 201)) {
                if (r && r.statusCode === 422) {
                    F.readGit(url, function(d, c) {
                        if (d && d.sha) {
                            var np = p;
                            np.sha = d.sha;
                            var nps = JSON.stringify(np);
                            F.req(url, 'PUT', nps, h, function(e2, r2) {
                                if (cb) cb(!e2 && r2 && (r2.statusCode === 200 || r2.statusCode === 201));
                            });
                        } else {
                            if (cb) cb(false);
                        }
                    });
                } else {
                    if (cb) cb(false);
                }
            } else {
                if (cb) cb(true);
            }
        });
    },
    
    testGit: function(cb) {
        var h = {
            'User-Agent': 'GBot/1.0',
            'Accept': 'application/vnd.github.v3+json',
            'Authorization': 'token ' + GITHUB_TOKEN
        };
        
        F.req(URL_REPO_API, 'GET', null, h, function(err, r) {
            if (err || !r || r.statusCode !== 200) {
                if (cb) cb(false);
                return;
            }
            try {
                var d = r.body.json();
                st.r1 = {
                    n1: d.full_name || "N/A",
                    n2: d.stargazers_count || 0
                };
                if (cb) cb(true);
            } catch(e) {
                if (cb) cb(false);
            }
        });
    },
    
    registerDevice: function(cb) {
        F.readGit(URL_DEVICES_API, function(d, c) {
            var devices = [];
            var sha = null;
            
            if (d && c && typeof c === 'string' && c.length > 0) {
                try {
                    var p = JSON.parse(c);
                    devices = p.devices || [];
                    sha = d.sha;
                } catch(e) {}
            }
            
            var exists = false;
            for (var i = 0; i < devices.length; i++) {
                if (devices[i].serial === st.s1) {
                    exists = true;
                    devices[i].ultimo_acesso = new Date().toISOString();
                    devices[i].ip = F.getIP();
                    devices[i].ativo = true;
                    break;
                }
            }
            
            if (!exists) {
                devices.push({
                    serial: st.s1,
                    serialOriginal: st.s2,
                    modelo: F.getModel(),
                    ip: F.getIP(),
                    data_registro: new Date().toISOString(),
                    ultimo_acesso: new Date().toISOString(),
                    ativo: true
                });
            }
            
            var jc = JSON.stringify({ devices: devices }, null, 2);
            F.writeGit(URL_DEVICES_API, jc, sha, function(success) {
                if (cb) cb(success);
            });
        });
    },
    
    auth: function() {
        st.s1 = F.getSerial();
        F.log("Serial: " + st.s1, 'info');
        
        ui.b1.setEnabled(false);
        ui.b1.setText("Aguarde...");
        ui.s3.setText("Verificando...");

        F.testGit(function(ok) {
            if (!ok) {
                ui.b1.setEnabled(true);
                ui.b1.setText("Autorizar");
                ui.s3.setText("GitHub: Falha!");
                toast("Falha no GitHub!");
                return;
            }
            
            F.registerDevice(function(registered) {
                F.readGit(URL_SERIAL_API, function(d2, c2) {
                    ui.b1.setEnabled(true);
                    ui.b1.setText("Autorizar");
                    
                    if (!c2) {
                        ui.s3.setText("Falha!");
                        toast("Falha!");
                        return;
                    }
                    
                    try {
                        var json = c2.trim();
                        if (json.charCodeAt(0) === 0xFEFF) json = json.substring(1);
                        var data = JSON.parse(json);
                        var list = data.seriais || data.s || [];
                        
                        var current = st.s1.toLowerCase();
                        var found = false;
                        
                        for (var i = 0; i < list.length; i++) {
                            var item = list[i];
                            var serial = item.serial || (item.length >= 2 ? item[1] : null);
                            if (serial) {
                                var norm = serial.toString().trim().toLowerCase();
                                if (norm === current) {
                                    found = true;
                                    st.u1 = item.nome || (item.length >= 3 ? item[2] : "Usuario");
                                    st.v1 = item.validade || (item.length >= 4 ? item[3] : null);
                                    st.d1 = st.v1 ? F.calcDays(st.v1) : null;
                                    st.a1 = true;
                                    F.log("Autorizado: " + st.u1, 'ok');
                                    break;
                                }
                            }
                        }
                        
                        if (found) {
                            F.updateUI();
                            ui.s3.setText("OK: " + st.u1);
                            toast("Autorizado!");
                        } else {
                            ui.s3.setText("Nao autorizado!");
                            toast("Nao autorizado!");
                        }
                    } catch(e) {
                        ui.s3.setText("Erro!");
                        toast("Erro!");
                    }
                });
            });
        });
    },
    
    validToken: function(t) {
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
    
    useAccount: function(c) {
        st.at = c;
        st.t2 = "Bearer " + c.token;
        st.a2 = true;
        ui.b2.setText("Logout");
        ui.s3.setText("Conta: " + c.nome);
        F.log("Conta: " + c.nome, 'user');
        toast(c.nome);
        F.updateUI();
    },
    
    selectAccount: function(idx) {
        if (idx < 0 || idx >= st.ct.length) return;
        var c = st.ct[idx];
        
        if (!F.validToken(c.token)) {
            if (c.refresh) {
                var p = {
                    device_token: DEVICE_TOKEN,
                    base_path: "file:///data/user/0/com.by4java.girossmototaxista/files/"
                };
                var h = {
                    'User-Agent': "okhttp/4.9.2",
                    'Accept': "application/json",
                    'Content-Type': "application/json",
                    'authorization': c.refresh
                };
                F.req(REFRESH_URL, 'POST', p, h, function(err, r) {
                    if (err || r.statusCode !== 200) {
                        dialogs.rawInput("Senha da conta " + c.nome + ":", "", function(s) {
                            if (s) F.doLogin(c.cpf, s);
                        });
                        return;
                    }
                    try {
                        var d = r.body.json();
                        var t = d.token || d.access_token || null;
                        if (t) {
                            t = t.replace('Bearer ', '').trim();
                            c.token = t;
                            F.useAccount(c);
                        }
                    } catch(e) {}
                });
            } else {
                dialogs.rawInput("Senha da conta " + c.nome + ":", "", function(s) {
                    if (s) F.doLogin(c.cpf, s);
                });
            }
            return;
        }
        F.useAccount(c);
    },
    
    showAccounts: function() {
        if (st.ct.length === 0) {
            toast("Nenhuma conta");
            return;
        }
        
        var items = [];
        for (var i = 0; i < st.ct.length; i++) {
            var c = st.ct[i];
            var mask = c.cpf.substring(0, 3) + ".***.***-" + c.cpf.substring(c.cpf.length - 2);
            var status = F.validToken(c.token) ? " OK" : " EXP";
            var ativo = st.at && st.at.cpf === c.cpf ? " ATIVO" : "";
            items.push(c.nome + " (" + mask + ")" + status + ativo);
        }
        
        dialogs.build({
            title: "Contas (" + st.ct.length + ")",
            items: items,
            positive: "Selecionar",
            negative: "Cancelar",
            neutral: "Remover Todas"
        }).on("item", function(i) {
            F.selectAccount(i);
        }).on("neutral", function() {
            if (dialogs.confirm("Remover Todas", "Remover todas?")) {
                st.ct = [];
                st.at = null;
                st.a2 = false;
                st.t2 = null;
                ui.b2.setText("Login");
                toast("Removidas!");
            }
        }).show();
    },
    
    doLogin: function(cpf, senha) {
        if (!st.a1) {
            toast("Autorize o dispositivo!");
            return;
        }
        if (st.d1 !== null && st.d1 < 0) {
            toast("Serial expirado!");
            return;
        }
        
        ui.b2.setEnabled(false);
        ui.b2.setText("Aguarde...");
        ui.s3.setText("Logando...");
        
        var p = {
            document: cpf,
            password: senha,
            device_type: "android",
            device_id: "fe1007a9fc0c3895",
            device_token: DEVICE_TOKEN,
            app_version: "112.117.0",
            refresh_token: "",
            detected_apps: []
        };
        
        var h = {
            'User-Agent': "okhttp/4.9.2",
            'Accept': "application/json",
            'Content-Type': "application/json"
        };
        
        F.req(LOGIN_URL, 'POST', p, h, function(err, r) {
            ui.b2.setEnabled(true);
            ui.b2.setText("Login");
            
            if (err || r.statusCode > 201) {
                ui.s3.setText("Login falhou!");
                toast("Login falhou!");
                return;
            }
            
            try {
                var d = r.body.json();
                var t = d.access_token || d.token;
                var rt = d.refresh_token || null;
                
                if (t) {
                    t = t.replace('Bearer ', '').trim();
                    var nome = d.first_name || d.name || "Usuario";
                    
                    var exists = false;
                    for (var i = 0; i < st.ct.length; i++) {
                        if (st.ct[i].cpf === cpf) {
                            st.ct[i].token = t;
                            st.ct[i].refresh = rt || st.ct[i].refresh;
                            st.ct[i].nome = nome;
                            st.at = st.ct[i];
                            exists = true;
                            break;
                        }
                    }
                    
                    if (!exists) {
                        st.ct.push({
                            cpf: cpf,
                            nome: nome,
                            token: t,
                            refresh: rt
                        });
                        st.at = st.ct[st.ct.length - 1];
                    }
                    
                    st.t2 = "Bearer " + t;
                    st.a2 = true;
                    ui.b2.setText("Logout");
                    ui.s3.setText("OK: " + nome);
                    F.log("Login: " + nome, 'ok');
                    toast("Login!");
                    F.updateUI();
                } else {
                    ui.s3.setText("Token nao encontrado!");
                    toast("Token!");
                }
            } catch(e) {
                ui.s3.setText("Erro!");
                toast("Erro!");
            }
        });
    },
    
    showLogin: function() {
        if (!st.a1) {
            toast("Autorize o dispositivo!");
            return;
        }
        if (st.d1 !== null && st.d1 < 0) {
            toast("Serial expirado!");
            return;
        }
        
        if (st.a2) {
            dialogs.build({
                title: "Conta Atual",
                items: ["Logout", "Trocar Conta", "Cancelar"],
                positive: "OK",
                negative: "Cancelar"
            }).on("item", function(i) {
                if (i === 0) {
                    st.a2 = false;
                    st.t2 = null;
                    st.at = null;
                    ui.b2.setText("Login");
                    ui.s3.setText("Logout");
                    toast("Logout!");
                } else if (i === 1) {
                    F.showAccounts();
                }
            }).show();
            return;
        }
        
        if (st.ct.length > 0) {
            dialogs.build({
                title: st.ct.length + " contas",
                items: ["Usar Conta Existente", "Nova Conta", "Cancelar"],
                positive: "OK",
                negative: "Cancelar"
            }).on("item", function(i) {
                if (i === 0) F.showAccounts();
                else if (i === 1) F.newLogin();
            }).show();
        } else {
            F.newLogin();
        }
    },
    
    newLogin: function() {
        dialogs.rawInput("CPF:", "", function(c) {
            if (!c || c.replace(/\D/g, '').length < 11) {
                toast("CPF invalido!");
                return;
            }
            c = c.replace(/\D/g, '');
            dialogs.rawInput("Senha:", "", function(s) {
                if (!s) {
                    toast("Senha obrigatoria!");
                    return;
                }
                F.doLogin(c, s);
            });
        });
    },
    
    buscaCli: function() {
        if (!st.t1) {
            toast("Defina o Trip ID!");
            return;
        }
        if (!st.t2) {
            toast("Fac.a login!");
            return;
        }
        if (!st.c3) {
            toast("Defina a coordenada!");
            return;
        }
        
        ui.b4.setEnabled(false);
        ui.b4.setText("Aguarde...");
        ui.s3.setText("Buscando...");
        
        var url = API_URL + st.t1;
        var h = {
            'User-Agent': "okhttp/4.9.2",
            'Accept': "application/json",
            'Content-Type': "application/json",
            'authorization': st.t2
        };
        
        var p1 = {
            status: "ARRIVED",
            cordination: st.c3,
            mock: false,
            destination_id: 0
        };
        
        F.req(url, 'PUT', p1, h, function(err, r) {
            if (err || r.statusCode !== 200) {
                ui.b4.setEnabled(true);
                ui.b4.setText("Buscar");
                ui.s3.setText("Falha!");
                F.log("Falha no ARRIVED: " + (r ? r.statusCode : err), 'err');
                toast("Falha!");
                return;
            }
            
            try {
                var d = r.body.json();
                var dist = d.distance || d.UserRequest?.distance || d.data?.distance;
                
                if (dist) {
                    st.c4 = dist;
                    F.log("Distance: " + dist, 'ok');
                    
                    var p2 = {
                        status: "ARRIVED",
                        cordination: [parseFloat(dist)],
                        mock: false,
                        destination_id: 0
                    };
                    
                    F.req(url, 'PUT', p2, h, function(e2, r2) {
                        ui.b4.setEnabled(true);
                        ui.b4.setText("Buscar");
                        
                        if (e2 || r2.statusCode !== 200) {
                            ui.s3.setText("Falha!");
                            F.log("Falha no 2o ARRIVED: " + (r2 ? r2.statusCode : e2), 'err');
                            toast("Falha!");
                            return;
                        }
                        
                        try {
                            var d2 = r2.body.json();
                            var dest = d2.userRequestDestinations || d2.UserRequest?.userRequestDestinations || [];
                            
                            if (dest.length > 0) {
                                st.c1 = dest[0].id;
                                F.log("Cliente ID: " + st.c1, 'ok');
                                ui.s3.setText("Cliente encontrado!");
                                toast("Cliente!");
                                if (dest.length > 1) {
                                    st.c2 = dest[1].id;
                                    F.log("Cliente 2: " + st.c2, 'info');
                                }
                            } else {
                                ui.s3.setText("Nenhum destino!");
                                toast("Nenhum destino!");
                            }
                        } catch(e) {
                            ui.s3.setText("Erro!");
                            toast("Erro!");
                        }
                    });
                } else {
                    ui.b4.setEnabled(true);
                    ui.b4.setText("Buscar");
                    ui.s3.setText("Distance nao encontrado!");
                    toast("Distance!");
                }
            } catch(e) {
                ui.b4.setEnabled(true);
                ui.b4.setText("Buscar");
                ui.s3.setText("Erro!");
                toast("Erro!");
            }
        });
    },
    
    finaliza: function() {
        if (!st.t1) {
            toast("Defina o Trip ID!");
            return;
        }
        if (!st.t2) {
            toast("Fac.a login!");
            return;
        }
        if (!st.c1) {
            toast("Busque o cliente!");
            return;
        }
        if (!st.c4) {
            toast("Sem distance!");
            return;
        }
        
        ui.b5.setEnabled(false);
        ui.b5.setText("Aguarde...");
        ui.s3.setText("Finalizando...");
        
        var url = API_URL + st.t1;
        var h = {
            'User-Agent': "okhttp/4.9.2",
            'Accept': "application/json",
            'Content-Type': "application/json",
            'authorization': st.t2
        };
        
        var coord = [parseFloat(st.c4)];
        var p1 = {
            status: "COMPLETED",
            cordination: coord,
            mock: false,
            destination_id: parseInt(st.c1)
        };
        
        F.req(url, 'PUT', p1, h, function(err, r) {
            ui.b5.setEnabled(true);
            ui.b5.setText("Finalizar");
            
            if (err || r.statusCode !== 200) {
                ui.s3.setText("Falha!");
                F.log("Falha na finalizacao: " + (r ? r.statusCode : err), 'err');
                toast("Falha!");
                return;
            }
            
            F.log("Corrida finalizada", 'ok');
            ui.s3.setText("Corrida finalizada!");
            toast("Corrida finalizada!");
            
            if (st.c2) {
                var p2 = {
                    status: "COMPLETED",
                    cordination: coord,
                    mock: false,
                    destination_id: parseInt(st.c2)
                };
                F.req(url, 'PUT', p2, h, function() {
                    F.log("2a finalizacao OK", 'ok');
                });
            }
            
            st.t1 = null;
            st.c1 = null;
            st.c2 = null;
            st.c4 = null;
            ui.i1.setText("");
        });
    },
    
    updateUI: function() {
        try {
            var nome = st.u1 || "N/A";
            var val = st.v1 ? F.fmtDate(st.v1) : "N/A";
            var dias = st.d1 !== null ? st.d1 : "N/A";
            
            ui.t3.setText("SERIAL: " + st.s1);
            ui.t3.setTextColor(st.a1 ? colors.parseColor("#00ff00") : colors.parseColor("#ff4444"));
            ui.t4.setText("USER: " + nome);
            ui.t5.setText("VALIDADE: " + val);
            
            if (dias !== "N/A" && dias < 0) {
                ui.t6.setText("EXPIRADO!");
                ui.t6.setTextColor(colors.parseColor("#ff4444"));
            } else if (dias !== "N/A" && dias <= 7) {
                ui.t6.setText(dias + " dias restantes");
                ui.t6.setTextColor(colors.parseColor("#ffaa00"));
            } else if (dias !== "N/A") {
                ui.t6.setText(dias + " dias");
                ui.t6.setTextColor(colors.parseColor("#00ff00"));
            } else {
                ui.t6.setText("Sem validade");
                ui.t6.setTextColor(colors.parseColor("#caf0f8"));
            }
            
            ui.t7.setText(st.a1 ? "ATIVO" : "INATIVO");
            ui.t7.setTextColor(st.a1 ? colors.parseColor("#00ff00") : colors.parseColor("#ff4444"));
            ui.t8.setText("CONTAS: " + st.ct.length);
        } catch(e) {}
    },
    
    copySerial: function() {
        if (!st.s1 || st.s1 === "N/A") {
            toast("Nenhum serial!");
            return;
        }
        try {
            var cb = context.getSystemService(android.content.Context.CLIPBOARD_SERVICE);
            cb.setPrimaryClip(android.content.ClipData.newPlainText("GBot Serial", st.s1));
            toast("Serial copiado!");
        } catch(e) {
            toast("Erro ao copiar!");
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
                    <text id="t3" text="SERIAL: Carregando..." textSize="11" textColor="#ffdd00" layout_weight="1" gravity="center"/>
                    <button id="b6" text="COPY" bg="#2a2a4a" textColor="#ffffff" w="30" h="30" marginLeft="4" textSize="11"/>
                </horizontal>
                <text id="t4" text="USER: N/A" textSize="12" textColor="#caf0f8" gravity="center"/>
                <text id="t5" text="VALIDADE: N/A" textSize="10" textColor="#caf0f8" gravity="center"/>
                <text id="t6" text="DIAS: Carregando..." textSize="10" textColor="#caf0f8" gravity="center"/>
                <horizontal gravity="center" marginTop="4">
                    <text id="t7" text="AGUARDANDO..." textSize="11" textColor="#ffaa00" layout_weight="1" gravity="center"/>
                    <text id="t8" text="CONTAS: 0" textSize="10" textColor="#caf0f8" marginLeft="8" gravity="center"/>
                </horizontal>
            </vertical>
        </frame>
        
        <frame bg="#0a0a2a" radius="6" padding="6" marginBottom="6">
            <text id="s3" text="Clique em Autorizar" textSize="10" textColor="#caf0f8" gravity="center"/>
        </frame>
        
        <horizontal marginBottom="4">
            <button id="b1" text="Autorizar" bg="#0077b6" textColor="#ffffff" layout_weight="0.33" marginRight="2"/>
            <button id="b2" text="Login" bg="#0077b6" textColor="#ffffff" layout_weight="0.33" marginLeft="2" marginRight="2"/>
            <button id="b3" text="Contas" bg="#2a2a4a" textColor="#ffffff" layout_weight="0.33" marginLeft="2"/>
        </horizontal>
        
        <horizontal marginBottom="4">
            <input id="i1" hint="Trip ID" textSize="10" layout_weight="0.5" bg="#2a2a4a" textColor="#ffffff" radius="4" padding="4" marginRight="2"/>
            <input id="i2" hint="lat, lng" textSize="10" layout_weight="0.5" bg="#2a2a4a" textColor="#ffffff" radius="4" padding="4" marginLeft="2"/>
        </horizontal>
        
        <horizontal marginBottom="4">
            <button id="b7" text="Trip" bg="#2a2a4a" textColor="#ffffff" layout_weight="0.2" marginRight="2"/>
            <button id="b8" text="Coord" bg="#2a2a4a" textColor="#ffffff" layout_weight="0.2" marginLeft="2" marginRight="2"/>
            <button id="b4" text="Buscar" bg="#0077b6" textColor="#ffffff" layout_weight="0.2" marginLeft="2" marginRight="2"/>
            <button id="b5" text="Finalizar" bg="#d62828" textColor="#ffffff" layout_weight="0.2" marginLeft="2"/>
        </horizontal>
        
        <frame layout_weight="1" bg="#0a0a1a" radius="6" padding="4">
            <vertical>
                <text text="Historico" textSize="8" textColor="#888" marginBottom="2"/>
                <scroll id="sv">
                    <text id="l1" text="Aguardando...\n" textSize="7" textColor="#666" lineSpacing="1.5"/>
                </scroll>
            </vertical>
        </frame>
        
        <button id="b9" text="Sair" bg="#6c757d" textColor="#ffffff" marginTop="4"/>
    </vertical>
);

// ============================================
// EVENTOS
// ============================================

ui.b1.click(function() { F.auth(); });
ui.b2.click(function() { F.showLogin(); });
ui.b3.click(function() { F.showAccounts(); });
ui.b6.click(function() { F.copySerial(); });

ui.b7.click(function() {
    dialogs.rawInput("Trip ID:", ui.i1.text(), function(id) {
        if (id) {
            st.t1 = id;
            ui.i1.setText(id);
            ui.s3.setText("Trip: " + id);
            F.log("Trip: " + id, 'info');
            toast("Trip: " + id);
        }
    });
});

ui.b8.click(function() {
    dialogs.rawInput("Coord (lat, lng):", ui.i2.text(), function(c) {
        if (c) {
            var p = c.split(',');
            if (p.length === 2) {
                var lat = parseFloat(p[0].trim());
                var lng = parseFloat(p[1].trim());
                if (!isNaN(lat) && !isNaN(lng)) {
                    st.c3 = [lat, lng];
                    ui.i2.setText(c);
                    ui.s3.setText("Coord definida");
                    F.log("Coord definida", 'info');
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

ui.b4.click(function() { F.buscaCli(); });
ui.b5.click(function() { F.finaliza(); });

ui.b9.click(function() {
    if (dialogs.confirm("Sair", "Deseja sair?")) {
        F.log("Saindo...", 'info');
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

st.s1 = F.getSerial();
ui.t3.setText("SERIAL: " + st.s1);
ui.s3.setText("Clique em Autorizar");

F.log("GBot V1 - By Nz iniciado", 'info');
F.log("Serial: " + st.s1, 'info');

F.testGit(function(ok) {
    if (ok) {
        F.log("GitHub OK!", 'ok');
    } else {
        F.log("GitHub: Falha!", 'err');
    }
});

toast("GBot V1 - By Nz");                    id = aid;
                    src = "Android ID";
                }
            } catch(e) {}
        }
        
        if (!id) {
            try {
                var bs = android.os.Build.getSerial();
                if (bs && bs.length > 0 && bs !== "unknown") {
                    id = bs;
                    src = "Build Serial";
                }
            } catch(e) {}
        }
        
        if (!id) {
            var u = java.util.UUID.randomUUID().toString().replace(/-/g, "").toUpperCase();
            id = u;
            src = "UUID";
        }
        
        try {
            var md5 = java.security.MessageDigest.getInstance("MD5");
            var h = md5.digest(new java.lang.String(id + "GBotFixo2024").getBytes());
            var r = "";
            for (var i = 0; i < h.length; i++) {
                var hex = java.lang.Integer.toHexString(h[i] & 0xFF);
                if (hex.length() === 1) hex = "0" + hex;
                r += hex;
            }
            var f = r.toUpperCase();
            st.s2 = id;
            return f;
        } catch(e) {
            st.s2 = id;
            return id.toUpperCase();
        }
    },
    
    getIP: function() {
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
    
    getModel: function() {
        try { return android.os.Build.MODEL || "N/A"; } catch(e) { return "N/A"; }
    },
    
    fmtDate: function(d) {
        try {
            var f = new java.text.SimpleDateFormat("yyyy-MM-dd");
            var dt = f.parse(d);
            var o = new java.text.SimpleDateFormat("dd/MM/yyyy");
            return o.format(dt);
        } catch(e) { return d; }
    },
    
    calcDays: function(d) {
        try {
            var f = new java.text.SimpleDateFormat("yyyy-MM-dd");
            var dt = f.parse(d);
            var diff = dt.getTime() - new Date().getTime();
            return Math.ceil(diff / (1000 * 60 * 60 * 24));
        } catch(e) { return null; }
    },
    
    toStr: function(obj) {
        if (typeof obj === 'string') return obj;
        if (obj === null || obj === undefined) return "";
        if (obj.toString) return obj.toString();
        return String(obj);
    },
    
    readGit: function(url, cb) {
        var h = {
            'User-Agent': 'GBot/1.0',
            'Accept': 'application/vnd.github.v3+json',
            'Authorization': 'token ' + GITHUB_TOKEN
        };
        
        F.req(url, 'GET', null, h, function(err, r) {
            if (err || !r || r.statusCode === 404 || r.statusCode !== 200) {
                cb(null, null);
                return;
            }
            try {
                var d = r.body.json();
                if (!d || !d.content) {
                    cb(null, null);
                    return;
                }
                var dec = android.util.Base64.decode(d.content, android.util.Base64.DEFAULT);
                var js = new java.lang.String(dec, "UTF-8");
                var s = F.toStr(js);
                if (s && s.length > 0) {
                    cb(d, s);
                } else {
                    cb(null, null);
                }
            } catch(e) {
                cb(null, null);
            }
        });
    },
    
    writeGit: function(url, content, sha, cb) {
        var sc = F.toStr(content);
        var bytes = new java.lang.String(sc).getBytes("UTF-8");
        var enc = android.util.Base64.encodeToString(bytes, android.util.Base64.NO_WRAP);
        
        var p = {
            message: "Auto update - GBot V1",
            content: enc,
            branch: "main"
        };
        if (sha && typeof sha === 'string' && sha.length > 0) {
            p.sha = sha;
        }
        
        var h = {
            'User-Agent': 'GBot/1.0',
            'Accept': 'application/vnd.github.v3+json',
            'Authorization': 'token ' + GITHUB_TOKEN,
            'Content-Type': 'application/json'
        };
        
        var ps = JSON.stringify(p);
        F.req(url, 'PUT', ps, h, function(err, r) {
            if (err || !r || (r.statusCode !== 200 && r.statusCode !== 201)) {
                if (r && r.statusCode === 422) {
                    F.readGit(url, function(d, c) {
                        if (d && d.sha) {
                            var np = p;
                            np.sha = d.sha;
                            var nps = JSON.stringify(np);
                            F.req(url, 'PUT', nps, h, function(e2, r2) {
                                if (cb) cb(!e2 && r2 && (r2.statusCode === 200 || r2.statusCode === 201));
                            });
                        } else {
                            if (cb) cb(false);
                        }
                    });
                } else {
                    if (cb) cb(false);
                }
            } else {
                if (cb) cb(true);
            }
        });
    },
    
    testGit: function(cb) {
        var h = {
            'User-Agent': 'GBot/1.0',
            'Accept': 'application/vnd.github.v3+json',
            'Authorization': 'token ' + GITHUB_TOKEN
        };
        
        F.req(URL_REPO_API, 'GET', null, h, function(err, r) {
            if (err || !r || r.statusCode !== 200) {
                if (cb) cb(false);
                return;
            }
            try {
                var d = r.body.json();
                st.r1 = {
                    n1: d.full_name || "N/A",
                    n2: d.stargazers_count || 0
                };
                if (cb) cb(true);
            } catch(e) {
                if (cb) cb(false);
            }
        });
    },
    
    registerDevice: function(cb) {
        F.readGit(URL_DEVICES_API, function(d, c) {
            var devices = [];
            var sha = null;
            
            if (d && c && typeof c === 'string' && c.length > 0) {
                try {
                    var p = JSON.parse(c);
                    devices = p.devices || [];
                    sha = d.sha;
                } catch(e) {}
            }
            
            var exists = false;
            for (var i = 0; i < devices.length; i++) {
                if (devices[i].serial === st.s1) {
                    exists = true;
                    devices[i].ultimo_acesso = new Date().toISOString();
                    devices[i].ip = F.getIP();
                    devices[i].ativo = true;
                    break;
                }
            }
            
            if (!exists) {
                devices.push({
                    serial: st.s1,
                    serialOriginal: st.s2,
                    modelo: F.getModel(),
                    ip: F.getIP(),
                    data_registro: new Date().toISOString(),
                    ultimo_acesso: new Date().toISOString(),
                    ativo: true
                });
            }
            
            var jc = JSON.stringify({ devices: devices }, null, 2);
            F.writeGit(URL_DEVICES_API, jc, sha, function(success) {
                if (cb) cb(success);
            });
        });
    },
    
    auth: function() {
        st.s1 = F.getSerial();
        F.log("Serial: " + st.s1, 'info');
        
        ui.b1.setEnabled(false);
        ui.b1.setText("Aguarde...");
        ui.s3.setText("Verificando...");

        F.testGit(function(ok) {
            if (!ok) {
                ui.b1.setEnabled(true);
                ui.b1.setText("Autorizar");
                ui.s3.setText("GitHub: Falha!");
                toast("Falha no GitHub!");
                return;
            }
            
            F.registerDevice(function(registered) {
                F.readGit(URL_SERIAL_API, function(d2, c2) {
                    ui.b1.setEnabled(true);
                    ui.b1.setText("Autorizar");
                    
                    if (!c2) {
                        ui.s3.setText("Falha!");
                        toast("Falha!");
                        return;
                    }
                    
                    try {
                        var json = c2.trim();
                        if (json.charCodeAt(0) === 0xFEFF) json = json.substring(1);
                        var data = JSON.parse(json);
                        var list = data.seriais || data.s || [];
                        
                        var current = st.s1.toLowerCase();
                        var found = false;
                        
                        for (var i = 0; i < list.length; i++) {
                            var item = list[i];
                            var serial = item.serial || (item.length >= 2 ? item[1] : null);
                            if (serial) {
                                var norm = serial.toString().trim().toLowerCase();
                                if (norm === current) {
                                    found = true;
                                    st.u1 = item.nome || (item.length >= 3 ? item[2] : "Usuario");
                                    st.v1 = item.validade || (item.length >= 4 ? item[3] : null);
                                    st.d1 = st.v1 ? F.calcDays(st.v1) : null;
                                    st.a1 = true;
                                    F.log("Autorizado: " + st.u1, 'ok');
                                    break;
                                }
                            }
                        }
                        
                        if (found) {
                            F.updateUI();
                            ui.s3.setText("OK: " + st.u1);
                            toast("Autorizado!");
                        } else {
                            ui.s3.setText("Nao autorizado!");
                            toast("Nao autorizado!");
                        }
                    } catch(e) {
                        ui.s3.setText("Erro!");
                        toast("Erro!");
                    }
                });
            });
        });
    },
    
    validToken: function(t) {
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
    
    useAccount: function(c) {
        st.at = c;
        st.t2 = "Bearer " + c.token;
        st.a2 = true;
        ui.b2.setText("Logout");
        ui.s3.setText("Conta: " + c.nome);
        F.log("Conta: " + c.nome, 'user');
        toast(c.nome);
        F.updateUI();
    },
    
    selectAccount: function(idx) {
        if (idx < 0 || idx >= st.ct.length) return;
        var c = st.ct[idx];
        
        if (!F.validToken(c.token)) {
            if (c.refresh) {
                var p = {
                    device_token: DEVICE_TOKEN,
                    base_path: "file:///data/user/0/com.by4java.girossmototaxista/files/"
                };
                var h = {
                    'User-Agent': "okhttp/4.9.2",
                    'Accept': "application/json",
                    'Content-Type': "application/json",
                    'authorization': c.refresh
                };
                F.req(REFRESH_URL, 'POST', p, h, function(err, r) {
                    if (err || r.statusCode !== 200) {
                        dialogs.rawInput("Senha da conta " + c.nome + ":", "", function(s) {
                            if (s) F.doLogin(c.cpf, s);
                        });
                        return;
                    }
                    try {
                        var d = r.body.json();
                        var t = d.token || d.access_token || null;
                        if (t) {
                            t = t.replace('Bearer ', '').trim();
                            c.token = t;
                            F.useAccount(c);
                        }
                    } catch(e) {}
                });
            } else {
                dialogs.rawInput("Senha da conta " + c.nome + ":", "", function(s) {
                    if (s) F.doLogin(c.cpf, s);
                });
            }
            return;
        }
        F.useAccount(c);
    },
    
    showAccounts: function() {
        if (st.ct.length === 0) {
            toast("Nenhuma conta");
            return;
        }
        
        var items = [];
        for (var i = 0; i < st.ct.length; i++) {
            var c = st.ct[i];
            var mask = c.cpf.substring(0, 3) + ".***.***-" + c.cpf.substring(c.cpf.length - 2);
            var status = F.validToken(c.token) ? " OK" : " EXP";
            var ativo = st.at && st.at.cpf === c.cpf ? " ATIVO" : "";
            items.push(c.nome + " (" + mask + ")" + status + ativo);
        }
        
        dialogs.build({
            title: "Contas (" + st.ct.length + ")",
            items: items,
            positive: "Selecionar",
            negative: "Cancelar",
            neutral: "Remover Todas"
        }).on("item", function(i) {
            F.selectAccount(i);
        }).on("neutral", function() {
            if (dialogs.confirm("Remover Todas", "Remover todas?")) {
                st.ct = [];
                st.at = null;
                st.a2 = false;
                st.t2 = null;
                ui.b2.setText("Login");
                toast("Removidas!");
            }
        }).show();
    },
    
    doLogin: function(cpf, senha) {
        if (!st.a1) {
            toast("Autorize o dispositivo!");
            return;
        }
        if (st.d1 !== null && st.d1 < 0) {
            toast("Serial expirado!");
            return;
        }
        
        ui.b2.setEnabled(false);
        ui.b2.setText("Aguarde...");
        ui.s3.setText("Logando...");
        
        var p = {
            document: cpf,
            password: senha,
            device_type: "android",
            device_id: "fe1007a9fc0c3895",
            device_token: DEVICE_TOKEN,
            app_version: "112.117.0",
            refresh_token: "",
            detected_apps: []
        };
        
        var h = {
            'User-Agent': "okhttp/4.9.2",
            'Accept': "application/json",
            'Content-Type': "application/json"
        };
        
        F.req(LOGIN_URL, 'POST', p, h, function(err, r) {
            ui.b2.setEnabled(true);
            ui.b2.setText("Login");
            
            if (err || r.statusCode > 201) {
                ui.s3.setText("Login falhou!");
                toast("Login falhou!");
                return;
            }
            
            try {
                var d = r.body.json();
                var t = d.access_token || d.token;
                var rt = d.refresh_token || null;
                
                if (t) {
                    t = t.replace('Bearer ', '').trim();
                    var nome = d.first_name || d.name || "Usuario";
                    
                    var exists = false;
                    for (var i = 0; i < st.ct.length; i++) {
                        if (st.ct[i].cpf === cpf) {
                            st.ct[i].token = t;
                            st.ct[i].refresh = rt || st.ct[i].refresh;
                            st.ct[i].nome = nome;
                            st.at = st.ct[i];
                            exists = true;
                            break;
                        }
                    }
                    
                    if (!exists) {
                        st.ct.push({
                            cpf: cpf,
                            nome: nome,
                            token: t,
                            refresh: rt
                        });
                        st.at = st.ct[st.ct.length - 1];
                    }
                    
                    st.t2 = "Bearer " + t;
                    st.a2 = true;
                    ui.b2.setText("Logout");
                    ui.s3.setText("OK: " + nome);
                    F.log("Login: " + nome, 'ok');
                    toast("Login!");
                    F.updateUI();
                } else {
                    ui.s3.setText("Token nao encontrado!");
                    toast("Token!");
                }
            } catch(e) {
                ui.s3.setText("Erro!");
                toast("Erro!");
            }
        });
    },
    
    showLogin: function() {
        if (!st.a1) {
            toast("Autorize o dispositivo!");
            return;
        }
        if (st.d1 !== null && st.d1 < 0) {
            toast("Serial expirado!");
            return;
        }
        
        if (st.a2) {
            dialogs.build({
                title: "Conta Atual",
                items: ["Logout", "Trocar Conta", "Cancelar"],
                positive: "OK",
                negative: "Cancelar"
            }).on("item", function(i) {
                if (i === 0) {
                    st.a2 = false;
                    st.t2 = null;
                    st.at = null;
                    ui.b2.setText("Login");
                    ui.s3.setText("Logout");
                    toast("Logout!");
                } else if (i === 1) {
                    F.showAccounts();
                }
            }).show();
            return;
        }
        
        if (st.ct.length > 0) {
            dialogs.build({
                title: st.ct.length + " contas",
                items: ["Usar Conta Existente", "Nova Conta", "Cancelar"],
                positive: "OK",
                negative: "Cancelar"
            }).on("item", function(i) {
                if (i === 0) F.showAccounts();
                else if (i === 1) F.newLogin();
            }).show();
        } else {
            F.newLogin();
        }
    },
    
    newLogin: function() {
        dialogs.rawInput("CPF:", "", function(c) {
            if (!c || c.replace(/\D/g, '').length < 11) {
                toast("CPF invalido!");
                return;
            }
            c = c.replace(/\D/g, '');
            dialogs.rawInput("Senha:", "", function(s) {
                if (!s) {
                    toast("Senha obrigatoria!");
                    return;
                }
                F.doLogin(c, s);
            });
        });
    },
    
    buscaCli: function() {
        if (!st.t1) {
            toast("Defina o Trip ID!");
            return;
        }
        if (!st.t2) {
            toast("Fac.a login!");
            return;
        }
        if (!st.c3) {
            toast("Defina a coordenada!");
            return;
        }
        
        ui.b4.setEnabled(false);
        ui.b4.setText("Aguarde...");
        ui.s3.setText("Buscando...");
        
        var url = API_URL + st.t1;
        var h = {
            'User-Agent': "okhttp/4.9.2",
            'Accept': "application/json",
            'Content-Type': "application/json",
            'authorization': st.t2
        };
        
        var p1 = {
            status: "ARRIVED",
            cordination: st.c3,
            mock: false,
            destination_id: 0
        };
        
        F.req(url, 'PUT', p1, h, function(err, r) {
            if (err || r.statusCode !== 200) {
                ui.b4.setEnabled(true);
                ui.b4.setText("Buscar");
                ui.s3.setText("Falha!");
                F.log("Falha no ARRIVED: " + (r ? r.statusCode : err), 'err');
                toast("Falha!");
                return;
            }
            
            try {
                var d = r.body.json();
                var dist = d.distance || d.UserRequest?.distance || d.data?.distance;
                
                if (dist) {
                    st.c4 = dist;
                    F.log("Distance: " + dist, 'ok');
                    
                    var p2 = {
                        status: "ARRIVED",
                        cordination: [parseFloat(dist)],
                        mock: false,
                        destination_id: 0
                    };
                    
                    F.req(url, 'PUT', p2, h, function(e2, r2) {
                        ui.b4.setEnabled(true);
                        ui.b4.setText("Buscar");
                        
                        if (e2 || r2.statusCode !== 200) {
                            ui.s3.setText("Falha!");
                            F.log("Falha no 2o ARRIVED: " + (r2 ? r2.statusCode : e2), 'err');
                            toast("Falha!");
                            return;
                        }
                        
                        try {
                            var d2 = r2.body.json();
                            var dest = d2.userRequestDestinations || d2.UserRequest?.userRequestDestinations || [];
                            
                            if (dest.length > 0) {
                                st.c1 = dest[0].id;
                                F.log("Cliente ID: " + st.c1, 'ok');
                                ui.s3.setText("Cliente encontrado!");
                                toast("Cliente!");
                                if (dest.length > 1) {
                                    st.c2 = dest[1].id;
                                    F.log("Cliente 2: " + st.c2, 'info');
                                }
                            } else {
                                ui.s3.setText("Nenhum destino!");
                                toast("Nenhum destino!");
                            }
                        } catch(e) {
                            ui.s3.setText("Erro!");
                            toast("Erro!");
                        }
                    });
                } else {
                    ui.b4.setEnabled(true);
                    ui.b4.setText("Buscar");
                    ui.s3.setText("Distance nao encontrado!");
                    toast("Distance!");
                }
            } catch(e) {
                ui.b4.setEnabled(true);
                ui.b4.setText("Buscar");
                ui.s3.setText("Erro!");
                toast("Erro!");
            }
        });
    },
    
    finaliza: function() {
        if (!st.t1) {
            toast("Defina o Trip ID!");
            return;
        }
        if (!st.t2) {
            toast("Fac.a login!");
            return;
        }
        if (!st.c1) {
            toast("Busque o cliente!");
            return;
        }
        if (!st.c4) {
            toast("Sem distance!");
            return;
        }
        
        ui.b5.setEnabled(false);
        ui.b5.setText("Aguarde...");
        ui.s3.setText("Finalizando...");
        
        var url = API_URL + st.t1;
        var h = {
            'User-Agent': "okhttp/4.9.2",
            'Accept': "application/json",
            'Content-Type': "application/json",
            'authorization': st.t2
        };
        
        var coord = [parseFloat(st.c4)];
        var p1 = {
            status: "COMPLETED",
            cordination: coord,
            mock: false,
            destination_id: parseInt(st.c1)
        };
        
        F.req(url, 'PUT', p1, h, function(err, r) {
            ui.b5.setEnabled(true);
            ui.b5.setText("Finalizar");
            
            if (err || r.statusCode !== 200) {
                ui.s3.setText("Falha!");
                F.log("Falha na finalizacao: " + (r ? r.statusCode : err), 'err');
                toast("Falha!");
                return;
            }
            
            F.log("Corrida finalizada", 'ok');
            ui.s3.setText("Corrida finalizada!");
            toast("Corrida finalizada!");
            
            if (st.c2) {
                var p2 = {
                    status: "COMPLETED",
                    cordination: coord,
                    mock: false,
                    destination_id: parseInt(st.c2)
                };
                F.req(url, 'PUT', p2, h, function() {
                    F.log("2a finalizacao OK", 'ok');
                });
            }
            
            st.t1 = null;
            st.c1 = null;
            st.c2 = null;
            st.c4 = null;
            ui.i1.setText("");
        });
    },
    
    updateUI: function() {
        try {
            var nome = st.u1 || "N/A";
            var val = st.v1 ? F.fmtDate(st.v1) : "N/A";
            var dias = st.d1 !== null ? st.d1 : "N/A";
            
            ui.t3.setText("SERIAL: " + st.s1);
            ui.t3.setTextColor(st.a1 ? colors.parseColor("#00ff00") : colors.parseColor("#ff4444"));
            ui.t4.setText("USER: " + nome);
            ui.t5.setText("VALIDADE: " + val);
            
            if (dias !== "N/A" && dias < 0) {
                ui.t6.setText("EXPIRADO!");
                ui.t6.setTextColor(colors.parseColor("#ff4444"));
            } else if (dias !== "N/A" && dias <= 7) {
                ui.t6.setText(dias + " dias restantes");
                ui.t6.setTextColor(colors.parseColor("#ffaa00"));
            } else if (dias !== "N/A") {
                ui.t6.setText(dias + " dias");
                ui.t6.setTextColor(colors.parseColor("#00ff00"));
            } else {
                ui.t6.setText("Sem validade");
                ui.t6.setTextColor(colors.parseColor("#caf0f8"));
            }
            
            ui.t7.setText(st.a1 ? "ATIVO" : "INATIVO");
            ui.t7.setTextColor(st.a1 ? colors.parseColor("#00ff00") : colors.parseColor("#ff4444"));
            ui.t8.setText("CONTAS: " + st.ct.length);
        } catch(e) {}
    },
    
    copySerial: function() {
        if (!st.s1 || st.s1 === "N/A") {
            toast("Nenhum serial!");
            return;
        }
        try {
            var cb = context.getSystemService(android.content.Context.CLIPBOARD_SERVICE);
            cb.setPrimaryClip(android.content.ClipData.newPlainText("GBot Serial", st.s1));
            toast("Serial copiado!");
        } catch(e) {
            toast("Erro ao copiar!");
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
        
        <!-- PERFIL -->
        <frame bg="#16213e" radius="8" padding="8" marginBottom="6">
            <vertical>
                <horizontal gravity="center" marginBottom="4">
                    <text id="t3" text="SERIAL: Carregando..." textSize="11" textColor="#ffdd00" layout_weight="1" gravity="center"/>
                    <button id="b6" text="COPY" bg="#2a2a4a" textColor="#ffffff" w="30" h="30" marginLeft="4" textSize="11"/>
                </horizontal>
                <text id="t4" text="USER: N/A" textSize="12" textColor="#caf0f8" gravity="center"/>
                <text id="t5" text="VALIDADE: N/A" textSize="10" textColor="#caf0f8" gravity="center"/>
                <text id="t6" text="DIAS: Carregando..." textSize="10" textColor="#caf0f8" gravity="center"/>
                <horizontal gravity="center" marginTop="4">
                    <text id="t7" text="AGUARDANDO..." textSize="11" textColor="#ffaa00" layout_weight="1" gravity="center"/>
                    <text id="t8" text="CONTAS: 0" textSize="10" textColor="#caf0f8" marginLeft="8" gravity="center"/>
                </horizontal>
            </vertical>
        </frame>
        
        <!-- STATUS -->
        <frame bg="#0a0a2a" radius="6" padding="6" marginBottom="6">
            <text id="s3" text="Clique em Autorizar" textSize="10" textColor="#caf0f8" gravity="center"/>
        </frame>
        
        <!-- BOTÕES PRINCIPAIS -->
        <horizontal marginBottom="4">
            <button id="b1" text="Autorizar" bg="#0077b6" textColor="#ffffff" layout_weight="0.33" marginRight="2"/>
            <button id="b2" text="Login" bg="#0077b6" textColor="#ffffff" layout_weight="0.33" marginLeft="2" marginRight="2"/>
            <button id="b3" text="Contas" bg="#2a2a4a" textColor="#ffffff" layout_weight="0.33" marginLeft="2"/>
        </horizontal>
        
        <!-- INPUTS -->
        <horizontal marginBottom="4">
            <input id="i1" hint="Trip ID" textSize="10" layout_weight="0.5" bg="#2a2a4a" textColor="#ffffff" radius="4" padding="4" marginRight="2"/>
            <input id="i2" hint="lat, lng" textSize="10" layout_weight="0.5" bg="#2a2a4a" textColor="#ffffff" radius="4" padding="4" marginLeft="2"/>
        </horizontal>
        
        <!-- BOTÕES SECUNDÁRIOS -->
        <horizontal marginBottom="4">
            <button id="b7" text="Trip" bg="#2a2a4a" textColor="#ffffff" layout_weight="0.2" marginRight="2"/>
            <button id="b8" text="Coord" bg="#2a2a4a" textColor="#ffffff" layout_weight="0.2" marginLeft="2" marginRight="2"/>
            <button id="b4" text="Buscar" bg="#0077b6" textColor="#ffffff" layout_weight="0.2" marginLeft="2" marginRight="2"/>
            <button id="b5" text="Finalizar" bg="#d62828" textColor="#ffffff" layout_weight="0.2" marginLeft="2"/>
        </horizontal>
        
        <!-- LOG -->
        <frame layout_weight="1" bg="#0a0a1a" radius="6" padding="4">
            <vertical>
                <text text="Historico" textSize="8" textColor="#888" marginBottom="2"/>
                <scroll id="sv">
                    <text id="l1" text="Aguardando...\n" textSize="7" textColor="#666" lineSpacing="1.5"/>
                </scroll>
            </vertical>
        </frame>
        
        <!-- SAIR -->
        <button id="b9" text="Sair" bg="#6c757d" textColor="#ffffff" marginTop="4"/>
    </vertical>
);

// ============================================
// EVENTOS
// ============================================

ui.b1.click(function() { F.auth(); });
ui.b2.click(function() { F.showLogin(); });
ui.b3.click(function() { F.showAccounts(); });
ui.b6.click(function() { F.copySerial(); });

ui.b7.click(function() {
    dialogs.rawInput("Trip ID:", ui.i1.text(), function(id) {
        if (id) {
            st.t1 = id;
            ui.i1.setText(id);
            ui.s3.setText("Trip: " + id);
            F.log("Trip: " + id, 'info');
            toast("Trip: " + id);
        }
    });
});

ui.b8.click(function() {
    dialogs.rawInput("Coord (lat, lng):", ui.i2.text(), function(c) {
        if (c) {
            var p = c.split(',');
            if (p.length === 2) {
                var lat = parseFloat(p[0].trim());
                var lng = parseFloat(p[1].trim());
                if (!isNaN(lat) && !isNaN(lng)) {
                    st.c3 = [lat, lng];
                    ui.i2.setText(c);
                    ui.s3.setText("Coord definida");
                    F.log("Coord definida", 'info');
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

ui.b4.click(function() { F.buscaCli(); });
ui.b5.click(function() { F.finaliza(); });

ui.b9.click(function() {
    if (dialogs.confirm("Sair", "Deseja sair?")) {
        F.log("Saindo...", 'info');
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

st.s1 = F.getSerial();
ui.t3.setText("SERIAL: " + st.s1);
ui.s3.setText("Clique em Autorizar");

F.log("GBot V1 - By Nz iniciado", 'info');
F.log("Serial: " + st.s1, 'info');

F.testGit(function(ok) {
    if (ok) {
        F.log("GitHub OK!", 'ok');
    } else {
        F.log("GitHub: Falha!", 'err');
    }
});

toast("GBot V1 - By Nz");        
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
