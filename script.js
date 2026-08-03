// --- BANCO DE DADOS LOCAL (DHON_IMPORTS) ---

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


// --- GESTÃO DE PRODUTOS ---

function obterProdutos() {
    let produtos = JSON.parse(localStorage.getItem('dhon_produtos_v3'));

    if (!produtos || produtos.length === 0) {
        produtos = [
            { id: 1, nome: "Smartwatch Premium", preco: "199,90", categoria: "eletronicos", foto: "" },
            { id: 2, nome: "Fone Bluetooth Pro", preco: "149,90", categoria: "eletronicos", foto: "" },
            { id: 3, nome: "Tênis Nike Air Force", preco: "299,90", categoria: "calcados", foto: "" },
            { id: 4, nome: "Perfume 212 VIP Black", preco: "180,00", categoria: "perfumaria", foto: "" },
            { id: 5, nome: "Máquina Vap", preco: "150,99", categoria: "eletronicos", foto: "" }
        ];
        localStorage.setItem('dhon_produtos_v3', JSON.stringify(produtos));
    }
    return produtos;
}

function salvarProdutos(produtos) {
    localStorage.setItem('dhon_produtos_v3', JSON.stringify(produtos));
}


// --- AUTENTICAÇÃO (LOGIN E CADASTRO) ---

function fazerLogin(event) {
    if (event) event.preventDefault();
    const emailInput = document.getElementById('login-email');
    const senhaInput = document.getElementById('login-senha');
    
    if (!emailInput || !senhaInput) return;

    const email = emailInput.value.trim().toLowerCase();
    const senha = senhaInput.value.trim();

    const usuarios = obterUsuarios();
    const usuarioEncontrado = usuarios.find(u => u.email.toLowerCase() === email && u.senha === senha);

    if (usuarioEncontrado) {
        salvarUsuarioLogado(usuarioEncontrado);
        alert('Login realizado com sucesso!');
        window.location.href = 'painel.html';
    } else {
        alert('E-mail ou senha incorretos!');
    }
}

function fazerCadastro(event) {
    if (event) event.preventDefault();
    
    const nomeEl = document.getElementById('cadastro-nome');
    const emailEl = document.getElementById('cadastro-email');
    const senhaEl = document.getElementById('cadastro-senha');

    if (!nomeEl || !emailEl || !senhaEl) return;

    const nome = nomeEl.value.trim();
    const email = emailEl.value.trim().toLowerCase();
    const senha = senhaEl.value.trim();

    if (!nome || !email || !senha) {
        alert('Por favor, preencha todos os campos.');
        return;
    }

    if (email === "admin@dhon.com") {
        alert('Este e-mail é reservado para o administrador.');
        return;
    }

    const usuarios = obterUsuarios();
    if (usuarios.some(u => u.email.toLowerCase() === email)) {
        alert('Este e-mail já está cadastrado!');
        return;
    }

    const novoUsuario = { nome, email, senha, foto: "", admin: false };
    usuarios.push(novoUsuario);
    salvarUsuarios(usuarios);
    
    alert('Cadastro realizado com sucesso! Faça o login agora.');
    window.location.href = 'login.html'; 
}

function fazerLogout() {
    localStorage.removeItem('dhon_usuario_logado');
    localStorage.removeItem('dhon_carrinho');
    window.location.href = 'index.html';
}


// --- INICIALIZAÇÃO DE TELA ---
document.addEventListener('DOMContentLoaded', () => {
    obterUsuarios();
    obterProdutos();
    const usuarioLogado = obterUsuarioLogado();
    
    const inputEmail = document.getElementById('input-perfil-email');
    const inputNome = document.getElementById('input-perfil-nome');
    const avatarPreview = document.getElementById('perfil-avatar-preview');

    if (usuarioLogado) {
        if (inputEmail) inputEmail.value = usuarioLogado.email || '';
        if (inputNome) inputNome.value = usuarioLogado.nome || '';
        if (usuarioLogado.foto && avatarPreview) {
            avatarPreview.innerHTML = `<img src="${usuarioLogado.foto}" style="width:100%;height:100%;object-fit:cover;">`;
        }
    }

    const inputFotoPerfil = document.getElementById('input-perfil-foto');
    if (inputFotoPerfil && avatarPreview) {
        inputFotoPerfil.addEventListener('change', function(e) {
            const file = e.target.files[0];
            if (file) {
                const reader = new FileReader();
                reader.onload = function(event) {
                    avatarPreview.innerHTML = `<img src="${event.target.result}" style="width:100%;height:100%;object-fit:cover;">`;
                };
                reader.readAsDataURL(file);
            }
        });
    }

    const nomeUsuarioLogado = document.getElementById('nome-usuario-logado');
    if (nomeUsuarioLogado && usuarioLogado) {
        nomeUsuarioLogado.textContent = usuarioLogado.nome;
    }

    criarModalCarrinhoNaTela();
    renderizarProdutosVitrine();
    atualizarContadoresCarrinho();
    verificarPermissaoAdmin();

    const inputBusca = document.getElementById('input-busca-produto');
    if (inputBusca) {
        inputBusca.addEventListener('input', (e) => {
            renderizarProdutosVitrine(e.target.value);
        });
    }
});


