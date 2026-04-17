import React from "react";

interface PageTemplateProps {
    children?: React.ReactNode;
    className?: string;
    style?: object;
}

export function Page({ children, className, style }: PageTemplateProps) {
    const pageStyle = {
        padding: "10px",
        ...style
    }

    return <div className={` ${className || ""}`} style={pageStyle}>{children}</div>
}
