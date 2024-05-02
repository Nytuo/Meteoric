import {
  BaseIcon
} from "./chunk-ES2WXWOB.js";
import {
  PrimeNGConfig,
  PrimeTemplate,
  SharedModule,
  UniqueComponentId
} from "./chunk-WQXH3QF5.js";
import {
  AutoFocus,
  AutoFocusModule
} from "./chunk-7JUGW2LI.js";
import {
  DomHandler
} from "./chunk-LZMSIMQG.js";
import {
  NG_VALUE_ACCESSOR
} from "./chunk-2KW7VPYM.js";
import {
  CommonModule,
  NgClass,
  NgForOf,
  NgIf,
  NgStyle,
  NgTemplateOutlet
} from "./chunk-2JDBUETV.js";
import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  ContentChildren,
  EventEmitter,
  Input,
  InputFlags,
  NgModule,
  Output,
  ViewEncapsulation$1,
  booleanAttribute,
  forwardRef,
  numberAttribute,
  setClassMetadata,
  signal,
  ɵɵInheritDefinitionFeature,
  ɵɵInputTransformsFeature,
  ɵɵProvidersFeature,
  ɵɵStandaloneFeature,
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
  ɵɵgetInheritedFactory,
  ɵɵlistener,
  ɵɵloadQuery,
  ɵɵnamespaceSVG,
  ɵɵnextContext,
  ɵɵproperty,
  ɵɵpureFunction1,
  ɵɵpureFunction2,
  ɵɵqueryRefresh,
  ɵɵreference,
  ɵɵresetView,
  ɵɵrestoreView,
  ɵɵtemplate,
  ɵɵtemplateRefExtractor
} from "./chunk-CTXW4UYG.js";
import "./chunk-WSA2QMXP.js";
import "./chunk-J4B6MK7R.js";

// node_modules/primeng/fesm2022/primeng-icons-ban.mjs
var BanIcon = class _BanIcon extends BaseIcon {
  pathId;
  ngOnInit() {
    this.pathId = "url(#" + UniqueComponentId() + ")";
  }
  static ɵfac = /* @__PURE__ */ (() => {
    let ɵBanIcon_BaseFactory;
    return function BanIcon_Factory(t) {
      return (ɵBanIcon_BaseFactory || (ɵBanIcon_BaseFactory = ɵɵgetInheritedFactory(_BanIcon)))(t || _BanIcon);
    };
  })();
  static ɵcmp = ɵɵdefineComponent({
    type: _BanIcon,
    selectors: [["BanIcon"]],
    standalone: true,
    features: [ɵɵInheritDefinitionFeature, ɵɵStandaloneFeature],
    decls: 6,
    vars: 7,
    consts: [["width", "14", "height", "14", "viewBox", "0 0 14 14", "fill", "none", "xmlns", "http://www.w3.org/2000/svg"], ["d", "M7 0C5.61553 0 4.26215 0.410543 3.11101 1.17971C1.95987 1.94888 1.06266 3.04213 0.532846 4.32122C0.00303296 5.6003 -0.13559 7.00776 0.134506 8.36563C0.404603 9.7235 1.07129 10.9708 2.05026 11.9497C3.02922 12.9287 4.2765 13.5954 5.63437 13.8655C6.99224 14.1356 8.3997 13.997 9.67879 13.4672C10.9579 12.9373 12.0511 12.0401 12.8203 10.889C13.5895 9.73785 14 8.38447 14 7C14 5.14348 13.2625 3.36301 11.9497 2.05025C10.637 0.737498 8.85652 0 7 0ZM1.16667 7C1.16549 5.65478 1.63303 4.35118 2.48889 3.31333L10.6867 11.5111C9.83309 12.2112 8.79816 12.6544 7.70243 12.789C6.60669 12.9236 5.49527 12.744 4.49764 12.2713C3.50001 11.7986 2.65724 11.0521 2.06751 10.1188C1.47778 9.18558 1.16537 8.10397 1.16667 7ZM11.5111 10.6867L3.31334 2.48889C4.43144 1.57388 5.84966 1.10701 7.29265 1.1789C8.73565 1.2508 10.1004 1.85633 11.1221 2.87795C12.1437 3.89956 12.7492 5.26435 12.8211 6.70735C12.893 8.15034 12.4261 9.56856 11.5111 10.6867Z", "fill", "currentColor"], [3, "id"], ["width", "14", "height", "14", "fill", "white"]],
    template: function BanIcon_Template(rf, ctx) {
      if (rf & 1) {
        ɵɵnamespaceSVG();
        ɵɵelementStart(0, "svg", 0)(1, "g");
        ɵɵelement(2, "path", 1);
        ɵɵelementEnd();
        ɵɵelementStart(3, "defs")(4, "clipPath", 2);
        ɵɵelement(5, "rect", 3);
        ɵɵelementEnd()()();
      }
      if (rf & 2) {
        ɵɵclassMap(ctx.getClassNames());
        ɵɵattribute("aria-label", ctx.ariaLabel)("aria-hidden", ctx.ariaHidden)("role", ctx.role);
        ɵɵadvance();
        ɵɵattribute("clip-path", ctx.pathId);
        ɵɵadvance(3);
        ɵɵproperty("id", ctx.pathId);
      }
    },
    encapsulation: 2
  });
};
(() => {
  (typeof ngDevMode === "undefined" || ngDevMode) && setClassMetadata(BanIcon, [{
    type: Component,
    args: [{
      selector: "BanIcon",
      standalone: true,
      imports: [BaseIcon],
      template: `
        <svg width="14" height="14" viewBox="0 0 14 14" fill="none" xmlns="http://www.w3.org/2000/svg" [attr.aria-label]="ariaLabel" [attr.aria-hidden]="ariaHidden" [attr.role]="role" [class]="getClassNames()">
            <g [attr.clip-path]="pathId">
                <path
                    d="M7 0C5.61553 0 4.26215 0.410543 3.11101 1.17971C1.95987 1.94888 1.06266 3.04213 0.532846 4.32122C0.00303296 5.6003 -0.13559 7.00776 0.134506 8.36563C0.404603 9.7235 1.07129 10.9708 2.05026 11.9497C3.02922 12.9287 4.2765 13.5954 5.63437 13.8655C6.99224 14.1356 8.3997 13.997 9.67879 13.4672C10.9579 12.9373 12.0511 12.0401 12.8203 10.889C13.5895 9.73785 14 8.38447 14 7C14 5.14348 13.2625 3.36301 11.9497 2.05025C10.637 0.737498 8.85652 0 7 0ZM1.16667 7C1.16549 5.65478 1.63303 4.35118 2.48889 3.31333L10.6867 11.5111C9.83309 12.2112 8.79816 12.6544 7.70243 12.789C6.60669 12.9236 5.49527 12.744 4.49764 12.2713C3.50001 11.7986 2.65724 11.0521 2.06751 10.1188C1.47778 9.18558 1.16537 8.10397 1.16667 7ZM11.5111 10.6867L3.31334 2.48889C4.43144 1.57388 5.84966 1.10701 7.29265 1.1789C8.73565 1.2508 10.1004 1.85633 11.1221 2.87795C12.1437 3.89956 12.7492 5.26435 12.8211 6.70735C12.893 8.15034 12.4261 9.56856 11.5111 10.6867Z"
                    fill="currentColor"
                />
            </g>
            <defs>
                <clipPath [id]="pathId">
                    <rect width="14" height="14" fill="white" />
                </clipPath>
            </defs>
        </svg>
    `
    }]
  }], null, null);
})();

