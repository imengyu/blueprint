import ServerConfig from "../Config/ServerConfig";

export type PlatformType = 'webSingle'|'webWithServer'|'electron'|'cef';

export function getPlatform() : PlatformType {
  const env = process.env['EDITOR_ENV'];
  switch(env) {
    case 'electron': return 'electron';
    case 'cef': return 'cef';
    default:
      if(ServerConfig.enableServer)
        return 'webWithServer';
      return 'webSingle';
  }
}