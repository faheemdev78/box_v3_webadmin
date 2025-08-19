'use client'
import React, { useState, useEffect } from 'react'
import PropTypes from 'prop-types';
import { Button, DeleteButton, IconButton, PageHeading, Table } from '@_/components'
import { useLazyQuery, useMutation } from '@apollo/client';
import { Col, Row, Space, Alert, Modal, Popconfirm, Card } from 'antd'
import { useSession } from 'next-auth/react'
import { security } from '@_/lib/security';
import { Form as FinalForm, Field as FinalField, useForm } from 'react-final-form';
import { FieldArray } from 'react-final-form-arrays';
import arrayMutators from 'final-form-arrays'
import { FormField, SubmitButton, rules, composeValidators, submitHandler, ExternalSubmitButton, UploadField } from '@_/components/form';
import { checkApolloRequestErrors, string_to_slug } from '@_/lib/utill';
import { PageHeader } from '@_/template';
import { Page } from '@_/template/page';

import GET_LIST from '@_/graphql/user_role/userRoles.graphql'
import DEL_REC from '@_/graphql/user_role/deleteUserRole.graphql'
import EDIT_ROLE from '@_/graphql/user_role/editUserRole.graphql'
import ADD_ROLE from '@_/graphql/user_role/addUserRole.graphql'
import { __error } from '@_/lib/consoleHelper';

const filterSlug = (e, onChange) => onChange(string_to_slug(e.target.value));

function TypeForm({ onSuccess, onCancel, show, initialValues }) {
  const [error, setError] = useState(false);

  const [addUserRole, add_details] = useMutation(ADD_ROLE); // { data, loading, error }
  const [editUserRole, edit_details] = useMutation(EDIT_ROLE); // { data, loading, error }

  const onSubmit = async (values) => {
    let input = {
      title: values.title,
      acc_type: values.acc_type,
    };

    var results;

    if (initialValues && initialValues._id) {
      Object.assign(input, { _id: initialValues._id })
      results = await editUserRole({ variables: { input } })
      .then(r => checkApolloRequestErrors({ results: r, allowEmpty: true, parseReturn: (rr) => rr?.data?.editUserRole }))
        .catch(error => {
          console.log(__error("Error: "), error)
          return { error: { message: "Query Error" } }
        });
    } else {
      results = await addUserRole({ variables: { input } })
        .then(r => checkApolloRequestErrors({ results: r, allowEmpty: true, parseReturn: (rr) => rr?.data?.addUserRole }))
        .catch(error => {
          console.log(__error("Error: "), error)
          return { error: { message: "Query Error" } }
        });
    }

    if (!results || results.error) {
      setError((results && results.error.message) || "Invalid response");
      return false;
    }

    onSuccess(results);
    return false;
  }

  return (<Modal open={show} destroyOnHidden footer={false} onCancel={onCancel}>

    <FinalForm onSubmit={onSubmit} initialValues={initialValues}
      mutators={{
        ...arrayMutators,
        // onLocationChanged: (newValueArray, state, tools) => {
        //     let val = newValueArray[0]
        //     tools.changeValue(state, 'location', () => val)
        // },

      }}
      render={(formargs) => {
        const { handleSubmit, submitting, form, values, invalid, errors, submitFailed, dirty } = formargs;

        return (<>
          {error && <Alert message={error} showIcon type='error' />}
          <form id="UserTypeForm" {...submitHandler(formargs)}>

            <Space style={{ width: "100%" }} direction='vertical'>
              <FormField type="text" name="title" label="Title" validate={rules.required} />
              <FormField onChange={filterSlug} type="text" name="acc_type" label="Type Key (no space)" validate={[rules.required, rules.nospace, rules.minChar(4)]} />
              <Row>
                <Col flex="auto"><Button onClick={onCancel} type="default">Cancel</Button></Col>
                <Col><SubmitButton disabled={invalid || !dirty} color="orange" loading={submitting}>Save</SubmitButton></Col>
              </Row>
            </Space>
            
          </form>
        </>)

      }}
    />

  </Modal>)

}
TypeForm.propTypes = {
  onSuccess: PropTypes.func.isRequired,
  onCancel: PropTypes.func.isRequired,
  show: PropTypes.bool.isRequired,
  initialValues: PropTypes.object,
}


/* eslint-disable react-hooks/exhaustive-deps */
export default function UserTypes() {
  const [showForm, set_showForm] = useState(false);
  const [busy, setBusy] = useState(false);
  const [dataArray, set_dataArray] = useState(null);
  const [error, setError] = useState(null);

  const [usersQuery, { called, loading, data }] = useLazyQuery(
    GET_LIST,
    {
      variables: {
        filter: JSON.stringify({}), others: JSON.stringify({})
      },
      fetchPolicy: 'network-only'
    }
  );

  const [deleteUserRole, del_details] = useMutation(DEL_REC); // { data, loading, error }
  

  useEffect(() => {
    if (called || loading) return;
    fetchData();
  }, [])

  const fetchData = async () => {
    setBusy(true);

    let resutls = await usersQuery()
      .then(r => checkApolloRequestErrors({ results: r, allowEmpty: true, parseReturn: (rr) => rr?.data?.userRoles }))

    if (resutls.error) setError(resutls.error.message)
    else set_dataArray(resutls)

    setBusy(false);
  }

  const onDelete = async (rec) => {
    await deleteUserRole({ variables: { _id: rec._id } });
    fetchData();
  }

  const onSuccess = async() => {
    set_showForm(false);
    fetchData()
  }

  const onEditClick = () => {}

  const columns = [
      { title: 'Store Name', dataIndex: 'title', key: 'title' },
      { title: 'Key', dataIndex: 'acc_type', key: 'acc_type' },
      {
          title: 'Actions',
          dataIndex: 'actions',
          width: 120,
          key: 'actions',
          align: 'right',
          render: (text, rec) => {
              return (<Space>
                <IconButton onClick={() => set_showForm(rec)} icon="pen" />
                <Popconfirm title="Sure to delete?" onConfirm={() => onDelete(rec)}>
                  <IconButton icon="trash-alt" />
                </Popconfirm>
              </Space>)
          }
      },
  ];

  // if (!security.verifyRole("200.1", session_user)) return <Alert message="Access Denied!" showIcon type='error' />

  return (<>
    <PageHeader title="Users Types">
      <Button onClick={() => set_showForm(true)} color="orange">Add new Type</Button>
    </PageHeader>

    <Page>
      <Table columns={columns} loading={busy}
        dataSource={dataArray}
        pagination={false}
        bordered />
    </Page>

      
    <TypeForm onSuccess={onSuccess} onCancel={() => set_showForm(false)} show={showForm !== false} initialValues={showForm} />
  </>)
}