// --- PRAZO DE ENTREGA ---
function calcularPrazoEntrega(idProduto) {
    const dias = (idProduto % 5) + 3; 
    return `${dias} dias úteis`;
}


// --- BUSCA E FILTROS ---

function filtrarPorCategoria(categoria) {
    renderizarProdutosVitrine('', categoria);
}

function renderizarProdutosVitrine(termoBusca = '', categoriaFiltro = 'todos') {
    const vitrine = document.getElementById('vitrine-produtos');
    if (!vitrine) return;

    let produtos = obterProdutos();
    vitrine.innerHTML = '';

    if (termoBusca) {
        const termo = termoBusca.toLowerCase();
        produtos = produtos.filter(p => p.nome.toLowerCase().includes(termo));
    }

    if (categoriaFiltro && categoriaFiltro !== 'todos') {
        produtos = produtos.filter(p => p.categoria === categoriaFiltro);
    }

    if (produtos.length === 0) {
        vitrine.innerHTML = `<p style="grid-column: 1/-1; text-align: center; color: #888; padding: 20px;">Nenhum produto encontrado.</p>`;
        return;
    }

    const usuarioLogado = obterUsuarioLogado();
    const isAdmin = usuarioLogado && usuarioLogado.admin;

    produtos.forEach(prod => {
        const card = document.createElement('div');
        card.className = 'produto-card';
        let imagemHTML = prod.foto ? `<img src="${prod.foto}" style="width:100%; height:110px; object-fit:cover; border-radius:8px; margin-bottom:8px;">` : `<div style="width:100%; height:110px; background:rgba(255,255,255,0.03); display:flex; align-items:center; justify-content:center; border-radius:8px; margin-bottom:8px; font-size:1.5rem;">📦</div>`;
        let botaoAdminHTML = isAdmin ? `<button onclick="excluirProduto(${prod.id})" style="width:100%; padding:5px; background:#ef4444; color:#fff; border:none; border-radius:6px; font-size:0.7rem; cursor:pointer; margin-top:4px;">Excluir</button>` : '';

        const prazoEntrega = calcularPrazoEntrega(prod.id);

        card.innerHTML = `
            ${imagemHTML}
            <h4>${prod.nome}</h4>
            <div style="font-size: 0.7rem; color: #fbbf24; margin-bottom: 6px;">⭐⭐⭐⭐⭐</div>
            <div class="preco" style="margin-bottom: 4px;">R$ ${prod.preco}</div>
            <div style="font-size: 0.65rem; color: #38bdf8; margin-bottom: 8px;">🚚 Entrega: <strong>${prazoEntrega}</strong></div>
            <button onclick="adicionarAoCarrinhoPorId(${prod.id})" style="width:100%; padding:8px; background:#2563eb; color:#fff; border:none; border-radius:6px; font-size:0.75rem; cursor:pointer; font-weight:bold;">Comprar</button>
            ${botaoAdminHTML}
        `;
        vitrine.appendChild(card);
    });
}


// --- PERFIL E ADMIN ---

async function salvarPerfil(event) {
    if (event) event.preventDefault();
    let usuarioLogado = obterUsuarioLogado();
    
    if (!usuarioLogado) {
        alert('Sessão expirada. Faça login novamente.');
        window.location.href = 'login.html';
        return;
    }

    const inputNome = document.getElementById('input-perfil-nome');
    const novaSenhaEl = document.getElementById('input-senha-nova');
    const inputFoto = document.getElementById('input-perfil-foto');

    if (inputNome && inputNome.value.trim()) usuarioLogado.nome = inputNome.value.trim();
    if (novaSenhaEl && novaSenhaEl.value) usuarioLogado.senha = novaSenhaEl.value;

    if (inputFoto && inputFoto.files && inputFoto.files[0]) {
        try {
            const base64Comprimida = await new Promise((resolve, reject) => {
                const reader = new FileReader();
                reader.onload = function(e) {
                    const img = new Image();
                    img.onload = function() {
                        const canvas = document.createElement('canvas');
                        const MAX_WIDTH = 300, MAX_HEIGHT = 300;
                        let width = img.width, height = img.height;
                        if (width > height) {
                            if (width > MAX_WIDTH) { height *= MAX_WIDTH / width; width = MAX_WIDTH; }
                        } else {
                            if (height > MAX_HEIGHT) { width *= MAX_HEIGHT / height; height = MAX_HEIGHT; }
                        }
                        canvas.width = width; canvas.height = height;
                        const ctx = canvas.getContext('2d');
                        ctx.drawImage(img, 0, 0, width, height);
                        resolve(canvas.toDataURL('image/jpeg', 0.7));
                    };
                    img.onerror = reject;
                    img.src = e.target.result;
                };
                reader.onerror = reject;
                reader.readAsDataURL(inputFoto.files[0]);
            });
            usuarioLogado.foto = base64Comprimida;
        } catch (erro) {
            console.error("Erro ao compactar foto:", erro);
        }
    }

    salvarUsuarioLogado(usuarioLogado);
    let usuarios = obterUsuarios();
    usuarios = usuarios.map(u => u.email.toLowerCase() === usuarioLogado.email.toLowerCase() ? usuarioLogado : u);
    salvarUsuarios(usuarios);

    alert('Perfil atualizado com sucesso!');
    location.reload();
}

