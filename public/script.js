document.addEventListener('DOMContentLoaded', () => {
    const statusDiv = document.getElementById('status');

    fetch('/check-config')
        .then(response => response.json())
        .then(data => {
            if (data.status === 'error') {
                statusDiv.innerHTML = `
                    <div class="message error">
                        Certaines configurations sont manquantes: 
                        <strong>${data.missing.join(', ')}</strong>
                    </div>`;
            } else {
                statusDiv.innerHTML = `
                    <div class="message success">
                        ${data.message}
                    </div>`;
            }
        })
        .catch(error => {
            console.error('Erreur lors de la vérification des configurations:', error);
            statusDiv.innerHTML = `
                <div class="message error">
                    Erreur lors de la vérification des configurations. Veuillez réessayer plus tard.
                </div>`;
        });
});