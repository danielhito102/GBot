// ============================================
// 🚗 GBot Finalizador - By Nz
// SEM SERIAL - APENAS FUNÇÕES DE FINALIZAÇÃO
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
// ESTADO
// ============================================

var state = {
    tripId: null,
    token: null,
    clienteId: null,
    clienteId2: null,
    coordenada: null,
    distance: null,
    logado: false,
    contas: [],
    contaAtual: null
};

// ============================================
// FUNÇÕES DO FINALIZADOR
// ============================================

var F = {
    log: function(msg, tipo) {
        var d = new Date().toLocaleString('pt-BR');
        var ic = "[i]";
        if (tipo === 'ok') ic = "[OK]";
        else if (tipo === 'err') ic = "[ERRO]";
        else if (tipo === 'warn') ic = "[AVISO]";
        else if (tipo === 'user') ic = "[USER]";
        
        var e = "[" + d + "] " + ic + " " + msg + "\n";
        
        try {
            var v = ui.logText;
            if (v) {
                var txt = v.text();
                var lines = txt.split('\n');
                if (lines.length > 200) lines.splice(0, 50);
                lines.push(e);
                v.setText(lines.join('\n'));
                ui.logScroll.scrollTo(0, v.getHeight());
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
        state.contaAtual = c;
        state.token = "Bearer " + c.token;
        state.logado = true;
        ui.btnLogin.setText("Logout");
        ui.statusText.setText("Conta: " + c.nome);
        F.log("Conta: " + c.nome, 'user');
        toast(c.nome);
        F.updateUI();
    },
    
    selectAccount: function(idx) {
        if (idx < 0 || idx >= state.contas.length) return;
        var c = state.contas[idx];
        
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
        if (state.contas.length === 0) {
            toast("Nenhuma conta");
            return;
        }
        
        var items = [];
        for (var i = 0; i < state.contas.length; i++) {
            var c = state.contas[i];
            var mask = c.cpf.substring(0, 3) + ".***.***-" + c.cpf.substring(c.cpf.length - 2);
            var status = F.validToken(c.token) ? " OK" : " EXP";
            var ativo = state.contaAtual && state.contaAtual.cpf === c.cpf ? " ATIVO" : "";
            items.push(c.nome + " (" + mask + ")" + status + ativo);
        }
        
        dialogs.build({
            title: "Contas (" + state.contas.length + ")",
            items: items,
            positive: "Selecionar",
            negative: "Cancelar",
            neutral: "Remover Todas"
        }).on("item", function(i) {
            F.selectAccount(i);
        }).on("neutral", function() {
            if (dialogs.confirm("Remover Todas", "Remover todas?")) {
                state.contas = [];
                state.contaAtual = null;
                state.logado = false;
                state.token = null;
                ui.btnLogin.setText("Login");
                toast("Removidas!");
            }
        }).show();
    },
    
    doLogin: function(cpf, senha) {
        ui.btnLogin.setEnabled(false);
        ui.btnLogin.setText("Aguarde...");
        ui.statusText.setText("Logando...");
        
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
            ui.btnLogin.setEnabled(true);
            ui.btnLogin.setText("Login");
            
            if (err || r.statusCode > 201) {
                ui.statusText.setText("Login falhou!");
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
                    for (var i = 0; i < state.contas.length; i++) {
                        if (state.contas[i].cpf === cpf) {
                            state.contas[i].token = t;
                            state.contas[i].refresh = rt || state.contas[i].refresh;
                            state.contas[i].nome = nome;
                            state.contaAtual = state.contas[i];
                            exists = true;
                            break;
                        }
                    }
                    
                    if (!exists) {
                        state.contas.push({
                            cpf: cpf,
                            nome: nome,
                            token: t,
                            refresh: rt
                        });
                        state.contaAtual = state.contas[state.contas.length - 1];
                    }
                    
                    state.token = "Bearer " + t;
                    state.logado = true;
                    ui.btnLogin.setText("Logout");
                    ui.statusText.setText("OK: " + nome);
                    F.log("Login: " + nome, 'ok');
                    toast("Login!");
                    F.updateUI();
                } else {
                    ui.statusText.setText("Token nao encontrado!");
                    toast("Token!");
                }
            } catch(e) {
                ui.statusText.setText("Erro!");
                toast("Erro!");
            }
        });
    },
    
    showLogin: function() {
        if (state.logado) {
            dialogs.build({
                title: "Conta Atual",
                items: ["Logout", "Trocar Conta", "Cancelar"],
                positive: "OK",
                negative: "Cancelar"
            }).on("item", function(i) {
                if (i === 0) {
                    state.logado = false;
                    state.token = null;
                    state.contaAtual = null;
                    ui.btnLogin.setText("Login");
                    ui.statusText.setText("Logout");
                    toast("Logout!");
                } else if (i === 1) {
                    F.showAccounts();
                }
            }).show();
            return;
        }
        
        if (state.contas.length > 0) {
            dialogs.build({
                title: state.contas.length + " contas",
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
        if (!state.tripId) {
            toast("Defina o Trip ID!");
            return;
        }
        if (!state.token) {
            toast("Fac.a login!");
            return;
        }
        if (!state.coordenada) {
            toast("Defina a coordenada!");
            return;
        }
        
        ui.btnBuscar.setEnabled(false);
        ui.btnBuscar.setText("Aguarde...");
        ui.statusText.setText("Buscando...");
        
        var url = API_URL + state.tripId;
        var h = {
            'User-Agent': "okhttp/4.9.2",
            'Accept': "application/json",
            'Content-Type': "application/json",
            'authorization': state.token
        };
        
        var p1 = {
            status: "ARRIVED",
            cordination: state.coordenada,
            mock: false,
            destination_id: 0
        };
        
        F.req(url, 'PUT', p1, h, function(err, r) {
            if (err || r.statusCode !== 200) {
                ui.btnBuscar.setEnabled(true);
                ui.btnBuscar.setText("Buscar");
                ui.statusText.setText("Falha!");
                F.log("Falha no ARRIVED: " + (r ? r.statusCode : err), 'err');
                toast("Falha!");
                return;
            }
            
            try {
                var d = r.body.json();
                var dist = d.distance || d.UserRequest?.distance || d.data?.distance;
                
                if (dist) {
                    state.distance = dist;
                    F.log("Distance: " + dist, 'ok');
                    
                    var p2 = {
                        status: "ARRIVED",
                        cordination: [parseFloat(dist)],
                        mock: false,
                        destination_id: 0
                    };
                    
                    F.req(url, 'PUT', p2, h, function(e2, r2) {
                        ui.btnBuscar.setEnabled(true);
                        ui.btnBuscar.setText("Buscar");
                        
                        if (e2 || r2.statusCode !== 200) {
                            ui.statusText.setText("Falha!");
                            F.log("Falha no 2o ARRIVED: " + (r2 ? r2.statusCode : e2), 'err');
                            toast("Falha!");
                            return;
                        }
                        
                        try {
                            var d2 = r2.body.json();
                            var dest = d2.userRequestDestinations || d2.UserRequest?.userRequestDestinations || [];
                            
                            if (dest.length > 0) {
                                state.clienteId = dest[0].id;
                                F.log("Cliente ID: " + state.clienteId, 'ok');
                                ui.statusText.setText("Cliente encontrado!");
                                toast("Cliente!");
                                if (dest.length > 1) {
                                    state.clienteId2 = dest[1].id;
                                    F.log("Cliente 2: " + state.clienteId2, 'info');
                                }
                            } else {
                                ui.statusText.setText("Nenhum destino!");
                                toast("Nenhum destino!");
                            }
                        } catch(e) {
                            ui.statusText.setText("Erro!");
                            toast("Erro!");
                        }
                    });
                } else {
                    ui.btnBuscar.setEnabled(true);
                    ui.btnBuscar.setText("Buscar");
                    ui.statusText.setText("Distance nao encontrado!");
                    toast("Distance!");
                }
            } catch(e) {
                ui.btnBuscar.setEnabled(true);
                ui.btnBuscar.setText("Buscar");
                ui.statusText.setText("Erro!");
                toast("Erro!");
            }
        });
    },
    
    finaliza: function() {
        if (!state.tripId) {
            toast("Defina o Trip ID!");
            return;
        }
        if (!state.token) {
            toast("Fac.a login!");
            return;
        }
        if (!state.clienteId) {
            toast("Busque o cliente!");
            return;
        }
        if (!state.distance) {
            toast("Sem distance!");
            return;
        }
        
        ui.btnFinalizar.setEnabled(false);
        ui.btnFinalizar.setText("Aguarde...");
        ui.statusText.setText("Finalizando...");
        
        var url = API_URL + state.tripId;
        var h = {
            'User-Agent': "okhttp/4.9.2",
            'Accept': "application/json",
            'Content-Type': "application/json",
            'authorization': state.token
        };
        
        var coord = [parseFloat(state.distance)];
        var p1 = {
            status: "COMPLETED",
            cordination: coord,
            mock: false,
            destination_id: parseInt(state.clienteId)
        };
        
        F.req(url, 'PUT', p1, h, function(err, r) {
            ui.btnFinalizar.setEnabled(true);
            ui.btnFinalizar.setText("Finalizar");
            
            if (err || r.statusCode !== 200) {
                ui.statusText.setText("Falha!");
                F.log("Falha na finalizacao: " + (r ? r.statusCode : err), 'err');
                toast("Falha!");
                return;
            }
            
            F.log("Corrida finalizada", 'ok');
            ui.statusText.setText("Corrida finalizada!");
            toast("Corrida finalizada!");
            
            if (state.clienteId2) {
                var p2 = {
                    status: "COMPLETED",
                    cordination: coord,
                    mock: false,
                    destination_id: parseInt(state.clienteId2)
                };
                F.req(url, 'PUT', p2, h, function() {
                    F.log("2a finalizacao OK", 'ok');
                });
            }
            
            state.tripId = null;
            state.clienteId = null;
            state.clienteId2 = null;
            state.distance = null;
            ui.inputTrip.setText("");
        });
    },
    
    updateUI: function() {
        try {
            ui.contasCount.setText("CONTAS: " + state.contas.length);
        } catch(e) {}
    }
};

// ============================================
// INTERFACE
// ============================================

ui.layout(
    <vertical bg="#1a1a2e" padding="8">
        <text text="🚗 GBot Finalizador" textSize="18" textColor="#00b4d8" textStyle="bold" gravity="center"/>
        <text text="Sem Serial - By Nz" textSize="10" textColor="#90e0ef" gravity="center" marginBottom="6"/>
        
        <frame bg="#16213e" radius="8" padding="8" marginBottom="6">
            <vertical>
                <text id="statusText" text="Clique em Login" textSize="12" textColor="#caf0f8" gravity="center"/>
                <horizontal gravity="center" marginTop="4">
                    <text id="contasCount" text="CONTAS: 0" textSize="10" textColor="#caf0f8" gravity="center"/>
                </horizontal>
            </vertical>
        </frame>
        
        <horizontal marginBottom="4">
            <button id="btnLogin" text="Login" bg="#0077b6" textColor="#ffffff" layout_weight="0.5" marginRight="2"/>
            <button id="btnContas" text="Contas" bg="#2a2a4a" textColor="#ffffff" layout_weight="0.5" marginLeft="2"/>
        </horizontal>
        
        <horizontal marginBottom="4">
            <input id="inputTrip" hint="Trip ID" textSize="10" layout_weight="0.5" bg="#2a2a4a" textColor="#ffffff" radius="4" padding="4" marginRight="2"/>
            <input id="inputCoord" hint="lat, lng" textSize="10" layout_weight="0.5" bg="#2a2a4a" textColor="#ffffff" radius="4" padding="4" marginLeft="2"/>
        </horizontal>
        
        <horizontal marginBottom="4">
            <button id="btnTrip" text="Trip" bg="#2a2a4a" textColor="#ffffff" layout_weight="0.2" marginRight="2"/>
            <button id="btnCoord" text="Coord" bg="#2a2a4a" textColor="#ffffff" layout_weight="0.2" marginLeft="2" marginRight="2"/>
            <button id="btnBuscar" text="Buscar" bg="#0077b6" textColor="#ffffff" layout_weight="0.3" marginLeft="2" marginRight="2"/>
            <button id="btnFinalizar" text="Finalizar" bg="#d62828" textColor="#ffffff" layout_weight="0.3" marginLeft="2"/>
        </horizontal>
        
        <frame layout_weight="1" bg="#0a0a1a" radius="6" padding="4">
            <vertical>
                <text text="Historico" textSize="8" textColor="#888" marginBottom="2"/>
                <scroll id="logScroll">
                    <text id="logText" text="Aguardando...\n" textSize="7" textColor="#666" lineSpacing="1.5"/>
                </scroll>
            </vertical>
        </frame>
        
        <button id="btnSair" text="Sair" bg="#6c757d" textColor="#ffffff" marginTop="4"/>
    </vertical>
);

// ============================================
// EVENTOS
// ============================================

ui.btnLogin.click(function() { F.showLogin(); });
ui.btnContas.click(function() { F.showAccounts(); });

ui.btnTrip.click(function() {
    dialogs.rawInput("Trip ID:", ui.inputTrip.text(), function(id) {
        if (id) {
            state.tripId = id;
            ui.inputTrip.setText(id);
            ui.statusText.setText("Trip: " + id);
            F.log("Trip: " + id, 'info');
            toast("Trip: " + id);
        }
    });
});

ui.btnCoord.click(function() {
    dialogs.rawInput("Coord (lat, lng):", ui.inputCoord.text(), function(c) {
        if (c) {
            var p = c.split(',');
            if (p.length === 2) {
                var lat = parseFloat(p[0].trim());
                var lng = parseFloat(p[1].trim());
                if (!isNaN(lat) && !isNaN(lng)) {
                    state.coordenada = [lat, lng];
                    ui.inputCoord.setText(c);
                    ui.statusText.setText("Coord definida");
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

ui.btnBuscar.click(function() { F.buscaCli(); });
ui.btnFinalizar.click(function() { F.finaliza(); });

ui.btnSair.click(function() {
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

ui.statusText.setText("Clique em Login");
F.log("🚗 GBot Finalizador - Sem Serial iniciado", 'ok');
F.log("✅ Aguardando login...", 'ok');

toast("🚗 GBot Finalizador");
