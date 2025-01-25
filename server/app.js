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

//##########################################################################
//##########################################################################
app.get('/list-details/:listId', (req, res) => {
  const { listId } = req.params;

  db.get('SELECT name FROM lists WHERE id = ?', [listId], (err, listRow) => {
    if (err) {
      console.log('Błąd podczas pobierania listy:', err.message);
      return res.status(500).json({ message: 'Błąd serwera' });
    }

    if (!listRow) {
      return res.status(404).json({ message: 'Nie znaleziono listy' });
    }

    db.all('SELECT id, name, checked FROM items WHERE list_id = ?', [listId], (err, items) => {
      if (err) {
        console.log('Błąd podczas pobierania elementów listy:', err.message);
        return res.status(500).json({ message: 'Błąd serwera' });
      }

      res.status(200).json({
        name: listRow.name,
        items: items || [], // Zwracamy pełną listę elementów z `checked`
      });
    });
  });
});




//##########################################################################
//##########################################################################
app.post('/update-item-status', (req, res) => {
  const { itemId, checked } = req.body;

  if (itemId === undefined || checked === undefined) {
    return res.status(400).json({ message: 'Brak wymaganych danych' });
  }

  db.run(
    'UPDATE items SET checked = ? WHERE id = ?',
    [checked ? 1 : 0, itemId],
    function (err) {
      if (err) {
        console.log('Błąd podczas aktualizacji statusu elementu:', err.message);
        return res.status(500).json({ message: 'Błąd serwera' });
      }

      if (this.changes === 0) {
        return res.status(404).json({ message: 'Nie znaleziono elementu' });
      }

      res.status(200).json({ message: 'Status elementu został zaktualizowany' });
    }
  );
});

//##########################################################################
//##########################################################################
app.put('/edit-list/:listId', async (req, res) => {
  const { listId } = req.params;
  const { name, existing_items, new_items } = req.body;

  console.log('[DEBUG] Otrzymane dane wejściowe:', { listId, name, existing_items, new_items });

  // Walidacja danych wejściowych
  if (!listId || !name || !Array.isArray(existing_items)) {
    console.error('[ERROR] Niepoprawne dane wejściowe:', { listId, name, existing_items });
    return res.status(400).json({ message: 'Niepoprawne dane wejściowe.' });
  }

  try {
    // 1. Zaktualizuj nazwę listy
    await db.run('UPDATE lists SET name = ? WHERE id = ?', [name, listId]);
    console.log('[DEBUG] Nazwa listy została zaktualizowana.');

    // 2. Pobierz istniejące elementy
    const existingItems = await new Promise((resolve, reject) => {
      db.all('SELECT id, name, checked FROM items WHERE list_id = ?', [listId], (err, rows) => {
        if (err) reject(err);
        resolve(rows);
      });
    });

    console.log('[DEBUG] Istniejące elementy:', existingItems);

    // Mapa istniejących elementów dla porównań
    const existingItemsMap = new Map(existingItems.map(item => [item.id, item]));
    const itemsToAdd = [];
    const itemsToUpdate = [];
    const existingItemIds = new Set();

    // 3. Przetwarzanie existing_items (istniejące elementy do aktualizacji)
    for (const item of existing_items) {
      if (existingItemsMap.has(item.id)) {
        const existingItem = existingItemsMap.get(item.id);
        if (existingItem.name !== item.name || existingItem.checked !== item.checked) {
          // Jeśli nazwa lub status 'checked' się zmieniły, aktualizujemy element
          itemsToUpdate.push([item.name, item.checked || 0, item.id]);
        }
        existingItemIds.add(item.id);
      }
    }

    // 4. Przetwarzanie new_items (nowe elementy do dodania)
    const itemsToAddFromNewItems = new_items.map(item => [listId, item.name, item.checked || 0]);

    // 5. Elementy do usunięcia
    const itemsToDelete = [...existingItemsMap.keys()].filter(id => !existingItemIds.has(id));

    // Wykonanie operacji w bazie danych
    const queries = [];

    // Dodanie nowych elementów (new_items)
    if (itemsToAddFromNewItems.length > 0) {
      const placeholders = itemsToAddFromNewItems.map(() => '(?, ?, ?)').join(',');
      const values = itemsToAddFromNewItems.flat();
      queries.push(db.run(`INSERT INTO items (list_id, name, checked) VALUES ${placeholders}`, values));
    }

    // Aktualizacja istniejących elementów (existing_items)
    if (itemsToUpdate.length > 0) {
      itemsToUpdate.forEach(([name, checked, id]) => {
        queries.push(db.run('UPDATE items SET name = ?, checked = ? WHERE id = ?', [name, checked, id]));
      });
    }

    // Usunięcie elementów, które zostały usunięte z listy
    if (itemsToDelete.length > 0) {
      const placeholders = itemsToDelete.map(() => '?').join(',');
      queries.push(db.run(`DELETE FROM items WHERE id IN (${placeholders})`, itemsToDelete));
    }

    // Wykonaj wszystkie zapytania w bazie danych
    await Promise.all(queries);

    res.status(200).json({ message: 'Lista została zaktualizowana.' });
  } catch (error) {
    console.error('[ERROR] Błąd podczas edytowania listy:', error);
    return res.status(500).json({ message: 'Błąd serwera' });
  }
});


//##########################################################################
//##########################################################################
app.delete('/edit-list/:listId', async (req, res) => {
  const { listId } = req.params;

  if (!listId) {
    console.error('[ERROR] Brak listId w żądaniu.');
    return res.status(400).json({ message: 'Brak identyfikatora listy.' });
  }

  try {
    // Usuń elementy związane z listą
    await db.run('DELETE FROM items WHERE list_id = ?', [listId]);

    // Usuń samą listę
    await db.run('DELETE FROM lists WHERE id = ?', [listId]);

    console.log('[DEBUG] Lista została usunięta.');

    res.status(200).json({ message: 'Lista została usunięta.' });
  } catch (error) {
    console.error('[ERROR] Błąd podczas usuwania listy:', error);
    return res.status(500).json({ message: 'Błąd serwera' });
  }
});




//##########################################################################
//##########################################################################


  

app.listen(port, () => {
  console.log(`Example app listening on port ${port}`);
});
