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
let nextQuestionTimer = null; // Guarda o ID do timer de próxima pergunta
let navigationTimeout = null; // Guarda o ID do timeout de transição de tela (NOVO)
let timeLeft = 60; // Segundos para o modo tempo
let currentMode = 'torre'; // Controla qual modo está ativo
let questionTimeLeft = 30; // Tempo para responder no modo clássico
let timeAttackScore = 0; // Pontuação do modo tempo
let comboCount = 0; // Contador de acertos consecutivos (Modo Tempo)

// Variáveis para o Modo Desafio
let challengeData = null; // Dados do desafio atual
let challengeQuestions = []; // Array com as 10 perguntas do desafio
let challengeIndex = 0; // Qual pergunta (0-9) estamos respondendo
let isProcessingChallenge = false; // Flag para evitar duplo processamento

// Botões de Navegação
const modeButtons = document.querySelectorAll('.mode-button');
const mainPlayBtn = document.getElementById('main-play-btn'); // NOVO
const playModesBackButton = document.getElementById('play-modes-back-btn'); // NOVO
const factoryBackButton = document.getElementById('factory-back-btn');
const shopBackButton = document.getElementById('shop-back-btn'); // NOVO
const gameBackButton = document.getElementById('game-back-btn');
const nextQuestionBtn = document.getElementById('next-question-btn');
const reportQuestionBtn = document.getElementById('report-question-btn'); // NOVO
const rouletteBackButton = document.getElementById('roulette-back-btn'); // <-- ADICIONE ESTA LINHA
const friendsBackButton = document.getElementById('friends-back-btn'); // NOVO
const collectionGrid = document.getElementById('collection-grid');
const challengeBackButton = document.getElementById('challenge-back-btn'); // NOVO
const collectionBackButton = document.querySelectorAll('#collection-back-btn');
const characterUnlockedPopup = document.getElementById('character-unlocked-popup');
const categoryChoicePopup = document.getElementById('category-choice-popup');
const choiceButtonsGrid = document.getElementById('category-choice-buttons');
const characterDetailPopup = document.getElementById('character-detail-popup');
const detailCloseBtn = document.getElementById('detail-close-btn');
const tradeCharBtn = document.getElementById('trade-char-btn'); // NOVO
let isRewardChoicePending = false;

const unlockedCharacterImg = document.getElementById('unlocked-character-img');
const unlockedCharacterName = document.getElementById('unlocked-character-name');
const popupCloseBtn = document.getElementById('popup-close-btn');
const rankingList = document.getElementById('ranking-list');
const userRankingDisplay = document.getElementById('user-ranking-display');
const rankingBackButton = document.getElementById('ranking-back-btn');
const rankTabGlobal = document.getElementById('rank-tab-global'); // NOVO
const rankTabWeekly = document.getElementById('rank-tab-weekly'); // NOVO

// Referências da Tela de Amigos (NOVO)
const friendSearchInput = document.getElementById('friend-search-input');
const searchFriendBtn = document.getElementById('search-friend-btn');
const friendSearchResults = document.getElementById('friend-search-results');
const friendRequestMsg = document.getElementById('friend-request-msg');
const friendRequestsContainer = document.getElementById('friend-requests-container');
const friendRequestsList = document.getElementById('friend-requests-list');
const friendsList = document.getElementById('friends-list');
const friendsBadge = document.getElementById('friends-badge'); // NOVO
const inviteLinkInput = document.getElementById('invite-link-input'); // NOVO
const copyInviteBtn = document.getElementById('copy-invite-btn'); // NOVO

// Referências da Tela de Desafios (NOVO)
const challengeFriendsList = document.getElementById('challenge-friends-list');
const pendingChallengesList = document.getElementById('pending-challenges-list');
const resultsChallengesList = document.getElementById('results-challenges-list');
// Badges de Desafio
const challengeBadge = document.getElementById('challenge-badge');
const pendingBadge = document.getElementById('pending-badge');
const resultsBadge = document.getElementById('results-badge');

// Variáveis de Paginação dos Resultados
let allChallengeResults = [];
let currentResultsPage = 1;
const RESULTS_PER_PAGE = 5;

// Variáveis dos Power-ups (Ajudas)
let powerups = { correct: 2, fifty: 2, secondChance: 2, skip: 2 };
let secondChanceActive = false;

// Variáveis do Sistema de Vidas
const MAX_LIVES = 5;
const ABSOLUTE_MAX_LIVES = 30;
const REGEN_TIME_MS = 30 * 60 * 1000; // 30 minutos em milissegundos
let userLives = 5;
let userCoins = 0; // Variável global de moedas
let userRegenTimers = []; // Array de timestamps para cada vida gasta
let userInfiniteLivesUntil = null; // Timestamp para fim da energia infinita

// Configuração de Som
let isSoundEnabled = localStorage.getItem('soundEnabled') !== 'false'; // Padrão true
let isMusicEnabled = localStorage.getItem('musicEnabled') !== 'false'; // Padrão true (NOVO)
const FIXED_MUSIC_VOLUME = 0.4; // Volume fixo quando ligado

// Referências do Popup de Detalhes do Amigo (NOVO)
const friendDetailPopup = document.getElementById('friend-detail-popup');
const friendDetailImg = document.getElementById('friend-detail-img');
const friendDetailName = document.getElementById('friend-detail-name');
const friendDetailUsername = document.getElementById('friend-detail-username');
const friendDetailLevel = document.getElementById('friend-detail-level');
const friendDetailScore = document.getElementById('friend-detail-score');
const friendDetailRank = document.getElementById('friend-detail-rank'); // NOVO
const removeFriendBtn = document.getElementById('remove-friend-btn');
const closeFriendDetailBtn = document.getElementById('close-friend-detail-btn');
const viewFriendCollectionBtn = document.getElementById('view-friend-collection-btn'); // NOVO
const challengeFriendBtn = document.getElementById('challenge-friend-btn'); // NOVO
const addFriendPopupBtn = document.getElementById('add-friend-popup-btn'); // NOVO

// Referências do Popup de Seleção de Amigo para Troca (NOVO)
const tradeFriendSelectionPopup = document.getElementById('trade-friend-selection-popup');
const tradeFriendList = document.getElementById('trade-friend-list');
const closeTradeFriendBtn = document.getElementById('close-trade-friend-btn');

// NOVO: Popup de seleção de personagem para troca
const tradeCharacterSelectionPopup = document.getElementById('trade-character-selection-popup');
const tradeCharacterGrid = document.getElementById('trade-character-grid');
const closeTradeCharacterBtn = document.getElementById('close-trade-character-btn');
const tradeRequestsList = document.getElementById('trade-requests-list');

// Referências da Loja (NOVO)
const shopItemsGrid = document.getElementById('shop-items-grid');
const shopUserCoins = document.getElementById('shop-user-coins');

// Referências do Sistema de Anúncios (NOVO)
const adOverlay = document.getElementById('ad-overlay');
const adTimerDisplay = document.getElementById('ad-timer');
const closeAdBtn = document.getElementById('close-ad-btn');
const adStatusText = document.getElementById('ad-status-text');

// Referências do Popup Genérico (NOVO)
const genericMessagePopup = document.getElementById('generic-message-popup');
const genericPopupTitle = document.getElementById('generic-popup-title');
const genericPopupMessage = document.getElementById('generic-popup-message');
const genericPopupCloseBtn = document.getElementById('generic-popup-close-btn');

// Referências do Popup de Confirmação (NOVO)
const genericConfirmPopup = document.getElementById('generic-confirm-popup');
const confirmPopupTitle = document.getElementById('confirm-popup-title');
const confirmPopupMessage = document.getElementById('confirm-popup-message');
const confirmPopupYesBtn = document.getElementById('confirm-popup-yes-btn');
const confirmPopupNoBtn = document.getElementById('confirm-popup-no-btn');

// Referências do Popup de Coleção do Amigo (NOVO)
const friendCollectionPopup = document.getElementById('friend-collection-popup');
const friendCollectionGrid = document.getElementById('friend-collection-grid');
const closeFriendCollectionBtn = document.getElementById('close-friend-collection-btn');
const friendCollectionTitle = document.getElementById('friend-collection-title');

const audioCorrect = document.getElementById('audio-correct');
const audioWrong = document.getElementById('audio-wrong');
const audioClick = document.getElementById('audio-click');
const audioSpin = document.getElementById('audio-spin');
const audioQuestion = document.getElementById('audio-question');
const audioBackground = document.getElementById('audio-background');

// --- NOVAS REFERÊNCIAS PARA EDIÇÃO DE PERFIL ---
const userUsernameDisplay = document.getElementById('user-username');
const editProfileBtn = document.getElementById('edit-profile-btn');
const profileEditPopup = document.getElementById('profile-edit-popup');
const editPopupTitle = document.getElementById('edit-popup-title');
const inputDisplayName = document.getElementById('input-display-name');
const inputUsername = document.getElementById('input-username');
const usernameErrorMsg = document.getElementById('username-error-msg');
const saveProfileBtn = document.getElementById('save-profile-btn');
const cancelEditBtn = document.getElementById('cancel-edit-btn');
const soundToggle = document.getElementById('sound-toggle'); // NOVO
const musicToggle = document.getElementById('music-toggle'); // NOVO

// Referências do Popup de Report (NOVO)
const reportPopup = document.getElementById('report-popup');
const confirmReportBtn = document.getElementById('confirm-report-btn');
const cancelReportBtn = document.getElementById('cancel-report-btn');
const reportReasonSelect = document.getElementById('report-reason');

// SUBSTITUA O SEU ARRAY DE CATEGORIAS POR ESTE
const CATEGORIES = [
    { name: "Sagradas Escrituras", icon: "📖", color: "#ffc300", dbValue: "escrituras" }, // 1. Amarelo
    { name: "Santos e Mártires", icon: "😇", color: "#ff5a5a", dbValue: "santos" },     // 2. Vermelho
    { name: "Doutrina e Dogmas", icon: "📚", color: "#00aaff", dbValue: "doutrina" },   // 3. Azul
    { name: "História da Igreja", icon: "📜", color: "#90d636", dbValue: "historia" },   // 4. Verde
    { name: "Liturgia e Sacramentos", icon: "🕯️", color: "#9966cc", dbValue: "liturgia" },   // 5. Roxo
    { name: "Arte e Cultura Sacra", icon: "🖼️", color: "#ff9900", dbValue: "arte" }      // 6. Laranja
];

// LISTA DE ITENS DA LOJA (Configuração de Preços)
const SHOP_ITEMS = [
    { id: 'life_1', type: 'life', amount: 1, name: '1 Vida', icon: '❤️', price: 50, desc: 'Recupere uma vida instantaneamente.' },
    { id: 'life_full', type: 'life_full', amount: 5, name: 'Vidas Cheias', icon: '💖', price: 200, desc: 'Enche todas as suas vidas de uma vez!' },
    { id: 'infinite_30', type: 'infinite_lives', amount: 30, name: 'Vidas Infinitas (30m)', icon: '♾️', price: 300, desc: 'Jogue sem gastar vidas por 30 minutos!' },
    { id: 'char_random', type: 'random_character', amount: 1, name: 'Personagem Surpresa', icon: '🎁', price: 500, desc: 'Desbloqueia um personagem aleatório que você ainda não tem!' },
    
    { id: 'power_skip', type: 'powerup', key: 'skip', amount: 1, name: 'Pular', icon: '⏭️', price: 15, desc: 'Pule uma pergunta difícil.' },
    { id: 'power_fifty', type: 'powerup', key: 'fifty', amount: 1, name: '50/50', icon: '✂️', price: 25, desc: 'Elimina duas alternativas erradas.' },
    { id: 'power_second', type: 'powerup', key: 'secondChance', amount: 1, name: '2ª Chance', icon: '🔄', price: 30, desc: 'Tente novamente se errar.' },
    { id: 'power_correct', type: 'powerup', key: 'correct', amount: 1, name: 'Acerto', icon: '✅', price: 50, desc: 'Seleciona a resposta correta.' }
];

// LISTA DE RECOMPENSAS (Agora carregada do Firebase)
let PERSONAGENS = [];

// Função para carregar personagens do Firestore
async function carregarPersonagens() {
    try {
        const snapshot = await db.collection('personagens').get();
        if (!snapshot.empty) {
            PERSONAGENS = snapshot.docs.map(doc => doc.data());
            console.log(`Personagens carregados do Firestore: ${PERSONAGENS.length}`);
        } else {
            console.warn("Nenhum personagem encontrado no Firestore.");
        }
    } catch (error) {
        console.error("Erro ao carregar personagens:", error);
    }
}

// --- FUNÇÃO DE POPUP GENÉRICO (Substitui alert) ---
let genericPopupOnClose = null; // Callback para quando fechar o popup

function showPopupMessage(message, title = "Aviso", onClose = null) {
    if (genericPopupTitle) genericPopupTitle.textContent = title;
    if (genericPopupMessage) genericPopupMessage.innerText = message; // innerText respeita quebras de linha
    if (genericMessagePopup) genericMessagePopup.classList.add('active');
    playAudio(audioClick);
    genericPopupOnClose = onClose;
}

if (genericPopupCloseBtn) {
    genericPopupCloseBtn.addEventListener('click', () => {
        playAudio(audioClick);
        genericMessagePopup.classList.remove('active');
        if (genericPopupOnClose) {
            genericPopupOnClose();
            genericPopupOnClose = null;
        }
    });
}

// --- FUNÇÃO DE POPUP DE CONFIRMAÇÃO (Substitui confirm) ---
let onConfirmAction = null;

function showConfirmPopup(message, onConfirm, title = "Confirmação") {
    if (confirmPopupTitle) confirmPopupTitle.textContent = title;
    if (confirmPopupMessage) confirmPopupMessage.innerText = message;
    if (genericConfirmPopup) genericConfirmPopup.classList.add('active');
    playAudio(audioClick);
    onConfirmAction = onConfirm;
}

if (confirmPopupYesBtn) {
    confirmPopupYesBtn.addEventListener('click', () => {
        playAudio(audioClick);
        genericConfirmPopup.classList.remove('active');
        if (onConfirmAction) {
            onConfirmAction();
            onConfirmAction = null;
        }
    });
}

if (confirmPopupNoBtn) {
    confirmPopupNoBtn.addEventListener('click', () => {
        playAudio(audioClick);
        genericConfirmPopup.classList.remove('active');
        onConfirmAction = null;
    });
}

// --- 1. MÓDULO DE AUTENTICAÇÃO (O "PORTEIRO") ---

// CORREÇÃO PARA SAFARI/IPHONE: Verifica resultado de redirecionamento
auth.getRedirectResult()
    .then((result) => {
        if (result.user) {
            console.log("Login via redirecionamento realizado com sucesso.");
        }
    })
    .catch((error) => {
        // Ignora erro de estado inicial ausente (comum no Safari e inofensivo neste contexto)
        if (error.code !== 'auth/missing-initial-state') {
            console.error("Erro no redirecionamento:", error);
        }
    });

// Esta função fica "ouvindo" o estado do login
auth.onAuthStateChanged(user => {
    if (user) {
        // Usuário está logado!
        console.log("Usuário logado:", user.uid);

        // 1. Busca os dados do usuário no Firestore ou cria um novo perfil
        setupUser(user);

        // 2. Carrega a lista de personagens do jogo
        carregarPersonagens();

        // 3. Mostra a tela principal do jogo (home)
        showScreen('home-screen');

        // 4. Verifica se entrou por um link de convite
        checkInviteUrl(user);
    } else {
        // Usuário está deslogado
        console.log("Nenhum usuário logado.");

        // 1. Mostra a tela de login
        showScreen('login-screen');
    }
});

collectionBackButton.forEach (button => {
    button.addEventListener('click', () => {
    playAudio(audioClick);
    showScreen('home-screen');
});
})

// Evento de clique no botão de Login
loginButton.addEventListener('click', () => {
    playAudio(audioClick);
    console.log("Tentando login com Google...");
    
    // ALTERAÇÃO: Voltando para signInWithPopup para TODOS os dispositivos.
    // O signInWithRedirect falha no iOS quando o site está hospedado em domínio diferente do Firebase (Vercel),
    // pois o Safari bloqueia os cookies de sessão necessários para validar o retorno do redirecionamento.
    
    auth.setPersistence(firebase.auth.Auth.Persistence.LOCAL)
        .then(() => {
            return auth.signInWithPopup(provider);
        })
        .then(result => {
            console.log("Login com sucesso!", result.user);
        })
        .catch(error => {
            console.error("Erro no login: ", error);
            showPopupMessage("Erro ao fazer login: " + error.message, "Erro de Login");
        });
});

// Evento de clique no botão de Logout (com confirmação)
logoutButton.addEventListener('click', () => {
    playAudio(audioClick);

    showConfirmPopup("Você realmente deseja sair?", () => {
        console.log("Saindo...");
        closeProfileEditPopup();

        auth.signOut()
            .then(() => {
                console.log("Usuário deslogado com sucesso.");
                // O onAuthStateChanged vai detectar a saída e trocar a tela
            })
            .catch(error => {
                console.error("Erro ao fazer logout:", error);
            });
    }, "Sair");
});
// --- 5. LÓGICA DE EDIÇÃO DE PERFIL E USERNAME ---

/**
 * Helper para fechar o popup de edição de perfil e limpar o estado.
 */
function closeProfileEditPopup() {
    profileEditPopup.classList.remove('active');
    usernameErrorMsg.textContent = ''; // Limpa a mensagem de erro
    // Reabilita o botão, caso tenha sido desativado por um erro
    saveProfileBtn.disabled = false;
    saveProfileBtn.textContent = 'Salvar Alterações';
}

/**
 * Verifica se um username está disponível (não usado por outro usuário).
 * Retorna true se estiver disponível ou se for o username atual do usuário.
 */
async function checkUsernameUniqueness(username, currentUserId) {
    if (!username || username.trim() === '') return true; // Username vazio é considerado único/opcional

    // 1. Converte para minúsculas para pesquisa (case-insensitivity)
    const lowerUsername = username.toLowerCase();

    // 2. Busca no Firestore por um usuário com este username
    const snapshot = await db.collection('usuarios')
        .where('username', '==', lowerUsername)
        .limit(1)
        .get();

    if (snapshot.empty) {
        return true; // Ninguém está usando
    }

    // 3. Se encontrou, verifica se o documento pertence ao PRÓPRIO usuário atual
    const doc = snapshot.docs[0];
    return doc.id === currentUserId;
}

// Evento de clique no botão Cancelar (Fecha o popup)
cancelEditBtn.addEventListener('click', () => {
    playAudio(audioClick);
    closeProfileEditPopup();
});

// Evento de clique no botão de Editar Perfil (Abre o popup e preenche)
editProfileBtn.addEventListener('click', () => {
    playAudio(audioClick);
    const user = auth.currentUser;
    if (!user) return; // Não deveria acontecer se o botão está visível

    // 1. Preenche o campo de Display Name (Nome de Exibição)
    inputDisplayName.value = user.displayName || '';

    // 2. Busca o Username atual do Firestore
    db.collection('usuarios').doc(user.uid).get().then(doc => {
        if (doc.exists) {
            const userData = doc.data();
            // Preenche o campo de Username
            inputUsername.value = userData.username || '';
        }
    });

    // 3. Configura o estado do som
    if (soundToggle) soundToggle.checked = isSoundEnabled;
    
    // 4. Configura o toggle de música
    if (musicToggle) {
        musicToggle.checked = isMusicEnabled;
    }

    // 5. Exibe o popup
    profileEditPopup.classList.add('active');
    usernameErrorMsg.textContent = '';
});

