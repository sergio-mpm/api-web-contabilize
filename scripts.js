let despesas = []
let usuarioLogado = localStorage.getItem('usuario')
let editId = null

/* ================= AUTH ================= */

function login() {
    const user = document.getElementById('loginUser').value
    if (user === 'admin') {
        localStorage.setItem('usuario', 'admin')
        usuarioLogado = 'admin'
        showApp()
        return
    }
    if (!user) return alert('Informe o usuário')

    fetch('http://localhost:5000/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ usuario: user })
    })
        .then(res => {
            if (!res.ok) throw new Error()
            localStorage.setItem('usuario', user)
            usuarioLogado = user
            showApp()
        })
        .catch(() => alert('Usuário inválido'))
}

function toggleRegister() {
    document.getElementById('registerBox').classList.toggle('d-none')
}


function register() {
    const user = document.getElementById('registerUser').value
    if (!user) return alert('Informe o usuário')

    fetch('http://localhost:5000/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ usuario: user })
    })
    .then(res => {
        if (!res.ok) throw new Error()
        alert('Usuário criado com sucesso')
        document.getElementById('registerUser').value = ''
        toggleRegister()
    })
    .catch(() => alert('Usuário já existe'))
}


function logout() {
    localStorage.removeItem('usuario')
    location.reload()
}

function showApp() {
    document.getElementById('loginView').classList.add('d-none')
    document.getElementById('appView').classList.remove('d-none')
    carregarDespesas()
}

/* ================= CRUD ================= */

function addDespesa() {
    const despesa = {
        id: editId || Date.now(),
        desc: desc.value,
        valor: parseFloat(valor.value),
        tipo: tipo.value,
        usuario: usuarioLogado
    }

    const method = editId ? 'PUT' : 'POST'
    const url = editId
        ? `http://localhost:5000/despesas/${editId}`
        : 'http://localhost:5000/despesas'

    fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(despesa)
    })
        .then(() => {
            editId = null
            clearForm()
            carregarDespesas()
        })
}

function editDespesa(id) {
    const d = despesas.find(x => x.id === id)
    desc.value = d.desc
    valor.value = d.valor
    tipo.value = d.tipo
    editId = id
}

function removeDespesa(id) {
    fetch(`http://localhost:5000/despesas/${id}`, {
        method: 'DELETE'
    })
        .then(() => carregarDespesas())
}

/* ================= FILTRO ================= */

function filterTipo(tipo) {
    render(tipo)
}

/* ================= RENDER ================= */

function render(filtroTipo = '') {
    const lista = document.getElementById('lista')
    lista.innerHTML = ''

    let total = 0

    despesas
        .filter(d => !filtroTipo || d.tipo === filtroTipo)
        .forEach(d => {
            total += d.valor
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
        `
        })

    document.getElementById('total').innerText = total.toFixed(2)
    renderPorTipo()
    renderPorUsuario()
}

function carregarDespesas() {
    fetch('http://localhost:5000/despesas')
        .then(res => res.json())
        .then(data => {
            despesas = data
            render()
        })
}

/* ================= DASHBOARD ================= */

function renderPorTipo() {
    const ul = document.getElementById('porTipo')
    ul.innerHTML = ''
    const resumo = {}

    despesas.forEach(d => resumo[d.tipo] = (resumo[d.tipo] || 0) + d.valor)

    for (let tipo in resumo) {
        ul.innerHTML += `<li class="list-group-item">${tipo}: R$ ${resumo[tipo].toFixed(2)}</li>`
    }
}

function renderPorUsuario() {
    const ul = document.getElementById('porUsuario')
    ul.innerHTML = ''
    const resumo = {}

    despesas.forEach(d => resumo[d.usuario] = (resumo[d.usuario] || 0) + d.valor)

    for (let user in resumo) {
        ul.innerHTML += `<li class="list-group-item">${user}: R$ ${resumo[user].toFixed(2)}</li>`
    }
}

/* ================= UTIL ================= */

function clearForm() {
    desc.value = ''
    valor.value = ''
}

if (usuarioLogado) showApp()
