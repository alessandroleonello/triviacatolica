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
const collectionBackButton = document.querySelectorAll('#collection-back-btn');
const characterUnlockedPopup = document.getElementById('character-unlocked-popup');
const categoryChoicePopup = document.getElementById('category-choice-popup');
const choiceButtonsGrid = document.getElementById('category-choice-buttons');
const characterDetailPopup = document.getElementById('character-detail-popup');
const detailCloseBtn = document.getElementById('detail-close-btn');
let isRewardChoicePending = false;

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

// SUBSTITUA O SEU ARRAY DE CATEGORIAS POR ESTE
const CATEGORIES = [
    { name: "Sagradas Escrituras", icon: "📖", color: "#ffc300", dbValue: "escrituras" }, // 1. Amarelo
    { name: "Santos e Mártires", icon: "😇", color: "#ff5a5a", dbValue: "santos" },     // 2. Vermelho
    { name: "Doutrina e Dogmas", icon: "📚", color: "#00aaff", dbValue: "doutrina" },   // 3. Azul
    { name: "História da Igreja", icon: "📜", color: "#90d636", dbValue: "historia" },   // 4. Verde
    { name: "Liturgia e Sacramentos", icon: "🕯️", color: "#9966cc", dbValue: "liturgia" },   // 5. Roxo
    { name: "Arte e Cultura Sacra", icon: "🖼️", color: "#ff9900", dbValue: "arte" }      // 6. Laranja
];


