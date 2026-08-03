// --- CONFIGURAÇÃO DO FIREBASE (Projeto: lojinha-dos-cria) ---
// Substitua os campos abaixo com as credenciais reais obtidas no seu painel do Firebase
const firebaseConfig = {
    apiKey: "SUA_API_KEY_DO_FIREBASE", 
    authDomain: "lojinha-dos-cria.firebaseapp.com",
    projectId: "lojinha-dos-cria",
    storageBucket: "lojinha-dos-cria.appspot.com",
    messagingSenderId: "SEU_MESSAGING_SENDER_ID",
    appId: "SEU_APP_ID"
};

// Inicializa o Firebase de forma segura
if (!firebase.apps.length) {
    firebase.initializeApp(firebaseConfig);
}
const db = firebase.firestore();


// --- BANCO DE DADOS LOCAL (Usuários e Carrinho Temporário) ---

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
    if (usuarios.some(u => u.email.toLowerCase() === email)) {
        alert('Este e-mail já está cadastrado!');
        return;
    }

    const novoUsuario = { nome, email, senha, foto: "", admin: false };
    usuarios.push(novoUsuario);
    salvarUsuarios(usuarios);
    
    localStorage.removeItem('dhon_carrinho');
    salvarUsuarioLogado(novoUsuario);

    alert('Cadastro realizado com sucesso!');
    window.location.href = 'painel.html';
}

function fazerLogout() {
    localStorage.removeItem('dhon_usuario_logado');
    localStorage.removeItem('dhon_carrinho');
    window.location.href = 'index.html';
}


// --- MENU LATERAL (SIDEBAR) ---
function toggleMenu() {
    const sidebar = document.getElementById('sidebar-menu');
    if (sidebar) sidebar.classList.toggle('menu-ativo');
}


// --- INICIALIZAÇÃO DE TELA E PERFIL ---
document.addEventListener('DOMContentLoaded', () => {
    obterUsuarios();
    const usuarioLogado = obterUsuarioLogado();
    
    const inputEmail = document.getElementById('input-perfil-email');
    const inputNome = document.getElementById('input-perfil-nome');
    const avatarPreview = document.getElementById('perfil-avatar-preview');
    const avataresIcone = document.querySelectorAll('.avatar-icone, #avatar-icone-topo, .usuario-avatar-img');

    if (usuarioLogado) {
        if (inputEmail) inputEmail.value = usuarioLogado.email || '';
        if (inputNome) inputNome.value = usuarioLogado.nome || '';
        if (usuarioLogado.foto) {
            if (avatarPreview) {
                avatarPreview.innerHTML = `<img src="${usuarioLogado.foto}" style="width:100%;height:100%;object-fit:cover;">`;
            }
            avataresIcone.forEach(el => {
                el.innerHTML = `<img src="${usuarioLogado.foto}" style="width:100%;height:100%;object-fit:cover;border-radius:50%;">`;
            });
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
    renderizarDestaques();
    renderizarCarrinhoItens();
    atualizarContadoresCarrinho();
    verificarPermissaoAdmin();
});

async function salvarPerfil(event) {
    if (event) event.preventDefault();
    let usuarioLogado = obterUsuarioLogado();
    
    if (!usuarioLogado) {
        const inputEmail = document.getElementById('input-perfil-email');
        if (inputEmail && inputEmail.value) {
            const emailTela = inputEmail.value.trim().toLowerCase();
            const usuarios = obterUsuarios();
            usuarioLogado = usuarios.find(u => u.email.toLowerCase() === emailTela);
            if (usuarioLogado) salvarUsuarioLogado(usuarioLogado);
        }
    }

    if (!usuarioLogado) {
        alert('Sessão expirada. Por favor, faça login novamente.');
        window.location.href = 'index.html';
        return;
    }

    const inputNome = document.getElementById('input-perfil-nome');
    const senhaAtualEl = document.getElementById('input-senha-atual');
    const novaSenhaEl = document.getElementById('input-senha-nova');
    const inputFoto = document.getElementById('input-perfil-foto');

    if (inputNome && inputNome.value.trim()) usuarioLogado.nome = inputNome.value.trim();

    const senhaAtual = senhaAtualEl ? senhaAtualEl.value : '';
    const novaSenha = novaSenhaEl ? novaSenhaEl.value : '';

    if (novaSenha) {
        if (senhaAtual !== usuarioLogado.senha) {
            alert('A senha atual está incorreta!');
            return;
        }
        usuarioLogado.senha = novaSenha;
    }

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
            console.error("Erro ao compactar a foto:", erro);
        }
    }

    salvarUsuarioLogado(usuarioLogado);
    let usuarios = obterUsuarios();
    usuarios = usuarios.map(u => u.email.toLowerCase() === usuarioLogado.email.toLowerCase() ? usuarioLogado : u);
    salvarUsuarios(usuarios);

    alert('Perfil e foto atualizados com sucesso!');
    location.reload();
}


