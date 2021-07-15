import StringUtils from "../Utils/StringUtils";

export class SettingsServiceClass {
  getSettingsBoolean(key : string, defaultVlaue : boolean) : boolean {
    const s = localStorage.getItem(key) || '';
    if(StringUtils.isNullOrEmpty(s)) 
      return defaultVlaue;
    return s == 'true';
  }
  setSettingsBoolean(key : string, value : boolean) {
    localStorage.setItem(key, value ? 'true' : 'false');
  }
  setSettings(key : string, value : string) : void {
    localStorage.setItem(key, value);
  }
  getSettings(key : string, defaultVlaue : string) : string {
    const s = localStorage.getItem(key) || '';
    if(StringUtils.isNullOrEmpty(s)) 
      return defaultVlaue;
    return s;
  }
  getSettingsNumber(key : string, defaultVlaue : number) : number {
    const s = localStorage.getItem(key) || '';
    if(StringUtils.isNullOrEmpty(s)) 
      return defaultVlaue;
    return parseFloat(s);
  }
  setSettingsNumber(key : string, value : number) : void {
    localStorage.setItem(key, value.toString());
  }
}

export default new SettingsServiceClass();