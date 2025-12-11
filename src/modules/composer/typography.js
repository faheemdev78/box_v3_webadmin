import React from 'react'
import { Divider } from 'antd'

export const Heading = ({ children, style }) => (<Divider style={{ margin: "0 0 5px 0", padding: "0", ...style }}>{children}</Divider>)