// Evento de clique no botão Salvar Alterações (Lógica Principal)
saveProfileBtn.addEventListener('click', async () => {
    playAudio(audioClick);
    const user = auth.currentUser;
    if (!user) return;

    // 1. Prepara para salvar
    saveProfileBtn.disabled = true;
    saveProfileBtn.textContent = 'Salvando...';
    usernameErrorMsg.textContent = '';

    const newDisplayName = inputDisplayName.value.trim();
    // O username é salvo e checado em minúsculas
    const newUsername = inputUsername.value.trim().toLowerCase(); 

    // 2. Validação Básica
    if (newDisplayName.length < 3) {
        usernameErrorMsg.textContent = 'O Nome de Exibição deve ter pelo menos 3 caracteres.';
        saveProfileBtn.disabled = false;
        saveProfileBtn.textContent = 'Salvar Alterações';
        return;
    }
    // Permite que o username seja vazio (opcional)
    if (newUsername.length > 0 && (newUsername.length < 3 || !/^[a-z0-9_.]+$/.test(newUsername))) {
        usernameErrorMsg.textContent = 'O nome de usuário deve ter 3 a 15 caracteres e conter apenas letras minúsculas, números, . ou _.';
        saveProfileBtn.disabled = false;
        saveProfileBtn.textContent = 'Salvar Alterações';
        return;
    }

    try {
        // 3. Verifica a unicidade (somente se um username foi fornecido)
        if (newUsername.length > 0) {
            const isUsernameValid = await checkUsernameUniqueness(newUsername, user.uid);

            if (!isUsernameValid) {
                usernameErrorMsg.textContent = `O nome de usuário "${newUsername}" já está em uso.`;
                saveProfileBtn.disabled = false;
                saveProfileBtn.textContent = 'Salvar Alterações';
                return;
            }
        }
        
        // 4. Atualiza o Firebase Auth (Nome de Exibição)
        // Isso é necessário para que 'user.displayName' esteja sempre atualizado.
        if (newDisplayName !== user.displayName) {
             await user.updateProfile({ displayName: newDisplayName });
        }


        // 5. Atualiza o Firestore (Nome de Exibição e Username)
        const userRef = db.collection('usuarios').doc(user.uid);
        await userRef.update({
            // Note que o 'nome' no Firestore é igual ao 'displayName' do Auth
            nome: newDisplayName,
            nomeBusca: normalizeString(newDisplayName), // Adiciona campo normalizado
            username: newUsername 
        });

        // 6. Sucesso! Atualiza a UI da Home e fecha
        document.getElementById('user-name').textContent = newDisplayName;
        document.getElementById('user-username').textContent = newUsername; // Atualiza o display do username
        closeProfileEditPopup();
        showPopupMessage("Perfil atualizado com sucesso!", "Sucesso");

    } catch (error) {
        console.error("Erro ao salvar perfil: ", error);
        usernameErrorMsg.textContent = 'Erro ao salvar: ' + error.message;
    } finally {
        // Garante que o botão seja reativado após a operação
        saveProfileBtn.disabled = false;
        saveProfileBtn.textContent = 'Salvar Alterações';
    }
});

// Evento para alternar o som imediatamente
if (soundToggle) {
    soundToggle.addEventListener('change', () => {
        isSoundEnabled = soundToggle.checked;
        localStorage.setItem('soundEnabled', isSoundEnabled);
        // Feedback sonoro se ativou
        if (isSoundEnabled) playAudio(audioClick);
        
        // Atualiza a música de fundo imediatamente
        const activeScreen = document.querySelector('.screen.active');
        if (activeScreen) {
            manageBackgroundMusic(activeScreen.id);
        }
    });
}

// Evento para o toggle de música (NOVO)
if (musicToggle) {
    musicToggle.addEventListener('change', () => {
        isMusicEnabled = musicToggle.checked;
        localStorage.setItem('musicEnabled', isMusicEnabled);
        
        // Atualiza a música de fundo imediatamente
        const activeScreen = document.querySelector('.screen.active');
        if (activeScreen) {
            manageBackgroundMusic(activeScreen.id);
        }
    });
}

/**
 * Helper para tocar sons
 */
function playAudio(audioElement) {
    if (!isSoundEnabled) return; // Verifica configuração
    if (audioElement) {
        // Para o som de clique, clonamos o nó para permitir sobreposição e resposta imediata
        // Isso evita o atraso de resetar o currentTime e permite cliques rápidos
        if (audioElement.id === 'audio-click') {
            const soundClone = audioElement.cloneNode();
            soundClone.volume = audioElement.volume;
            soundClone.play().catch(() => {}); // Ignora erros de autoplay se houver
        } else {
            audioElement.currentTime = 0; // Reinicia o som
            audioElement.play().catch(() => {});
        }
    }
}

/**
 * Gerencia a música de fundo baseada na tela atual
 */
function manageBackgroundMusic(screenId) {
    if (!audioBackground) return;

    // Define volume mais baixo para o fundo
    audioBackground.volume = FIXED_MUSIC_VOLUME;

    // Telas onde a música NÃO deve tocar (Jogo, Roleta e Login)
    const silentScreens = ['game-screen', 'roulette-screen', 'login-screen'];
    
    // Deve tocar se a MÚSICA estiver ligada E não for uma tela silenciosa
    const shouldPlay = isMusicEnabled && !silentScreens.includes(screenId);

    if (shouldPlay) {
        if (audioBackground.paused) {
            // O catch evita erros se o navegador bloquear o autoplay antes da interação do usuário
            audioBackground.play().catch(e => console.log("Autoplay bloqueado (aguardando interação):", e));
        }
    } else {
        audioBackground.pause();
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
 * Helper: Normaliza string (remove acentos e converte para minúsculas)
 */
function normalizeString(str) {
    return str ? str.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase() : "";
}

/**
 * Calcula o Nível do Usuário baseado nos Pontos Totais.
 * Fórmula: Nível = 1 + RaizQuadrada(Pontos / 50)
 * Isso cria uma curva de dificuldade progressiva.
 * Ex: 0pts=Lvl1, 50pts=Lvl2, 200pts=Lvl3, 450pts=Lvl4...
 */
function calculateUserLevel(points) {
    if (!points || points < 0) return 1;
    return 1 + Math.floor(Math.sqrt(points / 50));
}

/**
 * Atualiza a barra de progresso de XP na UI
 */
function updateLevelProgressUI(points) {
    const currentLevel = calculateUserLevel(points);
    const nextLevel = currentLevel + 1;
    
    // Pontos necessários para o início do nível atual
    // Fórmula inversa: pontos = 50 * (Nivel-1)^2
    const pointsForCurrentLevel = 50 * Math.pow(currentLevel - 1, 2);
    
    // Pontos necessários para o início do próximo nível
    const pointsForNextLevel = 50 * Math.pow(nextLevel - 1, 2);
    
    const xpGainedInLevel = points - pointsForCurrentLevel;
    const xpNeededForNextLevel = pointsForNextLevel - pointsForCurrentLevel;
    
    let percentage = 0;
    if (xpNeededForNextLevel > 0) {
        percentage = (xpGainedInLevel / xpNeededForNextLevel) * 100;
    }
    
    // Garante limites entre 0 e 100
    percentage = Math.max(0, Math.min(100, percentage));
    
    const fillEl = document.getElementById('level-progress-fill');
    const textEl = document.getElementById('level-progress-text');
    
    if (fillEl) fillEl.style.width = `${percentage}%`;
    if (textEl) textEl.textContent = `${Math.floor(xpGainedInLevel)} / ${xpNeededForNextLevel} XP`;
}

/**
 * Verifica se duas datas são o mesmo dia
 */
function isSameDay(d1, d2) {
    return d1.getFullYear() === d2.getFullYear() &&
           d1.getMonth() === d2.getMonth() &&
           d1.getDate() === d2.getDate();
}

/**
 * Gera uma chave única para a semana atual (Reseta Domingo)
 * Ex: Retorna o timestamp do último domingo à meia-noite
 */
function getCurrentWeekKey() {
    const now = new Date();
    const date = new Date(now);
    date.setHours(0, 0, 0, 0);
    date.setDate(now.getDate() - now.getDay()); // Volta para o último domingo (0 = Domingo)
    return date.getTime().toString();
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

    const currentWeekKey = getCurrentWeekKey();

    if (!doc.exists) {
        // Se o documento NÃO existe, é o primeiro login do usuário!
        console.log("Criando novo perfil de usuário no Firestore...");

        // Cria um objeto com os dados padrão do novo usuário
        userData = {
            nome: user.displayName,
            nomeBusca: normalizeString(user.displayName), // Salva nome normalizado
            email: user.email,
            username: '',
            fotoURL: user.photoURL,
            pontosTotais: 0,
            pontosSemanais: 0, // NOVO
            lastWeekKey: currentWeekKey, // NOVO
            nivelTorre: 1,
            personagensConquistados: [],
            // Novos campos de Vidas
            lives: MAX_LIVES,
            moedas: 50, // Começa com 50 moedas
            regenTimers: [],
            infiniteLivesUntil: null, // Novo campo
            
            // Powerups iniciais (Starter Pack)
            powerups_correct: 2,
            powerups_fifty: 2,
            powerups_secondChance: 2,
            powerups_skip: 2,
            
            recordeTempo: 0,
            perguntasRespondidas: [],
            lastLogin: firebase.firestore.FieldValue.serverTimestamp()
        };

        // Salva esse objeto no Firestore
        await userRef.set(userData);

    } else {
        // Se o documento JÁ existe, apenas carrega os dados
        console.log("Carregando perfil existente...");
        userData = doc.data();

        // --- LÓGICA DE RECOMPENSA DIÁRIA ---
        const lastLoginDate = userData.lastLogin ? userData.lastLogin.toDate() : null;
        const today = new Date();

        if (!lastLoginDate || !isSameDay(lastLoginDate, today)) {
            const dailyBonus = 50;
            userData.moedas = (userData.moedas || 0) + dailyBonus;
            
            // Atualiza no banco (moedas + data)
            await userRef.update({
                moedas: userData.moedas,
                lastLogin: firebase.firestore.FieldValue.serverTimestamp()
            });

            // Notifica o usuário
            setTimeout(() => {
                playAudio(audioCorrect);
                showPopupMessage(`Que bom ver você de novo!\nReceba +${dailyBonus} moedas.`, "📅 Bônus Diário");
            }, 1500);
        } else {
            // Apenas atualiza o horário do login
            userRef.update({ lastLogin: firebase.firestore.FieldValue.serverTimestamp() }).catch(() => {});
        }

        // --- LÓGICA DE RESET SEMANAL ---
        // Se a chave da semana salva for diferente da atual, reseta os pontos semanais
        if (userData.lastWeekKey !== currentWeekKey) {
            console.log("Nova semana detectada! Resetando pontos semanais.");
            await userRef.update({
                pontosSemanais: 0,
                lastWeekKey: currentWeekKey
            });
        }

        // Migração: Adiciona nomeBusca se não existir
        if (!userData.nomeBusca && userData.nome) {
             await userRef.update({ nomeBusca: normalizeString(userData.nome) });
        }
        
        // Migração Powerups (Garante que campos existam para usuários antigos)
        const updates = {};
        if (userData.powerups_correct === undefined) updates.powerups_correct = 2;
        if (userData.powerups_fifty === undefined) updates.powerups_fifty = 2;
        if (userData.powerups_secondChance === undefined) updates.powerups_secondChance = 2;
        if (userData.powerups_skip === undefined) updates.powerups_skip = 2;
        
        if (Object.keys(updates).length > 0) {
            await userRef.update(updates);
            Object.assign(userData, updates);
        }
    }

    // (Código Melhorado)
    // Atualiza a UI da Tela Home com os dados (novos ou existentes)
    document.getElementById('user-name').textContent = userData.nome;
    document.getElementById('user-username').textContent = userData.username;
    document.getElementById('user-score').textContent = userData.pontosTotais;
    
    userCoins = userData.moedas !== undefined ? userData.moedas : 0;
    document.getElementById('user-coins').textContent = userCoins;
    if (shopUserCoins) shopUserCoins.textContent = userCoins;

    // Carrega Energia Infinita
    userInfiniteLivesUntil = userData.infiniteLivesUntil ? (userData.infiniteLivesUntil.toMillis ? userData.infiniteLivesUntil.toMillis() : userData.infiniteLivesUntil) : null;

    // Carrega Powerups do usuário para a variável global
    powerups = {
        correct: userData.powerups_correct || 0,
        fifty: userData.powerups_fifty || 0,
        secondChance: userData.powerups_secondChance || 0,
        skip: userData.powerups_skip || 0
    };

    // NOVO: Calcula o nível baseado nos pontos totais
    document.getElementById('user-level').textContent = calculateUserLevel(userData.pontosTotais);
    updateLevelProgressUI(userData.pontosTotais);

    // SÓ atualiza a foto SE ela existir (não for nula)
    if (userData.fotoURL) {
        document.getElementById('user-photo').src = userData.fotoURL;
    }

    // Verifica notificações de amizade
    checkFriendRequestsNotification(userData);
    
    // Verifica notificações de desafios
    checkChallengeNotifications();
    // Se não existir, o código vai simplesmente ignorar e manter
    // a imagem "avatar-default.png" que definimos no HTML.
    
    // Verifica regeneração e atualiza UI
    checkLivesRegeneration(userData);
}


// --- 2. NAVEGAÇÃO ENTRE TELAS ---

// Função helper para mostrar a tela correta
function showScreen(screenId) {
    screens.forEach(screen => {
        screen.classList.remove('active');
    });
    document.getElementById(screenId).classList.add('active');
    const activeScreen = document.getElementById(screenId);
    activeScreen.classList.add('active');
    activeScreen.scrollTop = 0; // Garante que a tela abra sempre no topo
    
    // Gerencia a música de fundo ao trocar de tela
    manageBackgroundMusic(screenId);
}

// Evento do botão principal JOGAR (NOVO)
if (mainPlayBtn) {
    mainPlayBtn.addEventListener('click', () => {
        playAudio(audioClick);
        showScreen('play-modes-screen');
    });
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
            showScreen('collection-screen');

            // Garante que a primeira aba (Meus Personagens) seja a padrão ao abrir
            const collectionScreen = document.getElementById('collection-screen');
            const charTab = collectionScreen.querySelector('.tab-button[data-tab="personagens"]');
            if (charTab) {
                charTab.click();
            } else {
                loadCollection();
            }
        } else if (mode === 'ranking') {
            // É AQUI!
            loadRanking('global'); // Padrão global
            showScreen('ranking-screen');
        } else if (mode === 'amigos') {
            // NOVO: Carrega a tela de amigos
            loadFriendsScreen();
            showScreen('friends-screen');
        } else if (mode === 'desafio') {
            // NOVO: Carrega o Hub de Desafios
            loadChallengeHub();
            showScreen('challenge-hub-screen');
        } else if (mode === 'loja') {
            // NOVO: Carrega a Loja
            loadShop();
            showScreen('shop-screen');
        }
    });
});

// Eventos das Abas de Ranking
if (rankTabGlobal && rankTabWeekly) {
    rankTabGlobal.addEventListener('click', () => {
        playAudio(audioClick);
        rankTabGlobal.classList.add('active');
        rankTabWeekly.classList.remove('active');
        loadRanking('global');
    });

    rankTabWeekly.addEventListener('click', () => {
        playAudio(audioClick);
        rankTabWeekly.classList.add('active');
        rankTabGlobal.classList.remove('active');
        loadRanking('weekly');
    });
}

// Botão de voltar da tela de modos de jogo
if (playModesBackButton) {
    playModesBackButton.addEventListener('click', () => { playAudio(audioClick); showScreen('home-screen'); });
}
// Listener para fechar o popup de personagem
if (popupCloseBtn) { // Verificação de segurança
    popupCloseBtn.addEventListener('click', () => {
        playAudio(audioClick);
        characterUnlockedPopup.classList.remove('active'); // Esconde o popup
        
        // Agora que o popup foi fechado, decide para onde ir
        if (currentMode === 'tempo') {
            showScreen('home-screen');
        } else {
            showScreen('roulette-screen'); 
        }
    });
}
// Botão de voltar do ranking
rankingBackButton.addEventListener('click', () => {
    playAudio(audioClick);
    showScreen('home-screen');
});
// Botão de voltar de Amigos
if (friendsBackButton) {
    friendsBackButton.addEventListener('click', () => { playAudio(audioClick); showScreen('home-screen'); });
}
// Botão de voltar de Desafios
if (challengeBackButton) {
    challengeBackButton.addEventListener('click', () => { playAudio(audioClick); showScreen('home-screen'); });
}
// Botão de voltar da fábrica
factoryBackButton.addEventListener('click', () => { playAudio(audioClick); showScreen('home-screen') });

// Botão de voltar da loja
if (shopBackButton) shopBackButton.addEventListener('click', () => { playAudio(audioClick); showScreen('home-screen') });


// Evento de clique no Botão Voltar (do Jogo)
gameBackButton.addEventListener('click', () => {
    playAudio(audioClick);
    // É ESSENCIAL parar o timer se ele estiver rodando
    pauseTimer();

    // Limpa o timer da próxima pergunta se estiver ativo
    if (nextQuestionTimer) {
        clearInterval(nextQuestionTimer);
        nextQuestionTimer = null;
    }
    // Limpa o timeout de navegação se estiver ativo
    if (navigationTimeout) {
        clearTimeout(navigationTimeout);
        navigationTimeout = null;
    }
    if (nextQuestionBtn) nextQuestionBtn.style.display = 'none';

    // Volta para a tela home
    showScreen('home-screen');
});

// Evento para o botão de Próxima Pergunta
if (nextQuestionBtn) {
    nextQuestionBtn.addEventListener('click', () => {
        playAudio(audioClick);
        goToNextQuestion();
    });
}

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
    // Ajuste no cálculo do índice (subtraindo o offset em vez de somar)
    const selectedIndex = Math.floor(((360 - normalizedAngle - (sliceAngle / 2)) + 360) % 360 / sliceAngle);
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
const gameCategoryIndicator = document.getElementById('game-category-indicator');
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
        //    (Ajustado: Sem subtrair 90, pois removemos o offset do CSS)
        const transformAngle = cssAngle;

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
 * Função auxiliar para o Modo Tempo: Carrega próxima pergunta aleatória sem roleta
 */
async function nextTimeAttackQuestion() {
    pauseTimer(); // Pausa o tempo enquanto carrega (justo com o jogador)
    const randomCategory = CATEGORIES[Math.floor(Math.random() * CATEGORIES.length)];
    await fetchAndDisplayQuestion(randomCategory.dbValue);
    
    // Retoma o timer se ainda estiver no modo tempo e na tela de jogo
    if (currentMode === 'tempo' && timeLeft > 0 && document.getElementById('game-screen').classList.contains('active')) {
        startTimer();
    }
}

/**
 * Inicia o Jogo (Modo Torre ou Tempo)
 */
