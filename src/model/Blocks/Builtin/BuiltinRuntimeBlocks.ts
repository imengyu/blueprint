import BlockRegisterService from "@/model/Services/BlockRegisterService";
import BaseBlock from "./BaseBlock";

let registered = false;
const BuiltinRuntimeBlocks = {
  registerAll() : void {
    if(!registered) {
      registered = true;
      
      BlockRegisterService.registerBlockPack(BaseBlock, false);
    }
  }
}
export default BuiltinRuntimeBlocks