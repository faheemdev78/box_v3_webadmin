import React, { useState } from 'react'

export const RenderPlaceholder = ({ data, name, label }) => {
    const [mode, setMode] = useState('preview');

    let style = { minWidth:"50px", minHeight:"30px", backgroundColor:"#EEE" }

    if (mode == 'preview') return (<div style={style}>
        {data.defaultValue}
    </div>)

    return (<div>
        <p>Place holder</p>
    </div>)

    // return (<Row gutter={[0]}>
    //     {data.label && <Col span={24}><Label>{`${data.label} (${forms_fieldDefinations.find(o => o.value == data.type).label})`}</Label></Col>}
    //     <Col flex="auto"><FormField type="text" name={`${name}`} validate={rules.required} /></Col>
    //     <Col><IconButton onClick={() => setMode('preview')} icon="check" color="blue" /></Col>
    // </Row>)
}
