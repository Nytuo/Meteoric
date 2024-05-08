import {
  ChevronUpIcon
} from "./chunk-QDEMBNGZ.js";
import {
  ChevronDownIcon
} from "./chunk-XPAX3GC7.js";
import {
  ChevronLeftIcon,
  ChevronRightIcon
} from "./chunk-WIZ6WIP2.js";
import "./chunk-ES2WXWOB.js";
import {
  Ripple,
  RippleModule
} from "./chunk-SHG4VVST.js";
import {
  DomHandler
} from "./chunk-LZMSIMQG.js";
import {
  Footer,
  Header,
  PrimeNGConfig,
  PrimeTemplate,
  SharedModule,
  UniqueComponentId
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
  ContentChild,
  ContentChildren,
  ElementRef,
  EventEmitter,
  Inject,
  Input,
  InputFlags,
  NgModule,
  NgZone,
  Output,
  PLATFORM_ID,
  Renderer2,
  ViewChild,
  ViewEncapsulation$1,
  booleanAttribute,
  numberAttribute,
  setClassMetadata,
  ɵɵInputTransformsFeature,
  ɵɵNgOnChangesFeature,
  ɵɵadvance,
  ɵɵattribute,
  ɵɵclassMap,
  ɵɵcontentQuery,
  ɵɵdefineComponent,
  ɵɵdefineInjector,
  ɵɵdefineNgModule,
  ɵɵdirectiveInject,
  ɵɵelement,
  ɵɵelementContainer,
  ɵɵelementContainerEnd,
  ɵɵelementContainerStart,
  ɵɵelementEnd,
  ɵɵelementStart,
  ɵɵgetCurrentView,
  ɵɵlistener,
  ɵɵloadQuery,
  ɵɵnextContext,
  ɵɵprojection,
  ɵɵprojectionDef,
  ɵɵproperty,
  ɵɵpureFunction1,
  ɵɵpureFunction2,
  ɵɵpureFunction3,
  ɵɵqueryRefresh,
  ɵɵresetView,
  ɵɵrestoreView,
  ɵɵtemplate,
  ɵɵviewQuery
} from "./chunk-CTXW4UYG.js";
import "./chunk-WSA2QMXP.js";
import "./chunk-J4B6MK7R.js";

