const express = require('express');
const path = require('path');
const axios = require('axios');
require('dotenv').config();
const jwt = require('jsonwebtoken');

const app = express();
app.use(express.json());
const PORT = process.env.PORT || 3000;

app.use(express.static(path.join(__dirname, 'public')));
app.set('view engine', 'ejs');

let isAdmin = false;

app.get('/index', (req, res) => {
    res.render('index');
});

app.get('/opening', (req, res) => {
    res.render('opening');
});

app.get('/chats', (req, res) => {
    res.render('chatAI');
});

app.get('/', (req, res) => {
    res.render('test');
});

app.get('/dashboards', (req, res) => {
    try {
        if(isAdmin){
            res.render('dashboards');
        } else {
            res.status(401).json({ message: "Akses ditolak" });
        }
    } catch (e){
        res.status(500).json({ message: "Terjadi kesalahan saat membuka dashbor." });
    }
})

// API Chat
app.post('/histories', async (req, res) => {
    try{
        const {historyName, status, userId} = req.body;
        const token = req.headers.authorization;
        const response = await fetch(process.env.HISTORY_API_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({ historyName,status, userId })
        })
        const contentType = response.headers.get("content-type");
        if (contentType && contentType.includes("application/json")) {
            const data = await response.json();
            res.status(response.status).json(data);
        } else {
            const text = await response.text();
            res.status(response.status).json({ message: text });
        }
    }catch (error) {
        console.error("Error:", error);
        res.status(500).json({ message: "Terjadi kesalahan saat membuat history." });
    }
});
app.delete('/histories/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const token = req.headers.authorization;

        const response = await fetch(`${process.env.HISTORY_API_URL}/${id}`, {
            method: 'DELETE',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            }
        });

        const contentType = response.headers.get("content-type");
        if (contentType && contentType.includes("application/json")) {
            const data = await response.json();
            console.log("Deleted data:", data);
            res.status(response.status).json(data);
        } else {
            const text = await response.text();
            res.status(response.status).json({ message: text });
        }
    } catch (error) {
        console.error("Error:", error);
        res.status(500).json({ message: "Terjadi kesalahan saat menghapus history." });
    }
});
app.get('/history-lists/:userId', async (req, res) =>{
    try{
        const historyList = process.env.HISTORYLIST_API_URL;
        const token = req.headers.authorization;
        const userId = req.params.userId;
        const response = await fetch(`${historyList}${userId}`,{
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            }
        })
        if (!response.ok) {
            throw new Error('Gagal mengambil daftar chat');
        }
        const data = await response.json(); 
        res.status(200).json(data);
    }catch (error) {
        console.error(error);
    }
})
app.put('/histories/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const token = req.headers.authorization;
        const {historyName, status, userId} = req.body;

        const response = await fetch(`${process.env.HISTORY_API_URL}/${id}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({ historyName, status, userId})
        });

        const contentType = response.headers.get("content-type");
        if (contentType && contentType.includes("application/json")) {
            const data = await response.json();
            res.status(response.status).json(data);
        } else {
            const text = await response.text();
            res.status(response.status).json({ message: text });
        }
    } catch (error) {
        console.error("Error:", error);
        res.status(500).json({ message: "Terjadi kesalahan saat memperbarui history." });
    }
});

app.post('/bot', async (req,res ) => {
    try {
        const { message, token_jwt, historyId } = req.body; 
        console.log('history', historyId);
        const response = await fetch(process.env.BOT_API_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token_jwt}`
            },
            body: JSON.stringify({ 'chat': message, 'historyId': historyId })
        });

        const contentType = response.headers.get("content-type");
        if (contentType && contentType.includes("application/json")) {
            const data = await response.json();
            res.status(response.status).json(data);
        } else {
            const text = await response.text();
            res.status(response.status).json({ message: text });
        }
    } catch (error) {
        res.status(500).json({ message: "Terjadi kesalahan saat menghubungi bot." });
    }
});

// authentikasi API
app.get('/register', (req, res) => {
    res.render('register')
})
app.post('/api/register', async (req, res) => {
    try {
        const response = await fetch(process.env.REGISTER_API_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(req.body),
        });
        const contentType = response.headers.get("content-type");
        if (contentType && contentType.includes("application/json")) {
            const data = await response.json();
            res.status(response.status).json(data);
        } else {
            const text = await response.text();
            res.status(response.status).json({ message: text });
        }
    } catch (error) {
        res.status(500).json({ message: "Terjadi kesalahan saat melakukan pendaftaran." });
    }
});

app.get('/login', (req, res) => {
    res.render('login');
});
app.post('/api/login', async (req, res) => {
    try {
        const response = await fetch(process.env.LOGIN_API_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(req.body),
        });
        const contentType = response.headers.get("content-type");
        if (contentType && contentType.includes("application/json")) {
            const data = await response.json();
            res.status(response.status).json(data);
            const role = jwt.decode(data.token).role;
            isAdmin = role === 'ADMIN';
        } else {
            res.status(response.status).json({ message: "Terjadi kesalahan saat melakukan masuk." });
        }
    } catch (error) {
        res.status(500).json({ message: "Terjadi kesalahan saat melakukan masuk." });
    }
});

app.get('/chat-history/:historyId', async (req, res) =>{
    try{
        const chatHistory = process.env.CHATHISTORY_API_URL;
        const token = req.headers.authorization;
        const historyId = req.params.historyId;
        const response = await fetch(`${chatHistory}${historyId}`,{
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            }
        })
        if (!response.ok) {
            throw new Error('Gagal mengambil daftar chat');
        }
        const data = await response.json();
        res.status(200).json(data);
    }catch (error) {
        console.error(error);
    }
})

app.get('/verify', (req, res) => {
    res.render('verify')
})

app.get('/response', (req, res) => {
    res.render('response')
})

//Dashboard API
app.get('/active-users', async (req, res) =>{
    try{
        const token = req.headers.authorization;
        const response = await fetch(process.env.TOTAL_ACTIVE_USER,{
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            }
        })
        if (!response.ok) {
            throw new Error('Gagal mengambil jumlah user aktif');
        }
        const data = await response.json();
        res.status(200).json(data);
    }catch (error) {
        console.error(error);
    }
})

app.get('/total-chats', async (req, res) =>{
    try{
        const response = await fetch(process.env.TOTAL_CHATS)
        if (!response.ok) {
            throw new Error('Gagal mengambil jumlah percakapan');
        }
        const data = await response.json();
        res.status(200).json(data);
    }catch (error) {
        console.error(error);
    }
})

app.get('/total-response', async (req, res) =>{
    try{
        const response = await fetch(process.env.TOTAL_RESPONSE_BOT)
        if (!response.ok) {
            throw new Error('Gagal mengambil jumlah respon bot');
        }
        const data = await response.json();
        res.status(200).json(data);
    }catch (error) {
        console.error(error);
    }
})

app.get('/total-history', async (req, res) =>{
    try{
        const response = await fetch(process.env.TOTAL_HISTORY)
        if (!response.ok) {
            throw new Error('Gagal mengambil jumlah History');
        }
        const data = await response.json();
        res.status(200).json(data);
    }catch (error) {
        console.error(error);
    }
})


app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});