function verificarPermissaoAdmin() {
    const usuarioLogado = obterUsuarioLogado();
    const painelAdmin = document.getElementById('painel-admin-container');
    if (painelAdmin) {
        painelAdmin.style.display = (usuarioLogado && usuarioLogado.admin) ? 'block' : 'none';
    }
}

function cadastrarProduto(event) {
    if (event) event.preventDefault();
    const usuarioLogado = obterUsuarioLogado();
    if (!usuarioLogado || !usuarioLogado.admin) {
        alert('Acesso negado!');
        return;
    }

    const nome = document.getElementById('prod-nome').value.trim();
    const preco = document.getElementById('prod-preco').value.trim();
    const categoria = document.getElementById('prod-categoria').value;
    const inputFoto = document.getElementById('prod-foto');

    const finalizarCadastro = (urlFoto = "") => {
        let produtos = obterProdutos();
        const novoProd = { id: Date.now(), nome, preco, categoria, foto: urlFoto };
        produtos.push(novoProd);
        salvarProdutos(produtos);
        
        alert('Produto cadastrado com sucesso!');
        document.getElementById('form-add-produto').reset();
        renderizarProdutosVitrine();
    };

    if (inputFoto && inputFoto.files && inputFoto.files[0]) {
        const reader = new FileReader();
        reader.onload = function(e) { finalizarCadastro(e.target.result); };
        reader.readAsDataURL(inputFoto.files[0]);
    } else {
        finalizarCadastro("");
    }
}

function excluirProduto(id) {
    const usuarioLogado = obterUsuarioLogado();
    if (!usuarioLogado || !usuarioLogado.admin) return;

    if (confirm('Deseja excluir este produto?')) {
        let produtos = obterProdutos();
        produtos = produtos.filter(p => p.id !== id);
        salvarProdutos(produtos);
        renderizarProdutosVitrine();
    }
}


// --- CARRINHO E WHATSAPP ---

function adicionarAoCarrinhoPorId(id) {
    const produtos = obterProdutos();
    const produto = produtos.find(p => p.id === id);
    if (!produto) return;

    let carrinho = obterCarrinho();
    carrinho.push(produto);
    salvarCarrinho(carrinho);
    alert(`"${produto.nome}" adicionado ao carrinho!`);
}

function renderizarCarrinhoItens() {
    const lista = document.getElementById('modal-carrinho-itens');
    if (!lista) return;

    const carrinho = obterCarrinho();
    lista.innerHTML = '';

    if (carrinho.length === 0) {
        lista.innerHTML = `<p style="color:#aaa; text-align:center; font-size:0.85rem; padding: 15px;">Carrinho vazio.</p>`;
        atualizarTotalCarrinho(0);
        return;
    }

    let total = 0;
    carrinho.forEach((item, index) => {
        let precoNum = parseFloat(item.preco.replace('.', '').replace(',', '.')) || 0;
        total += precoNum;

        const div = document.createElement('div');
        div.style.cssText = "display: flex; justify-content: space-between; align-items: center; background: rgba(255,255,255,0.05); padding: 8px; border-radius: 6px; font-size: 0.8rem; margin-bottom: 6px; color:#fff;";
        div.innerHTML = `
            <span>${item.nome} - <strong>R$ ${item.preco}</strong></span>
            <button onclick="removerItemCarrinho(${index})" style="background:none; border:none; color:#ef4444; cursor:pointer; font-size:1rem;">🗑️</button>
        `;
        lista.appendChild(div);
    });

    atualizarTotalCarrinho(total);
}

