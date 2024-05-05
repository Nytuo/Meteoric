import {
  DomHandler
} from "./chunk-LZMSIMQG.js";
import {
  PrimeTemplate,
  SharedModule
} from "./chunk-WQXH3QF5.js";
import {
  CommonModule,
  DOCUMENT,
  NgClass,
  NgForOf,
  NgIf,
  NgStyle,
  NgTemplateOutlet,
  isPlatformBrowser
} from "./chunk-2JDBUETV.js";
import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  ContentChildren,
  ElementRef,
  EventEmitter,
  Inject,
  Input,
  InputFlags,
  NgModule,
  Output,
  PLATFORM_ID,
  Renderer2,
  ViewChild,
  ViewEncapsulation$1,
  numberAttribute,
  setClassMetadata,
  ɵɵInputTransformsFeature,
  ɵɵadvance,
  ɵɵattribute,
  ɵɵclassMap,
  ɵɵclassProp,
  ɵɵcontentQuery,
  ɵɵdefineComponent,
  ɵɵdefineInjector,
  ɵɵdefineNgModule,
  ɵɵdirectiveInject,
  ɵɵelementContainer,
  ɵɵelementEnd,
  ɵɵelementStart,
  ɵɵgetCurrentView,
  ɵɵlistener,
  ɵɵloadQuery,
  ɵɵnextContext,
  ɵɵproperty,
  ɵɵqueryRefresh,
  ɵɵresetView,
  ɵɵrestoreView,
  ɵɵtemplate,
  ɵɵviewQuery
} from "./chunk-CTXW4UYG.js";
import "./chunk-WSA2QMXP.js";
import "./chunk-J4B6MK7R.js";