// LISTA DE RECOMPENSAS COMPLETA (54 Personagens)
const PERSONAGENS = [
    // --- PERSONAGENS ORIGINAIS (NÍVEIS 5 a 20) ---
    {
        nivel: 5,
        id: "sao_joao_paulo_2",
        nome: "São João Paulo II",
        categoria: "Papas",
        historia: "O Papa polonês que iniciou a Jornada Mundial da Juventude (JMJ)."
    },
    {
        nivel: 10,
        id: "santa_terezinha",
        nome: "Santa Teresinha",
        categoria: "Santos",
        historia: "Padroeira das missões e famosa pela Doutrina da Pequena Via."
    },
    {
        nivel: 15,
        id: "frei_gilson",
        nome: "Frei Gilson",
        categoria: "Figuras Modernas",
        historia: "Sacerdote e músico carismático, conhecido por seu trabalho de evangelização."
    },
    {
        nivel: 20,
        id: "sao_miguel",
        nome: "São Miguel Arcanjo",
        categoria: "Santos",
        historia: "O líder do exército celestial e protetor da Igreja contra o mal."
    },

    // --- NOVOS PERSONAGENS (INÍCIO DA EXPANSÃO - NÍVEIS 25 a 70) ---
    {
        nivel: 25,
        id: "santo_agostinho",
        nome: "Santo Agostinho",
        categoria: "Santos",
        historia: "Bispo que se converteu tardiamente, autor de Confissões e Cidade de Deus."
    },
    {
        nivel: 30,
        id: "santa_clara",
        nome: "Santa Clara de Assis",
        categoria: "Santos",
        historia: "Seguidora de São Francisco e fundadora da Ordem das Clarissas (ramo feminino dos franciscanos)."
    },
    {
        nivel: 35,
        id: "sao_carlo_acutis",
        nome: "São Carlo Acutis",
        categoria: "Santos",
        historia: "Jovem italiano conhecido como Patrono da Internet por documentar milagres eucarísticos."
    },
    {
        nivel: 40,
        id: "sao_judas_tadeu",
        nome: "São Judas Tadeu",
        categoria: "Santos",
        historia: "Apóstolo de Jesus e padroeiro das causas desesperadas e impossíveis."
    },
    {
        nivel: 45,
        id: "sao_domingos",
        nome: "São Domingos",
        categoria: "Santos",
        historia: "Fundador da Ordem dos Pregadores (Dominicanos), associado à difusão do Rosário."
    },
    {
        nivel: 50,
        id: "sao_benedito",
        nome: "São Benedito, o Mouro",
        categoria: "Santos",
        historia: "Frade franciscano, padroeiro dos cozinheiros e conhecido por sua grande humildade."
    },
    {
        nivel: 55,
        id: "sao_francisco_xavier",
        nome: "São Francisco Xavier",
        categoria: "Santos",
        historia: "Cofundador dos Jesuítas e um dos maiores missionários, atuando na Ásia."
    },
    {
        nivel: 60,
        id: "santa_rita",
        nome: "Santa Rita de Cássia",
        categoria: "Santos",
        historia: "Conhecida como a santa das causas impossíveis e padroeira das famílias."
    },
    {
        nivel: 65,
        id: "sao_cristovao",
        nome: "São Cristóvão",
        categoria: "Santos",
        historia: "Padroeiro dos motoristas e viajantes, famoso por carregar o Menino Jesus."
    },
    {
        nivel: 70,
        id: "sao_lucas",
        nome: "São Lucas Evangelista",
        categoria: "Santos",
        historia: "Evangelista que era médico; padroeiro dos artistas e dos médicos."
    },

    // --- NOVOS PERSONAGENS (MEIO DA EXPANSÃO - NÍVEIS 75 a 150) ---
    {
        nivel: 75,
        id: "madre_teresa",
        nome: "Santa Teresa de Calcutá",
        categoria: "Santos",
        historia: "Fundadora das Missionárias da Caridade, Nobel da Paz, famosa pelo trabalho com os pobres e doentes."
    },
    {
        nivel: 80,
        id: "padre_pio",
        nome: "São Pio de Pietrelcina",
        categoria: "Santos",
        historia: "Frade capuchinho italiano, famoso por receber os estigmas de Cristo e por aconselhar espiritualmente."
    },
    {
        nivel: 85,
        id: "sao_jeronimo",
        nome: "São Jerônimo",
        categoria: "Santos",
        historia: "Responsável por traduzir a Bíblia para o latim (Vulgata); padroeiro dos bibliotecários."
    },
    {
        nivel: 90,
        id: "santo_antonio_padua",
        nome: "Santo Antônio de Pádua",
        categoria: "Santos",
        historia: "Padroeiro de Portugal, famoso por ajudar a encontrar objetos perdidos e por sua pregação."
    },
    {
        nivel: 95,
        id: "sao_vicente_paulo",
        nome: "São Vicente de Paulo",
        categoria: "Santos",
        historia: "Padroeiro das obras de caridade e dos pobres, fundador dos Vicentinos."
    },
    {
        nivel: 100,
        id: "nossa_senhora_fatima",
        nome: "Nossa Senhora de Fátima",
        categoria: "Títulos Marianos",
        historia: "A Virgem Maria apareceu a três pastorinhos em Portugal em 1917, com mensagens de paz."
    },
    {
        nivel: 105,
        id: "sao_jose",
        nome: "São José",
        categoria: "Santos",
        historia: "Pai adotivo de Jesus, padroeiro da Igreja Universal e dos trabalhadores."
    },
    {
        nivel: 110,
        id: "sao_rafael",
        nome: "São Rafael Arcanjo",
        categoria: "Santos",
        historia: "Arcanjo cujo nome significa Deus cura; guia dos viajantes e padroeiro da saúde."
    },
    {
        nivel: 115,
        id: "santa_teresa_avila",
        nome: "Santa Teresa D'Ávila",
        categoria: "Santos",
        historia: "Reformadora da Ordem Carmelita e a primeira mulher a ser nomeada Doutora da Igreja."
    },
    { nivel: 120, id: "sao_luis_gonzaga", nome: "São Luís Gonzaga", categoria: "Santos", historia: "Padroeiro da Juventude, renunciou à riqueza para servir a Deus." },
    { nivel: 125, id: "sao_patricio", nome: "São Patrício", categoria: "Santos", historia: "Padroeiro da Irlanda, creditado por usar o trevo para explicar a Santíssima Trindade." },
    { nivel: 130, id: "santa_maria_madalena", nome: "Santa Maria Madalena", categoria: "Santos", historia: "Chamada de Apóstola dos Apóstolos, foi a primeira a ver Jesus ressuscitado." },
    { nivel: 135, id: "sao_joao_batista", nome: "São João Batista", categoria: "Santos", historia: "O último dos profetas e aquele que batizou Jesus no Rio Jordão." },
    { nivel: 140, id: "santa_ana_e_joaquim", nome: "Sant'Ana e São Joaquim", categoria: "Santos", historia: "Os pais de Maria e avós de Jesus, padroeiros das famílias." },
    { nivel: 145, id: "sao_gregorio_magno", nome: "São Gregório Magno", categoria: "Papas", historia: "Papa que estabeleceu o canto litúrgico oficial (Canto Gregoriano)." },
    { nivel: 150, id: "sao_ignacio_loyola", nome: "Santo Inácio de Loyola", categoria: "Santos", historia: "Fundador da Companhia de Jesus (Jesuítas) e autor dos Exercícios Espirituais." },

    // --- NOVOS PERSONAGENS (EXPANSÃO INTERMEDIÁRIA - NÍVEIS 155 a 220) ---
    { nivel: 155, id: "sao_francisco_assis", nome: "São Francisco de Assis", categoria: "Santos", historia: "Fundador da Ordem Franciscana, conhecido pela vida de pobreza e amor à criação." },
    { nivel: 160, id: "sao_roque", nome: "São Roque", categoria: "Santos", historia: "Padroeiro contra a peste e doenças contagiosas; representado com um cão." },
    { nivel: 165, id: "santa_faustina", nome: "Santa Faustina Kowalska", categoria: "Santos", historia: "Apóstola da Divina Misericórdia e autora do Diário Misericórdia Divina na minha alma." },
    { nivel: 170, id: "papa_joao_23", nome: "São João XXIII", categoria: "Papas", historia: "O Papa que convocou o Concílio Vaticano II, abrindo a Igreja ao mundo moderno." },
    { nivel: 175, id: "sao_sebastiao", nome: "São Sebastião", categoria: "Santos", historia: "Mártir romano, padroeiro dos atletas e dos militares; frequentemente retratado amarrado e flechado." },
    { nivel: 180, id: "sao_tiago_maior", nome: "São Tiago Maior", categoria: "Santos", historia: "Apóstolo, irmão de São João; seu sepulcro é o destino da peregrinação do Caminho de Santiago de Compostela." },
    { nivel: 190, id: "santa_isabel_hungria", nome: "Santa Isabel da Hungria", categoria: "Santos", historia: "Princesa húngara, padroeira das obras de caridade; famosa pelo milagre das rosas." },
    { nivel: 195, id: "sao_josemaria", nome: "São Josemaria Escrivá", categoria: "Santos", historia: "Fundador do Opus Dei, com ênfase na santificação do trabalho e da vida cotidiana." },
    { nivel: 200, id: "sao_filipe_neri", nome: "São Filipe Neri", categoria: "Santos", historia: "Padroeiro de Roma e conhecido como o Apóstolo da Alegria." },
    { nivel: 205, id: "sao_bruno", nome: "São Bruno (Cartuxos)", categoria: "Santos", historia: "Fundador da Ordem dos Cartuxos, uma das ordens monásticas mais rigorosas." },
    { nivel: 210, id: "sao_vicente_ferrier", nome: "São Vicente Ferrer", categoria: "Santos", historia: "Pregador e taumaturgo espanhol, famoso por suas pregações sobre o fim dos tempos." },
    { nivel: 215, id: "sao_maximiliano_kolbe", nome: "São Maximiliano Kolbe", categoria: "Santos", historia: "Frade polonês que se ofereceu para morrer no lugar de um pai de família no campo de concentração de Auschwitz." },
    { nivel: 220, id: "santo_espedito", nome: "Santo Expedito", categoria: "Santos", historia: "Mártir romano, invocado nas causas urgentes e de última hora." },

    // --- NOVOS PERSONAGENS (EXPANSÃO FINAL - NÍVEIS 225 a 270) ---
    { nivel: 225, id: "sao_ambrosio", nome: "Santo Ambrósio", categoria: "Santos", historia: "Bispo de Milão, famoso por sua pregação e por ter batizado Santo Agostinho." },
    { nivel: 230, id: "papa_francisco", nome: "Papa Francisco", categoria: "Papas", historia: "O primeiro Papa jesuíta, o primeiro da América Latina e o primeiro a escolher o nome Francisco." },
    { nivel: 235, id: "santa_edith_stein", nome: "Santa Teresa Benedita da Cruz", categoria: "Santos", historia: "Filósofa judia convertida ao catolicismo, que se tornou carmelita e morreu em Auschwitz." },
    { nivel: 240, id: "sao_bento", nome: "São Bento de Núrsia", categoria: "Santos", historia: "Pai do monaquismo ocidental e autor da Regra de São Bento (Ora et Labora)." },
    { nivel: 245, id: "sao_cosme_damiao", nome: "São Cosme e São Damião", categoria: "Santos", historia: "Santos irmãos gêmeos, padroeiros dos médicos e farmacêuticos, famosos por curarem de graça." },
    { nivel: 250, id: "sao_lorenco", nome: "São Lourenço Mártir", categoria: "Santos", historia: "Diácono que foi assado vivo em uma grelha no século III." },
    { nivel: 255, id: "sao_domingos_savio", nome: "São Domingos Sávio", categoria: "Santos", historia: "Jovem discípulo de Dom Bosco, famoso por sua pureza e alegria." },
    { nivel: 260, id: "sao_tiago_menor", nome: "São Tiago Menor", categoria: "Santos", historia: "Apóstolo, parente de Jesus, considerado o primeiro Bispo de Jerusalém." },
    { nivel: 265, id: "santa_luzia", nome: "Santa Luzia", categoria: "Santos", historia: "Padroeira dos olhos e da visão; morreu mártir durante a perseguição de Diocleciano." },
    { nivel: 270, id: "nossa_senhora_guadalupe", nome: "Nossa Senhora de Guadalupe", categoria: "Títulos Marianos", historia: "Aparição de Maria no México (1531), deixando sua imagem milagrosa gravada na tilma de São Juan Diego." }
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

    // 3. Exibe o popup
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
            username: newUsername 
        });

        // 6. Sucesso! Atualiza a UI da Home e fecha
        document.getElementById('user-name').textContent = newDisplayName;
        document.getElementById('user-username').textContent = newUsername; // Atualiza o display do username
        closeProfileEditPopup();
        alert("Perfil atualizado com sucesso!");

    } catch (error) {
        console.error("Erro ao salvar perfil: ", error);
        usernameErrorMsg.textContent = 'Erro ao salvar: ' + error.message;
    } finally {
        // Garante que o botão seja reativado após a operação
        saveProfileBtn.disabled = false;
        saveProfileBtn.textContent = 'Salvar Alterações';
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
            username: '',
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
    document.getElementById('user-username').textContent = userData.username;
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
// Listener para fechar o popup de personagem
if (popupCloseBtn) { // Verificação de segurança
    popupCloseBtn.addEventListener('click', () => {
        playAudio(audioClick);
        characterUnlockedPopup.classList.remove('active'); // Esconde o popup
        
        // Agora que o popup foi fechado, volte para a roleta para o próximo giro
        showScreen('roulette-screen'); 
    });
}
// Botão de voltar do ranking
rankingBackButton.addEventListener('click', () => {
    playAudio(audioClick);
    showScreen('home-screen');
});
// Botão de voltar da fábrica
factoryBackButton.addEventListener('click', () => { playAudio(audioClick); showScreen('home-screen') });

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
 * Lida com a resposta CORRETA (Com lógica de ESCOLHA)
 */
async function handleCorrectAnswer() {
    playAudio(audioCorrect);
    console.log("Resposta Correta!");

    // 1. Atualiza o placar da sessão (e salva no Firestore)
    const nivelAtual = placarAtual.nivel;
    placarAtual.nivel++;
    placarAtual.pontos += 10;

    // 2. Atualiza a UI e salva a progressão
    gameTimerOrLevel.textContent = `Nível ${placarAtual.nivel}`;
    document.getElementById('user-score').textContent = placarAtual.pontos;
    document.getElementById('user-level').textContent = placarAtual.nivel;

    const userRef = db.collection('usuarios').doc(auth.currentUser.uid);
    await userRef.update({
        nivelTorre: placarAtual.nivel,
        pontosTotais: placarAtual.pontos
    });

    // 3. Verifica o DESBLOQUEIO DE ESCOLHA (Múltiplos de 5)
    if (placarAtual.nivel % 5 === 0 && placarAtual.nivel > 0) {
        isRewardChoicePending = true; // Define o estado de escolha
        setTimeout(() => {
            showCategoryChoicePopup();
        }, 1500); // 1.5s de atraso para o usuário ver o acerto

    } else {
        // NÃO é nível de recompensa (continua o loop)
        setTimeout(() => {
            showScreen('roulette-screen');
        }, 1500);
    }

    // Salva a pergunta como respondida (MESMO QUE SEJA RECOMPENSA)
    if (perguntaAtualID && currentMode === 'torre') {
        await userRef.update({
            perguntasRespondidas: firebase.firestore.FieldValue.arrayUnion(perguntaAtualID)
        });
        perguntasRespondidasSet.add(perguntaAtualID);
        console.log(`Salvo ${perguntaAtualID} como respondida.`);
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
            card.innerHTML = `
                <img src="images/personagens/${personagem.id}.png" alt="${personagem.nome}">
                <p>${personagem.nome}</p>
            `;

            cardContainer.appendChild(card);
        });

        collectionGrid.appendChild(cardContainer);
    }
}


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

