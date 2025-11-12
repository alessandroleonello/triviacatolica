// =================================================================
// 1. CONFIGURAÇÃO DO FIREBASE
// COLE O OBJETO 'firebaseConfig' QUE VOCÊ COPIOU DO SEU PROJETO AQUI
// =================================================================

const firebaseConfig = {
     apiKey: "AIzaSyCvbreEJbBUbqhXLKuugdt8uU0GvLilXtY",
  authDomain: "perguntados-catolico.firebaseapp.com",
  projectId: "perguntados-catolico",
  storageBucket: "perguntados-catolico.firebasestorage.app",
  messagingSenderId: "352461003203",
  appId: "1:352461003203:web:fe5179c4bec7086ff84576"
};

// =================================================================
// (Fim da configuração)
// =================================================================


// Inicializa o Firebase
firebase.initializeApp(firebaseConfig);



// Referências aos serviços do Firebase que vamos usar
const auth = firebase.auth();
const db = firebase.firestore();
const provider = new firebase.auth.GoogleAuthProvider(); // Provedor de login do Google

// Referências aos Elementos da DOM
const screens = document.querySelectorAll('.screen');
const loginButton = document.getElementById('login-google-btn');
const logoutButton = document.getElementById('logout-btn');
const rouletteWheel = document.getElementById('roulette-wheel');
const spinRouletteBtn = document.getElementById('spin-roulette-btn');

let perguntaEmAvaliacao = null; // Guarda o documento da pergunta
let perguntaAtual = null; // Guarda a pergunta do jogo
let correctAnswerText = "";
let placarAtual = { nivel: 1, pontos: 0, recordeTempo: 0 }; // <-- Adicione recordeTempo aqui
let perguntaAtualID = null; // Guarda o ID da pergunta que está na tela
let perguntasRespondidasSet = new Set(); // Guarda localmente as IDs já respondidas
let currentRouletteRotation = 0;
let gameTimer = null; // Guarda o ID do setInterval do timer
let timeLeft = 60; // Segundos para o modo tempo
let currentMode = 'torre'; // Controla qual modo está ativo
let timeAttackScore = 0; // Pontuação do modo tempo

// Botões de Navegação
const modeButtons = document.querySelectorAll('.mode-button');
const factoryBackButton = document.getElementById('factory-back-btn');
const gameBackButton = document.getElementById('game-back-btn');
const rouletteBackButton = document.getElementById('roulette-back-btn'); // <-- ADICIONE ESTA LINHA
const collectionGrid = document.getElementById('collection-grid');
const collectionBackButton = document.getElementById('collection-back-btn');
const characterUnlockedPopup = document.getElementById('character-unlocked-popup');
const unlockedCharacterImg = document.getElementById('unlocked-character-img');
const unlockedCharacterName = document.getElementById('unlocked-character-name');
const popupCloseBtn = document.getElementById('popup-close-btn');
const rankingList = document.getElementById('ranking-list');
const userRankingDisplay = document.getElementById('user-ranking-display');
const rankingBackButton = document.getElementById('ranking-back-btn');

const audioCorrect = document.getElementById('audio-correct');
const audioWrong = document.getElementById('audio-wrong');
const audioClick = document.getElementById('audio-click');
const audioSpin = document.getElementById('audio-spin');

// SUBSTITUA O SEU ARRAY DE CATEGORIAS POR ESTE
const CATEGORIES = [
    { name: "Sagradas Escrituras", icon: "📖", color: "#ffc300", dbValue: "escrituras" }, // 1. Amarelo
    { name: "Santos e Mártires", icon: "😇", color: "#ff5a5a", dbValue: "santos" },     // 2. Vermelho
    { name: "Doutrina e Dogmas", icon: "📚", color: "#00aaff", dbValue: "doutrina" },   // 3. Azul
    { name: "História da Igreja", icon: "📜", color: "#90d636", dbValue: "historia" },   // 4. Verde
    { name: "Liturgia e Sacramentos", icon: "🕯️", color: "#9966cc", dbValue: "liturgia" },   // 5. Roxo
    { name: "Arte e Cultura Sacra", icon: "🖼️", color: "#ff9900", dbValue: "arte" }      // 6. Laranja
];


// LISTA DE RECOMPENSAS (O 'id' deve bater com o nome do seu arquivo de imagem)
const PERSONAGENS = [
    { nivel: 5,  id: "sao_joao_paulo_2", nome: "São João Paulo II" },
    { nivel: 10, id: "santa_terezinha", nome: "Santa Teresinha" },
    { nivel: 15, id: "frei_gilson", nome: "Frei Gilson" },
    { nivel: 20, id: "sao_miguel", nome: "São Miguel Arcanjo" }
    // (Adicione quantos quiser)
];

// --- 1. MÓDULO DE AUTENTICAÇÃO (O "PORTEIRO") ---

// Esta função fica "ouvindo" o estado do login
auth.onAuthStateChanged(user => {
    if (user) {
        // Usuário está logado!
        console.log("Usuário logado:", user.uid);
        
        // 1. Busca os dados do usuário no Firestore ou cria um novo perfil
        setupUser(user);
        
        // 2. Mostra a tela principal do jogo (home)
        showScreen('home-screen');
    } else {
        // Usuário está deslogado
        console.log("Nenhum usuário logado.");
        
        // 1. Mostra a tela de login
        showScreen('login-screen');
    }
});