// node_modules/primeng/fesm2022/primeng-icons-star.mjs
var StarIcon = class _StarIcon extends BaseIcon {
  pathId;
  ngOnInit() {
    this.pathId = "url(#" + UniqueComponentId() + ")";
  }
  static ɵfac = /* @__PURE__ */ (() => {
    let ɵStarIcon_BaseFactory;
    return function StarIcon_Factory(t) {
      return (ɵStarIcon_BaseFactory || (ɵStarIcon_BaseFactory = ɵɵgetInheritedFactory(_StarIcon)))(t || _StarIcon);
    };
  })();
  static ɵcmp = ɵɵdefineComponent({
    type: _StarIcon,
    selectors: [["StarIcon"]],
    standalone: true,
    features: [ɵɵInheritDefinitionFeature, ɵɵStandaloneFeature],
    decls: 6,
    vars: 7,
    consts: [["width", "14", "height", "14", "viewBox", "0 0 14 14", "fill", "none", "xmlns", "http://www.w3.org/2000/svg"], ["d", "M10.9741 13.6721C10.8806 13.6719 10.7886 13.6483 10.7066 13.6033L7.00002 11.6545L3.29345 13.6033C3.19926 13.6539 3.09281 13.6771 2.98612 13.6703C2.87943 13.6636 2.77676 13.6271 2.6897 13.5651C2.60277 13.5014 2.53529 13.4147 2.4948 13.3148C2.45431 13.215 2.44241 13.1058 2.46042 12.9995L3.17881 8.87264L0.167699 5.95324C0.0922333 5.8777 0.039368 5.78258 0.0150625 5.67861C-0.00924303 5.57463 -0.00402231 5.46594 0.030136 5.36477C0.0621323 5.26323 0.122141 5.17278 0.203259 5.10383C0.284377 5.03488 0.383311 4.99023 0.488681 4.97501L4.63087 4.37126L6.48797 0.618832C6.54083 0.530159 6.61581 0.456732 6.70556 0.405741C6.79532 0.35475 6.89678 0.327942 7.00002 0.327942C7.10325 0.327942 7.20471 0.35475 7.29447 0.405741C7.38422 0.456732 7.4592 0.530159 7.51206 0.618832L9.36916 4.37126L13.5114 4.97501C13.6167 4.99023 13.7157 5.03488 13.7968 5.10383C13.8779 5.17278 13.9379 5.26323 13.9699 5.36477C14.0041 5.46594 14.0093 5.57463 13.985 5.67861C13.9607 5.78258 13.9078 5.8777 13.8323 5.95324L10.8212 8.87264L11.532 12.9995C11.55 13.1058 11.5381 13.215 11.4976 13.3148C11.4571 13.4147 11.3896 13.5014 11.3027 13.5651C11.2059 13.632 11.0917 13.6692 10.9741 13.6721ZM7.00002 10.4393C7.09251 10.4404 7.18371 10.4613 7.2675 10.5005L10.2098 12.029L9.65193 8.75036C9.6368 8.6584 9.64343 8.56418 9.6713 8.47526C9.69918 8.38633 9.74751 8.30518 9.81242 8.23832L12.1969 5.94559L8.90298 5.45648C8.81188 5.44198 8.72555 5.406 8.65113 5.35152C8.57671 5.29703 8.51633 5.2256 8.475 5.14314L7.00002 2.1626L5.52503 5.15078C5.4837 5.23324 5.42332 5.30467 5.3489 5.35916C5.27448 5.41365 5.18815 5.44963 5.09705 5.46412L1.80318 5.94559L4.18761 8.23832C4.25252 8.30518 4.30085 8.38633 4.32873 8.47526C4.3566 8.56418 4.36323 8.6584 4.3481 8.75036L3.7902 12.0519L6.73253 10.5234C6.81451 10.4762 6.9058 10.4475 7.00002 10.4393Z", "fill", "currentColor"], [3, "id"], ["width", "14", "height", "14", "fill", "white"]],
    template: function StarIcon_Template(rf, ctx) {
      if (rf & 1) {
        ɵɵnamespaceSVG();
        ɵɵelementStart(0, "svg", 0)(1, "g");
        ɵɵelement(2, "path", 1);
        ɵɵelementEnd();
        ɵɵelementStart(3, "defs")(4, "clipPath", 2);
        ɵɵelement(5, "rect", 3);
        ɵɵelementEnd()()();
      }
      if (rf & 2) {
        ɵɵclassMap(ctx.getClassNames());
        ɵɵattribute("aria-label", ctx.ariaLabel)("aria-hidden", ctx.ariaHidden)("role", ctx.role);
        ɵɵadvance();
        ɵɵattribute("clip-path", ctx.pathId);
        ɵɵadvance(3);
        ɵɵproperty("id", ctx.pathId);
      }
    },
    encapsulation: 2
  });
};
(() => {
  (typeof ngDevMode === "undefined" || ngDevMode) && setClassMetadata(StarIcon, [{
    type: Component,
    args: [{
      selector: "StarIcon",
      standalone: true,
      imports: [BaseIcon],
      template: `
        <svg width="14" height="14" viewBox="0 0 14 14" fill="none" xmlns="http://www.w3.org/2000/svg" [attr.aria-label]="ariaLabel" [attr.aria-hidden]="ariaHidden" [attr.role]="role" [class]="getClassNames()">
            <g [attr.clip-path]="pathId">
                <path
                    d="M10.9741 13.6721C10.8806 13.6719 10.7886 13.6483 10.7066 13.6033L7.00002 11.6545L3.29345 13.6033C3.19926 13.6539 3.09281 13.6771 2.98612 13.6703C2.87943 13.6636 2.77676 13.6271 2.6897 13.5651C2.60277 13.5014 2.53529 13.4147 2.4948 13.3148C2.45431 13.215 2.44241 13.1058 2.46042 12.9995L3.17881 8.87264L0.167699 5.95324C0.0922333 5.8777 0.039368 5.78258 0.0150625 5.67861C-0.00924303 5.57463 -0.00402231 5.46594 0.030136 5.36477C0.0621323 5.26323 0.122141 5.17278 0.203259 5.10383C0.284377 5.03488 0.383311 4.99023 0.488681 4.97501L4.63087 4.37126L6.48797 0.618832C6.54083 0.530159 6.61581 0.456732 6.70556 0.405741C6.79532 0.35475 6.89678 0.327942 7.00002 0.327942C7.10325 0.327942 7.20471 0.35475 7.29447 0.405741C7.38422 0.456732 7.4592 0.530159 7.51206 0.618832L9.36916 4.37126L13.5114 4.97501C13.6167 4.99023 13.7157 5.03488 13.7968 5.10383C13.8779 5.17278 13.9379 5.26323 13.9699 5.36477C14.0041 5.46594 14.0093 5.57463 13.985 5.67861C13.9607 5.78258 13.9078 5.8777 13.8323 5.95324L10.8212 8.87264L11.532 12.9995C11.55 13.1058 11.5381 13.215 11.4976 13.3148C11.4571 13.4147 11.3896 13.5014 11.3027 13.5651C11.2059 13.632 11.0917 13.6692 10.9741 13.6721ZM7.00002 10.4393C7.09251 10.4404 7.18371 10.4613 7.2675 10.5005L10.2098 12.029L9.65193 8.75036C9.6368 8.6584 9.64343 8.56418 9.6713 8.47526C9.69918 8.38633 9.74751 8.30518 9.81242 8.23832L12.1969 5.94559L8.90298 5.45648C8.81188 5.44198 8.72555 5.406 8.65113 5.35152C8.57671 5.29703 8.51633 5.2256 8.475 5.14314L7.00002 2.1626L5.52503 5.15078C5.4837 5.23324 5.42332 5.30467 5.3489 5.35916C5.27448 5.41365 5.18815 5.44963 5.09705 5.46412L1.80318 5.94559L4.18761 8.23832C4.25252 8.30518 4.30085 8.38633 4.32873 8.47526C4.3566 8.56418 4.36323 8.6584 4.3481 8.75036L3.7902 12.0519L6.73253 10.5234C6.81451 10.4762 6.9058 10.4475 7.00002 10.4393Z"
                    fill="currentColor"
                />
            </g>
            <defs>
                <clipPath [id]="pathId">
                    <rect width="14" height="14" fill="white" />
                </clipPath>
            </defs>
        </svg>
    `
    }]
  }], null, null);
})();

