import { McpConfigManager } from '@src/config/mcpConfigManager.js';
import { ServerManager } from '@src/core/server/serverManager.js';
import { OutboundConnection } from '@src/core/types/index.js';
import fs from 'fs/promises';
import { getGlobalConfigPath } from '@src/constants.js';
import { spawn, ChildProcess } from 'child_process';

class WebManager {
  private mcpConfigManager: McpConfigManager;
  private _serverManager: ServerManager | null = null;
  private configFilePath: string;
  private runningServers: Map<string, ChildProcess> = new Map();

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

  getServers(): (OutboundConnection & { status: string })[] {
    const clients = Array.from(this.serverManager.getClients().values());
    return clients.map(client => ({
      ...client,
      status: this.runningServers.has(client.name) ? 'running' : 'stopped',
    }));
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
      command: command.split(' '),
      transport: 'stdio',
    };

    await this.writeConfigFile(config);
  }

  async removeServer(name: string): Promise<void> {
    if (this.runningServers.has(name)) {
      await this.stopServer(name);
    }
    const config = await this.readConfigFile();
    if (!config.mcpServers[name]) {
      throw new Error(`Server with name ${name} not found`);
    }

    delete config.mcpServers[name];
    await this.writeConfigFile(config);
  }

  async startServer(name: string): Promise<void> {
    if (this.runningServers.has(name)) {
      return;
    }

    const config = await this.readConfigFile();
    const server = config.mcpServers[name];
    if (!server) {
      throw new Error(`Server with name ${name} not found`);
    }

    const [command, ...args] = server.command;
    const child = spawn(command, args, {
      stdio: 'pipe',
      detached: true,
    });
    this.runningServers.set(name, child);

    child.on('close', () => {
      this.runningServers.delete(name);
    });
  }

  async stopServer(name: string): Promise<void> {
    const child = this.runningServers.get(name);
    if (child) {
      child.kill();
      this.runningServers.delete(name);
    }
  }
}

export default new WebManager();
