// import React, { Component, useEffect } from 'react'
// import { useLazyQuery, useMutation, useSubscription } from '@apollo/client';
// import { Popconfirm, Alert, message, Row, Col } from 'antd';
// import { Loader, Icon, Button, IconButton, Table, Avatar } from '@/components';
// import { __error } from '@_/lib/consoleHelper';

// // import SubscriptionHandler from 'Common/scripts/SubscriptionHandler';

// import LIST_DATA from '@_/graphqls/tags/tags.graphql';
// import RECORD_DELETE from '@_/graphqls/tags/delete.graphql';
// // const QUERY_SUBSCRIPTION = loader('graphqls/tags/subscription.graphql');


// export class ListComp extends Component {
//     handleDelete(id) {
//         this.props.deleteTag({ variables: { id } }).then(r => {
//             if (r && r.data && r.data.deleteTag && r.data.deleteTag.error) {
//                 message.error(r.data.deleteTag.error.message);
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
//         const { loading, tags, queryErrors } = this.props;

//         return (
//             <>
//                 <Table loading={loading}
//                     columns={this.columns}
//                     dataSource={tags ? tags : null}
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
//     const [getTags, { called, loading, error, data }] = useLazyQuery(LIST_DATA);
//     const [deleteTag, del_details] = useMutation(RECORD_DELETE);
//     // const { data, loading } = useSubscription(QUERY_SUBSCRIPTION, { variables: { postID } });
    
//     useEffect(() => {
//         if (called) return;
//         getTags({ 
//             variables: { filter: "" }
//         })
//     }, [])

//     return (<ListComp 
//         {...props}
//         loading={loading}
//         tags={data && data.tags}

//         deleteTag={deleteTag}
//     />)
// }

// export default WithApollo;
