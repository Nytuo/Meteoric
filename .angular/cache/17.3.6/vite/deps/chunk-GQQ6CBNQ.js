import {
  AutoFocus,
  AutoFocusModule
} from "./chunk-7JUGW2LI.js";
import {
  Ripple,
  RippleModule
} from "./chunk-SHG4VVST.js";
import {
  NG_VALUE_ACCESSOR
} from "./chunk-2KW7VPYM.js";
import {
  ObjectUtils,
  PrimeTemplate,
  SharedModule
} from "./chunk-WQXH3QF5.js";
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
  ContentChild,
  EventEmitter,
  Input,
  InputFlags,
  NgModule,
  Output,
  ViewChild,
  ViewEncapsulation$1,
  booleanAttribute,
  forwardRef,
  numberAttribute,
  setClassMetadata,
  ɵɵInputTransformsFeature,
  ɵɵProvidersFeature,
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
  ɵɵproperty,
  ɵɵpureFunction2,
  ɵɵpureFunction3,
  ɵɵqueryRefresh,
  ɵɵreference,
  ɵɵresetView,
  ɵɵrestoreView,
  ɵɵtemplate,
  ɵɵtemplateRefExtractor,
  ɵɵtext,
  ɵɵtextInterpolate,
  ɵɵviewQuery
} from "./chunk-CTXW4UYG.js";

