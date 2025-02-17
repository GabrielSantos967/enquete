require('dotenv').config();
const express = require('express');
const cors = require('cors');
const mysql = require('mysql2/promise');

const app = express();
const port = process.env.PORT || 3000;

app.use(cors());
app.use(express.json()); // Permite receber JSON no body das requisições

// Conexão com MySQL
const db = mysql.createPool({
    host: 'localhost',
    user: 'root',
    password: '',
    database: 'enquetes',
    port: 3307
});

// Rota de teste
app.post('/polls', async (req, res) => {
    const { name, start_date, end_date, options } = req.body;

    if (!name || !start_date || !end_date || !options || options.length < 3) {
        return res.status(400).json({ error: 'Todos os campos são obrigatórios e a enquete precisa de pelo menos 3 opções.' });
    }

    const pollQuery = 'INSERT INTO polls (name, start_date, end_date) VALUES (?, ?, ?)';
    try {
        const [result] = await db.query(pollQuery, [name, start_date, end_date]);

        const pollId = result.insertId;
        const optionQueries = options.map(option => [pollId, option]);

        const optionQuery = 'INSERT INTO poll_options (poll_id, option_text) VALUES ?';
        await db.query(optionQuery, [optionQueries]);

        res.status(201).json({ message: 'Enquete criada com sucesso!' });
    } catch (err) {
        console.error('Erro ao criar a enquete', err);
        return res.status(500).json({ error: 'Erro ao criar a enquete' });
    }
});

// Rota para obter as enquetes
app.get('/polls', async (req, res) => {
    const query = `
        SELECT p.id, p.name, p.start_date, p.end_date, 
               o.id AS option_id, o.option_text, 
               IFNULL(vote_count, 0) AS votes
        FROM polls p
        LEFT JOIN poll_options o ON p.id = o.poll_id
        LEFT JOIN (SELECT poll_option_id, COUNT(*) AS vote_count 
                   FROM votes GROUP BY poll_option_id) v 
               ON o.id = v.poll_option_id
    `;

    try {
        const [results] = await db.query(query);

        const polls = results.reduce((acc, row) => {
            const { id, name, start_date, end_date, option_id, option_text, votes } = row;

            let poll = acc.find(p => p.id === id);
            if (!poll) {
                poll = { id, name, start_date, end_date, options: [] };
                acc.push(poll);
            }

            if (option_id && option_text) {
                poll.options.push({ id: option_id, option_text, votes });
            }

            return acc;
        }, []);

        res.status(200).json(polls);
    } catch (err) {
        console.error('Erro ao buscar enquetes:', err);
        return res.status(500).json({ error: 'Erro ao buscar enquetes' });
    }
});

// Rota para obter uma enquete específica
app.get('/polls/:id', async (req, res) => {
    const pollId = req.params.id;

    try {
        const [poll] = await db.query('SELECT * FROM polls WHERE id = ?', [pollId]);

        if (poll.length === 0) {
            return res.status(404).json({ error: 'Enquete não encontrada' });
        }

        const [options] = await db.query('SELECT * FROM poll_options WHERE poll_id = ?', [pollId]);

        res.json({
            id: poll[0].id,
            name: poll[0].name,
            start_date: poll[0].start_date,
            end_date: poll[0].end_date,
            options: options
        });
    } catch (error) {
        console.error('Erro ao buscar enquete:', error);
        res.status(500).json({ error: 'Erro interno no servidor' });
    }
});

// Rota para contabilizar o voto
app.post('/vote', async (req, res) => {
    const { poll_id, option_id } = req.body;

    if (!poll_id || !option_id) {
        return res.status(400).json({ error: 'Poll ID e Option ID são obrigatórios.' });
    }

    try {
        const insertVoteQuery = 'INSERT INTO votes (poll_option_id) VALUES (?)';
        await db.query(insertVoteQuery, [option_id]);

        const updateVotesQuery = 'UPDATE poll_options SET votes = votes + 1 WHERE id = ?';
        await db.query(updateVotesQuery, [option_id]);

        res.status(200).json({ message: 'Voto contabilizado com sucesso!' });
    } catch (err) {
        console.error('Erro ao contabilizar o voto:', err);
        return res.status(500).json({ error: 'Erro ao contabilizar o voto.' });
    }
});

// Rota para excluir uma enquete
app.delete('/polls/:pollId', async (req, res) => {
    const { pollId } = req.params;

    try {
        const deletePollQuery = 'DELETE FROM polls WHERE id = ?';
        const [result] = await db.query(deletePollQuery, [pollId]);

        if (result.affectedRows === 0) {
            return res.status(404).json({ error: 'Enquete não encontrada.' });
        }

        res.status(200).json({ message: 'Enquete excluída com sucesso!' });
    } catch (err) {
        console.error('Erro ao excluir a enquete:', err);
        return res.status(500).json({ error: 'Erro ao excluir a enquete.' });
    }
});

// Rota para atualizar uma enquete
app.put('/polls/:id', async (req, res) => {
    const pollId = req.params.id;
    const { name, start_date, end_date, options } = req.body;

    if (!name || !start_date || !end_date || !options || options.length < 3) {
        return res.status(400).json({ error: 'Todos os campos são obrigatórios e a enquete precisa de pelo menos 3 opções.' });
    }

    try {
        const updatePollQuery = 'UPDATE polls SET name = ?, start_date = ?, end_date = ? WHERE id = ?';
        await db.query(updatePollQuery, [name, start_date, end_date, pollId]);

        await db.query('DELETE FROM poll_options WHERE poll_id = ?', [pollId]);

        const optionQueries = options.map(option => [pollId, option]);
        const optionQuery = 'INSERT INTO poll_options (poll_id, option_text) VALUES ?';
        await db.query(optionQuery, [optionQueries]);

        res.status(200).json({ message: 'Enquete atualizada com sucesso!' });
    } catch (err) {
        console.error('Erro ao atualizar a enquete', err);
        return res.status(500).json({ error: 'Erro ao atualizar a enquete' });
    }
});

// Iniciar servidor
app.listen(port, () => {
    console.log(`Servidor rodando em http://localhost:${port}`);
});
