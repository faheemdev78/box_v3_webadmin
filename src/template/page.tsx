import React from "react";

interface SessionStoreState {
    children: React.ReactNode;
    className?: string;
    style?: object;
}

export function Page({ children, className, style }: SessionStoreState) {
    return <div className={` ${className || ""}`} style={style}>{children}</div>
}
