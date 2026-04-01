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
    
    // Limpa o conteúdo e adiciona os botões de filtro no topo
    container.innerHTML = `
        <div style="grid-column: 1 / -1; display: flex; gap: 10px; justify-content: center; margin-bottom: 20px; width: 100%;">
            <button class="btn-filtro" style="background: ${filtroAtivo === 'TODOS' ? 'var(--primary)' : 'var(--card-bg)'}; color: ${filtroAtivo === 'TODOS' ? 'white' : 'var(--text)'}" onclick="mostrarTicketsDoOnsite('${onsite}', 'TODOS')">TUDO</button>
            <button class="btn-filtro" style="background: ${filtroAtivo === 'DESLIGAMENTO' ? '#d63031' : 'var(--card-bg)'}; color: ${filtroAtivo === 'DESLIGAMENTO' ? 'white' : 'var(--text)'}" onclick="mostrarTicketsDoOnsite('${onsite}', 'DESLIGAMENTO')">🚫 DESLIGAMENTOS</button>
            <button class="btn-filtro" style="background: ${filtroAtivo === 'MOVIMENTACAO' ? '#0984e3' : 'var(--card-bg)'}; color: ${filtroAtivo === 'MOVIMENTACAO' ? 'white' : 'var(--text)'}" onclick="mostrarTicketsDoOnsite('${onsite}', 'MOVIMENTACAO')">🔄 MOVIMENTAÇÕES</button>
        </div>
    `;

    // Filtra os tickets baseados no Onsite ou se é Ponto
    let tickets = (onsite === 'TIME DE PONTO') 
        ? ticketsJiraGlobais.filter(t => t.pendentePonto) 
        : ticketsJiraGlobais.filter(t => t.onsite === onsite);
    
    // Aplica o filtro de categoria (Desligamento / Movimentação)
    if(filtroAtivo !== 'TODOS') {
        tickets = tickets.filter(t => t.resumo.toUpperCase().includes(filtroAtivo));
    }

    tickets.forEach(t => {
        const resumo = t.resumo.toUpperCase();
        const isDesligamento = resumo.includes("DESLIGAMENTO");
        const isMovimentacao = resumo.includes("MOVIMENTAÇÃO") || resumo.includes("MOVIMENTACAO");
        
        let classeDestaque = isDesligamento ? "card-desligamento" : (isMovimentacao ? "card-movimentacao" : "");
        let statusTag = t.pendentePonto ? `<div class="tag-ponto">⏰ PENDENTE NO PONTOMAIS</div>` : '';

        // Lógica dos Botões
        let botoesExtras = "";
        if (isDesligamento) {
            botoesExtras = `<button class="btn-jira-link btn-forms-desligamento" onclick="window.open('https://forms.office.com/Pages/ResponsePage.aspx?id=fCAtUtXsx0-nbxdGSxFh-f7MDqf4DUBBuOHjox7sxytUNFFQNTgzR1pQV0FLM05aWElXSjlRMjFHRy4u&origin=Invitation&channel=0', '_blank')">📋 ENVIAR FORMS DE DESLIGAMENTO</button>`;
        } else if (isMovimentacao) {
            botoesExtras = `
                <button class="btn-jira-link btn-central-solicitacao" onclick="window.open('https://forms.office.com/Pages/ResponsePage.aspx?id=fCAtUtXsx0-nbxdGSxFh-eVAzhwdpsxLmCSGMQwqNIpUM1E2TFRSRkhNWU9IQk9SVFhBSDJNWTFDVS4u', '_blank')">📥 ENVIAR CENTRAL DE SOLICITAÇÃO</button>
                <button onclick="enviarParaPonto('${t.chave}')" class="btn-jira-link" style="background: #f1c40f; color:#000; padding: 8px;">➡️ ENVIAR PARA O PONTO</button>
            `;
        } else {
            botoesExtras = `<button onclick="enviarParaPonto('${t.chave}')" class="btn-jira-link" style="background: #f1c40f; color:#000; padding: 8px;">➡️ ENVIAR PARA O PONTO</button>`;
        }

        container.innerHTML += `
            <div class="card-gestao ${classeDestaque}" style="padding-bottom: 160px;">
                ${statusTag}
                <strong>${t.nome}</strong><br><small>${t.chave}</small><br>
                <hr style="opacity:0.2;">
                <span>${t.resumo}</span>
                <div style="position: absolute; bottom: 15px; left: 15px; right: 15px; display: flex; flex-direction: column; gap: 5px;">
                    <a href="https://spxresolve.atlassian.net/browse/${t.chave}" target="_blank" class="btn-jira-link" style="background: var(--jira); padding: 8px;">🔗 ABRIR JIRA</a>
                    ${botoesExtras}
                </div>
            </div>`;
    });
}
        function voltarParaAgrupamentoJira() { document.getElementById('viewDetalhadaJira').style.display = 'none'; document.getElementById('viewAgrupadaJira').style.display = 'grid'; }
