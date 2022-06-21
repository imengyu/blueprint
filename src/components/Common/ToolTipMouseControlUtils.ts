export class ToolTipMouseControlUtils {

  onShowTooltip: ((e : MouseEvent) => boolean)|null = null;
  onHideTooltip: (() => void)|null = null;

  private hideTooltip() : void { 
    if(typeof this.onHideTooltip === 'function') 
      return this.onHideTooltip(); 
  }
  private showTooltip(e : MouseEvent) : boolean { 
    if(typeof this.onShowTooltip === 'function') 
      return this.onShowTooltip(e); 
    return false;
  }

  tooltipMouseEvent(evt: "mouseenter" | "mouseleave" | "mousedown") : void {
    switch (evt) {
      case "mouseenter":
        this.clearHideTooltipDelay();
        break;
      case "mousedown":
        break;
      case "mouseleave":
        this.registerHideTooltipDelay(() => this.hideTooltip());
        break;
    }
  }
  elementTooltipMouseEnter(e: MouseEvent) : void {
    if (e.buttons > 0) return;
    
    this.clearHideTooltipDelay();
    this.registerShowTooltipDelay(() => this.showTooltip(e));
  }
  elementTooltipMouseLeave() : void {
    this.clearShowTooltipDelay();
    this.registerHideTooltipDelay(() => this.hideTooltip());
  }
  elementTooltipMouseDown() : void {
    this.clearShowTooltipDelay();
    this.clearHideTooltipDelay();
    this.hideTooltip()
  }

  timerShowTooltipDelay = 0;
  timerHidetooltipDelay = 0;

  registerHideTooltipDelay(callback: () => void, delay = 200) : void {
    if (this.timerHidetooltipDelay != 0) clearTimeout(this.timerHidetooltipDelay);
    this.timerHidetooltipDelay = setTimeout(() => {
      this.timerHidetooltipDelay = 0;
      callback();
    }, delay) as unknown as number;
  }
  clearHideTooltipDelay() : void {
    if (this.timerHidetooltipDelay != 0) {
      clearTimeout(this.timerHidetooltipDelay);
      this.timerHidetooltipDelay = 0;
    }
  }
  clearShowTooltipDelay() : void {
    if (this.timerShowTooltipDelay != 0) {
      clearTimeout(this.timerShowTooltipDelay);
      this.timerShowTooltipDelay = 0;
    }
  }
  registerShowTooltipDelay(callback: () => void) : void {
    if (this.timerShowTooltipDelay != 0) clearTimeout(this.timerShowTooltipDelay);
    this.timerShowTooltipDelay = setTimeout(() => {
      this.timerShowTooltipDelay = 0;
      callback();
    }, 700) as unknown as number;
  }
}
