document.addEventListener('DOMContentLoaded', async () => {
    // Verifica se o pollId já foi passado como um parâmetro de URL
    const params = new URLSearchParams(window.location.search);
    const pollId = params.get('id');
    console.log(pollId);

    if (!pollId) {
        alert('ID da enquete não encontrado.');
        return;
    }

    // Adiciona o campo oculto para armazenar o pollId, caso ele ainda não exista
    if (!document.getElementById('pollId')) {
        const pollIdInput = document.createElement('input');
        pollIdInput.type = 'hidden';
        pollIdInput.id = 'pollId';
        pollIdInput.value = pollId;
        document.body.appendChild(pollIdInput); // Adiciona o campo na página
    }

    try {
        // Faz a requisição para obter a enquete
        const response = await fetch(`http://localhost:3000/polls/${pollId}`);
        
        if (!response.ok) {
            const data = await response.json();
            alert(data.error || 'Erro ao carregar enquete.');
            return;
        }

        const poll = await response.json();

        // Preenche os campos com os dados da enquete
        document.getElementById('pollName').value = poll.name;
        document.getElementById('startDate').value = poll.start_date;
        document.getElementById('endDate').value = poll.end_date;

        // Preenche as opções da enquete
        const optionsContainer = document.getElementById('optionsContainer');
        optionsContainer.innerHTML = ''; // Limpa antes de adicionar novas opções

        poll.options.forEach(option => {
            const input = document.createElement('input');
            input.type = 'text';
            input.value = option.option_text;
            input.dataset.optionId = option.id; // Atribui o ID da opção para identificação futura
            optionsContainer.appendChild(input);
            optionsContainer.appendChild(document.createElement('br'));
        });

    } catch (error) {
        console.error('Erro ao carregar enquete:', error);
        alert('Erro ao carregar enquete.');
    }

    // Função para salvar a enquete editada
    document.getElementById('savePollBtn').addEventListener('click', async () => {
        const pollId = document.getElementById('pollId').value; // Pega o pollId do campo oculto
        const name = document.getElementById('pollName').value;
        const startDate = document.getElementById('startDate').value;
        const endDate = document.getElementById('endDate').value;
        const options = [];

        // Coleta as opções do formulário
        document.querySelectorAll('#optionsContainer input').forEach(input => {
            options.push(input.value);
        });

        try {
            const response = await fetch(`http://localhost:3000/polls/${pollId}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ name, start_date: startDate, end_date: endDate, options })
            });

            if (response.ok) {
                alert('Enquete atualizada com sucesso!');
                window.location.href = '/'; // Redireciona após sucesso
            } else {
                const data = await response.json();
                alert(`Erro: ${data.error}`);
            }
        } catch (error) {
            console.error('Erro ao salvar a enquete:', error);
            alert('Erro ao salvar a enquete.');
        }
    });
});