collectionBackButton.addEventListener('click', () => {
    playAudio(audioClick);
    showScreen('home-screen');
});
// Evento de clique no botão de Login
loginButton.addEventListener('click', () => {
    playAudio(audioClick);
    console.log("Tentando login com Google...");
    // Este comando abre o Pop-up do Google
    auth.signInWithPopup(provider)
        .then(result => {
            // Login bem-sucedido!
            console.log("Login com sucesso!", result.user);
            // O 'onAuthStateChanged' vai detectar essa mudança e trocar a tela
        })
        .catch(error => {
            // Trata erros que podem acontecer
            console.error("Erro no login: ", error);
            alert("Erro ao fazer login: " + error.message);
        });
});

// Evento de clique no botão de Logout (com confirmação)
logoutButton.addEventListener('click', () => {
    playAudio(audioClick);
    
    // 1. Adiciona a caixa de confirmação
    if (confirm("Você realmente deseja sair?")) {
        
        // 2. Se o usuário clicar "OK", executa o logout
        console.log("Saindo...");
        
        auth.signOut()
            .then(() => {
                console.log("Usuário deslogado com sucesso.");
                // O onAuthStateChanged vai detectar a saída e trocar a tela
            })
            .catch(error => {
                console.error("Erro ao fazer logout:", error);
            });
            
    } else {
        // 3. Se o usuário clicar "Cancelar", não faz nada
        console.log("Logout cancelado.");
    }
});
/**
 * Helper para tocar sons
 */
function playAudio(audioElement) {
    if (audioElement) {
        audioElement.currentTime = 0; // Reinicia o som
        audioElement.play();
    }
}
/**
 * Helper: Embaralha um array (Algoritmo Fisher-Yates)
 */
function shuffleArray(array) {
    // Cria uma cópia para não modificar o original
    let newArray = [...array]; 
    for (let i = newArray.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [newArray[i], newArray[j]] = [newArray[j], newArray[i]];
    }
    return newArray;
}
/**
 * Função para configurar o usuário no Firestore.
 * Roda logo após o login.
 */
async function setupUser(user) {
    // Cria uma referência para o documento do usuário (ex: /usuarios/ID_DO_USUARIO)
    const userRef = db.collection('usuarios').doc(user.uid);
    const doc = await userRef.get(); // Tenta ler o documento

    let userData; // Variável para guardar os dados

    if (!doc.exists) {
        // Se o documento NÃO existe, é o primeiro login do usuário!
        console.log("Criando novo perfil de usuário no Firestore...");
        
        // Cria um objeto com os dados padrão do novo usuário
        userData = {
            nome: user.displayName,
            email: user.email,
            fotoURL: user.photoURL,
            pontosTotais: 0,
            nivelTorre: 1,
            personagensConquistados: [],
            recordeTempo: 0,
            perguntasRespondidas: []
        };
        
        // Salva esse objeto no Firestore
        await userRef.set(userData);

    } else {
        // Se o documento JÁ existe, apenas carrega os dados
        console.log("Carregando perfil existente...");
        userData = doc.data();
    }
    
    // (Código Melhorado)
// Atualiza a UI da Tela Home com os dados (novos ou existentes)
document.getElementById('user-name').textContent = userData.nome;
document.getElementById('user-score').textContent = userData.pontosTotais;

document.getElementById('user-level').textContent = userData.nivelTorre || 1;

// SÓ atualiza a foto SE ela existir (não for nula)
if (userData.fotoURL) {
    document.getElementById('user-photo').src = userData.fotoURL;
}
// Se não existir, o código vai simplesmente ignorar e manter
// a imagem "avatar-default.png" que definimos no HTML.
}


// --- 2. NAVEGAÇÃO ENTRE TELAS ---

// Função helper para mostrar a tela correta
function showScreen(screenId) {
    screens.forEach(screen => {
        screen.classList.remove('active');
    });
    document.getElementById(screenId).classList.add('active');
}

// Eventos dos botões do Menu
modeButtons.forEach(button => {
    button.addEventListener('click', () => {
        playAudio(audioClick);
        const mode = button.dataset.mode;
        if (mode === 'torre') {
            startGame('torre');
        } else if (mode === 'tempo') {
            startGame('tempo');
        } else if (mode === 'fabrica') {
            showScreen('factory-screen');
        } else if (mode === 'colecao') {
            // É AQUI!
            loadCollection(); // Chama a nova função
            showScreen('collection-screen');
        } else if (mode === 'ranking') {
            // É AQUI!
            loadRanking(); // Chama a nova função
            showScreen('ranking-screen');
        }
    });
});

// Botão de voltar do ranking
rankingBackButton.addEventListener('click', () => {
    playAudio(audioClick);
    showScreen('home-screen');
});
// Botão de voltar da fábrica
factoryBackButton.addEventListener('click', () =>{ playAudio(audioClick); showScreen('home-screen')});