async function startGame(mode) {
    console.log(`Iniciando jogo: ${mode}`);
    const user = auth.currentUser;
    if (!user) return; // Segurança

    // --- COBRANÇA DE VIDA ---
    // Tenta gastar uma vida. Se falhar (retornar false), cancela o início do jogo.
    if (!await spendLife()) return;

    currentMode = mode; // Define o modo atual
    resetAnswerOptions();

    // Reseta os Power-ups para a nova partida
    secondChanceActive = false;

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
        gameModeTitle.textContent = 'MODO CLÁSSICO';
        gameTimerOrLevel.textContent = `Nível ${placarAtual.nivel}`;
        gameTimerOrLevel.style.color = ''; // Reseta cor do timer
        // Fluxo padrão (Torre): Vai para a roleta
        renderHelpButtons(); // Renderiza botões de ajuda
        showScreen('roulette-screen');
    } else if (mode === 'tempo') {
        // Preparação do MODO TEMPO
        gameModeTitle.textContent = 'CONTRA O TEMPO';
        timeAttackScore = 0; // Reseta a pontuação da partida
        timeLeft = 60; // Reseta o tempo
        comboCount = 0; // Reseta o combo
        
        // NOVO FLUXO: Vai direto para o jogo
        renderHelpButtons(); // Renderiza botões de ajuda
        showScreen('game-screen');
        nextTimeAttackQuestion();
    } else if (mode === 'desafio') {
        // MODO DESAFIO
        gameModeTitle.textContent = 'DESAFIO 1x1';
        gameTimerOrLevel.textContent = `Pergunta ${challengeIndex + 1}/10`;
        showScreen('game-screen');
        renderHelpButtons(); // Renderiza botões de ajuda
        // A pergunta já foi carregada antes de chamar startGame no modo desafio
        displayChallengeQuestion();
    }
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
        showPopupMessage("Fim de jogo! Você errou.", "Game Over", () => showScreen('home-screen'));

    } else if (mode === 'desafio') {
        // Fim de jogo do Modo Desafio (completou as 10 perguntas)
        finishChallengeRound();

    } else if (mode === 'tempo') {
        // Fim de jogo do Modo Tempo (tempo esgotado)
        pauseTimer(); // Para o relógio
        
        // --- LÓGICA DE RECOMPENSA ---
        const bonusThreshold = 100; // Pontos necessários para ganhar um personagem
        let rewardMessage = `Tempo esgotado! Pontuação final: ${timeAttackScore}`;
        let earnedCharacter = false;

        // 1. Soma ao Placar Global (Pontos Totais do Usuário)
        placarAtual.pontos = Math.max(0, placarAtual.pontos + timeAttackScore);

        // --- MOEDAS (1 moeda a cada 10 pontos) ---
        const coinsEarned = Math.floor(Math.max(0, timeAttackScore) / 10);
        userCoins += coinsEarned;
        rewardMessage += `\n💰 Você ganhou ${coinsEarned} moedas!`;

        // --- VERIFICAÇÃO DE LEVEL UP ---
        const oldLevel = calculateUserLevel(placarAtual.pontos - timeAttackScore);
        const newLevel = calculateUserLevel(placarAtual.pontos);
        if (newLevel > oldLevel) {
            rewardMessage += `\n🆙 LEVEL UP! Você subiu para o Nível ${newLevel}!`;
        }

        // 2. Verifica se é um novo recorde
        if (timeAttackScore > placarAtual.recordeTempo) {
            placarAtual.recordeTempo = timeAttackScore;
            rewardMessage += `\n🎉 NOVO RECORDE! 🎉`;
        }

        // 3. Verifica Recompensa de Personagem
        if (timeAttackScore >= bonusThreshold) {
            earnedCharacter = true;
            rewardMessage += `\n\n🏆 Incrível! Você fez mais de ${bonusThreshold} pontos e ganhou um personagem!`;
        } else {
            rewardMessage += `\n(Faça ${bonusThreshold} pontos para ganhar um personagem)`;
        }

        // alert(rewardMessage); -> Substituído abaixo com callback

        // 4. Salva no Firestore (Pontos Totais + Recorde)
        const userRef = db.collection('usuarios').doc(auth.currentUser.uid);
        try {
            await userRef.update({ 
                pontosTotais: placarAtual.pontos,
                pontosSemanais: firebase.firestore.FieldValue.increment(Math.max(0, timeAttackScore)), // Incrementa semanal
                recordeTempo: placarAtual.recordeTempo,
                moedas: userCoins
            });
            // Atualiza UI da Home (para quando voltar)
            document.getElementById('user-score').textContent = placarAtual.pontos;
            document.getElementById('user-level').textContent = newLevel;
            document.getElementById('user-coins').textContent = userCoins;
            updateLevelProgressUI(placarAtual.pontos);
        } catch (error) {
            console.error("Erro ao salvar pontuação do modo tempo:", error);
        }

        // 5. Direcionamento
        showPopupMessage(rewardMessage, "Fim de Jogo", () => {
            if (earnedCharacter) {
                isRewardChoicePending = true;
                showCategoryChoicePopup();
            } else {
                showScreen('home-screen');
            }
        });
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
        showPopupMessage("Parabéns! Você respondeu todas as perguntas desta categoria. O ciclo será reiniciado.", "Ciclo Completo");

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

        if (snapshot.empty) return null; // Banco de dados inteiro está vazio
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

    secondChanceActive = false; // Reseta segunda chance a cada pergunta
    // --- LÓGICA ESPECÍFICA PARA O MODO DESAFIO ---
    if (currentMode === 'desafio') {
        displayChallengeQuestion();
        return;
    }
    // ---------------------------------------------

    // Limpa a interface e previne interações enquanto carrega a nova pergunta
    perguntaAtual = null; 
    questionText.textContent = "Carregando...";
    if (gameCategoryIndicator) gameCategoryIndicator.textContent = "";
    answerOptions.forEach(btn => btn.textContent = "...");
    if (reportQuestionBtn) reportQuestionBtn.style.display = 'none'; // Esconde botão reportar

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

    // 3.1 Exibe a Categoria da Pergunta
    if (gameCategoryIndicator) {
        const catObj = CATEGORIES.find(c => c.dbValue === perguntaAtual.categoria);
        if (catObj) {
            gameCategoryIndicator.textContent = `${catObj.icon} ${catObj.name.toUpperCase()}`;
            gameCategoryIndicator.style.color = catObj.color;
        } else {
            gameCategoryIndicator.textContent = perguntaAtual.categoria ? perguntaAtual.categoria.toUpperCase() : "";
            gameCategoryIndicator.style.color = "inherit";
        }
    }

    // 4. Embaralha as opções
    const shuffledOptions = shuffleArray(perguntaAtual.opcoes);

    // 5. Preenche a UI
    questionText.textContent = perguntaAtual.texto;
    answerOptions.forEach((button, index) => {
        button.textContent = shuffledOptions[index];
    });

    // Toca o som da pergunta
    playAudio(audioQuestion);

    // --- Inicia o timer se for Modo Clássico ---
    if (currentMode === 'torre') {
        startClassicTimer();
    }
    renderHelpButtons(); // Atualiza estado visual dos botões
}

/**
 * Exibe a pergunta atual do array de desafio
 */
function displayChallengeQuestion() {
    if (challengeIndex >= challengeQuestions.length) {
        endGame('desafio');
        return;
    }

    secondChanceActive = false;
    perguntaAtual = challengeQuestions[challengeIndex];
    perguntaAtualID = perguntaAtual.id; // Importante se precisarmos reportar
    correctAnswerText = perguntaAtual.opcoes[perguntaAtual.respostaCorreta];

    // UI
    gameTimerOrLevel.textContent = `Pergunta ${challengeIndex + 1}/10`;
    questionText.textContent = perguntaAtual.texto;

    // Toca o som da pergunta
    playAudio(audioQuestion);
    
    if (gameCategoryIndicator) {
        gameCategoryIndicator.textContent = "⚔️ DESAFIO";
        gameCategoryIndicator.style.color = "#673AB7";
    }

    // Embaralha opções
    const shuffledOptions = shuffleArray(perguntaAtual.opcoes);
    answerOptions.forEach((button, index) => {
        button.textContent = shuffledOptions[index];
    });
    renderHelpButtons();

    // No modo desafio não tem timer por pergunta (ou podemos por um fixo, mas vamos deixar livre por enquanto)
}
/**
 * Evento de clique nas opções de resposta (Atualizado para checar por TEXTO)
 */
answerOptions.forEach(button => {
    button.addEventListener('click', (e) => {
        // Trava os botões
        if (!perguntaAtual || (currentMode === 'tempo' && timeLeft <= 0)) return;
        answerOptions.forEach(btn => btn.disabled = true);

        // Para o timer do Modo Clássico ao responder
        if (currentMode === 'torre') {
            clearInterval(gameTimer);
            gameTimerOrLevel.style.color = ''; // Reseta cor
        }

        const clickedButton = e.target;
        const clickedAnswerText = clickedButton.textContent; // Pega o texto do botão clicado

        // Verifica se o TEXTO clicado é igual ao TEXTO correto
        if (clickedAnswerText === correctAnswerText) {

            // --- RESPOSTA CORRETA ---
            clickedButton.classList.add('correct');
            if (currentMode === 'torre') {
                handleCorrectAnswer();
            } else if (currentMode === 'desafio') {
                handleChallengeAnswer(true);
            } else {
                handleTimeAttackCorrect();
            }

        } else {

            // --- RESPOSTA ERRADA ---
            
            // LÓGICA DA SEGUNDA CHANCE
            if (secondChanceActive) {
                secondChanceActive = false; // Consome a chance
                clickedButton.classList.add('wrong');
                // Mantém o botão clicado desabilitado, mas reabilita os outros
                answerOptions.forEach(btn => {
                    if (btn !== clickedButton && btn.style.visibility !== 'hidden') {
                        btn.disabled = false;
                    }
                });
                
                // Feedback visual
                playAudio(audioClick);
                questionText.innerHTML = `<span style="color: #FF9800; font-weight: bold;">2ª Chance! Tente outra opção.</span><br>` + perguntaAtual.texto;
                return; // Sai da função para não contar como erro fatal
            }

            clickedButton.classList.add('wrong');

            // Encontra e mostra o botão correto (comparando o texto)
            answerOptions.forEach(btn => {
                if (btn.textContent === correctAnswerText) {
                    btn.classList.add('correct');
                }
            });

            if (currentMode === 'torre') {
                handleWrongAnswer();
            } else if (currentMode === 'desafio') {
                handleChallengeAnswer(false);
            } else {
                handleTimeAttackWrong();
            }
        }
    });
});
/**
 * Lida com a resposta CORRETA (Com lógica de ESCOLHA)
 */
async function handleCorrectAnswer() {
    playAudio(audioCorrect);
    
    // --- LÓGICA DE PONTUAÇÃO (MODO CLÁSSICO) ---
    let pontosGanhos = 10; // Base
    let bonusMsg = "";
    
    // Bônus de Velocidade: Se responder em menos de 10 segundos (sobrando >= 20)
    if (questionTimeLeft >= 20) {
        pontosGanhos += 5;
        bonusMsg = `<br><span style="color: #FFC107; font-size: 0.9em; font-weight: bold;">⚡ Rápido! +5 pts</span>`;
    }

    // --- MOEDAS ---
    let coinsEarned = 2; // Base por acerto
    if (questionTimeLeft >= 20) coinsEarned += 1; // Bônus de velocidade
    
    userCoins += coinsEarned;
    document.getElementById('user-coins').textContent = userCoins;

    // Feedback Visual na tela (Substitui o texto da pergunta)
    questionText.innerHTML = `
        <span style="color: #4CAF50; font-weight: 900; font-size: 1.3rem;">Resposta Correta!</span><br>
        <div style="display: flex; justify-content: center; gap: 15px; align-items: center; margin-top: 5px;">
            <span style="font-size: 1.2rem; font-weight: 900;">+${pontosGanhos} pts</span>
            <span style="font-size: 1.2rem; font-weight: 900; color: #FFD700;">+${coinsEarned} 💰</span>
        </div>
        ${bonusMsg}
    `;

    // Mostra o botão de reportar
    if (reportQuestionBtn) reportQuestionBtn.style.display = 'block';

    // 1. Atualiza o placar da sessão (e salva no Firestore)
    const nivelAtual = placarAtual.nivel;
    placarAtual.nivel++;
    placarAtual.pontos += pontosGanhos;
    
    // --- VERIFICAÇÃO DE LEVEL UP ---
    const oldLevel = calculateUserLevel(placarAtual.pontos - pontosGanhos);
    const newLevel = calculateUserLevel(placarAtual.pontos);
    const leveledUp = newLevel > oldLevel;
    
    // Bônus de Level Up
    if (leveledUp) {
        const levelUpBonus = 50;
        userCoins += levelUpBonus;
        document.getElementById('user-coins').textContent = userCoins;
    }

    // 2. Atualiza a UI e salva a progressão
    gameTimerOrLevel.textContent = `Nível ${placarAtual.nivel}`;
    document.getElementById('user-score').textContent = placarAtual.pontos;
    document.getElementById('user-level').textContent = newLevel; // Atualiza com o Nível Global
    updateLevelProgressUI(placarAtual.pontos);

    const userRef = db.collection('usuarios').doc(auth.currentUser.uid);
    await userRef.update({
        nivelTorre: placarAtual.nivel,
        pontosTotais: placarAtual.pontos,
        moedas: userCoins,
        pontosSemanais: firebase.firestore.FieldValue.increment(pontosGanhos) // Incrementa o semanal
    });

    // Salva a pergunta como respondida (MESMO QUE SEJA RECOMPENSA)
    if (perguntaAtualID && currentMode === 'torre') {
        await userRef.update({
            perguntasRespondidas: firebase.firestore.FieldValue.arrayUnion(perguntaAtualID)
        });
        perguntasRespondidasSet.add(perguntaAtualID);
        console.log(`Salvo ${perguntaAtualID} como respondida.`);
    }

    // --- FLUXO DE NAVEGAÇÃO ---
    const proceedToNextStep = () => {
        // 3. Verifica o DESBLOQUEIO DE ESCOLHA (Múltiplos de 5)
        if (placarAtual.nivel % 5 === 0 && placarAtual.nivel > 0) {
            isRewardChoicePending = true; // Define o estado de escolha
            showCategoryChoicePopup();
        } else {
            // NÃO é nível de recompensa (continua o loop)
            showScreen('roulette-screen');
        }
    };

    if (leveledUp) {
        // Se subiu de nível, mostra popup e espera o usuário fechar para continuar
        setTimeout(() => {
            playAudio(audioCorrect);
            showPopupMessage(`Parabéns! Você alcançou o Nível ${newLevel}!\nGanhou +50 Moedas 💰`, "🆙 LEVEL UP!", () => {
                proceedToNextStep();
            });
        }, 500);
    } else {
        // Se não subiu de nível, segue o fluxo normal com delay de leitura
        navigationTimeout = setTimeout(() => {
            proceedToNextStep();
        }, 2500);
    }
}
/**
 * Lida com a resposta ERRADA (Modo Torre)
 */
async function handleWrongAnswer() {
    playAudio(audioWrong);
    console.log("Resposta Errada!");

    // --- PERDA DE PONTOS ---
    const pontosPerdidos = 10;
    placarAtual.pontos = Math.max(0, placarAtual.pontos - pontosPerdidos);
    const currentLevel = calculateUserLevel(placarAtual.pontos);

    // Atualiza UI
    document.getElementById('user-score').textContent = placarAtual.pontos;
    document.getElementById('user-level').textContent = currentLevel;
    updateLevelProgressUI(placarAtual.pontos);

    // Atualiza Firestore
    const user = auth.currentUser;
    if (user) {
        db.collection('usuarios').doc(user.uid).update({ pontosTotais: placarAtual.pontos }).catch(console.error);
    }

    // Mostra o botão de próxima pergunta
    if (nextQuestionBtn) nextQuestionBtn.style.display = 'block';

    // Mostra o botão de reportar
    if (reportQuestionBtn) reportQuestionBtn.style.display = 'block';

    // Inicia o contador de 10 segundos
    let secondsLeft = 10;

    // Atualiza o texto da pergunta para mostrar o feedback e o contador
    questionText.innerHTML = `
        <span style="color: #ff5a5a; font-weight: bold;">Resposta Errada!</span><br>
        <span style="color: #F44336; font-weight: 900;">-${pontosPerdidos} pontos</span><br>
        A resposta correta era: <strong>${correctAnswerText}</strong>.<br><br>
        Próxima pergunta em <span id="countdown-display">${secondsLeft}</span>s...
    `;

    nextQuestionTimer = setInterval(() => {
        secondsLeft--;
        const display = document.getElementById('countdown-display');
        if (display) display.textContent = secondsLeft;

        if (secondsLeft <= 0) {
            goToNextQuestion();
        }
    }, 1000);
}

/**
 * Inicia o timer de 30s para o Modo Clássico
 */
function startClassicTimer() {
    clearInterval(gameTimer); // Garante que não tem outro rodando
    questionTimeLeft = 30; // Tempo por pergunta

    updateClassicTimerUI();

    gameTimer = setInterval(() => {
        questionTimeLeft--;
        updateClassicTimerUI();

        if (questionTimeLeft <= 0) {
            clearInterval(gameTimer);
            handleClassicTimeout();
        }
    }, 1000);
}

function updateClassicTimerUI() {
    gameTimerOrLevel.textContent = `Nível ${placarAtual.nivel} | ⏳ ${questionTimeLeft}s`;
    
    if (questionTimeLeft <= 10) {
        gameTimerOrLevel.style.color = '#ff5a5a'; // Vermelho alerta
    } else {
        gameTimerOrLevel.style.color = ''; // Cor padrão
    }
}

function handleClassicTimeout() {
    playAudio(audioWrong);
    console.log("Tempo Esgotado!");

    // Trava botões
    answerOptions.forEach(btn => btn.disabled = true);

    // Mostra botão de próxima
    if (nextQuestionBtn) nextQuestionBtn.style.display = 'block';

    // Mostra o botão de reportar
    if (reportQuestionBtn) reportQuestionBtn.style.display = 'block';

    // Inicia contador de auto-avanço (reutilizando lógica de erro)
    let secondsLeft = 10;
    
    // Texto sem mostrar a resposta correta
    questionText.innerHTML = `
        <span style="color: #ff5a5a; font-weight: bold;">Tempo Esgotado!</span><br>
        Que pena, o tempo acabou.<br><br>
        Próxima pergunta em <span id="countdown-display">${secondsLeft}</span>s...
    `;

    nextQuestionTimer = setInterval(() => {
        secondsLeft--;
        const display = document.getElementById('countdown-display');
        if (display) display.textContent = secondsLeft;

        if (secondsLeft <= 0) {
            goToNextQuestion();
        }
    }, 1000);
}

function goToNextQuestion() {
    if (nextQuestionTimer) {
        clearInterval(nextQuestionTimer);
        nextQuestionTimer = null;
    }
    if (nextQuestionBtn) nextQuestionBtn.style.display = 'none';
    showScreen('roulette-screen');
}
/**
 * Lida com a resposta CORRETA (Modo Tempo)
 */
function handleTimeAttackCorrect() {
    playAudio(audioCorrect);
    
    // --- SISTEMA DE COMBO (MODO TEMPO) ---
    comboCount++;
    // Base 10 + 2 pontos por cada acerto extra na sequência (Max +20 de bônus)
    let bonusCombo = Math.min((comboCount - 1) * 2, 20); 
    let pontosRodada = 10 + bonusCombo;
    
    timeAttackScore += pontosRodada;
    console.log(`Correto! +${pontosRodada} pontos (Combo x${comboCount})`);
    
    // Feedback Visual na tela (Mostra o Combo)
    let comboHtml = "";
    if (comboCount > 1) {
        comboHtml = `<br><span style="color: #FF9800; font-weight: bold; font-size: 0.9em;">🔥 COMBO x${comboCount}! (+${bonusCombo})</span>`;
    }

    questionText.innerHTML = `
        <span style="color: #4CAF50; font-weight: 900; font-size: 1.3rem;">Correto!</span><br>
        <span style="font-size: 1.5rem; font-weight: 900;">+${pontosRodada}</span> pontos
        ${comboHtml}
    `;

    // Mostra o botão de reportar
    if (reportQuestionBtn) reportQuestionBtn.style.display = 'block';

    // Volta para a Roleta (mais rápido)
    navigationTimeout = setTimeout(() => {
        nextTimeAttackQuestion(); // Carrega a próxima direto
    }, 1500);
}

/**
 * Lida com a resposta ERRADA (Modo Tempo)
 */
