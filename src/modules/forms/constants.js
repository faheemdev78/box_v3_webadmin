// attributes: placeholder, span, orientation, validation, style, options
const inputFields = [
    {
        value: 'text', label: 'Short Text',
        attributes: ['placeholder', 'validation', 'span', 'style'],
        validation: ['required', 'isNumber', 'nospace', 'is_url', 'isEmail'],
    },
    {
        value: 'textarea', label: 'Long Text',
        attributes: ['placeholder', 'validation', 'span', 'style'],
        validation: ['required'],
    },
    {
        value: 'select', label: 'Drop Down',
        attributes: ['validation', 'options', 'span', 'style'],
        validation: ['required'],
    },
    {
        value: 'radio', label: 'Radio Group',
        attributes: ['orientation', 'validation', 'options', 'span'],
        validation: ['required'],
    },
    {
        value: 'checkbox', label: 'Checkbox',
        attributes: ['orientation', 'validation', 'span', 'style'],
        validation: ['required'],
    },
    {
        value: 'signature', label: 'Signature',
        attributes: ['placeholder', 'validation', 'span', 'style'],
        validation: ['required'],
    },
].map(o => ({ ...o, type: 'form_field' }))

const uiElements = [
    {
        value: 'simple-text', label: 'Simple Text',
        attributes: ['style', 'span'],
    },
    {
        value: 'heading1', label: 'Heading 1',
        attributes: ['style', 'span'],
    },
    {
        value: 'heading2', label: 'Heading 2',
        attributes: ['style', 'span'],
    },
    {
        value: 'heading3', label: 'Heading 3',
        attributes: ['style', 'span'],
    },
    {
        value: 'divider', label: 'Divider',
        attributes: ['style', 'span'],
    },
    {
        value: 'hr', label: 'Horizontal Line',
        attributes: ['style', 'span'],
    },
].map(o => ({ ...o, type: 'ui_elements' }))

const placeholders = [
    {
        value: 'placeholder', label: 'Placeholder',
        attributes: ['style', 'span'],
    },
].map(o => ({ ...o, type: 'placeholder' }))

export const forms_fieldDefinations = [
    { label: '--- Input Fields ---', disabled: true, className: 'select_heading', cat: "heading" },
    ...inputFields,
    { label: '--- UI Elements ---', disabled: true, className: 'select_heading', cat: 'heading' },
    ...uiElements,
    { label: '--- Placeholder ---', disabled: true, className: 'select_heading', cat: 'heading' },
    ...placeholders,
]

export const forms_fieldDefinations_bk = [
    { label: '--- Input Fields ---', disabled: true, className: 'select_heading', cat:"input" },
    { value: 'text', label: 'Short Text', 
        attributes: ['placeholder', 'validation', 'span', 'style'],
        validation: ['required', 'isNumber', 'nospace', 'is_url', 'isEmail'], 
        type: 'form_field', float: true, cat: "input"
    },
    { value: 'textarea', label: 'Long Text', 
        attributes: ['placeholder', 'validation', 'span', 'style'],
        validation: ['required'], 
        type: 'form_field', float: true },
    { value: 'select', label: 'Drop Down', 
        attributes: ['validation', 'options', 'span', 'style'],
        validation: ['required'], 
        type: 'form_field', float: true },
    { value: 'radio', label: 'Radio Group', 
        attributes: ['orientation', 'validation', 'options', 'span'],
        validation: ['required'], 
        type: 'form_field', float: true },
    { value: 'checkbox', label: 'Checkbox', 
        attributes: ['orientation', 'validation', 'span', 'style'],
        validation: ['required'], 
        type: 'form_field', float: true },
    { value: 'signature', label: 'Signature', 
        attributes: ['placeholder', 'validation', 'span', 'style'],
        validation: ['required'], 
        type: 'form_field', float: true },


    { label: '--- UI Elements ---', disabled: true, className: 'select_heading' },
    { value: 'simple-text', label: 'Simple Text', 
        attributes: ['style', 'span'],
        type: 'ui_elements', float: true },
    { value: 'heading1', label: 'Heading 1', 
        attributes: ['style', 'span'],
        type: 'ui_elements', float: true },
    { value: 'heading2', label: 'Heading 2', 
        attributes: ['style', 'span'],
        type: 'ui_elements', float: true },
    { value: 'heading3', label: 'Heading 3', 
        attributes: ['style', 'span'],
        type: 'ui_elements', float: true },
    { value: 'divider', label: 'Divider', 
        attributes: ['style', 'span'],
        type: 'ui_elements' },
    { value: 'hr', label: 'Horizontal Line', 
        attributes: ['style', 'span'],
        type: 'ui_elements' },

    { label: '--- Placeholder ---', disabled: true, className: 'select_heading' },
    { value: 'placeholder', label: 'Placeholder',
        attributes: ['style', 'span'],
        type: 'placeholder', float: true
    },
]



export const forms_validationTypes = [
    { value: 'required', label: 'Required' },
    { value: 'isNumber', label: 'Is Number' },
    // { value: 'minValue', label: 'minValue' },
    // { value: 'maxValue', label: 'maxValue' },
    // { value: 'minChar', label: 'minChar' },
    // { value: 'maxChar', label: 'maxChar' },
    // { value: 'isEqual', label: 'isEqual' },
    { value: 'nospace', label: 'No Space' },
    { value: 'is_url', label: 'Is URL' },
    { value: 'isEmail', label: 'Is Email' },
]

export const formTypesArray = [
    { title: "Form", value: "form" },
    { title: "Float", value: "float" },
]

export const formStepModesArray = [
    { title: "Form", value: "form" },
    { title: "Test / Exam", value: "exam" },
]

export const participantsColors = ["rgba(255, 255, 181, 0.2)", "rgba(120, 172, 255, 0.2)", "rgba(61, 170, 214, 0.2)", "rgba(216, 79, 169, 0.2)", "rgba(122, 71, 121, 0.2)", "rgba(64, 122, 170, 0.2)"]

export const formCategoriesArray = [
    // { title: "Test / Exam Forms", value: "exam" },
    { title: "General Forms", value: "general" },
]
