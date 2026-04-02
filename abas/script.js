let ticketsJiraGlobais = [];
        const SCRIPT_URL = "https://script.google.com/macros/s/AKfycbxupjNwDDgxLULbLOPUVd2jc4hRUxI9JYYeqy7riYGBg5ymoqAfLeJn6IwRqLH7aozH/exec"; 

        async function carregarAba(url, idElemento) {
            try {
                const res = await fetch(url);
                if (res.ok) document.getElementById(idElemento).innerHTML = await res.text();
            } catch(e) { console.error("Erro ao carregar módulo."); }
        }

        async function montarSite() {
            await carregarAba('abas/home.html', 'homeView');
            await carregarAba('abas/solicitacoes.html', 'solicitacoesView');
            await carregarAba('abas/jira.html', 'jiraView');
            carregarCardsGestao();
        }
        window.onload = montarSite;

        function switchTab(tab) {
            document.getElementById('homeView').style.display = tab === 'home' ? 'block' : 'none';
            document.getElementById('solicitacoesView').style.display = tab === 'solicitacoes' ? 'block' : 'none';
            document.getElementById('jiraView').style.display = tab === 'jira' ? 'block' : 'none';
            document.getElementById('btnTabHome').classList.toggle('active', tab === 'home');
            document.getElementById('btnTabSol').classList.toggle('active', tab === 'solicitacoes');
            document.getElementById('btnTabJira').classList.toggle('active', tab === 'jira');
        }

        async function carregarCardsGestao() {
            const containerSol = document.getElementById('containerCardsGestao');
            const containerJira = document.getElementById('viewAgrupadaJira');
            try {
                const res = await fetch(SCRIPT_URL); const dados = await res.json();
                if(containerSol) containerSol.innerHTML = ""; 
                if(containerJira) containerJira.innerHTML = "";

                // SOLICITAÇÕES
                if (dados.solicitacoes && containerSol) {
                    dados.solicitacoes.forEach(sol => {
                        containerSol.innerHTML += `<div class="card-gestao"><strong>${sol.nome}</strong><br><small>${sol.matricula}</small><br><strong>${sol.tipo}</strong><button class="btn-concluir" onclick="finalizarSolicitacao('${sol.id}')">✅ CONCLUIR</button></div>`;
                    });
                }

                // JIRA TICKETS (Onde entra a pasta Time de Ponto)
                if (dados.jira && containerJira) {
                    ticketsJiraGlobais = dados.jira;
                    const contagem = {}; let pendPonto = 0;
                    dados.jira.forEach(t => { 
                        let ons = t.onsite || "Não Mapeado"; contagem[ons] = (contagem[ons] || 0) + 1;
                        if(t.pendentePonto) pendPonto++;
                    });

                    // PASTA TIME DE PONTO (Só aparece na aba TICKETS SHOPEE)
                    if (pendPonto > 0) {
                        containerJira.innerHTML += `
                            <div class="card-jira-agrupado" style="border-top-color: var(--pontomais);" onclick="mostrarTicketsDoOnsite('TIME DE PONTO', 'TODOS')">
                                <span style="font-size: 30px;">⏱️</span><h3 style="color: var(--pontomais);">TIME DE PONTO</h3>
                                <span style="font-weight: bold; color: var(--warning);">${pendPonto} Ticket(s) Pendente(s)</span>
                            </div>`;
                    }

                    for (const [onsite, qtd] of Object.entries(contagem)) {
                        containerJira.innerHTML += `<div class="card-jira-agrupado" onclick="mostrarTicketsDoOnsite('${onsite}', 'TODOS')"><span style="font-size: 30px;">🧑‍💻</span><h3 style="color: var(--primary);">${onsite}</h3><span style="font-weight: bold; color: var(--danger);">${qtd} Ticket(s) Pendente(s)</span></div>`;
                    }
                }
            } catch(e) { console.error(e); }
        }

        // Funções auxiliares mantidas ( switchTab, toggleTheme, buscarTudo, etc... )
        function toggleTheme() { const html = document.documentElement; if (html.getAttribute('data-theme') === 'dark') html.removeAttribute('data-theme'); else html.setAttribute('data-theme', 'dark'); }
        function abrirPopup(url) { window.open(url, 'Popup', 'width=900,height=900'); }
        function buscarTudo() { let input = document.getElementById('searchInput').value.toLowerCase(); let cards = document.getElementsByClassName('card'); for (let card of cards) card.classList.toggle('hidden', !card.innerText.toLowerCase().includes(input)); }
        
        // Funções de ação (enviarParaPonto, concluirPonto, etc) permanecem as mesmas que você já tem no motor original
        async function enviarParaPonto(chave) { await fetch(SCRIPT_URL, { method: 'POST', mode: 'no-cors', body: JSON.stringify({ acao: "marcar_ponto", chave: chave }) }); carregarCardsGestao(); }
        async function concluirPonto(chave) { await fetch(SCRIPT_URL, { method: 'POST', mode: 'no-cors', body: JSON.stringify({ acao: "concluir_ponto", chave: chave }) }); carregarCardsGestao(); }
        
       function mostrarTicketsDoOnsite(onsite, filtroAtivo = 'TODOS') {
    document.getElementById('viewAgrupadaJira').style.display = 'none';
    document.getElementById('viewDetalhadaJira').style.display = 'block';
    document.getElementById('tituloOperacaoJira').innerText = `Gestão: ${onsite}`;
    
    const container = document.getElementById('containerCardsJira');
    container.innerHTML = "";

    let tickets = (onsite === 'TIME DE PONTO') 
        ? ticketsJiraGlobais.filter(t => t.pendentePonto) 
        : ticketsJiraGlobais.filter(t => t.onsite === onsite && !t.pendentePonto);

    tickets.forEach(t => {
        const resumo = t.resumo.toUpperCase();
        const isDeslig = resumo.includes("DESLIGAMENTO");
        const isMov = resumo.includes("MOVIMENTAÇÃO") || resumo.includes("MOVIMENTACAO");
        
        // Lógica Coluna J (Matrícula)
        let matriculas = t.matricula ? t.matricula.toString().split(",") : [];
        let displayNome = (matriculas.length > 1) ? "⚠️ Solicitação com mais de 1 colaborador" : t.nome;

        let urlForms = isDeslig ? 'https://forms.office.com/Pages/ResponsePage.aspx?id=fCAtUtXsx0-nbxdGSxFh-f7MDqf4DUBBuOHjox7sxytUNFFQNTgzR1pQV0FLM05aWElXSjlRMjFHRy4u' : 'https://forms.office.com/Pages/ResponsePage.aspx?id=fCAtUtXsx0-nbxdGSxFh-eVAzhwdpsxLmCSGMQwqNIpUM1E2TFRSRkhNWU9IQk9SVFhBSDJNWTFDVS4u';

        container.innerHTML += `
            <div class="card-ticket" style="border-left: 8px solid ${isDeslig ? '#ff4b2b' : '#1a73e8'};">
                <div>
                    <h3 style="margin:0; font-size: 1.1rem;">${displayNome}</h3>
                    <small>${t.chave} | ${t.matricula}</small>
                    <div style="margin-top: 10px; font-size: 0.9rem;">
                        ${isDeslig && t.dataDesligamento ? `<b style="color:#d63031">📅 Data: ${t.dataDesligamento}</b><br>` : ''}
                        ${isMov && t.centroCusto ? `<b>🏢 C.C: ${t.centroCusto}</b>` : ''}
                    </div>
                    <hr style="opacity:0.1; margin: 15px 0;">
                    <p style="font-size:0.85rem;">${t.resumo}</p>
                </div>
                <div class="actions-row">
                    <a href="https://spxresolve.atlassian.net/browse/${t.chave}" target="_blank" class="btn-mini" style="background:#0052CC">🎫 JIRA</a>
                    <button onclick="window.open('${urlForms}')" class="btn-mini" style="background:${isDeslig ? '#d63031' : '#6a11cb'}">📝 FORMS</button>
                    ${isMov ? `<button onclick="enviarParaPonto('${t.chave}')" class="btn-mini" style="background:#f1c40f; color:black">➡️ PONTO</button>` : ''}
                </div>
            </div>`;
    });
}
        function voltarParaAgrupamentoJira() { document.getElementById('viewDetalhadaJira').style.display = 'none'; document.getElementById('viewAgrupadaJira').style.display = 'grid'; }
