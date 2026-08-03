// --- BANCO DE DADOS LOCAL (Versão Definitiva para GitHub) ---

function obterUsuarios() {
    let usuariosSalvos = JSON.parse(localStorage.getItem('dhon_usuarios')) || [];
    const temAdmin = usuariosSalvos.some(u => u.email === "admin@dhon.com");
    if (!temAdmin) {
        const adminUnico = { nome: "Administrador", email: "admin@dhon.com", senha: "123", foto: "", admin: true };
        usuariosSalvos = [adminUnico]; 
        localStorage.setItem('dhon_usuarios', JSON.stringify(usuariosSalvos));
    }
    return usuariosSalvos;
}

function salvarUsuarios(usuarios) {
    localStorage.setItem('dhon_usuarios', JSON.stringify(usuarios));
}

function obterUsuarioLogado() {
    return JSON.parse(localStorage.getItem('dhon_usuario_logado')) || null;
}

function salvarUsuarioLogado(usuario) {
    localStorage.removeItem('dhon_usuario_logado');
    localStorage.setItem('dhon_usuario_logado', JSON.stringify(usuario));
}

function obterCarrinho() {
    return JSON.parse(localStorage.getItem('dhon_carrinho')) || [];
}

function salvarCarrinho(carrinho) {
    localStorage.setItem('dhon_carrinho', JSON.stringify(carrinho));
    atualizarContadoresCarrinho();
}


// --- GESTÃO DE PRODUTOS (CORRIGIDO PARA PERMITIR EXCLUSÃO TOTAL) ---

function obterProdutos() {
    const VERSAO_PRODUTOS = "3"; // Versão atualizada para forçar a limpeza correta
    const versaoSalva = localStorage.getItem('dhon_versao_produtos');

    let produtos = localStorage.getItem('dhon_produtos');

    // Se nunca foi inicializado ou a versão mudou, cria os produtos iniciais uma única vez
    if (produtos === null || versaoSalva !== VERSAO_PRODUTOS) {
        produtos = [
            { id: 1, nome: "Fone Bluetooth Pro", preco: "199,90", foto: "" },
            { id: 2, nome: "Smartwatch Ultra", preco: "299,90", foto: "" },
            { id: 3, nome: "Perfume Importado 100ml", preco: "350,00", foto: "" },
            { id: 4, nome: "Tênis esportivo Importado", preco: "450,00", foto: "" }
        ];
        localStorage.setItem('dhon_produtos', JSON.stringify(produtos));
        localStorage.setItem('dhon_versao_produtos', VERSAO_PRODUTOS);
        return produtos;
    }

    // Se já existe, converte para objeto e retorna (mesmo se estiver vazio [])
    return JSON.parse(produtos);
}

function salvarProdutos(produtos) {
    localStorage.setItem('dhon_produtos', JSON.stringify(produtos));
}


// --- AUTENTICAÇÃO ---

function fazerLogin(event) {
    if (event) event.preventDefault();
    const email = document.getElementById('login-email').value.trim().toLowerCase();
    const senha = document.getElementById('login-senha').value.trim();

    const usuarios = obterUsuarios();
    const usuarioEncontrado = usuarios.find(u => u.email.toLowerCase() === email && u.senha === senha);

    if (usuarioEncontrado) {
        localStorage.removeItem('dhon_carrinho');
        salvarUsuarioLogado(usuarioEncontrado);
        alert('Login realizado com sucesso!');
        window.location.href = 'painel.html';
    } else {
        alert('E-mail ou senha incorretos!');
    }
}

function fazerCadastro() {
    const nome = document.getElementById('cadastro-nome').value.trim();
    const email = document.getElementById('cadastro-email').value.trim().toLowerCase();
    const senha = document.getElementById('cadastro-senha').value.trim();

    if (!nome || !email || !senha) {
        alert('Por favor, preencha todos os campos.');
        return;
    }

    if (email === "admin@dhon.com") {
        alert('Este e-mail é reservado para o administrador.');
        return;
    }

    const usuarios = obterUsuarios();
    if (usuarios.some(u => u.email.toLowerCase() ===
