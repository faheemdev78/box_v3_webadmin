import React from 'react'
import { FormSpy } from 'react-final-form'
import diff from 'object-diff'
import { debounce } from 'lodash'


export const DB_AutoSave = props => (
    <FormSpy
        {...props}
        subscription={{ active: true, values: true }}
        component={AutoSaveComp}
    />
)

// Make a HOC
// This is not the only way to accomplish auto-save, but it does let us:
// - Use built-in React lifecycle methods to listen for changes
// - Maintain state of when we are submitting
// - Render a message when submitting
// - Pass in debounce and save props nicely
export const BK2_AutoSave = props => (
    <FormSpy 
        {...props} 
        subscription={{ active: true, values: true }} 
        component={AutoSaveComp}
    />
)



class AutoSaveComp extends React.Component {
    constructor(props) {
        super(props)
        this.state = { values: props.values, submitting: false }
    }

    UNSAFE_componentWillReceiveProps(nextProps) {
        // this.props.form.getFieldState(this.props.active)
        if (this.props.active && this.props.active !== nextProps.active) {
            // blur occurred
            this.onSave(this.props.active)
        }
    }

    save = async blurredField => {
        console.log("blurredField: ", blurredField)
        // console.log("this.props: ", this.props)
        if (this.promise) {
            await this.promise
        }
        const { values, setFieldData, save, form } = this.props

        // This diff step is totally optional
        const difference = diff(this.state.values, values)
        if (Object.keys(difference).length) {
            // values have changed
            this.setState({ submitting: true, values })
            setFieldData(blurredField, { saving: true })
            // submit form without validation
            // this.promise = save(difference)
            // submit form, validating whole form
            this.promise = form.submit()
            await this.promise
            delete this.promise
            this.setState({ submitting: false })
            setFieldData(blurredField, { saving: false })
        }
    }

    onSave = debounce(this.save, 3000)

    render() {
        // console.log("this.props: ", this.props)
        // This component doesn't have to render anything, but it can render
        // submitting state.
        return null
    }
}

// Make a HOC
// This is not the only way to accomplish auto-save, but it does let us:
// - Use built-in React lifecycle methods to listen for changes
// - Maintain state of when we are submitting
// - Render a message when submitting
// - Pass in save prop nicely
export const AutoSave = props => (
    <FormSpy
        {...props}
        subscription={{ active: true, values: true }}
        component={AutoSaveComp}
    />
)