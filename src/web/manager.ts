import { McpConfigManager } from '@src/config/mcpConfigManager.js';
import { ServerManager } from '@src/core/server/serverManager.js';
import { OutboundConnection, ClientStatus } from '@src/core/types/index.js';
import fs from 'fs/promises';
import { getGlobalConfigPath } from '@src/constants.js';

export interface ManagedOutboundConnection extends Omit<OutboundConnection, 'status'> {
  status: ClientStatus | 'disabled';
}

class WebManager {
  private mcpConfigManager: McpConfigManager;
  private _serverManager: ServerManager | null = null;
  private configFilePath: string;

  constructor() {
    this.mcpConfigManager = McpConfigManager.getInstance();
    this.configFilePath = getGlobalConfigPath();
  }

  private get serverManager(): ServerManager {
    if (!this._serverManager) {
      this._serverManager = ServerManager.current;
    }
    return this._serverManager;
  }

  async getServers(): Promise<ManagedOutboundConnection[]> {
    const clients = Array.from(this.serverManager.getClients().values());
    const config = await this.readConfigFile();

    return Object.keys(config.mcpServers).map(name => {
      const client = clients.find(c => c.name === name);
      const serverConfig = config.mcpServers[name];

      if (serverConfig.disabled) {
        return {
          name,
          status: 'disabled',
        } as ManagedOutboundConnection;
      }

      if (client) {
        return client as ManagedOutboundConnection;
      }

      return {
        name,
        status: ClientStatus.Disconnected,
      } as ManagedOutboundConnection;
    });
  }

  private async readConfigFile(): Promise<any> {
    const data = await fs.readFile(this.configFilePath, 'utf-8');
    return JSON.parse(data);
  }

  private async writeConfigFile(data: any): Promise<void> {
    await fs.writeFile(this.configFilePath, JSON.stringify(data, null, 2));
    this.mcpConfigManager.reloadConfig();
  }

  async addServer(name: string, command: string): Promise<void> {
    const config = await this.readConfigFile();
    if (config.mcpServers[name]) {
      throw new Error(`Server with name ${name} already exists`);
    }

    config.mcpServers[name] = {
      command,
      transport: 'stdio',
    };

    await this.writeConfigFile(config);
  }

  async removeServer(name: string): Promise<void> {
    // Attempt to stop the server if it's running, but ignore errors
    // as it might not be running or in a valid state.
    try {
      await this.toggleServer(name, false);
    } catch (error) {
      console.warn(`Could not disable server ${name} during deletion. It might already be in an invalid state.`, error);
    }

    const config = await this.readConfigFile();
    if (!config.mcpServers[name]) {
      // If the server is not in the config, there's nothing to do.
      // This can happen if the server was already removed but the UI was out of sync.
      console.warn(`Server ${name} not found in config file during deletion.`);
      return;
    }

    delete config.mcpServers[name];
    await this.writeConfigFile(config);
  }

  async toggleServer(name: string, enable: boolean): Promise<void> {
    const config = await this.readConfigFile();
    if (!config.mcpServers[name]) {
      throw new Error(`Server with name ${name} not found`);
    }

    config.mcpServers[name].disabled = !enable;
    await this.writeConfigFile(config);
  }
}

export default new WebManager();
