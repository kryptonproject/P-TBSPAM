const readline = require("readline");
const { execSync } = require("child_process");
const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

function checkAndInstallAxios() {
    try {
        require.resolve("axios");
        console.log("axios is already installed.");
        promptUser();
    } catch (error) {
        console.log("axios is not installed. Installing...");
        try {
            execSync("npm install axios");
            console.log("axios has been successfully installed.");
            process.exit(0);
        } catch (error) {
            console.error("Failed to install axios:", error.message);
            process.exit(1);
        }
    }
}

function promptUser() {
  
}
checkAndInstallAxios();