// Evento de clique no Botão Voltar (do Jogo)
gameBackButton.addEventListener('click', () => {
    playAudio(audioClick);
    // É ESSENCIAL parar o timer se ele estiver rodando
    pauseTimer();
    
    // Volta para a tela home
    showScreen('home-screen');
});

// Botão Voltar da Roleta
rouletteBackButton.addEventListener('click', () => {
    playAudio(audioClick);
    
    // Pausa o timer (importante se estiver no Modo Tempo)
    pauseTimer(); 
    
    // Volta para a home
    showScreen('home-screen');
});

// Evento de clique no botão de Girar Roleta (CORRIGIDO)
spinRouletteBtn.addEventListener('click', () => {
    playAudio(audioSpin);
    spinRouletteBtn.disabled = true;
    console.log("Girando a roleta...");

    const numCategories = CATEGORIES.length;
    const sliceAngle = 360 / numCategories;
    
    // --- LÓGICA DE GIRO CORRIGIDA ---

    // 1. Calcula um giro aleatório NOVO (quantos graus ELA VAI ANDAR)
    // Mínimo de 5 voltas (5 * 360) + um ângulo aleatório (0 a 360)
    // Isso garante que ela sempre gire rápido!
    const randomSpinAmount = (5 * 360) + (Math.random() * 360);
    
    // 2. Adiciona o novo giro à rotação que ela já tinha
    const newTotalRotation = currentRouletteRotation + randomSpinAmount;

    // 3. Ajusta (snap) para parar no meio da fatia mais próxima
    const finalRotation = Math.round(newTotalRotation / sliceAngle) * sliceAngle + (sliceAngle / 2);

    // 4. Salva a nova rotação final como a "atual" para o próximo giro
    currentRouletteRotation = finalRotation;

    // 5. Aplica a animação de giro no CSS
    rouletteWheel.style.transform = `rotate(${finalRotation}deg)`;
    
    // --- FIM DA LÓGICA CORRIGIDA ---

    // 6. Descobre qual categoria foi sorteada
    const normalizedAngle = (finalRotation % 360);
    const selectedIndex = Math.floor((360 - normalizedAngle + (sliceAngle / 2)) % 360 / sliceAngle);
    const selectedCategory = CATEGORIES[selectedIndex];

    console.log(`Categoria Sorteada: ${selectedCategory.name} (Ângulo: ${finalRotation})`);

    // 7. Espera a animação terminar
    setTimeout(() => {
        // Carrega a pergunta da categoria sorteada
        fetchAndDisplayQuestion(selectedCategory.dbValue); 
        
        // Vai para a tela de jogo
        showScreen('game-screen');
        
        // SE FOR MODO TEMPO, COMEÇA/RETOMA O TIMER!
        if (currentMode === 'tempo') {
            startTimer();
        }
        
        // Reseta a roleta
        spinRouletteBtn.disabled = false;

    }, 4500); // 4000ms da animação + 500ms de buffer
});
// Desenha a roleta ao iniciar o script
drawRouletteWheel();

// =======================================================
// --- 3. LÓGICA DO JOGO (CONECTADO) ---
// =======================================================

const gameModeTitle = document.getElementById('game-mode-title');
const gameTimerOrLevel = document.getElementById('game-timer-or-level');
const questionText = document.getElementById('question-text');
const answerOptions = document.querySelectorAll('.option');

/**
 * Desenha os ícones da roleta (V10 - A LÓGICA DE JS ESTÁ CORRETA)
 */
function drawRouletteWheel() {
    rouletteWheel.innerHTML = ''; // Limpa a roleta
    const numCategories = CATEGORIES.length;
    const sliceAngle = 360 / numCategories; // 60deg

    CATEGORIES.forEach((category, index) => {
        const iconContainer = document.createElement('div');
        iconContainer.classList.add('roulette-icon-container');
        
        // 1. Calcula o ângulo do centro da fatia (0deg = Topo)
        const cssAngle = (index * sliceAngle) + (sliceAngle / 2);
        
        // 2. Converte o ângulo do CSS para o ângulo do 'transform' (0deg = Direita)
        //    Subtraindo 90 graus.
        const transformAngle = cssAngle - 90;
        
        // 3. Seta a variável CSS que será usada para girar o container
        iconContainer.style.setProperty('--rotation', `${transformAngle}deg`);

        // Conteúdo (Ícone e Nome) - Com a rotação radial
        iconContainer.innerHTML = `
            <div class="roulette-icon-content">
                <span class="category-icon">${category.icon}</span>
                <span class="category-name">${category.name}</span>
            </div>
        `;
        rouletteWheel.appendChild(iconContainer);
    });
}
/**
 * Inicia o Jogo (Modo Torre ou Tempo)
 */