// node_modules/primeng/fesm2022/primeng-selectbutton.mjs
var _c0 = ["container"];
var _c1 = (a0, a1, a2) => ({
  "p-highlight": a0,
  "p-disabled": a1,
  "p-button-icon-only": a2
});
var _c2 = (a0, a1) => ({
  $implicit: a0,
  index: a1
});
function SelectButton_div_2_ng_container_1_span_1_Template(rf, ctx) {
  if (rf & 1) {
    ɵɵelement(0, "span", 8);
  }
  if (rf & 2) {
    const option_r3 = ɵɵnextContext(2).$implicit;
    ɵɵclassMap(option_r3.icon);
    ɵɵproperty("ngClass", "p-button-icon p-button-icon-left");
    ɵɵattribute("data-pc-section", "icon");
  }
}
function SelectButton_div_2_ng_container_1_Template(rf, ctx) {
  if (rf & 1) {
    ɵɵelementContainerStart(0);
    ɵɵtemplate(1, SelectButton_div_2_ng_container_1_span_1_Template, 1, 4, "span", 6);
    ɵɵelementStart(2, "span", 7);
    ɵɵtext(3);
    ɵɵelementEnd();
    ɵɵelementContainerEnd();
  }
  if (rf & 2) {
    const option_r3 = ɵɵnextContext().$implicit;
    const ctx_r4 = ɵɵnextContext();
    ɵɵadvance();
    ɵɵproperty("ngIf", option_r3.icon);
    ɵɵadvance();
    ɵɵattribute("data-pc-section", "label");
    ɵɵadvance();
    ɵɵtextInterpolate(ctx_r4.getOptionLabel(option_r3));
  }
}
function SelectButton_div_2_ng_template_2_ng_container_0_Template(rf, ctx) {
  if (rf & 1) {
    ɵɵelementContainer(0);
  }
}
function SelectButton_div_2_ng_template_2_Template(rf, ctx) {
  if (rf & 1) {
    ɵɵtemplate(0, SelectButton_div_2_ng_template_2_ng_container_0_Template, 1, 0, "ng-container", 9);
  }
  if (rf & 2) {
    const ctx_r6 = ɵɵnextContext();
    const option_r3 = ctx_r6.$implicit;
    const i_r4 = ctx_r6.index;
    const ctx_r4 = ɵɵnextContext();
    ɵɵproperty("ngTemplateOutlet", ctx_r4.selectButtonTemplate)("ngTemplateOutletContext", ɵɵpureFunction2(2, _c2, option_r3, i_r4));
  }
}
function SelectButton_div_2_Template(rf, ctx) {
  if (rf & 1) {
    const _r1 = ɵɵgetCurrentView();
    ɵɵelementStart(0, "div", 4);
    ɵɵlistener("click", function SelectButton_div_2_Template_div_click_0_listener($event) {
      const ctx_r1 = ɵɵrestoreView(_r1);
      const option_r3 = ctx_r1.$implicit;
      const i_r4 = ctx_r1.index;
      const ctx_r4 = ɵɵnextContext();
      return ɵɵresetView(ctx_r4.onOptionSelect($event, option_r3, i_r4));
    })("keydown", function SelectButton_div_2_Template_div_keydown_0_listener($event) {
      const ctx_r5 = ɵɵrestoreView(_r1);
      const option_r3 = ctx_r5.$implicit;
      const i_r4 = ctx_r5.index;
      const ctx_r4 = ɵɵnextContext();
      return ɵɵresetView(ctx_r4.onKeyDown($event, option_r3, i_r4));
    })("focus", function SelectButton_div_2_Template_div_focus_0_listener($event) {
      const i_r4 = ɵɵrestoreView(_r1).index;
      const ctx_r4 = ɵɵnextContext();
      return ɵɵresetView(ctx_r4.onFocus($event, i_r4));
    })("blur", function SelectButton_div_2_Template_div_blur_0_listener() {
      ɵɵrestoreView(_r1);
      const ctx_r4 = ɵɵnextContext();
      return ɵɵresetView(ctx_r4.onBlur());
    });
    ɵɵtemplate(1, SelectButton_div_2_ng_container_1_Template, 4, 3, "ng-container", 5)(2, SelectButton_div_2_ng_template_2_Template, 1, 5, "ng-template", null, 1, ɵɵtemplateRefExtractor);
    ɵɵelementEnd();
  }
  if (rf & 2) {
    const option_r3 = ctx.$implicit;
    const i_r4 = ctx.index;
    const customcontent_r8 = ɵɵreference(3);
    const ctx_r4 = ɵɵnextContext();
    ɵɵclassMap(option_r3.styleClass);
    ɵɵproperty("role", ctx_r4.multiple ? "checkbox" : "radio")("ngClass", ɵɵpureFunction3(15, _c1, ctx_r4.isSelected(option_r3), ctx_r4.disabled || ctx_r4.isOptionDisabled(option_r3), option_r3.icon && !ctx_r4.getOptionLabel(option_r3)))("autofocus", ctx_r4.autofocus);
    ɵɵattribute("tabindex", i_r4 === ctx_r4.focusedIndex ? "0" : "-1")("aria-label", option_r3.label)("aria-checked", ctx_r4.isSelected(option_r3))("aria-disabled", ctx_r4.optionDisabled)("aria-pressed", ctx_r4.isSelected(option_r3))("title", option_r3.title)("aria-labelledby", ctx_r4.getOptionLabel(option_r3))("data-pc-section", "button");
    ɵɵadvance();
    ɵɵproperty("ngIf", !ctx_r4.itemTemplate)("ngIfElse", customcontent_r8);
  }
}
var SELECTBUTTON_VALUE_ACCESSOR = {
  provide: NG_VALUE_ACCESSOR,
  useExisting: forwardRef(() => SelectButton),
  multi: true
};
var SelectButton = class _SelectButton {
  cd;
  /**
   * An array of selectitems to display as the available options.
   * @group Props
   */
  options;
  /**
   * Name of the label field of an option.
   * @group Props
   */
  optionLabel;
  /**
   * Name of the value field of an option.
   * @group Props
   */
  optionValue;
  /**
   * Name of the disabled field of an option.
   * @group Props
   */
  optionDisabled;
  /**
   * Whether selection can be cleared.
   * @group Props
   */
  unselectable = false;
  /**
   * Index of the element in tabbing order.
   * @group Props
   */
  tabindex = 0;
  /**
   * When specified, allows selecting multiple values.
   * @group Props
   */
  multiple;
  /**
   * Whether selection can not be cleared.
   * @group Props
   */
  allowEmpty = true;
  /**
   * Inline style of the component.
   * @group Props
   */
  style;
  /**
   * Style class of the component.
   * @group Props
   */
  styleClass;
  /**
   * Establishes relationships between the component and label(s) where its value should be one or more element IDs.
   * @group Props
   */
  ariaLabelledBy;
  /**
   * When present, it specifies that the element should be disabled.
   * @group Props
   */
  disabled;
  /**
   * A property to uniquely identify a value in options.
   * @group Props
   */
  dataKey;
  /**
   * When present, it specifies that the component should automatically get focus on load.
   * @group Props
   */
  autofocus;
  /**
   * Callback to invoke on input click.
   * @param {SelectButtonOptionClickEvent} event - Custom click event.
   * @group Emits
   */
  onOptionClick = new EventEmitter();
  /**
   * Callback to invoke on selection change.
   * @param {SelectButtonChangeEvent} event - Custom change event.
   * @group Emits
   */
  onChange = new EventEmitter();
  container;
  itemTemplate;
  get selectButtonTemplate() {
    return this.itemTemplate?.template;
  }
  get equalityKey() {
    return this.optionValue ? null : this.dataKey;
  }
  value;
  onModelChange = () => {
  };
  onModelTouched = () => {
  };
  focusedIndex = 0;
  constructor(cd) {
    this.cd = cd;
  }
  getOptionLabel(option) {
    return this.optionLabel ? ObjectUtils.resolveFieldData(option, this.optionLabel) : option.label != void 0 ? option.label : option;
  }
  getOptionValue(option) {
    return this.optionValue ? ObjectUtils.resolveFieldData(option, this.optionValue) : this.optionLabel || option.value === void 0 ? option : option.value;
  }
  isOptionDisabled(option) {
    return this.optionDisabled ? ObjectUtils.resolveFieldData(option, this.optionDisabled) : option.disabled !== void 0 ? option.disabled : false;
  }
  writeValue(value) {
    this.value = value;
    this.cd.markForCheck();
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
  onOptionSelect(event, option, index) {
    if (this.disabled || this.isOptionDisabled(option)) {
      return;
    }
    let selected = this.isSelected(option);
    if (selected && this.unselectable) {
      return;
    }
    let optionValue = this.getOptionValue(option);
    let newValue;
    if (this.multiple) {
      if (selected)
        newValue = this.value.filter((val) => !ObjectUtils.equals(val, optionValue, this.equalityKey));
      else
        newValue = this.value ? [...this.value, optionValue] : [optionValue];
    } else {
      if (selected && !this.allowEmpty) {
        return;
      }
      newValue = selected ? null : optionValue;
    }
    this.focusedIndex = index;
    this.value = newValue;
    this.onModelChange(this.value);
    this.onChange.emit({
      originalEvent: event,
      value: this.value
    });
    this.onOptionClick.emit({
      originalEvent: event,
      option,
      index
    });
  }
  onKeyDown(event, option, index) {
    switch (event.code) {
      case "Space": {
        this.onOptionSelect(event, option, index);
        event.preventDefault();
        break;
      }
      case "ArrowDown":
      case "ArrowRight": {
        this.changeTabIndexes(event, "next");
        event.preventDefault();
        break;
      }
      case "ArrowUp":
      case "ArrowLeft": {
        this.changeTabIndexes(event, "prev");
        event.preventDefault();
        break;
      }
      default:
        break;
    }
  }
  changeTabIndexes(event, direction) {
    let firstTabableChild, index;
    for (let i = 0; i <= this.container.nativeElement.children.length - 1; i++) {
      if (this.container.nativeElement.children[i].getAttribute("tabindex") === "0")
        firstTabableChild = {
          elem: this.container.nativeElement.children[i],
          index: i
        };
    }
    if (direction === "prev") {
      if (firstTabableChild.index === 0)
        index = this.container.nativeElement.children.length - 1;
      else
        index = firstTabableChild.index - 1;
    } else {
      if (firstTabableChild.index === this.container.nativeElement.children.length - 1)
        index = 0;
      else
        index = firstTabableChild.index + 1;
    }
    this.focusedIndex = index;
    this.container.nativeElement.children[index].focus();
  }
  onFocus(event, index) {
    this.focusedIndex = index;
  }
  onBlur() {
    this.onModelTouched();
  }
  removeOption(option) {
    this.value = this.value.filter((val) => !ObjectUtils.equals(val, this.getOptionValue(option), this.dataKey));
  }
  isSelected(option) {
    let selected = false;
    const optionValue = this.getOptionValue(option);
    if (this.multiple) {
      if (this.value && Array.isArray(this.value)) {
        for (let val of this.value) {
          if (ObjectUtils.equals(val, optionValue, this.dataKey)) {
            selected = true;
            break;
          }
        }
      }
    } else {
      selected = ObjectUtils.equals(this.getOptionValue(option), this.value, this.equalityKey);
    }
    return selected;
  }
  static ɵfac = function SelectButton_Factory(t) {
    return new (t || _SelectButton)(ɵɵdirectiveInject(ChangeDetectorRef));
  };
  static ɵcmp = ɵɵdefineComponent({
    type: _SelectButton,
    selectors: [["p-selectButton"]],
    contentQueries: function SelectButton_ContentQueries(rf, ctx, dirIndex) {
      if (rf & 1) {
        ɵɵcontentQuery(dirIndex, PrimeTemplate, 5);
      }
      if (rf & 2) {
        let _t;
        ɵɵqueryRefresh(_t = ɵɵloadQuery()) && (ctx.itemTemplate = _t.first);
      }
    },
    viewQuery: function SelectButton_Query(rf, ctx) {
      if (rf & 1) {
        ɵɵviewQuery(_c0, 5);
      }
      if (rf & 2) {
        let _t;
        ɵɵqueryRefresh(_t = ɵɵloadQuery()) && (ctx.container = _t.first);
      }
    },
    hostAttrs: [1, "p-element"],
    inputs: {
      options: "options",
      optionLabel: "optionLabel",
      optionValue: "optionValue",
      optionDisabled: "optionDisabled",
      unselectable: [InputFlags.HasDecoratorInputTransform, "unselectable", "unselectable", booleanAttribute],
      tabindex: [InputFlags.HasDecoratorInputTransform, "tabindex", "tabindex", numberAttribute],
      multiple: [InputFlags.HasDecoratorInputTransform, "multiple", "multiple", booleanAttribute],
      allowEmpty: [InputFlags.HasDecoratorInputTransform, "allowEmpty", "allowEmpty", booleanAttribute],
      style: "style",
      styleClass: "styleClass",
      ariaLabelledBy: "ariaLabelledBy",
      disabled: [InputFlags.HasDecoratorInputTransform, "disabled", "disabled", booleanAttribute],
      dataKey: "dataKey",
      autofocus: [InputFlags.HasDecoratorInputTransform, "autofocus", "autofocus", booleanAttribute]
    },
    outputs: {
      onOptionClick: "onOptionClick",
      onChange: "onChange"
    },
    features: [ɵɵProvidersFeature([SELECTBUTTON_VALUE_ACCESSOR]), ɵɵInputTransformsFeature],
    decls: 3,
    vars: 8,
    consts: [["container", ""], ["customcontent", ""], ["role", "group", 3, "ngClass", "ngStyle"], ["pRipple", "", "class", "p-button p-component", "pAutoFocus", "", 3, "role", "class", "ngClass", "autofocus", "click", "keydown", "focus", "blur", 4, "ngFor", "ngForOf"], ["pRipple", "", "pAutoFocus", "", 1, "p-button", "p-component", 3, "click", "keydown", "focus", "blur", "role", "ngClass", "autofocus"], [4, "ngIf", "ngIfElse"], [3, "ngClass", "class", 4, "ngIf"], [1, "p-button-label"], [3, "ngClass"], [4, "ngTemplateOutlet", "ngTemplateOutletContext"]],
    template: function SelectButton_Template(rf, ctx) {
      if (rf & 1) {
        ɵɵelementStart(0, "div", 2, 0);
        ɵɵtemplate(2, SelectButton_div_2_Template, 4, 19, "div", 3);
        ɵɵelementEnd();
      }
      if (rf & 2) {
        ɵɵclassMap(ctx.styleClass);
        ɵɵproperty("ngClass", "p-selectbutton p-buttonset p-component")("ngStyle", ctx.style);
        ɵɵattribute("aria-labelledby", ctx.ariaLabelledBy)("data-pc-name", "selectbutton")("data-pc-section", "root");
        ɵɵadvance(2);
        ɵɵproperty("ngForOf", ctx.options);
      }
    },
    dependencies: [NgClass, NgForOf, NgIf, NgTemplateOutlet, NgStyle, Ripple, AutoFocus],
    styles: ['@layer primeng{.p-button{margin:0;display:inline-flex;cursor:pointer;-webkit-user-select:none;user-select:none;align-items:center;vertical-align:bottom;text-align:center;overflow:hidden;position:relative}.p-button-label{flex:1 1 auto}.p-button-icon-right{order:1}.p-button:disabled{cursor:default;pointer-events:none}.p-button-icon-only{justify-content:center}.p-button-icon-only:after{content:"p";visibility:hidden;clip:rect(0 0 0 0);width:0}.p-button-vertical{flex-direction:column}.p-button-icon-bottom{order:2}.p-button-group .p-button{margin:0}.p-button-group .p-button:focus,.p-button-group p-button:focus .p-button,.p-buttonset .p-button:focus,.p-buttonset p-button:focus .p-button{position:relative;z-index:1}.p-button-group .p-button:not(:last-child),.p-button-group .p-button:not(:last-child):hover,.p-button-group p-button:not(:last-child) .p-button,.p-button-group p-button:not(:last-child) .p-button:hover,.p-buttonset .p-button:not(:last-child),.p-buttonset .p-button:not(:last-child):hover,.p-buttonset p-button:not(:last-child) .p-button,.p-buttonset p-button:not(:last-child) .p-button:hover{border-right:0 none}.p-button-group .p-button:not(:first-of-type):not(:last-of-type),.p-button-group p-button:not(:first-of-type):not(:last-of-type) .p-button,.p-buttonset .p-button:not(:first-of-type):not(:last-of-type),.p-buttonset p-button:not(:first-of-type):not(:last-of-type) .p-button{border-radius:0}.p-button-group .p-button:first-of-type:not(:only-of-type),.p-button-group p-button:first-of-type:not(:only-of-type) .p-button,.p-buttonset .p-button:first-of-type:not(:only-of-type),.p-buttonset p-button:first-of-type:not(:only-of-type) .p-button{border-top-right-radius:0;border-bottom-right-radius:0}.p-button-group .p-button:last-of-type:not(:only-of-type),.p-button-group p-button:last-of-type:not(:only-of-type) .p-button,.p-buttonset .p-button:last-of-type:not(:only-of-type),.p-buttonset p-button:last-of-type:not(:only-of-type) .p-button{border-top-left-radius:0;border-bottom-left-radius:0}p-button[iconpos=right] spinnericon{order:1}}\n'],
    encapsulation: 2,
    changeDetection: 0
  });
};
(() => {
  (typeof ngDevMode === "undefined" || ngDevMode) && setClassMetadata(SelectButton, [{
    type: Component,
    args: [{
      selector: "p-selectButton",
      template: `
        <div #container [ngClass]="'p-selectbutton p-buttonset p-component'" [ngStyle]="style" [class]="styleClass" role="group" [attr.aria-labelledby]="ariaLabelledBy" [attr.data-pc-name]="'selectbutton'" [attr.data-pc-section]="'root'">
            <div
                *ngFor="let option of options; let i = index"
                pRipple
                [attr.tabindex]="i === focusedIndex ? '0' : '-1'"
                [attr.aria-label]="option.label"
                [role]="multiple ? 'checkbox' : 'radio'"
                [attr.aria-checked]="isSelected(option)"
                [attr.aria-disabled]="optionDisabled"
                class="p-button p-component"
                [class]="option.styleClass"
                [ngClass]="{ 'p-highlight': isSelected(option), 'p-disabled': disabled || isOptionDisabled(option), 'p-button-icon-only': option.icon && !getOptionLabel(option) }"
                [attr.aria-pressed]="isSelected(option)"
                (click)="onOptionSelect($event, option, i)"
                (keydown)="onKeyDown($event, option, i)"
                [attr.title]="option.title"
                (focus)="onFocus($event, i)"
                (blur)="onBlur()"
                [attr.aria-labelledby]="this.getOptionLabel(option)"
                [attr.data-pc-section]="'button'"
                pAutoFocus
                [autofocus]="autofocus"
            >
                <ng-container *ngIf="!itemTemplate; else customcontent">
                    <span [ngClass]="'p-button-icon p-button-icon-left'" [class]="option.icon" *ngIf="option.icon" [attr.data-pc-section]="'icon'"></span>
                    <span class="p-button-label" [attr.data-pc-section]="'label'">{{ getOptionLabel(option) }}</span>
                </ng-container>
                <ng-template #customcontent>
                    <ng-container *ngTemplateOutlet="selectButtonTemplate; context: { $implicit: option, index: i }"></ng-container>
                </ng-template>
            </div>
        </div>
    `,
      providers: [SELECTBUTTON_VALUE_ACCESSOR],
      changeDetection: ChangeDetectionStrategy.OnPush,
      encapsulation: ViewEncapsulation$1.None,
      host: {
        class: "p-element"
      },
      styles: ['@layer primeng{.p-button{margin:0;display:inline-flex;cursor:pointer;-webkit-user-select:none;user-select:none;align-items:center;vertical-align:bottom;text-align:center;overflow:hidden;position:relative}.p-button-label{flex:1 1 auto}.p-button-icon-right{order:1}.p-button:disabled{cursor:default;pointer-events:none}.p-button-icon-only{justify-content:center}.p-button-icon-only:after{content:"p";visibility:hidden;clip:rect(0 0 0 0);width:0}.p-button-vertical{flex-direction:column}.p-button-icon-bottom{order:2}.p-button-group .p-button{margin:0}.p-button-group .p-button:focus,.p-button-group p-button:focus .p-button,.p-buttonset .p-button:focus,.p-buttonset p-button:focus .p-button{position:relative;z-index:1}.p-button-group .p-button:not(:last-child),.p-button-group .p-button:not(:last-child):hover,.p-button-group p-button:not(:last-child) .p-button,.p-button-group p-button:not(:last-child) .p-button:hover,.p-buttonset .p-button:not(:last-child),.p-buttonset .p-button:not(:last-child):hover,.p-buttonset p-button:not(:last-child) .p-button,.p-buttonset p-button:not(:last-child) .p-button:hover{border-right:0 none}.p-button-group .p-button:not(:first-of-type):not(:last-of-type),.p-button-group p-button:not(:first-of-type):not(:last-of-type) .p-button,.p-buttonset .p-button:not(:first-of-type):not(:last-of-type),.p-buttonset p-button:not(:first-of-type):not(:last-of-type) .p-button{border-radius:0}.p-button-group .p-button:first-of-type:not(:only-of-type),.p-button-group p-button:first-of-type:not(:only-of-type) .p-button,.p-buttonset .p-button:first-of-type:not(:only-of-type),.p-buttonset p-button:first-of-type:not(:only-of-type) .p-button{border-top-right-radius:0;border-bottom-right-radius:0}.p-button-group .p-button:last-of-type:not(:only-of-type),.p-button-group p-button:last-of-type:not(:only-of-type) .p-button,.p-buttonset .p-button:last-of-type:not(:only-of-type),.p-buttonset p-button:last-of-type:not(:only-of-type) .p-button{border-top-left-radius:0;border-bottom-left-radius:0}p-button[iconpos=right] spinnericon{order:1}}\n']
    }]
  }], () => [{
    type: ChangeDetectorRef
  }], {
    options: [{
      type: Input
    }],
    optionLabel: [{
      type: Input
    }],
    optionValue: [{
      type: Input
    }],
    optionDisabled: [{
      type: Input
    }],
    unselectable: [{
      type: Input,
      args: [{
        transform: booleanAttribute
      }]
    }],
    tabindex: [{
      type: Input,
      args: [{
        transform: numberAttribute
      }]
    }],
    multiple: [{
      type: Input,
      args: [{
        transform: booleanAttribute
      }]
    }],
    allowEmpty: [{
      type: Input,
      args: [{
        transform: booleanAttribute
      }]
    }],
    style: [{
      type: Input
    }],
    styleClass: [{
      type: Input
    }],
    ariaLabelledBy: [{
      type: Input
    }],
    disabled: [{
      type: Input,
      args: [{
        transform: booleanAttribute
      }]
    }],
    dataKey: [{
      type: Input
    }],
    autofocus: [{
      type: Input,
      args: [{
        transform: booleanAttribute
      }]
    }],
    onOptionClick: [{
      type: Output
    }],
    onChange: [{
      type: Output
    }],
    container: [{
      type: ViewChild,
      args: ["container"]
    }],
    itemTemplate: [{
      type: ContentChild,
      args: [PrimeTemplate]
    }]
  });
})();
var SelectButtonModule = class _SelectButtonModule {
  static ɵfac = function SelectButtonModule_Factory(t) {
    return new (t || _SelectButtonModule)();
  };
  static ɵmod = ɵɵdefineNgModule({
    type: _SelectButtonModule,
    declarations: [SelectButton],
    imports: [CommonModule, RippleModule, SharedModule, AutoFocusModule],
    exports: [SelectButton, SharedModule]
  });
  static ɵinj = ɵɵdefineInjector({
    imports: [CommonModule, RippleModule, SharedModule, AutoFocusModule, SharedModule]
  });
};
(() => {
  (typeof ngDevMode === "undefined" || ngDevMode) && setClassMetadata(SelectButtonModule, [{
    type: NgModule,
    args: [{
      imports: [CommonModule, RippleModule, SharedModule, AutoFocusModule],
      exports: [SelectButton, SharedModule],
      declarations: [SelectButton]
    }]
  }], null, null);
})();

export {
  SELECTBUTTON_VALUE_ACCESSOR,
  SelectButton,
  SelectButtonModule
};
//# sourceMappingURL=chunk-GQQ6CBNQ.js.map
