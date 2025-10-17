// Funções Globais para UI
function abrirLogin() {
    alert("A funcionalidade de Login será implementada em breve, quando o plano Premium estiver disponível!");
}
function fecharLogin() { /* Apenas para o botão de fechar do modal, não faz nada por enquanto */ }
function abrirCriarConta() {
    alert("A funcionalidade de Cadastro será implementada em breve, quando o plano Premium estiver disponível!");
}
function fecharCriarConta() { /* Apenas para o botão de fechar do modal, não faz nada por enquanto */ }


document.addEventListener('DOMContentLoaded', () => {
    const API_BASE_URL = 'http://127.0.0.1:5000';

    // --- FUNÇÕES DE NAVEGAÇÃO E UI ---
    function moveMenuUnderline(target) {
        const underline = document.getElementById('menuUnderline');
        const menuBar = document.getElementById('menuBar');
        if (!underline || !menuBar || !target) {
            if (underline) underline.style.width = `0px`;
            return;
        }
        const menuRect = menuBar.getBoundingClientRect();
        const targetRect = target.getBoundingClientRect();
        underline.style.width = `${targetRect.width}px`;
        underline.style.transform = `translateX(${targetRect.left - menuRect.left}px)`;
    }

    function activateMenuLink(target) {
        document.querySelectorAll('#menuBar .menu-link').forEach(link => link.classList.remove('active'));
        if (target) {
            target.classList.add('active');
            moveMenuUnderline(target);
        } else {
            moveMenuUnderline(null);
        }
    }

    function activateSidebarLink(target) {
        document.querySelectorAll('#sidebar a[data-sidebar]').forEach(link => link.classList.remove('sidebar-link-active'));
        if (target) {
            target.classList.add('sidebar-link-active');
        }
    }

    function showTela(page) {
        document.querySelectorAll('.tela').forEach(tela => {
            tela.classList.remove('ativa');
            tela.style.display = 'none';
        });
        const telaNova = document.getElementById('tela-' + page);
        if (telaNova) {
            telaNova.style.display = 'block';
            telaNova.classList.add('ativa');
        }
    }

    // --- LÓGICA DOS FLASHCARDS ---
    let allFlashcards = [];
    let selectedFlashcardTheme = null;

    document.querySelectorAll('#flashcard-theme-selector .theme-button').forEach(button => {
        button.addEventListener('click', (e) => {
            selectedFlashcardTheme = e.target.dataset.theme;
            document.querySelectorAll('#flashcard-theme-selector .theme-button').forEach(btn => btn.classList.remove('active'));
            e.target.classList.add('active');
        });
    });

    document.getElementById('gerarFlashcardsBtn').addEventListener('click', async () => {
        if (!selectedFlashcardTheme) {
            alert("Por favor, selecione um tema primeiro.");
            return;
        }
        const container = document.getElementById('flashcardsContainer');
        container.innerHTML = `<p class="text-white">Carregando...</p>`;
        try {
            const response = await fetch(`${API_BASE_URL}/conteudo/${selectedFlashcardTheme}/flashcards`);
            if (!response.ok) throw new Error('Conteúdo não encontrado.');
            allFlashcards = await response.json();
            displayRandomFlashcards();
        } catch (error) {
            container.innerHTML = `<p class="text-white">${error.message}</p>`;
        }
    });

    function displayRandomFlashcards() {
        if (allFlashcards.length === 0) return;
        const shuffled = [...allFlashcards].sort(() => 0.5 - Math.random());
        const selected = shuffled.slice(0, 6);
        renderFlashcards(selected);
    }
    
    function renderFlashcards(flashcards) {
        const container = document.getElementById('flashcardsContainer');
        container.innerHTML = '';
        flashcards.forEach(fc => {
            const card = document.createElement('div');
            card.className = 'w-full sm:w-80 h-48 bg-transparent perspective';
            card.innerHTML = `
                <div class="relative w-full h-full flashcard-inner">
                    <div class="flashcard-front absolute w-full h-full bg-white rounded-lg p-4 flex items-center justify-center text-center font-semibold text-purple-800 shadow-lg cursor-pointer">${fc.pergunta}</div>
                    <div class="flashcard-back absolute w-full h-full bg-purple-200 rounded-lg p-4 flex items-center justify-center text-center text-purple-900 shadow-lg cursor-pointer">${fc.resposta}</div>
                </div>`;
            card.addEventListener('click', () => card.querySelector('.flashcard-inner').classList.toggle('flipped'));
            container.appendChild(card);
        });
    }

    // --- LÓGICA DO QUIZ ---
    let allQuizQuestions = [];
    let currentQuizQuestions = [];
    let selectedQuizTheme = null;

    document.querySelectorAll('#quiz-theme-selector .theme-button').forEach(button => {
        button.addEventListener('click', (e) => {
            selectedQuizTheme = e.target.dataset.theme;
            document.querySelectorAll('#quiz-theme-selector .theme-button').forEach(btn => btn.classList.remove('active'));
            e.target.classList.add('active');
        });
    });

    document.getElementById('gerarQuizBtn').addEventListener('click', async () => {
        if (!selectedQuizTheme) {
            alert("Por favor, selecione um tema primeiro.");
            return;
        }
        const container = document.getElementById('quizOutput');
        container.innerHTML = `<p class="text-purple-800">Carregando quiz...</p>`;
        container.classList.remove('hidden');
        document.getElementById('restartQuizBtn').classList.add('hidden');
        try {
            const response = await fetch(`${API_BASE_URL}/conteudo/${selectedQuizTheme}/quiz`);
            if (!response.ok) throw new Error('Quiz não encontrado.');
            allQuizQuestions = await response.json();
            startQuiz();
        } catch (error) {
            container.innerHTML = `<p class="text-red-700">${error.message}</p>`;
        }
    });

    function startQuiz() {
        if (allQuizQuestions.length === 0) return;
        const shuffled = [...allQuizQuestions].sort(() => 0.5 - Math.random());
        currentQuizQuestions = shuffled.slice(0, 10);
        document.getElementById('restartQuizBtn').classList.remove('hidden');
        renderAllQuestions();
    }
    
    function renderAllQuestions() {
        const container = document.getElementById('quizOutput');
        container.innerHTML = '';
        currentQuizQuestions.forEach((question, index) => {
            const questionDiv = document.createElement('div');
            questionDiv.className = 'quiz-question mb-8';
            questionDiv.id = `question-${index}`;
            let optionsHTML = '';
            question.opcoes.forEach(option => { optionsHTML += `<button class="quiz-option w-full text-left p-3 border rounded-lg hover:bg-gray-200">${option}</button>`; });
            questionDiv.innerHTML = `
                <p class="text-lg font-semibold mb-4">${index + 1}. ${question.pergunta}</p>
                <div class="flex flex-col gap-3">${optionsHTML}</div>
                <div class="quiz-explanation hidden"><strong>Explicação:</strong> ${question.explicacao}</div>`;
            container.appendChild(questionDiv);
        });
        container.querySelectorAll('.quiz-option').forEach(button => button.addEventListener('click', handleAnswer));
    }

    function handleAnswer(event) {
        const selectedButton = event.target;
        const questionDiv = selectedButton.closest('.quiz-question');
        const questionIndex = parseInt(questionDiv.id.split('-')[1]);
        const question = currentQuizQuestions[questionIndex];

        // Impede cliques múltiplos
        if (questionDiv.dataset.answered) return;
        questionDiv.dataset.answered = 'true';
        
        const isCorrect = selectedButton.textContent === question.resposta_correta;

        questionDiv.querySelectorAll('.quiz-option').forEach(button => {
            button.disabled = true;
            if (button.textContent === question.resposta_correta) {
                button.classList.add('correct-answer');
            }
        });

        if (!isCorrect) {
            selectedButton.classList.add('wrong-answer');
        }

        const explanationDiv = questionDiv.querySelector('.quiz-explanation');
        if (explanationDiv) explanationDiv.classList.remove('hidden');
    }
    
    document.getElementById('restartQuizBtn').addEventListener('click', startQuiz);

    // --- INICIALIZAÇÃO E EVENTOS DE NAVEGAÇÃO ---
    document.getElementById('authBtn').onclick = abrirLogin;

    document.querySelectorAll('#menuBar .menu-link').forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            activateMenuLink(link);
            activateSidebarLink(null);
            showTela(link.getAttribute('data-page'));
        });
    });

    document.querySelectorAll('#sidebar a[data-sidebar]').forEach(link => {
        link.addEventListener('click', function (e) {
            e.preventDefault();
            activateSidebarLink(this);
            activateMenuLink(null);
            showTela(this.getAttribute('data-sidebar'));
        });
    });
    
    showTela('inicio');
    activateSidebarLink(document.querySelector('#sidebar a[data-sidebar="inicio"]'));
});