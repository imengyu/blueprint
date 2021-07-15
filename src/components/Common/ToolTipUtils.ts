import { Vector2 } from "@/model/Base/Vector2";
import HtmlUtils from "@/model/Utils/HtmlUtils";
import RandomUtils from "@/model/Utils/RandomUtils";
import StringUtils from "@/model/Utils/StringUtils";
import { App } from "vue";

let ele : HTMLElement | null = null;
let showTooltipId = 0;
let lastHideTooltipId = 0;

export default {
  install(app : App) : void{
    app.directive('tooltip', {
      mounted: (el) => {
        registerElementTooltip(el);
      },
      beforeMount: (el, binding) => {
        if(!StringUtils.isNullOrEmpty(binding.value))
          el.setAttribute('data-title', binding.value);
      },
      beforeUnmount: (el) => {
        unregisterElementTooltip(el);
      },
    });
    createTooltip('body');
  }
}

function createTooltip(target : 'body'|HTMLElement) : void {
  ele = document.createElement('div');
  ele.classList.add('tooltip');
  ele.style.display = 'none';

  if(target === 'body')
    document.body.appendChild(ele);
  else
    target.appendChild(ele);
  ele.addEventListener('mouseenter', () => {
    clearHideTooltipDelay();
  })
  ele.addEventListener('mouseleave', () => {
    registerHideTooltipDelay(() => hideTooltip(lastHideTooltipId));
  })
}

function showTooltip(text : string, pos : Vector2) : number {

  pos.y += 30;

  const _ele = (ele as HTMLElement);
  _ele.style.display = StringUtils.isNullOrEmpty(text) ? 'none' : '';
  _ele.innerHTML = text;

  showTooltipId = RandomUtils.genRandom(0, 1024);

  const screenWidth = window.innerWidth, screenHeight = window.innerHeight;

  if(_ele.offsetHeight > screenHeight)
    _ele.style.maxHeight = `${screenHeight}px`;
  else
    _ele.style.maxHeight = '';
  if(_ele.offsetWidth > screenWidth)
    _ele.style.maxWidth = `${screenWidth}px`;
  else
    _ele.style.maxWidth = '';

  const right = pos.x + _ele.offsetWidth;
  if(right > screenWidth)
    pos.x += screenWidth - right - 10;

  const bottom = pos.y + _ele.offsetHeight;
  if(bottom > screenHeight)
    pos.y += screenHeight - bottom - 10;

  _ele.style.left = pos.x + 'px';
  _ele.style.top = pos.y + 'px';

  return showTooltipId;
}
function hideTooltip(id : number) : void {
  if(showTooltipId === id)
    (ele as HTMLElement).style.display = 'none';
}
function registerElementTooltip(el : HTMLElement) : void {
  el.addEventListener('mouseenter', elementTooltipMouseEnter);
  el.addEventListener('mouseleave', elementTooltipMouseLeave);
  el.addEventListener('mousedown', elementTooltipMouseDown);
}
function unregisterElementTooltip(el : HTMLElement) : void {
  el.removeEventListener('mouseenter', elementTooltipMouseEnter);
  el.removeEventListener('mouseleave', elementTooltipMouseLeave);
  el.removeEventListener('mousedown', elementTooltipMouseDown);
}
function closeElementTooltip(el : HTMLElement) : void {
  const id = el.getAttribute('data-tooltip-id') || '';
  if(StringUtils.isNumber(id)) {
    lastHideTooltipId = parseInt(el.getAttribute('data-tooltip-id') || '');
    registerHideTooltipDelay(() => hideTooltip(lastHideTooltipId));
  }
  el.removeAttribute('data-tooltip-id');
}
function elementTooltipMouseEnter(e : MouseEvent) : void {
  if(e.buttons > 0)
    return;
  const el = (<HTMLElement>e.currentTarget);
  if(el.getAttribute('data-no-tooltip') === 'true')
    return;
  const title = el.getAttribute('title') || el.getAttribute('data-title') || '';
  el.setAttribute('data-tooltip-enter', 'true');
  if(!StringUtils.isNullOrEmpty(title)) {
    registerShowTooltipDelay(() => {
      clearHideTooltipDelay();
      if(el.getAttribute('data-tooltip-enter') == 'true') {
        lastHideTooltipId = showTooltip(title, new Vector2(e.x, e.y))
        el.setAttribute('data-tooltip-id', lastHideTooltipId.toString());
      }
    });
  }
}
function elementTooltipMouseLeave(e : MouseEvent) : void {
  const el = (<HTMLElement>e.currentTarget);
  el.setAttribute('data-tooltip-enter', 'false');
  closeElementTooltip(el);
  clearShowTooltipDelay();
}
function elementTooltipMouseDown(e : MouseEvent) : void {
  clearShowTooltipDelay();
  closeElementTooltip(<HTMLElement>e.currentTarget);
}

let timerShowTooltipDelay : number|null = null;
let timerHidetooltipDelay : number|null = null;

function registerHideTooltipDelay(callback: () => void) : void {
  if(timerHidetooltipDelay != null)
    clearTimeout(timerHidetooltipDelay);
  timerHidetooltipDelay = setTimeout(() => {
    timerHidetooltipDelay = null;
    callback();
  }, 200);
}
function clearHideTooltipDelay() : void {
  if(timerHidetooltipDelay != null) {
    clearTimeout(timerHidetooltipDelay);
    timerHidetooltipDelay = null;
  }
}
function clearShowTooltipDelay() : void {
  if(timerShowTooltipDelay != null) {
    clearTimeout(timerShowTooltipDelay);
    timerShowTooltipDelay = null;
  }
}
function registerShowTooltipDelay(callback: () => void) : void {
  if(timerShowTooltipDelay != null)
    clearTimeout(timerShowTooltipDelay);
  timerShowTooltipDelay = setTimeout(() => {
    timerShowTooltipDelay = null;
    callback()
  }, 700);
}
