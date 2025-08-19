// import React, { Component, useEffect } from 'react'
// import PropTypes from 'prop-types';
// import { Drawer, Button, Heading, Icon, Loader } from 'Common/components'
// import { rules, composeValidators, FormField, FormFieldGroup, FormComponent, UploadField } from 'Common/components/Form'
// import { message, Row, Col } from 'antd';
// import { loader } from 'graphql.macro';
// import { useLazyQuery, useMutation, useSubscription } from '@apollo/client';
// import { __error } from 'Common/scripts/consoleHelper'

// const RECORD = loader('graphqls/countries/country.graphql');
// const RECORD_EDIT = loader('graphqls/countries/edit.graphql');
// const RECORD_ADD = loader('graphqls/countries/add.graphql');


// export class FormComp extends Component {
//     fields = { status: "disabled" };

//     constructor(props) {
//         super(props);
//         this.state = { loading: false, __fields: false, loadingEditNode: props.loadingEditNode }
//         this.onSubmit = this.onSubmit.bind(this);
//     }

//     static getDerivedStateFromProps(props, state) {
//         if (props.loadingEditNode !== state.loadingEditNode) {
//             return {
//                 ...state,
//                 loadingEditNode: props.loadingEditNode,
//             };
//         }
//         return { ...state };
//     }

//     onSubmit = _values => {
//         // console.log("onSubmit()", _values); return;

//         const { country, onClose, editCountry, addCountry } = this.props;
//         const { __fields } = this.state;
//         let fields = __fields ? { ...__fields } : country ? { ...country } : {}
//         let values = { ..._values }

//         const _id = fields ? fields._id : false;

//         this.setState({ loading: true });

//         let filteredValues = {
//             title: values.title
//         };

//         if (_id) {
//             editCountry({ variables: { input: { ...filteredValues, _id: _id } } }).then((e) => {
//                 this.setState({ loading: false })
//                 if (e.data.editCountry.error) {
//                     let err = e.data.editCountry.error;
//                     message.error(err.message);
//                     return false;
//                 }
//                 message.success("Success");
//                 onClose(e.data.editCountry);
//             }).catch(error => {
//                 this.setState({ loading: false })
//                 console.log(error);
//                 message.error("Query Error");
//             });
//         } else {
//             addCountry({ variables: { input: filteredValues } }).then((e) => {
//                 this.setState({ loading: false });
//                 if (e.data.addCountry.error) {
//                     let err = e.data.addCountry.error;
//                     message.error(err.message);
//                     return false;
//                 }
//                 message.success("Success");
//                 console.log("e.data.addCountry: ", e.data.addCountry);

//                 // _fields = Object.assign(_fields, { ...e.data.addCountry })
//                 // _setFields({ ...e.data.addCountry });
//                 onClose(e.data.addCountry);
//             }).catch(error => {
//                 this.setState({ loading: false });
//                 console.log(error);
//                 message.error("Query Error");
//             });
//         }

//     }


//     render() {
//         const { onClose, showform, country } = this.props;
//         const { __fields, loading, loadingEditNode } = this.state;

//         this.fields = __fields ? { ...__fields } : country ? { ...country } : this.fields;
//         if (!this.props.showform) return null;

//         return (
//             <Drawer width={"300px"} destroyOnClose maskClosable={false} placement="right"
//                 loading={loadingEditNode}
//                 onClose={onClose}
//                 visible={showform}
//                 bodyStyle={{ backgroundColor: "#f0f2f5" }}
//                 footer={<>
//                     <span></span>
//                     <Button loading={loading} type="primary" onClick={() => {
//                         document.getElementById('CountryForm').dispatchEvent(new Event('submit', { cancelable: true }))
//                     }}>Save</Button>
//                 </>}
//                 title={`${this.fields && this.fields._id ? 'Edit' : 'Add'} Country`}
//             >
//                 <FormComponent onSubmit={this.onSubmit} id='CountryForm' loading={loading} fields={{ ...this.fields }}
//                     form_render={({ values }) => {
//                         return <>
//                             <div className="grid-block">
//                                 <FormField type="text" name="title" label="Title" validate={composeValidators(rules.required, rules.minChar(4))} />
//                             </div>
//                         </>
//                     }}
//                 />

//             </Drawer>
//         )
//     }
// }
// FormComp.propTypes = {
//     onClose: PropTypes.func.isRequired,
//     showform: PropTypes.bool.isRequired,
//     fields: PropTypes.object,
//     // agreement: PropTypes.object,
// }

// export const Wrapper = (props) => {
//     const [get_country, { called, loading, error, data }] = useLazyQuery(RECORD);
//     const [editCountry, edit_details] = useMutation(RECORD_EDIT);
//     const [addCountry, add_details] = useMutation(RECORD_ADD);
//     // const { data, loading } = useSubscription(QUERY_SUBSCRIPTION, { variables: { postID } });

//     useEffect(() => {
//         if (called || !props?.fields?._id) return;
//         get_country({ variables: { id: fields._id } })
//     }, [props])
    

//     return (<FormComp 
//         {...props}

//         loadingEditNode={loading}
//         country={data && data.country}

//         editCountry={editCountry}
//         addCountry={addCountry}
//     />)
// }
// export default Wrapper;