// node_modules/primeng/fesm2022/primeng-icons-starfill.mjs
var StarFillIcon = class _StarFillIcon extends BaseIcon {
  pathId;
  ngOnInit() {
    this.pathId = "url(#" + UniqueComponentId() + ")";
  }
  static ɵfac = /* @__PURE__ */ (() => {
    let ɵStarFillIcon_BaseFactory;
    return function StarFillIcon_Factory(t) {
      return (ɵStarFillIcon_BaseFactory || (ɵStarFillIcon_BaseFactory = ɵɵgetInheritedFactory(_StarFillIcon)))(t || _StarFillIcon);
    };
  })();
  static ɵcmp = ɵɵdefineComponent({
    type: _StarFillIcon,
    selectors: [["StarFillIcon"]],
    standalone: true,
    features: [ɵɵInheritDefinitionFeature, ɵɵStandaloneFeature],
    decls: 6,
    vars: 7,
    consts: [["width", "14", "height", "14", "viewBox", "0 0 14 14", "fill", "none", "xmlns", "http://www.w3.org/2000/svg"], ["d", "M13.9718 5.36453C13.9398 5.26298 13.8798 5.17252 13.7986 5.10356C13.7175 5.0346 13.6186 4.98994 13.5132 4.97472L9.37043 4.37088L7.51307 0.617955C7.46021 0.529271 7.38522 0.455834 7.29545 0.404836C7.20568 0.353838 7.1042 0.327026 7.00096 0.327026C6.89771 0.327026 6.79624 0.353838 6.70647 0.404836C6.6167 0.455834 6.54171 0.529271 6.48885 0.617955L4.63149 4.37088L0.488746 4.97472C0.383363 4.98994 0.284416 5.0346 0.203286 5.10356C0.122157 5.17252 0.0621407 5.26298 0.03014 5.36453C-0.00402286 5.46571 -0.00924428 5.57442 0.0150645 5.67841C0.0393733 5.7824 0.0922457 5.87753 0.167722 5.95308L3.17924 8.87287L2.4684 13.0003C2.45038 13.1066 2.46229 13.2158 2.50278 13.3157C2.54328 13.4156 2.61077 13.5022 2.6977 13.5659C2.78477 13.628 2.88746 13.6644 2.99416 13.6712C3.10087 13.678 3.20733 13.6547 3.30153 13.6042L7.00096 11.6551L10.708 13.6042C10.79 13.6491 10.882 13.6728 10.9755 13.673C11.0958 13.6716 11.2129 13.6343 11.3119 13.5659C11.3988 13.5022 11.4663 13.4156 11.5068 13.3157C11.5473 13.2158 11.5592 13.1066 11.5412 13.0003L10.8227 8.87287L13.8266 5.95308C13.9033 5.87835 13.9577 5.7836 13.9833 5.67957C14.009 5.57554 14.005 5.4664 13.9718 5.36453Z", "fill", "currentColor"], [3, "id"], ["width", "14", "height", "14", "fill", "white"]],
    template: function StarFillIcon_Template(rf, ctx) {
      if (rf & 1) {
        ɵɵnamespaceSVG();
        ɵɵelementStart(0, "svg", 0)(1, "g");
        ɵɵelement(2, "path", 1);
        ɵɵelementEnd();
        ɵɵelementStart(3, "defs")(4, "clipPath", 2);
        ɵɵelement(5, "rect", 3);
        ɵɵelementEnd()()();
      }
      if (rf & 2) {
        ɵɵclassMap(ctx.getClassNames());
        ɵɵattribute("aria-label", ctx.ariaLabel)("aria-hidden", ctx.ariaHidden)("role", ctx.role);
        ɵɵadvance();
        ɵɵattribute("clip-path", ctx.pathId);
        ɵɵadvance(3);
        ɵɵproperty("id", ctx.pathId);
      }
    },
    encapsulation: 2
  });
};
(() => {
  (typeof ngDevMode === "undefined" || ngDevMode) && setClassMetadata(StarFillIcon, [{
    type: Component,
    args: [{
      selector: "StarFillIcon",
      standalone: true,
      imports: [BaseIcon],
      template: `
        <svg width="14" height="14" viewBox="0 0 14 14" fill="none" xmlns="http://www.w3.org/2000/svg" [attr.aria-label]="ariaLabel" [attr.aria-hidden]="ariaHidden" [attr.role]="role" [class]="getClassNames()">
            <g [attr.clip-path]="pathId">
                <path
                    d="M13.9718 5.36453C13.9398 5.26298 13.8798 5.17252 13.7986 5.10356C13.7175 5.0346 13.6186 4.98994 13.5132 4.97472L9.37043 4.37088L7.51307 0.617955C7.46021 0.529271 7.38522 0.455834 7.29545 0.404836C7.20568 0.353838 7.1042 0.327026 7.00096 0.327026C6.89771 0.327026 6.79624 0.353838 6.70647 0.404836C6.6167 0.455834 6.54171 0.529271 6.48885 0.617955L4.63149 4.37088L0.488746 4.97472C0.383363 4.98994 0.284416 5.0346 0.203286 5.10356C0.122157 5.17252 0.0621407 5.26298 0.03014 5.36453C-0.00402286 5.46571 -0.00924428 5.57442 0.0150645 5.67841C0.0393733 5.7824 0.0922457 5.87753 0.167722 5.95308L3.17924 8.87287L2.4684 13.0003C2.45038 13.1066 2.46229 13.2158 2.50278 13.3157C2.54328 13.4156 2.61077 13.5022 2.6977 13.5659C2.78477 13.628 2.88746 13.6644 2.99416 13.6712C3.10087 13.678 3.20733 13.6547 3.30153 13.6042L7.00096 11.6551L10.708 13.6042C10.79 13.6491 10.882 13.6728 10.9755 13.673C11.0958 13.6716 11.2129 13.6343 11.3119 13.5659C11.3988 13.5022 11.4663 13.4156 11.5068 13.3157C11.5473 13.2158 11.5592 13.1066 11.5412 13.0003L10.8227 8.87287L13.8266 5.95308C13.9033 5.87835 13.9577 5.7836 13.9833 5.67957C14.009 5.57554 14.005 5.4664 13.9718 5.36453Z"
                    fill="currentColor"
                />
            </g>
            <defs>
                <clipPath [id]="pathId">
                    <rect width="14" height="14" fill="white" />
                </clipPath>
            </defs>
        </svg>
    `
    }]
  }], null, null);
})();

