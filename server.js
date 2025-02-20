const express = require("express");
const fs = require("fs").promises;
const cors = require('cors');
const app = express();

app.use(cors());
app.use(express.json());
app.use(express.static("public"));

// Sử dụng /tmp/data.json để lưu trữ dữ liệu (chỉ cho mục đích thử nghiệm)
const DATA_FILE = "/tmp/data.json";

// Middleware to ensure data file exists
app.use(async (req, res, next) => {
    try {
        await fs.access(DATA_FILE);
        next();
    } catch (error) {
        console.warn("Data file not found, creating a new one.");
        try {
            await fs.writeFile(DATA_FILE, "[]");
            next();
        } catch (writeError) {
            console.error("Error creating data file:", writeError);
            return res.status(500).send("Lỗi tạo file dữ liệu");
        }
    }
});

// Đọc danh sách hồ sơ
app.get("/get-records", async (req, res) => {
    try {
        console.log("Attempting to read data from:", DATA_FILE);
        const data = await fs.readFile(DATA_FILE, "utf8");
        console.log("Data read successfully:", data);
        res.json(JSON.parse(data));
    } catch (err) {
        console.error("Lỗi đọc dữ liệu:", err);
        console.error("Stack trace:", err.stack);
        return res.status(500).send(`Lỗi đọc dữ liệu: ${err.message}`);
    }
});

app.post("/add-record", async (req, res) => {
    const newRecord = req.body;
    console.log("Received new record:", newRecord);

    try {
        console.log("Attempting to read data from:", DATA_FILE);
        const data = await fs.readFile(DATA_FILE, "utf8");
        console.log("Data read successfully:", data);
        let records;
        try {
            records = JSON.parse(data);
        } catch (parseError) {
            console.error("Error parsing JSON:", parseError);
            records = []; // Tạo một array rỗng nếu parse lỗi
        }

        records.push(newRecord);

        console.log("Records being saved:", records);

        const jsonData = JSON.stringify(records, null, 2);

        console.log("Attempting to write data to:", DATA_FILE);
        await fs.writeFile(DATA_FILE, jsonData);
        console.log("Successfully saved to:", DATA_FILE);

        res.status(201).send("Hồ sơ đã lưu");
    } catch (err) {
        console.error("Error saving record:", err);
        console.error("Stack trace:", err.stack);
        return res.status(500).send(`Lỗi lưu dữ liệu: ${err.message}`);
    }
});

// Chỉnh sửa hồ sơ
app.put("/edit-record/:index", async (req, res) => {
    const index = parseInt(req.params.index);

    try {
        const data = await fs.readFile(DATA_FILE, "utf8");
        let records = JSON.parse(data);

        if (index < 0 || index >= records.length) {
            return res.status(404).send("Không tìm thấy hồ sơ");
        }

        records[index] = { ...records[index], ...req.body };

        await fs.writeFile(DATA_FILE, JSON.stringify(records, null, 2));
        res.send("Hồ sơ đã được cập nhật");
    } catch (err) {
        console.error("Lỗi chỉnh sửa hồ sơ:", err);
        return res.status(500).send("Lỗi lưu dữ liệu");
    }
});

// Xóa hồ sơ
app.delete("/delete-record/:index", async (req, res) => {
    const index = parseInt(req.params.index);

    try {
        const data = await fs.readFile(DATA_FILE, "utf8");
        let records = JSON.parse(data);

        if (index < 0 || index >= records.length) {
            return res.status(404).send("Không tìm thấy hồ sơ");
        }

        records.splice(index, 1);

        await fs.writeFile(DATA_FILE, JSON.stringify(records, null, 2));
        res.send("Hồ sơ đã được xóa");
    } catch (err) {
        console.error("Lỗi xóa hồ sơ:", err);
        return res.status(500).send("Lỗi lưu dữ liệu");
    }
});

// Chạy server
const PORT = process.env.PORT || 9050;
app.listen(PORT, () => console.log(`Server chạy tại http://localhost:${PORT}`));