// --- GESTÃO DE PRODUTOS VIA FIREBASE (Nuvem em Tempo Real) ---

function verificarPermissaoAdmin() {
    const usuarioLogado = obterUsuarioLogado();
    const painelAdmin = document.getElementById('painel-admin-container');
    if (painelAdmin) {
        painelAdmin.style.display = (usuarioLogado && usuarioLogado.admin) ? 'block' : 'none';
    }
}

async function obterProdutosDaNuvem() {
    try {
        const snapshot = await db.collection("produtos").get();
        let produtos = [];
        snapshot.forEach(doc => {
            produtos.push({ idDoc: doc.id, ...doc.data() });
        });
        
        if (produtos.length === 0) {
            const produtosIniciais = [
                { id: 1, nome: "Fone Bluetooth Pro", preco: "199,90", foto: "" },
                { id: 2, nome: "Smartwatch Ultra", preco: "299,90", foto: "" },
                { id: 3, nome: "Perfume Importado 100ml", preco: "350,00", foto: "" },
                { id: 4, nome: "Tênis esportivo Importado", preco: "450,00", foto: "" }
            ];
            for (let p of produtosIniciais) {
                await db.collection("produtos").add(p);
            }
            return obterProdutosDaNuvem();
        }
        return produtos;
    } catch (erro) {
        console.error("Erro ao buscar produtos da nuvem:", erro);
        return [];
    }
}

async function cadastrarProduto(event) {
    if (event) event.preventDefault();
    const usuarioLogado = obterUsuarioLogado();
    if (!usuarioLogado || !usuarioLogado.admin) {
        alert('Acesso negado! Apenas o administrador pode cadastrar produtos.');
        return;
    }

    const nome = document.getElementById('prod-nome').value.trim();
    const preco = document.getElementById('prod-preco').value.trim();
    const inputFoto = document.getElementById('prod-foto');

    const salvarNoBancoNuvem = async (urlFoto = "") => {
        try {
            await db.collection("produtos").add({
                id: Date.now(),
                nome: nome,
                preco: preco,
                foto: urlFoto
            });
            alert('Produto cadastrado com sucesso na nuvem para todos os usuários!');
            document.getElementById('form-add-produto').reset();
            renderizarProdutosVitrine();
            renderizarDestaques();
        } catch (erro) {
            alert('Erro ao salvar produto: ' + erro.message);
        }
    };

    if (inputFoto && inputFoto.files && inputFoto.files[0]) {
        const reader = new FileReader();
        reader.onload = function(e) {
            salvarNoBancoNuvem(e.target.result);
        };
        reader.readAsDataURL(inputFoto.files[0]);
    } else {
        salvarNoBancoNuvem("");
    }
}

async function excluirProduto(idDoc) {
    const usuarioLogado = obterUsuarioLogado();
    if (!usuarioLogado || !usuarioLogado.admin) {
        alert('Acesso negado!');
        return;
    }

    if (confirm('Tem certeza que deseja excluir este produto para todos os usuários?')) {
        try {
            await db.collection("produtos").doc(idDoc).delete();
            alert('Produto excluído com sucesso!');
            renderizarProdutosVitrine();
            renderizarDestaques();
        } catch (erro) {
            alert('Erro ao excluir: ' + erro.message);
        }
    }
}

