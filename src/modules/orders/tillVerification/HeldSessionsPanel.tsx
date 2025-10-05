/**
 * Held Sessions Panel Component
 * Shows list of held till verification sessions
 */

import React from 'react';
import { Card, List, Button, Space, Typography, Tag, Empty, Spin, Progress } from 'antd';
import { PlayCircleOutlined, ClockCircleOutlined } from '@ant-design/icons';
import { useHeldTillSessions, useResumeTillSession } from '@_/hooks/useTillVerification';
import { useAppSelector } from '@_/rStore/hooks';
import { getSessionStoreId } from '@_/rStore/slices/tillVerificationSlice';
import { getSession } from '@_/rStore/slices/sessionSlice';
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';

dayjs.extend(relativeTime);

const { Text, Title } = Typography;

interface HeldSessionsPanelProps {
  onResume?: () => void;
  _id_store?: string; // fallback only
}

export const HeldSessionsPanel: React.FC<HeldSessionsPanelProps> = ({ onResume, _id_store }) => {
  const sessionStoreId = useAppSelector(getSessionStoreId);
  const { user } = useAppSelector(getSession);

  // Priority: Redux session store_id > prop > user.store._id
  const storeId = sessionStoreId || _id_store || user.store?._id || '';

  const { sessions, total, loading, error, refetch } = useHeldTillSessions(storeId);
  const { resumeSession, loading: resumeLoading } = useResumeTillSession();

  const handleResume = async (_id_session: string) => {
    try {
      await resumeSession(_id_session);
      if (onResume) onResume();
    } catch (error) {
      console.error('Error resuming session:', error);
    }
  };

  if (error) {
    return (
      <Card size="small">
        <Empty
          description={
            <Space direction="vertical">
              <Text type="danger">Error loading held sessions</Text>
              <Button size="small" onClick={() => refetch()}>
                Retry
              </Button>
            </Space>
          }
        />
      </Card>
    );
  }

  return (
    <Card
      size="small"
      title={
        <Space>
          <Title level={5} style={{ margin: 0 }}>
            Held Sessions
          </Title>
          {total > 0 && <Tag color="orange">{total}</Tag>}
        </Space>
      }
      extra={
        <Button size="small" onClick={() => refetch()} loading={loading}>
          Refresh
        </Button>
      }
    >
      {loading && sessions.length === 0 ? (
        <div style={{ textAlign: 'center', padding: 20 }}>
          <Spin size="small" />
        </div>
      ) : sessions.length === 0 ? (
        <Empty
          image={Empty.PRESENTED_IMAGE_SIMPLE}
          description={
            <Text type="secondary" style={{ fontSize: 12 }}>
              No held sessions
            </Text>
          }
        />
      ) : (
        <List
          dataSource={sessions}
          renderItem={(session) => (
            <List.Item
              key={session._id_session}
              style={{ padding: '12px 0' }}
            >
              <Card
                size="small"
                style={{ width: '100%', backgroundColor: '#fffbe6' }}
                hoverable
              >
                <Space direction="vertical" style={{ width: '100%' }} size="small">
                  {/* Order Serial */}
                  <Text strong style={{ fontSize: 14 }}>
                    Order #{session.order_serial}
                  </Text>

                  {/* Progress */}
                  <div>
                    <Text type="secondary" style={{ fontSize: 12 }}>
                      {session.items_verified} / {session.total_items} items
                    </Text>
                    <Progress
                      percent={session.completion_percentage}
                      size="small"
                      strokeColor="#faad14"
                      showInfo={false}
                    />
                  </div>

                  {/* Held Time */}
                  <Text type="secondary" style={{ fontSize: 11 }}>
                    <ClockCircleOutlined /> Held {dayjs(session.held_at).fromNow()}
                  </Text>

                  {/* Resume Button */}
                  <Button
                    type="primary"
                    size="small"
                    icon={<PlayCircleOutlined />}
                    onClick={() => handleResume(session._id_session)}
                    loading={resumeLoading}
                    block
                  >
                    Resume
                  </Button>
                </Space>
              </Card>
            </List.Item>
          )}
        />
      )}
    </Card>
  );
};

export default HeldSessionsPanel;