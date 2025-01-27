const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const { v4: uuidv4 } = require('uuid');
const CryptoJS = require('crypto-js');
const cors = require('cors');

const app = express();
const port = 3000;

app.use(cors());
app.use(express.json());
require('dotenv').config();

const db = new sqlite3.Database('./database/database.db');

const jwt = require('jsonwebtoken');
const e = require('express');

// Funkcja generująca access_token oraz refresh_token
function generateTokens(userId) {
    const accessToken = jwt.sign({ userId }, process.env.ACCESS_TOKEN_SECRET, { expiresIn: '10s' });
    const refreshToken = jwt.sign({ userId }, process.env.REFRESH_TOKEN_SECRET, { expiresIn: '7d' });
    return { accessToken, refreshToken };
}

function extractToken(token){
  const tokenWithoutBearer = token.startsWith('Bearer ') ? token.slice(7) : token;
  return tokenWithoutBearer;
}

function verifyAccessToken(token) {
  try {
    const decoded = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);
    return decoded;
  } catch (err) {
    return null;
  }
}


async function generateUUID(table, column) {
    let id;
    let exists = true;

    while (exists) {
        id = uuidv4();
        exists = await new Promise((resolve) => {
            db.get(`SELECT 1 FROM ${table} WHERE ${column} = ?`, [id], (err, row) => {
                if (err) throw err;
                resolve(!!row);
            });
        });
    }
    return id;
}

//##########################################################################
//##########################################################################
app.post('/login', (req, res) => {
  const { login, password } = req.body;
  if (!login || !password) return res.status(400).json({ message: 'Podaj login i hasło' });

  db.get('SELECT * FROM user WHERE username = ?', [login], (err, row) => {
    if (err) return res.status(500).json({ message: 'Błąd bazy danych' });

    if (!row) return res.status(404).json({ message: 'Niepoprawne dane logowania' });

    const passwordHash = CryptoJS.SHA256(password).toString();
    if (passwordHash === row.password) {
      const { accessToken, refreshToken } = generateTokens(row.id);
      return res.status(200).json({ accessToken, refreshToken });
    } else {
      return res.status(401).json({ message: 'Błędne hasło' });
    }
  });
});


//##########################################################################
//##########################################################################
app.post('/refresh-token', (req, res) => {
  console.log("refresh token endpoint working");
  var { refreshToken } = req.body;
  refreshToken = extractToken(refreshToken);

  if (!refreshToken) return res.status(400).json({ message: 'Brak refresh tokenu' });

  jwt.verify(refreshToken, process.env.REFRESH_TOKEN_SECRET, (err, decoded) => {
    if (err) return res.status(403).json({ message: 'Refresh token jest nieważny' });

    const accessToken = generateTokens(decoded.userId);
    res.json( accessToken );
  });
});



//##########################################################################
//##########################################################################
app.post('/add-list', async (req, res) => {
    const { name, items, username } = req.body;

    var token = req.headers['authorization'];
    token = extractToken(token);
    //console.log('[serwer] token', { token });

    if (!token) return res.status(403).json({ message: 'Brak tokenu' });
  
    const decoded = verifyAccessToken(token);
    if (!decoded) return res.status(401).json({ message: 'Token jest nieważny' });

    if (!name || !items || items.length === 0 || !username) {
        return res.status(400).json({ message: 'Brak wymaganych danych' });
    }

    db.get('SELECT id FROM user WHERE username = ?', [username], async (err, row) => {
        if (err) {
            console.error('Błąd podczas wyszukiwania użytkownika:', err.message);
            return res.status(500).json({ message: 'Błąd serwera' });
        }

        if (!row) {
            return res.status(404).json({ message: 'Nie znaleziono użytkownika' });
        }

        const userId = row.id;

        try {
            const listId = await generateUUID('lists', 'id');
            db.run('INSERT INTO lists (id, name, user_id) VALUES (?, ?, ?)', [listId, name, userId], (err) => {
                if (err) {
                    console.error('Błąd podczas dodawania listy:', err.message);
                    return res.status(500).json({ message: 'Nie udało się dodać listy' });
                }

                const itemPromises = items.map(async (item) => {
                    const itemId = await generateUUID('items', 'id');
                    return new Promise((resolve, reject) => {
                        db.run(
                            'INSERT INTO items (id, list_id, name, checked) VALUES (?, ?, ?, ?)',
                            [itemId, listId, item.name, item.checked ? 1 : 0],
                            (err) => {
                                if (err) reject(err);
                                resolve();
                            }
                        );
                    });
                });

                Promise.all(itemPromises)
                    .then(() => res.status(201).json({ message: 'Lista została dodana', listId }))
                    .catch((err) => {
                        console.error('Błąd podczas dodawania elementów:', err.message);
                        res.status(500).json({ message: 'Nie udało się dodać elementów do listy' });
                    });
            });
        } catch (err) {
            console.error('Błąd generowania UUID:', err.message);
            res.status(500).json({ message: 'Błąd serwera' });
        }
    });
});