async function renderizarProdutosVitrine() {
    const vitrine = document.getElementById('vitrine-produtos') || document.getElementById('lista-produtos');
    if (!vitrine) return;

    const produtos = await obterProdutosDaNuvem();
    vitrine.innerHTML = '';

    const usuarioLogado = obterUsuarioLogado();
    const isAdmin = usuarioLogado && usuarioLogado.admin;

    produtos.forEach(prod => {
        const card = document.createElement('div');
        card.className = 'produto-card';
        let imagemHTML = prod.foto ? `<img src="${prod.foto}" style="width:100%; height:100px; object-fit:cover; border-radius:8px; margin-bottom:8px;">` : `<div class="prod-img-placeholder">📦</div>`;

        let botaoAdminHTML = isAdmin ? `<button onclick="excluirProduto('${prod.idDoc}')" style="width:100%; padding:5px; background:#ef4444; color:#fff; border:none; border-radius:6px; font-size:0.7rem; cursor:pointer; margin-top:4px;">Excluir</button>` : '';

        card.innerHTML = `
            ${imagemHTML}
            <h4>${prod.nome}</h4>
            <div class="prod-rating">⭐⭐⭐⭐⭐</div>
            <div class="preco" style="margin-bottom: 8px;">R$ ${prod.preco}</div>
            <button onclick="adicionarAoCarrinhoPorId('${prod.idDoc}')" style="width:100%; padding:6px; background:#2563eb; color:#fff; border:none; border-radius:6px; font-size:0.75rem; cursor:pointer;">Comprar / Carrinho</button>
            ${botaoAdminHTML}
        `;
        vitrine.appendChild(card);
    });
}

async function renderizarDestaques() {
    const destaques = document.getElementById('destaques-grid');
    if (!destaques) return;

    const produtos = (await obterProdutosDaNuvem()).slice(0, 4);
    destaques.innerHTML = '';

    produtos.forEach(prod => {
        let imagemHTML = prod.foto ? `<img src="${prod.foto}" style="width:100%; height:100px; object-fit:cover; border-radius:8px; margin-bottom:8px;">` : `<div class="prod-img-placeholder">⭐</div>`;
        const card = document.createElement('div');
        card.className = 'produto-card';
        card.innerHTML = `
            ${imagemHTML}
            <h4>${prod.nome}</h4>
            <div class="prod-rating">⭐⭐⭐⭐⭐</div>
            <div class="preco" style="margin-bottom: 8px;">R$ ${prod.preco}</div>
            <button onclick="adicionarAoCarrinhoPorId('${prod.idDoc}')" style="width:100%; padding:6px; background:#2563eb; color:#fff; border:none; border-radius:6px; font-size:0.75rem; cursor:pointer;">Adicionar</button>
        `;
        destaques.appendChild(card);
    });
}


// --- CARRINHO E WHATSAPP ---

async function adicionarAoCarrinhoPorId(idDoc) {
    const produtos = await obterProdutosDaNuvem();
    const produto = produtos.find(p => p.idDoc === idDoc);
    if (!produto) return;

    let carrinho = obterCarrinho();
    carrinho.push(produto);
    salvarCarrinho(carrinho);
    alert(`"${produto.nome}" foi adicionado ao carrinho!`);
    renderizarCarrinhoItens();
}

function renderizarCarrinhoItens() {
    const lista = document.getElementById('lista-itens-carrinho') || document.getElementById('itens-carrinho-container') || document.getElementById('modal-carrinho-itens');
    if (!lista) return;

    const carrinho = obterCarrinho();
    lista.innerHTML = '';

    if (carrinho.length === 0) {
        lista.innerHTML = `<p style="color:#aaa; text-align:center; font-size:0.85rem; padding: 15px;">Seu carrinho está vazio.</p>`;
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
    ['carrinho-total', 'modal-carrinho-total'].forEach(id => {
        const elTotal = document.getElementById(id);
        if (elTotal) elTotal.textContent = `R$ ${total.toFixed(2).replace('.', ',')}`;
    });
}

function atualizarContadoresCarrinho() {
    const qtd = obterCarrinho().length;
    ['header-cart-counter', 'menu-cart-counter', 'cart-counter', 'footer-cart-count', 'contador-carrinho'].forEach(id => {
        const el = document.getElementById(id);
        if (el) el.textContent = qtd;
    });
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

    const caixaCarrinhoTopo = document.querySelector('div:has(> span#contador-carrinho), div:has(> span#cart-counter), div:has(> span#header-cart-counter)');
    if (caixaCarrinhoTopo) {
        caixaCarrinhoTopo.style.cursor = 'pointer';
        caixaCarrinhoTopo.addEventListener('click', (e) => {
            e.stopPropagation();
            abrirCarrinhoModal();
        });
    } else {
        document.querySelectorAll('div').forEach(el => {
            if (!el.innerHTML.includes('☰') && !el.id.includes('sidebar') && (el.innerHTML.includes('🛒') || el.querySelector('.fa-cart-shopping, .fa-shopping-cart'))) {
                el.style.cursor = 'pointer';
                el.addEventListener('click', (e) => {
                    e.stopPropagation();
                    abrirCarrinhoModal();
                });
            }
        });
    }
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
        alert('Seu carrinho está vazio! Adicione produtos antes de finalizar o pedido.');
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
