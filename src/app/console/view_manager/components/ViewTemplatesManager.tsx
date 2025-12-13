import React from 'react';
import { Card, Empty, Alert } from 'antd';

export const ViewTemplatesManager: React.FC = () => {
  return (
    <div>
      <Alert
        message="View Templates"
        description="View templates allow you to create pre-defined views that will be automatically created for new entity configurations. This feature will be implemented in a future update."
        type="info"
        showIcon
        style={{ marginBottom: 16 }}
      />

      <Card>
        <Empty
          description="No view templates yet"
          image={Empty.PRESENTED_IMAGE_SIMPLE}
        />
      </Card>
    </div>
  );
};
