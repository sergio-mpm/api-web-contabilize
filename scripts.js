let despesas = [];
let usuarioLogado = null;
let cpfLogado = null;
let editId = null;
let baseUrl = `http://localhost:5000`

/* ================= AUTH ================= */

function login() {
    const user = document.getElementById('loginUser').value;
    const cpf = document.getElementById('loginCpf').value;

    if (!user || !cpf) return alert('Informe o usuário e CPF');

    // Bypass admin
    if (user === 'admin' && cpf === '000') {
        usuarioLogado = 'admin';
        cpfLogado = 0;
        localStorage.setItem('usuario', usuarioLogado);
        localStorage.setItem('cpf', cpfLogado);
        showApp();
        return;
    }

    // Chamada ao backend
    fetch(`${baseUrl}/usuarios/${cpf}`)
        .then(res => {
            if (!res.ok) throw new Error('Usuário não encontrado');
            return res.json();
        })
        .then(data => {
            if (data.nome !== user) throw new Error('Usuário ou CPF inválido');
            usuarioLogado = data.nome;
            cpfLogado = data.cpf;
            localStorage.setItem('usuario', usuarioLogado);
            localStorage.setItem('cpf', cpfLogado);
            showApp();
        })
        .catch(err => alert(err.message));
}

function register() {
    const user = document.getElementById('registerUser').value;
    const cpf = document.getElementById('registerCpf').value;
    const email = document.getElementById('registerEmail').value;
    const dataNascimento = document.getElementById('registerDataNasc').value;
    const dataISO = new Date(dataNascimento).toISOString();

    if (!user || !cpf) return alert('Informe nome e CPF');

    fetch(`${baseUrl}/usuarios/cadastrar`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nome: user, cpf: cpf, email: email, data_nascimento: dataISO, comentario: comentario })
    })
    .then(res => {
        if (!res.ok) throw new Error('Usuário já existe');
        alert('Usuário criado com sucesso');
        document.getElementById('registerUser').value = '';
        document.getElementById('registerCpf').value = '';
        document.getElementById('registerEmail').value = '';
        document.getElementById('registerDataNasc').value = '';
        toggleRegister();
    })
    .catch(err => alert(err.message));
}

function toggleRegister() {
    document.getElementById('registerBox').classList.toggle('d-none');
}

function logout() {
    localStorage.removeItem('usuario');
    localStorage.removeItem('cpf');
    usuarioLogado = null;
    cpfLogado = null;
    location.reload();
}

function showApp() {
    document.getElementById('loginView').classList.add('d-none');
    document.getElementById('appView').classList.remove('d-none');
    document.getElementById('mainNavbar').classList.remove('d-none');
    carregarDespesas();
    carregarUsuarios();
}

/* ================= CRUD ================= */

function addDespesa() {
    const descricao = document.getElementById('despesaDescricao').value;
    const valor = document.getElementById('despesaValor').value;
    const tipo = document.getElementById('despesaTipo').value;
    const comentario = document.getElementById('despesaComentario').value;
    const dataDespesa = document.getElementById('despesaData').value;
    const dataIsoDespesa = new Date(dataDespesa).toISOString();
    const despesa = {
        nome: descricao,
        valor: parseFloat(valor),
        tipo: tipo,
        data_despesa: dataIsoDespesa,
        cpf: cpfLogado,
        comentario: comentario
    };

    const method = editId ? 'PUT' : 'POST';
    const url = editId
        ? `${baseUrl}/despesas/${editId}`
        : `${baseUrl}/despesas/criar`;

    fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(despesa)
    })
    .then(res => {
        if (!res.ok) throw new Error('Erro ao salvar despesa');
        editId = null;
        clearForm();
        document.querySelector('#formTitle').innerText = 'Nova Despesa';
        document.querySelector('#despesaFormButton').innerText = 'Salvar';
        carregarDespesas();
    })
    .catch(err => alert(err.message));
}

function editDespesa(id) {
    const d = despesas.find(x => x.id === id);
    if (!d) return alert('Despesa não encontrada');

    // Preenche o formulário
    document.getElementById('despesaDescricao').value = d.nome;
    document.getElementById('despesaValor').value = d.valor;
    document.getElementById('despesaTipo').value = d.tipo;
    document.getElementById('despesaResponsavel').value = d.responsavel || '';
    document.getElementById('despesaData').value = d.data_despesa
        ? new Date(d.data_despesa).toISOString().split('T')[0]
        : '';
    document.getElementById('despesaComentario').value = d.comentario || '';

    // Marca a despesa que está sendo editada
    editId = id;

    // Opcional: muda o texto do botão e do título
    document.querySelector('#formTitle').innerText = 'Editar Despesa';
    document.querySelector('#despesaFormButton').innerText = 'Salvar Alterações';
}

function removeDespesa(id) {
    fetch(`${baseUrl}/despesas/${id}`, { method: 'DELETE' })
        .then(() => carregarDespesas())
        .catch(err => alert('Erro ao deletar despesa'));
}

/* ================= FILTRO ================= */

function filterTipo(tipo) {
    render(tipo);
}

/* ================= RENDER ================= */