/**
 * FUNÇÃO CORE: Exibe o popup de escolha de categoria
 */
function showCategoryChoicePopup() {
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
    const userDoc = await db.collection('usuarios').doc(user.uid).get();
    const unlockedIds = new Set(userDoc.data().personagensConquistados || []);

    // 2. Filtra personagens disponíveis na categoria ESCOLHIDA
    const availableCharacters = PERSONAGENS.filter(p =>
        p.categoria === category && !unlockedIds.has(p.id)
    );

    if (availableCharacters.length === 0) {
        alert(`Você já desbloqueou todos os personagens da categoria ${category}! Ganhando um prêmio aleatório...`);
        // Fallback: Tenta desbloquear em outra categoria ou dá pontos extra
        // Por simplicidade, daremos pontos e voltamos:
        userRef.update({ pontosTotais: firebase.firestore.FieldValue.increment(50) });
        isRewardChoicePending = false;
        showScreen('roulette-screen');
        return;
    }

    // 3. Sorteia um novo personagem (e pega os dados completos)
    const randomIndex = Math.floor(Math.random() * availableCharacters.length);
    const unlockedCharacterData = availableCharacters[randomIndex];

    // 4. Salva o novo personagem no Firestore
    const userRef = db.collection('usuarios').doc(user.uid);
    await userRef.update({
        personagensConquistados: firebase.firestore.FieldValue.arrayUnion(unlockedCharacterData.id)
    });

    // 5. Mostra o Popup de Sucesso
    unlockedCharacterImg.src = `images/personagens/${unlockedCharacterData.id}.png`;
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
    document.getElementById('detail-img').src = `images/personagens/${characterId}.png`;
    document.getElementById('detail-name').textContent = characterData.nome;
    document.getElementById('detail-history').textContent = characterData.historia;

    // Exibe o popup
    characterDetailPopup.classList.add('active');
}

// Listener para fechar o popup de detalhe
detailCloseBtn.addEventListener('click', () => {
    playAudio(audioClick);
    characterDetailPopup.classList.remove('active');
});

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
});

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
            alert("Desculpe, a instalação não está disponível no momento.O app já pode estar instalado.");
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