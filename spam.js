/**
 * Telegram Bot API Spam Message Script
 * Author: krypton_43
 */

const readline = require("readline");
const axios = require("axios");
const fs = require("fs");
const FormData = require("form-data");
const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

let messageQueue = [];
let processing = false;

async function sendMessage(botToken, chatId, message) {
    const url = `https://api.telegram.org/bot${botToken}/sendMessage?parse_mode=Markdown&chat_id=${chatId}&text=${encodeURIComponent(message.text)}`;

    try {
        const response = await axios.get(url);
        console.log("\x1b[32m", response.data, "\x1b[0m");
    } catch (error) {
        if (error.response && error.response.status === 429) {
            const retryAfter = error.response.headers['retry-after'];
            const waitTime = retryAfter ? parseInt(retryAfter) * 1000 : 5000;
            console.error("\x1b[31m", `Bot is being rate-limited. Retrying after ${waitTime / 1000} seconds.`, "\x1b[0m");
            setTimeout(() => sendMessage(botToken, chatId, message), waitTime);
        } else {
            console.error("\x1b[31m", "Error:", error.message, "\x1b[0m");
        }
    }
}

async function getBotInfo(botToken) {
    const url = `https://api.telegram.org/bot${botToken}/getMe`;

    try {
        const response = await axios.get(url);
        const botInfo = response.data.result;
        console.log("\x1b[32m", "Bot Information:", "\x1b[0m");
        console.log("\x1b[32m", `ID: ${botInfo.id}`, "\x1b[0m");
        console.log("\x1b[32m", `Name: ${botInfo.first_name}`, "\x1b[0m");
        console.log("\x1b[32m", `Username: @${botInfo.username}`, "\x1b[0m");

        // Get additional info, like profile photos and bot's privacy mode
        await getBotProfilePhotos(botToken, botInfo.id);
        await getBotPrivacySettings(botToken);

    } catch (error) {
        console.error("\x1b[31m", "Error fetching bot info:", error.message, "\x1b[0m");
    }
}

async function getBotProfilePhotos(botToken, botId) {
    const url = `https://api.telegram.org/bot${botToken}/getUserProfilePhotos?user_id=${botId}&limit=1`;

    try {
        const response = await axios.get(url);
        const photos = response.data.result.photos;
        if (photos.length > 0) {
            const fileId = photos[0][0].file_id;
            const fileUrl = `https://api.telegram.org/file/bot${botToken}/${fileId}`;
            console.log("\x1b[32m", `Profile Photo: ${fileUrl}`, "\x1b[0m");
        } else {
            console.log("\x1b[32m", "No profile photos found.", "\x1b[0m");
        }
    } catch (error) {
        console.error("\x1b[31m", "Error fetching profile photos:", error.message, "\x1b[0m");
    }
}

async function getBotPrivacySettings(botToken) {
    const url = `https://api.telegram.org/bot${botToken}/getMyCommands`;

    try {
        const response = await axios.get(url);
        const commands = response.data.result;
        console.log("\x1b[32m", "Bot Commands:", "\x1b[0m");
        commands.forEach(command => {
            console.log("\x1b[32m", `Command: /${command.command} - ${command.description}`, "\x1b[0m");
        });
    } catch (error) {
        console.error("\x1b[31m", "Error fetching bot commands:", error.message, "\x1b[0m");
    }
}

async function sendFile(botToken, chatId, filePath, caption) {
    const url = `https://api.telegram.org/bot${botToken}/sendDocument`;
    const form = new FormData();
    form.append("chat_id", chatId);
    form.append("document", fs.createReadStream(filePath));
    if (caption) {
        form.append("caption", caption);
    }

    try {
        const response = await axios.post(url, form, { headers: form.getHeaders() });
        console.log("\x1b[32m", "File sent successfully.", "\x1b[0m");
    } catch (error) {
        console.error("\x1b[31m", "Error sending file:", error.message, "\x1b[0m");
    }
}

function displayCredits() {
    console.log("\x1b[36m" + `
██████╗░░░░░░░████████╗██████╗░░██████╗██████╗░░█████╗░███╗░░░███╗
██╔══██╗░░░░░░╚══██╔══╝██╔══██╗██╔════╝██╔══██╗██╔══██╗████╗░████║
██████╔╝█████╗░░░██║░░░██████╦╝╚█████╗░██████╔╝███████║██╔████╔██║
██╔═══╝░╚════╝░░░██║░░░██╔══██╗░╚═══██╗██╔═══╝░██╔══██║██║╚██╔╝██║
██║░░░░░░░░░░░░░░██║░░░██████╦╝██████╔╝██║░░░░░██║░░██║██║░╚═╝░██║
╚═╝░░░░░░░░░░░░░░╚═╝░░░╚═════╝░╚═════╝░╚═╝░░░░░╚═╝░░╚═╝╚═╝░░░░░╚═╝` + "\x1b[0m");
    console.log("Created by: Krypton_43\n");
    console.log("Version: 2.0\n");
}

async function promptChatIds() {
    const chatIds = [];
    let addMore = true;

    while (addMore) {
        let chatId = await new Promise((resolve) => {
            rl.question("Enter Target chat ID: ", (answer) => {
                resolve(answer);
            });
        });
        chatIds.push(chatId);

        let more = await new Promise((resolve) => {
            rl.question("Add more chat IDs? (yes/no): ", (answer) => {
                resolve(answer.toLowerCase() === 'yes');
            });
        });
        addMore = more;
    }

    return chatIds;
}

async function promptUser() {
    displayCredits();
    const botToken = await new Promise((resolve) => {
        rl.question("Enter Target Telegram bot token: ", (answer) => {
            resolve(answer);
        });
    });

    const chatIds = await promptChatIds();

    const menuChoice = await new Promise((resolve) => {
        rl.question("Choose an option:\n1. Spam\n2. Bot Info\n3. Send File\noptions > ", (answer) => {
            resolve(answer);
        });
    });

    if (menuChoice === '1') {
        const text = await new Promise((resolve) => {
            rl.question("Enter the message text: ", (answer) => {
                resolve(answer);
            });
        });
        
        const speed = await new Promise((resolve) => {
            rl.question("How many messages do you want to send per second? (1-30): ", (answer) => {
                const num = parseInt(answer);
                resolve(isNaN(num) || num < 1 || num > 30 ? 1 : num);
            });
        });

        rl.close();

        chatIds.forEach((chatId) => {
            setInterval(() => {
                messageQueue.push({ botToken, chatId, text, speed });
                processQueue();
            }, 1000 / speed);
        });
    } else if (menuChoice === '2') {
        await getBotInfo(botToken);
        rl.close();
    } else if (menuChoice === '3') {
        const filePath = await new Promise((resolve) => {
            rl.question("Enter the path to the file: ", (answer) => {
                resolve(answer);
            });
        });
        const caption = await new Promise((resolve) => {
            rl.question("Enter the caption for the file (optional): ", (answer) => {
                resolve(answer);
            });
        });
        for (const chatId of chatIds) {
            await sendFile(botToken, chatId, filePath, caption);
        }
        rl.close();
    } else {
        console.log("Invalid choice. Exiting...");
        rl.close();
    }
}

function processQueue() {
    if (processing || messageQueue.length === 0) return;

    processing = true;
    const { botToken, chatId, text } = messageQueue.shift();
    sendMessage(botToken, chatId, { text, speed: 1 }).then(() => {
        processing = false;
        processQueue();
    });
}

process.on('SIGINT', function () {
    console.log("Thanks for using this tool!");
    process.exit();
});

promptUser();
