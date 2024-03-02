/**
 * Telegram Bot API Spam Message Script
 * Author: krypton_43
 */

const readline = require("readline");
const { execSync } = require("child_process");
const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

function checkAndInstallAxios(callback) {
    try {
        // Check if axios is installed
        require.resolve("axios");
        console.log("axios is already installed.");
        callback();
    } catch (error) {
        // If axios is not installed, install it
        console.log("axios is not installed. Installing...");
        try {
            execSync("npm install axios");
            console.log("axios has been successfully installed.");
            callback();
        } catch (error) {
            console.error("Failed to install axios:", error.message);
            process.exit(1);
        }
    }
}

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
        console.log(response.data);
    } catch (error) {
        console.error("Error sending message:", error.message);
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
}

function promptUser() {
    displayCredits();
    rl.question("Enter your Telegram bot token: ", function(token) {
        rl.question("Enter your chat ID: ", function(chatId) {
            rl.question("Enter the message text: ", function(text) {
                rl.question("Enter the messages per second (1-30): ", function(speed) {
                    rl.close();
                    if (isNaN(speed) || speed < 1 || speed > 30) {
                        console.error("Invalid messages per second. Please enter a number between 1 and 30.");
                        return;
                    }
                    setInterval(() => {
                        sendMessage(token, chatId, { text, speed });
                    }, 1000 / speed);
                });
            });
        });
    });
}

process.on('SIGINT', function() {
    console.log("Thanks for using this tool!");
    process.exit();
});

promptUser();
checkAndInstallAxios(promptUser);
