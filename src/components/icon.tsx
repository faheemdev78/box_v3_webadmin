'use client'

import React from 'react'
import { library } from '@fortawesome/fontawesome-svg-core'
// import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
// import { faThumbsUp } from '@fortawesome/free-solid-svg-icons'
import {
  faArrowLeft, faArrowRight, faAngleDown, faBarcode, faBell, faClock, faCog, faEllipsisV, faEye, faImage, faMessage, faMultiply,
  faPen, faPlus, faMinus, faSearch, faSquare, faSquareCheck, faStopwatch, faThLarge, faThList, faTrashAlt, faCopy,
  faCheckCircle,
  faRefresh,
  faAddressCard,
  faLocation,
  faMapLocation,
  faInfoCircle,
  faBasketShopping,
  faLock,
  faPlay, faShoppingBasket,
  faTrash} from '@fortawesome/free-solid-svg-icons'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import type { FontAwesomeIconProps } from '@fortawesome/react-fontawesome';
import type { IconProp } from '@fortawesome/fontawesome-svg-core';
import { __error } from '@/lib/consoleHelper';

library.add(
  faEllipsisV, faThList, faThLarge, faSearch, faBarcode, faPlus, faMinus,  faImage, faArrowRight, 
  faStopwatch, faClock, faCog, faEye, faSquareCheck, faSquare, faBell, faMultiply, faMessage, faAngleDown,
  faPen, faTrashAlt, faTrash, faCopy, faRefresh, faAddressCard, faLocation, faInfoCircle, faMapLocation, faBasketShopping,
  faLock, faPlay, faArrowLeft, faCheckCircle, faShoppingBasket
)
 


function verifyIconAvailability(icon_name: string) {
  const icons = (library as any)?.definitions?.fas || {};
  return icons[icon_name] ? true : false;
}


interface IconProps extends Omit<FontAwesomeIconProps, 'icon'> {
  icon: string;
  anticon?: boolean;
  skipstyle?: boolean;
  className?: string;
}
export const Icon = React.forwardRef<HTMLSpanElement, IconProps>((_props, ref) => {
  const { icon, anticon, skipstyle, className, ...rest } = _props;
  const mergedClassName = `awsom-icon ${anticon ? "anticon" : ""} ${className || ""}`;

  if (!verifyIconAvailability(icon)) {
    console.log(__error(`Icon not found: `), icon)
    return <span ref={ref} className={mergedClassName}>{icon}</span>;
  }

  return (
    <span ref={ref} className={mergedClassName}>
      <FontAwesomeIcon icon={icon as IconProp} {...rest} />
    </span>
  );
});
Icon.displayName = 'Icon';
