export interface IBluePrintBackgroundRenderer {
  onWindowSizeChanged() : void;
  addDebugInfoItem(v : () => string) : number;
  removeDebugInfoItem(index : number) : void;
}
export interface IBluePrintRenderer {
  onWindowSizeChanged() : void;
}
