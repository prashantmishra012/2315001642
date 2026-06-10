import axios from 'axios';
import * as readline from 'readline';

const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

const API_BASE = 'http://4.224.186.213/evaluation-service';

function askQuestion(query: string): Promise<string> {
    return new Promise((resolve) => rl.question(query, resolve));
}

async function main() {
    console.log("=== Affordmed Evaluation Setup ===");
    console.log("Have you already registered to get your clientID and clientSecret? (y/n)");
    const hasRegistered = await askQuestion("> ");

    let clientID = '';
    let clientSecret = '';
    let email = '';
    let name = '';
    let rollNo = '';
    let accessCode = '';

    if (hasRegistered.toLowerCase().startsWith('y')) {
        clientID = await askQuestion("Enter your clientID: ");
        clientSecret = await askQuestion("Enter your clientSecret: ");
        email = await askQuestion("Enter your registered email: ");
        name = await askQuestion("Enter your registered name: ");
        rollNo = await askQuestion("Enter your registered rollNo: ");
        accessCode = await askQuestion("Enter your accessCode: ");
    } else {
        console.log("\n--- Registration ---");
        email = await askQuestion("Email: ");
        name = await askQuestion("Name: ");
        const mobileNo = await askQuestion("Mobile No: ");
        const githubUsername = await askQuestion("GitHub Username: ");
        rollNo = await askQuestion("Roll No: ");
        accessCode = await askQuestion("Access Code: ");

        try {
            const regResponse = await axios.post(`${API_BASE}/register`, {
                email, name, mobileNo, githubUsername, rollNo, accessCode
            });
            console.log("\nRegistration Successful! Save these details:");
            console.log("clientID:", regResponse.data.clientID);
            console.log("clientSecret:", regResponse.data.clientSecret);
            
            clientID = regResponse.data.clientID;
            clientSecret = regResponse.data.clientSecret;
        } catch (error: any) {
            console.error("\nRegistration Failed:");
            console.error(error.response?.data || error.message);
            rl.close();
            return;
        }
    }

    console.log("\n--- Getting Auth Token ---");
    try {
        const authResponse = await axios.post(`${API_BASE}/auth`, {
            email, name, rollNo, accessCode, clientID, clientSecret
        });

        const token = authResponse.data.access_token;
        console.log("\nAuthentication Successful!");
        console.log(`\nYour Bearer Token:\n${token}\n`);
        console.log("Set this as an environment variable in your terminal:");
        console.log(`\nWindows PowerShell:`);
        console.log(`$env:AFFORDMED_API_TOKEN="${token}"`);
        console.log(`\nmacOS/Linux:`);
        console.log(`export AFFORDMED_API_TOKEN="${token}"`);

    } catch (error: any) {
        console.error("\nAuthentication Failed:");
        console.error(error.response?.data || error.message);
    }

    rl.close();
}

main();