async function startGame(mode) {
    console.log(`Iniciando jogo: ${mode}`);
    const user = auth.currentUser;
    if (!user) return; // Segurança

    currentMode = mode; // Define o modo atual
    resetAnswerOptions();

    // 1. Busca os dados do usuário para começar o jogo
    const userRef = db.collection('usuarios').doc(user.uid);
    const doc = await userRef.get();
    
    if (!doc.exists) {
        console.error("Usuário não encontrado no Firestore?");
        return;
    }

    const userData = doc.data();
    
    // 2. Prepara o placar da sessão
    placarAtual = {
        nivel: userData.nivelTorre || 1,
        pontos: userData.pontosTotais || 0,
        recordeTempo: userData.recordeTempo || 0 // Carrega o recorde
    };
// --- ADICIONE ESTAS DUAS LINHAS ---
    // Carrega a lista de perguntas já respondidas do banco de dados
    perguntasRespondidasSet = new Set(userData.perguntasRespondidas || []);
    console.log(`Carregou ${perguntasRespondidasSet.size} perguntas já respondidas.`);
    // 3. Atualiza a UI do Jogo
    if (mode === 'torre') {
        gameModeTitle.textContent = 'MODO TORRE';
        gameTimerOrLevel.textContent = `Nível ${placarAtual.nivel}`;
    } else {
        // Preparação do MODO TEMPO
        gameModeTitle.textContent = 'CONTRA O TEMPO';
        timeAttackScore = 0; // Reseta a pontuação da partida
        timeLeft = 60; // Reseta o tempo
       
    }
    
    // 4. Busca a primeira pergunta
    
    showScreen('roulette-screen');
}

/**
 * Inicia/Retoma o contador (para Modo Tempo)
 */
function startTimer() {
    // 1. Limpa qualquer timer antigo
    clearInterval(gameTimer); 
    
    // 2. --- ESTA É A CORREÇÃO ---
    // Formata o tempo restante ATUAL (timeLeft), em vez de resetar para "01:00"
    const minutes = Math.floor(timeLeft / 60);
    const seconds = timeLeft % 60;
    gameTimerOrLevel.textContent = 
        `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;

    // 3. Inicia o novo intervalo (o "tick" do relógio)
    gameTimer = setInterval(() => {
        timeLeft--; // Decrementa o tempo

        // Formata o tempo para MM:SS
        const minutes = Math.floor(timeLeft / 60);
        const seconds = timeLeft % 60;
        gameTimerOrLevel.textContent = 
            `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;

        // Quando o tempo acaba
        if (timeLeft <= 0) {
            endGame('tempo'); // Chama a função de fim de jogo
        }
    }, 1000); // Roda a cada 1 segundo
}
/**
 * Para o contador (se estiver rodando)
 */
function pauseTimer() {
    clearInterval(gameTimer);
    gameTimer = null; // Limpa o ID do timer
}

/**
 * Função unificada para Fim de Jogo
 */
async function endGame(mode) {
    if (mode === 'torre') {
        // Fim de jogo do Modo Torre (errou a pergunta)
        alert("Fim de jogo! Você errou.");
        showScreen('home-screen');

    } else if (mode === 'tempo') {
        // Fim de jogo do Modo Tempo (tempo esgotado)
        pauseTimer(); // Para o relógio
        alert(`Tempo esgotado! Pontuação final: ${timeAttackScore}`);
        
        // Verifica se é um novo recorde
        if (timeAttackScore > placarAtual.recordeTempo) {
            alert(`Novo recorde: ${timeAttackScore} pontos!`);
            
            // Salva o novo recorde no Firestore
            const userRef = db.collection('usuarios').doc(auth.currentUser.uid);
            await userRef.update({ recordeTempo: timeAttackScore });
        }
        showScreen('home-screen');
    }
}
/**
 * Procura recursivamente por uma pergunta não respondida.
 * Tenta 10 vezes antes de resetar a lista do usuário.
 */
async function findUnansweredQuestion(categoryName, retryCount) {
    const MAX_RETRIES = 10; // Tenta 10 vezes
    
    console.log(`Buscando pergunta. Tentativa: ${retryCount + 1}`);

    // 1. Se estourar as tentativas, assume que o usuário viu tudo e reseta
    if (retryCount >= MAX_RETRIES) {
        console.warn("Muitas repetições! Resetando a lista de perguntas respondidas.");
        alert("Parabéns! Você respondeu todas as perguntas desta categoria. O ciclo será reiniciado.");
        
        const userRef = db.collection('usuarios').doc(auth.currentUser.uid);
        await userRef.update({ perguntasRespondidas: [] }); // Limpa no Firestore
        perguntasRespondidasSet.clear(); // Limpa localmente
    }
    
    // 2. Define a consulta base
    let query = db.collection('perguntas_publicadas');

    // VERIFICA SE UMA CATEGORIA FOI FORNECIDA
    if (categoryName) {
        console.log("Buscando pergunta da categoria:", categoryName);
        query = query.where('categoria', '==', categoryName);
    } else {
        console.warn("Nenhuma categoria fornecida, buscando em todas.");
        // (A consulta continua sem filtro de categoria, o que é OK)
    }
    
    const randomId = db.collection('__').doc().id;
    let snapshot = await query.where(firebase.firestore.FieldPath.documentId(), '>=', randomId)
                              .limit(1)
                              .get();
    
    if (snapshot.empty) {
        // Fallback (se o randomId for maior que todos)
        snapshot = await query.where(firebase.firestore.FieldPath.documentId(), '<=', randomId)
                              .limit(1)
                              .get();
    }
    
    // 3. Se a categoria estiver vazia, busca em qualquer outra
    if (snapshot.empty) {
        console.warn(`Categoria ${categoryName} está vazia. Buscando qualquer pergunta.`);
        snapshot = await db.collection('perguntas_publicadas')
                           .where(firebase.firestore.FieldPath.documentId(), '>=', randomId)
                           .limit(1).get();
        
        if (snapshot.empty) { // Fallback 2
             snapshot = await db.collection('perguntas_publicadas').limit(1).get();
        }

        if(snapshot.empty) return null; // Banco de dados inteiro está vazio
    }

    const doc = snapshot.docs[0];
    
    // 4. VERIFICAÇÃO PRINCIPAL
    // Se for Modo Torre E a pergunta já foi respondida...
    if (currentMode === 'torre' && perguntasRespondidasSet.has(doc.id)) {
        // É uma repetição! Tenta de novo (recursão)
        console.log(`Pergunta repetida (${doc.id}). Re-rolando...`);
        return findUnansweredQuestion(categoryName, retryCount + 1);
    } else {
        // É uma pergunta nova (ou Modo Tempo, onde repetição é ok)
        return doc; // Encontrou!
    }
}
/**
 * Busca e exibe uma pergunta (agora com verificação de repetição)
 */