function handleTimeAttackWrong() {
    playAudio(audioWrong);
    console.log("Errado! -5 segundos");
    timeLeft -= 5; // Penalidade de tempo
    comboCount = 0; // Zera o combo se errar

    // --- NOVO: Penalidade de Pontos ---
    const penalty = 10;
    timeAttackScore -= penalty;

    // Mostra o botão de reportar
    if (reportQuestionBtn) reportQuestionBtn.style.display = 'block';

    // Feedback Visual
    questionText.innerHTML = `
        <span style="color: #ff5a5a; font-weight: bold;">Errado!</span><br>
        <span style="color: #F44336; font-weight: 900;">-5s | -${penalty} pts</span>
    `;

    // Atualiza o relógio imediatamente
    if (timeLeft < 0) timeLeft = 0;
    const minutes = Math.floor(timeLeft / 60);
    const seconds = timeLeft % 60;
    gameTimerOrLevel.textContent =
        `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;

    // Volta para a Roleta
    navigationTimeout = setTimeout(() => {
        nextTimeAttackQuestion(); // Carrega a próxima direto
    }, 2000);


}

/**
 * Lida com resposta no Modo Desafio
 */
function handleChallengeAnswer(isCorrect) {
    if (isCorrect) {
        playAudio(audioCorrect);
        challengeData.currentScore++; // Incrementa pontuação local
    } else {
        playAudio(audioWrong);
    }

    // Avança para a próxima pergunta após um delay
    setTimeout(() => {
        challengeIndex++;
        displayChallengeQuestion();
        resetAnswerOptions();
    }, 1500);
}


/**
 * Helper: Reseta a aparência dos botões de resposta
 */
function resetAnswerOptions() {
    answerOptions.forEach(button => {
        button.disabled = false;
        button.classList.remove('correct', 'wrong');
        button.style.visibility = 'visible'; // Garante que botões ocultos pelo 50/50 voltem
    });
    if (nextQuestionBtn) nextQuestionBtn.style.display = 'none';
    if (reportQuestionBtn) reportQuestionBtn.style.display = 'none';
}

// =======================================================
// --- FUNÇÕES DOS BOTÕES DE AJUDA (POWER-UPS) ---
// =======================================================

function renderHelpButtons() {
    let container = document.getElementById('help-buttons-container');
    
    // Cria o container se não existir
    if (!container) {
        container = document.createElement('div');
        container.id = 'help-buttons-container';
        container.className = 'help-container';
        // Insere logo após as opções de resposta
        const optionsContainer = document.querySelector('.answer-options');
        if (optionsContainer) {
            optionsContainer.parentNode.insertBefore(container, optionsContainer.nextSibling);
        }
    }
    
    const isTimeMode = currentMode === 'tempo';
    const skipLabel = isTimeMode ? "+10s" : "Pular";
    const skipIcon = isTimeMode ? "⏳" : "⏭️";
    
    // Renderiza os botões
    container.innerHTML = `
        <button class="help-btn" onclick="useCorrectPowerup()" ${powerups.correct <= 0 ? 'disabled' : ''}>
            <span class="help-badge">${powerups.correct}</span>
            <span class="help-icon">✅</span>
            <span class="help-label">Resposta</span>
        </button>
        <button class="help-btn" onclick="useFiftyPowerup()" ${powerups.fifty <= 0 ? 'disabled' : ''}>
            <span class="help-badge">${powerups.fifty}</span>
            <span class="help-icon">✂️</span>
            <span class="help-label">50/50</span>
        </button>
        <button class="help-btn" onclick="useSecondChancePowerup()" ${powerups.secondChance <= 0 ? 'disabled' : ''}>
            <span class="help-badge">${powerups.secondChance}</span>
            <span class="help-icon">🔄</span>
            <span class="help-label">2ª Chance</span>
        </button>
        <button class="help-btn" onclick="useSkipPowerup()" ${powerups.skip <= 0 ? 'disabled' : ''}>
            <span class="help-badge">${powerups.skip}</span>
            <span class="help-icon">${skipIcon}</span>
            <span class="help-label">${skipLabel}</span>
        </button>
    `;
}

// 1. Botão Resposta Correta
window.useCorrectPowerup = () => {
    if (powerups.correct <= 0 || !perguntaAtual) return;
    playAudio(audioClick);
    powerups.correct--;
    
    // Persiste o uso no banco
    if (auth.currentUser) {
        db.collection('usuarios').doc(auth.currentUser.uid).update({
            powerups_correct: firebase.firestore.FieldValue.increment(-1)
        }).catch(console.error);
    }
    
    // Encontra o botão correto e simula o clique
    answerOptions.forEach(btn => {
        if (btn.textContent === correctAnswerText) {
            btn.click();
        }
    });
    renderHelpButtons();
};

// 2. Botão 50/50 (Eliminar 2)
window.useFiftyPowerup = () => {
    if (powerups.fifty <= 0 || !perguntaAtual) return;
    playAudio(audioClick);
    powerups.fifty--;
    
    // Persiste o uso no banco
    if (auth.currentUser) {
        db.collection('usuarios').doc(auth.currentUser.uid).update({
            powerups_fifty: firebase.firestore.FieldValue.increment(-1)
        }).catch(console.error);
    }
    
    // Identifica botões errados
    const wrongButtons = Array.from(answerOptions).filter(btn => btn.textContent !== correctAnswerText);
    // Embaralha e pega 2
    const shuffledWrong = shuffleArray(wrongButtons);
    const toRemove = shuffledWrong.slice(0, 2);
    
    toRemove.forEach(btn => {
        btn.style.visibility = 'hidden'; // Esconde visualmente mas mantém layout
        btn.disabled = true;
    });
    renderHelpButtons();
};

// 3. Botão Segunda Chance
window.useSecondChancePowerup = () => {
    if (powerups.secondChance <= 0 || !perguntaAtual) return;
    playAudio(audioClick);
    powerups.secondChance--;
    
    // Persiste o uso no banco
    if (auth.currentUser) {
        db.collection('usuarios').doc(auth.currentUser.uid).update({
            powerups_secondChance: firebase.firestore.FieldValue.increment(-1)
        }).catch(console.error);
    }
    
    secondChanceActive = true;
    showPopupMessage("Se você errar, terá mais uma chance!", "Segunda Chance Ativa");
    renderHelpButtons();
};

// 4. Botão Pular / Mais Tempo
window.useSkipPowerup = () => {
    if (powerups.skip <= 0) return;
    playAudio(audioClick);
    powerups.skip--;
    
    // Persiste o uso no banco
    if (auth.currentUser) {
        db.collection('usuarios').doc(auth.currentUser.uid).update({
            powerups_skip: firebase.firestore.FieldValue.increment(-1)
        }).catch(console.error);
    }
    
    if (currentMode === 'tempo') {
        timeLeft += 10;
        showPopupMessage("+10 Segundos adicionados!", "Tempo Extra");
    } else {
        goToNextQuestion(); // Pula para a roleta/próxima
    }
    renderHelpButtons();
}
// --- 4. LÓGICA DA FÁBRICA (CONECTADO) ---

// Navegação por Abas na Fábrica (com lógica de carregar)
const tabButtons = document.querySelectorAll('.tab-button');
const tabContents = document.querySelectorAll('.tab-content');

tabButtons.forEach(button => {
    button.addEventListener('click', () => {
        playAudio(audioClick);
        
        // Encontra a tela pai para fazer a troca de abas apenas dentro dela
        const parentScreen = button.closest('.screen');
        if (!parentScreen) return;

        // Remove 'active' apenas dos botões e conteúdos desta tela
        parentScreen.querySelectorAll('.tab-button').forEach(btn => btn.classList.remove('active'));
        parentScreen.querySelectorAll('.tab-content').forEach(content => content.classList.remove('active'));

        // Adiciona 'active' ao clicado
        button.classList.add('active');
        const targetTab = document.getElementById(`${button.dataset.tab}-tab`);
        if (targetTab) targetTab.classList.add('active');

        // Se a aba for "avaliar", busca uma pergunta
        if (button.dataset.tab === 'avaliar') {
            carregarPerguntaParaAvaliar();
        }
        // NOVO: Carrega solicitações de troca ao clicar na aba
        if (button.dataset.tab === 'trocas') {
            loadTradeRequests();
        }
        // NOVO: Carrega coleção ao clicar na aba de personagens
        if (button.dataset.tab === 'personagens') {
            loadCollection();
        }

        // Se a aba for "resultados", marca como visto
        if (button.dataset.tab === 'resultados') {
            // Atualiza o contador local para igualar o total encontrado
            // (Isso será tratado dentro de loadChallengeHub ou aqui se tivermos o valor global)
            markResultsAsSeen();
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
        showPopupMessage("Você precisa estar logado para enviar uma pergunta.", "Atenção");
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
        showPopupMessage("Obrigado! Sua pergunta foi enviada para avaliação.", "Sucesso");

        submitForm.reset(); // Limpa o formulário

    } catch (error) {
        // Trata qualquer erro que ocorra
        console.error("Erro ao salvar pergunta: ", error);
        showPopupMessage("Erro ao salvar sua pergunta. Tente novamente.", "Erro");
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
        .limit(20); // Busca mais para filtrar localmente

    const snapshot = await query.get();

    // Filtra localmente perguntas que o usuário já avaliou
    let doc = null;
    for (const d of snapshot.docs) {
        const dData = d.data();
        const avaliadoPor = dData.avaliadoPor || [];
        if (!avaliadoPor.includes(user.uid)) {
            doc = d;
            break;
        }
    }

    if (!doc) {
        // Nenhuma pergunta encontrada
        console.log("Nenhuma pergunta para avaliar.");
        reviewCard.innerHTML = "<p>Ótimo trabalho! Nenhuma pergunta nova para avaliar.</p>";
        reviewActions.style.display = 'none'; // Esconde botões
        perguntaEmAvaliacao = null;
        return;
    }

    // Pergunta encontrada!
    perguntaEmAvaliacao = doc; // Salva o documento inteiro

    const data = doc.data();

    // Mostra os botões e o card
    reviewCard.style.display = 'block';
    reviewActions.style.display = 'flex';

    // Limpa opções antigas (importante)
    // Remove todos os '.review-option' antigos
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
        showPopupMessage("Uma pergunta mal formatada foi encontrada e será removida.", "Erro de Dados");
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
    const user = auth.currentUser;

    try {
        await db.runTransaction(async (transaction) => {
            const docRef = perguntaEmAvaliacao.ref;
            const doc = await transaction.get(docRef);
            if (!doc.exists) throw "Pergunta não encontrada.";

            const data = doc.data();
            const votos = (data.votosAprovacao || 0) + 1;
            const avaliadoPor = data.avaliadoPor || [];

            if (avaliadoPor.includes(user.uid)) throw "Você já avaliou esta pergunta.";

            avaliadoPor.push(user.uid);

            if (votos >= 3) {
                // Atingiu 3 votos: Aprova e move
                const perguntaPublicada = {
                    categoria: data.categoria,
                    texto: data.texto,
                    opcoes: data.opcoes,
                    respostaCorreta: data.respostaCorreta,
                    autor: data.autor
                };
                transaction.set(db.collection('perguntas_publicadas').doc(), perguntaPublicada);
                transaction.delete(docRef);
            } else {
                // Apenas incrementa o voto
                transaction.update(docRef, {
                    votosAprovacao: votos,
                    avaliadoPor: avaliadoPor
                });
            }
        });

        console.log("Voto de aprovação registrado.");
        showPopupMessage("Voto registrado! Obrigado.", "Sucesso");

        // 5. Carrega a próxima pergunta
        carregarPerguntaParaAvaliar();

    } catch (error) {
        console.error("Erro ao aprovar pergunta: ", error);
        showPopupMessage("Erro ao votar: " + error, "Erro");
        if (error === "Você já avaliou esta pergunta.") carregarPerguntaParaAvaliar();
    }
});

document.getElementById('review-reject').addEventListener('click', () => {
    if (!perguntaEmAvaliacao) return;
    const user = auth.currentUser;

    showConfirmPopup("Tem certeza que deseja votar para REJEITAR esta pergunta?", async () => {
        try {
            await db.runTransaction(async (transaction) => {
                const docRef = perguntaEmAvaliacao.ref;
                const doc = await transaction.get(docRef);
                if (!doc.exists) throw "Pergunta não encontrada.";

                const data = doc.data();
                const votos = (data.votosReprovacao || 0) + 1;
                const avaliadoPor = data.avaliadoPor || [];

                if (avaliadoPor.includes(user.uid)) throw "Você já avaliou esta pergunta.";

                avaliadoPor.push(user.uid);

                if (votos >= 3) {
                    // Atingiu 3 votos: Rejeita e exclui
                    transaction.delete(docRef);
                } else {
                    // Apenas incrementa o voto
                    transaction.update(docRef, {
                        votosReprovacao: votos,
                        avaliadoPor: avaliadoPor
                    });
                }
            });

            console.log("Voto de rejeição registrado.");
            showPopupMessage("Voto registrado! Obrigado.", "Sucesso");

            carregarPerguntaParaAvaliar();
        } catch (error) {
            console.error("Erro ao rejeitar pergunta: ", error);
            showPopupMessage("Erro ao votar: " + error, "Erro");
            if (error === "Você já avaliou esta pergunta.") carregarPerguntaParaAvaliar();
        }
    }, "Rejeitar Pergunta");
});

// =======================================================
// --- LÓGICA DE AMIGOS (NOVO) ---
// =======================================================

// 1. Pesquisar Usuários
if (searchFriendBtn) {
    searchFriendBtn.addEventListener('click', async () => {
        playAudio(audioClick);
        const rawTerm = friendSearchInput.value.trim();
        const normalizedTerm = normalizeString(rawTerm); // Usa termo normalizado
        
        friendSearchResults.style.display = 'none';
        friendSearchResults.innerHTML = '';
        friendRequestMsg.textContent = "";

        if (!rawTerm) return;

        searchFriendBtn.disabled = true;
        searchFriendBtn.textContent = "...";

        try {
            // 1. Busca pelo username (sempre minúsculo)
            const usernameQuery = db.collection('usuarios')
                .where('username', '>=', normalizedTerm)
                .where('username', '<=', normalizedTerm + '\uf8ff')
                .limit(5)
                .get();

            // 2. Busca pelo nome de exibição (usando nomeBusca)
            const nameQuery = db.collection('usuarios')
                .where('nomeBusca', '>=', normalizedTerm)
                .where('nomeBusca', '<=', normalizedTerm + '\uf8ff')
                .limit(5)
                .get();

            // 3. Fallback: Busca pelo nome original (Case Sensitive)
            // Ajuda a encontrar usuários que ainda não têm o campo 'nomeBusca' (migração pendente)
            const rawNameQuery = db.collection('usuarios')
                .where('nome', '>=', rawTerm)
                .where('nome', '<=', rawTerm + '\uf8ff')
                .limit(5)
                .get();

            // 4. Fallback Extra: Tenta Capitalizado (ex: "joao" -> "Joao")
            // Isso corrige o problema onde "Joao" (ASCII menor) não é encontrado buscando "joao"
            let capitalizedNameQuery = Promise.resolve({ forEach: () => {} });
            if (rawTerm.length > 0) {
                const capitalizedTerm = rawTerm.charAt(0).toUpperCase() + rawTerm.slice(1);
                if (capitalizedTerm !== rawTerm) {
                    capitalizedNameQuery = db.collection('usuarios')
                        .where('nome', '>=', capitalizedTerm)
                        .where('nome', '<=', capitalizedTerm + '\uf8ff')
                        .limit(5)
                        .get();
                }
            }

            const [usernameSnapshot, nameSnapshot, rawNameSnapshot, capitalizedSnapshot] = await Promise.all([usernameQuery, nameQuery, rawNameQuery, capitalizedNameQuery]);

            // Mescla resultados usando um Map para evitar duplicatas (pelo ID)
            const results = new Map();
            const currentUid = auth.currentUser.uid;

            const processDoc = (doc) => {
                if (doc.id !== currentUid) {
                    results.set(doc.id, doc.data());
                }
            };

            usernameSnapshot.forEach(processDoc);
            nameSnapshot.forEach(processDoc);
            rawNameSnapshot.forEach(processDoc);
            capitalizedSnapshot.forEach(processDoc);

            if (results.size === 0) {
                friendRequestMsg.style.color = "var(--text-dark)";
                friendRequestMsg.textContent = "Nenhum usuário encontrado.";
            } else {
                friendSearchResults.style.display = 'block';
                results.forEach((data, id) => {
                    const li = document.createElement('li');
                    li.innerHTML = `
                        <div class="rank-info">
                            <img src="${data.fotoURL || 'images/avatar-default.png'}" class="rank-avatar">
                            <div style="display:flex; flex-direction:column; align-items:flex-start;">
                                <span class="rank-name">${data.nome}</span>
                                <span style="font-size:0.8rem; color:#777;">@${data.username}</span>
                            </div>
                        </div>
                        <button class="request-btn" style="background: #2196F3;" onclick="sendFriendRequest('${id}')">Adicionar</button>
                    `;
                    friendSearchResults.appendChild(li);
                });
            }
        } catch (error) {
            console.error("Erro na busca:", error);
            friendRequestMsg.style.color = "red";
            friendRequestMsg.textContent = "Erro ao buscar usuários.";
        } finally {
            searchFriendBtn.disabled = false;
            searchFriendBtn.textContent = "🔍";
        }
    });
}

// Função global para enviar solicitação (chamada pelo botão da lista)
window.sendFriendRequest = async (targetUid) => {
    const currentUser = auth.currentUser;
    if (!currentUser) return;

    friendRequestMsg.textContent = "Enviando...";
    friendRequestMsg.style.color = "var(--text-dark)";

    try {
        const currentUserDoc = await db.collection('usuarios').doc(currentUser.uid).get();
        const currentData = currentUserDoc.data();
        
        const targetRef = db.collection('usuarios').doc(targetUid);
        const targetDoc = await targetRef.get();

        if (!targetDoc.exists) throw new Error("Usuário não encontrado.");

        // Verifica se já são amigos ou se já enviou
        const friends = currentData.friends || [];
        const sentRequests = currentData.friendRequestsSent || [];
        const receivedRequests = currentData.friendRequestsReceived || [];

        if (friends.includes(targetUid)) throw new Error("Vocês já são amigos!");
        if (sentRequests.includes(targetUid)) throw new Error("Solicitação já enviada.");
        if (receivedRequests.includes(targetUid)) throw new Error("Essa pessoa já te enviou uma solicitação! Aceite na lista abaixo.");

        // Envia a solicitação
        const batch = db.batch();
        
        batch.update(currentUserDoc.ref, {
            friendRequestsSent: firebase.firestore.FieldValue.arrayUnion(targetUid)
        });
        
        batch.update(targetRef, {
            friendRequestsReceived: firebase.firestore.FieldValue.arrayUnion(currentUser.uid)
        });

        await batch.commit();

        friendRequestMsg.style.color = "green";
        friendRequestMsg.textContent = "Solicitação enviada com sucesso!";
        
        // Limpa a busca para dar feedback visual de conclusão
        friendSearchResults.style.display = 'none';
        friendSearchInput.value = '';

    } catch (error) {
        friendRequestMsg.style.color = "red";
        friendRequestMsg.textContent = error.message;
    }
};

// 2. Carregar Tela de Amigos
async function loadFriendsScreen() {
    const user = auth.currentUser;
    if (!user) return;

    friendRequestsList.innerHTML = '';
    friendsList.innerHTML = '<li>Carregando...</li>';
    friendRequestsContainer.style.display = 'none';

    try {
        // Gera o link de convite
        if (inviteLinkInput) {
            inviteLinkInput.value = `${window.location.origin}${window.location.pathname}?invite=${user.uid}`;
        }

        const userDoc = await db.collection('usuarios').doc(user.uid).get();
        const data = userDoc.data();
        
        const receivedRequests = data.friendRequestsReceived || [];
        const friends = data.friends || [];

        // Atualiza o badge também ao abrir a tela
        checkFriendRequestsNotification(data);

        // --- A. Renderiza Solicitações Pendentes ---
        if (receivedRequests.length > 0) {
            friendRequestsContainer.style.display = 'block';
            
            // Busca dados dos usuários que enviaram solicitação
            // Nota: Firestore 'in' limita a 10. Para produção ideal, fazer em chunks ou loop.
            // Aqui faremos um loop simples para garantir que funcione com qualquer quantidade.
            const requestPromises = receivedRequests.map(uid => db.collection('usuarios').doc(uid).get());
            const requestDocs = await Promise.all(requestPromises);

            requestDocs.forEach(doc => {
                if (!doc.exists) return;
                const rData = doc.data();
                const li = document.createElement('li');
                li.innerHTML = `
                    <div class="rank-info">
                        <img src="${rData.fotoURL || 'images/avatar-default.png'}" class="rank-avatar">
                        <span class="rank-name">${rData.nome}</span>
                    </div>
                    <div class="request-actions">
                        <button class="request-btn" style="background: #4CAF50;" onclick="respondFriendRequest('${doc.id}', true)">✓</button>
                        <button class="request-btn" style="background: #F44336;" onclick="respondFriendRequest('${doc.id}', false)">✕</button>
                    </div>
                `;
                friendRequestsList.appendChild(li);
            });
        }

        // --- B. Renderiza Lista de Amigos ---
        friendsList.innerHTML = '';
        if (friends.length === 0) {
            friendsList.innerHTML = '<li style="justify-content: center; color: #777;">Você ainda não tem amigos adicionados.</li>';
        } else {
            const friendPromises = friends.map(uid => db.collection('usuarios').doc(uid).get());
            const friendDocs = await Promise.all(friendPromises);

            friendDocs.forEach(doc => {
                if (!doc.exists) return;
                const fData = doc.data();
                const li = document.createElement('li');
                li.style.cursor = 'pointer'; // Indica que é clicável
                li.onclick = () => showUserProfile(doc.id); // Abre detalhes ao clicar
                li.innerHTML = `
                    <div class="rank-info">
                        <img src="${fData.fotoURL || 'images/avatar-default.png'}" class="rank-avatar">
                        <span class="rank-name">${fData.nome}</span>
                    </div>
                    <span class="rank-score" style="font-size: 0.9rem;">${fData.pontosTotais || 0} pts</span>
                `;
                friendsList.appendChild(li);
            });
        }

    } catch (error) {
        console.error("Erro ao carregar amigos:", error);
        friendsList.innerHTML = '<li>Erro ao carregar lista.</li>';
    }
}

// Lógica do Botão de Copiar Convite
if (copyInviteBtn) {
    copyInviteBtn.addEventListener('click', () => {
        playAudio(audioClick);
        if (inviteLinkInput && inviteLinkInput.value) {
            inviteLinkInput.select();
            inviteLinkInput.setSelectionRange(0, 99999); // Para mobile
            
            // Tenta usar a API moderna, fallback para execCommand
            if (navigator.clipboard) {
                navigator.clipboard.writeText(inviteLinkInput.value)
                    .then(() => showPopupMessage("Link copiado para a área de transferência!", "Sucesso"))
                    .catch(() => showPopupMessage("Erro ao copiar link.", "Erro"));
            } else {
                document.execCommand("copy");
                showPopupMessage("Link copiado!", "Sucesso");
            }
        }
    });
}

// Verifica se a URL tem um código de convite
async function checkInviteUrl(user) {
    const urlParams = new URLSearchParams(window.location.search);
    const inviteUid = urlParams.get('invite');

    if (inviteUid) {
        // Limpa a URL para não processar novamente ao recarregar
        const newUrl = window.location.protocol + "//" + window.location.host + window.location.pathname;
        window.history.replaceState({path: newUrl}, '', newUrl);

        if (inviteUid === user.uid) return; // Não pode convidar a si mesmo

        // Verifica se já são amigos antes de perguntar
        try {
            const userDoc = await db.collection('usuarios').doc(user.uid).get();
            if (userDoc.exists) {
                const userData = userDoc.data();
                const friends = userData.friends || [];
                if (friends.includes(inviteUid)) {
                    showPopupMessage("Vocês já são amigos!", "Aviso");
                    return;
                }
            }
        } catch (e) {
            console.error("Erro ao verificar amizade:", e);
        }

        showConfirmPopup("Você acessou um link de convite. Deseja adicionar este usuário aos seus amigos?", async () => {
            showScreen('friends-screen');
            
            try {
                const batch = db.batch();
                const currentUserRef = db.collection('usuarios').doc(user.uid);
                const inviterRef = db.collection('usuarios').doc(inviteUid);

                // Adiciona na lista de amigos de AMBOS e remove pendências (se houver)
                batch.update(currentUserRef, {
                    friends: firebase.firestore.FieldValue.arrayUnion(inviteUid),
                    friendRequestsSent: firebase.firestore.FieldValue.arrayRemove(inviteUid),
                    friendRequestsReceived: firebase.firestore.FieldValue.arrayRemove(inviteUid)
                });
                
                batch.update(inviterRef, {
                    friends: firebase.firestore.FieldValue.arrayUnion(user.uid),
                    friendRequestsSent: firebase.firestore.FieldValue.arrayRemove(user.uid),
                    friendRequestsReceived: firebase.firestore.FieldValue.arrayRemove(user.uid)
                });

                await batch.commit();
                
                showPopupMessage("Amizade adicionada com sucesso!", "Sucesso");
                loadFriendsScreen(); // Recarrega a tela para mostrar o novo amigo

            } catch (error) {
                console.error("Erro ao adicionar amigo via link:", error);
                showPopupMessage("Erro ao processar o convite.", "Erro");
            }
        }, "Convite de Amizade");
    }
}

// 3. Responder Solicitação (Aceitar/Recusar)
// Função global para ser acessada pelo onclick do HTML gerado dinamicamente
window.respondFriendRequest = async (senderUid, accepted) => {
    const currentUser = auth.currentUser;
    if (!currentUser) return;

    try {
        const batch = db.batch();
        const currentUserRef = db.collection('usuarios').doc(currentUser.uid);
        const senderUserRef = db.collection('usuarios').doc(senderUid);

        // Remove da lista de pendentes (para ambos os casos)
        batch.update(currentUserRef, {
            friendRequestsReceived: firebase.firestore.FieldValue.arrayRemove(senderUid)
        });
        batch.update(senderUserRef, {
            friendRequestsSent: firebase.firestore.FieldValue.arrayRemove(currentUser.uid)
        });

        if (accepted) {
            // Se aceitou, adiciona na lista de amigos de AMBOS
            batch.update(currentUserRef, {
                friends: firebase.firestore.FieldValue.arrayUnion(senderUid)
            });
            batch.update(senderUserRef, {
                friends: firebase.firestore.FieldValue.arrayUnion(currentUser.uid)
            });
        }

        await batch.commit();
        loadFriendsScreen(); // Recarrega a tela

    } catch (error) {
        console.error("Erro ao responder solicitação:", error);
        showPopupMessage("Erro ao processar solicitação.", "Erro");
    }
};

// 4. Mostrar Perfil do Usuário (Amigo ou Não)
async function showUserProfile(targetUid) {
    playAudio(audioClick);
    
    const currentUser = auth.currentUser;
    if (!currentUser) return;

    // Busca dados do alvo e do usuário atual (para checar amizade)
    const [doc, currentUserDoc] = await Promise.all([
        db.collection('usuarios').doc(targetUid).get(),
        db.collection('usuarios').doc(currentUser.uid).get()
    ]);

    if (!doc.exists) return;
    const data = doc.data();
    const currentData = currentUserDoc.data();

    // Preenche o Popup
    friendDetailImg.src = data.fotoURL || 'images/avatar-default.png';
    friendDetailName.textContent = data.nome;
    friendDetailUsername.textContent = data.username ? '@' + data.username : '';
    friendDetailLevel.textContent = calculateUserLevel(data.pontosTotais || 0); // Usa a nova fórmula
    friendDetailScore.textContent = data.pontosTotais || 0;
    if (friendDetailRank) friendDetailRank.textContent = "#..."; // Reset visual enquanto carrega

    // --- LÓGICA DE BOTÕES (Amigo vs Desconhecido) ---
    const isSelf = targetUid === currentUser.uid;
    const isFriend = (currentData.friends || []).includes(targetUid);
    const isPending = (currentData.friendRequestsSent || []).includes(targetUid);

    // 1. Reseta visibilidade
    if (challengeFriendBtn) challengeFriendBtn.style.display = 'none';
    if (viewFriendCollectionBtn) viewFriendCollectionBtn.style.display = 'none';
    if (removeFriendBtn) removeFriendBtn.style.display = 'none';
    if (addFriendPopupBtn) addFriendPopupBtn.style.display = 'none';

    if (isSelf) {
        // Se for você mesmo, não mostra botões de ação (só fechar)
    } else if (isFriend) {
        // É AMIGO: Mostra opções de amigo
        if (challengeFriendBtn) {
            challengeFriendBtn.style.display = 'block';
            challengeFriendBtn.onclick = () => {
                friendDetailPopup.classList.remove('active');
                initiateChallenge(targetUid, data.nome);
            };
        }
        if (viewFriendCollectionBtn) {
            viewFriendCollectionBtn.style.display = 'block';
            viewFriendCollectionBtn.onclick = () => showFriendCollection(targetUid, data.nome);
        }
        if (removeFriendBtn) {
            removeFriendBtn.style.display = 'block';
            removeFriendBtn.onclick = () => {
                playAudio(audioClick);
                const msg = `Tem certeza que deseja desfazer a amizade com ${data.nome}?`;
                showConfirmPopup(msg, () => {
                    removeFriend(targetUid);
                }, "Desfazer Amizade");
            };
        }
    } else {
        // NÃO É AMIGO
        if (addFriendPopupBtn) {
            addFriendPopupBtn.style.display = 'block';
            if (isPending) {
                addFriendPopupBtn.textContent = "Solicitação Enviada";
                addFriendPopupBtn.disabled = true;
                addFriendPopupBtn.style.backgroundColor = "#9E9E9E";
            } else {
                addFriendPopupBtn.textContent = "Adicionar Amigo";
                addFriendPopupBtn.disabled = false;
                addFriendPopupBtn.style.backgroundColor = "#4CAF50";
                addFriendPopupBtn.onclick = async () => {
                    playAudio(audioClick);
                    addFriendPopupBtn.textContent = "Enviando...";
                    addFriendPopupBtn.disabled = true;
                    
                    // Reusa a lógica de enviar solicitação (adaptada)
                    try {
                        const batch = db.batch();
                        batch.update(db.collection('usuarios').doc(currentUser.uid), {
                            friendRequestsSent: firebase.firestore.FieldValue.arrayUnion(targetUid)
                        });
                        batch.update(db.collection('usuarios').doc(targetUid), {
                            friendRequestsReceived: firebase.firestore.FieldValue.arrayUnion(currentUser.uid)
                        });
                        await batch.commit();
                        
                        addFriendPopupBtn.textContent = "Solicitação Enviada";
                        addFriendPopupBtn.style.backgroundColor = "#9E9E9E";
                    } catch (e) {
                        console.error(e);
                        showPopupMessage("Erro ao enviar solicitação.", "Erro");
                        addFriendPopupBtn.textContent = "Adicionar Amigo";
                        addFriendPopupBtn.disabled = false;
                    }
                };
            }
        }
    }

    // Abre o popup
    friendDetailPopup.classList.add('active');

    // Calcula e exibe o Ranking Global do amigo
    try {
        const points = data.pontosTotais || 0;
        // Conta quantos usuários têm MAIS pontos que este amigo
        const snapshot = await db.collection('usuarios')
            .where('pontosTotais', '>', points)
            .get();
        const rank = snapshot.size + 1;
        if (friendDetailRank) friendDetailRank.textContent = `#${rank}`;
    } catch (error) {
        console.error("Erro ao buscar ranking do amigo:", error);
    }
}

