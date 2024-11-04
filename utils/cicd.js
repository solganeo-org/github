const axios = require('axios');
const config = require('../config/config');

module.exports.triggerCICD = async (details) => {
    try {
        const { repository, branch, commit, author } = details;

        // Déterminer le type de workflow à exécuter en fonction de la branche
        const workflow = determineCICDWorkflow(branch);

        console.log(`Triggering CI/CD for branch ${branch} in ${repository}...`);

        // Envoyer une requête à l'API GitHub pour déclencher un workflow
        await axios.post(
            `https://api.github.com/repos/${repository}/dispatches`,
            {
                event_type: 'ci-cd-trigger',
                client_payload: {
                    branch,
                    commit,
                    author,
                    workflow,
                },
            },
            {
                headers: {
                    Authorization: `Bearer ${config.githubToken}`,
                    'Content-Type': 'application/json',
                },
            }
        );

        console.log(`CI/CD workflow triggered for ${branch} in ${repository}`);
    } catch (error) {
        console.error('Error triggering CI/CD workflow:', error);
        throw error;
    }
};

// Fonction pour déterminer quel workflow CI/CD utiliser en fonction de la branche
const determineCICDWorkflow = (branch) => {
    if (['main', 'master', 'production'].includes(branch)) {
        return 'production-deploy.yml';
    }
    return 'development-build.yml';
};