function render(filtroTipo = '') {
    const lista = document.getElementById('lista');
    lista.innerHTML = '';

    let total = 0;

    despesas
        .filter(d => !filtroTipo || d.tipo === filtroTipo)
        .forEach(d => {
            total += d.valor;
            const data = new Date(d.data_despesa);
            const dia = String(data.getDate()).padStart(2, '0');
            const mes = String(data.getMonth() + 1).padStart(2, '0');
            const ano = data.getFullYear();
            const dataFormatada = `${dia}/${mes}/${ano}`;
            lista.innerHTML += `
                <li class="list-group-item d-flex justify-content-between align-items-center">
                    <div>
                        <strong>${d.nome}</strong><br>
                        <small>${d.tipo} | ${d.responsavel} | ${dataFormatada}</small>
                        ${d.comentario ? `
                            <span class="tooltip">❓
                            <span class="tooltiptext">${d.comentario}</span>
                            </span>` : ''}
                    </div>
                    <div>
                        R$ ${d.valor.toFixed(2)}
                        <button class="btn btn-sm btn-warning ms-1" onclick="editDespesa(${d.id})">✏️</button>
                        <button class="btn btn-sm btn-danger ms-1" onclick="removeDespesa(${d.id})">🗑️</button>
                    </div>
                </li>
            `;
        });

    document.getElementById('total').innerText = total.toFixed(2);
    renderPorTipo();
    renderPorUsuario();
}

function carregarDespesas() {
    fetch(`${baseUrl}/despesas/getallexpenses`)
        .then(res => res.json())
        .then(data => {
            despesas = data.despesas; // conforme backend retorna {"despesas": [...]}
            render();
        })
        .catch(err => alert('Erro ao carregar despesas'));
}

/* ================= DASHBOARD ================= */

function renderPorTipo() {
    const ul = document.getElementById('porTipo');
    ul.innerHTML = '';
    const resumo = {};

    despesas.forEach(d => resumo[d.tipo] = (resumo[d.tipo] || 0) + d.valor);

    for (let tipo in resumo) {
        ul.innerHTML += `<li class="list-group-item">${tipo}: R$ ${resumo[tipo].toFixed(2)}</li>`;
    }
}

function renderPorUsuario() {
    const ul = document.getElementById('porUsuario');
    ul.innerHTML = '';
    const resumo = {};

    despesas.forEach(d => resumo[d.responsavel] = (resumo[d.responsavel] || 0) + d.valor);

    for (let user in resumo) {
        ul.innerHTML += `<li class="list-group-item">${user}: R$ ${resumo[user].toFixed(2)}</li>`;
    }
}

/* ================= UTIL ================= */

function clearForm() {
    document.getElementById('despesaDescricao').value = '';
    document.getElementById('despesaValor').value = '';
    document.getElementById('despesaTipo').value = '';
    document.getElementById('despesaResponsavel').value = '';
    document.getElementById('despesaData').value = '';
    document.getElementById('despesaComentario').value = '';
}


/* ================= SCROLL SUAVE NAVBAR ================= */
document.querySelectorAll('.navbar-nav a').forEach(link => {
    link.addEventListener('click', function(e) {
        e.preventDefault();
        const target = document.querySelector(this.getAttribute('href'));
        if (target) {
            target.scrollIntoView({ behavior: 'smooth' });
        }
    });
});

/* ================= CRUD USUÁRIOS ================= */

function carregarUsuarios() {
    fetch(`${baseUrl}/usuarios/getallusers`)
        .then(res => res.json())
        .then(data => {
            const lista = document.getElementById('listaUsuarios');
            lista.innerHTML = '';
            data.usuarios.forEach(u => {
                const dataNasc = new Date(u.data_nascimento);
                const dia = String(dataNasc.getDate()).padStart(2, '0');
                const mes = String(dataNasc.getMonth() + 1).padStart(2, '0');
                const ano = dataNasc.getFullYear();
                const dataFormatada = `${dia}/${mes}/${ano}`;

                lista.innerHTML += `
                    <li class="list-group-item d-flex justify-content-between align-items-center">
                        <div>
                            <strong>${u.nome}</strong> | ${u.cpf} | ${u.email} | ${dataFormatada}
                        </div>
                        <div>
                            <button class="btn btn-sm btn-warning ms-1" onclick="editarUsuario('${u.cpf}')">✏️</button>
                            <button class="btn btn-sm btn-danger ms-1" onclick="removerUsuario('${u.cpf}')">🗑️</button>
                        </div>
                    </li>
                `;
            });
        })
        .catch(err => alert('Erro ao carregar usuários'));
}

function salvarUsuario() {
    const nome = document.getElementById('usuarioNome').value;
    const cpf = document.getElementById('usuarioCpf').value;
    const email = document.getElementById('usuarioEmail').value;
    const dataNascimento = new Date(document.getElementById('usuarioData').value).toISOString();

    fetch(`${baseUrl}/usuarios/cadastrar`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nome, cpf, email, data_nascimento: dataNascimento })
    })
    .then(res => {
        if (!res.ok) throw new Error('Erro ao salvar usuário');
        alert('Usuário salvo com sucesso');
        carregarUsuarios();
    })
    .catch(err => alert(err.message));
}

function editarUsuario(cpf) {
    fetch(`${baseUrl}/usuarios/${cpf}`)
        .then(res => res.json())
        .then(u => {
            document.getElementById('usuarioNome').value = u.nome;
            document.getElementById('usuarioCpf').value = u.cpf;
            document.getElementById('usuarioEmail').value = u.email;
            document.getElementById('usuarioData').value = u.data_nascimento.split('T')[0];
        })
        .catch(err => alert('Erro ao carregar usuário'));
}

function removerUsuario(cpf) {
    fetch(`${baseUrl}/usuarios/${cpf}`, { method: 'DELETE' })
        .then(() => carregarUsuarios())
        .catch(err => alert('Erro ao remover usuário'));
}

/* ================= INIT ================= */
usuarioLogado = localStorage.getItem('usuario');
cpfLogado = localStorage.getItem('cpf');

if (usuarioLogado && cpfLogado) showApp();
