// ============================================
// 🚀 GBot Launcher - AutoJS6
// VERSÃO SEM PASTEBIN - APENAS FUNCIONALIDADES
// ============================================

"ui";

// ============================================
// CONFIGURAÇÕES
// ============================================

var LOGIN_URL = "https://api.giross.com.br/api/provider/oauth/token";
var REFRESH_URL = "https://api.giross.com.br/api/provider/refresh/fmc_token";
var API_URL = "https://api.giross.com.br/api/provider/trip/";
var DEVICE_TOKEN = "eubcB-jeSluQalzx0sSzXV:APA91bHoLVECLtPNxNxxNkN_17hj66HYduxf-2ludzzavkdrnNwWuYcR2RAIVbDJz7mTzw5jqrrybrHZ3krcqMzqjf6xsSWWoIGbi3xYxIzaZl9IwSFhtrQ";

// ============================================
// ESTADO DO SISTEMA
// ============================================

var st = {
    t1: null, t2: null, c1: null, c2: null,
    c3: null, c4: null, s1: null,
    a1: true, a2: false, u1: null, v1: null, d1: null,
    ct: [], at: null, lg: []
};

// ============================================
// FUNÇÕES
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
        try {
            var aid = android.provider.Settings.Secure.getString(
                context.getContentResolver(),
                android.provider.Settings.Secure.ANDROID_ID
            );
            if (aid && aid.length > 0) {
                return aid.toUpperCase();
            }
        } catch(e) {}
        
        try {
            var bs = android.os.Build.getSerial();
            if (bs && bs.length > 0 && bs !== "unknown") {
                return "SER_" + bs.substring(0, 8).toUpperCase();
            }
        } catch(e) {}
        
        return "DEV_" + java.util.UUID.randomUUID().toString().replace(/-/g, "").substring(0, 12).toUpperCase();
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
    
    auth: function() {
        st.s1 = F.getSerial();
        st.a1 = true;
        st.u1 = "Usuario";
        st.v1 = "3000-12-31";
        st.d1 = F.calcDays(st.v1);
        
        F.log("Serial: " + st.s1, 'info');
        F.log("✅ Autorizado automático", 'ok');
        F.updateUI();
        ui.s3.setText("✅ Autorizado");
        toast("✅ Autorizado!");
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

toast("GBot V1 - By Nz");