async function fetchAndDisplayQuestion(categoryName) {
    resetAnswerOptions();

    // 1. Encontra uma pergunta não respondida usando a nova lógica
    const doc = await findUnansweredQuestion(categoryName, 0); // Começa a busca
    
    if (!doc) {
        console.error("Não foi possível carregar uma pergunta.");
        questionText.textContent = "Erro ao carregar pergunta. Tente novamente.";
        perguntaAtual = null;
        return;
    }
    
    // 2. Salva os dados da pergunta
    perguntaAtual = doc.data();
    perguntaAtualID = doc.id; // Salva o ID da pergunta atual

    // 3. Guarda o TEXTO da resposta correta
    correctAnswerText = perguntaAtual.opcoes[perguntaAtual.respostaCorreta];

    // 4. Embaralha as opções
    const shuffledOptions = shuffleArray(perguntaAtual.opcoes);

    // 5. Preenche a UI
    questionText.textContent = perguntaAtual.texto;
    answerOptions.forEach((button, index) => {
        button.textContent = shuffledOptions[index];
    });
}
/**
 * Evento de clique nas opções de resposta (Atualizado para checar por TEXTO)
 */
answerOptions.forEach(button => {
    button.addEventListener('click', (e) => {
        // Trava os botões
        if (!perguntaAtual || (currentMode === 'tempo' && timeLeft <= 0)) return; 
        answerOptions.forEach(btn => btn.disabled = true);

        const clickedButton = e.target;
        const clickedAnswerText = clickedButton.textContent; // Pega o texto do botão clicado

        // Verifica se o TEXTO clicado é igual ao TEXTO correto
        if (clickedAnswerText === correctAnswerText) {
            
            // --- RESPOSTA CORRETA ---
            clickedButton.classList.add('correct');
            if (currentMode === 'torre') {
                handleCorrectAnswer();
            } else {
                handleTimeAttackCorrect();
            }
            
        } else {
            
            // --- RESPOSTA ERRADA ---
            clickedButton.classList.add('wrong');
            
            // Encontra e mostra o botão correto (comparando o texto)
            answerOptions.forEach(btn => {
                if (btn.textContent === correctAnswerText) {
                    btn.classList.add('correct');
                }
            });
            
            if (currentMode === 'torre') {
                handleWrongAnswer();
            } else {
                handleTimeAttackWrong();
            }
        }
    });
});
/**
 * Lida com a resposta CORRETA (Com correção de loop)
 */
async function handleCorrectAnswer() {
    playAudio(audioCorrect);
    console.log("Resposta Correta!");

    // 1. Guarda o nível ATUAL
    const nivelAtual = placarAtual.nivel;

    // 2. Atualiza o placar da sessão
    placarAtual.nivel++;
    placarAtual.pontos += 10;

    // 3. Atualiza a UI
    gameTimerOrLevel.textContent = `Nível ${placarAtual.nivel}`;
    document.getElementById('user-score').textContent = placarAtual.pontos;
    document.getElementById('user-level').textContent = placarAtual.nivel;

    // 4. Salva no Firestore
    const userRef = db.collection('usuarios').doc(auth.currentUser.uid);
    await userRef.update({
        nivelTorre: placarAtual.nivel,
        pontosTotais: placarAtual.pontos
    });
    // --- ADICIONE ESTE BLOCO ---
    // Salva a pergunta como "respondida" no Firestore e localmente
    if (perguntaAtualID) {
        await userRef.update({
            perguntasRespondidas: firebase.firestore.FieldValue.arrayUnion(perguntaAtualID)
        });
        perguntasRespondidasSet.add(perguntaAtualID); // Atualiza o cache local
        console.log(`Salvo ${perguntaAtualID} como respondida.`);
    }
    // --- FIM DO NOVO BLOCO ---
    // 5. !!! LÓGICA DE DESBLOQUEIO (CORRIGIDA) !!!
    const recompensa = PERSONAGENS.find(p => p.nivel === placarAtual.nivel);
    
    if (recompensa) {
        // ENCONTROU RECOMPENSA: Mostra o Popup
        console.log(`Desbloqueou: ${recompensa.nome}`);
        
        await userRef.update({
            personagensConquistados: firebase.firestore.FieldValue.arrayUnion(recompensa.id)
        });
        
        setTimeout(() => {
            unlockedCharacterImg.src = `images/personagens/${recompensa.id}.png`;
            unlockedCharacterName.textContent = recompensa.nome;
            characterUnlockedPopup.classList.add('active');
            // (O botão do popup vai te levar para a roleta)
        }, 1000);
    
    } else {
        // NÃO ENCONTROU RECOMPENSA: Volta direto para a roleta
        // ESTE É O BLOCO QUE FALTAVA
        setTimeout(() => {
            showScreen('roulette-screen');
        }, 1500); // 1.5 segundos após mostrar a resposta correta
    }
}
/**
 * Lida com a resposta ERRADA (Modo Torre)
 */
