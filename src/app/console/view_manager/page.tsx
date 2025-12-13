'use client';

import React, { useEffect, useState } from 'react';
import { Card, Tabs, Button, message } from 'antd';
import { PlusOutlined } from '@ant-design/icons';
import { Page } from '@_/template';
import { useQuery } from '@apollo/client/react';
import { GET_ENTITY_CONFIGS } from './graphql/queries';
import { EntityConfigList } from './components/EntityConfigList';
import { EntityConfigFormFinal } from './components/EntityConfigFormFinal';
import { ViewTemplatesManager } from './components/ViewTemplatesManager';

function ViewManagerPage() {
  const [activeTab, setActiveTab] = useState('configs');
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [editingConfig, setEditingConfig] = useState<any>(null);

  const { data, loading, refetch, error } = useQuery<any>(GET_ENTITY_CONFIGS, {
    // onError: (error) => {
    //   message.error(`Failed to load entity configs: ${error.message}`);
    // }
  });

  useEffect(() => {
    if(!error) return;
    message.error(`Failed to load entity configs: ${error.message}`);
  }, [error])
  

  const entityConfigs = data?.entityConfigs || [];

  const handleCreate = () => {
    setEditingConfig(null);
    setShowCreateForm(true);
  };

  const handleEdit = (config: any) => {
    setEditingConfig(config);
    setShowCreateForm(true);
  };

  const handleCloseForm = () => {
    setShowCreateForm(false);
    setEditingConfig(null);
  };

  const handleSuccess = () => {
    handleCloseForm();
    refetch();
    message.success(editingConfig ? 'Entity config updated successfully' : 'Entity config created successfully');
  };

  if (showCreateForm) {
    return (<Page>
        <EntityConfigFormFinal
          config={editingConfig}
          onClose={handleCloseForm}
          onSuccess={handleSuccess}
        />
    </Page>);
  }

  return (
    <Page>
      <Card>
        <div style={{ marginBottom: 16, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h2 style={{ margin: 0 }}>View Filter Manager</h2>
          {activeTab === 'configs' && (
            <Button type="primary" icon={<PlusOutlined />} onClick={handleCreate}>Create Entity Config</Button>
          )}
        </div>

        <Tabs
          activeKey={activeTab}
          onChange={setActiveTab}
          items={[
            {
              key: 'configs',
              label: 'Entity Configurations',
              children: (<EntityConfigList
                configs={entityConfigs}
                loading={loading}
                onEdit={handleEdit}
                onRefetch={refetch}
              />)
            },
            {
              key: 'templates',
              label: 'View Templates',
              children: (<ViewTemplatesManager />)
            }
          ]}
        />
      </Card>
    </Page>
  );
}

export default ViewManagerPage
