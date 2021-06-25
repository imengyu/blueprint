import { expect } from 'chai'
import { shallowMount } from '@vue/test-utils'
import FlowBlock from '@/components/Flow/FlowBlock.vue'
import { BluePrintFlowBlock, BluePrintFlowBlockDefine, IBluePrintFlowBlockDefine } from '@/model/Flow/BluePrintFlowBlock'
import { BluePrintParamType } from '@/model/Flow/BluePrintParamType'

const defaultBlockDefine = {
  name: 'test',
  description: 'test description',
  guid: '12',
  version: 0,
  ports: [
    {
      guid: 'IN',
      direction: 'input',
      type: BluePrintParamType.Execute()
    },
    {
      guid: 'OUT',
      direction: 'output',
      type: BluePrintParamType.Execute()
    },
    {
      name: 'TEST IN',
      guid: 'PIN',
      direction: 'input',
      type: BluePrintParamType.Any()
    },
    {
      name: '测试出',
      guid: 'POUT',
      direction: 'output',
      type: BluePrintParamType.Any()
    },
  ],
} as IBluePrintFlowBlockDefine;

const factory = (values = defaultBlockDefine) => {
  const testInstance = new BluePrintFlowBlock(new BluePrintFlowBlockDefine(values));
  testInstance.position.set(600, 400);
  testInstance.load({});
  return shallowMount(FlowBlock, {
    props: { instance: testInstance }
  })
}

describe('FlowBlock.vue', () => {
  it('header title', () => {
    const wrapper = factory();
    expect(wrapper.find('.flow-header .title').text()).to.include(defaultBlockDefine.name)
  });
})
