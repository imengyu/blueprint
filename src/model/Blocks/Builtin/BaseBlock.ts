import app from "@/main";
import { IBluePrintFlowBlockDefine } from "@/model/Flow/BluePrintFlowBlock";
import { BluePrintParamEnumDefine, BluePrintParamType } from "@/model/Flow/BluePrintParamType";
import ParamTypeService from "@/model/Services/ParamTypeService";
import DocCommentBlockInner from '@/components/Editor/BlockCustom/DocCommentBlockInner.vue'

const blockInGUID = '00000000-0000-0000-0000-000000000001';
const variableGetGUID = '601F20C4-CAEC-77E1-6286-5E5A4700920C';
const variableSetGUID = '829EC25A-ADBC-E1F6-9922-BBEFD4E3E502';
const commentBlockGUID = '43608F6C-666A-AAB6-D052-694DD7001B5B';
const convertBlockGUID = '73929771-B979-C45F-141E-1A906958CB1A';

export default { 
  register,
  getScriptBaseInBlockGUID() : string { return blockInGUID; },
  getScriptBaseVariableGetBlockGUID() : string { return variableGetGUID;  },
  getScriptBaseVariableSetBlockGUID() : string { return variableSetGUID;  },
  getScriptBaseCommentBlockGUID() : string { return commentBlockGUID;  },
  getScriptBaseConvertBlockGUID() : string { return convertBlockGUID;  },
  packageName: 'Base',
  version: 1,
}

function register() : Array<IBluePrintFlowBlockDefine> {

  //注册转换方法
  registerBaseConverters();
  //注册自定义类型
  ParamTypeService.registerCustomType(new BluePrintParamEnumDefine("DebugLogLevel", [
    'log','info','warn','error'
  ], '#F7C709'));
  ParamTypeService.registerCustomType(new BluePrintParamEnumDefine("BasePlatformType", [
    'all','electron','nodejs','cnative'
  ], '#8552a1'));

  return new Array<IBluePrintFlowBlockDefine>().concat(
    registerScriptBase(),
    registerScriptVariableBase(),
    registerDebugBase(),
    registerTypeBase(),
    registerCommentBlock(),
    registerConvertBlock(),
    registerConnBlock(),
  );
}

function registerBaseConverters() {
  ParamTypeService.registerTypeCoverter({
    fromType: new BluePrintParamType('number'),
    toType: new BluePrintParamType('string'), 
    allowSetType: 'variable', 
    converter: {}
  });
  ParamTypeService.registerTypeCoverter({
    fromType: new BluePrintParamType('bigint'),
    toType: new BluePrintParamType('string'), 
    allowSetType: 'variable', 
    converter: {}
  });
  ParamTypeService.registerTypeCoverter({
    fromType: new BluePrintParamType('boolean'),
    toType: new BluePrintParamType('string'), 
    allowSetType: 'variable', 
    converter: {}
  });
  ParamTypeService.registerTypeCoverter({
    fromType: new BluePrintParamType('object'),
    toType: new BluePrintParamType('string'), 
    allowSetType: 'variable', 
    converter: {}
  });

  ParamTypeService.registerTypeCoverter({
    fromType: new BluePrintParamType('string'),
    toType: new BluePrintParamType('number'), 
    allowSetType: 'variable', 
    converter: {}
  });
  ParamTypeService.registerTypeCoverter({
    fromType: new BluePrintParamType('string'),
    toType: new BluePrintParamType('boolean'), 
    allowSetType: 'variable', 
    converter: {}
  });
  ParamTypeService.registerTypeCoverter({
    fromType: new BluePrintParamType('any'),
    toType: new BluePrintParamType('string'), 
    allowSetType: 'variable', 
    converter: {}
  });
}

