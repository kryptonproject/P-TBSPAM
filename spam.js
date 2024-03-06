/**
 * Telegram Bot API Spam Message Script
 * Author: krypton_43
 */

const readline = require("readline");
const axios = require("axios");
const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

let lastSentTime = 0;
let messageQueue = [];

async function sendMessage(botToken, chatId, message) {
    const currentTime = Date.now();
    const timeDiff = currentTime - lastSentTime;

    if (timeDiff < 1000 / message.speed) {
        messageQueue.push({ botToken, chatId, message });
        return;
    }

    const url = `https://api.telegram.org/bot${botToken}/sendMessage?parse_mode=Markdown&chat_id=${chatId}&text=${encodeURIComponent(message.text)}`;

    try {
        const response = await axios.get(url);
        console.log("\x1b[32m", response.data, "\x1b[0m");
    } catch (error) {
        if (error.response && error.response.status === 429) {
            const retryAfter = error.response.headers['retry-after'];
            const waitTime = retryAfter ? parseInt(retryAfter) : 0;
            console.error("\x1b[31m", `Bot has been Down. API come back on ${waitTime} seconds.`, "\x1b[0m");
        } else {
            console.error("\x1b[31m", "Error:", error.message, "\x1b[0m");
        }
    }

    lastSentTime = currentTime;

    if (messageQueue.length > 0) {
        const nextMessage = messageQueue.shift();
        await sendMessage(nextMessage.botToken, nextMessage.chatId, nextMessage.message);
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
    console.log("Version: 0.2\n");
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

    const text = await new Promise((resolve) => {
        rl.question("Enter the message text: ", (answer) => {
            resolve(answer);
        });
    });
    const speed = await new Promise((resolve) => {
        rl.question("How many messages do you want to send per second? (1-30): ", (answer) => {
            resolve(answer);
        });
    });

    rl.close();

    chatIds.forEach((chatId) => {
        setInterval(() => {
            sendMessage(botToken, chatId, { text, speed });
        }, 1000 / speed);
    });
}

process.on('SIGINT', function () {
    console.log("Thanks for using this tool!");
    process.exit();
});

promptUser();
