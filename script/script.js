document.addEventListener('DOMContentLoaded', () => {
    const addOptionBtn = document.getElementById('addOptionBtn');
    const createPollBtn = document.getElementById('createPollBtn');
    const optionsContainer = document.getElementById('options-container');
  
    addOptionBtn.addEventListener('click', () => {
      const newOption = document.createElement('input');
      newOption.type = 'text';
      newOption.classList.add('inptname');
      newOption.placeholder = 'Coloque uma opção';
      optionsContainer.appendChild(newOption);
    });
  
    createPollBtn.addEventListener('click', async (event) => {
      event.preventDefault();
  
      const name = document.getElementById('name').value;
      const startDate = document.getElementById('startDate').value;
      const endDate = document.getElementById('endDate').value;
  
      const options = [...optionsContainer.getElementsByTagName('input')].map(input => input.value).filter(option => option.trim() !== "");
  
      if (options.length < 3) {
        alert("Por favor, preencha pelo menos 3 opções.");
        return;
      }
  
      const pollData = {
        name: name,
        options: options,
        start_date: startDate,
        end_date: endDate
      };
  
      try {
        const response = await fetch('http://localhost:3000/polls', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(pollData)
        });
  
        if (response.ok) {
          alert('Enquete criada com sucesso!');
          resetForm();
        } else {
          alert('Erro ao criar a enquete.');
        }
      } catch (error) {
        console.error('Request error:', error);
        alert('Erro ao criar a enquete.');
      }
    });
  
    function resetForm() {
      document.getElementById('name').value = '';
      document.getElementById('startDate').value = '';
      document.getElementById('endDate').value = '';
      optionsContainer.innerHTML = `
        <input type="text" name="options_0" class="inptname" placeholder="Coloque uma opção" required>
        <input type="text" name="options_1" class="inptname" placeholder="Coloque uma opção" required>
        <input type="text" name="options_2" class="inptname" placeholder="Coloque uma opção" required>
      `;
    }
  });
  