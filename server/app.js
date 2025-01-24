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

//##########################################################################
//##########################################################################

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

//##########################################################################
//##########################################################################

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


//##########################################################################
//##########################################################################

app.post('/add-list', (req, res) => {
    const { name, items, username } = req.body;
  
    if (!name || !items || items.length === 0 || !username) {
      return res.status(400).json({ message: 'Brak wymaganych danych' });
    }
  
    // Pobierz ID użytkownika na podstawie nazwy użytkownika
    db.get('SELECT id FROM user WHERE username = ?', [username], (err, row) => {
      if (err) {
        console.log('Błąd podczas wyszukiwania użytkownika: ', err.message);
        return res.status(500).json({ message: 'Błąd serwera' });
      }
  
      if (!row) {
        return res.status(404).json({ message: 'Nie znaleziono użytkownika' });
      }
  
      const userId = row.id;
  
      // Dodaj nową listę do tabeli 'lists'
      db.run('INSERT INTO lists (name) VALUES (?)', [name], function (err) {
        if (err) {
          console.log('Błąd podczas dodawania listy: ', err.message);
          return res.status(500).json({ message: 'Nie udało się dodać listy' });
        }
  
        const listId = this.lastID;
  
        // Powiąż listę z użytkownikiem w tabeli 'users_lists'
        db.run('INSERT INTO users_lists (user_id, list_id) VALUES (?, ?)', [userId, listId], (err) => {
          if (err) {
            console.log('Błąd podczas przypisywania listy: ', err.message);
            return res.status(500).json({ message: 'Nie udało się przypisać listy do użytkownika' });
          }
  
          // Dodaj elementy do listy w tabeli 'items'
          const itemQueries = items.map((item) => ({
            query: 'INSERT INTO items (list_id, name) VALUES (?, ?)',
            params: [listId, item],
          }));
  
          // Wykonaj wszystkie zapytania do tabeli 'items'
          const executeItems = itemQueries.map(({ query, params }) =>
            new Promise((resolve, reject) => {
              db.run(query, params, (err) => {
                if (err) reject(err);
                resolve();
              });
            })
          );
  
          Promise.all(executeItems)
            .then(() => res.status(201).json({ message: 'Lista została dodana i przypisana do użytkownika' }))
            .catch((err) => {
              console.log('Błąd podczas dodawania elementów: ', err.message);
              res.status(500).json({ message: 'Nie udało się dodać elementów do listy' });
            });
        });
      });
    });
  });
  
//##########################################################################
//##########################################################################

  app.get('/user-lists/:username', (req, res) => {
    const { username } = req.params;
  
    // Pobierz ID użytkownika na podstawie nazwy użytkownika
    db.get('SELECT id FROM user WHERE username = ?', [username], (err, userRow) => {
      if (err) {
        console.log('Błąd podczas wyszukiwania użytkownika: ', err.message);
        return res.status(500).json({ message: 'Błąd serwera' });
      }
  
      if (!userRow) {
        return res.status(404).json({ message: 'Nie znaleziono użytkownika' });
      }
  
      const userId = userRow.id;
  
      // Pobierz listy przypisane do użytkownika
      const query = `
        SELECT lists.id, lists.name
        FROM lists
        INNER JOIN users_lists ON lists.id = users_lists.list_id
        WHERE users_lists.user_id = ?;
      `;
  
      db.all(query, [userId], (err, rows) => {
        if (err) {
          console.log('Błąd podczas pobierania list użytkownika: ', err.message);
          return res.status(500).json({ message: 'Błąd podczas pobierania list' });
        }
  
        if (!rows || rows.length === 0) {
          return res.status(404).json({ message: 'Brak list przypisanych do tego użytkownika' });
        }
  
        // Zwracamy listy użytkownika
        res.status(200).json({ lists: rows });
      });
    });
  });
  
  

app.listen(port, () => {
  console.log(`Example app listening on port ${port}`);
});
