// import React from 'react';
import PropTypes from 'prop-types';
import { Pagination } from 'antd';
// import { useHistory, useParams, useLocation } from "react-router-dom";
import { Loader } from './loader';
// import { Pagination, DevBlock } from 'Common/components'
import { DevBlock } from './devBlock'


/**
 * DataGrid
 */
export const DataGrid = ({ debug, loading, GridItem, dataSource, total, pageSize, current, onChange }) => {

  if (!dataSource || dataSource.length < 1) return <Loader loading={loading}>No records found.</Loader>
  
  return(<Loader loading={loading}>
    <div className='dataGrid'>
      {dataSource.map((item, i) => {
        return <GridItem {...item} key={i} />
      })}
    </div>

    <div style={{ textAlign: "center", padding: "20px" }}>
      <Pagination
        total={total}
        current={current}
        pageSize={pageSize}
        onChange={onChange}
        // updateHistory={this.props.updateHistory}
        // pageSizeOptions={['10', '15', '20', '25', '30']}
        // defaultPageSize={10}
        // showSizeChanger={true}
        // onShowSizeChange={onShowSizeChange}
      />
    </div>

    {debug && <DevBlock title="dataSource" obj={dataSource} />}


  </Loader>)
}


DataGrid.propTypes = {
  loading: PropTypes.bool,
  updateBrowserWith: PropTypes.string, // {ROOT+"/page/${pageNum}"}
  // queryName: PropTypes.string.isRequired,
  // onChange: PropTypes.func.isRequired,
  dataSource: PropTypes.array,
  gridItem: PropTypes.oneOfType([
              PropTypes.func,
              PropTypes.object,
            ]).isRequired,
  // prop: PropTypes.type.isRequired
}


export default DataGrid;
