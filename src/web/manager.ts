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
    const config = await this.readConfigFile();
    if (!config.mcpServers[name]) {
      throw new Error(`Server with name ${name} not found`);
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
