document.addEventListener('DOMContentLoaded', () => {
  const serverList = document.getElementById('server-list');
  const serverNameInput = document.getElementById('server-name');
  const serverCommandInput = document.getElementById('server-command');
  const addServerBtn = document.getElementById('add-server-btn');

  const fetchServers = async () => {
    try {
      const response = await fetch('/api/servers');
      const servers = await response.json();
      renderServers(servers);
    } catch (error) {
      console.error('Error fetching servers:', error);
    }
  };

  const renderServers = (servers) => {
    serverList.innerHTML = '';
    servers.forEach(server => {
      const serverItem = document.createElement('div');
      serverItem.className = 'server-item';
      serverItem.innerHTML = `
        <div>
          <strong>${server.name}</strong>
          <span>(${server.status})</span>
        </div>
        <div class="server-actions">
          <button class="start-btn" data-name="${server.name}">Start</button>
          <button class="stop-btn" data-name="${server.name}">Stop</button>
          <button class="delete-btn" data-name="${server.name}">Delete</button>
        </div>
      `;
      serverList.appendChild(serverItem);
    });
  };

  addServerBtn.addEventListener('click', async () => {
    const name = serverNameInput.value;
    const command = serverCommandInput.value;
    if (!name || !command) {
      alert('Please enter a name and command');
      return;
    }

    try {
      await fetch('/api/servers', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ name, command }),
      });
      serverNameInput.value = '';
      serverCommandInput.value = '';
      fetchServers();
    } catch (error) {
      console.error('Error adding server:', error);
    }
  });

  serverList.addEventListener('click', async (e) => {
    const target = e.target;
    const name = target.dataset.name;

    if (target.classList.contains('delete-btn')) {
      if (confirm(`Are you sure you want to delete ${name}?`)) {
        try {
          await fetch(`/api/servers/${name}`, {
            method: 'DELETE',
          });
          fetchServers();
        } catch (error) {
          console.error('Error deleting server:', error);
        }
      }
    }

    if (target.classList.contains('start-btn')) {
      try {
        await fetch(`/api/servers/${name}/start`, {
          method: 'POST',
        });
        fetchServers();
      } catch (error) {
        console.error('Error starting server:', error);
      }
    }

    if (target.classList.contains('stop-btn')) {
      try {
        await fetch(`/api/servers/${name}/stop`, {
          method: 'POST',
        });
        fetchServers();
      } catch (error) {
        console.error('Error stopping server:', error);
      }
    }
  });

  fetchServers();
});