// Função para mostrar a coleção do amigo
async function showFriendCollection(friendUid, friendName) {
    playAudio(audioClick);
    friendCollectionGrid.innerHTML = '<p>Carregando...</p>';
    friendCollectionTitle.textContent = `Coleção de ${friendName}`;
    friendCollectionPopup.classList.add('active');

    try {
        const doc = await db.collection('usuarios').doc(friendUid).get();
        if (!doc.exists) {
            friendCollectionGrid.innerHTML = '<p>Erro ao carregar.</p>';
            return;
        }

        const data = doc.data();
        const unlockedIds = new Set(data.personagensConquistados || []);
        
        friendCollectionGrid.innerHTML = '';

        if (unlockedIds.size === 0) {
            friendCollectionGrid.innerHTML = '<p style="grid-column: 1/-1;">Este amigo ainda não possui personagens.</p>';
            return;
        }

        // Filtra apenas os personagens que o amigo possui
        const ownedCharacters = PERSONAGENS.filter(p => unlockedIds.has(p.id));

        ownedCharacters.forEach(personagem => {
            const card = document.createElement('div');
            card.className = 'character-card'; // Reusa estilo existente
            card.innerHTML = `
                <img src="${personagem.imagemUrl || `images/personagens/${personagem.id}.png`}" alt="${personagem.nome}" onerror="this.src='images/avatar-default.png'">
                <p style="font-size: 0.7rem;">${personagem.nome}</p>
            `;
            friendCollectionGrid.appendChild(card);
        });

    } catch (error) {
        console.error("Erro ao carregar coleção do amigo:", error);
        friendCollectionGrid.innerHTML = '<p>Erro ao carregar.</p>';
    }
}

// 5. Remover Amigo
async function removeFriend(friendUid) {
    const currentUser = auth.currentUser;
    if (!currentUser) return;

    try {
        const batch = db.batch();
        const currentUserRef = db.collection('usuarios').doc(currentUser.uid);
        const friendRef = db.collection('usuarios').doc(friendUid);

        // Remove o ID da lista de amigos de AMBOS
        batch.update(currentUserRef, {
            friends: firebase.firestore.FieldValue.arrayRemove(friendUid)
        });
        batch.update(friendRef, {
            friends: firebase.firestore.FieldValue.arrayRemove(currentUser.uid)
        });

        await batch.commit();
        
        friendDetailPopup.classList.remove('active');
        showPopupMessage("Amizade desfeita.", "Aviso");
        loadFriendsScreen(); // Recarrega a lista

    } catch (error) {
        console.error("Erro ao remover amigo:", error);
        showPopupMessage("Erro ao remover amigo.", "Erro");
    }
}

/**
 * Verifica se há solicitações de amizade pendentes e mostra o badge
 */
function checkFriendRequestsNotification(userData) {
    if (!userData || !friendsBadge) return;
    
    const requests = userData.friendRequestsReceived || [];
    if (requests.length > 0) {
        friendsBadge.style.display = 'block';
    } else {
        friendsBadge.style.display = 'none';
    }
}

// Listener para fechar o popup de detalhes do amigo
if (closeFriendDetailBtn) {
    closeFriendDetailBtn.addEventListener('click', () => {
        playAudio(audioClick);
        friendDetailPopup.classList.remove('active');
    });
}

// Listener para fechar o popup de coleção do amigo
if (closeFriendCollectionBtn) {
    closeFriendCollectionBtn.addEventListener('click', () => {
        playAudio(audioClick);
        friendCollectionPopup.classList.remove('active');
    });
}

// Listener para fechar o popup de seleção de amigo para troca
if (closeTradeFriendBtn) {
    closeTradeFriendBtn.addEventListener('click', () => {
        playAudio(audioClick);
        tradeFriendSelectionPopup.classList.remove('active');
    });
}

// Listener para fechar o popup de seleção de personagem para troca
if (closeTradeCharacterBtn) {
    closeTradeCharacterBtn.addEventListener('click', () => {
        playAudio(audioClick);
        tradeCharacterSelectionPopup.classList.remove('active');
    });
}

// =======================================================
// --- LÓGICA DE DESAFIOS (NOVO) ---
// =======================================================

// Carrega o Hub de Desafios
async function loadChallengeHub() {
    const user = auth.currentUser;
    if (!user) return;

    // Atualiza notificações ao entrar na tela
    checkChallengeNotifications();


    // 1. Carrega lista de amigos para desafiar
    challengeFriendsList.innerHTML = '<li>Carregando...</li>';
    const userDoc = await db.collection('usuarios').doc(user.uid).get();
    const friends = userDoc.data().friends || [];

    if (friends.length === 0) {
        challengeFriendsList.innerHTML = '<li>Adicione amigos para desafiar!</li>';
    } else {
        challengeFriendsList.innerHTML = '';
        // Carrega detalhes dos amigos
        const friendPromises = friends.map(uid => db.collection('usuarios').doc(uid).get());
        const friendDocs = await Promise.all(friendPromises);

        friendDocs.forEach(doc => {
            if (!doc.exists) return;
            const fData = doc.data();
            const li = document.createElement('li');
            li.innerHTML = `
                <div class="rank-info">
                    <img src="${fData.fotoURL || 'images/avatar-default.png'}" class="rank-avatar">
                    <span class="rank-name">${fData.nome}</span>
                </div>
                <button class="request-btn" style="background: #673AB7;" onclick="initiateChallenge('${doc.id}', '${fData.nome}')">Desafiar</button>
            `;
            challengeFriendsList.appendChild(li);
        });
    }

    // 2. Carrega Desafios Pendentes (Onde eu sou o alvo)
    pendingChallengesList.innerHTML = '<li>Carregando...</li>';
    try {
        const pendingQuery = await db.collection('desafios')
            .where('targetId', '==', user.uid)
            .where('status', '==', 'pending_target')
            .get();

        pendingChallengesList.innerHTML = '';
        if (pendingQuery.empty) {
            pendingChallengesList.innerHTML = '<li>Nenhum desafio pendente.</li>';
        } else {
            pendingQuery.forEach(doc => {
                const data = doc.data();
                const li = document.createElement('li');
                li.innerHTML = `
                    <div class="challenge-item">
                        <span>Desafio de <strong>${data.challengerName}</strong></span>
                        <span class="challenge-status" style="background: #FFC107; color: #333;">Aguardando você</span>
                    </div>
                    <button class="request-btn" style="background: #4CAF50;" onclick="acceptChallenge('${doc.id}')">Jogar</button>
                `;
                pendingChallengesList.appendChild(li);
            });
        }
    } catch (error) {
        console.error("Erro ao carregar desafios pendentes:", error);
        pendingChallengesList.innerHTML = '<li>Erro de permissão ou conexão.</li>';
    }

    // 3. Carrega Resultados (Últimos 10)
    resultsChallengesList.innerHTML = '<li>Carregando...</li>';
    
    try {
        // Busca um histórico maior (ex: 50 de cada) para permitir paginação local
        const q1 = db.collection('desafios').where('challengerId', '==', user.uid).where('status', '==', 'completed').orderBy('timestamp', 'desc').limit(50).get();
        const q2 = db.collection('desafios').where('targetId', '==', user.uid).where('status', '==', 'completed').orderBy('timestamp', 'desc').limit(50).get();

        const [s1, s2] = await Promise.all([q1, q2]);
        
        // Mescla os resultados
        let results = [];
        s1.forEach(doc => results.push({ id: doc.id, ...doc.data() }));
        s2.forEach(doc => results.push({ id: doc.id, ...doc.data() }));
        
        // Ordena por data (mais recente primeiro)
        results.sort((a, b) => {
            const tA = a.timestamp ? a.timestamp.toMillis() : 0;
            const tB = b.timestamp ? b.timestamp.toMillis() : 0;
            return tB - tA;
        });
        
        allChallengeResults = results;
        currentResultsPage = 1; // Reseta para a primeira página

        if (allChallengeResults.length === 0) {
            resultsChallengesList.innerHTML = '<li>Nenhum resultado recente.</li>';
            localStorage.setItem('seenResultsCount', '0');
            updatePaginationControls(); // Esconde controles se existirem
        } else {
            // Atualiza o contador de vistos se a aba estiver ativa
            if (document.querySelector('.tab-button[data-tab="resultados"]').classList.contains('active')) {
                markResultsAsSeen(allChallengeResults.length);
            }
            
            // Renderiza a primeira página
            renderChallengeResults();
        }
    } catch (error) {
        console.error("Erro ao carregar resultados:", error);
        // Fallback caso falte índice composto para orderBy
        if (error.code === 'failed-precondition') {
             console.warn("Tentando fallback sem ordenação no banco...");
             try {
                const fq1 = db.collection('desafios').where('challengerId', '==', user.uid).where('status', '==', 'completed').limit(20).get();
                const fq2 = db.collection('desafios').where('targetId', '==', user.uid).where('status', '==', 'completed').limit(20).get();
                const [fs1, fs2] = await Promise.all([fq1, fq2]);
                let fResults = [];
                fs1.forEach(doc => fResults.push({ id: doc.id, ...doc.data() }));
                fs2.forEach(doc => fResults.push({ id: doc.id, ...doc.data() }));
                fResults.sort((a, b) => (b.timestamp?.toMillis() || 0) - (a.timestamp?.toMillis() || 0));
                allChallengeResults = fResults;
                currentResultsPage = 1;
                renderChallengeResults();
             } catch (e) {
                 resultsChallengesList.innerHTML = '<li>Erro ao carregar resultados.</li>';
             }
        } else {
            resultsChallengesList.innerHTML = '<li>Erro de permissão ou conexão.</li>';
        }
    }
}