function handleWrongAnswer() {
    playAudio(audioWrong);
    console.log("Resposta Errada!");
    
    // Espera 2 segundos e chama o fim de jogo
    setTimeout(() => {
        endGame('torre');
    }, 2000);
}
/**
 * Lida com a resposta CORRETA (Modo Tempo)
 */
function handleTimeAttackCorrect() {
    playAudio(audioCorrect);
    console.log("Correto! +10 pontos");
    timeAttackScore += 10; // Adiciona pontos
    // Volta para a Roleta (mais rápido)
    setTimeout(() => {
        pauseTimer(); // <-- ADICIONE ISSO
        showScreen('roulette-screen');
    }, 500);
}

/**
 * Lida com a resposta ERRADA (Modo Tempo)
 */
function handleTimeAttackWrong() {
    playAudio(audioWrong);
    console.log("Errado! -5 segundos");
    timeLeft -= 5; // Penalidade de tempo

    // Atualiza o relógio imediatamente
    if (timeLeft < 0) timeLeft = 0;
    const minutes = Math.floor(timeLeft / 60);
    const seconds = timeLeft % 60;
    gameTimerOrLevel.textContent = 
        `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
    
    // Volta para a Roleta
    setTimeout(() => {
        pauseTimer(); // <-- ADICIONE ISSO
        showScreen('roulette-screen');
    }, 1000);
    
 
}

/**
 * Helper: Reseta a aparência dos botões de resposta
 */
function resetAnswerOptions() {
    answerOptions.forEach(button => {
        button.disabled = false;
        button.classList.remove('correct', 'wrong');
    });
}
// --- 4. LÓGICA DA FÁBRICA (CONECTADO) ---

// Navegação por Abas na Fábrica (com lógica de carregar)
const tabButtons = document.querySelectorAll('.tab-button');
const tabContents = document.querySelectorAll('.tab-content');

tabButtons.forEach(button => {
    button.addEventListener('click', () => {
        playAudio(audioClick);
        // Remove 'active' de todos
        tabButtons.forEach(btn => btn.classList.remove('active'));
        tabContents.forEach(content => content.classList.remove('active'));
        
        // Adiciona 'active' ao clicado
        button.classList.add('active');
        document.getElementById(`${button.dataset.tab}-tab`).classList.add('active');
        
        // Se a aba for "avaliar", busca uma pergunta
        if (button.dataset.tab === 'avaliar') {
            carregarPerguntaParaAvaliar();
        }
    });
});

// Envio de formulário
const submitForm = document.getElementById('submit-question-form');
const submitButton = submitForm.querySelector('.submit-button');

submitForm.addEventListener('submit', async (e) => {
    e.preventDefault(); // Impede o recarregamento da página

    // Pega o usuário logado atualmente
    const user = auth.currentUser;
    if (!user) {
        alert("Você precisa estar logado para enviar uma pergunta.");
        return;
    }

    // Desativa o botão para evitar cliques duplos
    submitButton.disabled = true;
    submitButton.textContent = "Enviando...";

    try {
        // 1. Pega os valores do formulário
        const categoria = document.getElementById('categoria').value;
        const texto = document.getElementById('pergunta-texto').value;
        
        // 2. Cria o array de opções
        const opcoes = [
            document.getElementById('op0').value,
            document.getElementById('op1').value,
            document.getElementById('op2').value,
            document.getElementById('op3').value
        ];

        // 3. Pega a resposta correta (convertida para número)
        const respostaCorreta = parseInt(document.querySelector('input[name="correct-answer"]:checked').value);

        // 4. Monta o objeto da nova pergunta
        const novaPergunta = {
            categoria: categoria,
            texto: texto,
            opcoes: opcoes,
            respostaCorreta: respostaCorreta,
            autor: user.uid, // Salva o ID do usuário que enviou
            votosAprovacao: 0,
            votosReprovacao: 0,
            avaliadoPor: []
        };
        
        // 5. Salva na coleção 'perguntas_pendentes'
        const docRef = await db.collection('perguntas_pendentes').add(novaPergunta);
        
        console.log("Pergunta salva com ID: ", docRef.id);
        alert("Obrigado! Sua pergunta foi enviada para avaliação.");
        
        submitForm.reset(); // Limpa o formulário

    } catch (error) {
        // Trata qualquer erro que ocorra
        console.error("Erro ao salvar pergunta: ", error);
        alert("Erro ao salvar sua pergunta. Tente novamente.");
    } finally {
        // Reativa o botão
        submitButton.disabled = false;
        submitButton.textContent = "Enviar para Avaliação";
    }
});

// --- Funções de Avaliação da Fábrica ---

const reviewCard = document.querySelector('.review-card');
const reviewActions = document.querySelector('.review-actions');
const reviewCategory = document.querySelector('.review-category');
const reviewText = document.querySelector('.review-text');
const reviewOptionsContainer = document.getElementById('avaliar-tab'); // Pegamos o container

/**
 * Busca a próxima pergunta pendente no Firestore
 */
async function carregarPerguntaParaAvaliar() {
    const user = auth.currentUser;
    if (!user) return; // Segurança

    // Busca uma pergunta que NÃO foi enviada pelo usuário atual
    // e que ele ainda NÃO avaliou (caso implemente 'avaliadoPor' no futuro)
    const query = db.collection('perguntas_pendentes')
                    .where('autor', '!=', user.uid) // Não pode avaliar a própria pergunta
                    .limit(1);
    
    const snapshot = await query.get();

    if (snapshot.empty) {
        // Nenhuma pergunta encontrada
        console.log("Nenhuma pergunta para avaliar.");
        reviewCard.innerHTML = "<p>Ótimo trabalho! Nenhuma pergunta nova para avaliar.</p>";
        reviewActions.style.display = 'none'; // Esconde botões
        perguntaEmAvaliacao = null;
        return;
    }

    // Pergunta encontrada!
    const doc = snapshot.docs[0];
    perguntaEmAvaliacao = doc; // Salva o documento inteiro
    
    const data = doc.data();

    // Mostra os botões e o card
    reviewCard.style.display = 'block';
    reviewActions.style.display = 'flex';

    // Limpa opções antigas (importante)
    // Remove todos os '.review-option' antigos
    reviewCard.querySelectorAll('.review-option').forEach(el => el.remove());

    // (Bloco novo - com verificação de segurança)

// Limpa opções antigas (importante)
reviewCard.querySelectorAll('.review-option').forEach(el => el.remove());

// --- VERIFICAÇÃO DE SEGURANÇA ---
// Verifica se 'data.opcoes' existe e se é um Array
if (Array.isArray(data.opcoes) && data.opcoes.length > 0) {
    
    // O documento é VÁLIDO. Preenche o card.
    reviewCategory.textContent = data.categoria.toUpperCase();
    reviewText.textContent = data.texto;

    // Cria e adiciona as opções de resposta no card
    data.opcoes.forEach((opcao, index) => {
        const span = document.createElement('span');
        span.classList.add('review-option');
        span.textContent = opcao;
        if (index === data.respostaCorreta) {
            span.classList.add('correct'); // Marca a correta em verde
        }
        reviewCard.appendChild(span);
    });

} else {
    // O documento é INVÁLIDO (corrompido)
    console.error("Documento corrompido encontrado (ID: " + doc.id + "). 'opcoes' não é um array.");
    
    // Rejeita automaticamente o documento ruim
    alert("Uma pergunta mal formatada foi encontrada e será removida.");
    perguntaEmAvaliacao.ref.delete()
        .then(() => carregarPerguntaParaAvaliar()); // Busca a próxima
    return;
}
}

/**
 * Botões de Aprovar e Rejeitar
 */
document.getElementById('review-approve').addEventListener('click', async () => {
    if (!perguntaEmAvaliacao) return;

    try {
        // 1. Pega os dados da pergunta
        const data = perguntaEmAvaliacao.data();
        
        // 2. Cria o objeto limpo para 'perguntas_publicadas'
        const perguntaPublicada = {
            categoria: data.categoria,
            texto: data.texto,
            opcoes: data.opcoes,
            respostaCorreta: data.respostaCorreta,
            autor: data.autor
            // Não copiamos os campos de votação
        };

        // 3. Adiciona na coleção 'perguntas_publicadas'
        await db.collection('perguntas_publicadas').add(perguntaPublicada);

        // 4. Exclui da coleção 'perguntas_pendentes'
        await perguntaEmAvaliacao.ref.delete();

        console.log("Pergunta APROVADA e movida.");
        alert("Pergunta aprovada!");
        
        // 5. Carrega a próxima pergunta
        carregarPerguntaParaAvaliar();

    } catch (error) {
        console.error("Erro ao aprovar pergunta: ", error);
        alert("Erro ao aprovar. Tente novamente.");
    }
});

document.getElementById('review-reject').addEventListener('click', async () => {
    if (!perguntaEmAvaliacao) return;

    if (!confirm("Tem certeza que deseja REJEITAR esta pergunta? Ela será excluída.")) {
        return; // Cancela se o usuário clicar em "Cancelar"
    }
    
    try {
        // 1. Exclui da coleção 'perguntas_pendentes'
        await perguntaEmAvaliacao.ref.delete();

        console.log("Pergunta REJEITADA e excluída.");
        alert("Pergunta rejeitada.");
        
        // 2. Carrega a próxima pergunta
        carregarPerguntaParaAvaliar();

    } catch (error) {
        console.error("Erro ao rejeitar pergunta: ", error);
        alert("Erro ao rejeitar. Tente novamente.");
    }
});

/**
 * Carrega e exibe a coleção de personagens do usuário
 */
async function loadCollection() {
    console.log("Carregando coleção...");
    // Limpa a grade antiga
    collectionGrid.innerHTML = 'Carregando...';
    
    // 1. Pega os dados do usuário
    const user = auth.currentUser;
    if (!user) return;
    
    const userRef = db.collection('usuarios').doc(user.uid);
    const doc = await userRef.get();
    
    if (!doc.exists) return;
    
    // 2. Pega a lista de IDs que o usuário desbloqueou
    const desbloqueados = doc.data().personagensConquistados || [];
    
    // Limpa a grade para valer
    collectionGrid.innerHTML = '';
    
    // 3. Itera sobre a lista MESTRE de personagens
    PERSONAGENS.forEach(personagem => {
        
        // 4. Verifica se este personagem está na lista do usuário
        const estaDesbloqueado = desbloqueados.includes(personagem.id);
        
        // 5. Cria o card
        const card = document.createElement('div');
        card.classList.add('character-card');
        
        if (estaDesbloqueado) {
            // Mostra o personagem
            card.innerHTML = `
                <img src="images/personagens/${personagem.id}.png" alt="${personagem.nome}">
                <p>${personagem.nome}</p>
            `;
        } else {
            // Mostra a silhueta/bloqueado
            card.classList.add('locked');
            card.innerHTML = `
                <img src="images/personagens/${personagem.id}.png" alt="Bloqueado">
                <p>???</p>
            `;
        }
        
        collectionGrid.appendChild(card);
    });
}

// Listener para fechar o popup de personagem
popupCloseBtn.addEventListener('click', () => {
    playAudio(audioClick); // Som de clique ao fechar
    characterUnlockedPopup.classList.remove('active'); // Esconde o popup
    
    // Agora que o popup foi fechado, volte para a roleta
    showScreen('roulette-screen'); 
});

/**
 * Carrega e exibe o ranking (Top 10 + Posição do Usuário)
 */
async function loadRanking() {
    console.log("Carregando ranking...");
    rankingList.innerHTML = '<li>Carregando...</li>';
    userRankingDisplay.innerHTML = 'Carregando sua posição...';

    // 1. Pega os dados do usuário atual
    const user = auth.currentUser;
    if (!user) return;
    
    // Pega os dados mais recentes do usuário (score e nome)
    const userDoc = await db.collection('usuarios').doc(user.uid).get();
    if (!userDoc.exists) return;
    
    const userData = userDoc.data();
    const userScore = userData.pontosTotais || 0;
    const userName = userData.nome || "Você";
    const userPhotoURL = userData.fotoURL || 'images/avatar-default.png'; // URL da foto do usuário

    // 2. BUSCA O TOP 10
    const top10Query = db.collection('usuarios')
                         .orderBy("pontosTotais", "desc") 
                         .limit(10); 
    
    const top10Snapshot = await top10Query.get();
    
    rankingList.innerHTML = ''; 
    let rank = 1;
    let userIsInTop10 = false;

    top10Snapshot.forEach(doc => {
        const data = doc.data();
        
        const li = document.createElement('li');
        
        // Verifica se o usuário atual está no Top 10
        if (doc.id === user.uid) {
            li.classList.add('user-highlight');
            userIsInTop10 = true;
        }
        
        // NOVO: Adiciona a foto do usuário no Top 10
        const photoUrl = data.fotoURL || 'images/avatar-default.png';

        li.innerHTML = `
            <div class="rank-info">
                <span class="rank-number">${rank}.</span>
                <img src="${photoUrl}" alt="${data.nome}" class="rank-avatar">
                <span class="rank-name">${data.nome}</span>
            </div>
            <span class="rank-score">${data.pontosTotais} pts</span>
        `;
        rankingList.appendChild(li);
        rank++;
    });

    // 3. BUSCA A POSIÇÃO DO USUÁRIO (se ele não estiver no Top 10)
    if (userIsInTop10) {
        userRankingDisplay.innerHTML = `Parabéns! Você está no Top 10!`;
    } else {
        // Conta quantos jogadores têm MAIS pontos que o usuário atual
        const userRankQuery = db.collection('usuarios')
                                .where('pontosTotais', '>', userScore);
        
        const userRankSnapshot = await userRankQuery.get();
        
        const userRank = userRankSnapshot.size + 1; // Sua posição é (Nº de pessoas na frente) + 1
        
        // NOVO: Exibe a foto do usuário no card de posição
        userRankingDisplay.innerHTML = `
            <div class="rank-info" style="justify-content: center;">
                <img src="${userPhotoURL}" alt="${userName}" class="rank-avatar" style="width: 40px; height: 40px;">
                Sua Posição: <strong>#${userRank}</strong> 
                (${userName} - ${userScore} pts)
            </div>
        `;
    }
}