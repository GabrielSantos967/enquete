document.addEventListener('DOMContentLoaded', async () => {
    const enquetesContainer = document.querySelector('.enquetes');

    if (!enquetesContainer) {
        console.error('Elemento .enquetes não encontrado.');
        return;
    }

    try {
        // Fazendo a requisição para pegar as enquetes
        const response = await fetch('http://localhost:3000/polls');
        const polls = await response.json();

        // Verificando se há enquetes
        if (polls && polls.length > 0) {
            polls.forEach(poll => {
                const pollElement = document.createElement('div');
                pollElement.classList.add('poll');

                // Convertendo as datas para objetos Date
                const startDate = new Date(poll.start_date);
                const endDate = new Date(poll.end_date);
                const currentDate = new Date();

                // Formatando as datas para o formato "DD/MM/YYYY"
                const formattedStartDate = startDate.toLocaleDateString('pt-BR', {
                    day: '2-digit',
                    month: '2-digit',
                    year: 'numeric'
                });

                const formattedEndDate = endDate.toLocaleDateString('pt-BR', {
                    day: '2-digit',
                    month: '2-digit',
                    year: 'numeric'
                });

                // Verificando se a data de finalização é maior que a data atual e a data de início é menor que a data atual
                const isVoteDisabled = startDate > currentDate || endDate < currentDate;

                pollElement.innerHTML = `
                    <h3>${poll.name}</h3>
                    <p>Data inicial: ${formattedStartDate}</p>
                    <p>Data final: ${formattedEndDate}</p>
                    <div class="options">
                        ${poll.options.map(option => `
                            <label>
                                <input type="radio" name="poll_${poll.id}" value="${option.id}">
                                ${option.option_text} - Votos: ${option.votes}
                            </label><br>
                        `).join('')}
                    </div>
                    <button class="btnvote" data-poll-id="${poll.id}" ${isVoteDisabled ? 'disabled' : ''}>Votar</button>
                    <button class="btnEditPoll" data-poll-id="${poll.id}">Editar</button>
                    <button class="btnDeletePoll" data-poll-id="${poll.id}">Excluir Enquete</button>
                `;
                enquetesContainer.appendChild(pollElement);
            });
        } else {
            enquetesContainer.innerHTML = '<p>Nenhuma enquete disponível.</p>';
        }
    } catch (error) {
        console.error('Erro ao carregar as enquetes:', error);
        enquetesContainer.innerHTML = '<p>Erro ao carregar as enquetes.</p>';
    }

    // Adicionando a funcionalidade de votação, edição e exclusão
    enquetesContainer.addEventListener('click', async (event) => {
        const pollId = event.target.getAttribute('data-poll-id');

        // Lógica para votar
        if (event.target.classList.contains('btnvote')) {
            const selectedOption = document.querySelector(`input[name="poll_${pollId}"]:checked`);

            if (!selectedOption) {
                alert('Por favor, selecione uma opção antes de votar.');
                return;
            }

            const optionId = selectedOption.value;

            try {
                const response = await fetch(`http://localhost:3000/vote`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        poll_id: pollId,
                        option_id: optionId,
                    })
                });

                if (response.ok) {
                    alert('Voto contabilizado com sucesso!');
                    location.reload(); // Recarregar para atualizar os votos
                } else {
                    alert('Erro ao contabilizar o voto.');
                }
            } catch (error) {
                console.error('Erro ao votar:', error);
                alert('Erro ao votar.');
            }
        }

        // Lógica para excluir a enquete
        if (event.target.classList.contains('btnDeletePoll')) {
            const confirmation = confirm('Tem certeza de que deseja excluir esta enquete?');
            if (!confirmation) return;

            try {
                const response = await fetch(`http://localhost:3000/polls/${pollId}`, {
                    method: 'DELETE',
                });

                if (response.ok) {
                    alert('Enquete excluída com sucesso!');
                    const pollElement = event.target.closest('.poll');
                    if (pollElement) pollElement.remove();
                } else {
                    alert('Erro ao excluir a enquete.');
                }
            } catch (error) {
                console.error('Erro ao excluir a enquete:', error);
                alert('Erro ao excluir a enquete.');
            }
        }

        // Lógica para editar a enquete (redirecionamento)
        if (event.target.classList.contains('btnEditPoll')) {
            window.location.href = `editar-enquete.html?id=${pollId}`;
        }
    });
});
