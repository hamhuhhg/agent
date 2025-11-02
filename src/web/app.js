document.addEventListener('DOMContentLoaded', () => {
  const serverList = document.getElementById('server-list');
  const serverNameInput = document.getElementById('server-name');
  const serverCommandInput = document.getElementById('server-command');
  const addServerBtn = document.getElementById('add-server-btn');

  const fetchServers = async () => {
    try {
      const response = await fetch('/api/servers', {
        cache: 'no-store',
      });
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

      let statusText = server.status;
      let statusClass = server.status;

      switch (server.status) {
        case 'connected':
          statusText = 'متصل';
          statusClass = 'connected';
          break;
        case 'disconnected':
          statusText = 'غير متصل';
          statusClass = 'disconnected';
          break;
        case 'error':
          statusText = 'خطأ';
          statusClass = 'error';
          break;
        case 'disabled':
          statusText = 'معطل';
          statusClass = 'disabled';
          break;
      }

      const isEnabled = server.status !== 'disabled';

      serverItem.innerHTML = `
        <div>
          <strong>${server.name}</strong>
          <span class="status ${statusClass}">${statusText}</span>
        </div>
        <div class="server-actions">
          <button class="toggle-btn" data-name="${server.name}" data-enabled="${!isEnabled}">${isEnabled ? 'تعطيل' : 'تفعيل'}</button>
          <button class="delete-btn" data-name="${server.name}">حذف</button>
        </div>
      `;
      serverList.appendChild(serverItem);
    });
  };

  addServerBtn.addEventListener('click', async () => {
    const name = serverNameInput.value;
    const command = serverCommandInput.value;
    if (!name || !command) {
      alert('الرجاء إدخال اسم وأمر للخادم');
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
      if (confirm(`هل أنت متأكد من أنك تريد حذف الخادم ${name}؟`)) {
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

    if (target.classList.contains('toggle-btn')) {
      const enable = target.dataset.enabled === 'true';
      try {
        await fetch(`/api/servers/${name}/toggle`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ enable }),
        });
        fetchServers();
      } catch (error) {
        console.error('Error toggling server:', error);
      }
    }
  });

  fetchServers();
});