// Função para renderizar a página atual de resultados
function renderChallengeResults() {
    resultsChallengesList.innerHTML = '';
    const user = auth.currentUser;

    const start = (currentResultsPage - 1) * RESULTS_PER_PAGE;
    const end = start + RESULTS_PER_PAGE;
    const pageResults = allChallengeResults.slice(start, end);

    if (pageResults.length === 0 && currentResultsPage > 1) {
        currentResultsPage--;
        renderChallengeResults();
        return;
    }

    pageResults.forEach(data => {
        const iAmChallenger = data.challengerId === user.uid;
        const myScore = iAmChallenger ? data.challengerScore : data.targetScore;
        const opponentScore = iAmChallenger ? data.targetScore : data.challengerScore;
        const opponentName = iAmChallenger ? data.targetName : data.challengerName;
        
        let resultText = "";
        let color = "";
        
        if (data.winnerId === user.uid) {
            resultText = "VITÓRIA";
            color = "#4CAF50";
        } else if (data.winnerId === 'draw') {
            resultText = "EMPATE";
            color = "#9E9E9E";
        } else {
            resultText = "DERROTA";
            color = "#F44336";
        }

        const li = document.createElement('li');
        li.innerHTML = `
            <div class="challenge-item" style="width: 100%;">
                <div style="display:flex; justify-content:space-between; width:100%;">
                    <span>vs <strong>${opponentName}</strong></span>
                    <span class="challenge-status" style="background: ${color}; color: white;">${resultText}</span>
                </div>
                <span style="font-size: 0.85rem;">Placar: ${myScore} x ${opponentScore}</span>
                ${data.stolenCharacterName ? `<span style="font-size: 0.8rem; color: ${color};">Roubado: ${data.stolenCharacterName}</span>` : ''}
            </div>
        `;
        resultsChallengesList.appendChild(li);
    });

    updatePaginationControls();
}

// Atualiza (ou cria) os controles de paginação
function updatePaginationControls() {
    let controls = document.getElementById('challenge-pagination');
    
    // Cria o container se não existir
    if (!controls) {
        controls = document.createElement('div');
        controls.id = 'challenge-pagination';
        controls.className = 'pagination-controls';
        // Insere logo após a lista de resultados
        resultsChallengesList.parentNode.insertBefore(controls, resultsChallengesList.nextSibling);
    }

    const totalPages = Math.ceil(allChallengeResults.length / RESULTS_PER_PAGE);

    // Se não houver páginas suficientes, esconde
    if (totalPages <= 1) {
        controls.style.display = 'none';
        return;
    }

    controls.style.display = 'flex';
    controls.innerHTML = `
        <button class="pagination-btn" onclick="changeResultsPage(-1)" ${currentResultsPage === 1 ? 'disabled' : ''}>&lt;</button>
        <span class="pagination-info">${currentResultsPage} / ${totalPages}</span>
        <button class="pagination-btn" onclick="changeResultsPage(1)" ${currentResultsPage === totalPages ? 'disabled' : ''}>&gt;</button>
    `;
}

// Função global para mudar de página
window.changeResultsPage = (delta) => {
    playAudio(audioClick);
    const totalPages = Math.ceil(allChallengeResults.length / RESULTS_PER_PAGE);
    const newPage = currentResultsPage + delta;

    if (newPage >= 1 && newPage <= totalPages) {
        currentResultsPage = newPage;
        renderChallengeResults();
    }
};

// Iniciar criação de desafio (Challenger)
window.initiateChallenge = (friendId, friendName) => {
    const msg = `Deseja desafiar ${friendName}? Você responderá 10 perguntas agora.`;
    showConfirmPopup(msg, async () => {
        // 1. Busca 10 perguntas aleatórias
        const randomId = db.collection('__').doc().id;
        const snapshot = await db.collection('perguntas_publicadas')
            .where(firebase.firestore.FieldPath.documentId(), '>=', randomId)
            .limit(10)
            .get();

        // Fallback se tiver poucas perguntas
        let docs = snapshot.docs;
        if (docs.length < 10) {
            const extra = await db.collection('perguntas_publicadas').limit(10).get();
            docs = extra.docs;
        }

        challengeQuestions = docs.map(d => ({ id: d.id, ...d.data() }));

        // 2. Configura estado do jogo
        challengeData = {
            isCreator: true,
            targetId: friendId,
            targetName: friendName,
            currentScore: 0
        };
        challengeIndex = 0;

        // 3. Inicia Jogo
        startGame('desafio');
    }, "Confirmar Desafio");
};

// Aceitar desafio (Target)
window.acceptChallenge = async (challengeId) => {
    try {
        const doc = await db.collection('desafios').doc(challengeId).get();
        if (!doc.exists) return;
        const data = doc.data();

        // 1. Carrega as perguntas do desafio
        // Precisamos buscar os dados das perguntas pelos IDs salvos
        const questionPromises = data.questions.map(qid => db.collection('perguntas_publicadas').doc(qid).get());
        const questionDocs = await Promise.all(questionPromises);
        
        challengeQuestions = questionDocs.map(d => ({ id: d.id, ...d.data() }));

        // 2. Configura estado
        challengeData = {
            isCreator: false,
            challengeId: challengeId,
            challengerId: data.challengerId,
            challengerScore: data.challengerScore,
            currentScore: 0
        };
        challengeIndex = 0;

        // 3. Inicia Jogo
        startGame('desafio');
    } catch (error) {
        console.error("Erro ao aceitar desafio:", error);
        showPopupMessage("Erro ao carregar o desafio. Verifique sua conexão ou permissões.", "Erro");
    }
};

// Finalizar rodada de desafio
async function finishChallengeRound() {
    if (isProcessingChallenge) return; // Evita duplo clique
    isProcessingChallenge = true;

    const user = auth.currentUser;
    
    try {
        if (challengeData.isCreator) {
            // CRIADOR TERMINOU: Salva o desafio no banco
            try {
                await db.collection('desafios').add({
                    challengerId: user.uid,
                    challengerName: user.displayName,
                    targetId: challengeData.targetId,
                    targetName: challengeData.targetName,
                    questions: challengeQuestions.map(q => q.id),
                    challengerScore: challengeData.currentScore,
                    status: 'pending_target',
                    timestamp: firebase.firestore.FieldValue.serverTimestamp()
                });
                showPopupMessage(`Desafio enviado! Você fez ${challengeData.currentScore}/10. Aguarde seu amigo responder.`, "Desafio Enviado");
            } catch (e) {
                console.error(e);
                showPopupMessage("Erro ao enviar desafio.", "Erro");
            }
        } else {
            // ALVO TERMINOU: Calcula resultado e processa roubo
            await processChallengeResult(user);
            
            // Atualiza notificações após terminar
            checkChallengeNotifications();
        }
    } finally {
        isProcessingChallenge = false;
        showScreen('home-screen');
    }
}

// Processar Resultado e Roubo (Lógica Complexa)
async function processChallengeResult(currentUser) {
    const challengeRef = db.collection('desafios').doc(challengeData.challengeId);
    const targetScore = challengeData.currentScore;
    const challengerScore = challengeData.challengerScore;
    
    let winnerId = null;
    let loserId = null;
    let stolenCharacter = null;
    let stolenCharacterName = null;

    if (targetScore > challengerScore) {
        winnerId = currentUser.uid; // Eu ganhei
        loserId = challengeData.challengerId;
    } else if (challengerScore > targetScore) {
        winnerId = challengeData.challengerId; // Oponente ganhou
        loserId = currentUser.uid;
    } else {
        winnerId = 'draw';
    }

    try {
        await db.runTransaction(async (transaction) => {
            // --- PROTEÇÃO CONTRA DUPLA EXECUÇÃO ---
            const currentDoc = await transaction.get(challengeRef);
            if (!currentDoc.exists) throw "Desafio não encontrado.";
            if (currentDoc.data().status === 'completed') {
                throw "ALREADY_COMPLETED";
            }
            // --------------------------------------

            // Se houve vencedor, tenta roubar e dar pontos
            if (winnerId !== 'draw') {
                const loserRef = db.collection('usuarios').doc(loserId);
                const winnerRef = db.collection('usuarios').doc(winnerId);
                
                const loserDoc = await transaction.get(loserRef);
                const winnerDoc = await transaction.get(winnerRef);
                
                const loserData = loserDoc.data();
                const winnerData = winnerDoc.data();

                // --- NOVO: Adiciona pontos ao vencedor ---
                const pointsToAdd = (winnerId === currentUser.uid) ? targetScore : challengerScore;
                const currentPoints = winnerData.pontosTotais || 0;
                const newPoints = currentPoints + pointsToAdd;
                
                // --- MOEDAS DO VENCEDOR ---
                const coinsReward = 20;
                const currentCoins = winnerData.moedas || 0;

                // Verifica Level Up do Vencedor (apenas para log/notificação se fosse em tempo real)
                // Como isso roda numa transação, não atualizamos a UI do vencedor imediatamente se ele não for o usuário atual
                // Mas se o vencedor for o usuário atual, a UI será atualizada ao recarregar ou via listener
                const oldLevel = calculateUserLevel(currentPoints);
                const newLevel = calculateUserLevel(newPoints);
                const leveledUp = newLevel > oldLevel;

                // Objeto de atualização do vencedor (começa com os pontos)
                let winnerUpdateData = {
                    pontosTotais: newPoints,
                    moedas: currentCoins + coinsReward
                };

                const loserUsername = loserData.username || loserData.nome || "Alguém";
                const winnerUsername = winnerData.username || winnerData.nome || "Alguém";

                const loserChars = loserData.personagensConquistados || [];
                const winnerChars = winnerData.personagensConquistados || [];

                if (loserChars.length > 0) {
                    // Tenta achar um que o vencedor não tenha
                    let candidates = loserChars.filter(c => !winnerChars.includes(c));
                    
                    // Só rouba se houver algum personagem que o vencedor NÃO tenha
                    if (candidates.length > 0) {
                        const charToStealId = candidates[Math.floor(Math.random() * candidates.length)];
                        
                        // Busca nome do personagem para o log
                        const charObj = PERSONAGENS.find(p => p.id === charToStealId);
                        stolenCharacterName = charObj ? charObj.nome : charToStealId;

                        // Executa o roubo (Atualiza Perdedor com metadados)
                        transaction.set(loserRef, {
                            personagensConquistados: firebase.firestore.FieldValue.arrayRemove(charToStealId),
                            personagensMetadata: {
                                [charToStealId]: { stolenBy: winnerUsername }
                            }
                        }, { merge: true });

                        // Adiciona dados do roubo ao objeto de atualização do vencedor
                        winnerUpdateData.personagensConquistados = firebase.firestore.FieldValue.arrayUnion(charToStealId);
                        winnerUpdateData.personagensMetadata = {
                            [charToStealId]: { stolenFrom: loserUsername }
                        };
                        
                        stolenCharacter = charToStealId;
                    }
                }

                // Executa a atualização do vencedor (Pontos + Possível Roubo)
                transaction.set(winnerRef, winnerUpdateData, { merge: true });
            }

            // Atualiza o desafio
            transaction.update(challengeRef, {
                targetScore: targetScore,
                status: 'completed',
                winnerId: winnerId,
                stolenCharacter: stolenCharacter,
                stolenCharacterName: stolenCharacterName
            });
        });

        let msg = `Desafio finalizado!\nVocê: ${targetScore}\nOponente: ${challengerScore}\n`;
        if (winnerId === currentUser.uid) {
            msg += `VOCÊ VENCEU! 🏆 (+${targetScore} pts | +20 💰)`;
            // Recalcula nível localmente para feedback imediato
            const newLvl = calculateUserLevel((currentUser.pontosTotais || 0) + targetScore); // Aproximação
            // (Idealmente leríamos do banco atualizado, mas o listener global cuidaria disso se tivéssemos um)
            if (stolenCharacterName) msg += `\nVocê roubou: ${stolenCharacterName}!`;
        } else if (winnerId === 'draw') {
            msg += "EMPATE! Ninguém perdeu nada.";
        } else {
            msg += "VOCÊ PERDEU! 😢";
            if (stolenCharacterName) msg += `\nSeu personagem ${stolenCharacterName} foi roubado.`;
        }
        showPopupMessage(msg, "Resultado do Desafio");

    } catch (e) {
        if (e === "ALREADY_COMPLETED") {
            console.warn("Tentativa de processar desafio já completado.");
            return;
        }
        console.error("Erro na transação do desafio:", e);
        showPopupMessage("Erro ao processar resultado do desafio.", "Erro");
    }
}

/**
 * Verifica notificações de desafios (Pendentes e Novos Resultados)
 */
async function checkChallengeNotifications() {
    const user = auth.currentUser;
    if (!user) return;

    try {
        // 1. Desafios Pendentes (Onde sou o alvo)
        const pendingQuery = await db.collection('desafios')
            .where('targetId', '==', user.uid)
            .where('status', '==', 'pending_target')
            .get();
        
        const pendingCount = pendingQuery.size;
        if (pendingBadge) pendingBadge.style.display = pendingCount > 0 ? 'block' : 'none';

        // 2. Novos Resultados
        // Conta quantos desafios completados eu tenho
        const q1 = db.collection('desafios').where('challengerId', '==', user.uid).where('status', '==', 'completed').get();
        const q2 = db.collection('desafios').where('targetId', '==', user.uid).where('status', '==', 'completed').get();

        const [s1, s2] = await Promise.all([q1, q2]);
        const totalResults = s1.size + s2.size;

        // Compara com o que já vimos
        const seenCount = parseInt(localStorage.getItem('seenResultsCount') || '0');
        const hasNewResults = totalResults > seenCount;

        if (resultsBadge) resultsBadge.style.display = hasNewResults ? 'block' : 'none';

        // 3. Badge Principal (Botão da Home)
        if (challengeBadge) {
            challengeBadge.style.display = (pendingCount > 0 || hasNewResults) ? 'block' : 'none';
        }

        // Salva o total atual em uma variável global ou atributo para usar no markResultsAsSeen
        window.currentTotalResults = totalResults;

    } catch (error) {
        console.error("Erro ao verificar notificações de desafio:", error);
    }
}

/**
 * Marca os resultados como vistos
 */
function markResultsAsSeen(count) {
    // Se passou um count, usa ele, senão usa o global calculado
    const total = count !== undefined ? count : (window.currentTotalResults || 0);
    
    localStorage.setItem('seenResultsCount', total.toString());
    
    if (resultsBadge) resultsBadge.style.display = 'none';
    
    // Atualiza o badge principal também (pode ainda ter pendentes)
    const pendingVisible = pendingBadge && pendingBadge.style.display === 'block';
    if (challengeBadge) {
        challengeBadge.style.display = pendingVisible ? 'block' : 'none';
    }
}

/**
 * Carrega e exibe a coleção de personagens AGRUPADOS por categoria
 */
async function loadCollection() {
    console.log("Carregando coleção...");
    collectionGrid.innerHTML = 'Carregando...';

    const user = auth.currentUser;
    if (!user) return;

    const userDoc = await db.collection('usuarios').doc(user.uid).get();
    if (!userDoc.exists) return;

    const unlockedIds = new Set(userDoc.data().personagensConquistados || []);
    const meta = userDoc.data().personagensMetadata || {}; // Carrega metadados de roubo
    collectionGrid.innerHTML = '';

    // Mapeamento das categorias (para garantir a ordem)
    const categoriesOrder = ["Papas", "Títulos Marianos", "Figuras Modernas", "Santos"];

    // Agrupa todos os personagens da lista mestra pelas novas categorias
    const groupedCharacters = categoriesOrder.reduce((acc, categoryName) => {
        acc[categoryName] = PERSONAGENS.filter(p => p.categoria === categoryName);
        return acc;
    }, {});

    // Itera pelas categorias na ordem definida
    for (const categoryName of categoriesOrder) {
        const characters = groupedCharacters[categoryName];
        if (characters.length === 0) continue;

        // 1. Cria o Título da Categoria
        const categoryTitle = document.createElement('h3');
        categoryTitle.textContent = categoryName.toUpperCase();
        categoryTitle.classList.add('collection-category-title');
        collectionGrid.appendChild(categoryTitle);

        // 2. Cria o Container de Cards
        const cardContainer = document.createElement('div');
        cardContainer.classList.add('collection-category-container'); // Novo container flex/grid

        characters.forEach(personagem => {
            const isUnlocked = unlockedIds.has(personagem.id);

            const card = document.createElement('div');
            card.classList.add('character-card');
            card.setAttribute('data-id', personagem.id); // Adiciona ID para o clique

            if (!isUnlocked) {
                card.classList.add('locked');
            } else {
                // Adiciona o listener de clique apenas para cards desbloqueados
                card.addEventListener('click', () => showCharacterDetail(personagem.id));
            }

            // Cria o HTML do Card
            //<p>${isUnlocked ? personagem.nome : '???'}</p>
            
            // Verifica se o personagem tem um link externo (imagemUrl) ou usa o local
            const imgSrc = personagem.imagemUrl || `images/personagens/${personagem.id}.png`;

            // Verifica metadados para legenda de roubo
            const metadata = meta[personagem.id];
            let captionHtml = '';
            if (isUnlocked && metadata && metadata.stolenFrom) {
                captionHtml = `<span class="char-caption stolen-from">Roubado de @${metadata.stolenFrom}</span>`;
            } else if (!isUnlocked && metadata && metadata.stolenBy) {
                captionHtml = `<span class="char-caption stolen-by">Roubado por @${metadata.stolenBy}</span>`;
            } else if (!isUnlocked && metadata && metadata.tradedTo) {
                captionHtml = `<span class="char-caption traded-to" style="color: #FF5722; font-size: 0.65rem;">Trocado com @${metadata.tradedTo} por "${metadata.tradedFor}"</span>`;
            } else if (isUnlocked && metadata && metadata.tradedWith) {
                // Legenda de Troca
                captionHtml = `<span class="char-caption traded-with" style="color: #FF9800; font-size: 0.65rem;">Trocado com @${metadata.tradedWith} por "${metadata.tradedFor}"</span>`;
            }

            card.innerHTML = `
                <img src="${imgSrc}" alt="${personagem.nome}" onerror="this.src='images/avatar-default.png'">
                <p>${personagem.nome}</p>
                ${captionHtml}
            `;

            cardContainer.appendChild(card);
        });

        collectionGrid.appendChild(cardContainer);
    }
}


