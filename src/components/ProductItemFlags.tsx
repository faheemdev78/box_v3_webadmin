'use client'

import { Space, Tag, Tooltip } from 'antd';
import { svgIcons } from '@/configs';
import { Icon } from '@/components/icon';

export type ProductItemFlagsSource = {
  temp_sensitivity?: string | null;
  unfit_for_dispatch?: boolean | null;
};

type ProductItemFlagsProps = {
  item?: ProductItemFlagsSource | null;
  /** icons = till-style icons with tooltips (default); tags = legacy text labels */
  variant?: 'icons' | 'tags';
  size?: number;
  className?: string;
  style?: React.CSSProperties;
};

const FlagIcon = ({ src, alt, size }: { src: string; alt: string; size: number }) => (
  <img
    src={src}
    alt={alt}
    width={size}
    height={size}
    style={{
      display: 'block',
      width: `${size}px`,
      height: `${size}px`,
      objectFit: 'contain',
      filter: 'grayscale(1) brightness(0)',
    }}
  />
);

export function hasProductItemFlags(item?: ProductItemFlagsSource | null): boolean {
  if (!item) return false;
  return Boolean(
    item.unfit_for_dispatch ||
    item.temp_sensitivity === 'fridge' ||
    item.temp_sensitivity === 'freezer'
  );
}

export function ProductItemFlags({
  item,
  variant = 'icons',
  size = 20,
  className,
  style,
}: ProductItemFlagsProps) {
  if (!hasProductItemFlags(item)) return null;

  const isFreezer = item?.temp_sensitivity === 'freezer';
  const isFridge = item?.temp_sensitivity === 'fridge';
  const isUnfit = Boolean(item?.unfit_for_dispatch);

  if (variant === 'tags') {
    return (
      <Space size={4} wrap className={className} style={style}>
        {isFreezer && (
          <Tag color="blue" style={{ fontSize: 11, marginInlineEnd: 0 }}>Freezer</Tag>
        )}
        {isFridge && (
          <Tag color="cyan" style={{ fontSize: 11, marginInlineEnd: 0 }}>Fridge</Tag>
        )}
        {isUnfit && (
          <Tag color="orange" style={{ fontSize: 11, marginInlineEnd: 0 }}>Not fit for box</Tag>
        )}
      </Space>
    );
  }

  return (
    <Space size={4} className={className} style={style}>
      {isFreezer && (
        <Tooltip title="Freezer">
          <span className="relative">
            <FlagIcon src={svgIcons.snow} alt="Freezer" size={size} />
          </span>
        </Tooltip>
      )}
      {isFridge && (
        <Tooltip title="Fridge">
          <span className="relative">
            <FlagIcon src={svgIcons.chilled} alt="Fridge" size={size} />
          </span>
        </Tooltip>
      )}
      {isUnfit && (
        <Tooltip title="Not fit for box">
          <span className="relative">
            <Icon icon="box" color="#000000" fontSize={size - 2} />
            <div className="absolute bg-black-500 h-1 w-full left-0 right-0 top-1.5 rounded-md border-1 border-white rotate-45" />
          </span>
        </Tooltip>
      )}
    </Space>
  );
}

export default ProductItemFlags;