function removerItemCarrinho(index) {
    let carrinho = obterCarrinho();
    carrinho.splice(index, 1);
    salvarCarrinho(carrinho);
    renderizarCarrinhoItens();
}

function atualizarTotalCarrinho(total) {
    const elTotal = document.getElementById('modal-carrinho-total');
    if (elTotal) elTotal.textContent = `R$ ${total.toFixed(2).replace('.', ',')}`;
}

function atualizarContadoresCarrinho() {
    const qtd = obterCarrinho().length;
    const el = document.getElementById('contador-carrinho');
    if (el) el.textContent = qtd;
}

function criarModalCarrinhoNaTela() {
    if (document.getElementById('modal-carrinho-automatico')) return;

    const modalDiv = document.createElement('div');
    modalDiv.id = 'modal-carrinho-automatico';
    modalDiv.style.cssText = "display:none; position:fixed; top:0; left:0; width:100%; height:100%; background:rgba(0,0,0,0.8); z-index:9999; justify-content:center; align-items:center; padding: 20px;";
    modalDiv.innerHTML = `
        <div style="background:#121826; width:100%; max-width:400px; border-radius:12px; padding:20px; border:1px solid rgba(255,255,255,0.1); color:#fff; box-shadow: 0 10px 25px rgba(0,0,0,0.5);">
            <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:15px; border-bottom:1px solid rgba(255,255,255,0.1); padding-bottom:10px;">
                <h3 style="margin:0; font-size:1.1rem;">Seu Carrinho 🛒</h3>
                <button type="button" id="btn-fechar-carrinho-modal" style="background:none; border:none; color:#fff; font-size:1.4rem; cursor:pointer; padding:0 5px;">✕</button>
            </div>
            <div id="modal-carrinho-itens" style="max-height:220px; overflow-y:auto; margin-bottom:15px;"></div>
            <div style="display:flex; justify-content:space-between; align-items:center; font-size:0.95rem; font-weight:bold; margin-bottom:15px; border-top:1px solid rgba(255,255,255,0.1); padding-top:8px;">
                <span>Total:</span>
                <span id="modal-carrinho-total" style="color:#38bdf8;">R$ 0,00</span>
            </div>
            <button onclick="finalizarPedidoWhatsApp(event)" style="width:100%; padding:12px; background:#2563eb; color:#fff; border:none; border-radius:8px; font-weight:bold; cursor:pointer; font-size:0.95rem;">Finalizar Pedido via WhatsApp</button>
        </div>
    `;
    document.body.appendChild(modalDiv);

    document.getElementById('btn-fechar-carrinho-modal').addEventListener('click', (e) => {
        e.stopPropagation();
        fecharCarrinhoModal();
    });

    modalDiv.addEventListener('click', (e) => {
        if (e.target === modalDiv) fecharCarrinhoModal();
    });
}

function abrirCarrinhoModal() {
    const modal = document.getElementById('modal-carrinho-automatico');
    if (modal) {
        renderizarCarrinhoItens();
        modal.style.display = 'flex';
    }
}

function fecharCarrinhoModal() {
    const modal = document.getElementById('modal-carrinho-automatico');
    if (modal) modal.style.display = 'none';
}

function finalizarPedidoWhatsApp(event) {
    if (event) event.preventDefault();

    const usuarioLogado = obterUsuarioLogado();
    const carrinho = obterCarrinho();

    if (carrinho.length === 0) {
        alert('Seu carrinho está vazio!');
        return;
    }

    let total = 0;
    let mensagemItens = "";

    carrinho.forEach((item) => {
        let precoNum = parseFloat(item.preco.replace('.', '').replace(',', '.')) || 0;
        total += precoNum;
        mensagemItens += `\n- ${item.nome} (R$ ${item.preco})`;
    });

    const nomeCliente = usuarioLogado ? usuarioLogado.nome : "Cliente";
    const emailCliente = usuarioLogado ? usuarioLogado.email : "Não informado";

    let textoMensagem = `*Olá! Gostaria de finalizar meu pedido:*\n` +
                        `-----------------------------------\n` +
                        `${mensagemItens}\n` +
                        `-----------------------------------\n` +
                        `*Total Geral:* R$ ${total.toFixed(2).replace('.', ',')}\n\n` +
                        `*Cliente:* ${nomeCliente}\n` +
                        `*E-mail:* ${emailCliente}`;

    const numeroWhatsApp = "5561996210117";

    localStorage.removeItem('dhon_carrinho');
    atualizarContadoresCarrinho();
    fecharCarrinhoModal();

    const urlWhatsApp = `https://api.whatsapp.com/send?phone=${numeroWhatsApp}&text=${encodeURIComponent(textoMensagem)}`;
    window.location.href = urlWhatsApp;
}
