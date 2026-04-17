import styles from './DevBlock.module.scss'
import { jsonStringify } from '@/lib/utill';
import _ from 'lodash'
import { ReactElement } from 'react';

/**
 * DevBlock
 **** this will print anything only in dev environment
 */
export const DevBlock = ({ force=false, obj, title, ...props }:{
  force?: boolean;
  obj: any;
  title?: string | null;
  children?: ReactElement
}) => {
  if (process.env.NODE_ENV !== 'development' && !force) return null;
  // const {obj, title} = props;

  return (<div style={{ overflowX:"auto" }}>
    <pre className={styles.dev_block}>
      {title && <h3>{title}</h3>}
      {_.isString(obj) && obj}
      {_.isBoolean(obj) && (obj ? 'true' : 'false')}
      {obj && jsonStringify(obj, 0, 2)}
    </pre>
    {props.children && props.children}
  </div>);
}

// DevBlock.propTypes = {
//   obj: PropTypes.oneOfType([
//     PropTypes.object,
//     PropTypes.array,
//   ]),
//   title: PropTypes.string,
// }

export default DevBlock;
