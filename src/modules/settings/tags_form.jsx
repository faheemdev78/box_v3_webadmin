// import React, { Component, useEffect } from 'react'
// import PropTypes from 'prop-types';
// import { Drawer, Button, Heading, Icon, Loader } from '@/components'
// import { rules, composeValidators, FormField, FormFieldGroup, FormComponent, UploadField } from '@/components/form'
// // import { FormField, FormFieldGroup, SubmitButton, rules, submitHandler } from '@_/components/form';
// import { message, Row, Col } from 'antd';
// import { useLazyQuery, useMutation, useSubscription } from '@apollo/client';
// import { __error } from '@_/lib/consoleHelper';

// // const RECORD = loader('graphqls/tags/tag.graphql');
// import RECORD_EDIT from '@_/graphql/tags/edit.graphql';
// import RECORD_ADD from '@_/graphqls/tags/add.graphql';


// export class FormComp extends Component {
//     // fields = { status: "disabled" };

//     constructor(props) {
//         super(props);
//         this.state = { loading: false, fields: props.fields ? props.fields : { status: "disabled"} }
//         this.onSubmit = this.onSubmit.bind(this);
//     }

//     onSubmit = _values => {
//         // console.log("onSubmit()", _values); return;

//         const { tag, onClose, editTag, addTag } = this.props;
//         const { fields } = this.state;
//         // let fields = fields ? { ...fields } : tag ? { ...tag } : {}
//         let values = { ..._values }

//         const _id = fields ? fields._id : false;

//         this.setState({ loading: true });

//         let filteredValues = {
//             title: values.title
//         };

//         if (_id) {
//             editTag({ variables: { input: { ...filteredValues, _id: _id } } }).then((e) => {
//                 this.setState({ loading: false })
//                 if (e.data.editTag.error) {
//                     let err = e.data.editTag.error;
//                     message.error(err.message);
//                     return false;
//                 }
//                 message.success("Success");
//                 onClose(e.data.editTag);
//             }).catch(error => {
//                 this.setState({ loading: false })
//                 console.log(error);
//                 message.error("Query Error");
//             });
//         } else {
//             addTag({ variables: { input: filteredValues } }).then((e) => {
//                 this.setState({ loading: false });
//                 if (e.data.addTag.error) {
//                     let err = e.data.addTag.error;
//                     message.error(err.message);
//                     return false;
//                 }
//                 message.success("Success");
//                 console.log("e.data.addTag: ", e.data.addTag);

//                 // _fields = Object.assign(_fields, { ...e.data.addTag })
//                 // _setFields({ ...e.data.addTag });
//                 onClose(e.data.addTag);
//             }).catch(error => {
//                 this.setState({ loading: false });
//                 console.log(error);
//                 message.error("Query Error");
//             });
//         }

//     }


//     render() {
//         console.log("this.props: ", this.props);
        
//         const { onClose, tag, showform } = this.props;
//         const { fields, loading } = this.state;

//         console.log("fields: ", fields);
        

//         // this.fields = __fields ? { ...__fields } : tag ? { ...tag } : this.fields;

//         return (
//             <Drawer width={"300px"} destroyOnClose maskClosable={false} placement="right"
//                 // loading={loadingEditNode}
//                 onClose={onClose}
//                 visible={showform}
//                 bodyStyle={{ backgroundColor: "#f0f2f5" }}
//                 footer={<>
//                     <span></span>
//                     <Button loading={loading} type="primary" onClick={() => {
//                         document.getElementById('TagForm').dispatchEvent(new Event('submit', { cancelable: true }))
//                     }}>Save</Button>
//                 </>}
//                 title={`${fields && fields._id ? 'Edit' : 'Add'} Tag`}
//             >
//                 <FormComponent onSubmit={this.onSubmit} id='TagForm' loading={loading} fields={{ ...fields }}
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

// const WithApollo = (props) => {
//     // const [editTag, { called, loading, error, data }] = useLazyQuery(LIST_DATA);
//     const [editTag, edit_details] = useMutation(RECORD_EDIT);
//     const [addTag, add_details] = useMutation(RECORD_ADD);
//     // const { data, loading } = useSubscription(QUERY_SUBSCRIPTION, { variables: { postID } });

//     return (<FormComp 
//         {...props}
//         editTag={editTag}
//         addTag={addTag}
//     />)
// }
// export default WithApollo;
