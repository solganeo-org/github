const express = require('express');
const bodyParser = require('body-parser');
const { handlePush, handlePullRequest, handleIssueComment, handleSecurityAdvisory, handleRepositoryVulnerabilityAlert } = require('./controllers/eventHandlers');
const verifySignature = require('./middlewares/verifySignature');
const config = require('./config/config');

const app = express();

// Middleware pour parser JSON et URL-encoded, avec vérification de signature
app.use(bodyParser.json({ verify: verifySignature }));
app.use(bodyParser.urlencoded({ extended: true, verify: verifySignature }));

// Servir des fichiers statiques (si nécessaire)
app.use(express.static('public'));

// Route pour la racine du serveur
app.get('/', (req, res) => {
    res.send('Bienvenue sur le serveur de webhooks GitHub !');
});
     
// Route principale pour gérer les webhooks GitHub
app.post('/webhook', async (req, res) => {
    try {
        console.log('Webhook received !!');
        
        // Afficher les en-têtes de la requête
        console.log('Headers received:', JSON.stringify(req.headers, null, 2));

        // Afficher le type d'événement
        const event = req.headers['x-github-event'];
        console.log(`Event type: ${event}`);

        // Afficher le corps de la requête (payload)
        const payload = req.body;
        console.log('Payload received:', JSON.stringify(payload, null, 2));

        if (!payload) {
            console.error('Error: Payload is undefined or null');
            return res.status(400).json({ status: 'error', message: 'Payload is undefined or null' });
        }

        // Gérer les différents types d'événements GitHub
        switch (event) {
            case 'push':
                console.log('Processing push event...');
                await handlePush(payload);
                console.log('Push event processed successfully.');
                break;
            case 'pull_request':
                console.log('Processing pull request event...');
                await handlePullRequest(payload);
                console.log('Pull request event processed successfully.');
                break;
            case 'issue_comment':
                console.log('Processing issue comment event...');
                await handleIssueComment(payload);
                console.log('Issue comment event processed successfully.');
                break;
            case 'security_advisory':
                console.log('Processing security advisory event...');
                await handleSecurityAdvisory(payload);
                console.log('Security advisory event processed successfully.');
                break;
            case 'repository_vulnerability_alert':
                console.log('Processing repository vulnerability alert event...');
                await handleRepositoryVulnerabilityAlert(payload);
                console.log('Repository vulnerability alert event processed successfully.');
                break;
            case 'repository':
                const action = payload.action;
                if (action === 'renamed') {
                    console.log('Processing repository rename event...');
                    await handleRepositoryRename(payload);
                    console.log('Repository rename event processed successfully.');
                } else {
                    console.log(`Unhandled repository action: ${action}`);
                }
                break;
            case 'deployment_status':
                console.log('Processing deployment status event...');
                await handleDeploymentStatus(payload);
                console.log('Deployment status event processed successfully.');
                break;
            default:
                console.log(`Unhandled event type: ${event}`);
                return res.status(400).json({ status: 'error', message: `Unhandled event type: ${event}` });
        }

        res.status(200).json({ status: 'success', event });
    } catch (error) {
        console.error('Webhook error:', error);
        res.status(500).json({ status: 'error', message: error.message });
    }
});

// Démarrer le serveur
app.listen(config.port, () => {
    console.log(`=>Webhook server running on http://localhost:${config.port}`);
});