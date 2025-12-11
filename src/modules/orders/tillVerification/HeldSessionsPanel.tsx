/**
 * Held Sessions Panel Component (DEPRECATED)
 * This component is no longer used in the new shift-based system
 * Locked orders are now shown directly in the TillOrdersQueue
 *
 * Kept for backwards compatibility - can be removed if not used elsewhere
 */

import React from 'react';
import { Card, Empty, Typography } from 'antd';

const { Text } = Typography;

interface HeldSessionsPanelProps {
  onResume?: () => void;
  _id_store?: string;
}

export const HeldSessionsPanel: React.FC<HeldSessionsPanelProps> = () => {
  return (
    <Card size="small" title="Held Orders">
      <Empty
        image={Empty.PRESENTED_IMAGE_SIMPLE}
        description={
          <Text type="secondary" style={{ fontSize: 12 }}>
            This panel is no longer used. Check the queue for your locked orders.
          </Text>
        }
      />
    </Card>
  );
};

export default HeldSessionsPanel;