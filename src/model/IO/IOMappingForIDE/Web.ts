import CommonUtils from "@/model/Utils/CommonUtils";
import { getExtByMimeType } from "@/model/Utils/MimeUtils";
import StringUtils from "@/model/Utils/StringUtils";
import { IOMapping } from "../IOMappingForIDE";

export default {
  loadFile,
  saveFile,
  saveFileAs,
  deleteFile,
} as IOMapping

function loadFile(allowType: string) : Promise<{ path: string, data: string }> {
  return new Promise<{ path: string, data: string }>((resolve) => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = allowType;
    input.oninput = () => {
      if(input.files && input.files.length > 0) {
        const reader = new FileReader();
        reader.readAsText(input.files[0], 'UTF-8');
        reader.onload = function (e) {
          resolve({
            path: (input.files as FileList)[0].name,
            data: e.target?.result as string,
          })
        }
      }
    };
    input.click();
  });
}
function saveFile(path : string, data: string) : Promise<void> {
  return new Promise<void>((resolve) => {
    const name = StringUtils.getFileName(path);
    if(StringUtils.isNullOrEmpty(name)) saveFileAs(data, '');
    else CommonUtils.exportRaw(name, data);
    resolve();
  });
}
function saveFileAs(data: string, allowType: string) : Promise<string> {
  return new Promise<string>((resolve, reject) => {
    const name = prompt('Save file as', 'NewFile' + getExtByMimeType(allowType)) || '';
    CommonUtils.exportRaw(name, data);
    resolve(name);
  });
}
function deleteFile(path : string) : Promise<void> {
  return new Promise<void>((resolve, reject) => {
    reject('Not support');
  });
}
