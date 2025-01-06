const express = require('express');
const multer = require('multer');
const path = require('path');
const Tesseract = require('tesseract.js');
const cors = require('cors');
const sharp = require('sharp');
const OpenAI = require('openai');
require('dotenv').config();

const apiKey = process.env.API_KEY;

const Database = require('./db.js');
const db = new Database();

setTimeout(() => {
    db.insertKey(process.env.ADMIN_KEY, 99);
    db.insertKey(process.env.TEST_KEY, 20);
}, 1000);

const Menu = require('./menu.js');
const menu = new Menu(db);

const app = express();
app.use(cors());
app.use(express.json());
const openai = new OpenAI({
    apiKey: apiKey,
});

const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'uploads/');
    },
    filename: (req, file, cb) => {
        cb(null, `${Date.now()}-${file.originalname}`);
    },
});

const upload = multer({ storage });

app.post('/upload', upload.single('file'), async (req, res) => {
    const filePath = path.join(__dirname, 'uploads', req.file.filename);
    const token = req.body.token;
    const processedFilePath = `${filePath}-processed.jpg`;

    console.log('Token:', token);

    try {
        const isValid = await db.verifyKey(token);

        if (isValid) {
            // Preprocess image with sharp (resize and convert to grayscale)
            await sharp(filePath)
                .resize(750) // Resize to a width of 750px for better OCR accuracy
                .grayscale() // Convert to grayscale
                .toFile(processedFilePath);

            const { data: { text: ocrText } } = await Tesseract.recognize(processedFilePath, 'eng');

            const gptResponse = await openai.chat.completions.create({
                model: 'gpt-4-turbo',
                messages: [
                    { role: 'system', content: 'You are a rizz assistent app. You will help people rizzing people up on text. You will get some raw OCR text, and then you will output the best possible message to write, with the given context. Your intention is to rizz up the other person. You will ONLY output what the person should response/text, and of course in the language of the context.' },
                    { role: 'user', content: `I will only give me the message to response/text in this scenario. Remember that it is a back and forth conversation. Here is the raw OCR text from the chat:\n\n${ocrText}` },
                ],
            });

            console.log('GPT Response:', gptResponse);
            const gptFinalSuggestion = gptResponse.choices[0].message.content;
            console.log(ocrText);
            console.log(gptFinalSuggestion);

            res.json({ message: 'File uploaded and processed successfully', gptFinalSuggestion });
        } else {
            res.status(401).json({ message: 'Invalid token' });
        }
    } catch (error) {
        console.error('Error during image processing or OCR:', error);
        res.status(500).json({ message: 'Error processing image', error: error.message });
    }
});

app.post('/uses', async (req, res) => {
    const token = req.body.token;
    console.log('Received token:', token);

    try {
        const usesLeft = await db.getUsesLeft(token);
        console.log('Uses left:', usesLeft);

        if (usesLeft !== null) {
            res.json({ usesLeft });
        } else {
            res.status(401).json({ message: 'Invalid token' });
        }
    } catch (error) {
        console.error('Error fetching uses left:', error);
        res.status(500).json({ message: 'Error fetching uses left', error: error.message });
    }
});


app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

app.listen(5500, () => {
    console.log('Server running on http://localhost:5500');
});