const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const app = express();
const port = 3000;
const CryptoJS = require('crypto-js');
const cors = require('cors');

app.use(cors()); 
app.use(express.json()); 

const db = new sqlite3.Database('./database/database.db');

app.get('/', (req, res) => {
  res.send('Hello World!');
});

app.post('/register', (req, res) => {
    console.log("Otrzymane dane:", req.body); 
    const { username, password } = req.body;

    if (!username || !password) {
        return res.status(400).send('Podaj username i hasło');
    }

    const passwordHash = CryptoJS.SHA256(password).toString();

    const stmt = db.prepare('INSERT INTO user (username, password) VALUES (?, ?)');

    stmt.run(username, passwordHash, function(err) {
        if (err) {
            console.log("Podany username jest zajęty: ", err.message);
            return res.status(500).json({
                success: false,
                message: 'Podany username jest zajęty'
            });
        }

        console.log(`User ${username} added with ID: ${this.lastID}`);
        return res.status(201).json({
            success: true,
            message: 'Utworzono konto'
        });
    });
});

app.post('/login', (req, res) => {
    const { login, password } = req.body;

    if (!login || !password) {
        return res.status(400).json({
            success: false,
            message: 'Podaj hasło i login'
        });
    }

    db.get('SELECT * FROM user WHERE username = ?', [login], (err, row) => {
        if (err) {
            console.log('Błąd podczas pobierania danych z bazy danych: ', err.message);
            return res.status(500).json({
                success: false,
                message: 'Błąd podczas pobierania danych z bazy danych'
            });
        }

        if (!row) {
            return res.status(404).json({
                success: false,
                message: 'Niepoprawne dane logowania'
            });
        }

        const passwordHash = CryptoJS.SHA256(password).toString();

        if (passwordHash === row.password) {
            return res.status(200).json({
                success: true,
                username: row.username,
                message: 'Zalogowano na konto ' + row.username,
            });
        } else {
            return res.status(401).json({
                success: false,
                message: 'Błędne hasło'
            });
        }
    });
});

app.listen(port, () => {
  console.log(`Example app listening on port ${port}`);
});