//##########################################################################
//##########################################################################
app.get('/user-lists/:username', (req, res) => {
    const { username } = req.params;

    var token = req.headers['authorization'];
    token = extractToken(token);

    if (!token) return res.status(403).json({ message: 'Brak tokenu' });
  
    const decoded = verifyAccessToken(token);
    if (!decoded) return res.status(401).json({ message: 'Token jest nieważny' });

    db.get('SELECT id FROM user WHERE username = ?', [username], (err, userRow) => {
        if (err) {
            console.error('Błąd wyszukiwania użytkownika:', err.message);
            return res.status(500).json({ message: 'Błąd serwera' });
        }

        if (!userRow) {
            return res.status(404).json({ message: 'Nie znaleziono użytkownika' });
        }

        const userId = userRow.id;
        db.all('SELECT id, name FROM lists WHERE user_id = ?', [userId], (err, rows) => {
            if (err) {
                console.error('Błąd pobierania list:', err.message);
                return res.status(500).json({ message: 'Błąd serwera' });
            }

            res.status(200).json({ lists: rows });
        });
    });
});

//##########################################################################
//##########################################################################
app.get('/list-details/:listId', (req, res) => {
  const { listId } = req.params;

  var token = req.headers['authorization'];
  token = extractToken(token);

  if (!token) return res.status(403).json({ message: 'Brak tokenu' });

  const decoded = verifyAccessToken(token);
  if (!decoded) return res.status(401).json({ message: 'Token jest nieważny' });

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
        items: items || [],
      });
    });
  });
});




//##########################################################################
//##########################################################################
app.post('/update-item-status', (req, res) => {
  const { itemId, checked } = req.body;

  var token = req.headers['authorization'];
  token = extractToken(token);

  if (!token) return res.status(403).json({ message: 'Brak tokenu' });

  const decoded = verifyAccessToken(token);
  if (!decoded) return res.status(401).json({ message: 'Token jest nieważny' });


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

  var token = req.headers['authorization'];
  token = extractToken(token);

  if (!token) return res.status(403).json({ message: 'Brak tokenu' });

  const decoded = verifyAccessToken(token);
  if (!decoded) return res.status(401).json({ message: 'Token jest nieważny' });

  console.log('[DEBUG] Otrzymane dane wejściowe:', { listId, name, existing_items, new_items });

  if (!listId || !name || !Array.isArray(existing_items) || !Array.isArray(new_items)) {
    console.error('[ERROR] Niepoprawne dane wejściowe:', { listId, name, existing_items, new_items });
    return res.status(400).json({ message: 'Niepoprawne dane wejściowe.' });
  }

  try {
    await db.run('UPDATE lists SET name = ? WHERE id = ?', [name, listId]);
    console.log('[DEBUG] Nazwa listy została zaktualizowana.');

    const existingItems = await new Promise((resolve, reject) => {
      db.all('SELECT id, name, checked FROM items WHERE list_id = ?', [listId], (err, rows) => {
        if (err) reject(err);
        resolve(rows);
      });
    });

    console.log('[DEBUG] Istniejące elementy:', existingItems);

    const existingItemsMap = new Map(existingItems.map(item => [item.id, item]));
    const itemsToUpdate = [];
    const existingItemIds = new Set();

    for (const item of existing_items) {
      if (existingItemsMap.has(item.id)) {
        const existingItem = existingItemsMap.get(item.id);
        if (existingItem.name !== item.name || existingItem.checked !== item.checked) {
          itemsToUpdate.push([item.name, item.checked || 0, item.id]);
        }
        existingItemIds.add(item.id);
      }
    }

    const itemsToAddFromNewItems = [];
    for (const item of new_items) {
      const id = await generateUUID('items', 'id');
      itemsToAddFromNewItems.push([id, listId, item.name, item.checked || 0]);
    }

    const itemsToDelete = [...existingItemsMap.keys()].filter(id => !existingItemIds.has(id));

    const queries = [];

    if (itemsToAddFromNewItems.length > 0) {
      const placeholders = itemsToAddFromNewItems.map(() => '(?, ?, ?, ?)').join(',');
      const values = itemsToAddFromNewItems.flat();
      queries.push(db.run(`INSERT INTO items (id, list_id, name, checked) VALUES ${placeholders}`, values));
    }

    if (itemsToUpdate.length > 0) {
      itemsToUpdate.forEach(([name, checked, id]) => {
        queries.push(db.run('UPDATE items SET name = ?, checked = ? WHERE id = ?', [name, checked, id]));
      });
    }

    if (itemsToDelete.length > 0) {
      const placeholders = itemsToDelete.map(() => '?').join(',');
      queries.push(db.run(`DELETE FROM items WHERE id IN (${placeholders})`, itemsToDelete));
    }

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
  
  var token = req.headers['authorization'];
  token = extractToken(token);

  if (!token) return res.status(403).json({ message: 'Brak tokenu' });

  const decoded = verifyAccessToken(token);
  if (!decoded) return res.status(401).json({ message: 'Token jest nieważny' });


  if (!listId) {
    console.error('[ERROR] Brak listId w żądaniu.');
    return res.status(400).json({ message: 'Brak identyfikatora listy.' });
  }

  try {
    await db.run('DELETE FROM items WHERE list_id = ?', [listId]);
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
