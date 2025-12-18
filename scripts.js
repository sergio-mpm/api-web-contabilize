let despesas = [];
let usuarioLogado = null;
let cpfLogado = null;
let editId = null;

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
    fetch(`http://localhost:5000/usuarios/${cpf}`)
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

    if (!user || !cpf) return alert('Informe nome e CPF');

    fetch('http://localhost:5000/usuarios', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nome: user, cpf: parseInt(cpf) })
    })
    .then(res => {
        if (!res.ok) throw new Error('Usuário já existe');
        alert('Usuário criado com sucesso');
        document.getElementById('registerUser').value = '';
        document.getElementById('registerCpf').value = '';
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
}

/* ================= CRUD ================= */

function addDespesa() {
    const despesa = {
        id: editId || Date.now(),
        desc: desc.value,
        valor: parseFloat(valor.value),
        tipo: tipo.value,
        usuario: usuarioLogado,
        cpf: parseInt(cpfLogado)
    };

    const method = editId ? 'PUT' : 'POST';
    const url = editId
        ? `http://localhost:5000/despesas/${editId}`
        : 'http://localhost:5000/despesas';

    fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(despesa)
    })
    .then(res => {
        if (!res.ok) throw new Error('Erro ao salvar despesa');
        editId = null;
        clearForm();
        carregarDespesas();
    })
    .catch(err => alert(err.message));
}

function editDespesa(id) {
    const d = despesas.find(x => x.id === id);
    desc.value = d.desc;
    valor.value = d.valor;
    tipo.value = d.tipo;
    editId = id;
}

function removeDespesa(id) {
    fetch(`http://localhost:5000/despesas/${id}`, { method: 'DELETE' })
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
            lista.innerHTML += `
                <li class="list-group-item d-flex justify-content-between align-items-center">
                    <div>
                        <strong>${d.desc}</strong><br>
                        <small>${d.tipo} | ${d.usuario}</small>
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
    fetch('http://localhost:5000/despesas')
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

    despesas.forEach(d => resumo[d.usuario] = (resumo[d.usuario] || 0) + d.valor);

    for (let user in resumo) {
        ul.innerHTML += `<li class="list-group-item">${user}: R$ ${resumo[user].toFixed(2)}</li>`;
    }
}

/* ================= UTIL ================= */

function clearForm() {
    desc.value = '';
    valor.value = '';
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

/* ================= INIT ================= */
usuarioLogado = localStorage.getItem('usuario');
cpfLogado = localStorage.getItem('cpf');

if (usuarioLogado && cpfLogado) showApp();
