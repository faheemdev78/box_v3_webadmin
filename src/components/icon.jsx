'use client'

import React from 'react'
import { library } from '@fortawesome/fontawesome-svg-core'
// import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
// import { faThumbsUp } from '@fortawesome/free-solid-svg-icons'
import {
  faAngleDown, faArrowRight, faBarcode, faBell, faClock, faCog, faEllipsisV, faEye, faImage, faMessage, faMultiply,
  faPen, faPlus, faSearch, faSquare, faSquareCheck, faStopwatch, faThLarge, faThList, faTrashAlt
} from '@fortawesome/free-solid-svg-icons'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { __error } from '@_/lib/consoleHelper';

library.add(
  faEllipsisV, faThList, faThLarge, faSearch, faBarcode, faPen, faTrashAlt, faPlus, faImage, faArrowRight, 
  faStopwatch, faClock, faCog, faEye, faSquareCheck, faSquare, faBell, faMultiply, faMessage, faAngleDown
)
 


function verifyIconAvailability(icon_name) {
  let icons = library.definitions.fas;
  return icons[icon_name] ? true : false;
}


export const Icon = React.forwardRef((_props, ref) => {
  let props = { ..._props };

  let className = `awsom-icon ${props.anticon && "anticon"} ${props.className || ""}`;// props.skipstyle ? "" : "anticon" + props.className || "";
  delete props.skipstyle;
  delete props.className;
  delete props.anticon;

  if (!verifyIconAvailability(props.icon)) {
    console.log(__error(`Icon not found: `), props.icon)
    return <span ref={ref} {...props} className={`${className}`}>{props.icon}</span>;
  }
  return <span ref={ref} className={`${className}`}><FontAwesomeIcon {...props} /></span>
});