function registerScriptBase() : Array<IBluePrintFlowBlockDefine> {
  return [ 
    {
      name: '脚本入口',
      description: '脚本在这里开始运行<ul><li>对于 C 系语言和 Java，这相当于 main 函数</li><li>对于 JavaScript，这相当于全局代码入口</li></ul>',
      category: '基础/脚本',
      version: 0,
      guid: blockInGUID,
      oneBlockOnly: true,
      canNotDelete: true,
      style: {
        logo: require('@/assets/images/BlockIcon/entry_go.svg'),
        titleBakgroundColor: "rgba(25,25,112,0.6)",
      },
      ports: [
        {
          guid: 'ENTRY',
          name: '入口',
          description: '脚本在这里开始运行',
          direction: 'output',
          type: BluePrintParamType.Execute(),
        },
        {
          guid: 'ARGS',
          name: '参数',
          description: '程序入口参数<ul><li>对于 C 系语言和 Java，这相当于 main 函数的 args 参数</li><li>对于 JavaScript，该参数仅在NodeJS环境有效，Web平台中为Null</li></ul>',
          direction: 'output',
          type: new BluePrintParamType('string', undefined, 'array'),
        }
      ]
    }, 
    {
      name: '定时器',
      description: '定时器用于定时执行某些任务',
      category: '基础',
      version: 0,
      guid: 'E36AEDDB-1910-5C77-2F44-27BB901C20DB',
      style: {
        logo: require('@/assets/images/BlockIcon/clock2.svg'),
        logoRight: require('@/assets/images/BlockIcon/clock2.svg'),
        titleBakgroundColor: "rgba(120,200,254,0.6)",
      },
      ports: [
        {
          name: '开始',
          description: '开始定时器',
          direction: 'input',
          guid: 'START',
          defaultConnectPort: true,
          type: BluePrintParamType.Execute(),
        },
        {
          name: '停止',
          description: '停止定时器',
          direction: 'input',
          guid: 'STOP',
          defaultConnectPort: false,
          forceNoCycleDetection: true,
          type: BluePrintParamType.Execute(),
        },
        {
          direction: 'output',
          guid: 'OUT',
          isAsync: true,
          defaultConnectPort: false,
          type: BluePrintParamType.Execute(),
        },
        {
          name: "时长",
          description: '周期时长（毫秒）',
          direction: 'input',
          guid: 'TIME',
          type: new BluePrintParamType('number'),
          initialValue: 2000,
          defaultConnectPort: false,
        },
      ]
    },
    {
      name: '延时',
      description: '延迟流程图的运行',
      category: '基础',
      version: 0,
      guid: '6C01D858-CF4D-D9EF-C18E-DE5DAE400702',
      style: {
        logo: require('@/assets/images/BlockIcon/clock.svg'),
        logoRight: require('@/assets/images/BlockIcon/clock.svg'),
        titleBakgroundColor: "rgba(120,200,254,0.6)",
      },
      ports: [
        {
          direction: 'input',
          guid: 'IN',
          defaultConnectPort: true,
          type: BluePrintParamType.Execute(),
        },
        {
          direction: 'output',
          guid: 'OUT',
          isAsync: true,
          defaultConnectPort: false,
          type: BluePrintParamType.Execute(),
        },
        {
          name: "时长",
          description: '延迟时长（毫秒）',
          direction: 'input',
          guid: 'TIME',
          type: new BluePrintParamType('number'),
          initialValue: 2000,
          defaultConnectPort: false,
        },
      ]
    },
    {
      name: '运行库平台',
      description: '获取当前流图所在的运行库的平台',
      category: '基础',
      version: 0,
      guid: '522E5C4D-16E1-9D48-1916-19830B6F5B35',
      style: {
        logo: require('@/assets/images/BlockIcon/function_static.svg'),
        logoBackground: 'title:运行库平台',
        titleBakgroundColor: "rgba(255,20,147,0.6)",
        titleState: 'hide',
        minWidth: 140,
        noLogo: true,
      },
      ports: [
        {
          direction: 'output',
          guid: 'OUT',
          defaultConnectPort: true,
          type: new BluePrintParamType('enum', 'BasePlatformType'),
        },
      ]
    },
  ];
}
function registerScriptVariableBase() : Array<IBluePrintFlowBlockDefine> {
  return [
    {
      name: '获取变量',
      category: '基础',
      version: 0,
      guid: variableGetGUID,
      style: {
        logoBackground: 'title:获取变量',
        titleBakgroundColor: "rgba(250,250,250,0.6)",
        titleState: 'small',
        minWidth: 140,
        noLogo: true,
      },
      ports: [
        {
          direction: 'output',
          guid: 'OUT',
          defaultConnectPort: true,
          type: new BluePrintParamType('enum', 'BasePlatformType'),
        },
      ]
    },
    {
      name: '设置变量',
      description: '设置变量值',
      category: '基础',
      version: 0,
      guid: variableSetGUID,
      style: {
        logoBackground: 'title:设置变量',
        titleBakgroundColor: "rgba(250,250,250,0.6)",
        titleState: 'small',
        minWidth: 180,
        noLogo: true,
      },
      ports: [
        {
          guid: 'PI0',
          type: BluePrintParamType.Execute(),
          direction: 'input'
        },
        {
          guid: 'PO0',
          type: BluePrintParamType.Execute(),
          direction: 'output'
        },
        {
          direction: 'output',
          guid: 'OUT',
          defaultConnectPort: true,
          type: new BluePrintParamType('enum', 'BasePlatformType'),
        },
      ]
    }
  ];
}
function registerDebugBase() : Array<IBluePrintFlowBlockDefine> { 
  //TODO: DebugBase Block
  return []
}
function registerTypeBase() : Array<IBluePrintFlowBlockDefine> {
  return [
    {
      guid: '6CE4CA4F-E2F9-AD97-3F83-1B60289C9290',
      name: 'BigInt',
      description: 'BigInt 类型参数',
      category: '基础/类型',
      version: 0,
      style: {
        logo: require('@/assets/images/BlockIcon/bigint.svg'),
        titleBakgroundColor: "rgba(0,168,243,0.5)",
        titleState: 'hide',
        noLogo: true,
      },
      ports: [
        {
          direction: 'input',
          guid: 'IN',
          type: new BluePrintParamType('bigint'),
          initialValue: 0,
        },
        {
          direction: 'output',
          guid: 'OUT',
          type: new BluePrintParamType('bigint'),
        },
      ]
    },
    {
      guid: '90833609-8CF7-2324-A4C0-781344701C06',
      name: '布尔值',
      description: '布尔值 类型参数',
      category: '基础/类型',
      version: 0,
      style: {
        logo: require('@/assets/images/BlockIcon/boolean.svg'),
        titleBakgroundColor: "rgba(180,0,0,0.6)",
        titleState: 'hide',
        noLogo: true,
      },
      ports: [
        {
          direction: 'input',
          guid: 'IN',
          type: new BluePrintParamType('boolean'),
          initialValue: true,
        },
        {
          direction: 'output',
          guid: 'OUT',
          type: new BluePrintParamType('boolean'),
        },
      ]
    },
    {
      guid: 'EE8345CE-14FB-3CE5-C5CD-30CF3A102DE5',
      name: '数字',
      description: '数字类型参数',
      category: '基础/类型',
      version: 0,
      style: {
        logo: require('@/assets/images/BlockIcon/number.svg'),
        titleBakgroundColor: "rgba(158,258,68,0.6)",
        titleState: 'hide',
        noLogo: true,
      },
      ports: [
        {
          direction: 'input',
          guid: 'IN',
          type: new BluePrintParamType('number'),
          initialValue: 0,
        },
        {
          direction: 'output',
          guid: 'OUT',
          type: new BluePrintParamType('number'),
        },
      ]
    },
    {
      guid: 'A81899CF-766B-F511-B179-90A81BBB088B',
      name: '字符串',
      description: '字符串类型参数',
      category: '基础/类型',
      version: 0,
      style: {
        logo: require('@/assets/images/BlockIcon/string.svg'),
        titleBakgroundColor: "rgba(158,258,68,0.6)",
        titleState: 'hide',
        noLogo: true,
      },
      ports: [
        {
          direction: 'input',
          guid: 'IN',
          type: new BluePrintParamType('string'),
          initialValue: '',
        },
        {
          direction: 'output',
          guid: 'OUT',
          type: new BluePrintParamType('string'),
        },
      ]
    },
  ];
}
function registerCommentBlock() : Array<IBluePrintFlowBlockDefine> {

  //TODO: Comment Block
  {
    /*

      commentBlock = new BlockRegData("24AA3DF0-49D9-84D9-8138-534505C33327", "注释块", "", 'imengyu', '');
      commentBlock.baseInfo.logo = require('@/assets/images/BlockIcon/info2.svg');
      commentBlock.baseInfo.description = '';
      commentBlock.ports = [];
      commentBlock.blockStyle.minHeight = '100px';
      commentBlock.blockStyle.userCanResize = true;
      commentBlock.blockStyle.noTooltip = true;
      commentBlock.blockStyle.noComment = true;
      commentBlock.blockStyle.hideLogo = true;
      commentBlock.blockStyle.noTitle = true;
      commentBlock.blockStyle.layer = 'background';
      commentBlock.callbacks.onCreateCustomEditor = (parentEle, block) => {
        let blockEle = <HTMLDivElement>parentEle.parentNode;
        blockEle.classList.add('flow-block-comment-block');
        blockEle.style.minWidth = '250px';
        blockEle.style.minHeight = '150px';

        let ele = document.createElement('div');
        let input = document.createElement('input');
        let span = document.createElement('span');
        input.value = block.options['comment'] ? block.options['comment'] : '注释';
        input.onchange = () => {
          block.options['comment'] = input.value;
          span.innerText = input.value;
        };
        input.style.display = 'none';
        input.onkeypress = (e) => {
          if(e.key == 'Enter')
            input.onblur(undefined);
        };
        input.onblur = () => {
          input.style.display = 'none';
          span.style.display = 'block';
        };
        span.onclick = () => {
          if(block.selected && !block.isLastMovedBlock()) {
            span.style.display = 'none';
            input.style.display = 'block';
            input.focus();
          }
        };
        span.innerText = input.value;
        ele.classList.add('comment-block-title');
        ele.appendChild(input);
        ele.appendChild(span);
        parentEle.appendChild(ele);
      };
      commentBlock.callbacks.onCreate = (block) => {
        block.data['list'] = [];
        block.data['rect'] = new Rect();
        block.data['mouseDownPos'] = { x: 0, y: 0 };
        block.data['mouseDown'] = false;
      };
      commentBlock.callbacks.onDestroy = (block) => {
        block.data['list'] = undefined;
      };
      commentBlock.callbacks.onBlockMouseEvent = (block: BlockEditor, event: "move" | "down" | "up", e: MouseEvent) => {
        let list = block.data['list'] as Array<BlockEditor>;
        let rect = block.data['rect'] as Rect;
        let mouseDownPos = block.data['mouseDownPos'] as { x: number, y: number};
        if(event === 'down') {

          block.data['mouseDown'] = true;

          mouseDownPos.x = e.x;
          mouseDownPos.y = e.y;

          //保存鼠标按下时区域内的所有单元
          rect.Set(block.getRect());
          list.empty();
          block.editor.getBlocksInRect(rect).forEach((v) => {
            if(v != block) {
              v.updateLastPos();
              list.push(v);
            }
          });
          
        } else if(event === 'move') {
        
          if(block.data['mouseDown'] && block.getCurrentSizeType() == 0) {

            //移动包括在注释内的单元
            let zoom = 1 / block.editor.getViewZoom();
            let offX = e.x - mouseDownPos.x, offY =  e.y - mouseDownPos.y;
            list.forEach((v) => {
              v.position.x = v.getLastPos().x + (offX * zoom);
              v.position.y = v.getLastPos().y + (offY * zoom);
              v.setPos();
            })
          }

        } else if(event === 'up') {
          if(block.data['mouseDown'])
            block.data['mouseDown'] = false;
        }
        return false;
      };
    */
  }

  app.component('doc-comment-block-inner', DocCommentBlockInner);

  return [ 
    {
      guid: '088C2A25-192D-42E7-D31B-B5E9FB7C68DD',
      name: '文档注释',
      description: '在这个单元里面添加你的代码注释，拖动右下角可以调整大小',
      version: 0,
      style: {
        minHeight: 100,
        logo: require('@/assets/images/BlockIcon/info.svg'),
        userResize: false,
      },
      events: {
        onCreateCustomEditor: () => { return { type: 'nameComponent', ret: 'doc-comment-block-inner' } },
      },
    },
  ];
}
function registerConvertBlock() : Array<IBluePrintFlowBlockDefine> {
  return [ 
    {
      guid: convertBlockGUID,
      name: '转换器',
      category: '基础',
      hideInAddPanel: true,
      version: 0,
      style: {
        titleBakgroundColor: "rgba(250,250,250,0.6)",
        minWidth: 0,
        titleState: 'hide',
      },
      ports: [
        {
          guid: 'INPUT',
          type: BluePrintParamType.Any(),
          direction: 'input',
          defaultConnectPort: true,
        },
        {
          guid: 'OUTPUT',
          type: BluePrintParamType.Any(),
          direction: 'output'
        },
      ]
    }
  ];
}
function registerConnBlock() : Array<IBluePrintFlowBlockDefine> {
  return [
    {
      guid: '8A94A788-ED4E-E521-5BC2-4D69B59BAB80',
      name: '数据延长线',
      version: 0,
      style: {
        logo: require('@/assets/images/BlockIcon/convert.svg'),
        titleState: 'hide',
        noComment: true,
        noLogo: true,
        minWidth: 0,
        customClassNames: 'flow-block-extended-line',
      },
      ports: [
        {
          guid: 'INPUT',
          type: BluePrintParamType.Any(),
          isRefPassing: true,
          direction: 'input',
          defaultConnectPort: true,
        },
        {
          guid: 'OUTPUT',
          type: BluePrintParamType.Any(),
          isRefPassing: true,
          direction: 'output'
        },
      ]
    }
  ];

  //TODO: 数据延长线右键菜单
  /*
  block.blockMenu.items.push({
    label: '集合类型',
    children: [
      {
        label: '变量',
        onClick: function() { 
          this.changePortParamType(this.getPortByGUID('INPUT'), undefined, 'variable'); 
          this.changePortParamType(this.getPortByGUID('OUTPUT'), undefined, 'variable'); 
          this.options['type'] = 'variable';
        }
      },
      {
        label: '数组',
        onClick: function() { 
          this.changePortParamType(this.getPortByGUID('INPUT'), undefined, 'array'); 
          this.changePortParamType(this.getPortByGUID('OUTPUT'), undefined, 'array'); 
          this.options['type'] = 'array';
        }
      },
      {
        label: '集合',
        onClick: function() {
          this.changePortParamType(this.getPortByGUID('INPUT'), undefined, 'set'); 
          this.changePortParamType(this.getPortByGUID('OUTPUT'), undefined, 'set'); 
          this.options['type'] = 'set';
        }
      },
      {
        label: '映射',
        onClick: function() { 
          this.changePortParamType(this.getPortByGUID('INPUT'), undefined, 'dictionary'); 
          this.changePortParamType(this.getPortByGUID('OUTPUT'), undefined, 'dictionary'); 
          this.options['type'] = 'dictionary';
        }
      },
    ]
  })
  */
}

