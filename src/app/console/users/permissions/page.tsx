'use client'
import React, { useEffect, useState } from 'react'
import { useLazyQuery, useMutation } from '@apollo/client';
import { Alert, Select, Checkbox, Row, Col, message, Divider, Space } from 'antd';
import { DevBlock, Table, Button, Loader, PageHeading } from '@_/components';
import { UserRightsArray } from '@_/configs';
import { security } from '@_/lib/security';
import Card from 'antd/es/card/Card';
import { PageHeader } from '@_/template';
import { Page } from '@_/template/page';

import LIST_ROLES from '@_/graphql/user_role/userRoles.graphql'
import EDIT_USER_ROLE from '@_/graphql/user_role/editUserRole.graphql'
import { checkApolloRequestErrors } from '@_/lib/utill_apollo';

/* eslint-disable react-hooks/exhaustive-deps */
export default function UserPermissions(props) {
  const [userRoles, set_userRoles] = useState(null)
  const [selectedType, set_selectedType] = useState(null)
  const [error, set_error] = useState(false)
  const [loading, set_loading] = useState(false)
  const [selected_rights, set_selected_rights] = useState([])
  
  const [get_userRoles, roles_details] = useLazyQuery(
    LIST_ROLES,
    {
      variables: {
        filter: JSON.stringify({}), others: JSON.stringify({})
      },
      fetchPolicy: 'network-only'
    }
  );
  
  const [editUserRole, edit_details] = useMutation(EDIT_USER_ROLE); // { data, loading, error }

  useEffect(() => {
    if (roles_details.called || roles_details.loading) return;
    fetchRoles();
  }, [props])

  const fetchRoles = async (selected_account_type) => {
    set_loading(true)
    let resutls = await get_userRoles()
      .then(r => checkApolloRequestErrors({ results: r, allowEmpty: true, parseReturn: (rr) => rr?.data?.userRoles }))
    set_loading(false)

    if (!resutls || resutls.error){
      set_error((resutls && resutls.error.message) || "Invalid response")
      return;
    }

    let _selectedType = selectedType || resutls[0]._id
    if (!selectedType) set_selectedType(_selectedType)

    set_selected_rights(resutls.find(o => o._id == _selectedType)?.permissions?.split(",") || [])
    set_userRoles(resutls);

    return false;
  }

  const onUserTypeSelect = (id) => {
    let thisRole = userRoles.find(o=>o._id==id)
    let permissions = thisRole?.permissions?.split(",") || [];
    set_selected_rights(permissions)
    set_selectedType(id)
  }

  const onCheckboxChange = ({ rec, checked }) => {
    let selection = selected_rights.slice();

    if (checked) selection.push(rec.key)
    else selection = selection.filter(o=>o != rec.key)

    set_selected_rights(selection)
  }

  const expandedRowRender = (row, index, indent, expanded) => {
    if (!expanded) return null;

    let _rules = UserRightsArray[index].rules;
    let _id = UserRightsArray[index]._id;

    const inner_columns = [
      {
        title: '', width: '30px',
        render: (txt, rec, i) => {
          if (rec.heading) return <Divider orientation="left">{rec.heading}</Divider>
          return <Checkbox checked={selected_rights.indexOf(rec.key) > -1} onChange={(e) => onCheckboxChange({ checked: e.target.checked, rec })}>{rec.title} <small>({rec.key})</small></Checkbox>
        }, 
      },
    ];

    return <Table size="small" showHeader={false} pagination={false}
      columns={inner_columns}
      dataSource={_rules}
      rowKey={(data) => _id++}
    />;
  };

  const onSavePermissions = async() => {
    set_loading(true);
    set_error(false);

    // re-verify all permissions key, to remove any orphen records
    let _selected_rights = []; //selected_rights.slice();
    UserRightsArray.forEach(cat => {
      cat.rules.forEach(rule => {
        if (selected_rights.includes(rule.key)) _selected_rights.push(rule.key);
      });
    });

    let resutls = await editUserRole({
      variables:{
        input:{
          _id: selectedType,
          permissions: _selected_rights.join(),
        }
      }
    })
      .then(r => checkApolloRequestErrors({ results: r, allowEmpty: true, parseReturn: (rr) => rr?.data?.editUserRole }))

    if (!resutls || resutls.error){
      set_loading(false);
      set_error((resutls && resutls.error.message) || "Unable to save permissions")
      return false;
    }

    message.success("Saved")
    await fetchRoles();
    set_loading(false);
  }

  // if (!session_user) return <Loader loading={true} />
  // if (!security.verifyRole("100.11", session_user)) return <Alert message="Access Denied" showIcon type='error' />


  return (<>

    <PageHeader title="User Permissions"></PageHeader>


    {error && <Alert message={error} type="error" showIcon />}

    <Page>
      <Table 
        loading={loading}
        columns={[{ 
          title: 'Role Category', 
          dataIndex: 'title', 
          render: (txt, rec) => (<>{txt} <small>({rec._id})</small></>)
        }]}
        dataSource={UserRightsArray}
        title={() => (<Select onChange={onUserTypeSelect} value={selectedType} style={{ width: '200px' }}>
            {userRoles && userRoles.map((item, i) => {
              return <Select.Option key={i} value={item._id}>{item.title}</Select.Option>
            })}
          </Select>)
        }
        footer={() => <Button onClick={onSavePermissions} color="orange">Save</Button>}
        pagination={false}
        expandedRowRender={expandedRowRender}
      />
    </Page>

    <Space align='top'>
      <DevBlock obj={UserRightsArray} title="UserRightsArray" />
      <DevBlock obj={selected_rights} title="selected_rights" />
    </Space>
    
  </>)

}
