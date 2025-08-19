'use client'

import React from 'react'
import PropTypes from 'prop-types';
import { message } from 'antd';
import { Form as FinalForm } from 'react-final-form';
import { DevBlock } from '../devBlock'
import { __error, __green, __red } from '@_/lib/consoleHelper';
import { moveToErrorPosition } from './lib'
// https://final-form.org/docs/react-final-form/examples
// https://final-form.org/docs/final-form/types/FormState


/********** 
 * Direct Use of react-final-form
    <Form
        onSubmit={this.onSubmit}
        validate={this.validate}
        render={({ handleSubmit, submitting, reset, values, invalid }) => (
            <form id="TypeForm" className="form_component" size={'small'} onSubmit={event => {
                if (invalid) message.error("Invalid submission! Please verify your input.");
                handleSubmit(event);
            }}>
                <FormField type="text" name="title" label="Title" validate={composeValidators(rules.required, rules.minChar(8))} />
                <FormField type="text" name="type" label="Type Key (no space)" />
                <Button type="primary" htmlType="submit">Submit</Button>

                <DevBlock obj={values} />
            </form>
        )}
    />
 */

/****************
 * EXAMPLE:
    <FormComponent onSubmit={this.onSubmit} id='TypeForm'>
        <FormField type="text" name="title" label="Title" validate={composeValidators(rules.required, rules.minChar(8))} />
        <FormField type="text" name="type" label="Type Key (no space)" />
        // internal submit
        <Button type="primary" htmlType="submit">Submit</Button>
    </FormComponent>

    // External submit
    <Button type="primary" onClick={() => {
        document.getElementById('TypeForm')
            .dispatchEvent(new Event('submit', { cancelable: true }))
    }}>Submit</Button>

 * EXAMPLE:
    <FormComponent onSubmit={onSubmit} id='TypeForm' loading={loading} fields={fields}
    form_render={({values}) => {
        return <>
            <FormField type="text" name="title" label="Title" validate={composeValidators(rules.required, rules.minChar(4))} />
            <FormField type="text" name="slug" label="Slug (no space)" validate={composeValidators(rules.required, rules.nospace, rules.minChar(4))} />
            <FormField type="select" name="status" label="Status" data={genders} validate={rules.required} />

            <Heading>Tax Settings</Heading>
            <FormFieldGroup compact>
                <FormField type="select" width={"70px"} name="tax.unit" data={taxTypes} compact addNull />
                <FormField type="number" disabled={values.tax && !values.tax.unit} min={0} max={100} name="tax.value" compact />
            </FormFieldGroup>

            <Heading>SEO Details</Heading>
            <FormField type="text" name="seo_title" label="SEO Title" />
            <FormField type="text" name="seo_desc" label="SEO Description" />
        </>
    }}
    >


    *** Mutator Example
   
   mutators={{ 
                setDetails: (newValue, state, utils) => {
                    utils.changeValue(state, 'details', () => newValue)
                },
                anotherMuttor: (newValue, state, utils) => {
                    utils.changeValue(state, 'anotherField', () => newValue)
                },
            }}
    Uage: formProps.form.mutators.setDetails("mutated value")


 */
export const FormComponent = props => {
    const propTypes = {
        id: PropTypes.string.isRequired,
        onSubmit: PropTypes.func.isRequired,
        validate: PropTypes.func,
        debug: PropTypes.bool,
        loading: PropTypes.bool,
        fields: PropTypes.object,
        render: PropTypes.func,
        form_render: PropTypes.func,
        decorators: PropTypes.array,
        moveOnError: PropTypes.bool, // scrolling page to error position
        resetOnSubmit: PropTypes.bool,
        subscription: PropTypes.object,
    }

    // console.log(props.onSubmit.toString().trim(), " : ", props.onSubmit.constructor.name == AsyncFunction)
    // const isAsync = props.onSubmit.constructor.name == 'AsyncFunction';

    return (
        <FinalForm 
            id={props.id}
            initialValues={props.fields}
            onSubmit={props.onSubmit}
            validate={props.validate}
            subscription={props.subscription}
            mutators={props.mutators}
            decorators={props.decorators}
            render={
                props.render ? props.render : // if custom render is provided
                (formargs) => {
                    // console.log("formargs: ", formargs);
                    
                    const { handleSubmit, submitting, form, values, invalid, errors, submitFailed } = formargs;
                    return (
                        <form id={props.id} className="form_component" size={'small'}
                            style={props.style}
                            onSubmit={event => {
                                if (invalid){
                                    message.error("Oops! seems like you missed something.");
                                    moveToErrorPosition(errors)
                                }

                                /// handel if submit function is async
                                if (props.onSubmit.constructor.name == 'AsyncFunction'){
                                    (async() => {
                                        let results = await handleSubmit(event);
                                        if (results=='reset'){
                                            form.reset({});
                                            if (form?.mutators?.removeFiles) form.mutators.removeFiles()
                                        }
                                    })();
                                    // handleSubmit(event).then(r => {
                                    //     if (r && r == 'reset'){
                                    //         form.reset({  })
                                    //         if (form?.mutators?.removeFiles) form.mutators.removeFiles()
                                    //     }
                                    // });

                                }else{
                                    handleSubmit(event)
                                }

                            }}>

                            {props.form_render && props.form_render(formargs)}

                            {!props.form_render && <>{props.children}</>}
                            {props.debug && <DevBlock obj={values} />}

                            {/* <Button type="primary" htmlType="submit">Submit</Button> */}
                            {/* <Button type="primary" onClick={() => {
                                document.getElementById('TypeForm')
                                    .dispatchEvent(new Event('submit', { cancelable: true }))
                            }}>Submit</Button> */}

                        </form>
                    )

                }
            }
        />
    )
}
