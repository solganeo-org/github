const { notifySlack } = require('./notificationHandlers');
const { logEvent } = require('../utils/logger');
const { triggerCICD } = require('../utils/cicd');
const config = require('../config/config');

module.exports.handlePush = async (payload) => {
    try {
        const branch = payload.ref.replace('refs/heads/', '');
        const commits = payload.commits;
        const repository = payload.repository.full_name;

        // Log the event
        await logEvent('push', payload);

        // Check for sensitive file changes and notify if necessary
        const sensitiveFiles = ['.env', 'config.json', 'secrets.yaml', 'credentials.json'];
        const sensitiveChanges = commits.some(commit =>
            commit.added.concat(commit.modified).some(file => sensitiveFiles.includes(file))
        );

        if (sensitiveChanges) {
            await notifySlack(`🚨 Sensitive changes detected on branch ${branch} in ${repository} by ${payload.pusher.name}`);
        }

        // Trigger CI/CD if applicable
        await triggerCICD({
            repository,
            branch,
            commit: payload.after,
            author: payload.pusher.name
        });

    } catch (error) {
        console.error('Error handling push event:', error);
        throw error;
    }
};

module.exports.handlePullRequest = async (payload) => {
    try {
        const { action, pull_request, repository } = payload;
        const prDetails = {
            number: pull_request.number,
            title: pull_request.title,
            base: pull_request.base.ref,
            head: pull_request.head.ref,
            author: pull_request.user.login,
            repository: repository.full_name
        };

        // Log the event
        await logEvent('pull_request', payload);

        switch (action) {
            case 'opened':
            case 'reopened':
                await notifySlack(`📝 New PR #${prDetails.number}: ${prDetails.title} in ${prDetails.repository}`);
                break;
            case 'closed':
                if (pull_request.merged) {
                    await notifySlack(`✅ PR #${prDetails.number} merged in ${prDetails.repository}`);
                }
                break;
            default:
                console.log(`Unhandled pull request action: ${action}`);
        }

    } catch (error) {
        console.error('Error handling pull request event:', error);
        throw error;
    }
};

module.exports.handleIssueComment = async (payload) => {
    try {
        const { action, comment, issue, repository } = payload;

        if (action === 'created') {
            // Log the event
            await logEvent('issue_comment', payload);
            await notifySlack(`💬 New comment on issue #${issue.number} in ${repository.full_name}: "${comment.body}" by ${comment.user.login}`);
        }

    } catch (error) {
        console.error('Error handling issue comment event:', error);
        throw error;
    }
};

module.exports.handleSecurityAdvisory = async (payload) => {
    try {
        const { action, security_advisory, repository } = payload;

        if (action === 'published') {
            await logEvent('security_advisory', payload);
            await notifySlack(`🚨 Security advisory published in ${repository.full_name}: ${security_advisory.summary}`);
        }

    } catch (error) {
        console.error('Error handling security advisory event:', error);
        throw error;
    }
};

module.exports.handleRepositoryVulnerabilityAlert = async (payload) => {
    try {
        const { action, alert, repository } = payload;

        if (action === 'created') {
            await logEvent('repository_vulnerability_alert', payload);
            await notifySlack(`🔒 New vulnerability alert in ${repository.full_name} for ${alert.package_name}`);
        }

    } catch (error) {
        console.error('Error handling repository vulnerability alert event:', error);
        throw error;
    }
};

// Add additional handlers as needed for more GitHub events.