// node_modules/primeng/fesm2022/primeng-carousel.mjs
var _c0 = ["itemsContainer"];
var _c1 = ["indicatorContent"];
var _c2 = [[["p-header"]], [["p-footer"]]];
var _c3 = ["p-header", "p-footer"];
var _c4 = (a0, a1) => ({
  "p-carousel p-component": true,
  "p-carousel-vertical": a0,
  "p-carousel-horizontal": a1
});
var _c5 = (a0) => ({
  height: a0
});
var _c6 = (a0) => ({
  "p-carousel-prev p-link": true,
  "p-disabled": a0
});
var _c7 = (a0, a1, a2) => ({
  "p-carousel-item p-carousel-item-cloned": true,
  "p-carousel-item-active": a0,
  "p-carousel-item-start": a1,
  "p-carousel-item-end": a2
});
var _c8 = (a0) => ({
  $implicit: a0
});
var _c9 = (a0, a1, a2) => ({
  "p-carousel-item": true,
  "p-carousel-item-active": a0,
  "p-carousel-item-start": a1,
  "p-carousel-item-end": a2
});
var _c10 = (a0) => ({
  "p-carousel-next p-link": true,
  "p-disabled": a0
});
var _c11 = (a0) => ({
  "p-carousel-indicator": true,
  "p-highlight": a0
});
function Carousel_div_1_ng_container_2_Template(rf, ctx) {
  if (rf & 1) {
    ɵɵelementContainer(0);
  }
}
function Carousel_div_1_Template(rf, ctx) {
  if (rf & 1) {
    ɵɵelementStart(0, "div", 12);
    ɵɵprojection(1);
    ɵɵtemplate(2, Carousel_div_1_ng_container_2_Template, 1, 0, "ng-container", 13);
    ɵɵelementEnd();
  }
  if (rf & 2) {
    const ctx_r1 = ɵɵnextContext();
    ɵɵadvance(2);
    ɵɵproperty("ngTemplateOutlet", ctx_r1.headerTemplate);
  }
}
function Carousel_button_4_ng_container_1_ChevronLeftIcon_1_Template(rf, ctx) {
  if (rf & 1) {
    ɵɵelement(0, "ChevronLeftIcon", 18);
  }
  if (rf & 2) {
    ɵɵproperty("styleClass", "carousel-prev-icon");
  }
}
function Carousel_button_4_ng_container_1_ChevronUpIcon_2_Template(rf, ctx) {
  if (rf & 1) {
    ɵɵelement(0, "ChevronUpIcon", 18);
  }
  if (rf & 2) {
    ɵɵproperty("styleClass", "carousel-prev-icon");
  }
}
function Carousel_button_4_ng_container_1_Template(rf, ctx) {
  if (rf & 1) {
    ɵɵelementContainerStart(0);
    ɵɵtemplate(1, Carousel_button_4_ng_container_1_ChevronLeftIcon_1_Template, 1, 1, "ChevronLeftIcon", 17)(2, Carousel_button_4_ng_container_1_ChevronUpIcon_2_Template, 1, 1, "ChevronUpIcon", 17);
    ɵɵelementContainerEnd();
  }
  if (rf & 2) {
    const ctx_r1 = ɵɵnextContext(2);
    ɵɵadvance();
    ɵɵproperty("ngIf", !ctx_r1.isVertical());
    ɵɵadvance();
    ɵɵproperty("ngIf", ctx_r1.isVertical());
  }
}
function Carousel_button_4_span_2_1_ng_template_0_Template(rf, ctx) {
}
function Carousel_button_4_span_2_1_Template(rf, ctx) {
  if (rf & 1) {
    ɵɵtemplate(0, Carousel_button_4_span_2_1_ng_template_0_Template, 0, 0, "ng-template");
  }
}
function Carousel_button_4_span_2_Template(rf, ctx) {
  if (rf & 1) {
    ɵɵelementStart(0, "span", 19);
    ɵɵtemplate(1, Carousel_button_4_span_2_1_Template, 1, 0, null, 13);
    ɵɵelementEnd();
  }
  if (rf & 2) {
    const ctx_r1 = ɵɵnextContext(2);
    ɵɵadvance();
    ɵɵproperty("ngTemplateOutlet", ctx_r1.previousIconTemplate);
  }
}
function Carousel_button_4_Template(rf, ctx) {
  if (rf & 1) {
    const _r3 = ɵɵgetCurrentView();
    ɵɵelementStart(0, "button", 14);
    ɵɵlistener("click", function Carousel_button_4_Template_button_click_0_listener($event) {
      ɵɵrestoreView(_r3);
      const ctx_r1 = ɵɵnextContext();
      return ɵɵresetView(ctx_r1.navBackward($event));
    });
    ɵɵtemplate(1, Carousel_button_4_ng_container_1_Template, 3, 2, "ng-container", 15)(2, Carousel_button_4_span_2_Template, 2, 1, "span", 16);
    ɵɵelementEnd();
  }
  if (rf & 2) {
    const ctx_r1 = ɵɵnextContext();
    ɵɵproperty("ngClass", ɵɵpureFunction1(5, _c6, ctx_r1.isBackwardNavDisabled()))("disabled", ctx_r1.isBackwardNavDisabled());
    ɵɵattribute("aria-label", ctx_r1.ariaPrevButtonLabel());
    ɵɵadvance();
    ɵɵproperty("ngIf", !ctx_r1.previousIconTemplate);
    ɵɵadvance();
    ɵɵproperty("ngIf", ctx_r1.previousIconTemplate);
  }
}
function Carousel_div_8_ng_container_1_Template(rf, ctx) {
  if (rf & 1) {
    ɵɵelementContainer(0);
  }
}
function Carousel_div_8_Template(rf, ctx) {
  if (rf & 1) {
    ɵɵelementStart(0, "div", 4);
    ɵɵtemplate(1, Carousel_div_8_ng_container_1_Template, 1, 0, "ng-container", 20);
    ɵɵelementEnd();
  }
  if (rf & 2) {
    const item_r4 = ctx.$implicit;
    const index_r5 = ctx.index;
    const ctx_r1 = ɵɵnextContext();
    ɵɵproperty("ngClass", ɵɵpureFunction3(6, _c7, ctx_r1.totalShiftedItems * -1 === ctx_r1.value.length, 0 === index_r5, ctx_r1.clonedItemsForStarting.length - 1 === index_r5));
    ɵɵattribute("aria-hidden", !(ctx_r1.totalShiftedItems * -1 === ctx_r1.value.length))("aria-label", ctx_r1.ariaSlideNumber(index_r5))("aria-roledescription", ctx_r1.ariaSlideLabel());
    ɵɵadvance();
    ɵɵproperty("ngTemplateOutlet", ctx_r1.itemTemplate)("ngTemplateOutletContext", ɵɵpureFunction1(10, _c8, item_r4));
  }
}
function Carousel_div_9_ng_container_1_Template(rf, ctx) {
  if (rf & 1) {
    ɵɵelementContainer(0);
  }
}
function Carousel_div_9_Template(rf, ctx) {
  if (rf & 1) {
    ɵɵelementStart(0, "div", 4);
    ɵɵtemplate(1, Carousel_div_9_ng_container_1_Template, 1, 0, "ng-container", 20);
    ɵɵelementEnd();
  }
  if (rf & 2) {
    const item_r6 = ctx.$implicit;
    const index_r7 = ctx.index;
    const ctx_r1 = ɵɵnextContext();
    ɵɵproperty("ngClass", ɵɵpureFunction3(6, _c9, ctx_r1.firstIndex() <= index_r7 && ctx_r1.lastIndex() >= index_r7, ctx_r1.firstIndex() === index_r7, ctx_r1.lastIndex() === index_r7));
    ɵɵattribute("aria-hidden", !(ctx_r1.totalShiftedItems * -1 === ctx_r1.value.length))("aria-label", ctx_r1.ariaSlideNumber(index_r7))("aria-roledescription", ctx_r1.ariaSlideLabel());
    ɵɵadvance();
    ɵɵproperty("ngTemplateOutlet", ctx_r1.itemTemplate)("ngTemplateOutletContext", ɵɵpureFunction1(10, _c8, item_r6));
  }
}
function Carousel_div_10_ng_container_1_Template(rf, ctx) {
  if (rf & 1) {
    ɵɵelementContainer(0);
  }
}
function Carousel_div_10_Template(rf, ctx) {
  if (rf & 1) {
    ɵɵelementStart(0, "div", 4);
    ɵɵtemplate(1, Carousel_div_10_ng_container_1_Template, 1, 0, "ng-container", 20);
    ɵɵelementEnd();
  }
  if (rf & 2) {
    const item_r8 = ctx.$implicit;
    const index_r9 = ctx.index;
    const ctx_r1 = ɵɵnextContext();
    ɵɵproperty("ngClass", ɵɵpureFunction3(3, _c7, ctx_r1.totalShiftedItems * -1 === ctx_r1.numVisible, 0 === index_r9, ctx_r1.clonedItemsForFinishing.length - 1 === index_r9));
    ɵɵadvance();
    ɵɵproperty("ngTemplateOutlet", ctx_r1.itemTemplate)("ngTemplateOutletContext", ɵɵpureFunction1(7, _c8, item_r8));
  }
}
function Carousel_button_11_ng_container_1_ChevronRightIcon_1_Template(rf, ctx) {
  if (rf & 1) {
    ɵɵelement(0, "ChevronRightIcon", 18);
  }
  if (rf & 2) {
    ɵɵproperty("styleClass", "carousel-prev-icon");
  }
}
function Carousel_button_11_ng_container_1_ChevronDownIcon_2_Template(rf, ctx) {
  if (rf & 1) {
    ɵɵelement(0, "ChevronDownIcon", 18);
  }
  if (rf & 2) {
    ɵɵproperty("styleClass", "carousel-prev-icon");
  }
}
function Carousel_button_11_ng_container_1_Template(rf, ctx) {
  if (rf & 1) {
    ɵɵelementContainerStart(0);
    ɵɵtemplate(1, Carousel_button_11_ng_container_1_ChevronRightIcon_1_Template, 1, 1, "ChevronRightIcon", 17)(2, Carousel_button_11_ng_container_1_ChevronDownIcon_2_Template, 1, 1, "ChevronDownIcon", 17);
    ɵɵelementContainerEnd();
  }
  if (rf & 2) {
    const ctx_r1 = ɵɵnextContext(2);
    ɵɵadvance();
    ɵɵproperty("ngIf", !ctx_r1.isVertical());
    ɵɵadvance();
    ɵɵproperty("ngIf", ctx_r1.isVertical());
  }
}
function Carousel_button_11_span_2_1_ng_template_0_Template(rf, ctx) {
}
function Carousel_button_11_span_2_1_Template(rf, ctx) {
  if (rf & 1) {
    ɵɵtemplate(0, Carousel_button_11_span_2_1_ng_template_0_Template, 0, 0, "ng-template");
  }
}
function Carousel_button_11_span_2_Template(rf, ctx) {
  if (rf & 1) {
    ɵɵelementStart(0, "span", 19);
    ɵɵtemplate(1, Carousel_button_11_span_2_1_Template, 1, 0, null, 13);
    ɵɵelementEnd();
  }
  if (rf & 2) {
    const ctx_r1 = ɵɵnextContext(2);
    ɵɵadvance();
    ɵɵproperty("ngTemplateOutlet", ctx_r1.nextIconTemplate);
  }
}
function Carousel_button_11_Template(rf, ctx) {
  if (rf & 1) {
    const _r10 = ɵɵgetCurrentView();
    ɵɵelementStart(0, "button", 14);
    ɵɵlistener("click", function Carousel_button_11_Template_button_click_0_listener($event) {
      ɵɵrestoreView(_r10);
      const ctx_r1 = ɵɵnextContext();
      return ɵɵresetView(ctx_r1.navForward($event));
    });
    ɵɵtemplate(1, Carousel_button_11_ng_container_1_Template, 3, 2, "ng-container", 15)(2, Carousel_button_11_span_2_Template, 2, 1, "span", 16);
    ɵɵelementEnd();
  }
  if (rf & 2) {
    const ctx_r1 = ɵɵnextContext();
    ɵɵproperty("ngClass", ɵɵpureFunction1(5, _c10, ctx_r1.isForwardNavDisabled()))("disabled", ctx_r1.isForwardNavDisabled());
    ɵɵattribute("aria-label", ctx_r1.ariaNextButtonLabel());
    ɵɵadvance();
    ɵɵproperty("ngIf", !ctx_r1.nextIconTemplate);
    ɵɵadvance();
    ɵɵproperty("ngIf", ctx_r1.nextIconTemplate);
  }
}
function Carousel_ul_12_li_2_Template(rf, ctx) {
  if (rf & 1) {
    const _r12 = ɵɵgetCurrentView();
    ɵɵelementStart(0, "li", 4)(1, "button", 22);
    ɵɵlistener("click", function Carousel_ul_12_li_2_Template_button_click_1_listener($event) {
      const i_r13 = ɵɵrestoreView(_r12).index;
      const ctx_r1 = ɵɵnextContext(2);
      return ɵɵresetView(ctx_r1.onDotClick($event, i_r13));
    });
    ɵɵelementEnd()();
  }
  if (rf & 2) {
    const i_r13 = ctx.index;
    const ctx_r1 = ɵɵnextContext(2);
    ɵɵproperty("ngClass", ɵɵpureFunction1(9, _c11, ctx_r1._page === i_r13));
    ɵɵattribute("data-pc-section", "indicator");
    ɵɵadvance();
    ɵɵclassMap(ctx_r1.indicatorStyleClass);
    ɵɵproperty("ngClass", "p-link")("ngStyle", ctx_r1.indicatorStyle)("tabindex", ctx_r1._page === i_r13 ? 0 : -1);
    ɵɵattribute("aria-label", ctx_r1.ariaPageLabel(i_r13 + 1))("aria-current", ctx_r1._page === i_r13 ? "page" : void 0);
  }
}
function Carousel_ul_12_Template(rf, ctx) {
  if (rf & 1) {
    const _r11 = ɵɵgetCurrentView();
    ɵɵelementStart(0, "ul", 21, 1);
    ɵɵlistener("keydown", function Carousel_ul_12_Template_ul_keydown_0_listener($event) {
      ɵɵrestoreView(_r11);
      const ctx_r1 = ɵɵnextContext();
      return ɵɵresetView(ctx_r1.onIndicatorKeydown($event));
    });
    ɵɵtemplate(2, Carousel_ul_12_li_2_Template, 2, 11, "li", 9);
    ɵɵelementEnd();
  }
  if (rf & 2) {
    const ctx_r1 = ɵɵnextContext();
    ɵɵclassMap(ctx_r1.indicatorsContentClass);
    ɵɵproperty("ngClass", "p-carousel-indicators p-reset")("ngStyle", ctx_r1.indicatorsContentStyle);
    ɵɵadvance(2);
    ɵɵproperty("ngForOf", ctx_r1.totalDotsArray());
  }
}
function Carousel_div_13_ng_container_2_Template(rf, ctx) {
  if (rf & 1) {
    ɵɵelementContainer(0);
  }
}
function Carousel_div_13_Template(rf, ctx) {
  if (rf & 1) {
    ɵɵelementStart(0, "div", 23);
    ɵɵprojection(1, 1);
    ɵɵtemplate(2, Carousel_div_13_ng_container_2_Template, 1, 0, "ng-container", 13);
    ɵɵelementEnd();
  }
  if (rf & 2) {
    const ctx_r1 = ɵɵnextContext();
    ɵɵadvance(2);
    ɵɵproperty("ngTemplateOutlet", ctx_r1.footerTemplate);
  }
}
var Carousel = class _Carousel {
  el;
  zone;
  cd;
  renderer;
  document;
  platformId;
  config;
  /**
   * Index of the first item.
   * @defaultValue 0
   * @group Props
   */
  get page() {
    return this._page;
  }
  set page(val) {
    if (this.isCreated && val !== this._page) {
      if (this.autoplayInterval) {
        this.stopAutoplay();
      }
      if (val > this._page && val <= this.totalDots() - 1) {
        this.step(-1, val);
      } else if (val < this._page) {
        this.step(1, val);
      }
    }
    this._page = val;
  }
  /**
   * Number of items per page.
   * @defaultValue 1
   * @group Props
   */
  get numVisible() {
    return this._numVisible;
  }
  set numVisible(val) {
    this._numVisible = val;
  }
  /**
   * Number of items to scroll.
   * @defaultValue 1
   * @group Props
   */
  get numScroll() {
    return this._numVisible;
  }
  set numScroll(val) {
    this._numScroll = val;
  }
  /**
   * An array of options for responsive design.
   * @see {CarouselResponsiveOptions}
   * @group Props
   */
  responsiveOptions;
  /**
   * Specifies the layout of the component.
   * @group Props
   */
  orientation = "horizontal";
  /**
   * Height of the viewport in vertical layout.
   * @group Props
   */
  verticalViewPortHeight = "300px";
  /**
   * Style class of main content.
   * @group Props
   */
  contentClass = "";
  /**
   * Style class of the indicator items.
   * @group Props
   */
  indicatorsContentClass = "";
  /**
   * Inline style of the indicator items.
   * @group Props
   */
  indicatorsContentStyle;
  /**
   * Style class of the indicators.
   * @group Props
   */
  indicatorStyleClass = "";
  /**
   * Style of the indicators.
   * @group Props
   */
  indicatorStyle;
  /**
   * An array of objects to display.
   * @defaultValue null
   * @group Props
   */
  get value() {
    return this._value;
  }
  set value(val) {
    this._value = val;
  }
  /**
   * Defines if scrolling would be infinite.
   * @group Props
   */
  circular = false;
  /**
   * Whether to display indicator container.
   * @group Props
   */
  showIndicators = true;
  /**
   * Whether to display navigation buttons in container.
   * @group Props
   */
  showNavigators = true;
  /**
   * Time in milliseconds to scroll items automatically.
   * @group Props
   */
  autoplayInterval = 0;
  /**
   * Inline style of the component.
   * @group Props
   */
  style;
  /**
   * Style class of the viewport container.
   * @group Props
   */
  styleClass;
  /**
   * Callback to invoke after scroll.
   * @param {CarouselPageEvent} event - Custom page event.
   * @group Emits
   */
  onPage = new EventEmitter();
  itemsContainer;
  indicatorContent;
  headerFacet;
  footerFacet;
  templates;
  _numVisible = 1;
  _numScroll = 1;
  _oldNumScroll = 0;
  prevState = {
    numScroll: 0,
    numVisible: 0,
    value: []
  };
  defaultNumScroll = 1;
  defaultNumVisible = 1;
  _page = 0;
  _value;
  carouselStyle;
  id;
  totalShiftedItems;
  isRemainingItemsAdded = false;
  animationTimeout;
  translateTimeout;
  remainingItems = 0;
  _items;
  startPos;
  documentResizeListener;
  clonedItemsForStarting;
  clonedItemsForFinishing;
  allowAutoplay;
  interval;
  isCreated;
  swipeThreshold = 20;
  itemTemplate;
  headerTemplate;
  footerTemplate;
  previousIconTemplate;
  nextIconTemplate;
  window;
  constructor(el, zone, cd, renderer, document, platformId, config) {
    this.el = el;
    this.zone = zone;
    this.cd = cd;
    this.renderer = renderer;
    this.document = document;
    this.platformId = platformId;
    this.config = config;
    this.totalShiftedItems = this.page * this.numScroll * -1;
    this.window = this.document.defaultView;
  }
  ngOnChanges(simpleChange) {
    if (isPlatformBrowser(this.platformId)) {
      if (simpleChange.value) {
        if (this.circular && this._value) {
          this.setCloneItems();
        }
      }
      if (this.isCreated) {
        if (simpleChange.numVisible) {
          if (this.responsiveOptions) {
            this.defaultNumVisible = this.numVisible;
          }
          if (this.isCircular()) {
            this.setCloneItems();
          }
          this.createStyle();
          this.calculatePosition();
        }
        if (simpleChange.numScroll) {
          if (this.responsiveOptions) {
            this.defaultNumScroll = this.numScroll;
          }
        }
      }
    }
    this.cd.markForCheck();
  }
  ngAfterContentInit() {
    this.id = UniqueComponentId();
    if (isPlatformBrowser(this.platformId)) {
      this.allowAutoplay = !!this.autoplayInterval;
      if (this.circular) {
        this.setCloneItems();
      }
      if (this.responsiveOptions) {
        this.defaultNumScroll = this._numScroll;
        this.defaultNumVisible = this._numVisible;
      }
      this.createStyle();
      this.calculatePosition();
      if (this.responsiveOptions) {
        this.bindDocumentListeners();
      }
    }
    this.templates?.forEach((item) => {
      switch (item.getType()) {
        case "item":
          this.itemTemplate = item.template;
          break;
        case "header":
          this.headerTemplate = item.template;
          break;
        case "footer":
          this.footerTemplate = item.template;
          break;
        case "previousicon":
          this.previousIconTemplate = item.template;
          break;
        case "nexticon":
          this.nextIconTemplate = item.template;
          break;
        default:
          this.itemTemplate = item.template;
          break;
      }
    });
    this.cd.detectChanges();
  }
  ngAfterContentChecked() {
    if (isPlatformBrowser(this.platformId)) {
      const isCircular = this.isCircular();
      let totalShiftedItems = this.totalShiftedItems;
      if (this.value && this.itemsContainer && (this.prevState.numScroll !== this._numScroll || this.prevState.numVisible !== this._numVisible || this.prevState.value.length !== this.value.length)) {
        if (this.autoplayInterval) {
          this.stopAutoplay(false);
        }
        this.remainingItems = (this.value.length - this._numVisible) % this._numScroll;
        let page = this._page;
        if (this.totalDots() !== 0 && page >= this.totalDots()) {
          page = this.totalDots() - 1;
          this._page = page;
          this.onPage.emit({
            page: this.page
          });
        }
        totalShiftedItems = page * this._numScroll * -1;
        if (isCircular) {
          totalShiftedItems -= this._numVisible;
        }
        if (page === this.totalDots() - 1 && this.remainingItems > 0) {
          totalShiftedItems += -1 * this.remainingItems + this._numScroll;
          this.isRemainingItemsAdded = true;
        } else {
          this.isRemainingItemsAdded = false;
        }
        if (totalShiftedItems !== this.totalShiftedItems) {
          this.totalShiftedItems = totalShiftedItems;
        }
        this._oldNumScroll = this._numScroll;
        this.prevState.numScroll = this._numScroll;
        this.prevState.numVisible = this._numVisible;
        this.prevState.value = [...this._value];
        if (this.totalDots() > 0 && this.itemsContainer.nativeElement) {
          this.itemsContainer.nativeElement.style.transform = this.isVertical() ? `translate3d(0, ${totalShiftedItems * (100 / this._numVisible)}%, 0)` : `translate3d(${totalShiftedItems * (100 / this._numVisible)}%, 0, 0)`;
        }
        this.isCreated = true;
        if (this.autoplayInterval && this.isAutoplay()) {
          this.startAutoplay();
        }
      }
      if (isCircular) {
        if (this.page === 0) {
          totalShiftedItems = -1 * this._numVisible;
        } else if (totalShiftedItems === 0) {
          totalShiftedItems = -1 * this.value.length;
          if (this.remainingItems > 0) {
            this.isRemainingItemsAdded = true;
          }
        }
        if (totalShiftedItems !== this.totalShiftedItems) {
          this.totalShiftedItems = totalShiftedItems;
        }
      }
    }
  }
  createStyle() {
    if (!this.carouselStyle) {
      this.carouselStyle = this.renderer.createElement("style");
      this.carouselStyle.type = "text/css";
      this.renderer.appendChild(this.document.head, this.carouselStyle);
    }
    let innerHTML = `
            #${this.id} .p-carousel-item {
				flex: 1 0 ${100 / this.numVisible}%
			}
        `;
    if (this.responsiveOptions) {
      this.responsiveOptions.sort((data1, data2) => {
        const value1 = data1.breakpoint;
        const value2 = data2.breakpoint;
        let result = null;
        if (value1 == null && value2 != null)
          result = -1;
        else if (value1 != null && value2 == null)
          result = 1;
        else if (value1 == null && value2 == null)
          result = 0;
        else if (typeof value1 === "string" && typeof value2 === "string")
          result = value1.localeCompare(value2, void 0, {
            numeric: true
          });
        else
          result = value1 < value2 ? -1 : value1 > value2 ? 1 : 0;
        return -1 * result;
      });
      for (let i = 0; i < this.responsiveOptions.length; i++) {
        let res = this.responsiveOptions[i];
        innerHTML += `
                    @media screen and (max-width: ${res.breakpoint}) {
                        #${this.id} .p-carousel-item {
                            flex: 1 0 ${100 / res.numVisible}%
                        }
                    }
                `;
      }
    }
    this.carouselStyle.innerHTML = innerHTML;
  }
  calculatePosition() {
    if (this.responsiveOptions) {
      let matchedResponsiveData = {
        numVisible: this.defaultNumVisible,
        numScroll: this.defaultNumScroll
      };
      if (typeof window !== "undefined") {
        let windowWidth = window.innerWidth;
        for (let i = 0; i < this.responsiveOptions.length; i++) {
          let res = this.responsiveOptions[i];
          if (parseInt(res.breakpoint, 10) >= windowWidth) {
            matchedResponsiveData = res;
          }
        }
      }
      if (this._numScroll !== matchedResponsiveData.numScroll) {
        let page = this._page;
        page = Math.floor(page * this._numScroll / matchedResponsiveData.numScroll);
        let totalShiftedItems = matchedResponsiveData.numScroll * this.page * -1;
        if (this.isCircular()) {
          totalShiftedItems -= matchedResponsiveData.numVisible;
        }
        this.totalShiftedItems = totalShiftedItems;
        this._numScroll = matchedResponsiveData.numScroll;
        this._page = page;
        this.onPage.emit({
          page: this.page
        });
      }
      if (this._numVisible !== matchedResponsiveData.numVisible) {
        this._numVisible = matchedResponsiveData.numVisible;
        this.setCloneItems();
      }
      this.cd.markForCheck();
    }
  }
  setCloneItems() {
    this.clonedItemsForStarting = [];
    this.clonedItemsForFinishing = [];
    if (this.isCircular()) {
      this.clonedItemsForStarting.push(...this.value.slice(-1 * this._numVisible));
      this.clonedItemsForFinishing.push(...this.value.slice(0, this._numVisible));
    }
  }
  firstIndex() {
    return this.isCircular() ? -1 * (this.totalShiftedItems + this.numVisible) : this.totalShiftedItems * -1;
  }
  lastIndex() {
    return this.firstIndex() + this.numVisible - 1;
  }
  totalDots() {
    return this.value?.length ? Math.ceil((this.value.length - this._numVisible) / this._numScroll) + 1 : 0;
  }
  totalDotsArray() {
    const totalDots = this.totalDots();
    return totalDots <= 0 ? [] : Array(totalDots).fill(0);
  }
  isVertical() {
    return this.orientation === "vertical";
  }
  isCircular() {
    return this.circular && this.value && this.value.length >= this.numVisible;
  }
  isAutoplay() {
    return this.autoplayInterval && this.allowAutoplay;
  }
  isForwardNavDisabled() {
    return this.isEmpty() || this._page >= this.totalDots() - 1 && !this.isCircular();
  }
  isBackwardNavDisabled() {
    return this.isEmpty() || this._page <= 0 && !this.isCircular();
  }
  isEmpty() {
    return !this.value || this.value.length === 0;
  }
  navForward(e, index) {
    if (this.isCircular() || this._page < this.totalDots() - 1) {
      this.step(-1, index);
    }
    if (this.autoplayInterval) {
      this.stopAutoplay();
    }
    if (e && e.cancelable) {
      e.preventDefault();
    }
  }
  navBackward(e, index) {
    if (this.isCircular() || this._page !== 0) {
      this.step(1, index);
    }
    if (this.autoplayInterval) {
      this.stopAutoplay();
    }
    if (e && e.cancelable) {
      e.preventDefault();
    }
  }
  onDotClick(e, index) {
    let page = this._page;
    if (this.autoplayInterval) {
      this.stopAutoplay();
    }
    if (index > page) {
      this.navForward(e, index);
    } else if (index < page) {
      this.navBackward(e, index);
    }
  }
  onIndicatorKeydown(event) {
    switch (event.code) {
      case "ArrowRight":
        this.onRightKey();
        break;
      case "ArrowLeft":
        this.onLeftKey();
        break;
    }
  }
  onRightKey() {
    const indicators = [...DomHandler.find(this.indicatorContent.nativeElement, '[data-pc-section="indicator"]')];
    const activeIndex = this.findFocusedIndicatorIndex();
    this.changedFocusedIndicator(activeIndex, activeIndex + 1 === indicators.length ? indicators.length - 1 : activeIndex + 1);
  }
  onLeftKey() {
    const activeIndex = this.findFocusedIndicatorIndex();
    this.changedFocusedIndicator(activeIndex, activeIndex - 1 <= 0 ? 0 : activeIndex - 1);
  }
  onHomeKey() {
    const activeIndex = this.findFocusedIndicatorIndex();
    this.changedFocusedIndicator(activeIndex, 0);
  }
  onEndKey() {
    const indicators = [...DomHandler.find(this.indicatorContent.nativeElement, '[data-pc-section="indicator"]r')];
    const activeIndex = this.findFocusedIndicatorIndex();
    this.changedFocusedIndicator(activeIndex, indicators.length - 1);
  }
  onTabKey() {
    const indicators = [...DomHandler.find(this.indicatorContent.nativeElement, '[data-pc-section="indicator"]')];
    const highlightedIndex = indicators.findIndex((ind) => DomHandler.getAttribute(ind, "data-p-highlight") === true);
    const activeIndicator = DomHandler.findSingle(this.indicatorContent.nativeElement, '[data-pc-section="indicator"] > button[tabindex="0"]');
    const activeIndex = indicators.findIndex((ind) => ind === activeIndicator.parentElement);
    indicators[activeIndex].children[0].tabIndex = "-1";
    indicators[highlightedIndex].children[0].tabIndex = "0";
  }
  findFocusedIndicatorIndex() {
    const indicators = [...DomHandler.find(this.indicatorContent.nativeElement, '[data-pc-section="indicator"]')];
    const activeIndicator = DomHandler.findSingle(this.indicatorContent.nativeElement, '[data-pc-section="indicator"] > button[tabindex="0"]');
    return indicators.findIndex((ind) => ind === activeIndicator.parentElement);
  }
  changedFocusedIndicator(prevInd, nextInd) {
    const indicators = [...DomHandler.find(this.indicatorContent.nativeElement, '[data-pc-section="indicator"]')];
    indicators[prevInd].children[0].tabIndex = "-1";
    indicators[nextInd].children[0].tabIndex = "0";
    indicators[nextInd].children[0].focus();
  }
  step(dir, page) {
    let totalShiftedItems = this.totalShiftedItems;
    const isCircular = this.isCircular();
    if (page != null) {
      totalShiftedItems = this._numScroll * page * -1;
      if (isCircular) {
        totalShiftedItems -= this._numVisible;
      }
      this.isRemainingItemsAdded = false;
    } else {
      totalShiftedItems += this._numScroll * dir;
      if (this.isRemainingItemsAdded) {
        totalShiftedItems += this.remainingItems - this._numScroll * dir;
        this.isRemainingItemsAdded = false;
      }
      let originalShiftedItems = isCircular ? totalShiftedItems + this._numVisible : totalShiftedItems;
      page = Math.abs(Math.floor(originalShiftedItems / this._numScroll));
    }
    if (isCircular && this.page === this.totalDots() - 1 && dir === -1) {
      totalShiftedItems = -1 * (this.value.length + this._numVisible);
      page = 0;
    } else if (isCircular && this.page === 0 && dir === 1) {
      totalShiftedItems = 0;
      page = this.totalDots() - 1;
    } else if (page === this.totalDots() - 1 && this.remainingItems > 0) {
      totalShiftedItems += this.remainingItems * -1 - this._numScroll * dir;
      this.isRemainingItemsAdded = true;
    }
    if (this.itemsContainer) {
      this.itemsContainer.nativeElement.style.transform = this.isVertical() ? `translate3d(0, ${totalShiftedItems * (100 / this._numVisible)}%, 0)` : `translate3d(${totalShiftedItems * (100 / this._numVisible)}%, 0, 0)`;
      this.itemsContainer.nativeElement.style.transition = "transform 500ms ease 0s";
    }
    this.totalShiftedItems = totalShiftedItems;
    this._page = page;
    this.onPage.emit({
      page: this.page
    });
    this.cd.markForCheck();
  }
  startAutoplay() {
    this.interval = setInterval(() => {
      if (this.totalDots() > 0) {
        if (this.page === this.totalDots() - 1) {
          this.step(-1, 0);
        } else {
          this.step(-1, this.page + 1);
        }
      }
    }, this.autoplayInterval);
    this.allowAutoplay = true;
    this.cd.markForCheck();
  }
  stopAutoplay(changeAllow = true) {
    if (this.interval) {
      clearInterval(this.interval);
      this.interval = void 0;
      if (changeAllow) {
        this.allowAutoplay = false;
      }
    }
    this.cd.markForCheck();
  }
  isPlaying() {
    return !!this.interval;
  }
  onTransitionEnd() {
    if (this.itemsContainer) {
      this.itemsContainer.nativeElement.style.transition = "";
      if ((this.page === 0 || this.page === this.totalDots() - 1) && this.isCircular()) {
        this.itemsContainer.nativeElement.style.transform = this.isVertical() ? `translate3d(0, ${this.totalShiftedItems * (100 / this._numVisible)}%, 0)` : `translate3d(${this.totalShiftedItems * (100 / this._numVisible)}%, 0, 0)`;
      }
    }
  }
  onTouchStart(e) {
    let touchobj = e.changedTouches[0];
    this.startPos = {
      x: touchobj.pageX,
      y: touchobj.pageY
    };
  }
  onTouchMove(e) {
    if (e.cancelable) {
      e.preventDefault();
    }
  }
  onTouchEnd(e) {
    let touchobj = e.changedTouches[0];
    if (this.isVertical()) {
      this.changePageOnTouch(e, touchobj.pageY - this.startPos.y);
    } else {
      this.changePageOnTouch(e, touchobj.pageX - this.startPos.x);
    }
  }
  changePageOnTouch(e, diff) {
    if (Math.abs(diff) > this.swipeThreshold) {
      if (diff < 0) {
        this.navForward(e);
      } else {
        this.navBackward(e);
      }
    }
  }
  ariaPrevButtonLabel() {
    return this.config.translation.aria ? this.config.translation.aria.prevPageLabel : void 0;
  }
  ariaSlideLabel() {
    return this.config.translation.aria ? this.config.translation.aria.slide : void 0;
  }
  ariaNextButtonLabel() {
    return this.config.translation.aria ? this.config.translation.aria.nextPageLabel : void 0;
  }
  ariaSlideNumber(value) {
    return this.config.translation.aria ? this.config.translation.aria.slideNumber.replace(/{slideNumber}/g, value) : void 0;
  }
  ariaPageLabel(value) {
    return this.config.translation.aria ? this.config.translation.aria.pageLabel.replace(/{page}/g, value) : void 0;
  }
  bindDocumentListeners() {
    if (isPlatformBrowser(this.platformId)) {
      if (!this.documentResizeListener) {
        this.documentResizeListener = this.renderer.listen(this.window, "resize", (event) => {
          this.calculatePosition();
        });
      }
    }
  }
  unbindDocumentListeners() {
    if (isPlatformBrowser(this.platformId)) {
      if (this.documentResizeListener) {
        this.documentResizeListener();
        this.documentResizeListener = null;
      }
    }
  }
  ngOnDestroy() {
    if (this.responsiveOptions) {
      this.unbindDocumentListeners();
    }
    if (this.autoplayInterval) {
      this.stopAutoplay();
    }
  }
  static ɵfac = function Carousel_Factory(t) {
    return new (t || _Carousel)(ɵɵdirectiveInject(ElementRef), ɵɵdirectiveInject(NgZone), ɵɵdirectiveInject(ChangeDetectorRef), ɵɵdirectiveInject(Renderer2), ɵɵdirectiveInject(DOCUMENT), ɵɵdirectiveInject(PLATFORM_ID), ɵɵdirectiveInject(PrimeNGConfig));
  };
  static ɵcmp = ɵɵdefineComponent({
    type: _Carousel,
    selectors: [["p-carousel"]],
    contentQueries: function Carousel_ContentQueries(rf, ctx, dirIndex) {
      if (rf & 1) {
        ɵɵcontentQuery(dirIndex, Header, 5);
        ɵɵcontentQuery(dirIndex, Footer, 5);
        ɵɵcontentQuery(dirIndex, PrimeTemplate, 4);
      }
      if (rf & 2) {
        let _t;
        ɵɵqueryRefresh(_t = ɵɵloadQuery()) && (ctx.headerFacet = _t.first);
        ɵɵqueryRefresh(_t = ɵɵloadQuery()) && (ctx.footerFacet = _t.first);
        ɵɵqueryRefresh(_t = ɵɵloadQuery()) && (ctx.templates = _t);
      }
    },
    viewQuery: function Carousel_Query(rf, ctx) {
      if (rf & 1) {
        ɵɵviewQuery(_c0, 5);
        ɵɵviewQuery(_c1, 5);
      }
      if (rf & 2) {
        let _t;
        ɵɵqueryRefresh(_t = ɵɵloadQuery()) && (ctx.itemsContainer = _t.first);
        ɵɵqueryRefresh(_t = ɵɵloadQuery()) && (ctx.indicatorContent = _t.first);
      }
    },
    hostAttrs: [1, "p-element"],
    inputs: {
      page: "page",
      numVisible: "numVisible",
      numScroll: "numScroll",
      responsiveOptions: "responsiveOptions",
      orientation: "orientation",
      verticalViewPortHeight: "verticalViewPortHeight",
      contentClass: "contentClass",
      indicatorsContentClass: "indicatorsContentClass",
      indicatorsContentStyle: "indicatorsContentStyle",
      indicatorStyleClass: "indicatorStyleClass",
      indicatorStyle: "indicatorStyle",
      value: "value",
      circular: [InputFlags.HasDecoratorInputTransform, "circular", "circular", booleanAttribute],
      showIndicators: [InputFlags.HasDecoratorInputTransform, "showIndicators", "showIndicators", booleanAttribute],
      showNavigators: [InputFlags.HasDecoratorInputTransform, "showNavigators", "showNavigators", booleanAttribute],
      autoplayInterval: [InputFlags.HasDecoratorInputTransform, "autoplayInterval", "autoplayInterval", numberAttribute],
      style: "style",
      styleClass: "styleClass"
    },
    outputs: {
      onPage: "onPage"
    },
    features: [ɵɵInputTransformsFeature, ɵɵNgOnChangesFeature],
    ngContentSelectors: _c3,
    decls: 14,
    vars: 23,
    consts: [["itemsContainer", ""], ["indicatorContent", ""], ["role", "region", 3, "ngClass", "ngStyle"], ["class", "p-carousel-header", 4, "ngIf"], [3, "ngClass"], [1, "p-carousel-container"], ["type", "button", "pRipple", "", 3, "ngClass", "disabled", "click", 4, "ngIf"], [1, "p-carousel-items-content", 3, "touchend", "touchstart", "touchmove", "ngStyle"], [1, "p-carousel-items-container", 3, "transitionend"], [3, "ngClass", 4, "ngFor", "ngForOf"], [3, "ngClass", "class", "ngStyle", "keydown", 4, "ngIf"], ["class", "p-carousel-footer", 4, "ngIf"], [1, "p-carousel-header"], [4, "ngTemplateOutlet"], ["type", "button", "pRipple", "", 3, "click", "ngClass", "disabled"], [4, "ngIf"], ["class", "p-carousel-prev-icon", 4, "ngIf"], [3, "styleClass", 4, "ngIf"], [3, "styleClass"], [1, "p-carousel-prev-icon"], [4, "ngTemplateOutlet", "ngTemplateOutletContext"], [3, "keydown", "ngClass", "ngStyle"], ["type", "button", 3, "click", "ngClass", "ngStyle", "tabindex"], [1, "p-carousel-footer"]],
    template: function Carousel_Template(rf, ctx) {
      if (rf & 1) {
        const _r1 = ɵɵgetCurrentView();
        ɵɵprojectionDef(_c2);
        ɵɵelementStart(0, "div", 2);
        ɵɵtemplate(1, Carousel_div_1_Template, 3, 1, "div", 3);
        ɵɵelementStart(2, "div", 4)(3, "div", 5);
        ɵɵtemplate(4, Carousel_button_4_Template, 3, 7, "button", 6);
        ɵɵelementStart(5, "div", 7);
        ɵɵlistener("touchend", function Carousel_Template_div_touchend_5_listener($event) {
          ɵɵrestoreView(_r1);
          return ɵɵresetView(ctx.onTouchEnd($event));
        })("touchstart", function Carousel_Template_div_touchstart_5_listener($event) {
          ɵɵrestoreView(_r1);
          return ɵɵresetView(ctx.onTouchStart($event));
        })("touchmove", function Carousel_Template_div_touchmove_5_listener($event) {
          ɵɵrestoreView(_r1);
          return ɵɵresetView(ctx.onTouchMove($event));
        });
        ɵɵelementStart(6, "div", 8, 0);
        ɵɵlistener("transitionend", function Carousel_Template_div_transitionend_6_listener() {
          ɵɵrestoreView(_r1);
          return ɵɵresetView(ctx.onTransitionEnd());
        });
        ɵɵtemplate(8, Carousel_div_8_Template, 2, 12, "div", 9)(9, Carousel_div_9_Template, 2, 12, "div", 9)(10, Carousel_div_10_Template, 2, 9, "div", 9);
        ɵɵelementEnd()();
        ɵɵtemplate(11, Carousel_button_11_Template, 3, 7, "button", 6);
        ɵɵelementEnd();
        ɵɵtemplate(12, Carousel_ul_12_Template, 3, 5, "ul", 10);
        ɵɵelementEnd();
        ɵɵtemplate(13, Carousel_div_13_Template, 3, 1, "div", 11);
        ɵɵelementEnd();
      }
      if (rf & 2) {
        ɵɵclassMap(ctx.styleClass);
        ɵɵproperty("ngClass", ɵɵpureFunction2(18, _c4, ctx.isVertical(), !ctx.isVertical()))("ngStyle", ctx.style);
        ɵɵattribute("id", ctx.id);
        ɵɵadvance();
        ɵɵproperty("ngIf", ctx.headerFacet || ctx.headerTemplate);
        ɵɵadvance();
        ɵɵclassMap(ctx.contentClass);
        ɵɵproperty("ngClass", "p-carousel-content");
        ɵɵadvance();
        ɵɵattribute("aria-live", ctx.allowAutoplay ? "polite" : "off");
        ɵɵadvance();
        ɵɵproperty("ngIf", ctx.showNavigators);
        ɵɵadvance();
        ɵɵproperty("ngStyle", ɵɵpureFunction1(21, _c5, ctx.isVertical() ? ctx.verticalViewPortHeight : "auto"));
        ɵɵadvance(3);
        ɵɵproperty("ngForOf", ctx.clonedItemsForStarting);
        ɵɵadvance();
        ɵɵproperty("ngForOf", ctx.value);
        ɵɵadvance();
        ɵɵproperty("ngForOf", ctx.clonedItemsForFinishing);
        ɵɵadvance();
        ɵɵproperty("ngIf", ctx.showNavigators);
        ɵɵadvance();
        ɵɵproperty("ngIf", ctx.showIndicators);
        ɵɵadvance();
        ɵɵproperty("ngIf", ctx.footerFacet || ctx.footerTemplate);
      }
    },
    dependencies: () => [NgClass, NgForOf, NgIf, NgTemplateOutlet, NgStyle, Ripple, ChevronRightIcon, ChevronLeftIcon, ChevronDownIcon, ChevronUpIcon],
    styles: ["@layer primeng{.p-carousel{display:flex;flex-direction:column}.p-carousel-content{display:flex;flex-direction:column;overflow:auto}.p-carousel-prev,.p-carousel-next{align-self:center;flex-grow:0;flex-shrink:0;display:flex;justify-content:center;align-items:center;overflow:hidden;position:relative}.p-carousel-container{display:flex;flex-direction:row}.p-carousel-items-content{overflow:hidden;width:100%}.p-carousel-items-container{display:flex;flex-direction:row}.p-carousel-indicators{display:flex;flex-direction:row;justify-content:center;flex-wrap:wrap}.p-carousel-indicator>button{display:flex;align-items:center;justify-content:center}.p-carousel-vertical .p-carousel-container{flex-direction:column}.p-carousel-vertical .p-carousel-items-container{flex-direction:column;height:100%}.p-items-hidden .p-carousel-item{visibility:hidden}.p-items-hidden .p-carousel-item.p-carousel-item-active{visibility:visible}}\n"],
    encapsulation: 2,
    changeDetection: 0
  });
};
(() => {
  (typeof ngDevMode === "undefined" || ngDevMode) && setClassMetadata(Carousel, [{
    type: Component,
    args: [{
      selector: "p-carousel",
      template: `
        <div [attr.id]="id" [ngClass]="{ 'p-carousel p-component': true, 'p-carousel-vertical': isVertical(), 'p-carousel-horizontal': !isVertical() }" [ngStyle]="style" [class]="styleClass" role="region">
            <div class="p-carousel-header" *ngIf="headerFacet || headerTemplate">
                <ng-content select="p-header"></ng-content>
                <ng-container *ngTemplateOutlet="headerTemplate"></ng-container>
            </div>
            <div [class]="contentClass" [ngClass]="'p-carousel-content'">
                <div class="p-carousel-container" [attr.aria-live]="allowAutoplay ? 'polite' : 'off'">
                    <button
                        type="button"
                        *ngIf="showNavigators"
                        [ngClass]="{ 'p-carousel-prev p-link': true, 'p-disabled': isBackwardNavDisabled() }"
                        [disabled]="isBackwardNavDisabled()"
                        [attr.aria-label]="ariaPrevButtonLabel()"
                        (click)="navBackward($event)"
                        pRipple
                    >
                        <ng-container *ngIf="!previousIconTemplate">
                            <ChevronLeftIcon *ngIf="!isVertical()" [styleClass]="'carousel-prev-icon'" />
                            <ChevronUpIcon *ngIf="isVertical()" [styleClass]="'carousel-prev-icon'" />
                        </ng-container>
                        <span *ngIf="previousIconTemplate" class="p-carousel-prev-icon">
                            <ng-template *ngTemplateOutlet="previousIconTemplate"></ng-template>
                        </span>
                    </button>
                    <div class="p-carousel-items-content" [ngStyle]="{ height: isVertical() ? verticalViewPortHeight : 'auto' }" (touchend)="onTouchEnd($event)" (touchstart)="onTouchStart($event)" (touchmove)="onTouchMove($event)">
                        <div #itemsContainer class="p-carousel-items-container" (transitionend)="onTransitionEnd()">
                            <div
                                *ngFor="let item of clonedItemsForStarting; let index = index"
                                [ngClass]="{
                                    'p-carousel-item p-carousel-item-cloned': true,
                                    'p-carousel-item-active': totalShiftedItems * -1 === value.length,
                                    'p-carousel-item-start': 0 === index,
                                    'p-carousel-item-end': clonedItemsForStarting.length - 1 === index
                                }"
                                [attr.aria-hidden]="!(totalShiftedItems * -1 === value.length)"
                                [attr.aria-label]="ariaSlideNumber(index)"
                                [attr.aria-roledescription]="ariaSlideLabel()"
                            >
                                <ng-container *ngTemplateOutlet="itemTemplate; context: { $implicit: item }"></ng-container>
                            </div>
                            <div
                                *ngFor="let item of value; let index = index"
                                [ngClass]="{ 'p-carousel-item': true, 'p-carousel-item-active': firstIndex() <= index && lastIndex() >= index, 'p-carousel-item-start': firstIndex() === index, 'p-carousel-item-end': lastIndex() === index }"
                                [attr.aria-hidden]="!(totalShiftedItems * -1 === value.length)"
                                [attr.aria-label]="ariaSlideNumber(index)"
                                [attr.aria-roledescription]="ariaSlideLabel()"
                            >
                                <ng-container *ngTemplateOutlet="itemTemplate; context: { $implicit: item }"></ng-container>
                            </div>
                            <div
                                *ngFor="let item of clonedItemsForFinishing; let index = index"
                                [ngClass]="{
                                    'p-carousel-item p-carousel-item-cloned': true,
                                    'p-carousel-item-active': totalShiftedItems * -1 === numVisible,
                                    'p-carousel-item-start': 0 === index,
                                    'p-carousel-item-end': clonedItemsForFinishing.length - 1 === index
                                }"
                            >
                                <ng-container *ngTemplateOutlet="itemTemplate; context: { $implicit: item }"></ng-container>
                            </div>
                        </div>
                    </div>
                    <button
                        type="button"
                        *ngIf="showNavigators"
                        [ngClass]="{ 'p-carousel-next p-link': true, 'p-disabled': isForwardNavDisabled() }"
                        [disabled]="isForwardNavDisabled()"
                        (click)="navForward($event)"
                        pRipple
                        [attr.aria-label]="ariaNextButtonLabel()"
                    >
                        <ng-container *ngIf="!nextIconTemplate">
                            <ChevronRightIcon *ngIf="!isVertical()" [styleClass]="'carousel-prev-icon'" />
                            <ChevronDownIcon *ngIf="isVertical()" [styleClass]="'carousel-prev-icon'" />
                        </ng-container>
                        <span *ngIf="nextIconTemplate" class="p-carousel-prev-icon">
                            <ng-template *ngTemplateOutlet="nextIconTemplate"></ng-template>
                        </span>
                    </button>
                </div>
                <ul #indicatorContent [ngClass]="'p-carousel-indicators p-reset'" [class]="indicatorsContentClass" [ngStyle]="indicatorsContentStyle" *ngIf="showIndicators" (keydown)="onIndicatorKeydown($event)">
                    <li *ngFor="let totalDot of totalDotsArray(); let i = index" [ngClass]="{ 'p-carousel-indicator': true, 'p-highlight': _page === i }" [attr.data-pc-section]="'indicator'">
                        <button
                            type="button"
                            [ngClass]="'p-link'"
                            (click)="onDotClick($event, i)"
                            [class]="indicatorStyleClass"
                            [ngStyle]="indicatorStyle"
                            [attr.aria-label]="ariaPageLabel(i + 1)"
                            [attr.aria-current]="_page === i ? 'page' : undefined"
                            [tabindex]="_page === i ? 0 : -1"
                        ></button>
                    </li>
                </ul>
            </div>
            <div class="p-carousel-footer" *ngIf="footerFacet || footerTemplate">
                <ng-content select="p-footer"></ng-content>
                <ng-container *ngTemplateOutlet="footerTemplate"></ng-container>
            </div>
        </div>
    `,
      changeDetection: ChangeDetectionStrategy.OnPush,
      encapsulation: ViewEncapsulation$1.None,
      host: {
        class: "p-element"
      },
      styles: ["@layer primeng{.p-carousel{display:flex;flex-direction:column}.p-carousel-content{display:flex;flex-direction:column;overflow:auto}.p-carousel-prev,.p-carousel-next{align-self:center;flex-grow:0;flex-shrink:0;display:flex;justify-content:center;align-items:center;overflow:hidden;position:relative}.p-carousel-container{display:flex;flex-direction:row}.p-carousel-items-content{overflow:hidden;width:100%}.p-carousel-items-container{display:flex;flex-direction:row}.p-carousel-indicators{display:flex;flex-direction:row;justify-content:center;flex-wrap:wrap}.p-carousel-indicator>button{display:flex;align-items:center;justify-content:center}.p-carousel-vertical .p-carousel-container{flex-direction:column}.p-carousel-vertical .p-carousel-items-container{flex-direction:column;height:100%}.p-items-hidden .p-carousel-item{visibility:hidden}.p-items-hidden .p-carousel-item.p-carousel-item-active{visibility:visible}}\n"]
    }]
  }], () => [{
    type: ElementRef
  }, {
    type: NgZone
  }, {
    type: ChangeDetectorRef
  }, {
    type: Renderer2
  }, {
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
    type: PrimeNGConfig
  }], {
    page: [{
      type: Input
    }],
    numVisible: [{
      type: Input
    }],
    numScroll: [{
      type: Input
    }],
    responsiveOptions: [{
      type: Input
    }],
    orientation: [{
      type: Input
    }],
    verticalViewPortHeight: [{
      type: Input
    }],
    contentClass: [{
      type: Input
    }],
    indicatorsContentClass: [{
      type: Input
    }],
    indicatorsContentStyle: [{
      type: Input
    }],
    indicatorStyleClass: [{
      type: Input
    }],
    indicatorStyle: [{
      type: Input
    }],
    value: [{
      type: Input
    }],
    circular: [{
      type: Input,
      args: [{
        transform: booleanAttribute
      }]
    }],
    showIndicators: [{
      type: Input,
      args: [{
        transform: booleanAttribute
      }]
    }],
    showNavigators: [{
      type: Input,
      args: [{
        transform: booleanAttribute
      }]
    }],
    autoplayInterval: [{
      type: Input,
      args: [{
        transform: numberAttribute
      }]
    }],
    style: [{
      type: Input
    }],
    styleClass: [{
      type: Input
    }],
    onPage: [{
      type: Output
    }],
    itemsContainer: [{
      type: ViewChild,
      args: ["itemsContainer"]
    }],
    indicatorContent: [{
      type: ViewChild,
      args: ["indicatorContent"]
    }],
    headerFacet: [{
      type: ContentChild,
      args: [Header]
    }],
    footerFacet: [{
      type: ContentChild,
      args: [Footer]
    }],
    templates: [{
      type: ContentChildren,
      args: [PrimeTemplate]
    }]
  });
})();
var CarouselModule = class _CarouselModule {
  static ɵfac = function CarouselModule_Factory(t) {
    return new (t || _CarouselModule)();
  };
  static ɵmod = ɵɵdefineNgModule({
    type: _CarouselModule,
    declarations: [Carousel],
    imports: [CommonModule, SharedModule, RippleModule, ChevronRightIcon, ChevronLeftIcon, ChevronDownIcon, ChevronUpIcon],
    exports: [CommonModule, Carousel, SharedModule]
  });
  static ɵinj = ɵɵdefineInjector({
    imports: [CommonModule, SharedModule, RippleModule, ChevronRightIcon, ChevronLeftIcon, ChevronDownIcon, ChevronUpIcon, CommonModule, SharedModule]
  });
};
(() => {
  (typeof ngDevMode === "undefined" || ngDevMode) && setClassMetadata(CarouselModule, [{
    type: NgModule,
    args: [{
      imports: [CommonModule, SharedModule, RippleModule, ChevronRightIcon, ChevronLeftIcon, ChevronDownIcon, ChevronUpIcon],
      exports: [CommonModule, Carousel, SharedModule],
      declarations: [Carousel]
    }]
  }], null, null);
})();
export {
  Carousel,
  CarouselModule
};
//# sourceMappingURL=primeng_carousel.js.map
