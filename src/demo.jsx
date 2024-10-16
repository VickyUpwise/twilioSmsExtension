import React, { useState, useEffect } from 'react';

const Demo = () => {
    const [data, setData] = useState({});

    useEffect(() => {
        ZOHO.embeddedApp.on("PageLoad", function(data){
            console.log('data', data)
            setData(data);
        });
        ZOHO.embeddedApp.init().then(() => {});
    },[data])

  return (
    <div style={{ textAlign: 'center', marginTop: '50px' }}>
      <p>Data From ZOHO</p>
      <div>
        <span>Entity</span>:<span>{data.Entity}</span>
      </div>
      <div>
        <span>Entity Id</span>:<span>{data.EntityId}</span>
      </div>
    </div>
  );
}

export default Demo;