/**
 * Carrega e exibe o ranking (Top 10 + Posição do Usuário)
 */
async function loadRanking(type = 'global') {
    console.log(`Carregando ranking ${type}...`);
    rankingList.innerHTML = '<li>Carregando...</li>';
    userRankingDisplay.innerHTML = 'Carregando sua posição...';
    
    const titleEl = document.querySelector('#ranking-screen h2');

    // 1. Pega os dados do usuário atual
    const user = auth.currentUser;
    if (!user) return;

    // Pega os dados mais recentes do usuário (score e nome)
    const userDoc = await db.collection('usuarios').doc(user.uid).get();
    if (!userDoc.exists) return;

    const userData = userDoc.data();
    const userScore = userData.pontosTotais || 0;
    const userName = userData.nome || "Você";
    const userPhotoURL = userData.fotoURL || 'images/avatar-default.png';
    const userWeeklyScore = userData.pontosSemanais || 0;

    // 2. BUSCA O TOP 10
    let top10Query;
    
    if (type === 'weekly') {
        titleEl.textContent = "Ranking Semanal";
        const currentWeekKey = getCurrentWeekKey();
        // Filtra apenas quem jogou nesta semana (lastWeekKey == atual)
        // Requer índice composto: lastWeekKey ASC, pontosSemanais DESC
        top10Query = db.collection('usuarios')
            .where('lastWeekKey', '==', currentWeekKey)
            .orderBy("pontosSemanais", "desc")
            .limit(10);
    } else {
        titleEl.textContent = "Ranking Global";
        top10Query = db.collection('usuarios')
            .orderBy("pontosTotais", "desc")
            .limit(10);
    }

    // Tratamento de erro para falta de índice
    let top10Snapshot;
    try {
        top10Snapshot = await top10Query.get();
    } catch (error) {
        console.error("Erro no ranking:", error);
        rankingList.innerHTML = '<li style="color:red; font-size:0.8rem;">Erro: Índice do Firebase necessário. Verifique o console.</li>';
        return;
    }

    rankingList.innerHTML = '';
    let rank = 1;
    let userIsInTop10 = false;

    top10Snapshot.forEach(doc => {
        const data = doc.data();

        const li = document.createElement('li');

        // Verifica se o usuário atual está no Top 10
        li.style.cursor = 'pointer'; // Indica que é clicável
        li.onclick = () => showUserProfile(doc.id); // Abre perfil ao clicar
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

/**
 * FUNÇÃO CORE: Exibe o popup de escolha de categoria
 */
function showCategoryChoicePopup() {
    // Garante que os botões estejam habilitados ao abrir (corrige bug de botões travados)
    if (choiceButtonsGrid) {
        choiceButtonsGrid.querySelectorAll('.choice-button').forEach(btn => btn.disabled = false);
    }
    categoryChoicePopup.classList.add('active');
}

/**
 * Listener para os botões de escolha (SANTOS, PAPAS, etc.)
 */
choiceButtonsGrid.querySelectorAll('.choice-button').forEach(button => {
    button.addEventListener('click', () => {
        playAudio(audioClick);
        if (!isRewardChoicePending) return;

        const chosenCategory = button.dataset.category;

        // Desativa todos os botões para evitar clique duplo
        choiceButtonsGrid.querySelectorAll('.choice-button').forEach(btn => btn.disabled = true);

        // Inicia o desbloqueio
        processCategoryChoice(chosenCategory);
    });
});


/**
 * FUNÇÃO CORE: Executa o desbloqueio aleatório na categoria escolhida
 */
async function processCategoryChoice(category) {
    categoryChoicePopup.classList.remove('active'); // Esconde o popup de escolha

    // 1. Pega a lista de IDs desbloqueados e a lista mestra
    const user = auth.currentUser;
    const userRef = db.collection('usuarios').doc(user.uid); // Define a referência aqui para usar no fallback
    const userDoc = await db.collection('usuarios').doc(user.uid).get();
    const unlockedIds = new Set(userDoc.data().personagensConquistados || []);

    // 2. Filtra personagens disponíveis na categoria ESCOLHIDA
    const availableCharacters = PERSONAGENS.filter(p =>
        p.categoria === category && !unlockedIds.has(p.id)
    );

    if (availableCharacters.length === 0) {
        showPopupMessage(`Você já desbloqueou todos os personagens da categoria ${category}! Ganhando um prêmio aleatório...`, "Categoria Completa", () => {
            if (currentMode === 'tempo') {
                showScreen('home-screen');
            } else {
                showScreen('roulette-screen');
            }
        });

        // Fallback: Tenta desbloquear em outra categoria ou dá pontos extra
        // Por simplicidade, daremos pontos e voltamos:
        userRef.update({ pontosTotais: firebase.firestore.FieldValue.increment(50) });
        isRewardChoicePending = false;

        // Reabilita os botões antes de sair (Correção importante)
        choiceButtonsGrid.querySelectorAll('.choice-button').forEach(btn => btn.disabled = false);
        
        return;
    }

    // 3. Sorteia um novo personagem (e pega os dados completos)
    const randomIndex = Math.floor(Math.random() * availableCharacters.length);
    const unlockedCharacterData = availableCharacters[randomIndex];

    // 4. Salva o novo personagem no Firestore
    await userRef.update({
        personagensConquistados: firebase.firestore.FieldValue.arrayUnion(unlockedCharacterData.id)
    });

    // 5. Mostra o Popup de Sucesso
    // Usa link externo se existir, senão usa local
    unlockedCharacterImg.onerror = () => { unlockedCharacterImg.src = 'images/avatar-default.png'; };
    unlockedCharacterImg.src = unlockedCharacterData.imagemUrl || `images/personagens/${unlockedCharacterData.id}.png`;
    unlockedCharacterName.textContent = unlockedCharacterData.nome;
    characterUnlockedPopup.classList.add('active');

    // Reseta o estado
    isRewardChoicePending = false;

    // Reabilita os botões de escolha
    choiceButtonsGrid.querySelectorAll('.choice-button').forEach(btn => btn.disabled = false);
}

/**
 * Exibe o popup detalhado do personagem clicado
 */
function showCharacterDetail(characterId) {
    const characterData = PERSONAGENS.find(p => p.id === characterId);
    if (!characterData) return;

    // Preenche o popup de detalhe
    document.getElementById('detail-category').textContent = characterData.categoria;
    
    // Usa link externo se existir, senão usa local
    const detailImg = document.getElementById('detail-img');
    detailImg.onerror = () => { detailImg.src = 'images/avatar-default.png'; };
    detailImg.src = characterData.imagemUrl || `images/personagens/${characterId}.png`;
    document.getElementById('detail-name').textContent = characterData.nome;
    document.getElementById('detail-history').textContent = characterData.historia;

    // Configura botão de troca
    if (tradeCharBtn) {
        tradeCharBtn.style.display = 'block';
        tradeCharBtn.onclick = () => {
            playAudio(audioClick);
            characterDetailPopup.classList.remove('active');
            // Inicia o fluxo de troca
            if (typeof initiateTradeFlow === 'function') initiateTradeFlow(characterId);
        };
    }

    // Exibe o popup
    characterDetailPopup.classList.add('active');
}

// Listener para fechar o popup de detalhe
detailCloseBtn.addEventListener('click', () => {
    playAudio(audioClick);
    characterDetailPopup.classList.remove('active');
});
/*
const buttonTheme = document.querySelectorAll('.button-theme');
buttonTheme.forEach(button => {
    button.addEventListener('click', () => {
        playAudio(audioClick);
        const styleId = document.getElementById('style-id');
        if (button.textContent === "Modern") {
            styleId.href = "styleModern.css";
        } else if (button.textContent === "Sacro") {
            styleId.href = "stylesSACRO.css";
        } else if (button.textContent === "Clear") {
            styleId.href = "styleCLEAR.css";
        }
    });
}); */

// --- LÓGICA DE INSTALAÇÃO PWA (INSTALAR APP) ---

let deferredPrompt; // Variável global para guardar o evento

// 1. Pega a referência do novo botão
const installButton = document.getElementById('install-pwa-btn');

// 2. Ouve o evento do navegador que "oferece" a instalação
window.addEventListener('beforeinstallprompt', (e) => {
    // Previne o mini-infobar padrão do Chrome
    e.preventDefault();
    
    // Guarda o evento para que possa ser disparado mais tarde
    deferredPrompt = e;
    
    // Mostra o nosso botão de instalação personalizado
    if (installButton) {
        installButton.hidden = false;
        console.log("PWA: Evento de instalação capturado, botão mostrado.");
    }
});

// 3. Ouve o clique no NOSSO botão
if (installButton) {
    installButton.addEventListener('click', async () => {
        // Se o evento não foi capturado, não faz nada
        if (!deferredPrompt) {
            console.log("PWA: O evento de instalação não foi capturado.");
            showPopupMessage("Desculpe, a instalação não está disponível no momento. O app já pode estar instalado.", "Instalação");
            return;
        }

        // Mostra o prompt de instalação do sistema operacional
        deferredPrompt.prompt();

        // Espera o usuário escolher (Aceitar ou Rejeitar)
        const { outcome } = await deferredPrompt.userChoice;
        console.log(`PWA: Usuário escolheu: ${outcome}`);

        // Limpa o evento. Ele só pode ser usado uma vez.
        deferredPrompt = null;
        
        // Esconde o botão após a escolha
        installButton.hidden = true;
    });
}

// 4. Ouve quando o app foi instalado com sucesso
window.addEventListener('appinstalled', () => {
    // Esconde o botão (caso ainda esteja visível) e limpa o prompt
    if (installButton) {
        installButton.hidden = true;
    }
    deferredPrompt = null;
    console.log('PWA: Aplicativo instalado com sucesso!');
});

// =======================================================
// --- LÓGICA DE REPORTAR PERGUNTA (NOVO) ---
// =======================================================

// 1. Clique no botão "Reportar" na tela de jogo
if (reportQuestionBtn) {
    reportQuestionBtn.addEventListener('click', () => {
        playAudio(audioClick);
        
        // PAUSA TUDO para o usuário ter tempo de reportar
        if (navigationTimeout) clearTimeout(navigationTimeout);
        if (nextQuestionTimer) clearInterval(nextQuestionTimer);
        if (gameTimer) clearInterval(gameTimer);
        
        // Abre o popup
        reportPopup.classList.add('active');
    });
}

// =======================================================
// --- LÓGICA DA LOJA (NOVO) ---
// =======================================================

function loadShop() {
    if (!shopItemsGrid) return;
    shopItemsGrid.innerHTML = '';
    
    // Atualiza saldo visual
    if (shopUserCoins) shopUserCoins.textContent = userCoins;

    SHOP_ITEMS.forEach(item => {
        const div = document.createElement('div');
        div.className = 'shop-item';
        
        // Verifica se pode comprar (apenas visualmente para desabilitar botão)
        const canAfford = userCoins >= item.price;
        
        div.innerHTML = `
            <div class="shop-item-icon">${item.icon}</div>
            <div class="shop-item-name">${item.name}</div>
            <div class="shop-item-desc">${item.desc}</div>
            <button class="shop-buy-btn" onclick="buyItem('${item.id}')" ${!canAfford ? 'disabled' : ''}>
                ${item.price} 💰 Comprar
            </button>
        `;
        shopItemsGrid.appendChild(div);
    });
}

window.buyItem = async (itemId) => {
    const item = SHOP_ITEMS.find(i => i.id === itemId);
    if (!item) return;

    const user = auth.currentUser;
    if (!user) return;

    // 1. Verificações Locais
    if (userCoins < item.price) {
        showPopupMessage("Você não tem moedas suficientes!", "Saldo Insuficiente");
        return;
    }

    if (item.type === 'life') {
        if (userLives >= ABSOLUTE_MAX_LIVES) {
            showPopupMessage(`Limite de ${ABSOLUTE_MAX_LIVES} vidas atingido!`, "Limite Máximo");
            return;
        }
    } else if (item.type === 'life_full') {
        if (userLives >= MAX_LIVES) {
            showPopupMessage("Suas vidas regeneráveis já estão cheias!", "Vidas Cheias");
            return;
        }
    }

    playAudio(audioClick);

    // 2. Processa a Compra
    try {
        // Desconta moedas localmente (feedback imediato)
        userCoins -= item.price;
        document.getElementById('user-coins').textContent = userCoins;
        if (shopUserCoins) shopUserCoins.textContent = userCoins;

        // Aplica o efeito do item
        let updateData = { moedas: userCoins };
        let successMsg = "";

        if (item.type === 'life') {
            userLives++;
            // Remove o último timer (o mais distante) pois recuperamos uma vida
            userRegenTimers.pop(); 
            updateData.lives = userLives;
            updateData.regenTimers = userRegenTimers;
            successMsg = "Vida recuperada com sucesso!";
        } 
        else if (item.type === 'life_full') {
            userLives = MAX_LIVES;
            userRegenTimers = []; // Limpa todos os timers
            updateData.lives = userLives;
            updateData.regenTimers = userRegenTimers;
            successMsg = "Todas as vidas recuperadas!";
        } 
        else if (item.type === 'infinite_lives') {
            const durationMs = item.amount * 60 * 1000;
            const now = Date.now();
            
            // Se já tiver energia infinita ativa, soma ao tempo restante
            let newExpiry = now + durationMs;
            if (userInfiniteLivesUntil && userInfiniteLivesUntil > now) {
                newExpiry = userInfiniteLivesUntil + durationMs;
            }
            
            userInfiniteLivesUntil = newExpiry;
            updateData.infiniteLivesUntil = firebase.firestore.Timestamp.fromMillis(userInfiniteLivesUntil);
            
            successMsg = `Energia Infinita ativada por ${item.amount} minutos!`;
        }
        else if (item.type === 'powerup') {
            // Incrementa o powerup localmente (se tivéssemos persistência no banco para powerups, seria aqui)
            // Nota: No código atual, 'powerups' é resetado a cada jogo (startGame).
            // Para persistir compras, precisamos adicionar campos no Firestore (ex: inventory.skip).
            // VOU ADICIONAR ESSA LÓGICA DE PERSISTÊNCIA AGORA:
            
            // Como powerups são resetados no startGame atualmente, vamos mudar a lógica:
            // Vamos salvar no banco em um campo 'inventory'.
            // E no startGame, vamos carregar do inventory em vez de resetar para 2.
            
            // Para simplificar neste passo sem refatorar todo o jogo:
            // Vamos assumir que powerups comprados duram para a PRÓXIMA partida e são salvos no banco.
            // Precisamos criar o campo se não existir.
            
            // Atualiza objeto local powerups (apenas visual se estivesse em jogo, mas estamos na loja)
            powerups[item.key] = (powerups[item.key] || 0) + item.amount;
            
            // Prepara update do banco (usando notação de ponto para map aninhado ou campos soltos)
            // Vamos usar campos soltos para facilitar: 'powerups_skip', 'powerups_fifty', etc.
            const fieldName = `powerups_${item.key}`;
            updateData[fieldName] = firebase.firestore.FieldValue.increment(item.amount);
            
            successMsg = `Você comprou: ${item.name}!`;
        } 
        else if (item.type === 'random_character') {
            // Busca dados atualizados para garantir que não pegue repetido
            const userDoc = await db.collection('usuarios').doc(user.uid).get();
            const currentOwned = userDoc.data().personagensConquistados || [];
            
            // Filtra personagens que o usuário NÃO tem
            const unowned = PERSONAGENS.filter(p => !currentOwned.includes(p.id));
            
            if (unowned.length === 0) {
                // Reembolsa se já tiver todos
                userCoins += item.price;
                document.getElementById('user-coins').textContent = userCoins;
                if (shopUserCoins) shopUserCoins.textContent = userCoins;
                
                showPopupMessage("Você já possui todos os personagens disponíveis!", "Coleção Completa");
                return; 
            }
            
            // Sorteia um
            const randomChar = unowned[Math.floor(Math.random() * unowned.length)];
            updateData.personagensConquistados = firebase.firestore.FieldValue.arrayUnion(randomChar.id);
            
            // Configura o popup de desbloqueio para aparecer depois
            unlockedCharacterImg.src = randomChar.imagemUrl || `images/personagens/${randomChar.id}.png`;
            unlockedCharacterName.textContent = randomChar.nome;
            setTimeout(() => { characterUnlockedPopup.classList.add('active'); playAudio(audioCorrect); }, 500);
            
            successMsg = null; // Anula mensagem genérica para usar o popup especial
        }

        // Salva no Firestore
        await db.collection('usuarios').doc(user.uid).update(updateData);
        
        updateLivesUI(); // Atualiza corações
        loadShop(); // Recarrega a loja para atualizar botões (disabled se sem saldo)
        showPopupMessage(successMsg, "Compra Realizada");
        
        if (successMsg) showPopupMessage(successMsg, "Compra Realizada");

    } catch (error) {
        console.error("Erro na compra:", error);
        
        // --- REEMBOLSO AUTOMÁTICO ---
        userCoins += item.price; // Devolve as moedas
        document.getElementById('user-coins').textContent = userCoins;
        if (shopUserCoins) shopUserCoins.textContent = userCoins;
        
        showPopupMessage("Ocorreu um erro ao processar sua compra.\nSuas moedas foram devolvidas.", "Erro e Reembolso");
    }
};

// =======================================================
// --- LÓGICA DE ANÚNCIOS RECOMPENSADOS (NOVO) ---
// =======================================================

let currentAdReward = null;

window.watchAd = (rewardType) => {
    currentAdReward = rewardType;
    
    if (rewardType === 'life' && userLives >= ABSOLUTE_MAX_LIVES) {
        showPopupMessage(`Limite de ${ABSOLUTE_MAX_LIVES} vidas atingido!`, "Limite Máximo");
        return;
    }

    // Abre o Overlay de Anúncio
    if (adOverlay) adOverlay.classList.add('active');
    if (closeAdBtn) closeAdBtn.style.display = 'none';
    if (adStatusText) adStatusText.textContent = "Reproduzindo vídeo promocional...";
    
    let timeLeft = 5; // Simula 5 segundos de anúncio
    if (adTimerDisplay) adTimerDisplay.textContent = timeLeft;
    
    const timer = setInterval(() => {
        timeLeft--;
        if (adTimerDisplay) adTimerDisplay.textContent = timeLeft;
        
        if (timeLeft <= 0) {
            clearInterval(timer);
            if (adStatusText) adStatusText.textContent = "Obrigado por assistir!";
            if (closeAdBtn) closeAdBtn.style.display = 'block';
        }
    }, 1000);
};

if (closeAdBtn) {
    closeAdBtn.addEventListener('click', async () => {
        playAudio(audioClick);
        if (adOverlay) adOverlay.classList.remove('active');
        
        const user = auth.currentUser;
        if (!user) return;

        if (currentAdReward === 'life') {
            // Ganha 1 vida
            userLives++;
            userRegenTimers.pop(); // Remove o timer mais distante
            updateLivesUI();
            await db.collection('usuarios').doc(user.uid).update({ lives: userLives, regenTimers: userRegenTimers });
            showPopupMessage("Você ganhou +1 Vida!", "Recompensa");
        } else if (currentAdReward === 'coins') {
            // Ganha 50 moedas
            userCoins += 50;
            document.getElementById('user-coins').textContent = userCoins;
            if (shopUserCoins) shopUserCoins.textContent = userCoins;
            await db.collection('usuarios').doc(user.uid).update({ moedas: userCoins });
            showPopupMessage("Você ganhou +50 Moedas!", "Recompensa");
        }
    });
}

// =======================================================
// --- LÓGICA DE TROCAS (NOVO) ---
// =======================================================

async function initiateTradeFlow(offeredCharId) {
    const user = auth.currentUser;
    if (!user) return;

    tradeFriendSelectionPopup.classList.add('active');
    tradeFriendList.innerHTML = '<li>Carregando amigos...</li>';

    try {
        // 1. Busca a lista de amigos do usuário
        const userDoc = await db.collection('usuarios').doc(user.uid).get();
        const friends = userDoc.data().friends || [];

        if (friends.length === 0) {
            tradeFriendList.innerHTML = '<li>Você precisa adicionar amigos primeiro!</li>';
            return;
        }

        // 2. Busca os dados de cada amigo para verificar a coleção
        const friendPromises = friends.map(uid => db.collection('usuarios').doc(uid).get());
        const friendDocs = await Promise.all(friendPromises);

        // 3. Filtra amigos que NÃO têm o personagem
        const eligibleFriends = friendDocs.filter(doc => {
            if (!doc.exists) return false;
            const data = doc.data();
            const friendCharacters = data.personagensConquistados || [];
            return !friendCharacters.includes(offeredCharId);
        });

        tradeFriendList.innerHTML = '';

        if (eligibleFriends.length === 0) {
            tradeFriendList.innerHTML = '<li>Todos os seus amigos já possuem este personagem!</li>';
            return;
        }

        // 4. Renderiza a lista
        eligibleFriends.forEach(doc => {
            const data = doc.data();
            const li = document.createElement('li');
            li.innerHTML = `
                <div class="rank-info">
                    <img src="${data.fotoURL || 'images/avatar-default.png'}" class="rank-avatar">
                    <span class="rank-name">${data.nome}</span>
                </div>
                <button class="request-btn" style="background: #FF9800;" onclick="showCharacterSelectionForTrade('${doc.id}', '${data.nome}', '${offeredCharId}')">Selecionar</button>
            `;
            tradeFriendList.appendChild(li);
        });

    } catch (error) {
        console.error("Erro ao carregar amigos para troca:", error);
        tradeFriendList.innerHTML = '<li>Erro ao carregar lista.</li>';
    }
}

// Mostra os personagens do amigo para escolher
async function showCharacterSelectionForTrade(friendId, friendName, offeredCharId) {
    if (tradeFriendSelectionPopup) tradeFriendSelectionPopup.classList.remove('active');

    if (!tradeCharacterSelectionPopup || !tradeCharacterGrid) {
        console.error("Erro: Elementos da interface de troca (popup ou grid) não encontrados no HTML.");
        return;
    }

    tradeCharacterSelectionPopup.classList.add('active');
    tradeCharacterGrid.innerHTML = '<p style="grid-column: 1/-1; text-align: center;">Carregando personagens...</p>';

    try {
        const user = auth.currentUser;
        const [friendDoc, currentUserDoc] = await Promise.all([
            db.collection('usuarios').doc(friendId).get(),
            db.collection('usuarios').doc(user.uid).get()
        ]);

        const friendChars = new Set(friendDoc.data().personagensConquistados || []);
        const myChars = new Set(currentUserDoc.data().personagensConquistados || []);

        const eligibleChars = PERSONAGENS.filter(p => friendChars.has(p.id) && !myChars.has(p.id));

        tradeCharacterGrid.innerHTML = '';
        if (eligibleChars.length === 0) {
            tradeCharacterGrid.innerHTML = '<p>Seu amigo não possui personagens que você não tenha.</p>';
            return;
        }

        eligibleChars.forEach(char => {
            const card = document.createElement('div');
            card.className = 'character-card';
            card.style.cursor = 'pointer';
            card.onclick = () => sendTradeRequest(friendId, friendName, offeredCharId, char.id);
            card.innerHTML = `
                <img src="${char.imagemUrl || `images/personagens/${char.id}.png`}" alt="${char.nome}" onerror="this.src='images/avatar-default.png'">
                <p style="font-size: 0.7rem;">${char.nome}</p>
            `;
            tradeCharacterGrid.appendChild(card);
        });

    } catch (error) {
        console.error("Erro ao carregar personagens do amigo:", error);
        tradeCharacterGrid.innerHTML = '<p>Erro ao carregar.</p>';
    }
}

// Envia a solicitação de troca com ambos os personagens
window.sendTradeRequest = (friendId, friendName, offeredCharId, requestedCharId) => {
    const user = auth.currentUser;
    if (!user) return;

    const offeredChar = PERSONAGENS.find(p => p.id === offeredCharId);
    const requestedChar = PERSONAGENS.find(p => p.id === requestedCharId);

    if (!offeredChar || !requestedChar) {
        showPopupMessage("Erro: Informações de troca inválidas.", "Erro");
        return;
    }

    const msg = `Confirmar troca?\n\nVocê oferece: ${offeredChar.nome}\nVocê pede: ${requestedChar.nome}\n\nEnviar para ${friendName}?`;

    showConfirmPopup(msg, async () => {
        try {
            await db.collection('solicitacoes_troca').add({
                senderId: user.uid,
                senderName: user.displayName,
                receiverId: friendId,
                receiverName: friendName,
                offeredCharId: offeredCharId,
                requestedCharId: requestedCharId,
                status: 'pending',
                timestamp: firebase.firestore.FieldValue.serverTimestamp()
            });

            showPopupMessage("Solicitação de troca enviada com sucesso!", "Sucesso");
            tradeFriendSelectionPopup.classList.remove('active');
            tradeCharacterSelectionPopup.classList.remove('active');

        } catch (error) {
            console.error("Erro ao enviar solicitação de troca:", error);
            showPopupMessage("Erro ao enviar solicitação. Verifique suas permissões.", "Erro");
        }
    }, "Confirmar Troca");
};

// Carrega as solicitações de troca na aba
async function loadTradeRequests() {
    const user = auth.currentUser;
    if (!user) return;

    tradeRequestsList.innerHTML = '<li>Carregando...</li>';

    try {
        const snapshot = await db.collection('solicitacoes_troca')
            .where('receiverId', '==', user.uid)
            .where('status', '==', 'pending')
            .orderBy('timestamp', 'desc')
            .get();

        tradeRequestsList.innerHTML = '';
        if (snapshot.empty) {
            tradeRequestsList.innerHTML = '<li>Nenhuma solicitação de troca pendente.</li>';
            return;
        }

        snapshot.forEach(doc => {
            const data = doc.data();
            const offeredChar = PERSONAGENS.find(p => p.id === data.offeredCharId);
            const requestedChar = PERSONAGENS.find(p => p.id === data.requestedCharId);

            if (!offeredChar || !requestedChar) return; // Segurança

            const li = document.createElement('li');
            li.innerHTML = `
                <div class="challenge-item">
                    <span><strong>${data.senderName}</strong> quer trocar:</span>
                    <div style="font-size: 0.85rem; margin-top: 5px;">
                        <span style="color: #F44336;">Seu: ${requestedChar.nome}</span>
                        <br>
                        <span style="color: #4CAF50;">Dele(a): ${offeredChar.nome}</span>
                    </div>
                </div>
                <div class="request-actions">
                    <button class="request-btn" style="background: #4CAF50;" onclick="acceptTradeRequest('${doc.id}')">Aceitar</button>
                    <button class="request-btn" style="background: #F44336;" onclick="declineTradeRequest('${doc.id}')">Recusar</button>
                </div>
            `;
            tradeRequestsList.appendChild(li);
        });

    } catch (error) {
        console.error("Erro ao carregar solicitações de troca:", error);
        tradeRequestsList.innerHTML = '<li>Erro ao carregar solicitações.</li>';
    }
}

// Recusa uma solicitação de troca
window.declineTradeRequest = (requestId) => {
    showConfirmPopup("Tem certeza que deseja recusar esta troca?", async () => {
        await db.collection('solicitacoes_troca').doc(requestId).update({ status: 'declined' });
        showPopupMessage("Troca recusada.", "Aviso");
        loadTradeRequests();
    }, "Recusar Troca");
};

// Aceita uma solicitação de troca
window.acceptTradeRequest = (requestId) => {
    const user = auth.currentUser;
    if (!user) return;

    showConfirmPopup("Tem certeza que deseja aceitar esta troca?", async () => {
        try {
            await db.runTransaction(async (transaction) => {
                // 1. Busca a solicitação
                const requestRef = db.collection('solicitacoes_troca').doc(requestId);
                const requestDoc = await transaction.get(requestRef);

                if (!requestDoc.exists) throw "Solicitação não encontrada.";
                const data = requestDoc.data();

                if (data.status !== 'pending') throw "Esta solicitação não está mais pendente.";

                // 2. Referências dos usuários
                const senderRef = db.collection('usuarios').doc(data.senderId);
                const receiverRef = db.collection('usuarios').doc(data.receiverId);

                const senderDoc = await transaction.get(senderRef);
                const receiverDoc = await transaction.get(receiverRef);

                if (!senderDoc.exists || !receiverDoc.exists) throw "Usuário não encontrado.";

                const senderData = senderDoc.data();
                const receiverData = receiverDoc.data();

                // 3. Verifica posse dos personagens
                const senderChars = senderData.personagensConquistados || [];
                const receiverChars = receiverData.personagensConquistados || [];

                if (!senderChars.includes(data.offeredCharId)) {
                    throw "O remetente não possui mais o personagem oferecido.";
                }
                if (!receiverChars.includes(data.requestedCharId)) {
                    throw "Você não possui mais o personagem solicitado.";
                }

                // 4. Realiza a Troca (Calcula novos arrays e metadados)
                const senderUsername = senderData.username || senderData.nome || "Alguém";
                const receiverUsername = receiverData.username || receiverData.nome || "Alguém";

                const offeredCharObj = PERSONAGENS.find(p => p.id === data.offeredCharId);
                const requestedCharObj = PERSONAGENS.find(p => p.id === data.requestedCharId);
                const offeredCharName = offeredCharObj ? offeredCharObj.nome : "Personagem";
                const requestedCharName = requestedCharObj ? requestedCharObj.nome : "Personagem";

                // Atualiza Sender: Remove o que ofereceu, adiciona o que pediu + Metadados
                const newSenderChars = senderChars.filter(id => id !== data.offeredCharId);
                newSenderChars.push(data.requestedCharId);
                const senderMeta = senderData.personagensMetadata || {};
                senderMeta[data.requestedCharId] = { tradedWith: receiverUsername, tradedFor: offeredCharName };
                senderMeta[data.offeredCharId] = { tradedTo: receiverUsername, tradedFor: requestedCharName };

                transaction.update(senderRef, {
                    personagensConquistados: newSenderChars,
                    personagensMetadata: senderMeta
                });

                // Atualiza Receiver: Remove o que pediu (que era dele), adiciona o que recebeu + Metadados
                const newReceiverChars = receiverChars.filter(id => id !== data.requestedCharId);
                newReceiverChars.push(data.offeredCharId);
                const receiverMeta = receiverData.personagensMetadata || {};
                receiverMeta[data.offeredCharId] = { tradedWith: senderUsername, tradedFor: requestedCharName };
                receiverMeta[data.requestedCharId] = { tradedTo: senderUsername, tradedFor: offeredCharName };

                transaction.update(receiverRef, {
                    personagensConquistados: newReceiverChars,
                    personagensMetadata: receiverMeta
                });

                // 5. Atualiza status da solicitação
                transaction.update(requestRef, { status: 'accepted' });
            });

            showPopupMessage("Troca realizada com sucesso!", "Sucesso");
            loadTradeRequests(); // Recarrega a lista

        } catch (error) {
            console.error("Erro na troca:", error);
            showPopupMessage("Erro ao realizar troca: " + error, "Erro");
        }
    }, "Aceitar Troca");
};

// 2. Cancelar Report
if (cancelReportBtn) {
    cancelReportBtn.addEventListener('click', () => {
        playAudio(audioClick);
        reportPopup.classList.remove('active');
        // Retoma o jogo (vai para a roleta)
        showScreen('roulette-screen');
    });
}

// =======================================================
// --- SISTEMA DE VIDAS (LÓGICA) ---
// =======================================================

/**
 * Verifica se vidas devem ser regeneradas com base no tempo passado
 */
function checkLivesRegeneration(userData) {
    let lives = userData.lives !== undefined ? userData.lives : MAX_LIVES;
    let timers = userData.regenTimers || [];
    
    // Migração de dados antigos (se existir nextRegenTime e não regenTimers)
    if (userData.nextRegenTime && timers.length === 0 && lives < MAX_LIVES) {
        const oldTime = userData.nextRegenTime.toMillis ? userData.nextRegenTime.toMillis() : userData.nextRegenTime;
        if (oldTime > Date.now()) {
            timers.push(oldTime);
        }
    }

    const now = Date.now();
    let changed = false;
    let activeTimers = [];

    // Processa cada timer independentemente
    timers.forEach(t => {
        const tMillis = t.toMillis ? t.toMillis() : t;
        if (tMillis <= now) {
            // Apenas regenera se estiver abaixo do máximo
            if (lives < MAX_LIVES) {
                lives++; 
            }
            changed = true;
        } else {
            activeTimers.push(tMillis); // Timer ainda ativo
        }
    });

    // Se já estiver cheio ou acima do máximo, limpa os timers restantes
    if (lives >= MAX_LIVES) {
        activeTimers = [];
    }
    
    // Ordena os timers para saber qual é o próximo a acabar
    activeTimers.sort((a, b) => a - b);

    // Atualiza Globais
    userLives = lives;
    userRegenTimers = activeTimers;

    // Atualiza UI
    updateLivesUI();

    // Salva no Banco se houve mudança (regeneração passiva)
    if (changed && auth.currentUser) {
        const updateData = { 
            lives: userLives, 
            regenTimers: userRegenTimers,
            nextRegenTime: firebase.firestore.FieldValue.delete() // Limpa campo antigo se existir
        };
        db.collection('usuarios').doc(auth.currentUser.uid).update(updateData).catch(console.error);
    }
}

function updateLivesUI() {
    const countEl = document.getElementById('lives-count');
    if (countEl) {
        // Se energia infinita estiver ativa, mostra o símbolo
        if (userInfiniteLivesUntil && Date.now() < userInfiniteLivesUntil) {
            countEl.textContent = "∞";
            countEl.style.fontSize = "1.4rem";
            countEl.style.marginTop = "-3px"; // Ajuste visual
        } else {
            countEl.textContent = userLives;
            countEl.style.fontSize = "";
            countEl.style.marginTop = "";
        }
    }
}

/**
 * Tenta gastar uma vida para jogar
 */
async function spendLife() {
    // 1. Verifica Energia Infinita
    if (userInfiniteLivesUntil && Date.now() < userInfiniteLivesUntil) {
        return true; // Joga de graça!
    }

    // Verifica regeneração antes de gastar (caso o timer tenha acabado agora)
    checkLivesRegeneration({ lives: userLives, regenTimers: userRegenTimers });

    if (userLives <= 0) {
        let timerText = "breve";
        if (userRegenTimers.length > 0) {
            const nextTime = userRegenTimers[0];
            const diff = nextTime - Date.now();
            const minutes = Math.floor(diff / 60000);
            const seconds = Math.floor((diff % 60000) / 1000);
            timerText = `${minutes}:${String(seconds).padStart(2, '0')}`;
        }
        
        showPopupMessage(`Você está sem vidas! Aguarde recarregar.\nPróxima vida em: ${timerText || 'breve'}`, "Sem Vidas");
        return false;
    }

    userLives--;
    
    // Adiciona um novo timer APENAS se as vidas caírem abaixo do máximo
    if (userLives < MAX_LIVES) {
        userRegenTimers.push(Date.now() + REGEN_TIME_MS);
        userRegenTimers.sort((a, b) => a - b);
    }

    updateLivesUI();

    // Persiste a perda da vida
    const updateData = { lives: userLives, regenTimers: userRegenTimers };
    await db.collection('usuarios').doc(auth.currentUser.uid).update(updateData);
    
    return true;
}

// Timer Global para atualizar a contagem regressiva na UI
setInterval(() => {
    const timerEl = document.getElementById('lives-timer');
    if (!timerEl) return;

    const now = Date.now();

    // PRIORIDADE 1: Timer de Energia Infinita
    if (userInfiniteLivesUntil && now < userInfiniteLivesUntil) {
        const diff = userInfiniteLivesUntil - now;
        const minutes = Math.floor(diff / 60000);
        const seconds = Math.floor((diff % 60000) / 1000);
        timerEl.textContent = `${minutes}:${String(seconds).padStart(2, '0')}`;
        timerEl.style.color = "#FFD700"; // Dourado para destacar
        updateLivesUI(); // Garante que o símbolo ∞ esteja lá
    } 
    // PRIORIDADE 2: Timer de Regeneração Normal
    else if (userRegenTimers.length > 0) {
        timerEl.style.color = ""; // Reseta cor
        const nextRegenTime = userRegenTimers[0];
        const diff = nextRegenTime - now;
        
        if (diff <= 0) {
            // Tempo acabou, roda a lógica de regeneração
            checkLivesRegeneration({ lives: userLives, regenTimers: userRegenTimers });
        } else {
            const minutes = Math.floor(diff / 60000);
            const seconds = Math.floor((diff % 60000) / 1000);
            timerEl.textContent = `${minutes}:${String(seconds).padStart(2, '0')}`;
        }
    } else {
        timerEl.textContent = userLives === MAX_LIVES ? "Cheio" : "";
    }
}, 1000);

// 3. Confirmar Report
if (confirmReportBtn) {
    confirmReportBtn.addEventListener('click', async () => {
        playAudio(audioClick);
        const reason = reportReasonSelect.value;
        const user = auth.currentUser;

        if (!user || !perguntaAtualID) return;

        confirmReportBtn.disabled = true;
        confirmReportBtn.textContent = "Enviando...";

        try {
            const reportRef = db.collection('perguntas_publicadas').doc(perguntaAtualID);
            
            await db.runTransaction(async (transaction) => {
                const doc = await transaction.get(reportRef);
                if (!doc.exists) return; // Pergunta já foi deletada?

                const data = doc.data();
                const reports = data.reports || 0;
                const reportedBy = data.reportedBy || [];

                // Verifica se usuário já reportou
                if (reportedBy.includes(user.uid)) {
                    // Se já reportou, não faz nada (ou avisa)
                    return; 
                }

                const newReports = reports + 1;

                if (newReports > 3) {
                    // Mais de 3 reports: Move para pendentes e deleta de publicadas
                    const pendingRef = db.collection('perguntas_pendentes').doc(); // Novo ID
                    transaction.set(pendingRef, { ...data, reports: newReports, reportedBy: [...reportedBy, user.uid], motivoReport: reason });
                    transaction.delete(reportRef);
                } else {
                    // Apenas incrementa o contador
                    transaction.update(reportRef, { reports: newReports, reportedBy: firebase.firestore.FieldValue.arrayUnion(user.uid) });
                }
            });

            showPopupMessage("Denúncia enviada. Obrigado por ajudar a melhorar o jogo!", "Denúncia Recebida");
        } catch (error) {
            console.error("Erro ao reportar:", error);
        }

        // Fecha e segue o jogo
        reportPopup.classList.remove('active');
        confirmReportBtn.disabled = false;
        confirmReportBtn.textContent = "Enviar Denúncia";
        showScreen('roulette-screen');
    });
}
                
           

      
