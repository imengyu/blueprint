import { getPlatform } from "./Platform"
import WebIOMapping from "./IOMappingForIDE/Web"

export interface IOMapping {
  loadFile(allowType: string) : Promise<{
    path: string,
    data: string
  }>;
  saveFile(path : string, data: string) : Promise<void>;
  saveFileAs(sdata: string, allowType: string) : Promise<string>;
  deleteFile(path : string) : Promise<void>;
}

export function getIOMapping() : IOMapping {
  const platform = getPlatform();
  switch(platform) {
    case 'webSingle': return WebIOMapping;
  }
  return {} as IOMapping
}