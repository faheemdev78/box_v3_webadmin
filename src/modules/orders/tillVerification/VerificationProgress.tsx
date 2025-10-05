/**
 * Verification Progress Component
 * Displays progress bar and statistics for till verification
 */

import React from 'react';
import { Card, Progress, Space, Statistic, Row, Col, Typography } from 'antd';
import { CheckCircleOutlined, ClockCircleOutlined, CloseCircleOutlined, WarningOutlined } from '@ant-design/icons';
import { useAppSelector } from '@_/rStore/hooks';
import { getVerificationStats } from '@_/rStore/slices/tillVerificationSlice';

const { Text } = Typography;

interface VerificationProgressProps {
  compact?: boolean;
}

export const VerificationProgress: React.FC<VerificationProgressProps> = ({ compact = false }) => {
  const stats = useAppSelector(getVerificationStats);

  const getProgressColor = () => {
    if (stats.completion_percentage === 100) return '#52c41a'; // green
    if (stats.completion_percentage >= 50) return '#1890ff'; // blue
    if (stats.completion_percentage >= 25) return '#faad14'; // orange
    return '#ff4d4f'; // red
  };

  if (compact) {
    return (
      <Card size="small">
        <Space direction="vertical" style={{ width: '100%' }}>
          <Text strong>Progress: {stats.verified_count}/{stats.total_items} items</Text>
          <Progress
            percent={stats.completion_percentage}
            strokeColor={getProgressColor()}
            status={stats.completion_percentage === 100 ? 'success' : 'active'}
          />
        </Space>
      </Card>
    );
  }

  return (
    <Card
      title={
        <Space>
          <Text strong style={{ fontSize: 16 }}>Verification Progress</Text>
        </Space>
      }
    >
      <Space direction="vertical" style={{ width: '100%' }} size="large">
        {/* Progress Bar */}
        <div>
          <div style={{ marginBottom: 8 }}>
            <Text strong style={{ fontSize: 18 }}>
              {stats.verified_count} / {stats.total_items} items verified
            </Text>
            <Text type="secondary" style={{ marginLeft: 8 }}>
              ({stats.completion_percentage}%)
            </Text>
          </div>
          <Progress
            percent={stats.completion_percentage}
            strokeColor={getProgressColor()}
            size={12}
            status={stats.completion_percentage === 100 ? 'success' : 'active'}
            format={(percent) => `${percent}%`}
          />
        </div>

        {/* Statistics Grid */}
        <Row gutter={[16, 16]}>
          <Col span={12}>
            <Card size="small" style={{ backgroundColor: '#f6ffed', borderColor: '#b7eb8f' }}>
              <Statistic
                title="Verified"
                value={stats.verified_count}
                prefix={<CheckCircleOutlined style={{ color: '#52c41a' }} />}
                valueStyle={{ color: '#52c41a', fontSize: 24 }}
              />
            </Card>
          </Col>

          <Col span={12}>
            <Card size="small" style={{ backgroundColor: '#e6f7ff', borderColor: '#91d5ff' }}>
              <Statistic
                title="Pending"
                value={stats.pending_count}
                prefix={<ClockCircleOutlined style={{ color: '#1890ff' }} />}
                valueStyle={{ color: '#1890ff', fontSize: 24 }}
              />
            </Card>
          </Col>

          {stats.missing_count > 0 && (
            <Col span={12}>
              <Card size="small" style={{ backgroundColor: '#fff1f0', borderColor: '#ffa39e' }}>
                <Statistic
                  title="Missing"
                  value={stats.missing_count}
                  prefix={<CloseCircleOutlined style={{ color: '#ff4d4f' }} />}
                  valueStyle={{ color: '#ff4d4f', fontSize: 24 }}
                />
              </Card>
            </Col>
          )}

          {stats.mismatch_count > 0 && (
            <Col span={12}>
              <Card size="small" style={{ backgroundColor: '#fffbe6', borderColor: '#ffe58f' }}>
                <Statistic
                  title="Mismatch"
                  value={stats.mismatch_count}
                  prefix={<WarningOutlined style={{ color: '#faad14' }} />}
                  valueStyle={{ color: '#faad14', fontSize: 24 }}
                />
              </Card>
            </Col>
          )}
        </Row>

        {/* Completion Status */}
        {stats.completion_percentage === 100 && (
          <Card size="small" style={{ backgroundColor: '#f6ffed', borderColor: '#52c41a' }}>
            <Space>
              <CheckCircleOutlined style={{ color: '#52c41a', fontSize: 20 }} />
              <Text strong style={{ color: '#52c41a' }}>
                All items verified! You can now complete the verification.
              </Text>
            </Space>
          </Card>
        )}
      </Space>
    </Card>
  );
};

export default VerificationProgress;