// node_modules/primeng/fesm2022/primeng-splitter.mjs
var _c0 = ["container"];
function Splitter_ng_template_2_ng_container_1_Template(rf, ctx) {
  if (rf & 1) {
    ɵɵelementContainer(0);
  }
}
function Splitter_ng_template_2_div_2_Template(rf, ctx) {
  if (rf & 1) {
    const _r1 = ɵɵgetCurrentView();
    ɵɵelementStart(0, "div", 6);
    ɵɵlistener("mousedown", function Splitter_ng_template_2_div_2_Template_div_mousedown_0_listener($event) {
      ɵɵrestoreView(_r1);
      const i_r2 = ɵɵnextContext().index;
      const ctx_r2 = ɵɵnextContext();
      return ɵɵresetView(ctx_r2.onGutterMouseDown($event, i_r2));
    })("touchstart", function Splitter_ng_template_2_div_2_Template_div_touchstart_0_listener($event) {
      ɵɵrestoreView(_r1);
      const i_r2 = ɵɵnextContext().index;
      const ctx_r2 = ɵɵnextContext();
      return ɵɵresetView(ctx_r2.onGutterTouchStart($event, i_r2));
    })("touchmove", function Splitter_ng_template_2_div_2_Template_div_touchmove_0_listener($event) {
      ɵɵrestoreView(_r1);
      const ctx_r2 = ɵɵnextContext(2);
      return ɵɵresetView(ctx_r2.onGutterTouchMove($event));
    })("touchend", function Splitter_ng_template_2_div_2_Template_div_touchend_0_listener($event) {
      ɵɵrestoreView(_r1);
      const i_r2 = ɵɵnextContext().index;
      const ctx_r2 = ɵɵnextContext();
      return ɵɵresetView(ctx_r2.onGutterTouchEnd($event, i_r2));
    });
    ɵɵelementStart(1, "div", 7);
    ɵɵlistener("keyup", function Splitter_ng_template_2_div_2_Template_div_keyup_1_listener($event) {
      ɵɵrestoreView(_r1);
      const ctx_r2 = ɵɵnextContext(2);
      return ɵɵresetView(ctx_r2.onGutterKeyUp($event));
    })("keydown", function Splitter_ng_template_2_div_2_Template_div_keydown_1_listener($event) {
      ɵɵrestoreView(_r1);
      const i_r2 = ɵɵnextContext().index;
      const ctx_r2 = ɵɵnextContext();
      return ɵɵresetView(ctx_r2.onGutterKeyDown($event, i_r2));
    });
    ɵɵelementEnd()();
  }
  if (rf & 2) {
    const ctx_r2 = ɵɵnextContext(2);
    ɵɵattribute("data-p-gutter-resizing", false)("data-pc-section", "gutter");
    ɵɵadvance();
    ɵɵproperty("ngStyle", ctx_r2.gutterStyle());
    ɵɵattribute("aria-orientation", ctx_r2.layout)("aria-valuenow", ctx_r2.prevSize)("data-pc-section", "gutterhandle");
  }
}
function Splitter_ng_template_2_Template(rf, ctx) {
  if (rf & 1) {
    ɵɵelementStart(0, "div", 3);
    ɵɵtemplate(1, Splitter_ng_template_2_ng_container_1_Template, 1, 0, "ng-container", 4);
    ɵɵelementEnd();
    ɵɵtemplate(2, Splitter_ng_template_2_div_2_Template, 2, 6, "div", 5);
  }
  if (rf & 2) {
    const panel_r4 = ctx.$implicit;
    const i_r2 = ctx.index;
    const ctx_r2 = ɵɵnextContext();
    ɵɵclassMap(ctx_r2.panelStyleClass);
    ɵɵproperty("ngClass", ctx_r2.panelContainerClass())("ngStyle", ctx_r2.panelStyle);
    ɵɵattribute("data-pc-name", "splitter")("data-pc-section", "root");
    ɵɵadvance();
    ɵɵproperty("ngTemplateOutlet", panel_r4);
    ɵɵadvance();
    ɵɵproperty("ngIf", i_r2 !== ctx_r2.panels.length - 1);
  }
}
var Splitter = class _Splitter {
  document;
  platformId;
  renderer;
  cd;
  el;
  /**
   * Style class of the component.
   * @group Props
   */
  styleClass;
  /**
   * Style class of the panel.
   * @group Props
   */
  panelStyleClass;
  /**
   * Inline style of the component.
   * @group Props
   */
  style;
  /**
   * Inline style of the panel.
   * @group Props
   */
  panelStyle;
  /**
   * Defines where a stateful splitter keeps its state, valid values are 'session' for sessionStorage and 'local' for localStorage.
   * @group Props
   */
  stateStorage = "session";
  /**
   * Storage identifier of a stateful Splitter.
   * @group Props
   */
  stateKey = null;
  /**
   * Orientation of the panels. Valid values are 'horizontal' and 'vertical'.
   * @group Props
   */
  layout = "horizontal";
  /**
   * Size of the divider in pixels.
   * @group Props
   */
  gutterSize = 4;
  /**
   * Step factor to increment/decrement the size of the panels while pressing the arrow keys.
   * @group Props
   */
  step = 5;
  /**
   * Minimum size of the elements relative to 100%.
   * @group Props
   */
  minSizes = [];
  /**
   * Size of the elements relative to 100%.
   * @group Props
   */
  get panelSizes() {
    return this._panelSizes;
  }
  set panelSizes(val) {
    this._panelSizes = val;
    if (this.el && this.el.nativeElement && this.panels.length > 0) {
      let children = [...this.el.nativeElement.children[0].children].filter((child) => DomHandler.hasClass(child, "p-splitter-panel"));
      let _panelSizes = [];
      this.panels.map((panel, i) => {
        let panelInitialSize = this.panelSizes.length - 1 >= i ? this.panelSizes[i] : null;
        let panelSize = panelInitialSize || 100 / this.panels.length;
        _panelSizes[i] = panelSize;
        children[i].style.flexBasis = "calc(" + panelSize + "% - " + (this.panels.length - 1) * this.gutterSize + "px)";
      });
    }
  }
  /**
   * Callback to invoke when resize ends.
   * @param {SplitterResizeEndEvent} event - Custom panel resize end event
   * @group Emits
   */
  onResizeEnd = new EventEmitter();
  /**
   * Callback to invoke when resize starts.
   * @param {SplitterResizeStartEvent} event - Custom panel resize start event
   * @group Emits
   */
  onResizeStart = new EventEmitter();
  templates;
  containerViewChild;
  nested = false;
  panels = [];
  dragging = false;
  mouseMoveListener;
  mouseUpListener;
  touchMoveListener;
  touchEndListener;
  size;
  gutterElement;
  startPos;
  prevPanelElement;
  nextPanelElement;
  nextPanelSize;
  prevPanelSize;
  _panelSizes = [];
  prevPanelIndex;
  timer;
  prevSize;
  window;
  constructor(document, platformId, renderer, cd, el) {
    this.document = document;
    this.platformId = platformId;
    this.renderer = renderer;
    this.cd = cd;
    this.el = el;
    this.window = this.document.defaultView;
  }
  ngOnInit() {
    this.nested = this.isNested();
  }
  ngAfterContentInit() {
    this.templates.forEach((item) => {
      switch (item.getType()) {
        case "panel":
          this.panels.push(item.template);
          break;
        default:
          this.panels.push(item.template);
          break;
      }
    });
  }
  ngAfterViewInit() {
    if (isPlatformBrowser(this.platformId)) {
      if (this.panels && this.panels.length) {
        let initialized = false;
        if (this.isStateful()) {
          initialized = this.restoreState();
        }
        if (!initialized) {
          let children = [...this.el.nativeElement.children[0].children].filter((child) => DomHandler.hasClass(child, "p-splitter-panel"));
          let _panelSizes = [];
          this.panels.map((panel, i) => {
            let panelInitialSize = this.panelSizes.length - 1 >= i ? this.panelSizes[i] : null;
            let panelSize = panelInitialSize || 100 / this.panels.length;
            _panelSizes[i] = panelSize;
            children[i].style.flexBasis = "calc(" + panelSize + "% - " + (this.panels.length - 1) * this.gutterSize + "px)";
          });
          this._panelSizes = _panelSizes;
          this.prevSize = parseFloat(_panelSizes[0]).toFixed(4);
        }
      }
    }
  }
  resizeStart(event, index, isKeyDown) {
    this.gutterElement = event.currentTarget || event.target.parentElement;
    this.size = this.horizontal() ? DomHandler.getWidth(this.containerViewChild.nativeElement) : DomHandler.getHeight(this.containerViewChild.nativeElement);
    if (!isKeyDown) {
      this.dragging = true;
      this.startPos = this.horizontal() ? event instanceof MouseEvent ? event.pageX : event.changedTouches[0].pageX : event instanceof MouseEvent ? event.pageY : event.changedTouches[0].pageY;
    }
    this.prevPanelElement = this.gutterElement.previousElementSibling;
    this.nextPanelElement = this.gutterElement.nextElementSibling;
    if (isKeyDown) {
      this.prevPanelSize = this.horizontal() ? DomHandler.getOuterWidth(this.prevPanelElement, true) : DomHandler.getOuterHeight(this.prevPanelElement, true);
      this.nextPanelSize = this.horizontal() ? DomHandler.getOuterWidth(this.nextPanelElement, true) : DomHandler.getOuterHeight(this.nextPanelElement, true);
    } else {
      this.prevPanelSize = 100 * (this.horizontal() ? DomHandler.getOuterWidth(this.prevPanelElement, true) : DomHandler.getOuterHeight(this.prevPanelElement, true)) / this.size;
      this.nextPanelSize = 100 * (this.horizontal() ? DomHandler.getOuterWidth(this.nextPanelElement, true) : DomHandler.getOuterHeight(this.nextPanelElement, true)) / this.size;
    }
    this.prevPanelIndex = index;
    DomHandler.addClass(this.gutterElement, "p-splitter-gutter-resizing");
    this.gutterElement.setAttribute("data-p-gutter-resizing", "true");
    DomHandler.addClass(this.containerViewChild.nativeElement, "p-splitter-resizing");
    this.containerViewChild.nativeElement.setAttribute("data-p-resizing", "true");
    this.onResizeStart.emit({
      originalEvent: event,
      sizes: this._panelSizes
    });
  }
  onResize(event, step, isKeyDown) {
    let newPos, newPrevPanelSize, newNextPanelSize;
    if (isKeyDown) {
      if (this.horizontal()) {
        newPrevPanelSize = 100 * (this.prevPanelSize + step) / this.size;
        newNextPanelSize = 100 * (this.nextPanelSize - step) / this.size;
      } else {
        newPrevPanelSize = 100 * (this.prevPanelSize - step) / this.size;
        newNextPanelSize = 100 * (this.nextPanelSize + step) / this.size;
      }
    } else {
      if (this.horizontal())
        newPos = event.pageX * 100 / this.size - this.startPos * 100 / this.size;
      else
        newPos = event.pageY * 100 / this.size - this.startPos * 100 / this.size;
      newPrevPanelSize = this.prevPanelSize + newPos;
      newNextPanelSize = this.nextPanelSize - newPos;
    }
    this.prevSize = parseFloat(newPrevPanelSize).toFixed(4);
    if (this.validateResize(newPrevPanelSize, newNextPanelSize)) {
      this.prevPanelElement.style.flexBasis = "calc(" + newPrevPanelSize + "% - " + (this.panels.length - 1) * this.gutterSize + "px)";
      this.nextPanelElement.style.flexBasis = "calc(" + newNextPanelSize + "% - " + (this.panels.length - 1) * this.gutterSize + "px)";
      this._panelSizes[this.prevPanelIndex] = newPrevPanelSize;
      this._panelSizes[this.prevPanelIndex + 1] = newNextPanelSize;
    }
  }
  resizeEnd(event) {
    if (this.isStateful()) {
      this.saveState();
    }
    this.onResizeEnd.emit({
      originalEvent: event,
      sizes: this._panelSizes
    });
    DomHandler.removeClass(this.gutterElement, "p-splitter-gutter-resizing");
    DomHandler.removeClass(this.containerViewChild.nativeElement, "p-splitter-resizing");
    this.clear();
  }
  onGutterMouseDown(event, index) {
    this.resizeStart(event, index);
    this.bindMouseListeners();
  }
  onGutterTouchStart(event, index) {
    if (event.cancelable) {
      this.resizeStart(event, index);
      this.bindTouchListeners();
      event.preventDefault();
    }
  }
  onGutterTouchMove(event) {
    this.onResize(event);
    event.preventDefault();
  }
  onGutterTouchEnd(event) {
    this.resizeEnd(event);
    this.unbindTouchListeners();
    if (event.cancelable)
      event.preventDefault();
  }
  repeat(event, index, step) {
    this.resizeStart(event, index, true);
    this.onResize(event, step, true);
  }
  setTimer(event, index, step) {
    this.clearTimer();
    this.timer = setTimeout(() => {
      this.repeat(event, index, step);
    }, 40);
  }
  clearTimer() {
    if (this.timer) {
      clearTimeout(this.timer);
    }
  }
  onGutterKeyUp(event) {
    this.clearTimer();
    this.resizeEnd(event);
  }
  onGutterKeyDown(event, index) {
    switch (event.code) {
      case "ArrowLeft": {
        if (this.layout === "horizontal") {
          this.setTimer(event, index, this.step * -1);
        }
        event.preventDefault();
        break;
      }
      case "ArrowRight": {
        if (this.layout === "horizontal") {
          this.setTimer(event, index, this.step);
        }
        event.preventDefault();
        break;
      }
      case "ArrowDown": {
        if (this.layout === "vertical") {
          this.setTimer(event, index, this.step * -1);
        }
        event.preventDefault();
        break;
      }
      case "ArrowUp": {
        if (this.layout === "vertical") {
          this.setTimer(event, index, this.step);
        }
        event.preventDefault();
        break;
      }
      default:
        break;
    }
  }
  validateResize(newPrevPanelSize, newNextPanelSize) {
    if (this.minSizes.length >= 1 && this.minSizes[0] && this.minSizes[0] > newPrevPanelSize) {
      return false;
    }
    if (this.minSizes.length > 1 && this.minSizes[1] && this.minSizes[1] > newNextPanelSize) {
      return false;
    }
    return true;
  }
  bindMouseListeners() {
    if (!this.mouseMoveListener) {
      this.mouseMoveListener = this.renderer.listen(this.document, "mousemove", (event) => {
        this.onResize(event);
      });
    }
    if (!this.mouseUpListener) {
      this.mouseUpListener = this.renderer.listen(this.document, "mouseup", (event) => {
        this.resizeEnd(event);
        this.unbindMouseListeners();
      });
    }
  }
  bindTouchListeners() {
    if (!this.touchMoveListener) {
      this.touchMoveListener = this.renderer.listen(this.document, "touchmove", (event) => {
        this.onResize(event.changedTouches[0]);
      });
    }
    if (!this.touchEndListener) {
      this.touchEndListener = this.renderer.listen(this.document, "touchend", (event) => {
        this.resizeEnd(event);
        this.unbindTouchListeners();
      });
    }
  }
  unbindMouseListeners() {
    if (this.mouseMoveListener) {
      this.mouseMoveListener();
      this.mouseMoveListener = null;
    }
    if (this.mouseUpListener) {
      this.mouseUpListener();
      this.mouseUpListener = null;
    }
  }
  unbindTouchListeners() {
    if (this.touchMoveListener) {
      this.touchMoveListener();
      this.touchMoveListener = null;
    }
    if (this.touchEndListener) {
      this.touchEndListener();
      this.touchEndListener = null;
    }
  }
  clear() {
    this.dragging = false;
    this.size = null;
    this.startPos = null;
    this.prevPanelElement = null;
    this.nextPanelElement = null;
    this.prevPanelSize = null;
    this.nextPanelSize = null;
    this.gutterElement = null;
    this.prevPanelIndex = null;
  }
  isNested() {
    if (this.el.nativeElement) {
      let parent = this.el.nativeElement.parentElement;
      while (parent && !DomHandler.hasClass(parent, "p-splitter")) {
        parent = parent.parentElement;
      }
      return parent !== null;
    } else {
      return false;
    }
  }
  isStateful() {
    return this.stateKey != null;
  }
  getStorage() {
    if (isPlatformBrowser(this.platformId)) {
      switch (this.stateStorage) {
        case "local":
          return this.window.localStorage;
        case "session":
          return this.window.sessionStorage;
        default:
          throw new Error(this.stateStorage + ' is not a valid value for the state storage, supported values are "local" and "session".');
      }
    } else {
      throw new Error("Storage is not a available by default on the server.");
    }
  }
  saveState() {
    this.getStorage().setItem(this.stateKey, JSON.stringify(this._panelSizes));
  }
  restoreState() {
    const storage = this.getStorage();
    const stateString = storage.getItem(this.stateKey);
    if (stateString) {
      this._panelSizes = JSON.parse(stateString);
      let children = [...this.containerViewChild.nativeElement.children].filter((child) => DomHandler.hasClass(child, "p-splitter-panel"));
      children.forEach((child, i) => {
        child.style.flexBasis = "calc(" + this._panelSizes[i] + "% - " + (this.panels.length - 1) * this.gutterSize + "px)";
      });
      return true;
    }
    return false;
  }
  containerClass() {
    return {
      "p-splitter p-component": true,
      "p-splitter-horizontal": this.layout === "horizontal",
      "p-splitter-vertical": this.layout === "vertical"
    };
  }
  panelContainerClass() {
    return {
      "p-splitter-panel": true,
      "p-splitter-panel-nested": true
    };
  }
  gutterStyle() {
    if (this.horizontal())
      return {
        width: this.gutterSize + "px"
      };
    else
      return {
        height: this.gutterSize + "px"
      };
  }
  horizontal() {
    return this.layout === "horizontal";
  }
  static ɵfac = function Splitter_Factory(t) {
    return new (t || _Splitter)(ɵɵdirectiveInject(DOCUMENT), ɵɵdirectiveInject(PLATFORM_ID), ɵɵdirectiveInject(Renderer2), ɵɵdirectiveInject(ChangeDetectorRef), ɵɵdirectiveInject(ElementRef));
  };
  static ɵcmp = ɵɵdefineComponent({
    type: _Splitter,
    selectors: [["p-splitter"]],
    contentQueries: function Splitter_ContentQueries(rf, ctx, dirIndex) {
      if (rf & 1) {
        ɵɵcontentQuery(dirIndex, PrimeTemplate, 4);
      }
      if (rf & 2) {
        let _t;
        ɵɵqueryRefresh(_t = ɵɵloadQuery()) && (ctx.templates = _t);
      }
    },
    viewQuery: function Splitter_Query(rf, ctx) {
      if (rf & 1) {
        ɵɵviewQuery(_c0, 5);
      }
      if (rf & 2) {
        let _t;
        ɵɵqueryRefresh(_t = ɵɵloadQuery()) && (ctx.containerViewChild = _t.first);
      }
    },
    hostAttrs: [1, "p-element"],
    hostVars: 2,
    hostBindings: function Splitter_HostBindings(rf, ctx) {
      if (rf & 2) {
        ɵɵclassProp("p-splitter-panel-nested", ctx.nested);
      }
    },
    inputs: {
      styleClass: "styleClass",
      panelStyleClass: "panelStyleClass",
      style: "style",
      panelStyle: "panelStyle",
      stateStorage: "stateStorage",
      stateKey: "stateKey",
      layout: "layout",
      gutterSize: [InputFlags.HasDecoratorInputTransform, "gutterSize", "gutterSize", numberAttribute],
      step: [InputFlags.HasDecoratorInputTransform, "step", "step", numberAttribute],
      minSizes: [InputFlags.HasDecoratorInputTransform, "minSizes", "minSizes", numberAttribute],
      panelSizes: "panelSizes"
    },
    outputs: {
      onResizeEnd: "onResizeEnd",
      onResizeStart: "onResizeStart"
    },
    features: [ɵɵInputTransformsFeature],
    decls: 3,
    vars: 8,
    consts: [["container", ""], [3, "ngClass", "ngStyle"], ["ngFor", "", 3, "ngForOf"], ["tabindex", "-1", 3, "ngClass", "ngStyle"], [4, "ngTemplateOutlet"], ["class", "p-splitter-gutter", "role", "separator", "tabindex", "-1", 3, "mousedown", "touchstart", "touchmove", "touchend", 4, "ngIf"], ["role", "separator", "tabindex", "-1", 1, "p-splitter-gutter", 3, "mousedown", "touchstart", "touchmove", "touchend"], ["tabindex", "0", 1, "p-splitter-gutter-handle", 3, "keyup", "keydown", "ngStyle"]],
    template: function Splitter_Template(rf, ctx) {
      if (rf & 1) {
        ɵɵelementStart(0, "div", 1, 0);
        ɵɵtemplate(2, Splitter_ng_template_2_Template, 3, 8, "ng-template", 2);
        ɵɵelementEnd();
      }
      if (rf & 2) {
        ɵɵclassMap(ctx.styleClass);
        ɵɵproperty("ngClass", ctx.containerClass())("ngStyle", ctx.style);
        ɵɵattribute("data-pc-name", "splitter")("data-p-gutter-resizing", false)("data-pc-section", "root");
        ɵɵadvance(2);
        ɵɵproperty("ngForOf", ctx.panels);
      }
    },
    dependencies: [NgClass, NgForOf, NgIf, NgTemplateOutlet, NgStyle],
    styles: ["@layer primeng{.p-splitter{display:flex;flex-wrap:nowrap}.p-splitter-vertical{flex-direction:column}.p-splitter-panel{flex-grow:1}.p-splitter-panel-nested{display:flex;min-width:0}.p-splitter-panel p-splitter{flex-grow:1}.p-splitter-panel .p-splitter{flex-grow:1;border:0 none}.p-splitter-gutter{flex-grow:0;flex-shrink:0;display:flex;align-items:center;justify-content:center;cursor:col-resize}.p-splitter-horizontal.p-splitter-resizing{cursor:col-resize;-webkit-user-select:none;user-select:none}.p-splitter-horizontal>.p-splitter-gutter>.p-splitter-gutter-handle{height:24px;width:100%}.p-splitter-horizontal>.p-splitter-gutter{cursor:col-resize}.p-splitter-vertical.p-splitter-resizing{cursor:row-resize;-webkit-user-select:none;user-select:none}.p-splitter-vertical>.p-splitter-gutter{cursor:row-resize}.p-splitter-vertical>.p-splitter-gutter>.p-splitter-gutter-handle{width:24px;height:100%}}\n"],
    encapsulation: 2,
    changeDetection: 0
  });
};
(() => {
  (typeof ngDevMode === "undefined" || ngDevMode) && setClassMetadata(Splitter, [{
    type: Component,
    args: [{
      selector: "p-splitter",
      template: `
        <div #container [ngClass]="containerClass()" [class]="styleClass" [ngStyle]="style" [attr.data-pc-name]="'splitter'" [attr.data-p-gutter-resizing]="false" [attr.data-pc-section]="'root'">
            <ng-template ngFor let-panel [ngForOf]="panels" let-i="index">
                <div [ngClass]="panelContainerClass()" [class]="panelStyleClass" [ngStyle]="panelStyle" tabindex="-1" [attr.data-pc-name]="'splitter'" [attr.data-pc-section]="'root'">
                    <ng-container *ngTemplateOutlet="panel"></ng-container>
                </div>
                <div
                    *ngIf="i !== panels.length - 1"
                    class="p-splitter-gutter"
                    role="separator"
                    tabindex="-1"
                    (mousedown)="onGutterMouseDown($event, i)"
                    (touchstart)="onGutterTouchStart($event, i)"
                    (touchmove)="onGutterTouchMove($event)"
                    (touchend)="onGutterTouchEnd($event, i)"
                    [attr.data-p-gutter-resizing]="false"
                    [attr.data-pc-section]="'gutter'"
                >
                    <div
                        class="p-splitter-gutter-handle"
                        tabindex="0"
                        [ngStyle]="gutterStyle()"
                        [attr.aria-orientation]="layout"
                        [attr.aria-valuenow]="prevSize"
                        [attr.data-pc-section]="'gutterhandle'"
                        (keyup)="onGutterKeyUp($event)"
                        (keydown)="onGutterKeyDown($event, i)"
                    ></div>
                </div>
            </ng-template>
        </div>
    `,
      encapsulation: ViewEncapsulation$1.None,
      changeDetection: ChangeDetectionStrategy.OnPush,
      host: {
        class: "p-element",
        "[class.p-splitter-panel-nested]": "nested"
      },
      styles: ["@layer primeng{.p-splitter{display:flex;flex-wrap:nowrap}.p-splitter-vertical{flex-direction:column}.p-splitter-panel{flex-grow:1}.p-splitter-panel-nested{display:flex;min-width:0}.p-splitter-panel p-splitter{flex-grow:1}.p-splitter-panel .p-splitter{flex-grow:1;border:0 none}.p-splitter-gutter{flex-grow:0;flex-shrink:0;display:flex;align-items:center;justify-content:center;cursor:col-resize}.p-splitter-horizontal.p-splitter-resizing{cursor:col-resize;-webkit-user-select:none;user-select:none}.p-splitter-horizontal>.p-splitter-gutter>.p-splitter-gutter-handle{height:24px;width:100%}.p-splitter-horizontal>.p-splitter-gutter{cursor:col-resize}.p-splitter-vertical.p-splitter-resizing{cursor:row-resize;-webkit-user-select:none;user-select:none}.p-splitter-vertical>.p-splitter-gutter{cursor:row-resize}.p-splitter-vertical>.p-splitter-gutter>.p-splitter-gutter-handle{width:24px;height:100%}}\n"]
    }]
  }], () => [{
    type: Document,
    decorators: [{
      type: Inject,
      args: [DOCUMENT]
    }]
  }, {
    type: void 0,
    decorators: [{
      type: Inject,
      args: [PLATFORM_ID]
    }]
  }, {
    type: Renderer2
  }, {
    type: ChangeDetectorRef
  }, {
    type: ElementRef
  }], {
    styleClass: [{
      type: Input
    }],
    panelStyleClass: [{
      type: Input
    }],
    style: [{
      type: Input
    }],
    panelStyle: [{
      type: Input
    }],
    stateStorage: [{
      type: Input
    }],
    stateKey: [{
      type: Input
    }],
    layout: [{
      type: Input
    }],
    gutterSize: [{
      type: Input,
      args: [{
        transform: numberAttribute
      }]
    }],
    step: [{
      type: Input,
      args: [{
        transform: numberAttribute
      }]
    }],
    minSizes: [{
      type: Input,
      args: [{
        transform: numberAttribute
      }]
    }],
    panelSizes: [{
      type: Input
    }],
    onResizeEnd: [{
      type: Output
    }],
    onResizeStart: [{
      type: Output
    }],
    templates: [{
      type: ContentChildren,
      args: [PrimeTemplate]
    }],
    containerViewChild: [{
      type: ViewChild,
      args: ["container", {
        static: false
      }]
    }]
  });
})();
var SplitterModule = class _SplitterModule {
  static ɵfac = function SplitterModule_Factory(t) {
    return new (t || _SplitterModule)();
  };
  static ɵmod = ɵɵdefineNgModule({
    type: _SplitterModule,
    declarations: [Splitter],
    imports: [CommonModule],
    exports: [Splitter, SharedModule]
  });
  static ɵinj = ɵɵdefineInjector({
    imports: [CommonModule, SharedModule]
  });
};
(() => {
  (typeof ngDevMode === "undefined" || ngDevMode) && setClassMetadata(SplitterModule, [{
    type: NgModule,
    args: [{
      imports: [CommonModule],
      exports: [Splitter, SharedModule],
      declarations: [Splitter]
    }]
  }], null, null);
})();
export {
  Splitter,
  SplitterModule
};
//# sourceMappingURL=primeng_splitter.js.map
