// import React, { Component, useEffect } from 'react'
// import { useLazyQuery, useMutation, useSubscription } from '@apollo/client';
// import { loader } from 'graphql.macro';
// import { Popconfirm, Alert, message, Row, Col } from 'antd';
// import { Loader, Icon, Button, IconButton, Table, Avatar } from 'Common/components';
// import { __error } from 'Common/scripts/consoleHelper'

// // import SubscriptionHandler from 'Common/scripts/SubscriptionHandler';

// const LIST_DATA = loader('graphqls/countries/countries.graphql');
// const RECORD_DELETE = loader('graphqls/countries/delete.graphql');
// // const QUERY_SUBSCRIPTION = loader('graphqls/countries/subscription.graphql');


// export class ListComp extends Component {
//     handleDelete(id) {
//         this.props.deleteCountry({ variables: { id } }).then(r => {
//             if (r && r.data && r.data.deleteCountry && r.data.deleteCountry.error) {
//                 message.error(r.data.deleteCountry.error.message);
//                 return false;
//             }
//             message.success("Record deleted")
//         })
//             .catch(error => {
//                 console.log(__error("ERROR"), error);
//                 message.error("Unable to delete record")
//             })
//     }

//     renderActions = (text, record) => {
//         return (
//             <span className="action_buttons">
//                 <IconButton onClick={() => this.props.onEditRecord(record)} icon="pen" />
//                 <Popconfirm title="Sure to delete?" onConfirm={() => this.handleDelete(record._id)}>
//                     <IconButton icon="trash-alt" />
//                     {/* <a href="#">Hello</a> */}
//                 </Popconfirm>
//             </span>
//         )
//     }

//     columns = [
//         { title: 'Name', dataIndex: 'title' },
//         {
//             title: 'Actions',
//             dataIndex: '',
//             render: this.renderActions,
//             className: 'actions-column',
//             align: 'right',
//             width: '100px'
//         },
//     ];

//     render() {
//         const { loading, countries, queryErrors } = this.props;

//         return (
//             <>
//                 <Table loading={loading}
//                     columns={this.columns}
//                     dataSource={countries ? countries : null}
//                     pagination={false}
//                 />
//             </>
//         )
//     }
// }
// ListComp.propTypes = {
//     // prop: PropTypes.type.isRequired
//     // onEditRecord: PropTypes.func.isRequired
// }

// const WithApollo = (props) => {
//     const [get_countries, { called, loading, error, data }] = useLazyQuery(LIST_DATA);
//     const [deleteCountry, del_details] = useMutation(RECORD_DELETE);
//     // const { data, loading } = useSubscription(QUERY_SUBSCRIPTION, { variables: { postID } });
    
//     useEffect(() => {
//         if (called) return;
//         get_countries({ 
//             variables: { filter: "" }
//         })
//     }, [])

//     return (<ListComp 
//         {...props}
//         loading={loading}
//         countries={data && data.countries}

//         deleteCountry={deleteCountry}
//     />)
// }

// export default WithApollo;
