document.addEventListener('DOMContentLoaded', () => {
    const API_BASE_URL = 'http://127.0.0.1:5000';

    const loginScreen = document.getElementById('login-screen');
    const dashboardScreen = document.getElementById('dashboard-screen');
    
    // --- FUNÇÕES DE AUTENTICAÇÃO E UI ---

    function checkAdminLogin() {
        const token = localStorage.getItem('adminToken');
        if (token) {
            loginScreen.style.display = 'none';
            dashboardScreen.style.display = 'block';
            const instituicao = JSON.parse(localStorage.getItem('instituicao'));
            document.getElementById('welcome-message').textContent = `Bem-vindo, ${instituicao.nome_instituicao}!`;
            loadAlunos();
        } else {
            loginScreen.style.display = 'flex';
            dashboardScreen.style.display = 'none';
        }
    }

    async function handleAdminLogin() {
        const email = document.getElementById('admin-email').value;
        const password = document.getElementById('admin-password').value;
        try {
            const response = await fetch(`${API_BASE_URL}/admin/login`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, senha: password }),
            });
            const data = await response.json();
            if (!response.ok) throw new Error(data.error || 'Erro desconhecido');
            
            localStorage.setItem('adminToken', data.token);
            localStorage.setItem('instituicao', JSON.stringify(data.instituicao));
            checkAdminLogin();
        } catch (error) {
            alert(`Erro no login: ${error.message}`);
        }
    }

    function handleLogout() {
        localStorage.removeItem('adminToken');
        localStorage.removeItem('instituicao');
        checkAdminLogin();
    }

    // --- FUNÇÕES DE GERENCIAMENTO DE ALUNOS ---

    async function fetchWithAuth(endpoint, options = {}) {
        const token = localStorage.getItem('adminToken');
        const headers = {
            'Content-Type': 'application/json',
            'x-access-token': token,
            ...options.headers,
        };
        const response = await fetch(`${API_BASE_URL}${endpoint}`, { ...options, headers });
        if (response.status === 401 || response.status === 403) {
            handleLogout(); // Desloga se o token for inválido
            throw new Error('Sessão expirada ou acesso negado.');
        }
        return response;
    }

    async function loadAlunos() {
        try {
            const response = await fetchWithAuth('/admin/alunos');
            if (!response.ok) throw new Error('Falha ao buscar alunos.');
            const alunos = await response.json();
            renderAlunosTable(alunos);
        } catch (error) {
            alert(error.message);
        }
    }

    function renderAlunosTable(alunos) {
        const tableBody = document.getElementById('alunos-table-body');
        tableBody.innerHTML = ''; // Limpa a tabela
        if (alunos.length === 0) {
            tableBody.innerHTML = '<tr><td colspan="4" class="text-center py-4 text-gray-500">Nenhum aluno cadastrado.</td></tr>';
            return;
        }
        alunos.forEach(aluno => {
            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td class="px-6 py-4 whitespace-nowrap">${aluno.nome}</td>
                <td class="px-6 py-4 whitespace-nowrap">${aluno.email}</td>
                <td class="px-6 py-4 whitespace-nowrap">${aluno.tipo_plano}</td>
                <td class="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <button data-id="${aluno.id_usuario}" class="delete-btn text-red-600 hover:text-red-900">Excluir</button>
                </td>
            `;
            tableBody.appendChild(tr);
        });
    }
    
    async function handleAddAluno() {
        const nome = document.getElementById('aluno-nome').value;
        const email = document.getElementById('aluno-email').value;
        const senha = document.getElementById('aluno-senha').value;
        if (!nome || !email || !senha) {
            alert('Todos os campos são obrigatórios.');
            return;
        }
        try {
            const response = await fetchWithAuth('/admin/alunos', {
                method: 'POST',
                body: JSON.stringify({ nome, email, senha }),
            });
            const data = await response.json();
            if (!response.ok) throw new Error(data.error);
            alert(data.message);
            closeModal();
            loadAlunos();
        } catch (error) {
            alert(`Erro ao adicionar aluno: ${error.message}`);
        }
    }

    async function handleDeleteAluno(id_usuario) {
        if (!confirm('Tem certeza que deseja excluir este aluno? Esta ação não pode ser desfeita.')) return;
        try {
            const response = await fetchWithAuth(`/admin/alunos/${id_usuario}`, { method: 'DELETE' });
            const data = await response.json();
            if (!response.ok) throw new Error(data.error);
            alert(data.message);
            loadAlunos();
        } catch (error) {
            alert(`Erro ao excluir aluno: ${error.message}`);
        }
    }

    // --- CONTROLE DOS MODAIS ---
    const addAlunoModal = document.getElementById('add-aluno-modal');
    function openModal() {
        document.getElementById('aluno-nome').value = '';
        document.getElementById('aluno-email').value = '';
        document.getElementById('aluno-senha').value = '';
        addAlunoModal.classList.add('flex');
    }
    function closeModal() {
        addAlunoModal.classList.remove('flex');
    }

    // --- EVENT LISTENERS ---
    document.getElementById('admin-login-btn').addEventListener('click', handleAdminLogin);
    document.getElementById('logout-btn').addEventListener('click', handleLogout);
    document.getElementById('add-aluno-btn').addEventListener('click', openModal);
    document.getElementById('cancel-add-btn').addEventListener('click', closeModal);
    document.getElementById('confirm-add-btn').addEventListener('click', handleAddAluno);

    document.getElementById('alunos-table-body').addEventListener('click', (e) => {
        if (e.target.classList.contains('delete-btn')) {
            const id = e.target.dataset.id;
            handleDeleteAluno(id);
        }
    });

    // --- INICIALIZAÇÃO ---
    checkAdminLogin();
});