const express = require('express');
const multer = require('multer');
const { imageSize } = require('image-size');
const cors = require('cors');

const app = express();
const port = process.env.PORT || 3000;

app.use(cors());
app.use(express.static('public'));

const storage = multer.memoryStorage();
const upload = multer({ 
    storage: storage,
    limits: { fileSize: 10 * 1024 * 1024 }
}).single('image');

// Маршрут /login
app.get('/login', (req, res) => {
    res.json({ "author": "1160468" });
});

// Маршрут /size2json
app.post('/size2json', (req, res) => {
    upload(req, res, (err) => {
        // 1. Обработка ошибок загрузки (включая проверку на размер)
        if (err instanceof multer.MulterError) {
            if (err.code === 'LIMIT_FILE_SIZE') {
                console.log("Error: File exceeds the size limit.");
                // Отправляем специальный ответ, если файл слишком большой
                return res.status(400).json({ "result": "File too large" });
            }
            console.log("Multer error (form format):", err.message);
            return res.status(400).json({ "result": "invalid filetype" });
        } else if (err) {
            console.log("Server error during upload:", err.message);
            return res.status(500).json({ "result": "server error" });
        }

        // 2. Проверка наличия файла
        if (!req.file) {
            console.log("Error: File not found. Make sure the form field is named 'image'.");
            return res.status(400).json({ "result": "invalid filetype" });
        }

        // 3. Проверка MIME-типа (то, как браузер определяет файл)
        if (req.file.mimetype !== 'image/png') {
            console.log("Error: Invalid MIME type. Expected image/png, but got:", req.file.mimetype);
            return res.status(400).json({ "result": "invalid filetype" });
        }

        // 4. Определение реальных размеров и проверка подлинности PNG
        try {
            const dimensions = imageSize(req.file.buffer);
            console.log("Success: Dimensions and real type determined:", dimensions);
            
            // Если расширение .png, но внутренности файла от другого формата (например, JPG)
            if (dimensions.type !== 'png') {
                console.log(`Error: Fake PNG detected. Extension is .png, but real format is: ${dimensions.type}`);
                return res.status(400).json({ "result": "invalid filetype" });
            }

            // Успешный ответ
            res.json({
                "width": dimensions.width,
                "height": dimensions.height
            });
        } catch (error) {
            // Срабатывает, если файл поврежден и image-size не может его прочитать
            console.log("Error reading file with image-size library:", error.message);
            res.status(400).json({ "result": "invalid filetype" });
        }
    });
});

app.listen(port, () => {
    console.log(`Сервер запущен: http://localhost:${port}`);
});