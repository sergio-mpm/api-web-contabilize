let despesas = [];
let usuarioLogado = null;
let cpfLogado = null;
let editId = null;
let editUsuarioCpf = null;
let baseUrl = `http://localhost:5000`

/* ================= AUTH ================= */

function login() {
    const cpf = document.getElementById('loginCpf').value;
    const user = document.getElementById('loginUser').value;

    if (!cpf || !user) {
        return alert('Informe nome e CPF');
    }

    fetch(`${baseUrl}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ cpf: cpf })
    })
    .then(res => {
        if (!res.ok) throw new Error('CPF inválido');
        return res.json();
    })
    .then(data => {
        // salva token
        localStorage.setItem('token', data.access_token);

        // salva dados básicos
        usuarioLogado = user;
        cpfLogado = cpf;
        localStorage.setItem('usuario', user);
        localStorage.setItem('cpf', cpf);

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
        body: JSON.stringify({ nome: user, cpf: cpf, email: email, data_nascimento: dataISO })
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
    const cpf = getCpfFromToken();
    const despesa = {
        nome: descricao,
        valor: parseFloat(valor),
        tipo: tipo,
        data_despesa: dataIsoDespesa,
        comentario: comentario,
        cpf: cpf
    };

    console.log(despesa);

    const method = editId ? 'PUT' : 'POST';
    const url = editId
        ? `${baseUrl}/despesas/${editId}`
        : `${baseUrl}/despesas/criar`;

    fetch(url, {
        method,
        headers: authHeaders(),
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
    console.log(d);
    if (!d) return alert('Despesa não encontrada');
    const cpfToken = getCpfFromToken();
    console.log(d.cpf+':'+cpfToken);
    if(d.cpf !== cpfToken) return alert('Somente usuário responsável pode editar a despesa.\n Favor contactar usuário responsável.');
    // Preenche o formulário
    document.getElementById('despesaDescricao').value = d.nome;
    document.getElementById('despesaValor').value = d.valor;
    document.getElementById('despesaTipo').value = d.tipo;
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
    const d = despesas.find(x => x.id === id);
    const cpfToken = getCpfFromToken();
    if(d.cpf !== cpfToken) return alert('Somente usuário responsável pode editar a despesa.\n Favor contactar usuário responsável.');

    fetch(`${baseUrl}/despesas/${id}`, { method: 'DELETE', headers: authHeaders() })
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
                            <span class="custom-tooltip">
                                <img
                                    src="img/question-mark-svgrepo-com.svg"
                                    alt="Comentário"
                                    class="custom-tooltip-icon"
                                />
                            <span class="custom-tooltiptext">${d.comentario}</span>
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
    document.getElementById('despesaData').value = '';
    document.getElementById('despesaComentario').value = '';
}

function ClearFormUsers() {
    document.getElementById('usuarioNome').value = '';
    document.getElementById('usuarioCpf').value = '';
    document.getElementById('usuarioEmail').value = '';
    document.getElementById('usuarioData').value = '';
}

function getCpfFromToken() {
    const token = localStorage.getItem('token');
    if (!token) return null;

    try {
        const payload = JSON.parse(atob(token.split('.')[1]));
        return payload.sub; // identity do JWT
    } catch (e) {
        console.error('Erro ao decodificar token', e);
        return null;
    }
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
        .catch(err => alert('Erro ao carregar usuários - message:'+err));
}

function salvarUsuario() {
    const nome = document.getElementById('usuarioNome').value;
    const cpf = document.getElementById('usuarioCpf').value;
    const email = document.getElementById('usuarioEmail').value;
    const dataNascimento =
        document.getElementById('usuarioData').value
            ? new Date(document.getElementById('usuarioData').value).toISOString()
            : null;

    const method = editUsuarioCpf ? 'PUT' : 'POST';
    const url = editUsuarioCpf
        ? `${baseUrl}/usuarios/${editUsuarioCpf}`
        : `${baseUrl}/usuarios/cadastrar`;

    fetch(url, {
        method,
        headers: authHeaders(),
        body: JSON.stringify({
            nome,
            cpf,
            email,
            data_nascimento: dataNascimento
        })
    })
    .then(res => {
        if (!res.ok) throw new Error('Erro ao salvar usuário');
        alert('Usuário salvo com sucesso');
        ClearFormUsers();
        editUsuarioCpf = null;
        carregarUsuarios();
    })
    .catch(err => alert(err.message));
}

function editarUsuario(cpf) {
    const cpfToken = getCpfFromToken();
    if (cpf !== cpfToken) {
        return alert('Somente o próprio usuário pode editar seus dados.');
    }

    fetch(`${baseUrl}/usuarios/${cpf}`, {
        headers: authHeaders()
    })
    .then(res => res.json())
    .then(u => {
        document.getElementById('usuarioNome').value = u.nome;
        document.getElementById('usuarioCpf').value = u.cpf;
        document.getElementById('usuarioEmail').value = u.email;
        document.getElementById('usuarioData').value =
            u.data_nascimento?.split('T')[0] || '';

        editUsuarioCpf = cpf; //marca edição
    })
    .catch(err => alert('Erro ao carregar usuário'));
}


function removerUsuario(cpf) {
    const cpfToken = getCpfFromToken();
    if(cpf !== cpfToken) return alert('Somente usuário responsável pode remover seus dados.\n Favor contactar usuário responsável.');
    fetch(`${baseUrl}/usuarios/${cpf}`, { method: 'DELETE', headers: authHeaders() })
        .then(() => carregarUsuarios())
        .catch(err => alert('Erro ao remover usuário'));
}

/* ================ HEADER ================ */

function authHeaders() {
    const token = localStorage.getItem('token');
    return {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
    };
}


/* ================= INIT ================= */
usuarioLogado = localStorage.getItem('usuario');
cpfLogado = localStorage.getItem('cpf');

if (usuarioLogado && cpfLogado) showApp();