// node_modules/primeng/fesm2022/primeng-rating.mjs
var _c0 = (a0, a1) => ({
  "p-readonly": a0,
  "p-disabled": a1
});
var _c1 = (a0) => ({
  "p-focus": a0
});
var _c2 = (a0, a1) => ({
  "p-rating-item-active": a0,
  "p-focus": a1
});
function Rating_ng_container_1_div_1_span_3_Template(rf, ctx) {
  if (rf & 1) {
    ɵɵelement(0, "span", 10);
  }
  if (rf & 2) {
    const ctx_r1 = ɵɵnextContext(3);
    ɵɵproperty("ngClass", ctx_r1.iconCancelClass)("ngStyle", ctx_r1.iconCancelStyle);
  }
}
function Rating_ng_container_1_div_1_BanIcon_4_Template(rf, ctx) {
  if (rf & 1) {
    ɵɵelement(0, "BanIcon", 11);
  }
  if (rf & 2) {
    const ctx_r1 = ɵɵnextContext(3);
    ɵɵproperty("styleClass", "p-rating-icon p-rating-cancel")("ngStyle", ctx_r1.iconCancelStyle);
    ɵɵattribute("data-pc-section", "cancelIcon");
  }
}
function Rating_ng_container_1_div_1_Template(rf, ctx) {
  if (rf & 1) {
    const _r1 = ɵɵgetCurrentView();
    ɵɵelementStart(0, "div", 5);
    ɵɵlistener("click", function Rating_ng_container_1_div_1_Template_div_click_0_listener($event) {
      ɵɵrestoreView(_r1);
      const ctx_r1 = ɵɵnextContext(2);
      return ɵɵresetView(ctx_r1.onOptionClick($event, 0));
    });
    ɵɵelementStart(1, "span", 6)(2, "input", 7);
    ɵɵlistener("focus", function Rating_ng_container_1_div_1_Template_input_focus_2_listener($event) {
      ɵɵrestoreView(_r1);
      const ctx_r1 = ɵɵnextContext(2);
      return ɵɵresetView(ctx_r1.onInputFocus($event, 0));
    })("blur", function Rating_ng_container_1_div_1_Template_input_blur_2_listener($event) {
      ɵɵrestoreView(_r1);
      const ctx_r1 = ɵɵnextContext(2);
      return ɵɵresetView(ctx_r1.onInputBlur($event));
    })("change", function Rating_ng_container_1_div_1_Template_input_change_2_listener($event) {
      ɵɵrestoreView(_r1);
      const ctx_r1 = ɵɵnextContext(2);
      return ɵɵresetView(ctx_r1.onChange($event, 0));
    });
    ɵɵelementEnd()();
    ɵɵtemplate(3, Rating_ng_container_1_div_1_span_3_Template, 1, 2, "span", 8)(4, Rating_ng_container_1_div_1_BanIcon_4_Template, 1, 3, "BanIcon", 9);
    ɵɵelementEnd();
  }
  if (rf & 2) {
    const ctx_r1 = ɵɵnextContext(2);
    ɵɵproperty("ngClass", ɵɵpureFunction1(11, _c1, ctx_r1.focusedOptionIndex() === 0 && ctx_r1.isFocusVisibleItem));
    ɵɵattribute("data-pc-section", "cancelItem");
    ɵɵadvance();
    ɵɵattribute("data-p-hidden-accessible", true);
    ɵɵadvance();
    ɵɵproperty("name", ctx_r1.name)("checked", ctx_r1.value === 0)("disabled", ctx_r1.disabled)("readonly", ctx_r1.readonly)("autofocus", ctx_r1.autofocus);
    ɵɵattribute("aria-label", ctx_r1.cancelAriaLabel());
    ɵɵadvance();
    ɵɵproperty("ngIf", ctx_r1.iconCancelClass);
    ɵɵadvance();
    ɵɵproperty("ngIf", !ctx_r1.iconCancelClass);
  }
}
function Rating_ng_container_1_ng_template_2_ng_container_3_span_1_Template(rf, ctx) {
  if (rf & 1) {
    ɵɵelement(0, "span", 16);
  }
  if (rf & 2) {
    const ctx_r1 = ɵɵnextContext(4);
    ɵɵproperty("ngStyle", ctx_r1.iconOffStyle)("ngClass", ctx_r1.iconOffClass);
    ɵɵattribute("data-pc-section", "offIcon");
  }
}
function Rating_ng_container_1_ng_template_2_ng_container_3_StarIcon_2_Template(rf, ctx) {
  if (rf & 1) {
    ɵɵelement(0, "StarIcon", 17);
  }
  if (rf & 2) {
    const ctx_r1 = ɵɵnextContext(4);
    ɵɵproperty("ngStyle", ctx_r1.iconOffStyle)("styleClass", "p-rating-icon");
    ɵɵattribute("data-pc-section", "offIcon");
  }
}
function Rating_ng_container_1_ng_template_2_ng_container_3_Template(rf, ctx) {
  if (rf & 1) {
    ɵɵelementContainerStart(0);
    ɵɵtemplate(1, Rating_ng_container_1_ng_template_2_ng_container_3_span_1_Template, 1, 3, "span", 14)(2, Rating_ng_container_1_ng_template_2_ng_container_3_StarIcon_2_Template, 1, 3, "StarIcon", 15);
    ɵɵelementContainerEnd();
  }
  if (rf & 2) {
    const ctx_r1 = ɵɵnextContext(3);
    ɵɵadvance();
    ɵɵproperty("ngIf", ctx_r1.iconOffClass);
    ɵɵadvance();
    ɵɵproperty("ngIf", !ctx_r1.iconOffClass);
  }
}
function Rating_ng_container_1_ng_template_2_ng_container_4_span_1_Template(rf, ctx) {
  if (rf & 1) {
    ɵɵelement(0, "span", 19);
  }
  if (rf & 2) {
    const ctx_r1 = ɵɵnextContext(4);
    ɵɵproperty("ngStyle", ctx_r1.iconOnStyle)("ngClass", ctx_r1.iconOnClass);
    ɵɵattribute("data-pc-section", "onIcon");
  }
}
function Rating_ng_container_1_ng_template_2_ng_container_4_StarFillIcon_2_Template(rf, ctx) {
  if (rf & 1) {
    ɵɵelement(0, "StarFillIcon", 17);
  }
  if (rf & 2) {
    const ctx_r1 = ɵɵnextContext(4);
    ɵɵproperty("ngStyle", ctx_r1.iconOnStyle)("styleClass", "p-rating-icon p-rating-icon-active");
    ɵɵattribute("data-pc-section", "onIcon");
  }
}
function Rating_ng_container_1_ng_template_2_ng_container_4_Template(rf, ctx) {
  if (rf & 1) {
    ɵɵelementContainerStart(0);
    ɵɵtemplate(1, Rating_ng_container_1_ng_template_2_ng_container_4_span_1_Template, 1, 3, "span", 18)(2, Rating_ng_container_1_ng_template_2_ng_container_4_StarFillIcon_2_Template, 1, 3, "StarFillIcon", 15);
    ɵɵelementContainerEnd();
  }
  if (rf & 2) {
    const ctx_r1 = ɵɵnextContext(3);
    ɵɵadvance();
    ɵɵproperty("ngIf", ctx_r1.iconOnClass);
    ɵɵadvance();
    ɵɵproperty("ngIf", !ctx_r1.iconOnClass);
  }
}
function Rating_ng_container_1_ng_template_2_Template(rf, ctx) {
  if (rf & 1) {
    const _r3 = ɵɵgetCurrentView();
    ɵɵelementStart(0, "div", 12);
    ɵɵlistener("click", function Rating_ng_container_1_ng_template_2_Template_div_click_0_listener($event) {
      const star_r4 = ɵɵrestoreView(_r3).$implicit;
      const ctx_r1 = ɵɵnextContext(2);
      return ɵɵresetView(ctx_r1.onOptionClick($event, star_r4 + 1));
    });
    ɵɵelementStart(1, "span", 6)(2, "input", 7);
    ɵɵlistener("focus", function Rating_ng_container_1_ng_template_2_Template_input_focus_2_listener($event) {
      const star_r4 = ɵɵrestoreView(_r3).$implicit;
      const ctx_r1 = ɵɵnextContext(2);
      return ɵɵresetView(ctx_r1.onInputFocus($event, star_r4 + 1));
    })("blur", function Rating_ng_container_1_ng_template_2_Template_input_blur_2_listener($event) {
      ɵɵrestoreView(_r3);
      const ctx_r1 = ɵɵnextContext(2);
      return ɵɵresetView(ctx_r1.onInputBlur($event));
    })("change", function Rating_ng_container_1_ng_template_2_Template_input_change_2_listener($event) {
      const star_r4 = ɵɵrestoreView(_r3).$implicit;
      const ctx_r1 = ɵɵnextContext(2);
      return ɵɵresetView(ctx_r1.onChange($event, star_r4 + 1));
    });
    ɵɵelementEnd()();
    ɵɵtemplate(3, Rating_ng_container_1_ng_template_2_ng_container_3_Template, 3, 2, "ng-container", 13)(4, Rating_ng_container_1_ng_template_2_ng_container_4_Template, 3, 2, "ng-container", 13);
    ɵɵelementEnd();
  }
  if (rf & 2) {
    const star_r4 = ctx.$implicit;
    const i_r5 = ctx.index;
    const ctx_r1 = ɵɵnextContext(2);
    ɵɵproperty("ngClass", ɵɵpureFunction2(10, _c2, star_r4 + 1 <= ctx_r1.value, star_r4 + 1 === ctx_r1.focusedOptionIndex() && ctx_r1.isFocusVisibleItem));
    ɵɵadvance();
    ɵɵattribute("data-p-hidden-accessible", true);
    ɵɵadvance();
    ɵɵproperty("name", ctx_r1.name)("checked", ctx_r1.value === 0)("disabled", ctx_r1.disabled)("readonly", ctx_r1.readonly)("autofocus", ctx_r1.autofocus);
    ɵɵattribute("aria-label", ctx_r1.starAriaLabel(star_r4 + 1));
    ɵɵadvance();
    ɵɵproperty("ngIf", !ctx_r1.value || i_r5 >= ctx_r1.value);
    ɵɵadvance();
    ɵɵproperty("ngIf", ctx_r1.value && i_r5 < ctx_r1.value);
  }
}
function Rating_ng_container_1_Template(rf, ctx) {
  if (rf & 1) {
    ɵɵelementContainerStart(0);
    ɵɵtemplate(1, Rating_ng_container_1_div_1_Template, 5, 13, "div", 3)(2, Rating_ng_container_1_ng_template_2_Template, 5, 13, "ng-template", 4);
    ɵɵelementContainerEnd();
  }
  if (rf & 2) {
    const ctx_r1 = ɵɵnextContext();
    ɵɵadvance();
    ɵɵproperty("ngIf", ctx_r1.cancel);
    ɵɵadvance();
    ɵɵproperty("ngForOf", ctx_r1.starsArray);
  }
}
function Rating_ng_template_2_span_0_ng_container_1_Template(rf, ctx) {
  if (rf & 1) {
    ɵɵelementContainer(0);
  }
}
function Rating_ng_template_2_span_0_Template(rf, ctx) {
  if (rf & 1) {
    const _r6 = ɵɵgetCurrentView();
    ɵɵelementStart(0, "span", 22);
    ɵɵlistener("click", function Rating_ng_template_2_span_0_Template_span_click_0_listener($event) {
      ɵɵrestoreView(_r6);
      const ctx_r1 = ɵɵnextContext(2);
      return ɵɵresetView(ctx_r1.onOptionClick($event, 0));
    });
    ɵɵtemplate(1, Rating_ng_template_2_span_0_ng_container_1_Template, 1, 0, "ng-container", 23);
    ɵɵelementEnd();
  }
  if (rf & 2) {
    const ctx_r1 = ɵɵnextContext(2);
    ɵɵproperty("ngStyle", ctx_r1.iconCancelStyle);
    ɵɵattribute("data-pc-section", "cancelIcon");
    ɵɵadvance();
    ɵɵproperty("ngTemplateOutlet", ctx_r1.cancelIconTemplate);
  }
}
function Rating_ng_template_2_span_1_ng_container_1_Template(rf, ctx) {
  if (rf & 1) {
    ɵɵelementContainer(0);
  }
}
function Rating_ng_template_2_span_1_Template(rf, ctx) {
  if (rf & 1) {
    const _r7 = ɵɵgetCurrentView();
    ɵɵelementStart(0, "span", 24);
    ɵɵlistener("click", function Rating_ng_template_2_span_1_Template_span_click_0_listener($event) {
      const star_r8 = ɵɵrestoreView(_r7).$implicit;
      const ctx_r1 = ɵɵnextContext(2);
      return ɵɵresetView(ctx_r1.onOptionClick($event, star_r8 + 1));
    });
    ɵɵtemplate(1, Rating_ng_template_2_span_1_ng_container_1_Template, 1, 0, "ng-container", 23);
    ɵɵelementEnd();
  }
  if (rf & 2) {
    const i_r9 = ctx.index;
    const ctx_r1 = ɵɵnextContext(2);
    ɵɵattribute("data-pc-section", "onIcon");
    ɵɵadvance();
    ɵɵproperty("ngTemplateOutlet", ctx_r1.getIconTemplate(i_r9));
  }
}
function Rating_ng_template_2_Template(rf, ctx) {
  if (rf & 1) {
    ɵɵtemplate(0, Rating_ng_template_2_span_0_Template, 2, 3, "span", 20)(1, Rating_ng_template_2_span_1_Template, 2, 2, "span", 21);
  }
  if (rf & 2) {
    const ctx_r1 = ɵɵnextContext();
    ɵɵproperty("ngIf", ctx_r1.cancel);
    ɵɵadvance();
    ɵɵproperty("ngForOf", ctx_r1.starsArray);
  }
}
var RATING_VALUE_ACCESSOR = {
  provide: NG_VALUE_ACCESSOR,
  useExisting: forwardRef(() => Rating),
  multi: true
};
var Rating = class _Rating {
  cd;
  config;
  /**
   * When present, it specifies that the element should be disabled.
   * @group Props
   */
  disabled;
  /**
   * When present, changing the value is not possible.
   * @group Props
   */
  readonly;
  /**
   * Number of stars.
   * @group Props
   */
  stars = 5;
  /**
   * When specified a cancel icon is displayed to allow removing the value.
   * @group Props
   */
  cancel = true;
  /**
   * Style class of the on icon.
   * @group Props
   */
  iconOnClass;
  /**
   * Inline style of the on icon.
   * @group Props
   */
  iconOnStyle;
  /**
   * Style class of the off icon.
   * @group Props
   */
  iconOffClass;
  /**
   * Inline style of the off icon.
   * @group Props
   */
  iconOffStyle;
  /**
   * Style class of the cancel icon.
   * @group Props
   */
  iconCancelClass;
  /**
   * Inline style of the cancel icon.
   * @group Props
   */
  iconCancelStyle;
  /**
   * When present, it specifies that the component should automatically get focus on load.
   * @group Props
   */
  autofocus;
  /**
   * Emitted on value change.
   * @param {RatingRateEvent} value - Custom rate event.
   * @group Emits
   */
  onRate = new EventEmitter();
  /**
   * Emitted when the rating is cancelled.
   * @param {Event} value - Browser event.
   * @group Emits
   */
  onCancel = new EventEmitter();
  /**
   * Emitted when the rating receives focus.
   * @param {Event} value - Browser event.
   * @group Emits
   */
  onFocus = new EventEmitter();
  /**
   * Emitted when the rating loses focus.
   * @param {Event} value - Browser event.
   * @group Emits
   */
  onBlur = new EventEmitter();
  templates;
  onIconTemplate;
  offIconTemplate;
  cancelIconTemplate;
  value;
  onModelChange = () => {
  };
  onModelTouched = () => {
  };
  starsArray;
  isFocusVisibleItem = true;
  focusedOptionIndex = signal(-1);
  name;
  constructor(cd, config) {
    this.cd = cd;
    this.config = config;
  }
  ngOnInit() {
    this.name = this.name || UniqueComponentId();
    this.starsArray = [];
    for (let i = 0; i < this.stars; i++) {
      this.starsArray[i] = i;
    }
  }
  ngAfterContentInit() {
    this.templates.forEach((item) => {
      switch (item.getType()) {
        case "onicon":
          this.onIconTemplate = item.template;
          break;
        case "officon":
          this.offIconTemplate = item.template;
          break;
        case "cancelicon":
          this.cancelIconTemplate = item.template;
          break;
      }
    });
  }
  onOptionClick(event, value) {
    if (!this.readonly && !this.disabled) {
      this.onOptionSelect(event, value);
      this.isFocusVisibleItem = false;
      const firstFocusableEl = DomHandler.getFirstFocusableElement(event.currentTarget, "");
      firstFocusableEl && DomHandler.focus(firstFocusableEl);
    }
  }
  onOptionSelect(event, value) {
    this.focusedOptionIndex.set(value);
    this.updateModel(event, value || null);
  }
  onChange(event, value) {
    this.onOptionSelect(event, value);
    this.isFocusVisibleItem = true;
  }
  onInputBlur(event) {
    this.focusedOptionIndex.set(-1);
    this.onBlur.emit(event);
  }
  onInputFocus(event, value) {
    this.focusedOptionIndex.set(value);
    this.onFocus.emit(event);
  }
  updateModel(event, value) {
    this.value = value;
    this.onModelChange(this.value);
    this.onModelTouched();
    if (!value) {
      this.onCancel.emit();
    } else {
      this.onRate.emit({
        originalEvent: event,
        value
      });
    }
  }
  cancelAriaLabel() {
    return this.config.translation.clear;
  }
  starAriaLabel(value) {
    return value === 1 ? this.config.translation.aria.star : this.config.translation.aria.stars.replace(/{star}/g, value);
  }
  getIconTemplate(i) {
    return !this.value || i >= this.value ? this.offIconTemplate : this.onIconTemplate;
  }
  writeValue(value) {
    this.value = value;
    this.cd.detectChanges();
  }
  registerOnChange(fn) {
    this.onModelChange = fn;
  }
  registerOnTouched(fn) {
    this.onModelTouched = fn;
  }
  setDisabledState(val) {
    this.disabled = val;
    this.cd.markForCheck();
  }
  get isCustomIcon() {
    return this.templates && this.templates.length > 0;
  }
  static ɵfac = function Rating_Factory(t) {
    return new (t || _Rating)(ɵɵdirectiveInject(ChangeDetectorRef), ɵɵdirectiveInject(PrimeNGConfig));
  };
  static ɵcmp = ɵɵdefineComponent({
    type: _Rating,
    selectors: [["p-rating"]],
    contentQueries: function Rating_ContentQueries(rf, ctx, dirIndex) {
      if (rf & 1) {
        ɵɵcontentQuery(dirIndex, PrimeTemplate, 4);
      }
      if (rf & 2) {
        let _t;
        ɵɵqueryRefresh(_t = ɵɵloadQuery()) && (ctx.templates = _t);
      }
    },
    hostAttrs: [1, "p-element"],
    inputs: {
      disabled: [InputFlags.HasDecoratorInputTransform, "disabled", "disabled", booleanAttribute],
      readonly: [InputFlags.HasDecoratorInputTransform, "readonly", "readonly", booleanAttribute],
      stars: [InputFlags.HasDecoratorInputTransform, "stars", "stars", numberAttribute],
      cancel: [InputFlags.HasDecoratorInputTransform, "cancel", "cancel", booleanAttribute],
      iconOnClass: "iconOnClass",
      iconOnStyle: "iconOnStyle",
      iconOffClass: "iconOffClass",
      iconOffStyle: "iconOffStyle",
      iconCancelClass: "iconCancelClass",
      iconCancelStyle: "iconCancelStyle",
      autofocus: [InputFlags.HasDecoratorInputTransform, "autofocus", "autofocus", booleanAttribute]
    },
    outputs: {
      onRate: "onRate",
      onCancel: "onCancel",
      onFocus: "onFocus",
      onBlur: "onBlur"
    },
    features: [ɵɵProvidersFeature([RATING_VALUE_ACCESSOR]), ɵɵInputTransformsFeature],
    decls: 4,
    vars: 8,
    consts: [["customTemplate", ""], [1, "p-rating", 3, "ngClass"], [4, "ngIf", "ngIfElse"], ["class", "p-rating-item p-rating-cancel-item", 3, "ngClass", "click", 4, "ngIf"], ["ngFor", "", 3, "ngForOf"], [1, "p-rating-item", "p-rating-cancel-item", 3, "click", "ngClass"], [1, "p-hidden-accessible"], ["type", "radio", "value", "0", "pAutoFocus", "", 3, "focus", "blur", "change", "name", "checked", "disabled", "readonly", "autofocus"], ["class", "p-rating-icon p-rating-cancel", 3, "ngClass", "ngStyle", 4, "ngIf"], [3, "styleClass", "ngStyle", 4, "ngIf"], [1, "p-rating-icon", "p-rating-cancel", 3, "ngClass", "ngStyle"], [3, "styleClass", "ngStyle"], [1, "p-rating-item", 3, "click", "ngClass"], [4, "ngIf"], ["class", "p-rating-icon", 3, "ngStyle", "ngClass", 4, "ngIf"], [3, "ngStyle", "styleClass", 4, "ngIf"], [1, "p-rating-icon", 3, "ngStyle", "ngClass"], [3, "ngStyle", "styleClass"], ["class", "p-rating-icon p-rating-icon-active", 3, "ngStyle", "ngClass", 4, "ngIf"], [1, "p-rating-icon", "p-rating-icon-active", 3, "ngStyle", "ngClass"], ["class", "p-rating-icon p-rating-cancel", 3, "ngStyle", "click", 4, "ngIf"], ["class", "p-rating-icon", 3, "click", 4, "ngFor", "ngForOf"], [1, "p-rating-icon", "p-rating-cancel", 3, "click", "ngStyle"], [4, "ngTemplateOutlet"], [1, "p-rating-icon", 3, "click"]],
    template: function Rating_Template(rf, ctx) {
      if (rf & 1) {
        ɵɵelementStart(0, "div", 1);
        ɵɵtemplate(1, Rating_ng_container_1_Template, 3, 2, "ng-container", 2)(2, Rating_ng_template_2_Template, 2, 2, "ng-template", null, 0, ɵɵtemplateRefExtractor);
        ɵɵelementEnd();
      }
      if (rf & 2) {
        const customTemplate_r10 = ɵɵreference(3);
        ɵɵproperty("ngClass", ɵɵpureFunction2(5, _c0, ctx.readonly, ctx.disabled));
        ɵɵattribute("data-pc-name", "rating")("data-pc-section", "root");
        ɵɵadvance();
        ɵɵproperty("ngIf", !ctx.isCustomIcon)("ngIfElse", customTemplate_r10);
      }
    },
    dependencies: () => [NgClass, NgForOf, NgIf, NgTemplateOutlet, NgStyle, AutoFocus, StarFillIcon, StarIcon, BanIcon],
    styles: ["@layer primeng{.p-rating{display:inline-flex;position:relative;align-items:center}.p-rating-icon{cursor:pointer}.p-rating.p-rating-readonly .p-rating-icon{cursor:default}}\n"],
    encapsulation: 2,
    changeDetection: 0
  });
};
(() => {
  (typeof ngDevMode === "undefined" || ngDevMode) && setClassMetadata(Rating, [{
    type: Component,
    args: [{
      selector: "p-rating",
      template: `
        <div class="p-rating" [ngClass]="{ 'p-readonly': readonly, 'p-disabled': disabled }" [attr.data-pc-name]="'rating'" [attr.data-pc-section]="'root'">
            <ng-container *ngIf="!isCustomIcon; else customTemplate">
                <div *ngIf="cancel" [attr.data-pc-section]="'cancelItem'" (click)="onOptionClick($event, 0)" [ngClass]="{ 'p-focus': focusedOptionIndex() === 0 && isFocusVisibleItem }" class="p-rating-item p-rating-cancel-item">
                    <span class="p-hidden-accessible" [attr.data-p-hidden-accessible]="true">
                        <input
                            type="radio"
                            value="0"
                            [name]="name"
                            [checked]="value === 0"
                            [disabled]="disabled"
                            [readonly]="readonly"
                            [attr.aria-label]="cancelAriaLabel()"
                            (focus)="onInputFocus($event, 0)"
                            (blur)="onInputBlur($event)"
                            (change)="onChange($event, 0)"
                            pAutoFocus
                            [autofocus]="autofocus"
                        />
                    </span>
                    <span *ngIf="iconCancelClass" class="p-rating-icon p-rating-cancel" [ngClass]="iconCancelClass" [ngStyle]="iconCancelStyle"></span>
                    <BanIcon *ngIf="!iconCancelClass" [styleClass]="'p-rating-icon p-rating-cancel'" [ngStyle]="iconCancelStyle" [attr.data-pc-section]="'cancelIcon'" />
                </div>
                <ng-template ngFor [ngForOf]="starsArray" let-star let-i="index">
                    <div class="p-rating-item" [ngClass]="{ 'p-rating-item-active': star + 1 <= value, 'p-focus': star + 1 === focusedOptionIndex() && isFocusVisibleItem }" (click)="onOptionClick($event, star + 1)">
                        <span class="p-hidden-accessible" [attr.data-p-hidden-accessible]="true">
                            <input
                                type="radio"
                                value="0"
                                [name]="name"
                                [checked]="value === 0"
                                [disabled]="disabled"
                                [readonly]="readonly"
                                [attr.aria-label]="starAriaLabel(star + 1)"
                                (focus)="onInputFocus($event, star + 1)"
                                (blur)="onInputBlur($event)"
                                (change)="onChange($event, star + 1)"
                                pAutoFocus
                                [autofocus]="autofocus"
                            />
                        </span>
                        <ng-container *ngIf="!value || i >= value">
                            <span class="p-rating-icon" *ngIf="iconOffClass" [ngStyle]="iconOffStyle" [ngClass]="iconOffClass" [attr.data-pc-section]="'offIcon'"></span>
                            <StarIcon *ngIf="!iconOffClass" [ngStyle]="iconOffStyle" [styleClass]="'p-rating-icon'" [attr.data-pc-section]="'offIcon'" />
                        </ng-container>
                        <ng-container *ngIf="value && i < value">
                            <span class="p-rating-icon p-rating-icon-active" *ngIf="iconOnClass" [ngStyle]="iconOnStyle" [ngClass]="iconOnClass" [attr.data-pc-section]="'onIcon'"></span>
                            <StarFillIcon *ngIf="!iconOnClass" [ngStyle]="iconOnStyle" [styleClass]="'p-rating-icon p-rating-icon-active'" [attr.data-pc-section]="'onIcon'" />
                        </ng-container>
                    </div>
                </ng-template>
            </ng-container>
            <ng-template #customTemplate>
                <span *ngIf="cancel" (click)="onOptionClick($event, 0)" class="p-rating-icon p-rating-cancel" [ngStyle]="iconCancelStyle" [attr.data-pc-section]="'cancelIcon'">
                    <ng-container *ngTemplateOutlet="cancelIconTemplate"></ng-container>
                </span>
                <span *ngFor="let star of starsArray; let i = index" class="p-rating-icon" (click)="onOptionClick($event, star + 1)" [attr.data-pc-section]="'onIcon'">
                    <ng-container *ngTemplateOutlet="getIconTemplate(i)"></ng-container>
                </span>
            </ng-template>
        </div>
    `,
      providers: [RATING_VALUE_ACCESSOR],
      changeDetection: ChangeDetectionStrategy.OnPush,
      encapsulation: ViewEncapsulation$1.None,
      host: {
        class: "p-element"
      },
      styles: ["@layer primeng{.p-rating{display:inline-flex;position:relative;align-items:center}.p-rating-icon{cursor:pointer}.p-rating.p-rating-readonly .p-rating-icon{cursor:default}}\n"]
    }]
  }], () => [{
    type: ChangeDetectorRef
  }, {
    type: PrimeNGConfig
  }], {
    disabled: [{
      type: Input,
      args: [{
        transform: booleanAttribute
      }]
    }],
    readonly: [{
      type: Input,
      args: [{
        transform: booleanAttribute
      }]
    }],
    stars: [{
      type: Input,
      args: [{
        transform: numberAttribute
      }]
    }],
    cancel: [{
      type: Input,
      args: [{
        transform: booleanAttribute
      }]
    }],
    iconOnClass: [{
      type: Input
    }],
    iconOnStyle: [{
      type: Input
    }],
    iconOffClass: [{
      type: Input
    }],
    iconOffStyle: [{
      type: Input
    }],
    iconCancelClass: [{
      type: Input
    }],
    iconCancelStyle: [{
      type: Input
    }],
    autofocus: [{
      type: Input,
      args: [{
        transform: booleanAttribute
      }]
    }],
    onRate: [{
      type: Output
    }],
    onCancel: [{
      type: Output
    }],
    onFocus: [{
      type: Output
    }],
    onBlur: [{
      type: Output
    }],
    templates: [{
      type: ContentChildren,
      args: [PrimeTemplate]
    }]
  });
})();
var RatingModule = class _RatingModule {
  static ɵfac = function RatingModule_Factory(t) {
    return new (t || _RatingModule)();
  };
  static ɵmod = ɵɵdefineNgModule({
    type: _RatingModule,
    declarations: [Rating],
    imports: [CommonModule, AutoFocusModule, StarFillIcon, StarIcon, BanIcon],
    exports: [Rating, SharedModule]
  });
  static ɵinj = ɵɵdefineInjector({
    imports: [CommonModule, AutoFocusModule, StarFillIcon, StarIcon, BanIcon, SharedModule]
  });
};
(() => {
  (typeof ngDevMode === "undefined" || ngDevMode) && setClassMetadata(RatingModule, [{
    type: NgModule,
    args: [{
      imports: [CommonModule, AutoFocusModule, StarFillIcon, StarIcon, BanIcon],
      exports: [Rating, SharedModule],
      declarations: [Rating]
    }]
  }], null, null);
})();
export {
  RATING_VALUE_ACCESSOR,
  Rating,
  RatingModule
};
//# sourceMappingURL=primeng_rating.js.map
