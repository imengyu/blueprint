import { BluePrintParamEditorDefine } from "../Flow/BluePrintParamType";

export function getBaseTypeEditor(name: string) : null|BluePrintParamEditorDefine {
  switch(name) {
    case 'boolean':
      return {
        editorCreate: () => {
          return {
            type: 'nameComponent',
            ret: 'boolean-editor',
          }
        },
        useInSetType: [ 'variable' ],
      }
    case 'bigint':
      return {
        editorCreate: () => {
          return {
            type: 'nameComponent',
            ret: 'bigint-editor',
          }
        },
        useInSetType: [ 'variable' ],
      }
    case 'number':
      return {
        editorCreate: () => {
          return {
            type: 'nameComponent',
            ret: 'number-editor',
          }
        },
        useInSetType: [ 'variable' ],
      }
    case 'string':
      return {
        editorCreate: () => {
          return {
            type: 'nameComponent',
            ret: 'string-editor',
          }
        },
        useInSetType: [ 'variable' ],
      }
  }
  return null;
}